// src/auth/jwt.strategy.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    const issuer = config.get<string>('KEYCLOAK_ISSUER');
    if (!issuer) throw new InternalServerErrorException('Missing KEYCLOAK_ISSUER');

    // si no te pasan KEYCLOAK_JWKS_URI, lo derivamos del issuer
    const jwksUri =
      config.get<string>('KEYCLOAK_JWKS_URI') ??
      new URL('/protocol/openid-connect/certs', issuer).toString();

    const audience = config.get<string>('KEYCLOAK_AUDIENCE'); // opcional

    if (!jwksUri) throw new InternalServerErrorException('Missing JWKS URI');

    const opts: StrategyOptions = {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      algorithms: ['RS256'],
      issuer,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri,
      }),
      ignoreExpiration: false,
    };

    if (audience) (opts as any).audience = audience;

    super(opts);
  }

  async validate(payload: any) {
    return payload;
  }
}