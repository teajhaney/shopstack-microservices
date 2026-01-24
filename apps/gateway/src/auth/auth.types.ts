export type UserContext = {
  clerkUserid: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  isAdmin: boolean;
};
