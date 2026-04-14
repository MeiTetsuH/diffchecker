import type { Metadata } from "next";
import "./globals.css";
import Navigation from "@/components/navigation";

export const metadata: Metadata = {
  title: "DiffChecker",
  description: "Diffchecker will compare text to find the difference between two text files. Just paste your files and click Find Difference!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', backgroundColor: 'var(--color-background)' }}>
          <Navigation />
          <div style={{ flexGrow: 1, overflow: 'hidden' }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
