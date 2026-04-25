import { Module } from '@nestjs/common'
import { AppController } from './controllers/app.controller'
import { AuthController } from './controllers/auth.controller'
import { WorkspaceController } from './controllers/workspace.controller'
import { ChannelController } from './controllers/channel.controller'
import { CompatibilityController } from './controllers/compatibility.controller'
import { ConversationController } from './controllers/conversation.controller'
import { SupabaseService } from './services/supabase.service'
import { AccessService } from './services/access.service'
import { ProvisioningService } from './services/provisioning.service'
import { MessagingService } from './services/messaging.service'
import { ConversationService } from './services/conversation.service'

@Module({
  imports: [],
  controllers: [
    AppController,
    AuthController,
    WorkspaceController,
    ChannelController,
    CompatibilityController,
    ConversationController,
  ],
  providers: [
    SupabaseService,
    AccessService,
    ProvisioningService,
    MessagingService,
    ConversationService,
  ],
})
export class AppModule {}
