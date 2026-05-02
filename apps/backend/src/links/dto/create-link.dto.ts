import { MaxLength } from 'class-validator';
import { IsShortableUrl } from './is-shortable-url.decorator.js';

export class CreateLinkDto {
  @IsShortableUrl()
  @MaxLength(2048)
  originalUrl!: string;
}
