import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { CounterStore } from './counter-store.js';

const BASE62_ALPHABET =
  'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const MIN_CODE_LENGTH = 6;

@Injectable()
export class ShortCodeGenerator {
  constructor(private readonly counterStore: CounterStore) {}

  async next(): Promise<string> {
    try {
      const counter = await this.counterStore.next();
      return this.encode(counter);
    } catch (error) {
      if (error instanceof ServiceUnavailableException) throw error;
      throw new ServiceUnavailableException(
        'Short-code counter is unavailable',
      );
    }
  }

  private encode(value: number): string {
    if (value === 0) return BASE62_ALPHABET[0].repeat(MIN_CODE_LENGTH);

    let remaining = value;
    let encoded = '';
    while (remaining > 0) {
      encoded = BASE62_ALPHABET[remaining % 62] + encoded;
      remaining = Math.floor(remaining / 62);
    }

    while (encoded.length < MIN_CODE_LENGTH) {
      encoded = BASE62_ALPHABET[0] + encoded;
    }
    return encoded;
  }
}
