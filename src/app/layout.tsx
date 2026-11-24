import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, Space_Mono } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const plex = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600"], variable: "--font-plex" });
const mono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"], variable: "--font-mono-ac" });

export const metadata: Metadata = {
  title: { default: "AC Consultoría", template: "%s · AC Consultoría" },
  description: "Gestión de proyectos de consultoría gastronómica: diagnóstico, mejora continua y control.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#1c2521", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${plex.variable} ${mono.variable}`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
