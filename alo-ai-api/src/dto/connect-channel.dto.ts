import { IsObject, IsOptional, IsString } from 'class-validator'

export class ConnectChannelDto {
  @IsString()
  type!: string

  @IsOptional()
  @IsObject()
  config?: Record<string, any>
}
