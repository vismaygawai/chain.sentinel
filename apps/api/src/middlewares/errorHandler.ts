import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { ApiErrorResponse } from '../types/api.ts';
import { ENV } from '../config/env.ts';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    request.log.error(error);
  } else {
    request.log.warn({ msg: error.message, statusCode });
  }

  const response: ApiErrorResponse = {
    error: error.message || 'Internal Server Error',
    statusCode,
    timestamp: new Date().toISOString(),
    details: ENV.NODE_ENV === 'development' ? error.stack : undefined,
  };

  reply.status(statusCode).send(response);
}
