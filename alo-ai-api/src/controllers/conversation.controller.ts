import { Body, Controller, Get, Headers, Param, Patch, Post, BadRequestException, ForbiddenException } from '@nestjs/common'
import { AccessService } from '../services/access.service'
import { ConversationService } from '../services/conversation.service'

@Controller('/workspaces/:workspaceId/conversations')
export class ConversationController {
  constructor(
    private readonly accessService: AccessService,
    private readonly conversationService: ConversationService,
  ) {}

  @Post('/:conversationId/messages')
  async sendMessage(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { text?: string },
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    const text = String(body?.text || '').trim()
    if (!text) throw new BadRequestException('text e obrigatorio.')

    return this.conversationService.sendConversationMessage({
      workspaceId,
      conversationId,
      userId: context.user.id,
      role: context.role,
      text,
    })
  }

  @Patch('/:conversationId/state')
  async updateState(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { state?: string },
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    if (!context.isOwner && !['owner', 'admin', 'supervisor'].includes(context.role)) {
      throw new ForbiddenException('Apenas supervisor e acima podem mover etapas.')
    }

    const state = String(body?.state || '').trim()
    return this.conversationService.updateConversationState({
      workspaceId,
      conversationId,
      state,
    })
  }

  @Patch('/:conversationId/assignment')
  async assignConversation(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { assignedTo?: string },
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    if (!context.isOwner && !['owner', 'admin', 'supervisor'].includes(context.role)) {
      throw new ForbiddenException('Apenas supervisor e acima podem reatribuir conversas.')
    }

    const assignedTo = String(body?.assignedTo || '').trim()
    if (!assignedTo) throw new BadRequestException('assignedTo e obrigatorio.')

    return this.conversationService.assignConversation({
      workspaceId,
      conversationId,
      assignedTo,
      assignedBy: context.user.id,
    })
  }

  @Post('/:conversationId/close')
  async closeConversation(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.conversationService.closeConversation({
      workspaceId,
      conversationId,
      userId: context.user.id,
      role: context.role,
    })
  }

  @Post('/:conversationId/handoff/takeover')
  async takeoverConversation(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.conversationService.takeoverConversation({
      workspaceId,
      conversationId,
      userId: context.user.id,
      role: context.role,
    })
  }

  @Post('/:conversationId/copilot/reactivate')
  async reactivateCopilot(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.conversationService.reactivateCopilot({
      workspaceId,
      conversationId,
      userId: context.user.id,
      role: context.role,
    })
  }

  @Post('/:conversationId/escalate')
  async escalateConversation(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { reason?: string; note?: string },
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.conversationService.escalateConversation({
      workspaceId,
      conversationId,
      userId: context.user.id,
      role: context.role,
      reason: body?.reason,
      note: body?.note,
    })
  }

  @Get('/:conversationId/handoff-history')
  async getHandoffHistory(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.conversationService.getHandoffHistory({
      workspaceId,
      conversationId,
      userId: context.user.id,
      role: context.role,
    })
  }
}
