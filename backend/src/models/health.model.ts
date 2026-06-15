import * as zod from 'zod';

/**
 * @summary Health check
 */
export const HealthCheckResponse = zod.object({
  "status": zod.string()
})
