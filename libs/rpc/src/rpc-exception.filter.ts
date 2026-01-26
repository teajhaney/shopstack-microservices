import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { RpcErrorPayLoad } from './rpc.types';

// A global exception filter to catch all exceptions and convert them to RpcExceptions
// thisfilter runs in the context of microservices to ensure consistent error handling
// our payload structure should follow the RpcErrorPayLoad interface we want
@Catch()
export class RpcAllExceptionsFilter extends BaseRpcExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    if (exception instanceof RpcException) {
      return super.catch(exception, host);
    }
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception?.getStatus?.();

    if (status === 400) {
      const payload: RpcErrorPayLoad = {
        code: 'VALIDATION_ERROR',
        message: 'validation failed',
        details: response,
      };
      return super.catch(new RpcException(payload), host);
    }

    const payload: RpcErrorPayLoad = {
      code: 'INTERNAL',
      message: 'Internal Error',
      details: exception,
    };
    return super.catch(new RpcException(payload), host);
  }
}
