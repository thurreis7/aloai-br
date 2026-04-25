import { Controller, Get, Headers, Query } from '@nestjs/common'
import { AccessService } from '../services/access.service'

@Controller('/auth')
export class AuthController {
  constructor(private readonly accessService: AccessService) {}

  @Get('/bootstrap')
  async bootstrap(
    @Headers('authorization') authorization?: string,
    @Query('workspace_id') workspaceId?: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)

    if (workspaceId) {
      await this.accessService.assertWorkspaceAccess(context, workspaceId)
    }

    return {
      user: context.user,
      role: context.role,
      is_owner: context.isOwner,
      workspace_id: workspaceId || context.activeWorkspaceId,
      workspace_ids: context.workspaceIds,
      profile: context.profile,
    }
  }
}
