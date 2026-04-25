import { Body, Controller, ForbiddenException, Headers, Param, Post } from '@nestjs/common'
import { AccessService } from '../services/access.service'
import { RoutingService } from '../services/routing.service'

@Controller('/workspaces/:workspaceId/routing')
export class RoutingController {
  constructor(
    private readonly accessService: AccessService,
    private readonly routingService: RoutingService,
  ) {}

  private assertWorkspaceAndConversationIds(workspaceId: string, conversationId: string) {
    this.accessService.assertUuid(workspaceId, 'workspaceId')
    this.accessService.assertUuid(conversationId, 'conversationId')
  }

  @Post('/conversations/:conversationId/classify')
  async classifyConversation(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
  ) {
    this.assertWorkspaceAndConversationIds(workspaceId, conversationId)
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.routingService.classifyConversation({
      workspaceId,
      conversationId,
      role: context.role,
    })
  }

  @Post('/conversations/:conversationId/recommend')
  async recommendRouting(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
  ) {
    this.assertWorkspaceAndConversationIds(workspaceId, conversationId)
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.routingService.recommendRouting({
      workspaceId,
      conversationId,
      role: context.role,
    })
  }

  @Post('/conversations/:conversationId/apply')
  async applyRouting(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
    @Body()
    body: {
      queue?: string
      intent?: string
      priority?: string
      reason?: string
    },
  ) {
    this.assertWorkspaceAndConversationIds(workspaceId, conversationId)
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    if (!context.isOwner && !['owner', 'admin', 'supervisor'].includes(context.role)) {
      throw new ForbiddenException('Apenas supervisor e acima podem aplicar roteamento.')
    }

    return this.routingService.applyRouting({
      workspaceId,
      conversationId,
      role: context.role,
      manual: body || {},
    })
  }
}
