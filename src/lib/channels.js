import { Globe, Inbox, Instagram, Mail, MessageCircle, Radio } from 'lucide-react'

export const CHANNEL_TYPE_ALIASES = {
  gmail: 'email',
}

export const CHANNEL_LIBRARY = [
  {
    type: 'whatsapp',
    name: 'WhatsApp',
    defaultDisplayName: 'WhatsApp Business',
    icon: MessageCircle,
    color: '#25D366',
    description: 'Canal principal para atendimento e vendas com onboarding via QR Code.',
  },
  {
    type: 'instagram',
    name: 'Instagram',
    defaultDisplayName: 'Instagram',
    icon: Instagram,
    color: '#C13584',
    description: 'Direct conectado para operar leads e suporte em uma mesma fila.',
  },
  {
    type: 'email',
    name: 'E-mail',
    defaultDisplayName: 'E-mail',
    icon: Mail,
    color: '#F59E0B',
    description: 'Caixa compartilhada com assinatura, fila e contexto de SLA.',
  },
  {
    type: 'webchat',
    name: 'Web Chat',
    defaultDisplayName: 'Web Chat',
    icon: Radio,
    color: '#38BDF8',
    description: 'Widget do site com captura de contexto e automacoes.',
  },
]

export const CHANNEL_FIELDS = {
  whatsapp: [
    { key: 'display_number', label: 'Numero exibido', placeholder: '+55 11 99999-9999' },
    { key: 'business_account_id', label: 'Business Account ID', placeholder: 'Meta / BSP' },
    { key: 'welcome_template', label: 'Template inicial', placeholder: 'boas-vindas-v1' },
  ],
  instagram: [
    { key: 'handle', label: 'Perfil', placeholder: '@suaempresa' },
    { key: 'page_id', label: 'Page ID', placeholder: 'Pagina vinculada' },
    { key: 'sync_mode', label: 'Modo de sincronizacao', placeholder: 'DM + comentarios' },
  ],
  email: [
    { key: 'inbox_email', label: 'Conta de e-mail', placeholder: 'time@empresa.com' },
    { key: 'signature_name', label: 'Assinatura', placeholder: 'Equipe ALO AI' },
    { key: 'label_name', label: 'Pasta ou etiqueta', placeholder: 'ALO-AI' },
  ],
  webchat: [
    { key: 'site_url', label: 'Site', placeholder: 'https://seusite.com.br' },
    { key: 'widget_id', label: 'Widget ID', placeholder: 'widget_prod_01' },
    { key: 'greeting', label: 'Mensagem inicial', placeholder: 'Como podemos ajudar?' },
  ],
}

const UNKNOWN_CHANNEL = {
  type: 'unknown',
  name: 'Canal desconhecido',
  defaultDisplayName: 'Canal desconhecido',
  icon: Globe,
  color: '#94A3B8',
  description: 'Canal sem mapeamento canonico no CRM.',
}

export function normalizeChannelType(type) {
  const normalized = String(type || '').trim().toLowerCase()
  if (!normalized) return ''
  return CHANNEL_TYPE_ALIASES[normalized] || normalized
}

export function getChannelDefinition(type) {
  const normalizedType = normalizeChannelType(type)
  return CHANNEL_LIBRARY.find((item) => item.type === normalizedType) || {
    ...UNKNOWN_CHANNEL,
    type: normalizedType || UNKNOWN_CHANNEL.type,
  }
}

export function getChannelColor(type) {
  return getChannelDefinition(type).color
}

export function getChannelIcon(type) {
  return getChannelDefinition(type).icon || Inbox
}

export function getChannelLabel(type) {
  return getChannelDefinition(type).name
}

export function getChannelDisplayName(type, name) {
  if (name?.trim()) return name.trim()
  return getChannelDefinition(type).defaultDisplayName
}

export function canComposeOnChannel(type, direction = 'outbound') {
  const normalized = normalizeChannelType(type)
  if (normalized === 'instagram' && direction === 'inbound') return false
  return true
}

export function normalizeStoredChannel(channel) {
  if (!channel) return channel
  const normalizedType = normalizeChannelType(channel.type)
  return {
    ...channel,
    type: normalizedType,
    name: getChannelDisplayName(normalizedType, channel.name),
  }
}
