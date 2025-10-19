import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from "../../../../prisma/prisma.service";

@Injectable()
export class VisitOwnershipGuard implements CanActivate {
    constructor(private prisma: PrismaService) { }
    async canActivate(ctx: ExecutionContext) {
        const req = ctx.switchToHttp().getRequest();
        const sub: string | undefined = req.user?.sub;
        const visitId: string = req.params.id;
        const roles: string[] = req.user?.roles ?? req.user?.realm_access?.roles ?? [];

        const normalized = roles.map((role: string) =>
            role.normalize('NFD').replace(/\p{Diacritic}/gu, '').toUpperCase()
        );
        if (normalized.includes('ADMIN') || normalized.includes('SUPERVISOR')) {
            return true;
        }

        if (!sub) {
            throw new ForbiddenException('Missing user identity');
        }

        let technician = await this.prisma.technician.findUnique({ where: { keycloakUserId: sub } });
        if (!technician) {
            const displayName: string = req.user?.preferred_username ?? req.user?.name ?? 'Técnico';
            technician = await this.prisma.technician.create({
                data: {
                    keycloakUserId: sub,
                    displayName,
                    email: req.user?.email ?? null
                }
            });
        }

        const visit = await this.prisma.visit.findUnique({ select: { technicianId: true }, where: { id: visitId } });
        if (!visit) throw new ForbiddenException('Visit not found or inaccessible');
        if (visit.technicianId !== technician.id) throw new ForbiddenException('Not assigned to this visit');
        return true;
    }
}
