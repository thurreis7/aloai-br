import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export default async (req) => {
  try {
    const { phone, text, instance } = await req.json()

    if (!phone || !text || !instance) {
      return new Response(
        JSON.stringify({ error: 'Parâmetros obrigatórios ausentes: phone, text, instance' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const evolutionUrl = Deno.env.get('EVOLUTION_URL')
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY')

    if (!evolutionUrl || !evolutionApiKey) {
      throw new Error('Configuração da Evolution API não encontrada')
    }

    const res = await fetch(`${evolutionUrl}/message/sendText/${instance}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey,
      },
      body: JSON.stringify({
        number: phone,
        options: { delay: 500 },
        textMessage: { text },
      }),
    })

    const data = await res.json()
    return new Response(
      JSON.stringify(data),
      { status: res.status, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error(err)
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}