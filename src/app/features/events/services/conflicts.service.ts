import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { runtimeConfig } from '../../../core/config/runtime-config';
import { ApiResponse } from '../../../core/http/api-response.model';
import { OverloadCheckPayload, OverloadCheckRequestDto, OverloadCheckResponseDto, OverloadCheckResult } from '../models/conflict.model';

@Injectable({
  providedIn: 'root'
})
export class ConflictsService {
  private readonly http = inject(HttpClient);
  private readonly base = runtimeConfig.apiUrl;

  /** Previsualiza sobrecarga para una subtarea sin guardar el cambio (ver conflictos.md). */
  checkOverload(subtaskId: string, payload: OverloadCheckPayload): Observable<OverloadCheckResult> {
    const body: OverloadCheckRequestDto = {
      fechaObjetivo: payload.targetDate,
      horasEstimadas: payload.estimatedHours
    };
    return this.http
      .post<ApiResponse<OverloadCheckResponseDto>>(
        `${this.base}/subtasks/${subtaskId}/conflicts/overload`,
        body
      )
      .pipe(
        map((response) => ({
          exceeds: response.data.conflict,
          plannedHours: response.data.plannedHours,
          limitHours: response.data.limitHours,
          exceedsBy: response.data.exceedsBy
        }))
      );
  }
}
