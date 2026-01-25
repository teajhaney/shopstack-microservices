import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { UserContext } from './auth.types';

interface RequestWithUser extends Request {
  user?: UserContext;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): UserContext | undefined => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
