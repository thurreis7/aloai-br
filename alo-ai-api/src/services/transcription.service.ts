import { Injectable } from '@nestjs/common'
import { SupabaseService } from './supabase.service'

const TRANSCRIPTION_TIMEOUT_MS = 15000

@Injectable()
export class TranscriptionService {
  constructor(private readonly supabase: SupabaseService) {}

  async transcribeAudio(messageId: string, mediaUrl: string, workspaceId: string) {
    try {
      if (!messageId || !mediaUrl || !workspaceId) return

      const workspace = await this.loadWorkspace(workspaceId)
      if (!workspace?.ai_enabled) return

      const message = await this.loadInboundAudioMessage(messageId, workspaceId)
      if (!message?.id) return

      await this.supabase.admin
        .from('messages')
        .update({ transcription_status: 'pending' })
        .eq('workspace_id', workspaceId)
        .eq('id', messageId)
        .eq('sender_type', 'contact')
        .eq('type', 'audio')

      const audio = await this.fetchAudio(mediaUrl)
      const transcription = await this.callGroqWhisper(audio)

      const { error } = await this.supabase.admin
        .from('messages')
        .update({
          transcription,
          transcription_status: 'done',
          transcription_summary: null,
        })
        .eq('workspace_id', workspaceId)
        .eq('id', messageId)
        .eq('sender_type', 'contact')
        .eq('type', 'audio')

      if (error) throw error

      if (this.wordCount(transcription) > 100) {
        const summary = await this.summarizeTranscription(transcription)
        if (summary) {
          await this.supabase.admin
            .from('messages')
            .update({ transcription_summary: summary })
            .eq('workspace_id', workspaceId)
            .eq('id', messageId)
        }
      }
    } catch (error) {
      console.error({
        topic: 'audio_transcription_failed',
        workspace_id: workspaceId,
        message_id: messageId,
        error: error instanceof Error ? error.message : String(error),
      })
      await this.supabase.admin
        .from('messages')
        .update({ transcription_status: 'failed' })
        .eq('workspace_id', workspaceId)
        .eq('id', messageId)
    }
  }

  private async loadWorkspace(workspaceId: string) {
    const { data, error } = await this.supabase.admin
      .from('workspaces')
      .select('id, ai_enabled')
      .eq('id', workspaceId)
      .maybeSingle()

    if (error) throw error
    return data
  }

  private async loadInboundAudioMessage(messageId: string, workspaceId: string) {
    const { data, error } = await this.supabase.admin
      .from('messages')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('id', messageId)
      .eq('sender_type', 'contact')
      .eq('type', 'audio')
      .maybeSingle()

    if (error) throw error
    return data
  }

  private async fetchAudio(mediaUrl: string) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS)
    try {
      const response = await fetch(mediaUrl, { signal: controller.signal })
      if (!response.ok) throw new Error(`Audio download returned ${response.status}.`)
      return Buffer.from(await response.arrayBuffer())
    } finally {
      clearTimeout(timeout)
    }
  }

  private async callGroqWhisper(audio: Buffer) {
    if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY nao configurada.')

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS)
    try {
      const form = new FormData()
      const audioPart = audio.buffer.slice(audio.byteOffset, audio.byteOffset + audio.byteLength) as ArrayBuffer
      form.append('file', new Blob([audioPart], { type: 'audio/ogg' }), 'audio.ogg')
      form.append('model', 'whisper-large-v3')
      form.append('language', 'pt')
      form.append('response_format', 'text')

      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: form,
        signal: controller.signal,
      })

      const text = await response.text()
      if (!response.ok) throw new Error(`Groq transcription returned ${response.status}: ${text}`)
      return text.trim()
    } finally {
      clearTimeout(timeout)
    }
  }

  private async summarizeTranscription(transcription: string) {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) return null

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TRANSCRIPTION_TIMEOUT_MS)
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 80,
          messages: [
            {
              role: 'user',
              content: `Resuma em uma frase: ${transcription}`,
            },
          ],
        }),
        signal: controller.signal,
      })

      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(`Anthropic summary returned ${response.status}.`)
      return String(payload?.content?.[0]?.text || '').trim() || null
    } finally {
      clearTimeout(timeout)
    }
  }

  private wordCount(text: string) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length
  }
}
