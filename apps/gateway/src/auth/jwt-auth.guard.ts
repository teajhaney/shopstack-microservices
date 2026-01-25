import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { UsersService } from '../users/user.service';
import { AuthService } from './auth.service';
import { UserContext } from './auth.types';
import { IS_PUBLIC_KEY } from './public.decorator';
import { REQUIRED_ROLE_KEY } from './admin.decorator';

interface RequestWithUser extends Request {
  user?: UserContext;
}

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext) {
    //   if the handler is marked as public, allow access
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithUser>();
    const authorization = request.headers['authorization'];

    if (!authorization || typeof authorization !== 'string') {
      throw new UnauthorizedException(
        'Missing or invalid Authorization header',
      );
    }
    //extract token from Bearer scheme
    const token = authorization.startsWith('Bearer ')
      ? authorization.slice('Bearer '.length).trim()
      : '';

    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    //verify token and extract user info
    const authUser = await this.authService.verifyTokenAndBuildContext(token);

    const dbUser = await this.usersService.upsertAuthUser({
      clerkUserId: authUser.clerkUserId,
      email: authUser.email,
      name: authUser.name,
    });

    const user: UserContext = {
      ...authUser,
      role: dbUser.role,
    };

    request.user = user;

    //   if handler requires admin role, check user role
    const requiredRole = this.reflector.getAllAndOverride<string>(
      REQUIRED_ROLE_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (requiredRole && user.role !== requiredRole) {
      throw new ForbiddenException(
        'Insufficient permissions to access this resource',
      );
    }

    return true;
  }
}
