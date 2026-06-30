import { Body, Controller, ForbiddenException, Get, Headers, Param, Patch, Post } from '@nestjs/common'
import { WorkspaceSetupDto } from '../dto/workspace-setup.dto'
import { AccessService } from '../services/access.service'
import { ProvisioningService } from '../services/provisioning.service'
import { AiAssistService } from '../services/ai-assist.service'

@Controller()
export class WorkspaceController {
  constructor(
    private readonly accessService: AccessService,
    private readonly provisioningService: ProvisioningService,
    private readonly aiAssistService: AiAssistService,
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

  @Get('/workspace/ai-config')
  async getActiveWorkspaceAiConfig(@Headers('authorization') authorization: string | undefined) {
    const context = await this.accessService.resolveRequestContext(authorization)
    const workspaceId = context.activeWorkspaceId
    if (!workspaceId) throw new ForbiddenException('Workspace ativo nao encontrado.')
    await this.accessService.assertWorkspaceAccess(context, workspaceId)

    return this.aiAssistService.getWorkspaceConfig(workspaceId)
  }

  @Patch('/workspace/ai-config')
  async updateActiveWorkspaceAiConfig(
    @Headers('authorization') authorization: string | undefined,
    @Body() body: Record<string, any>,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    const workspaceId = context.activeWorkspaceId
    if (!workspaceId) throw new ForbiddenException('Workspace ativo nao encontrado.')
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    if (!context.isOwner && !['owner', 'admin'].includes(context.role)) {
      throw new ForbiddenException('Apenas admin e owner podem editar a configuracao de IA.')
    }

    return this.aiAssistService.updateWorkspaceConfig(workspaceId, {
      script_template: String(body?.script_template ?? body?.scriptTemplate ?? '').slice(0, 2000),
    })
  }
}
