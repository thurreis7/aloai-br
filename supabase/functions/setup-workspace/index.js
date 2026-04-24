import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export default async (req) => {
  try {
    const { companyName, ownerName, channel, plan, aiEnabled, teamMembers } = await req.json()

    /* Validação */
    if (!companyName || !ownerName || !channel || !teamMembers?.length) {
      return new Response(
        JSON.stringify({ error: 'Dados obrigatórios ausentes' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

    /* Gera slug a partir do nome */
    function slugify(name) {
      return name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    }

    function normalizeChannelType(type) {
      const normalized = String(type || '').trim().toLowerCase()
      if (!normalized) return ''
      if (normalized === 'gmail') return 'email'
      return normalized
    }

    function getChannelName(type) {
      if (type === 'whatsapp') return 'WhatsApp Business'
      if (type === 'instagram') return 'Instagram'
      if (type === 'email') return 'E-mail'
      if (type === 'webchat') return 'Web Chat'
      return type || 'Canal'
    }

    /* Step 1: Criar workspace */
    const slug = slugify(companyName) + '-' + Date.now().toString(36)
    const { data: workspace, error: wsErr } = await supabase
      .from('workspaces')
      .insert({
        name: companyName,
        slug,
        plan: plan || 'growth',
        ai_enabled: !!aiEnabled,
      })
      .select('id')
      .single()
    if (wsErr) throw new Error(`workspace: ${wsErr.message}`)

    /* Step 2: Criar channel */
    const canonicalChannelType = normalizeChannelType(channel)
    const { data: chData, error: chErr } = await supabase
      .from('channels')
      .insert({
        workspace_id: workspace.id,
        type: canonicalChannelType,
        name: getChannelName(canonicalChannelType),
        is_active: true,
        config: {},
      })
      .select('id')
      .single()
    if (chErr) throw new Error(`channel: ${chErr.message}`)

    /* Step 3: Criar cada membro no Auth e vincular ao workspace */
    const createdMembers = []
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    for (const m of teamMembers) {
      if (!m.name?.trim()) continue

      const email = slugify(m.name) + '@' + slug + '.aloai.local'
      const defaultPassword = slugify(companyName) + '123'

      /* Criar usuário via Admin API */
      const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: defaultPassword,
        email_confirm: true,
        user_metadata: { full_name: m.name.trim(), company: companyName },
      })
      if (authErr) {
        console.warn(`Falha ao criar auth user para ${m.name}: ${authErr.message}`)
        continue
      }

      /* Inserir na tabela users (para o usePermissions e a UI de Settings funcionarem) */
      const { error: userErr } = await supabase
        .from('users')
        .insert({
          id: authUser.user.id,
          name: m.name.trim(),
          email,
          role: m.role === 'admin' ? 'admin' : 'agent',
          company_id: workspace.id,
        })
      if (userErr) {
        console.warn(`Falha ao criar users row para ${m.name}: ${userErr.message}`)
      }

      /* Vincular ao workspace */
      const { error: memErr } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: workspace.id,
          user_id: authUser.user.id,
          role: m.role === 'admin' ? 'admin' : 'agent',
          display_name: m.name.trim(),
        })
      if (memErr) {
        console.warn(`Falha ao vincular membro ${m.name}: ${memErr.message}`)
      }

      createdMembers.push({
        name: m.name.trim(),
        role: m.role || 'agent',
        email,
        password: defaultPassword,
      })
    }

    /* Step 4: Log de auditoria */
    await supabase.from('audit_logs').insert({
      workspace_id: workspace.id,
      action: 'workspace_setup',
      resource: 'workspace',
      resource_id: workspace.id,
    })

    return new Response(
      JSON.stringify({
        ok: true,
        workspace: { id: workspace.id, slug, name: companyName },
        channel: { id: chData.id, type: canonicalChannelType },
        members: createdMembers,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
