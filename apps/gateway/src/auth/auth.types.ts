export type UserContext = {
  clerkUserId: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
};

export interface VerifiedAuthUser {
  clerkUserId: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
}
