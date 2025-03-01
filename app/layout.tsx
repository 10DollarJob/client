// Remove "use client" so this becomes a server component
import localFont from "next/font/local";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

import AppProvider from "./providers/AppProvider";

import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";
import React from "react";
import { OktoProvider } from "@okto_web3/react-sdk";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProvider session={session}>
          {/* <ClerkProvider
            appearance={{
              variables: {
                colorPrimary: "#252525",
                colorBackground: "#121212",
                },
                baseTheme: dark,
                }}
                > */}
          {children}
          {/* </ClerkProvider> */}
        </AppProvider>
      </body>
    </html>
  );
}
