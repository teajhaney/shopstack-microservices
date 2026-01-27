import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

// export function mapRpcErrorToHttp(error: unknown) {
//   const payload = error?.error ?? error;
//   const code = payload?.code as string | undefined;
//   const message = payload?.message ?? 'Request failed';

//   if (code === 'VALIDATION_ERROR' || code === 'BAD_REQUEST') {
//     throw new BadRequestException(message);
//   }
//   if (code === 'UNAUTHORIZED') {
//     throw new UnauthorizedException(message);
//   }
//   if (code === 'FORBIDDEN') {
//     throw new ForbiddenException(message);
//   }
//   if (code === 'NOT_FOUND') {
//     throw new NotFoundException(message);
//   }

//   throw new InternalServerErrorException(message);
// }

export function mapRpcErrorToHttp(error: unknown): never {
  const payload = unwrapRpcPayload(error);

  if (isRpcErrorLike(payload)) {
    const code = typeof payload.code === 'string' ? payload.code : undefined;
    const message =
      typeof payload.message === 'string' ? payload.message : 'Request failed';

    if (code === 'VALIDATION_ERROR' || code === 'BAD_REQUEST') {
      throw new BadRequestException(payload.details ?? message);
    }
    if (code === 'UNAUTHORIZED') {
      throw new UnauthorizedException(message);
    }
    if (code === 'FORBIDDEN') {
      throw new ForbiddenException(message);
    }
    if (code === 'NOT_FOUND') {
      throw new NotFoundException(message);
    }

    throw new InternalServerErrorException(message);
  }

  // Completely unknown error shape
  throw new InternalServerErrorException('Request failed');
}

export type RpcErrorLike = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
};

export function isRpcErrorLike(value: unknown): value is RpcErrorLike {
  return typeof value === 'object' && value !== null;
}

export function unwrapRpcPayload(error: unknown): unknown {
  if (typeof error === 'object' && error !== null && 'error' in error) {
    return (error as { error: unknown }).error;
  }

  return error;
}
