import type { Metadata, Viewport } from "next";
import "@fontsource/ibm-plex-sans/400.css";
import "@fontsource/ibm-plex-sans/500.css";
import "@fontsource/ibm-plex-sans/600.css";
import "@fontsource/space-mono/400.css";
import "@fontsource/space-mono/700.css";
import { ThemeProvider } from "next-themes";
import "./globals.css";


export const metadata: Metadata = {
  title: { default: "AC Consultoría", template: "%s · AC Consultoría" },
  description: "Gestión de proyectos de consultoría gastronómica: diagnóstico, mejora continua y control.",
  manifest: "/manifest.webmanifest",
};
export const viewport: Viewport = { themeColor: "#1c2521", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
