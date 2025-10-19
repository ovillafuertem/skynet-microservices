import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateVisitDto } from './create-visit.dto';

export class BulkCreateVisitDto {
  @ValidateNested({ each: true })
  @Type(() => CreateVisitDto)
  @ArrayMinSize(1)
  items: CreateVisitDto[];
}