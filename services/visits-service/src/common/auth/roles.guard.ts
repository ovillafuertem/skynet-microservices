import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

const normalize = (s: string) =>
  (s || '')
    .normalize('NFD')                 // separa acentos
    .replace(/[\u0300-\u036f]/g, '')  // quita acentos
    .toUpperCase().trim();            // mayúsculas

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const required = (this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]) ?? []).map(normalize);

    if (required.length === 0) return true;

    const req = ctx.switchToHttp().getRequest();
    const user = req.user || {};

    // Soporta ambas formas: user.roles (puestos por JwtStrategy) o realm_access.roles (crudos del token)
    const tokenRoles: string[] = [
      ...(Array.isArray(user.roles) ? user.roles : []),
      ...(Array.isArray(user.realm_access?.roles) ? user.realm_access.roles : []),
    ].map(normalize);

    return required.some(r => tokenRoles.includes(r));
  }
}
