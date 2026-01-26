export type RpcErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INTERNAL'
  | 'VALIDATION_ERROR';

export type RpcErrorPayLoad = {
  code: RpcErrorCode;
  message: string;
  details?: unknown;
};
