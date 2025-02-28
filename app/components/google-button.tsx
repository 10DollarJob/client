"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export function LoginButton() {
  const { data: session } = useSession();

  const [sessionState, setSessionState] = useState<any>(null);

  useEffect(() => {
    if (session) {
      console.log("session from google button", session);
      setSessionState(session);
    }
  }, [session]);

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
    <div className="flex items-center space-x-4">
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
