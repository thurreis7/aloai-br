import { Module } from '@nestjs/common'
import { AppController } from './controllers/app.controller'
import { AuthController } from './controllers/auth.controller'
import { WorkspaceController } from './controllers/workspace.controller'
import { ChannelController } from './controllers/channel.controller'
import { ChannelsController } from './controllers/channels.controller'
import { CompatibilityController } from './controllers/compatibility.controller'
import { ConversationController } from './controllers/conversation.controller'
import { AiAssistController } from './controllers/ai-assist.controller'
import { RoutingController } from './controllers/routing.controller'
import { LeadController } from './controllers/lead.controller'
import { DashboardController } from './controllers/dashboard.controller'
import { SupabaseService } from './services/supabase.service'
import { AccessService } from './services/access.service'
import { ProvisioningService } from './services/provisioning.service'
import { ChannelsService } from './services/channels.service'
import { MessagingService } from './services/messaging.service'
import { TranscriptionService } from './services/transcription.service'
import { ConversationService } from './services/conversation.service'
import { AiAssistService } from './services/ai-assist.service'
import { AiContextService } from './services/ai-context.service'
import { RoutingService } from './services/routing.service'
import { LeadService } from './services/lead.service'
import { EvaluationService } from './services/evaluation.service'
import { DashboardService } from './services/dashboard.service'

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    WorkspaceController,
    ChannelController,
    ChannelsController,
    CompatibilityController,
    ConversationController,
    AiAssistController,
    RoutingController,
    LeadController,
    DashboardController,
  ],
  providers: [
    SupabaseService,
    AccessService,
    ProvisioningService,
    ChannelsService,
    MessagingService,
    TranscriptionService,
    ConversationService,
    AiAssistService,
    AiContextService,
    RoutingService,
    LeadService,
    EvaluationService,
    DashboardService,
  ],
})
export class AppModule {}
