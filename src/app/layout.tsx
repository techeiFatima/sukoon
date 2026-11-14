import type { Metadata, Viewport } from "next";
import "@fontsource-variable/newsreader";
import "@fontsource-variable/newsreader/wght-italic.css";
import "@fontsource-variable/inter";
import "@fontsource/amiri/400.css";
import "@fontsource/amiri/700.css";
import "./globals.css";
import { AppProvider } from "@/lib/app-context";

export const metadata: Metadata = {
  title: "Sukoon — Less noise. More meaning.",
  description: "Technology for a more intentional life. A private space to reclaim your attention and live by your values.",
  applicationName: "Sukoon",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  themeColor: "#F7F5EF",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
