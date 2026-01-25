import { createClerkClient, verifyToken } from '@clerk/backend';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { VerifiedAuthUser } from './auth.types';

interface JWTPayload {
  sub?: string;
  userId?: string;
  [key: string]: unknown;
}

@Injectable()
export class AuthService {
  private readonly clerk = createClerkClient({
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  });
  private jwtVerifyOptions(): Record<string, unknown> {
    return {
      secretKey: process.env.CLERK_SECRET_KEY,
    };
  }

  async verifyToken(token: string): Promise<VerifiedAuthUser> {
    try {
      const verifiedToken = await verifyToken(token, this.jwtVerifyOptions());
      //decoded payload
      const payload = verifiedToken?.payload ?? verifiedToken;

      //clerk user id from payload - safely access JWT properties
      const typedPayload = payload as JWTPayload;
      const clerkUserId = typedPayload?.sub ?? typedPayload?.userId;

      if (!clerkUserId) {
        throw new UnauthorizedException(
          'Invalid token: Missing subject (sub) claim',
        );
      }

      const role: 'user' | 'admin' = 'user';

      const emailFromToken =
        typeof typedPayload.email === 'string'
          ? typedPayload.email
          : typeof typedPayload.email_address === 'string'
            ? typedPayload.email_address
            : '';

      const nameFromToken =
        typeof typedPayload.name === 'string'
          ? typedPayload.name
          : typeof typedPayload.username === 'string'
            ? typedPayload.username
            : '';

      if (emailFromToken && nameFromToken) {
        return {
          clerkUserId,
          email: emailFromToken,
          name: nameFromToken,
          role,
        };
      }

      const user = await this.clerk.users.getUser(clerkUserId);
      const primaryEmail =
        user.emailAddresses.find((e) => e.id === user.primaryEmailAddressId)
          ?.emailAddress ??
        user.emailAddresses[0]?.emailAddress ??
        '';
      const fullName =
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        user.username ||
        primaryEmail ||
        clerkUserId;

      return {
        clerkUserId,
        email: emailFromToken || primaryEmail,
        name: nameFromToken || fullName,
        role,
      };
    } catch (error) {
      console.log(error);
      throw new UnauthorizedException('Invalid or Expired token');
    }
  }
}
