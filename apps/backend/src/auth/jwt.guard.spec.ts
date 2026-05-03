/* eslint-disable @typescript-eslint/no-unsafe-argument, @typescript-eslint/unbound-method */
import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { JwtGuard } from './jwt.guard.js';

interface JwtServiceMock {
  verify(token: string): unknown;
}

describe('JwtGuard', () => {
  const createContext = (req: Record<string, unknown>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => req,
      }),
    }) as ExecutionContext;

  it('attaches the verified session payload to the request', () => {
    const jwtService = mock<JwtServiceMock>();
    jwtService.verify.mockReturnValue({ sub: 'user-id' });
    const req = { cookies: { session: 'token' } };
    const guard = new JwtGuard(jwtService as any);

    expect(guard.canActivate(createContext(req))).toBe(true);
    expect(jwtService.verify).toHaveBeenCalledWith('token');
    expect(req).toMatchObject({ user: { sub: 'user-id' } });
  });

  it('rejects missing or invalid sessions', () => {
    const jwtService = mock<JwtServiceMock>();
    jwtService.verify.mockImplementation(() => {
      throw new Error('bad token');
    });
    const guard = new JwtGuard(jwtService as any);

    expect(() => guard.canActivate(createContext({ cookies: {} }))).toThrow(
      UnauthorizedException,
    );
    expect(() =>
      guard.canActivate(createContext({ cookies: { session: 'bad' } })),
    ).toThrow(UnauthorizedException);
  });
});
