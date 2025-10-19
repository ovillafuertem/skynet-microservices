import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import jwksRsa from 'jwks-rsa';

function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env ${name}`);
  return v;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    //console.log('[JwtStrategy] Inicializada con issuer', process.env.KEYCLOAK_ISSUER);
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      issuer: required('KEYCLOAK_ISSUER'),
      algorithms: ['RS256'],
      secretOrKeyProvider: jwksRsa.passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 10,
        jwksUri: `${required('KEYCLOAK_ISSUER')}/protocol/openid-connect/certs`,
        
      }),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    const roles = payload?.realm_access?.roles ?? [];
    return {
      sub: payload.sub,
      roles,
      preferred_username: payload.preferred_username,
      email: payload.email,
      realm_access: payload.realm_access,
    };
  }
}
