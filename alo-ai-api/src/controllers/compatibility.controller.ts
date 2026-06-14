import { BadRequestException, Body, Controller, ForbiddenException, Headers, Param, Post, Res } from '@nestjs/common'
import { FastifyReply } from 'fastify'
import { CreateUserDto } from '../dto/create-user.dto'
import { SendWhatsappDto } from '../dto/send-whatsapp.dto'
import { AccessService } from '../services/access.service'
import { MessagingService } from '../services/messaging.service'
import { ProvisioningService } from '../services/provisioning.service'
import { ChannelsService } from '../services/channels.service'

@Controller()
export class CompatibilityController {
  constructor(
    private readonly accessService: AccessService,
    private readonly provisioningService: ProvisioningService,
    private readonly messagingService: MessagingService,
    private readonly channelsService: ChannelsService,
  ) {}

  @Post('/admin/users')
  async createUserCompat(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: CreateUserDto,
  ) {
    await this.accessService.requireOwner(authorization)
    const workspaceId = body.workspaceId || body.companyId
    if (!workspaceId) throw new BadRequestException('workspaceId e obrigatorio.')

    const user = await this.provisioningService.createWorkspaceUser({
      workspaceId,
      companyName: workspaceId,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      role: body.role,
    })

    return { ok: true, user }
  }

  @Post('/workspaces/:workspaceId/members')
  async createWorkspaceUser(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Body() body: CreateUserDto,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    if (!context.isOwner && !['owner', 'admin'].includes(context.role)) {
      throw new ForbiddenException('Apenas owner e admin podem criar usuarios.')
    }

    const user = await this.provisioningService.createWorkspaceUser({
      workspaceId,
      companyName: workspaceId,
      fullName: body.fullName,
      email: body.email,
      password: body.password,
      role: body.role,
    })

    return { ok: true, user }
  }

  @Post('/webhook/whatsapp')
  async webhookWhatsapp(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: any,
    @Res() reply: FastifyReply,
  ) {
    return this.acknowledgeWhatsapp(headers, body, reply)
  }

  @Post('/webhooks/whatsapp')
  async webhooksWhatsapp(
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: any,
    @Res() reply: FastifyReply,
  ) {
    return this.acknowledgeWhatsapp(headers, body, reply)
  }

  private async acknowledgeWhatsapp(
    headers: Record<string, string | string[] | undefined>,
    body: any,
    reply: FastifyReply,
  ) {
    if (body?.event === 'connection.update') {
      await this.channelsService.handleConnectionUpdate(body)
      reply.status(200).send()
      return
    }

    if (body?.event === 'messages.update' || body?.event === 'message.ack') {
      await this.messagingService.handleMessageStatusUpdate(body)
      reply.status(200).send()
      return
    }

    const job = await this.messagingService.acknowledgeWhatsappWebhook(headers?.apikey, body)
    reply.status(200).send()

    void this.messagingService.processAcknowledgedWhatsappWebhook(job).catch((error) => {
      console.error({
        topic: 'whatsapp_webhook_async_failure',
        workspace_id: job.channel.workspace_id,
        error: error?.message || String(error),
      })
    })
  }

  @Post('/send/whatsapp')
  async sendWhatsappCompat(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: SendWhatsappDto,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    if (body.workspaceId) {
      await this.accessService.assertWorkspaceAccess(context, body.workspaceId)
    }

    return this.messagingService.sendWhatsappMessage(body)
  }

  @Post('/workspaces/:workspaceId/channels/whatsapp/send')
  async sendWhatsappCanonical(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Body() body: SendWhatsappDto,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    return this.messagingService.sendWhatsappMessage(body)
  }
}
