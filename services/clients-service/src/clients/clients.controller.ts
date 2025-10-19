import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles.decorator';
import { RolesGuard } from 'src/auth/roles.guard';
import { Public } from 'src/auth/public.decorator'; //

@ApiTags('clients')
@ApiBearerAuth('access-token') // <-- habilita "Authorize" en Swagger
@Controller('clients')
@UseGuards(JwtAuthGuard, RolesGuard) // <-- TODOS los endpoints requieren JWT; Roles según decorador
export class ClientsController {
  constructor(private readonly service: ClientsService) {}

  // Opcional: endpoint público para health (no requiere token)
  @Public()
  @Get('healthz')
  healthz() {
    return { ok: true };
  }

  // Cualquier usuario autenticado puede listar
  @Get()
  @ApiOkResponse({ description: 'List clients (paginated)' })
  findAll(@Query() q: QueryClientDto) {
    return this.service.findAll(q);
  }

  // Cualquier usuario autenticado puede ver detalle
  @Get(':id')
  @ApiOkResponse({ description: 'Get client by id' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Solo ADMIN o SUPERVISOR pueden crear
  @Post()
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiCreatedResponse({ description: 'Client created' })
  create(@Body() dto: CreateClientDto) {
    return this.service.create(dto);
  }

  // Solo ADMIN o SUPERVISOR pueden actualizar
  @Patch(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOkResponse({ description: 'Update client' })
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.service.update(id, dto);
  }

  // Solo ADMIN o SUPERVISOR pueden eliminar
  @Delete(':id')
  @Roles('ADMIN', 'SUPERVISOR')
  @ApiOkResponse({ description: 'Delete client' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
