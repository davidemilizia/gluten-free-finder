import type { Metadata } from "next";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Gluten Free Finder",
  description: "Trova locali e negozi gluten free",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body style={{ margin: 0, background: "#ffffff", color: "#111827" }}>
        <Header />
        {children}
      </body>
    </html>
  );
}
