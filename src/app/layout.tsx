 import type { Metadata } from "next";

export const metadata: Metadata = {
title: "Gluten Free Finder",
description: "Trova locali gluten free",
};

export default function RootLayout({
children,
 }: {
   children: React.ReactNode;
 }) {
   return (
     <html lang="it">
       <body>{children}</body>
     </html>
   );
 }
