import { Controller, Get } from '@nestjs/common';
import { CurrentUser } from './current.user.decorator';
import type { UserContext } from './auth.types';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('me')
  getCurrentUser(@CurrentUser() user: UserContext) {
    return user;
  }
}
