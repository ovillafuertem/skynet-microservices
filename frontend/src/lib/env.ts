const serverRequired = [
  "NEXTAUTH_SECRET",
  "KEYCLOAK_ISSUER",
  "KEYCLOAK_CLIENT_ID",
  "KEYCLOAK_CLIENT_SECRET"
];

if (typeof window === "undefined") {
  for (const key of serverRequired) {
    if (!process.env[key]) {
      console.warn(`⚠️ Missing required environment variable: ${key}`);
    }
  }
}

const apiDefaults: Record<string, string | undefined> = {
  API_VISITS_BASE: process.env.API_VISITS_BASE,
  API_CLIENTS_BASE: process.env.API_CLIENTS_BASE,
  API_NOTIFS_BASE: process.env.API_NOTIFS_BASE
};

export function getApiBase(service: "visits" | "clients" | "notifications"): string {
  const key =
    service === "visits"
      ? "API_VISITS_BASE"
      : service === "clients"
        ? "API_CLIENTS_BASE"
        : "API_NOTIFS_BASE";

  const value = apiDefaults[key];
  if (!value) {
    throw new Error(`API base URL missing for service ${service}. Set ${key}.`);
  }
  return value;
}

export const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
