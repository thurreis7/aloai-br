import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common'
import { SupabaseService } from './supabase.service'
import { decrypt, encrypt } from '../utils/encryption.util'

type ChannelStatus = 'connecting' | 'connected' | 'disconnected'

type EvolutionConnectResponse = {
  base64?: string
  code?: string
  qrcode?: string | { base64?: string; code?: string }
  qr?: string
  pairingCode?: string
  [key: string]: any
}

@Injectable()
export class ChannelsService {
  constructor(private readonly supabase: SupabaseService) {}

  async listWorkspaceChannels(workspaceId: string) {
    const { data, error } = await this.supabase.admin
      .from('channels')
      .select('id, type, name, status, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true })

    if (error) throw new InternalServerErrorException(error.message)
    return data || []
  }

  async connectWhatsapp(workspaceId: string) {
    const existing = await this.loadWorkspaceWhatsappChannel(workspaceId)
    if (existing?.id) {
      throw new ConflictException('Canal WhatsApp ja existe para este workspace.')
    }

    const evolutionApiUrl = this.getEvolutionApiUrl()
    const evolutionApiKey = this.getEvolutionApiKey()
    const instanceName = `workspace_${workspaceId}`

    await this.callEvolution(`${evolutionApiUrl}/instance/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: evolutionApiKey },
      body: JSON.stringify({ instanceName, token: evolutionApiKey }),
    })

    const connectPayload = await this.callEvolution<EvolutionConnectResponse>(
      `${evolutionApiUrl}/instance/connect/${encodeURIComponent(instanceName)}`,
      { method: 'GET', headers: { apikey: evolutionApiKey } },
    )

    const encryptedConfig = encrypt(JSON.stringify({ instanceName, apikey: evolutionApiKey }))
    const { data, error } = await this.supabase.admin
      .from('channels')
      .insert({
        workspace_id: workspaceId,
        company_id: workspaceId,
        type: 'whatsapp',
        name: 'WhatsApp',
        status: 'connecting',
        connection_status: 'connecting',
        is_active: true,
        external_instance_id: instanceName,
        config: encryptedConfig,
      })
      .select('id')
      .single()

    if (error || !data?.id) {
      throw new InternalServerErrorException(error?.message || 'Nao foi possivel criar o canal WhatsApp.')
    }

    return {
      channelId: data.id,
      qrCode: this.extractQrCode(connectPayload),
      instanceName,
    }
  }

  async getWhatsappStatus(workspaceId: string, channelId: string) {
    const channel = await this.loadWorkspaceChannel(workspaceId, channelId)
    const config = this.decryptConfig(channel.config)
    const instanceName = config.instanceName || channel.external_instance_id
    if (!instanceName) throw new BadRequestException('Canal sem instanceName configurado.')

    const evolutionApiUrl = this.getEvolutionApiUrl()
    const evolutionApiKey = this.getEvolutionApiKey()
    const payload = await this.callEvolution<any>(
      `${evolutionApiUrl}/instance/connectionState/${encodeURIComponent(instanceName)}`,
      { method: 'GET', headers: { apikey: evolutionApiKey } },
    )

    const status = this.mapConnectionState(
      payload?.state || payload?.instance?.state || payload?.connectionState || payload?.status,
    )
    await this.updateChannelStatus(workspaceId, channelId, status)
    return { status }
  }

  async disconnectChannel(workspaceId: string, channelId: string) {
    const channel = await this.loadWorkspaceChannel(workspaceId, channelId)
    const config = this.decryptConfig(channel.config)
    const instanceName = config.instanceName || channel.external_instance_id
    if (instanceName) {
      const evolutionApiUrl = this.getEvolutionApiUrl()
      const evolutionApiKey = this.getEvolutionApiKey()
      await this.callEvolution(
        `${evolutionApiUrl}/instance/delete/${encodeURIComponent(instanceName)}`,
        { method: 'DELETE', headers: { apikey: evolutionApiKey } },
      )
    }

    await this.updateChannelStatus(workspaceId, channelId, 'disconnected')
    return { success: true }
  }

  async handleConnectionUpdate(payload: any) {
    const instanceName = this.extractInstanceName(payload)
    if (!instanceName) return

    const workspaceId = payload?.workspace_id
      || payload?.workspaceId
      || payload?.data?.workspace_id
      || payload?.data?.workspaceId
      || this.extractWorkspaceIdFromInstanceName(instanceName)
    if (!workspaceId) return

    const state = payload?.data?.state || payload?.state || payload?.data?.connection || payload?.connection
    const status = this.mapConnectionState(state)

    const { data, error } = await this.supabase.admin
      .from('channels')
      .select('id, workspace_id')
      .eq('workspace_id', workspaceId)
      .eq('type', 'whatsapp')
      .eq('external_instance_id', instanceName)
      .limit(1)
      .maybeSingle()
    if (error) throw new InternalServerErrorException(error.message)
    if (!data?.id || !data.workspace_id) return

    await this.updateChannelStatus(data.workspace_id, data.id, status)
  }

  private async loadWorkspaceWhatsappChannel(workspaceId: string) {
    const { data, error } = await this.supabase.admin
      .from('channels')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('type', 'whatsapp')
      .maybeSingle()

    if (error) throw new InternalServerErrorException(error.message)
    return data
  }

  private async loadWorkspaceChannel(workspaceId: string, channelId: string) {
    const { data, error } = await this.supabase.admin
      .from('channels')
      .select('id, workspace_id, type, status, config, external_instance_id')
      .eq('workspace_id', workspaceId)
      .eq('id', channelId)
      .maybeSingle()

    if (error) throw new InternalServerErrorException(error.message)
    if (!data?.id) throw new NotFoundException('Canal nao encontrado.')
    return data
  }

  private async updateChannelStatus(workspaceId: string, channelId: string, status: ChannelStatus) {
    const { error } = await this.supabase.admin
      .from('channels')
      .update({
        status,
        connection_status: status,
        is_active: status === 'connected',
        updated_at: new Date().toISOString(),
      })
      .eq('workspace_id', workspaceId)
      .eq('id', channelId)

    if (error) throw new InternalServerErrorException(error.message)
  }

  private decryptConfig(config: string | null | undefined) {
    if (!config) return {}
    try {
      return JSON.parse(decrypt(config))
    } catch (error) {
      throw new InternalServerErrorException('Config do canal invalida.')
    }
  }

  private getEvolutionApiUrl() {
    const value = process.env.EVOLUTION_API_URL || process.env.EVOLUTION_URL
    if (!value) throw new InternalServerErrorException('EVOLUTION_API_URL nao configurada.')
    return value.replace(/\/+$/, '')
  }

  private getEvolutionApiKey() {
    if (!process.env.EVOLUTION_API_KEY) {
      throw new InternalServerErrorException('EVOLUTION_API_KEY nao configurada.')
    }
    return process.env.EVOLUTION_API_KEY
  }

  private async callEvolution<T = any>(url: string, init: RequestInit): Promise<T> {
    const response = await fetch(url, init)
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) {
      throw new InternalServerErrorException(`Evolution API returned ${response.status}.`)
    }
    return payload
  }

  private extractQrCode(payload: EvolutionConnectResponse) {
    const nestedQr = typeof payload?.qrcode === 'object' ? payload.qrcode : null
    return payload?.base64
      || nestedQr?.base64
      || payload?.qrcode
      || payload?.qr
      || payload?.code
      || nestedQr?.code
      || payload?.pairingCode
      || null
  }

  private extractInstanceName(payload: any) {
    return String(
      payload?.instance?.instanceName
      || payload?.data?.instance?.instanceName
      || payload?.instance
      || payload?.instanceName
      || payload?.data?.instance
      || payload?.data?.instanceName
      || payload?.server_url
      || '',
    ).trim()
  }

  private extractWorkspaceIdFromInstanceName(instanceName: string) {
    const [, workspaceId] = String(instanceName || '').match(/^workspace_([0-9a-f-]{36})$/i) || []
    return workspaceId || null
  }

  private mapConnectionState(state: any): ChannelStatus {
    const normalized = String(state || '').toLowerCase()
    if (normalized === 'open' || normalized === 'connected') return 'connected'
    if (normalized === 'connecting') return 'connecting'
    if (normalized === 'close' || normalized === 'closed' || normalized === 'disconnected') return 'disconnected'
    return 'disconnected'
  }
}
