import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiOkResponse, ApiProduces, ApiTags } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { VisitReportQueryDto } from './dto/visit-report-query.dto';
import type { Response } from 'express';

@ApiTags('reports')
@Controller('reports')
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('visits')
  @ApiOkResponse({ description: 'Listado y resumen de visitas en formato JSON' })
  async visits(@Query() query: VisitReportQueryDto) {
    return this.reports.getVisitsReport(query);
  }

  @Get('visits/pdf')
  @ApiProduces('application/pdf')
  async visitsPdf(@Query() query: VisitReportQueryDto, @Res() res: Response) {
    const { filename, buffer } = await this.reports.getVisitsReportPdf(query);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(buffer);
  }
}
