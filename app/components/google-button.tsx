"use client";
import { useSession, signIn, signOut } from "next-auth/react";
import { useEffect, useState, useMemo } from "react";
import { getPortfolio, useOkto } from "@okto_web3/react-sdk";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ClipboardCopy } from "lucide-react";
import { toast } from "sonner";

export function LoginButton() {
  const { data: session } = useSession();
  const [sessionState, setSessionState] = useState<any>(null);
  const [userSWA, setUserSWA] = useState<string | null>(null);
  const [tokenPortfolio, setTokenPortfolio] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  //@ts-ignore
  const idToken = useMemo(() => {
    if (session) {
      setSessionState(session);
      localStorage.setItem("10dj-authToken", (session as any).id_token);
      return (session as any).id_token;
    }
    return null;
  }, [session]);

  const oktoClient = useOkto();

  async function handleAuthenticate() {
    if (!idToken) return { result: false, error: "No Google login" };

    try {
      const user = await oktoClient.loginUsingOAuth(
        {
          idToken: idToken,
          provider: "google",
        },
        (session: any) => {
          localStorage.setItem("okto_session_info", JSON.stringify(session));
          localStorage.setItem("okto_user_swa", session.userSWA);
          setUserSWA(session.userSWA);
        }
      );
      return JSON.stringify(user);
    } catch (error) {
      console.error("Error during loginUsingOAuth", error);
    }
  }

  async function fetchPortfolio() {
    setIsLoading(true);
    try {
      const portfolio = await getPortfolio(oktoClient);
      if (portfolio) {
        setTokenPortfolio(portfolio);
      }
    } catch (error) {
      console.error("Error fetching token portfolio:", error);
    }
    setIsLoading(false);
  }

  async function handleLogout() {
    try {
      oktoClient.sessionClear();
      localStorage.removeItem("okto_session_info");
      localStorage.removeItem("okto_user_swa");
      localStorage.removeItem("10dj-authToken");
      localStorage.removeItem("10dj-chatId");
      localStorage.removeItem("10dj-taskId");
      toast.success("Logged out successfully!");
      signOut();
    } catch (error) {
      console.error("Logout failed");
    }
  }

  useEffect(() => {
    if (idToken) {
      handleAuthenticate();
    }
  }, [idToken]);

  const handleUserClick = () => {
    if (!isModalOpen) {
      fetchPortfolio();
    }
    setIsModalOpen(!isModalOpen);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  if (!sessionState) {
    return (
      <Button
        onClick={() => signIn("google")}
        className="flex items-center bg-black hover:bg-gray-800 text-white px-4 py-2 rounded"
      >
        <img src="/google-logo.png" alt="Google" className="w-6 h-6 mr-2" />
        Sign in with Google
      </Button>
    );
  }

  return (
    <>
      <Button
        onClick={handleUserClick}
        className="flex items-center justify-start !py-2 !w-full bg-gray-100 hover:bg-gray-200 rounded border border-gray-300"
      >
        <img
          src={sessionState.user?.image || ""}
          alt={sessionState.user?.name || ""}
          className="w-8 h-8 rounded-full mr-2 my-2"
        />
        <span className="text-gray-800 font-medium">
          {sessionState.user?.name}
        </span>
      </Button>

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Account Information</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* User Address */}
            <div className="flex items-center justify-between border p-2 rounded-md">
              {userSWA ? (
                <>
                  <span className="text-sm text-gray-600 truncate">
                    {userSWA}
                  </span>
                  <Button
                    variant="ghost"
                    onClick={() => copyToClipboard(userSWA)}
                  >
                    <ClipboardCopy size={16} />
                  </Button>
                </>
              ) : (
                <Skeleton className="h-5 w-full rounded-md" />
              )}
            </div>

            {/* Aggregated Holdings */}
            {isLoading ? (
              <Skeleton className="h-16 w-full rounded-md" />
            ) : (
              tokenPortfolio?.aggregated_data && (
                <div className="p-3 border rounded-md bg-gray-100">
                  <p className="text-gray-700 font-medium">
                    Total Holdings:{" "}
                    {tokenPortfolio.aggregated_data.holdings_count}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>INR:</strong> ₹
                    {tokenPortfolio.aggregated_data.holdings_price_inr} |
                    <strong> USDT:</strong> $
                    {tokenPortfolio.aggregated_data.holdings_price_usdt}
                  </p>
                </div>
              )
            )}

            {/* Token List */}
            <div>
              <h3 className="text-lg font-medium">Token Portfolio</h3>
              {isLoading ? (
                <Skeleton className="h-32 w-full rounded-md" />
              ) : tokenPortfolio?.group_tokens?.length ? (
                <ul className="space-y-3">
                  {tokenPortfolio.group_tokens.map(
                    (tokenGroup: any, index: number) => (
                      <li
                        key={index}
                        className="flex items-center p-2 border rounded-md"
                      >
                        <img
                          src={tokenGroup.token_image}
                          alt={tokenGroup.name}
                          className="w-8 h-8 rounded-full mr-3"
                        />
                        <div>
                          <p className="font-medium">
                            {tokenGroup.name} ({tokenGroup.symbol})
                          </p>
                          <p className="text-sm text-gray-600">
                            Balance: {tokenGroup.balance} |
                            <strong> USDT:</strong> $
                            {tokenGroup.holdings_price_usdt}
                          </p>
                        </div>
                      </li>
                    )
                  )}
                </ul>
              ) : (
                <p className="text-gray-500">No tokens available</p>
              )}
            </div>

            {/* Funding Information */}
            <div className="py-3 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                To fund this wallet with a specific token, please transfer to
                this address:
              </p>
              {userSWA ? (
                <span className="font-medium text-gray-800">{userSWA}</span>
              ) : (
                <Skeleton className="h-5 w-3/4 rounded-md" />
              )}
            </div>
            <div className="flex justify-end">
              <Button variant="destructive" onClick={handleLogout}>
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
