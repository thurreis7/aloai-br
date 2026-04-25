import { useEffect, useMemo, useState } from 'react'
import { FileText, Save, UploadCloud } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { apiJson } from '../lib/api'
import { useAuth } from '../hooks/useAuth'
import { usePermissions } from '../hooks/usePermissions'
import { EmptyState, GlassCard, PageHeader, PageShell, StatusPill } from '../components/app/WorkspaceUI'

const DEFAULT_FAQ = [{ id: 'faq-1', question: 'Quais canais estao ativos?', answer: 'WhatsApp e Webchat em operacao comercial.' }]

function mergeKnowledgeFiles(configFiles, storageItems) {
  const items = [...(configFiles || [])]
  const seen = new Set(items.map((item) => item.path))

  for (const item of storageItems || []) {
    if (!item.path || seen.has(item.path)) continue
    seen.add(item.path)
    items.push(item)
  }

  return items
}

export default function Knowledge() {
  const { wsRole, ws } = useAuth()
  const { canEditAiConfig } = usePermissions()
  const workspaceId = wsRole?.workspace_id || ws?.id || null
  const [storageItems, setStorageItems] = useState([])
  const [faq, setFaq] = useState(DEFAULT_FAQ)
  const [companyData, setCompanyData] = useState('')
  const [previewQuestion, setPreviewQuestion] = useState('Como a empresa responde fora do horario?')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [savedAt, setSavedAt] = useState('')

  useEffect(() => {
    let ignore = false

    async function loadPage() {
      if (!workspaceId) {
        setLoading(false)
        return
      }

      setLoading(true)
      setError('')

      try {
        const [{ config }, storage] = await Promise.all([
          apiJson(`/workspaces/${workspaceId}/ai-assist/config`),
          supabase.storage.from('knowledge').list(workspaceId, { limit: 50 }),
        ])

        if (ignore) return

        const listedItems = storage.error
          ? []
          : (storage.data || []).map((item) => ({
              path: `${workspaceId}/${item.name}`,
              name: item.name,
              size: Number(item.metadata?.size || 0),
              content_type: item.metadata?.mimetype || '',
              uploaded_at: item.updated_at || item.created_at || new Date().toISOString(),
            }))

        setCompanyData(config?.workspaceContext?.companyContext || config?.workspaceContext?.company_context || '')
        setFaq((config?.faqRules && config.faqRules.length) ? config.faqRules : DEFAULT_FAQ)
        setStorageItems(mergeKnowledgeFiles(config?.knowledgeFiles, listedItems))
        setSavedAt(config?.updatedAt || '')
      } catch (err) {
        if (!ignore) setError(err.message || 'Nao foi possivel carregar o contexto de IA.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadPage()
    return () => { ignore = true }
  }, [workspaceId])

  async function persistKnowledge(nextFiles = storageItems) {
    if (!workspaceId || !canEditAiConfig) return

    setSaving(true)
    setError('')
    try {
      const payload = await apiJson(`/workspaces/${workspaceId}/ai-assist/config`, {
        method: 'PATCH',
        body: JSON.stringify({
          workspaceContext: { companyContext: companyData },
          faqRules: faq,
          knowledgeFiles: nextFiles,
        }),
      })

      setFaq(payload.config?.faqRules?.length ? payload.config.faqRules : DEFAULT_FAQ)
      setStorageItems(payload.config?.knowledgeFiles || nextFiles)
      setSavedAt(payload.config?.updatedAt || new Date().toISOString())
    } catch (err) {
      setError(err.message || 'Nao foi possivel salvar o contexto de IA.')
    } finally {
      setSaving(false)
    }
  }

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file || !workspaceId || !canEditAiConfig) return

    setUploading(true)
    setError('')
    try {
      const filePath = `${workspaceId}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('knowledge').upload(filePath, file, { upsert: false })
      if (uploadError) throw uploadError

      const nextFiles = mergeKnowledgeFiles(storageItems, [{
        path: filePath,
        name: file.name,
        size: file.size,
        content_type: file.type || '',
        uploaded_at: new Date().toISOString(),
      }])

      setStorageItems(nextFiles)
      await persistKnowledge(nextFiles)
    } catch (err) {
      setError(err.message || 'Falha no upload do documento.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const previewAnswer = useMemo(() => {
    const normalized = previewQuestion.toLowerCase()
    const matched = faq.find((item) => normalized.includes(String(item.question || '').toLowerCase().slice(0, 8)))
    return matched?.answer || `Base da empresa: ${companyData || 'Contexto ainda nao configurado.'}`
  }, [faq, previewQuestion, companyData])

  const actionLabel = saving ? 'Salvando...' : 'Salvar contexto'

  return (
    <PageShell>
      <PageHeader
        eyebrow="Base IA"
        title="Conhecimento vivo para o agente"
        description="Company context, FAQ e referencias sobem para o contrato persistente do workspace e deixam de viver apenas no navegador."
        actions={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <StatusPill tone="info">{storageItems.length} arquivos</StatusPill>
            <button
              type="button"
              className="workspace-button"
              disabled={!canEditAiConfig || loading || saving}
              onClick={() => persistKnowledge()}
              title={canEditAiConfig ? '' : 'Somente owner e admin podem editar o contexto de IA.'}
            >
              <Save size={16} />
              {actionLabel}
            </button>
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) 360px', gap: 16 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <GlassCard style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div>
                <strong>Documentos</strong>
                <p style={{ color: 'var(--txt3)', marginTop: 8 }}>Os arquivos continuam no Supabase Storage, mas as referencias agora ficam persistidas na configuracao de IA do workspace.</p>
              </div>
              <label
                className="workspace-button"
                style={{ display: 'inline-flex', gap: 8, alignItems: 'center', opacity: canEditAiConfig ? 1 : 0.55, cursor: canEditAiConfig ? 'pointer' : 'not-allowed' }}
                title={canEditAiConfig ? '' : 'Somente owner e admin podem enviar documentos.'}
              >
                <UploadCloud size={16} />
                {uploading ? 'Enviando...' : 'Upload'}
                <input type="file" hidden disabled={!canEditAiConfig} onChange={handleUpload} />
              </label>
            </div>

            {loading ? (
              <div style={{ color: 'var(--txt3)' }}>Carregando documentos...</div>
            ) : error ? (
              <EmptyState icon="!" title="Contexto indisponivel" description={error} />
            ) : storageItems.length ? (
              <div className="workspace-list">
                {storageItems.map((item) => (
                  <div key={item.path || item.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <FileText size={16} color="var(--info)" />
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ color: 'var(--txt3)', fontSize: 13 }}>
                          {item.size ? `${Math.round(item.size / 1024)} KB` : 'Documento carregado'}
                        </div>
                      </div>
                    </div>
                    <StatusPill tone="success">Referenciado</StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhum documento ainda" description="Envie PDFs, playbooks ou tabelas para enriquecer o contexto do workspace." />
            )}
          </GlassCard>

          <GlassCard style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div>
                <strong>FAQ manual editavel</strong>
                <p style={{ color: 'var(--txt3)', marginTop: 8 }}>Esses pares pergunta-resposta alimentam as sugestoes on-demand do Inbox.</p>
              </div>
              <button
                type="button"
                className="workspace-button workspace-button--secondary"
                disabled={!canEditAiConfig}
                onClick={() => setFaq((current) => [...current, { id: `faq-${Date.now()}`, question: 'Nova pergunta', answer: 'Nova resposta' }])}
              >
                Adicionar item
              </button>
            </div>

            <div className="workspace-list">
              {faq.map((item, index) => (
                <div key={item.id || index} style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                  <input
                    className="workspace-input"
                    disabled={!canEditAiConfig}
                    value={item.question || ''}
                    onChange={(event) => {
                      const next = [...faq]
                      next[index] = { ...item, question: event.target.value }
                      setFaq(next)
                    }}
                    placeholder="Pergunta"
                  />
                  <textarea
                    className="workspace-textarea"
                    style={{ marginTop: 10 }}
                    disabled={!canEditAiConfig}
                    value={item.answer || ''}
                    onChange={(event) => {
                      const next = [...faq]
                      next[index] = { ...item, answer: event.target.value }
                      setFaq(next)
                    }}
                    placeholder="Resposta"
                  />
                </div>
              ))}
            </div>
          </GlassCard>
        </div>

        <div style={{ display: 'grid', gap: 16 }}>
          <GlassCard style={{ padding: 22 }}>
            <strong>Contexto da empresa</strong>
            <p style={{ color: 'var(--txt3)', marginTop: 8 }}>Resumo institucional que passa a ser reutilizado no backend para montar sugestoes do workspace.</p>
            <textarea
              className="workspace-textarea"
              style={{ marginTop: 14 }}
              disabled={!canEditAiConfig}
              value={companyData}
              onChange={(event) => setCompanyData(event.target.value)}
            />
            {savedAt ? (
              <div style={{ color: 'var(--txt3)', fontSize: 12, marginTop: 10 }}>
                Atualizado em {new Date(savedAt).toLocaleString('pt-BR')}
              </div>
            ) : null}
          </GlassCard>

          <GlassCard style={{ padding: 22 }}>
            <strong>Preview de resposta</strong>
            <p style={{ color: 'var(--txt3)', marginTop: 8 }}>O preview continua local, mas agora reflete exatamente os tres insumos persistidos da fase: contexto, FAQ e arquivos referenciados.</p>
            <textarea
              className="workspace-textarea"
              style={{ marginTop: 14 }}
              value={previewQuestion}
              onChange={(event) => setPreviewQuestion(event.target.value)}
            />
            <div style={{ marginTop: 14, padding: 16, borderRadius: 18, background: 'rgba(56,189,248,.10)', border: '1px solid rgba(56,189,248,.18)', color: 'var(--txt2)', lineHeight: 1.7 }}>
              {previewAnswer}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
