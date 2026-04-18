import { useEffect, useMemo, useState } from 'react'
import { FileText, UploadCloud } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { EmptyState, GlassCard, PageHeader, PageShell, StatusPill } from '../components/app/WorkspaceUI'

export default function Knowledge() {
  const { wsRole } = useAuth()
  const workspaceKey = wsRole?.workspace_id || 'default'
  const localKey = useMemo(() => `alo-knowledge-${workspaceKey}`, [workspaceKey])
  const [storageItems, setStorageItems] = useState([])
  const [faq, setFaq] = useState(() => {
    const saved = localStorage.getItem(localKey)
    return saved ? JSON.parse(saved) : [{ q: 'Quais canais estao ativos?', a: 'WhatsApp e Webchat em operacao comercial.' }]
  })
  const [companyData, setCompanyData] = useState('Empresa focada em atendimento conversacional premium, onboarding rapido e operacao com IA.')
  const [previewQuestion, setPreviewQuestion] = useState('Como a empresa responde fora do horario?')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    localStorage.setItem(localKey, JSON.stringify(faq))
  }, [faq, localKey])

  useEffect(() => {
    let ignore = false
    async function loadStorage() {
      setLoading(true)
      setError('')
      try {
        const { data, error: listError } = await supabase.storage.from('knowledge').list(workspaceKey, { limit: 50 })
        if (listError) throw listError
        if (!ignore) setStorageItems(data || [])
      } catch (err) {
        if (!ignore) setError(err.message || 'Nao foi possivel acessar o bucket de conhecimento.')
      } finally {
        if (!ignore) setLoading(false)
      }
    }

    loadStorage()
    return () => { ignore = true }
  }, [workspaceKey])

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')
    try {
      const filePath = `${workspaceKey}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage.from('knowledge').upload(filePath, file, { upsert: false })
      if (uploadError) throw uploadError
      setStorageItems((current) => [...current, { id: filePath, name: file.name, metadata: { size: file.size } }])
    } catch (err) {
      setError(err.message || 'Falha no upload do documento.')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  const previewAnswer = useMemo(() => {
    const matched = faq.find((item) => previewQuestion.toLowerCase().includes(item.q.toLowerCase().slice(0, 8)))
    return matched?.a || `Base da empresa: ${companyData}`
  }, [faq, previewQuestion, companyData])

  return (
    <PageShell>
      <PageHeader
        eyebrow="Base IA"
        title="Conhecimento vivo para o agente"
        description="Upload de documentos, FAQ manual, dados da empresa e preview de resposta em uma mesma camada de contexto."
        actions={<StatusPill tone="info">{storageItems.length} arquivos</StatusPill>}
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.1fr) 360px', gap: 16 }}>
        <div style={{ display: 'grid', gap: 16 }}>
          <GlassCard style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div>
                <strong>Documentos</strong>
                <p style={{ color: 'var(--txt3)', marginTop: 8 }}>Use Supabase Storage para centralizar PDFs, playbooks e materiais de suporte.</p>
              </div>
              <label className="workspace-button" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <UploadCloud size={16} />
                {uploading ? 'Enviando...' : 'Upload'}
                <input type="file" hidden onChange={handleUpload} />
              </label>
            </div>

            {loading ? (
              <div style={{ color: 'var(--txt3)' }}>Carregando documentos...</div>
            ) : error ? (
              <EmptyState icon="!" title="Bucket indisponivel" description={error} />
            ) : storageItems.length ? (
              <div className="workspace-list">
                {storageItems.map((item) => (
                  <div key={item.id || item.name} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', padding: 14, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <FileText size={16} color="var(--info)" />
                      <div>
                        <div style={{ fontWeight: 700 }}>{item.name}</div>
                        <div style={{ color: 'var(--txt3)', fontSize: 13 }}>{item.metadata?.size ? `${Math.round(item.metadata.size / 1024)} KB` : 'Documento carregado'}</div>
                      </div>
                    </div>
                    <StatusPill tone="success">Pronto</StatusPill>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="Nenhum documento ainda" description="Envie PDFs, playbooks ou tabelas para enriquecer as respostas da IA." />
            )}
          </GlassCard>

          <GlassCard style={{ padding: 22 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div>
                <strong>FAQ manual editavel</strong>
                <p style={{ color: 'var(--txt3)', marginTop: 8 }}>Perguntas frequentes que ajudam a IA a responder com consistencia.</p>
              </div>
              <button
                type="button"
                className="workspace-button workspace-button--secondary"
                onClick={() => setFaq((current) => [...current, { q: 'Nova pergunta', a: 'Nova resposta' }])}
              >
                Adicionar item
              </button>
            </div>

            <div className="workspace-list">
              {faq.map((item, index) => (
                <div key={index} style={{ padding: 16, borderRadius: 18, background: 'rgba(255,255,255,.03)' }}>
                  <input
                    className="workspace-input"
                    value={item.q}
                    onChange={(event) => {
                      const next = [...faq]
                      next[index] = { ...item, q: event.target.value }
                      setFaq(next)
                    }}
                    placeholder="Pergunta"
                  />
                  <textarea
                    className="workspace-textarea"
                    style={{ marginTop: 10 }}
                    value={item.a}
                    onChange={(event) => {
                      const next = [...faq]
                      next[index] = { ...item, a: event.target.value }
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
            <strong>Dados da empresa</strong>
            <textarea
              className="workspace-textarea"
              style={{ marginTop: 14 }}
              value={companyData}
              onChange={(event) => setCompanyData(event.target.value)}
            />
          </GlassCard>

          <GlassCard style={{ padding: 22 }}>
            <strong>Teste de IA</strong>
            <p style={{ color: 'var(--txt3)', marginTop: 8 }}>Preview de resposta usando FAQ, documentos e contexto institucional.</p>
            <textarea
              className="workspace-textarea"
              style={{ marginTop: 14 }}
              value={previewQuestion}
              onChange={(event) => setPreviewQuestion(event.target.value)}
            />
            <div style={{ marginTop: 14, padding: 16, borderRadius: 18, background: 'rgba(139,92,246,.12)', border: '1px solid rgba(139,92,246,.25)', color: 'var(--txt2)', lineHeight: 1.7 }}>
              {previewAnswer}
            </div>
          </GlassCard>
        </div>
      </div>
    </PageShell>
  )
}
