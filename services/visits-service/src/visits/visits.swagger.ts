import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

export const VisitsTag = () => applyDecorators(ApiTags('Visits'), ApiBearerAuth());