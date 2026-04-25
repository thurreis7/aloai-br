import { Body, Controller, Delete, ForbiddenException, Get, Headers, Param, Post } from '@nestjs/common'
import { ConnectChannelDto } from '../dto/connect-channel.dto'
import { AccessService } from '../services/access.service'
import { ProvisioningService } from '../services/provisioning.service'

@Controller('/workspaces/:workspaceId/channels')
export class ChannelController {
  constructor(
    private readonly accessService: AccessService,
    private readonly provisioningService: ProvisioningService,
  ) {}

  @Get()
  async listChannels(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    return { channels: await this.provisioningService.listChannels(workspaceId) }
  }

  @Post()
  async connectChannel(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Body() body: ConnectChannelDto,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    if (!context.isOwner && !['owner', 'admin'].includes(context.role)) {
      throw new ForbiddenException('Apenas owner e admin podem configurar canais.')
    }

    const channel = await this.provisioningService.upsertChannel(workspaceId, body.type, body.config || {})
    return { channel, emits: 'conversation.updated' }
  }

  @Delete('/:channelId')
  async disconnectChannel(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('channelId') channelId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    if (!context.isOwner && !['owner', 'admin'].includes(context.role)) {
      throw new ForbiddenException('Apenas owner e admin podem configurar canais.')
    }

    return {
      channel: await this.provisioningService.disconnectChannel(workspaceId, channelId),
      emits: 'conversation.updated',
    }
  }
}
