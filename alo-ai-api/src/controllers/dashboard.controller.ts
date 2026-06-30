import { Controller, Get, Headers, Param } from '@nestjs/common'
import { AccessService } from '../services/access.service'
import { DashboardService } from '../services/dashboard.service'

@Controller('/workspaces/:workspaceId/dashboard')
export class DashboardController {
  constructor(
    private readonly accessService: AccessService,
    private readonly dashboardService: DashboardService,
  ) {}

  @Get('/agent-performance')
  async getAgentPerformance(
    @Headers('authorization') authorization: string | undefined,
    @Param('workspaceId') workspaceId: string,
  ) {
    const context = await this.accessService.resolveRequestContext(authorization)
    await this.accessService.assertWorkspaceAccess(context, workspaceId)
    return this.dashboardService.getAgentPerformance(workspaceId)
  }
}
