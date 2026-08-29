import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/navigation";

export const metadata: Metadata = {
  metadataBase: new URL("https://diffchecker.pages.dev"),
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
