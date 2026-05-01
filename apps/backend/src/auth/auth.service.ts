import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AppConfig } from '../app.config.js';
import { generateKeyPair, exportJWK, importJWK, type JWK } from 'jose';
import {
  discovery,
  allowInsecureRequests,
  buildAuthorizationUrlWithPAR,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
  randomState,
  randomNonce,
  authorizationCodeGrant,
  getDPoPHandle,
  enableDecryptingResponses,
  modifyAssertion,
  PrivateKeyJwt,
  type Configuration,
} from 'openid-client';
import { PrismaService } from '../database/prisma.service.js';

const DPOP_EXPIRY_SECONDS = 120;

@Injectable()
export class AuthService implements OnModuleInit {
  private signingKeyPair!: {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
  };
  private encKeyPair!: {
    publicKey: CryptoKey;
    privateKey: CryptoKey;
  };
  private jwks!: object;
  private oidcConfig!: Configuration;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    const [sigPair, encPair] = await Promise.all([
      generateKeyPair('ES256', { extractable: true }),
      generateKeyPair('ECDH-ES+A256KW', { crv: 'P-256', extractable: true }),
    ]);
    this.signingKeyPair = {
      publicKey: sigPair.publicKey as CryptoKey,
      privateKey: sigPair.privateKey as CryptoKey,
    };
    this.encKeyPair = {
      publicKey: encPair.publicKey as CryptoKey,
      privateKey: encPair.privateKey as CryptoKey,
    };

    const [sigJwk, encJwk] = await Promise.all([
      exportJWK(this.signingKeyPair.publicKey),
      exportJWK(this.encKeyPair.publicKey),
    ]);
    this.jwks = {
      keys: [
        { ...sigJwk, alg: 'ES256', use: 'sig', kid: 'sig-key-1' },
        { ...encJwk, alg: 'ECDH-ES+A256KW', use: 'enc', kid: 'enc-key-1' },
      ],
    };

    const { issuer, clientId } =
      this.configService.getOrThrow<AppConfig>('app').mockpass;
    this.oidcConfig = await discovery(
      new URL(issuer),
      clientId,
      undefined,
      PrivateKeyJwt({ key: this.signingKeyPair.privateKey, kid: 'sig-key-1' }),
      { execute: [allowInsecureRequests] },
    );
    allowInsecureRequests(this.oidcConfig);

    enableDecryptingResponses(this.oidcConfig, ['A256GCM', 'A256CBC-HS512'], {
      key: this.encKeyPair.privateKey,
      alg: 'ECDH-ES+A256KW',
      kid: 'enc-key-1',
    });
  }

  getPublicJwks() {
    return this.jwks;
  }

  async buildLoginUrl() {
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const state = randomState();
    const nonce = randomNonce();

    const dpopKeys = await this.createDpopKeyPair();
    const dpopOptions = await this.getDpopOptions(dpopKeys);

    const url = await buildAuthorizationUrlWithPAR(
      this.oidcConfig,
      {
        response_type: 'code',
        redirect_uri:
          this.configService.getOrThrow<AppConfig>('app').mockpass.redirectUri,
        scope: 'openid',
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      },
      dpopOptions,
    );

    return {
      url: url.toString(),
      state,
      nonce,
      codeVerifier,
      dpopKeys,
    };
  }

  async handleCallback(
    callbackUrl: string,
    codeVerifier: string,
    expectedState: string,
    expectedNonce: string,
    dpopKeys: { privateJwk: JWK; publicJwk: JWK },
  ) {
    const dpopOptions = await this.getDpopOptions(dpopKeys);

    const tokens = await authorizationCodeGrant(
      this.oidcConfig,
      new URL(callbackUrl),
      {
        pkceCodeVerifier: codeVerifier,
        expectedState,
        expectedNonce,
        idTokenExpected: true,
      },
      undefined,
      dpopOptions,
    );

    const claims = tokens.claims()!;
    const subAttrs = claims['sub_attributes'] as { name?: string } | undefined;
    const name = subAttrs?.name ?? null;

    const user = await this.prisma.user.upsert({
      where: { sub: claims.sub! },
      update: { name },
      create: { sub: claims.sub!, name },
    });

    const sessionToken = await this.jwtService.signAsync({
      sub: user.id,
      singpassSub: claims.sub,
    });

    return { user, sessionToken };
  }

  findUserById(id: string) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  private async createDpopKeyPair() {
    const dpopPair = await generateKeyPair('ES256', { extractable: true });
    const [privateJwk, publicJwk] = await Promise.all([
      exportJWK(dpopPair.privateKey),
      exportJWK(dpopPair.publicKey),
    ]);
    return { privateJwk, publicJwk };
  }

  private async getDpopOptions(dpopKeys: { privateJwk: JWK; publicJwk: JWK }) {
    const [dpopPrivateKey, dpopPublicKey] = (await Promise.all([
      importJWK(dpopKeys.privateJwk, 'ES256'),
      importJWK(dpopKeys.publicJwk, 'ES256'),
    ])) as [CryptoKey, CryptoKey];

    return {
      DPoP: getDPoPHandle(
        this.oidcConfig,
        { privateKey: dpopPrivateKey, publicKey: dpopPublicKey },
        {
          [modifyAssertion]: (
            _header: object,
            payload: Record<string, unknown>,
          ) => {
            if (typeof payload.iat === 'number')
              payload.exp = payload.iat + DPOP_EXPIRY_SECONDS;
          },
        },
      ),
    };
  }
}
