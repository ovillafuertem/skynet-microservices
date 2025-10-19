import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { ReportsService } from '../src/reports/reports.service';
import { writeFileSync } from 'fs';
import { join } from 'path';

async function run() {
  const context = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn'],
  });

  try {
    const reports = context.get(ReportsService);
    const { filename, buffer } = await reports.getVisitsReportPdf({});
    const out = join(process.cwd(), `tmp-${filename}`);
    writeFileSync(out, buffer);
    // eslint-disable-next-line no-console
    console.log(`Reporte generado en ${out}`);
  } finally {
    await context.close();
  }
}

run().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
