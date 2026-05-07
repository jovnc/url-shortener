import {
  IsISO8601,
  IsOptional,
  IsUrl,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateLinkDto {
  @IsUrl()
  @MaxLength(2048)
  originalUrl!: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;

  @IsOptional()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[0-9a-zA-Z-]+$/, {
    message: 'customShortCode may only contain letters, numbers, and hyphens',
  })
  customShortCode?: string;
}
