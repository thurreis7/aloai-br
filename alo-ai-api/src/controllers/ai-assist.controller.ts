import { Body, Controller, ForbiddenException, Get, Headers, Param, Patch, Post } from '@nestjs/common'
import { AccessService } from '../services/access.service'
import { AiAssistService } from '../services/ai-assist.service'
import { RoutingService } from '../services/routing.service'

@Controller('/workspaces/:workspaceId/ai-assist')
export class AiAssistController {
  constructor(
    private readonly accessService: AccessService,
    private readonly aiAssistService: AiAssistService,
    private readonly routingService: RoutingService,
  ) {}

  @Get('/config')
  async getConfig(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.aiAssistService.getWorkspaceConfig(workspaceId)
  }

  @Patch('/config')
  async updateConfig(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Body() body: Record<string, any>,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    if (!context.isOwner && !['owner', 'admin'].includes(context.role)) {
      throw new ForbiddenException('Apenas owner e admin podem editar a configuracao de IA.')
    }

    return this.aiAssistService.updateWorkspaceConfig(workspaceId, body || {})
  }

  @Post('/conversations/:conversationId/suggest-reply')
  async suggestReply(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.aiAssistService.suggestReply({
      workspaceId,
      conversationId,
      userId: context.user.id,
      role: context.role,
    })
  }

  @Post('/conversations/:conversationId/classify')
  async classifyConversation(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.routingService.classifyConversation({
      workspaceId,
      conversationId,
      role: context.role,
    })
  }

  @Post('/conversations/:conversationId/recommend-routing')
  async recommendRouting(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.routingService.recommendRouting({
      workspaceId,
      conversationId,
      role: context.role,
    })
  }
}
