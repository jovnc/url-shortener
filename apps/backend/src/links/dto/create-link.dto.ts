import { IsString, MaxLength } from 'class-validator';

export class CreateLinkDto {
  @IsString()
  @MaxLength(2048)
  originalUrl!: string;
}
