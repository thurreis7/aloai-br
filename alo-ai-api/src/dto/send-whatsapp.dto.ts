import { IsOptional, IsString } from 'class-validator'

export class SendWhatsappDto {
  @IsString()
  phone!: string

  @IsString()
  text!: string

  @IsString()
  instance!: string

  @IsOptional()
  @IsString()
  workspaceId?: string
}
