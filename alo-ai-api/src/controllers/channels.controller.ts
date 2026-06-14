import { BadRequestException, Controller, Delete, Get, Headers, Param, Post } from '@nestjs/common'
import { AccessService } from '../services/access.service'
import { ChannelsService } from '../services/channels.service'

@Controller('/channels')
export class ChannelsController {
  constructor(
    private readonly accessService: AccessService,
    private readonly channelsService: ChannelsService,
  ) {}

  @Get()
  async listChannels(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    const workspaceId = await this.resolveWorkspaceId(authorization, workspaceHeader)
    return {
      channels: await this.channelsService.listWorkspaceChannels(workspaceId),
    }
  }

  @Post('/whatsapp/connect')
  async connectWhatsapp(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
  ) {
    const workspaceId = await this.resolveWorkspaceId(authorization, workspaceHeader)
    return this.channelsService.connectWhatsapp(workspaceId)
  }

  @Get('/whatsapp/status/:channelId')
  async getWhatsappStatus(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('channelId') channelId: string,
  ) {
    const workspaceId = await this.resolveWorkspaceId(authorization, workspaceHeader)
    return this.channelsService.getWhatsappStatus(workspaceId, channelId)
  }

  @Delete('/:channelId')
  async disconnectChannel(
    @Headers('authorization') authorization: string | undefined,
    @Headers('x-workspace-id') workspaceHeader: string | undefined,
    @Param('channelId') channelId: string,
  ) {
    const workspaceId = await this.resolveWorkspaceId(authorization, workspaceHeader)
    return this.channelsService.disconnectChannel(workspaceId, channelId)
  }

  private async resolveWorkspaceId(authorization?: string, workspaceHeader?: string) {
    const context = await this.accessService.resolveRequestContext(authorization)
    const workspaceId = workspaceHeader || context.activeWorkspaceId
    if (!workspaceId) {
      throw new BadRequestException('workspaceId ausente.')
    }
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    return workspaceId
  }
}
