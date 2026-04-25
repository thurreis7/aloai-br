import { IsIn, IsOptional, IsString } from 'class-validator'

export class CreateUserDto {
  @IsOptional()
  @IsString()
  companyId?: string

  @IsOptional()
  @IsString()
  workspaceId?: string

  @IsString()
  fullName!: string

  @IsString()
  email!: string

  @IsString()
  password!: string

  @IsOptional()
  @IsIn(['owner', 'admin', 'supervisor', 'agent'])
  role?: string
}
