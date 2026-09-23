import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navigation from "@/components/navigation";

/**
 * Matches the navigation bar (--color-widget-background). Safari 26+ ignores
 * theme-color and tints its toolbars from the body background instead, but
 * older Safari and Chrome on Android still colour their chrome from it.
 */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "hsl(240 8% 10%)" },
    { media: "(prefers-color-scheme: light)", color: "hsl(0 0% 100%)" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL("https://diffchecker-eij.pages.dev"),
  title: "DiffChecker",
  description: "Compare text, code, and spreadsheets locally in your browser. Nothing is uploaded.",
  alternates: { canonical: "/" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <Navigation />
          <main className="app-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
