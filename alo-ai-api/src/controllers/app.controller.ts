import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get('/health')
  getHealth() {
    return {
      status: 'ok',
      ts: new Date().toISOString(),
      framework: 'nestjs-fastify',
    }
  }
}
