export const conversations = [
  { id:1, name:'Mariana Costa',    initials:'MC', color:'#8B2FCC', msg:'Como faço para começar o trial?',              time:'09:22', channel:'whatsapp', unread:3,  status:'open',    priority:'medium' },
  { id:2, name:'Rafael Mendes',    initials:'RM', color:'#6B02B1', msg:'O agente de IA responde em português?',         time:'08:51', channel:'instagram',unread:1,  status:'bot',     priority:'low'    },
  { id:3, name:'Juliana Faria',    initials:'JF', color:'#AA5EDE', msg:'Recebi a nota fiscal errada no meu e-mail',     time:'08:30', channel:'email',    unread:0,  status:'open',    priority:'high'   },
  { id:4, name:'Tech Solutions',   initials:'TS', color:'#5EB8FF', msg:'Precisamos de 3 workspaces separados',          time:'ontem', channel:'webchat',  unread:0,  status:'open',    priority:'medium' },
  { id:5, name:'Carlos Drummond',  initials:'CD', color:'#1DA06A', msg:'Quando sai a integração com Mercado Livre?',    time:'ontem', channel:'whatsapp', unread:0,  status:'resolved',priority:'low'    },
  { id:6, name:'Beatriz Lemos',    initials:'BL', color:'#E8780A', msg:'Muito obrigada pelo atendimento! 🙏',           time:'ontem', channel:'instagram',unread:0,  status:'resolved',priority:'low'    },
  { id:7, name:'Startup Inovação', initials:'SI', color:'#D94040', msg:'Podemos conversar sobre planos anuais?',        time:'seg',   channel:'webchat',  unread:0,  status:'open',    priority:'high'   },
  { id:8, name:'Pedro Alves',      initials:'PA', color:'#AA5EDE', msg:'Não consigo conectar meu número de WhatsApp',  time:'seg',   channel:'whatsapp', unread:2,  status:'open',    priority:'high'   },
]

export const messages = [
  { id:1, from:'client', text:'Olá! Gostaria de saber mais sobre os planos do ALO AI para minha equipe de 8 pessoas 👋', time:'09:14' },
  { id:2, from:'ai',     text:'Olá, Mariana! Que ótimo ter você aqui 😊 Para uma equipe de 8 pessoas, o nosso plano Business seria o mais adequado — ele inclui agentes ilimitados, todos os canais e o agente IA sem limite de conversas. Posso te mostrar uma demonstração?', time:'09:14' },
  { id:3, from:'client', text:'Que canais vocês suportam? A gente usa muito WhatsApp e Instagram', time:'09:17' },
  { id:4, from:'client', text:'E quanto custa o plano Business?', time:'09:17' },
  { id:5, from:'agent',  text:'Suportamos WhatsApp, Instagram, Facebook Messenger, e-mail e chat no site — tudo em um só lugar! 🚀 O plano Business é R$799/mês com tudo incluso. Mas posso te oferecer 14 dias grátis para testar sem compromisso. O que acha?', time:'09:18' },
  { id:6, from:'client', text:'Adorei! Como faço para começar o trial?', time:'09:22' },
]

export const dashboardMetrics = {
  today: {
    open: 142, resolved: 87, avgResponse: '2m 14s',
    csat: 98, botRate: 64, newContacts: 23
  },
  weekly: [
    { day:'Seg', open:98,  resolved:102, csat:96 },
    { day:'Ter', open:112, resolved:95,  csat:97 },
    { day:'Qua', open:134, resolved:118, csat:98 },
    { day:'Qui', open:121, resolved:130, csat:99 },
    { day:'Sex', open:156, resolved:142, csat:97 },
    { day:'Sáb', open:78,  resolved:82,  csat:98 },
    { day:'Dom', open:45,  resolved:51,  csat:100 },
  ],
  channels: [
    { name:'WhatsApp',  value:54, color:'#1DA06A' },
    { name:'Instagram', value:22, color:'#AA5EDE' },
    { name:'E-mail',    value:14, color:'#E8780A' },
    { name:'Web Chat',  value:10, color:'#5EB8FF' },
  ],
  agents: [
    { name:'Você',         resolved:34, csat:4.9, avg:'1m 42s', online:true  },
    { name:'Ana Lima',     resolved:28, csat:4.8, avg:'2m 10s', online:true  },
    { name:'Bruno Santos', resolved:22, csat:4.7, avg:'3m 05s', online:false },
    { name:'Carla Nunes',  resolved:19, csat:4.9, avg:'1m 58s', online:true  },
  ]
}

/** Logos de marca (Simple Icons CDN) — cores oficiais aproximadas */
export const channelOptions = [
  { id:'whatsapp',  name:'WhatsApp',           brand:'whatsapp',  color:'#1DA06A', connected:true,  description:'Conecte seu número via QR Code ou API oficial' },
  { id:'instagram', name:'Instagram',          brand:'instagram', color:'#E4405F', connected:true,  description:'Mensagens diretas e comentários do Instagram' },
  { id:'facebook',  name:'Facebook Messenger', brand:'facebook',  color:'#1877F2', connected:false, description:'Mensagens do Facebook Page' },
  { id:'email',     name:'E-mail',             brand:'gmail',       color:'#EA4335', connected:false, description:'Receba e responda e-mails como tickets' },
  { id:'webchat',   name:'Web Chat',           brand:'intercom',   color:'#6AFDEF', connected:false, description:'Widget de chat para o seu site' },
  { id:'telegram',  name:'Telegram',           brand:'telegram',   color:'#26A5E4', connected:false, description:'Bot do Telegram integrado ao inbox' },
]
