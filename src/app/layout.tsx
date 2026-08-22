import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/navigation";

export const metadata: Metadata = {
  title: "DiffChecker",
  description: "Compare text, code, and spreadsheets locally in your browser. Nothing is uploaded.",
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
          <div className="privacy-notice" role="note">
            Your text, code, and spreadsheets are processed locally in this browser. Nothing is uploaded.
          </div>
          <main className="app-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
