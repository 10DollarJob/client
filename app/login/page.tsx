"use client";

import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GoogleLogin } from "@react-oauth/google";

export default function LoginCard() {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    // In a real application, you would implement Google OAuth here
    // For example, using Supabase:
    // await supabase.auth.signInWithOAuth({
    //   provider: 'google',
    // }) [^1]

    // Or using Magic.link:
    // const didToken = await magic.oauth.loginWithRedirect({
    //   provider: 'google',
    //   redirectURI: new URL('/dashboard', window.location.origin).href,
    // }) [^2]

    setTimeout(() => setIsLoading(false), 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">10 Dollar Job</div>
          <CardTitle className="text-2xl font-semibold">Welcome back</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <GoogleLogin onSuccess={handleGoogleSignIn} useOneTap={false} />
        </CardContent>
      </Card>
    </div>
  );
}
