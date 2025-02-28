"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useOkto } from "okto-sdk-react";
export function LoginButton() {
  const { data: session } = useSession();

  const [sessionState, setSessionState] = useState<any>(null);

  const { authenticate, isReady, isLoggedIn } = useOkto();

  useEffect(() => {
    if (session) {
      const token = (session as any).id_token;
      if (isReady && isLoggedIn) {
        authenticate(token, (result, error) => {
          if (error) {
            console.error("Error during auth", error);
          } else {
            console.log("result from google button", result);
            console.log("token from google button", token);
            localStorage.setItem("10dj-authToken", token || "");
            console.log("session from google button", session);
            setSessionState(session);
            handleFetchOrCreateUser(session);
          }
        });
      }
    }
  }, [session, isReady, isLoggedIn]);

  const handleFetchOrCreateUser = async (session: any) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/fetch-or-create-user`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.id_token}`,
          },
          body: JSON.stringify({
            email: session.user.email,
            name: session.user.name,
            image: session.user.image,
            type: "user",
          }),
        }
      );
      const data = await response.json();
      console.log(data, "data from fetch-or-create-user");
    } catch (error) {
      console.error(error, "error from fetch-or-create-user");
    }
  };

  useEffect(() => {
    if (sessionState) {
      console.log("sessionState", sessionState.user.image);
    }
  }, [sessionState]);

  const handleAuth = () => {
    try {
      session ? signOut() : signIn("google");
    } catch (error) {
      console.error("Error during auth", error);
    }
  };

  if (!sessionState) {
    // Render sign in button with Google logo
    return (
      <button
        onClick={handleAuth}
        className="flex items-center border border-transparent rounded px-4 py-2 transition-colors bg-blue-500 hover:bg-blue-700 text-white"
      >
        <img
          src="/google-logo.png"
          alt="Google logo"
          className="w-6 h-6 mr-2"
        />
        Sign in with Google
      </button>
    );
  }

  // Render user info and sign out button when signed in
  return (
    <div className="flex items-center space-x-4" onClick={handleAuth}>
      <img
        src={sessionState.user?.image || ""}
        alt={sessionState.user?.name || ""}
        className="w-8 h-8 rounded-full"
      />
      <span className="text-gray-800 font-medium">
        {sessionState.user?.name}
      </span>
    </div>
  );
}
