import { ArgumentsHost, Catch, HttpException } from '@nestjs/common';
import { BaseRpcExceptionFilter, RpcException } from '@nestjs/microservices';
import { Request, Response } from 'express';
import { RpcErrorPayLoad } from './rpc.types';

// A global exception filter to catch all exceptions and convert them to RpcExceptions
// thisfilter runs in the context of microservices to ensure consistent error handling
// our payload structure should follow the RpcErrorPayLoad interface we want
@Catch()
export class RpcAllExceptionsFilter extends BaseRpcExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    if (exception instanceof RpcException) {
      return super.catch(exception, host);
    }

    console.error('[RpcAllExceptionsFilter] Exception caught:', exception);

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : exception?.status || 500;

    const message =
      exception instanceof Error
        ? exception.message
        : typeof exception === 'string'
          ? exception
          : 'Internal Error';

    // Sanitize response/details to avoid circular references (like RMQ Channels)
    let details: any = undefined;
    if (exception instanceof HttpException) {
      const resp = exception.getResponse();
      details = typeof resp === 'object' ? resp : { message: resp };
    } else if (exception instanceof Error) {
      details = {
        message: exception.message,
        stack: exception.stack,
      };
    } else {
      details = exception;
    }

    const payload: RpcErrorPayLoad = {
      code: status === 400 ? 'VALIDATION_ERROR' : 'INTERNAL',
      message: status === 400 ? 'validation failed' : message,
      details,
    };

    return super.catch(new RpcException(payload), host);
  }
}
