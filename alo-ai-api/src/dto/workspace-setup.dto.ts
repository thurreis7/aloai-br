import { Type } from 'class-transformer'
import { IsArray, IsBoolean, IsIn, IsOptional, IsString, ValidateNested } from 'class-validator'

class TeamMemberDto {
  @IsString()
  name!: string

  @IsOptional()
  @IsString()
  email?: string

  @IsOptional()
  @IsString()
  password?: string

  @IsOptional()
  @IsIn(['owner', 'admin', 'supervisor', 'agent'])
  role?: string
}

export class WorkspaceSetupDto {
  @IsString()
  companyName!: string

  @IsString()
  ownerName!: string

  @IsString()
  channel!: string

  @IsOptional()
  @IsString()
  plan?: string

  @IsOptional()
  @IsBoolean()
  aiEnabled?: boolean

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamMemberDto)
  teamMembers!: TeamMemberDto[]
}
