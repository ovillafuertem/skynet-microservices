import { Injectable, ConflictException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../../../prisma/prisma.service';
//import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class IdempotencyService {
    constructor(private prisma: PrismaService) { }

    hash(key: string) { return crypto.createHash('sha256').update(key).digest('hex'); }

    async ensureOnce(idemKey: string | undefined, fingerprint: string) {
        if (!idemKey) return; // en dev podemos no exigir
        const hash = this.hash(idemKey);
        const existing = await this.prisma.visitCheck.findUnique({ where: { idemKeyHash: hash } });
        if (existing) {
            // si ya existe, validar que el fingerprint coincida; si no, 409
            const same = existing.notes === fingerprint; // simplificado; puedes almacenar fingerprint real
            if (!same) throw new ConflictException('Idempotency key reused with different payload');
            // caso igual -> no lanzar excepción; controller devolverá existing
        }
    }
}