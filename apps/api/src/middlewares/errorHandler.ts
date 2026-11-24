import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { redactSecrets } from 'agents-core';
import type { ApiErrorResponse } from '../types/api.ts';
import { ENV } from '../config/env.ts';

export function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  const statusCode = error.validation ? 400 : error.statusCode || 500;
  const safeMsg = redactSecrets(error.message || 'Internal Server Error');

  if (statusCode >= 500) {
    request.log.error({ err: safeMsg, statusCode });
  } else {
    request.log.warn({ msg: safeMsg, statusCode });
  }

  const isDev = ENV.NODE_ENV === 'development';
  const publicError =
    statusCode >= 500 && !isDev
      ? 'Internal Server Error'
      : safeMsg;

  const response: ApiErrorResponse = {
    error: publicError,
    statusCode,
    timestamp: new Date().toISOString(),
    details: isDev && error.stack ? redactSecrets(error.stack) : undefined,
  };

  reply.status(statusCode).send(response);
}
