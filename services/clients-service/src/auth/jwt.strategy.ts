// src/auth/jwt.strategy.ts
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';

const readOptional = (config: ConfigService, key: string): string | undefined =>
  config.get<string>(key) ?? process.env[key];

const readRequired = (config: ConfigService, key: string): string => {
  const value = readOptional(config, key);
  if (!value) throw new InternalServerErrorException(`Missing ${key}`);
  return value;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly config: ConfigService) {
    const issuer = readRequired(config, 'KEYCLOAK_ISSUER');

    // si no pasan KEYCLOAK_JWKS_URI, lo derivamos del issuer
    const jwksUri =
      readOptional(config, 'KEYCLOAK_JWKS_URI') ??
      new URL('/protocol/openid-connect/certs', issuer).toString();

    const audience = readOptional(config, 'KEYCLOAK_AUDIENCE'); // opcional

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
