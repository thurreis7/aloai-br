import { Injectable } from '@nestjs/common'
import { SupabaseService } from './supabase.service'

const VALID_LABELS = new Set(['Ruim', 'Regular', 'Bom', 'Excelente'])
const VALID_CADENCE = new Set(['Lento', 'Adequado', 'Rapido'])

function labelForScore(score: number) {
  if (score <= 4) return 'Ruim'
  if (score <= 6) return 'Regular'
  if (score <= 8) return 'Bom'
  return 'Excelente'
}

function stripMarkdownFences(value: string) {
  return String(value || '')
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '')
    .trim()
}

function textFromAnthropicPayload(payload: any) {
  const item = Array.isArray(payload?.content) ? payload.content.find((part: any) => part?.type === 'text') : null
  return String(item?.text || payload?.completion || '')
}

@Injectable()
export class EvaluationService {
  constructor(private readonly supabase: SupabaseService) {}

  async evaluateConversation(conversationId: string, workspaceId: string) {
    try {
      const workspace = await this.loadWorkspace(workspaceId)
      if (workspace?.ai_enabled !== true) return { skipped: true, reason: 'ai_disabled' }

      const { conversation, messages, config } = await this.loadEvaluationContext(conversationId, workspaceId)
      const aiConfig = config as any
      if (!conversation?.id || messages.length === 0) return { skipped: true, reason: 'empty_context' }

      const prompt = this.buildPrompt({
        systemPrompt: aiConfig?.workspace_context?.company_context || '',
        scriptTemplate: aiConfig?.script_template || '',
        contact: conversation.contacts,
        messages,
      })

      const result = this.validateEvaluation(await this.callAnthropic(prompt))
      if (!result) return { skipped: true, reason: 'invalid_result' }

      const evaluatedAt = new Date().toISOString()
      const payload = { ...result, evaluated_at: result.evaluated_at || evaluatedAt }
      const { error } = await this.supabase.admin
        .from('conversations')
        .update({ evaluation: payload, evaluated_at: evaluatedAt })
        .eq('workspace_id', workspaceId)
        .eq('id', conversationId)

      if (error) throw error
      return { updated: true }
    } catch (error) {
      console.warn({
        topic: 'conversation_evaluation_failed',
        workspace_id: workspaceId,
        conversation_id: conversationId,
        error: error instanceof Error ? error.message : String(error),
      })
      return { skipped: true, reason: 'error' }
    }
  }

  private async loadWorkspace(workspaceId: string) {
    const { data, error } = await this.supabase.admin
      .from('workspaces')
      .select('id, ai_enabled')
      .eq('id', workspaceId)
      .maybeSingle()

    if (error) throw error
    return data || null
  }

  private async loadEvaluationContext(conversationId: string, workspaceId: string) {
    const [{ data: conversation, error: conversationError }, { data: messages, error: messagesError }, { data: config, error: configError }] = await Promise.all([
      this.supabase.admin
        .from('conversations')
        .select('id, contacts ( id, name, company, tags )')
        .eq('workspace_id', workspaceId)
        .eq('id', conversationId)
        .maybeSingle(),
      this.supabase.admin
        .from('messages')
        .select('id, sender_type, content, created_at, is_internal_note')
        .eq('workspace_id', workspaceId)
        .eq('conversation_id', conversationId)
        .in('sender_type', ['contact', 'agent'])
        .eq('is_internal_note', false)
        .order('created_at', { ascending: true }),
      this.supabase.admin
        .from('ai_workspace_configs')
        .select('workspace_context, script_template')
        .eq('workspace_id', workspaceId)
        .maybeSingle(),
    ])

    if (conversationError) throw conversationError
    if (messagesError) throw messagesError
    if (configError) throw configError
    return { conversation, messages: messages || [], config: config || {} }
  }

  private buildPrompt(input: { systemPrompt: string; scriptTemplate: string; contact: any; messages: any[] }) {
    const contact = Array.isArray(input.contact) ? input.contact[0] : input.contact
    const transcript = input.messages
      .map((message) => `${message.sender_type === 'agent' ? 'AGENTE' : 'CLIENTE'}: ${String(message.content || '').trim()}`)
      .join('\n')

    const system = [
      'You are a sales quality analyst. Evaluate the conversation below.',
      `Business context: ${input.systemPrompt || 'Not provided'}`,
      input.scriptTemplate ? `Expected script: ${input.scriptTemplate}` : '',
      'Respond ONLY with valid JSON matching this exact schema:',
      '{"quality_score":number,"quality_label":"Ruim|Regular|Bom|Excelente","script_compliance":boolean,"script_compliance_note":"string","response_cadence":"Lento|Adequado|Rapido","strengths":["string"],"gaps":["string"],"recommendation":"string","evaluated_at":"ISO8601 string"}',
    ].filter(Boolean).join('\n')

    const user = [
      contact?.name ? `Contact: ${contact.name}` : '',
      contact?.company ? `Company: ${contact.company}` : '',
      transcript,
    ].filter(Boolean).join('\n')

    return { system, user }
  }

  private async callAnthropic(prompt: { system: string; user: string }) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not configured')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1000,
        system: prompt.system,
        messages: [{ role: 'user', content: prompt.user }],
      }),
    })

    if (!response.ok) throw new Error(`Anthropic API returned ${response.status}`)
    return textFromAnthropicPayload(await response.json())
  }

  private validateEvaluation(rawText: string) {
    try {
      const parsed = JSON.parse(stripMarkdownFences(rawText))
      const score = Number(parsed.quality_score)
      if (!Number.isFinite(score) || score < 1 || score > 10) return null

      const label = labelForScore(Math.round(score))
      const responseCadence = VALID_CADENCE.has(parsed.response_cadence) ? parsed.response_cadence : 'Adequado'
      const result = {
        quality_score: Math.round(score),
        quality_label: VALID_LABELS.has(parsed.quality_label) ? parsed.quality_label : label,
        script_compliance: Boolean(parsed.script_compliance),
        script_compliance_note: String(parsed.script_compliance_note || ''),
        response_cadence: responseCadence,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths.map(String).slice(0, 5) : [],
        gaps: Array.isArray(parsed.gaps) ? parsed.gaps.map(String).slice(0, 5) : [],
        recommendation: String(parsed.recommendation || ''),
        evaluated_at: String(parsed.evaluated_at || new Date().toISOString()),
      }

      if (!result.script_compliance_note || !result.recommendation) return null
      return result
    } catch {
      return null
    }
  }
}
