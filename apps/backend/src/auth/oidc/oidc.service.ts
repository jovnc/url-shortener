import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AppConfig } from '../../app.config.js';
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

export interface IdentityClaim {
  sub: string;
  name: string | null;
}

const DPOP_EXPIRY_SECONDS = 120;

@Injectable()
export class OidcService implements OnModuleInit {
  private signingKeyPair!: { publicKey: CryptoKey; privateKey: CryptoKey };
  private encKeyPair!: { publicKey: CryptoKey; privateKey: CryptoKey };
  private jwks!: object;
  private oidcConfig?: Configuration;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const [sigPair, encPair] = await Promise.all([
      generateKeyPair('ES256', { extractable: true }),
      generateKeyPair('ECDH-ES+A256KW', { crv: 'P-256', extractable: true }),
    ]);
    this.signingKeyPair = {
      publicKey: sigPair.publicKey,
      privateKey: sigPair.privateKey,
    };
    this.encKeyPair = {
      publicKey: encPair.publicKey,
      privateKey: encPair.privateKey,
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
  }

  getPublicJwks() {
    return this.jwks;
  }

  async buildLoginUrl() {
    const oidcConfig = await this.getOidcConfig();
    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
    const state = randomState();
    const nonce = randomNonce();

    const dpopKeys = await this.createDpopKeyPair();
    const dpopOptions = await this.getDpopOptions(dpopKeys);

    const url = await buildAuthorizationUrlWithPAR(
      oidcConfig,
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

    return { url: url.toString(), state, nonce, codeVerifier, dpopKeys };
  }

  async handleCallback(
    callbackUrl: string,
    codeVerifier: string,
    expectedState: string,
    expectedNonce: string,
    dpopKeys: { privateJwk: JWK; publicJwk: JWK },
  ): Promise<IdentityClaim> {
    const oidcConfig = await this.getOidcConfig();
    const dpopOptions = await this.getDpopOptions(dpopKeys);

    const tokens = await authorizationCodeGrant(
      oidcConfig,
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
    return {
      sub: claims.sub,
      name: subAttrs?.name ?? null,
    };
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
    const oidcConfig = await this.getOidcConfig();
    const [dpopPrivateKey, dpopPublicKey] = (await Promise.all([
      importJWK(dpopKeys.privateJwk, 'ES256'),
      importJWK(dpopKeys.publicJwk, 'ES256'),
    ])) as [CryptoKey, CryptoKey];

    return {
      DPoP: getDPoPHandle(
        oidcConfig,
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

  private async getOidcConfig() {
    if (this.oidcConfig) return this.oidcConfig;

    const { issuer, clientId } =
      this.configService.getOrThrow<AppConfig>('app').mockpass;
    const oidcConfig = await discovery(
      new URL(issuer),
      clientId,
      undefined,
      PrivateKeyJwt({ key: this.signingKeyPair.privateKey, kid: 'sig-key-1' }),
      { execute: [allowInsecureRequests] },
    );
    allowInsecureRequests(oidcConfig);

    enableDecryptingResponses(oidcConfig, ['A256GCM', 'A256CBC-HS512'], {
      key: this.encKeyPair.privateKey,
      alg: 'ECDH-ES+A256KW',
      kid: 'enc-key-1',
    });

    this.oidcConfig = oidcConfig;
    return oidcConfig;
  }
}
