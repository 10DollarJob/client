"use client";

import type * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { Send, Plus, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// Markdown imports
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ChatIdPage() {
  const router = useRouter();
  const params = useParams();
  const chatIdFromRoute = params.chatId;

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState<any[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all chats (for sidebar)
  const handleGetChats = async () => {
    try {
      const authToken = localStorage.getItem("10dj-authToken");
      const response = await fetch(`http://localhost:8005/api/v1/chats`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error("Error fetching all chats:", error);
    }
  };

  useEffect(() => {
    handleGetChats();
  }, []);

  // Fetch messages for the current chat
  const handleGetChat = async (id: string) => {
    if (!id || id === "undefined" || id === "null") {
      setMessages([]);
      return;
    }

    try {
      const authToken = localStorage.getItem("10dj-authToken");
      const response = await fetch(`http://localhost:8005/api/v1/chats/${id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      console.log("data from get chat", data);
      setMessages(data.messages);
    } catch (error) {
      console.error("Error fetching chat:", error);
      setMessages([]);
    }
  };

  // Update localStorage and fetch when chatId changes
  useEffect(() => {
    localStorage.setItem("10dj-chatId", chatIdFromRoute as string);
    handleGetChat(chatIdFromRoute as string);
  }, [chatIdFromRoute]);

  // Scroll to bottom
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send a message
  const handleSendMessage = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const globalMessageContent = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    const taskId =
      localStorage.getItem("10dj-taskId") === "null" ||
      localStorage.getItem("10dj-taskId") === "undefined" ||
      !localStorage.getItem("10dj-taskId")
        ? null
        : localStorage.getItem("10dj-taskId");

    const chatIdStored = localStorage.getItem("10dj-chatId") || chatIdFromRoute;

    const dataToSend = {
      globalMessage: globalMessageContent,
      currentMessageContent: input,
      taskId: taskId,
      chatId: chatIdStored,
    };

    try {
      const authToken = localStorage.getItem("10dj-authToken");
      const response = await fetch(`http://localhost:8005/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(dataToSend),
      });
      const data = await response.json();

      if (data.chatId) {
        localStorage.setItem("10dj-chatId", data.chatId);
      }
      if (data.taskId) {
        localStorage.setItem("10dj-taskId", data.taskId);
      }

      // Re-fetch with updated chatId
      handleGetChat(data.chatId || chatIdFromRoute);
    } catch (error) {
      console.error("Error sending message:", error);
    }

    setInput("");
  };

  // Sidebar chat click
  const handleChatClick = (chat: any) => {
    localStorage.setItem("10dj-chatId", chat.id);
    localStorage.setItem("10dj-taskId", chat.task_id);
    router.push(`/${chat.id}`);
  };

  // New chat
  const handleNewChat = () => {
    localStorage.removeItem("10dj-chatId");
    localStorage.removeItem("10dj-taskId");
    setMessages([]);
    router.push("/");
  };

  // Decide if avatar should be shown
  const shouldShowAvatar = (message: any, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return prevMessage.role !== message.role;
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Fixed Sidebar (left) */}
      <div className="fixed top-0 left-0 bottom-0 z-10 w-64 flex flex-col bg-secondary text-secondary-foreground p-4">
        {/* Sidebar Header */}
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="h-5 w-5" />
          <span className="font-semibold">Chat App</span>
        </div>

        {/* New Chat Button */}
        <div className="mb-4">
          <Button
            onClick={handleNewChat}
            className="w-full bg-white text-black hover:bg-white/90 flex items-center justify-center gap-2"
          >
            <Plus className="h-4 w-4" />
            New Chat
          </Button>
        </div>

        {/* Recent Chats */}
        <div className="text-xs text-white/50 mb-2">Recent Chats</div>
        <div className="flex-1 overflow-y-auto space-y-1">
          <TooltipProvider>
            {chats.map((chat) => (
              <Tooltip key={chat.id}>
                <TooltipTrigger asChild>
                  <div
                    onClick={() => handleChatClick(chat)}
                    className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-white/10"
                  >
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span className="truncate text-sm">
                      {chat.taskTitle || "Untitled Chat"}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right">
                  {chat.taskTitle || "Untitled Chat"}
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>

        {/* User Profile
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2">
            <UserButton />
            <div className="text-sm">
              {user?.fullName || user?.username || "User"}
            </div>
          </div>
        </div> */}
      </div>

      {/* Main Section (right) */}
      <div className="flex flex-col h-screen ml-64">
        {/* Header */}
        <header className="fixed top-0 left-64 right-0 z-10 border-b border-border/40 bg-background p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            {chats.find((c) => c.id === chatIdFromRoute)?.taskTitle ||
              "New Chat"}
          </h1>
        </header>

        {/* Chat area */}
        <div className="flex-1 overflow-hidden pt-16 p-4">
          <Card className="h-full flex flex-col bg-card">
            <CardContent
              ref={containerRef}
              className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
            >
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No messages yet</h3>
                  <p className="max-w-sm">
                    Start a conversation by typing a message below.
                  </p>
                </div>
              )}

              {messages.map((message, index) => {
                const isCurrentUser = message.role === "user";
                const showAvatar = shouldShowAvatar(message, index);
                return (
                  <div
                    key={message.id ?? index}
                    className={`flex ${
                      isCurrentUser ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`flex max-w-[80%] ${
                        isCurrentUser
                          ? "flex-row-reverse items-end"
                          : "flex-row items-start"
                      } gap-3`}
                    >
                      {showAvatar && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback
                            className={
                              isCurrentUser
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                            }
                          >
                            {isCurrentUser ? "U" : "A"}
                          </AvatarFallback>
                        </Avatar>
                      )}

                      <div className="flex flex-col gap-1">
                        {showAvatar && (
                          <span
                            className={`text-xs text-muted-foreground ${
                              isCurrentUser ? "text-right" : "text-left"
                            }`}
                          >
                            {isCurrentUser ? "You" : "Assistant"}
                          </span>
                        )}
                        <div
                          className={`rounded-lg px-4 py-2 ${
                            isCurrentUser
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-secondary-foreground"
                          }`}
                        >
                          {/* Render Markdown */}
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Typing indicator (if needed) */}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%] items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        A
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            <CardFooter className="border-t p-4">
              <form
                onSubmit={handleSendMessage}
                className="flex w-full space-x-2"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={isTyping || !input.trim()}
                >
                  <Send className="h-4 w-4" />
                  <span className="sr-only">Send message</span>
                </Button>
              </form>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
