import NextAuth from "next-auth";
import Keycloak from "next-auth/providers/keycloak";
import { jwtDecode } from "jwt-decode";
import type { JWT } from "next-auth/jwt";

type DecodedToken = {
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
};

function extractRoles(token?: string | null): string[] {
  if (!token) return [];
  try {
    const decoded = jwtDecode<DecodedToken>(token);
    const realmRoles = decoded.realm_access?.roles ?? [];
    const resourceRoles = Object.values(decoded.resource_access ?? {}).flatMap(
      (resource) => resource.roles ?? []
    );
    return Array.from(new Set([...realmRoles, ...resourceRoles]));
  } catch (error) {
    console.warn("Unable to decode Keycloak token", error);
    return [];
  }
}

async function refreshAccessToken(token: JWT): Promise<JWT> {
  const issuer = process.env.KEYCLOAK_ISSUER;
  const clientId = process.env.KEYCLOAK_CLIENT_ID;
  const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;

  if (!issuer || !clientId || !clientSecret || !token.refresh_token) {
    return { ...token, error: "RefreshAccessTokenError" };
  }

  try {
    const url = `${issuer}/protocol/openid-connect/token`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: token.refresh_token as string
      })
    });

    const refreshedTokens = await response.json();

    if (!response.ok) {
      console.error("Failed to refresh access token", refreshedTokens);
      throw refreshedTokens;
    }

    return {
      ...token,
      access_token: refreshedTokens.access_token,
      refresh_token: refreshedTokens.refresh_token ?? token.refresh_token,
      access_token_expires: Date.now() + (refreshedTokens.expires_in ?? 0) * 1000,
      roles: extractRoles(refreshedTokens.access_token)
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return {
      ...token,
      access_token: undefined,
      refresh_token: undefined,
      access_token_expires: 0,
      error: "RefreshAccessTokenError"
    };
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt"
  },
  trustHost: true,
  providers: [
    Keycloak({
      clientId: process.env.KEYCLOAK_CLIENT_ID!,
      clientSecret: process.env.KEYCLOAK_CLIENT_SECRET!,
      issuer: process.env.KEYCLOAK_PUBLIC_ISSUER ?? process.env.KEYCLOAK_ISSUER,
      wellKnown: `${process.env.KEYCLOAK_ISSUER}/.well-known/openid-configuration`,
      authorization: {
        url: `${process.env.KEYCLOAK_PUBLIC_ISSUER ?? process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/auth`
      },
      token: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/token`,
      userinfo: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/userinfo`,
      jwks_endpoint: `${process.env.KEYCLOAK_ISSUER}/protocol/openid-connect/certs`
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.access_token = account.access_token;
        token.refresh_token = account.refresh_token;
        token.id_token = account.id_token;
        const expiresInSeconds = account.expires_in ?? 0;
        const expiresAtMs =
          account.expires_at != null
            ? account.expires_at * 1000
            : expiresInSeconds > 0
              ? Date.now() + expiresInSeconds * 1000
              : Date.now() + 60 * 1000;
        token.access_token_expires = expiresAtMs;
        token.roles = extractRoles(account.id_token ?? account.access_token);
      }

      if (token.access_token && token.access_token_expires && Date.now() < token.access_token_expires) {
        return token;
      }

      if (!token.refresh_token) {
        return { ...token, error: "RefreshAccessTokenError" };
      }

      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.user = session.user ?? { name: null, email: null };
      session.user.roles = (token.roles as string[]) ?? [];
      session.access_token = token.access_token as string | undefined;
      session.error = token.error as string | undefined;
      return session;
    }
  },
  events: {
    async signOut(message) {
      const token = (message as { token?: JWT | null })?.token;
      const issuer = process.env.KEYCLOAK_ISSUER;
      const publicIssuer = process.env.KEYCLOAK_PUBLIC_ISSUER ?? issuer;
      const clientId = process.env.KEYCLOAK_CLIENT_ID;
      const clientSecret = process.env.KEYCLOAK_CLIENT_SECRET;
      if (!issuer || !publicIssuer || !clientId || !clientSecret || !token?.refresh_token) {
        return;
      }
      try {
        const fetchUrl = `${issuer}/protocol/openid-connect/logout`;
        await fetch(fetchUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: token.refresh_token as string
          })
        });
      } catch (error) {
        console.warn("Failed to propagate Keycloak logout", error);
      }
    }
  }
});
