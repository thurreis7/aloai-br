import { Body, Controller, Get, Headers, Param, Post } from '@nestjs/common'
import { WorkspaceSetupDto } from '../dto/workspace-setup.dto'
import { AccessService } from '../services/access.service'
import { ProvisioningService } from '../services/provisioning.service'

@Controller()
export class WorkspaceController {
  constructor(
    private readonly accessService: AccessService,
    private readonly provisioningService: ProvisioningService,
  ) {}

  @Get('/admin/workspaces')
  async listWorkspacesCompat(@Headers('authorization') authorization?: string) {
    await this.accessService.requireOwner(authorization)
    return { workspaces: await this.provisioningService.listWorkspaces() }
  }

  @Get('/workspaces')
  async listWorkspaces(@Headers('authorization') authorization?: string) {
    const context = await this.accessService.resolveRequestContext(authorization)
    if (context.isOwner) {
      return { workspaces: await this.provisioningService.listWorkspaces() }
    }

    return {
      workspaces: (await this.provisioningService.listWorkspaces()).filter((item) =>
        context.workspaceIds.includes(item.id),
      ),
    }
  }

  @Post('/workspace/setup')
  async setupWorkspaceCompat(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: WorkspaceSetupDto,
  ) {
    const context = await this.accessService.requireOwner(authorization)
    return this.provisioningService.setupWorkspace({
      ...body,
      ownerId: context.user.id,
    })
  }

  @Post('/workspaces')
  async setupWorkspace(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: WorkspaceSetupDto,
  ) {
    const context = await this.accessService.requireOwner(authorization)
    return this.provisioningService.setupWorkspace({
      ...body,
      ownerId: context.user.id,
    })
  }

  @Get('/workspaces/:workspaceId')
  async getWorkspace(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    const workspace = (await this.provisioningService.listWorkspaces()).find((item) => item.id === workspaceId)
    return { workspace: workspace || null }
  }
}
