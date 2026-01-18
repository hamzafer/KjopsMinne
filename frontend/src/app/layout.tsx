import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";

export const metadata: Metadata = {
  title: "Kvitteringshvelv",
  description: "Din personlige kvitteringshvelv med handleintelligens",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="nb">
      <body className="min-h-screen">
        <Navigation />
        <main className="pb-12">{children}</main>
      </body>
    </html>
  );
}
