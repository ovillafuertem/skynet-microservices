import { execSync } from 'child_process';

// Prepara una DB SQLite en memoria/archivo temporal antes de correr e2e.
beforeAll(() => {
  process.env.TEST_DATABASE_URL = 'file:./test.db'; // se crea en /services/clients-service
  // Genera cliente Prisma contra el schema de test y aplica el modelo.
  execSync('npx prisma generate --schema=prisma/schema.test.prisma', { stdio: 'inherit' });
  // Usamos db push para rapidez (no migrations en test).
  execSync('npx prisma db push --schema=prisma/schema.test.prisma', { stdio: 'inherit' });
});
