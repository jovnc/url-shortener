import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { mockDeep } from 'vitest-mock-extended';
import { JwtGuard } from './jwt.guard.js';
import { JwtService } from '@nestjs/jwt/dist/index.js';
import { RedisService } from '../../common/redis/redis.service.js';

describe('JwtGuard', () => {
  const createContext = (req: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as ExecutionContext;

  it('attaches the verified session payload to the request', async () => {
    const jwtService = mockDeep<JwtService>();
    const redis = mockDeep<RedisService>();
    jwtService.verify.mockReturnValue({ sub: 'user-id', jti: 'token-jti' });
    redis.exists.mockResolvedValue(false);
    const req = { cookies: { session: 'token' } };
    const guard = new JwtGuard(jwtService, redis);

    expect(await guard.canActivate(createContext(req))).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('token');
    expect(redis.exists).toHaveBeenCalledWith('blocklist:jti:token-jti');
    expect(req).toMatchObject({ user: { sub: 'user-id' } });
  });

  it('rejects blocklisted tokens', async () => {
    const jwtService = mockDeep<JwtService>();
    const redis = mockDeep<RedisService>();
    jwtService.verify.mockReturnValue({ sub: 'user-id', jti: 'token-jti' });
    redis.exists.mockResolvedValue(true);
    const guard = new JwtGuard(jwtService, redis);

    await expect(
      guard.canActivate(createContext({ cookies: { session: 'token' } })),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejects missing or invalid sessions', async () => {
    const jwtService = mockDeep<JwtService>();
    const redis = mockDeep<RedisService>();
    jwtService.verify.mockImplementation(() => {
      throw new Error('bad token');
    });
    const guard = new JwtGuard(jwtService, redis);

    await expect(
      guard.canActivate(createContext({ cookies: {} })),
    ).rejects.toThrow(UnauthorizedException);
    await expect(
      guard.canActivate(createContext({ cookies: { session: 'bad' } })),
    ).rejects.toThrow(UnauthorizedException);
  });
});
