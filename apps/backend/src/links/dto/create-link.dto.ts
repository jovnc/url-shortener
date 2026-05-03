import { IsISO8601, IsOptional, Matches, MaxLength, MinLength } from 'class-validator';
import { IsShortableUrl } from './is-shortable-url.decorator.js';

export class CreateLinkDto {
  @IsShortableUrl()
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
