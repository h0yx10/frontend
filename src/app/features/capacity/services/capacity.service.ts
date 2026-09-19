import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { ApiResponse } from '../../../core/http/api-response.model';
import { CapacidadRequestDto, CapacidadResponseDto, DailyCapacity, DailyCapacityPayload } from '../models/capacity.model';

@Injectable({
  providedIn: 'root'
})
export class CapacityService {
  private readonly http = inject(HttpClient);
  private readonly url = `${runtimeConfig.apiUrl}/capacity`;

  get(): Observable<DailyCapacity> {
    return this.http
      .get<ApiResponse<CapacidadResponseDto>>(this.url)
      .pipe(map((response) => mapCapacityFromDto(response.data)));
  }

  update(payload: DailyCapacityPayload): Observable<DailyCapacity> {
    const body: CapacidadRequestDto = { limiteHoras: payload.dailyLimitHours };
    return this.http
      .put<ApiResponse<CapacidadResponseDto>>(this.url, body)
      .pipe(map((response) => mapCapacityFromDto(response.data)));
  }
}

function mapCapacityFromDto(dto: CapacidadResponseDto): DailyCapacity {
  return { dailyLimitHours: dto.limiteHoras, isDefault: dto.porDefecto, effectiveDate: dto.fecha };
}
