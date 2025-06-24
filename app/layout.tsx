import type { Metadata } from "next";
import {
  ClerkProvider,
} from '@clerk/nextjs'
import "./globals.css";
import { Header } from "@/components/header";

export const metadata: Metadata = {
  title: "Book RECKommender",
  description: "Get personalized book recommendations using AI",
  openGraph: {
    title: "Book RECKommender",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          <Header />
          <main>{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
