import { Body, Controller, ForbiddenException, Headers, Param, Patch } from '@nestjs/common'
import { AccessService } from '../services/access.service'
import { LeadService } from '../services/lead.service'

@Controller('/workspaces/:workspaceId/leads')
export class LeadController {
  constructor(
    private readonly accessService: AccessService,
    private readonly leadService: LeadService,
  ) {}

  @Patch('/conversations/:conversationId/qualification')
  async updateConversationQualification(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
    @Param('conversationId') conversationId: string,
    @Body() body: { status?: string; ownerId?: string | null },
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    if (!context.isOwner && !['owner', 'admin', 'supervisor'].includes(context.role)) {
      throw new ForbiddenException('Apenas supervisor e acima podem qualificar leads.')
    }

    return this.leadService.updateConversationQualification({
      workspaceId,
      conversationId,
      status: body?.status,
      ownerId: body?.ownerId,
    })
  }
}

