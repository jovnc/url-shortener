import { registerDecorator, type ValidationOptions } from 'class-validator';

function validate(value: unknown): boolean {
  if (typeof value !== 'string') return false;
  if (value.trim() !== value) return false;
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    return false;
  }
  return parsed.protocol === 'http:' || parsed.protocol === 'https:';
}

export function IsShortableUrl(options?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsShortableUrl',
      target: object.constructor,
      propertyName,
      options: {
        message:
          'originalUrl must be an absolute http or https URL without leading or trailing whitespace',
        ...options,
      },
      validator: { validate },
    });
  };
}
