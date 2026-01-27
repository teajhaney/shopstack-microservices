import { RpcException } from '@nestjs/microservices';
import { RpcErrorPayLoad } from './rpc.types';

export function rpcBadRequest(message: string, details?: unknown): never {
  const errorPayload: RpcErrorPayLoad = {
    code: 'BAD_REQUEST',
    message,
    details,
  };
  throw new RpcException(errorPayload);
}

export function rpcUnauthorized(message: string, details?: unknown): never {
  const errorPayload: RpcErrorPayLoad = {
    code: 'UNAUTHORIZED',
    message,
    details,
  };
  throw new RpcException(errorPayload);
}

export function rpcForbidden(message: 'forbidden', details?: unknown): never {
  const errorPayload: RpcErrorPayLoad = {
    code: 'FORBIDDEN',
    message,
    details,
  };
  throw new RpcException(errorPayload);
}

export function rpcNotFound(message: string, details?: unknown): never {
  const errorPayload: RpcErrorPayLoad = {
    code: 'NOT_FOUND',
    message,
    details,
  };
  throw new RpcException(errorPayload);
}

export function rpcInternal(message: 'Internal Error', details?: unknown): never {
  const errorPayload: RpcErrorPayLoad = {
    code: 'INTERNAL',
    message,
    details,
  };
  throw new RpcException(errorPayload);
}

export function rpcValidationError(message: string, details?: unknown): never {
  const errorPayload: RpcErrorPayLoad = {
    code: 'VALIDATION_ERROR',
    message,
    details,
  };
  throw new RpcException(errorPayload);
}

