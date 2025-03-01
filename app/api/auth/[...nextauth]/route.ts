import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import type { AuthOptions } from "next-auth";
import { authOptions } from "@/app/utils/authOptions";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
