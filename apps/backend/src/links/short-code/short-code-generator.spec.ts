import { ServiceUnavailableException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { ShortCodeGenerator } from './short-code-generator.js';
import type { CounterStore } from './counter-store.js';

describe('ShortCodeGenerator', () => {
  // Helper function to create a generator instance with mocked dependencies
  const createGenerator = () => {
    const counterStore = mock<CounterStore>();
    return {
      counterStore,
      generator: new ShortCodeGenerator(counterStore),
    };
  };

  it('encodes the counter value as a Base62 short code', async () => {
    const { generator, counterStore } = createGenerator();
    counterStore.next.mockResolvedValue(62 ** 5);

    await expect(generator.next()).resolves.toBe('baaaaa');
  });

  it('wraps counter store failures as service unavailable', async () => {
    const { generator, counterStore } = createGenerator();
    counterStore.next.mockRejectedValue(new Error('redis down'));

    await expect(generator.next()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('propagates ServiceUnavailableException from the counter store unchanged', async () => {
    const { generator, counterStore } = createGenerator();
    counterStore.next.mockRejectedValue(
      new ServiceUnavailableException('counter not initialized'),
    );

    await expect(generator.next()).rejects.toThrow('counter not initialized');
  });
});
