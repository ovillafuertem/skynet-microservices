import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { auth } from "@/lib/auth";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { AppShell } from "@/components/ui/app-shell";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SkyNet Field Ops",
  description: "Gestión de visitas técnicas con notificaciones y mapas"
};

export default async function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="es">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <AppShell>{children}</AppShell>
        </SessionProvider>
      </body>
    </html>
  );
}
