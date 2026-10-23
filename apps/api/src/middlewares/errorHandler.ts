import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import type { ApiErrorResponse } from '../types/api.ts';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  request.log.error(error);

  const statusCode = error.statusCode || 500;
  const response: ApiErrorResponse = {
    error: error.message || 'Internal Server Error',
    statusCode,
    timestamp: new Date().toISOString(),
    details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  };

  reply.status(statusCode).send(response);
}
