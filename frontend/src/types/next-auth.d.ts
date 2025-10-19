import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    access_token?: string;
    error?: string;
    user: {
      name: string | null;
      email?: string | null;
      roles?: string[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    access_token?: string;
    refresh_token?: string;
    access_token_expires?: number;
    roles?: string[];
    error?: string;
  }
}
