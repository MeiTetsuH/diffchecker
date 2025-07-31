import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
