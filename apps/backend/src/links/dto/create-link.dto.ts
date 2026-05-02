import { IsISO8601, IsOptional, MaxLength } from 'class-validator';
import { IsShortableUrl } from './is-shortable-url.decorator.js';

export class CreateLinkDto {
  @IsShortableUrl()
  @MaxLength(2048)
  originalUrl!: string;

  @IsOptional()
  @IsISO8601()
  expiresAt?: string;
}
