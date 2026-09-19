export const runtimeConfig = {
  apiUrl: 'http://localhost:8080/api',
  /**
   * Valor por defecto que usa la UI antes de que responda `GET /api/capacity`
   * (ver capacidad.md); el backend aplica el mismo default (6h) cuando el
   * organizador no tiene configuración guardada.
   */
  defaultDailyLimitHours: 6
};
