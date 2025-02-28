"use client";

import type * as React from "react";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

import { Send, Plus, MessageSquare, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { useOkto } from "@okto_web3/react-sdk";

// Markdown imports
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import io, { Socket } from "socket.io-client";

import { LoginButton } from "@/app/components/google-button";
import { useSession } from "next-auth/react";

export default function ChatBubble() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState<any[]>([]);
  const [streamingText, setStreamingText] = useState("");
  const [currentStreamId, setCurrentStreamId] = useState<string | null>(null);

  const session = useSession();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const [socket, setSocket] = useState<Socket | null>(null);

  // Connect to Socket.IO
  useEffect(() => {
    const socketInstance = io("http://localhost:8005", {
      transports: ["websocket"],
    });
    setSocket(socketInstance);

    // Listen for new messages (the final, full message after streaming)
    socketInstance.on("message", (data) => {
      console.log("socket data from 'message':", data);
      if (data && data.messages) {
        setMessages(data.messages);
        setIsTyping(false);
        setStreamingText("");
        setCurrentStreamId(null);
      }
    });

    // Listen for streaming text chunks (assistant role)
    socketInstance.on("stream-chunk", (data) => {
      if (data.content && data.id) {
        setIsTyping(true);
        if (currentStreamId !== data.id) {
          // New streamed message
          setCurrentStreamId(data.id);
          setStreamingText(data.content);
        } else {
          // Continue current stream
          setStreamingText((prev) => prev + data.content);
        }
      }
    });

    // Listen for the "stream-complete" event (end of streaming)
    socketInstance.on("stream-complete", (data) => {
      setIsTyping(false);
      setStreamingText("");
      setCurrentStreamId(null);
      // The final content + media will appear in the "message" event
      // so we rely on that to show the correct final data.
    });

    return () => {
      socketInstance.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStreamId]);

  // Auto-scroll to bottom on new messages or streaming
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  // Fetch current chat messages
  const handleGetChat = async () => {
    const chatId = localStorage.getItem("10dj-chatId");
    if (!chatId || chatId === "undefined" || chatId === "null") {
      setMessages([]);
      return;
    }

    const endPoint = `http://localhost:8005/api/v1/chats/${chatId}`;
    const authToken = localStorage.getItem("10dj-authToken");
    try {
      const response = await fetch(endPoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      setMessages(data.messages);
    } catch (error) {
      console.error("Error fetching chat:", error);
    }
  };

  useEffect(() => {
    handleGetChat();
  }, []);

  // Fetch all chats (for the sidebar)
  const handleGetChats = async () => {
    const endPoint = `http://localhost:8005/api/v1/chats`;
    const authToken = localStorage.getItem("10dj-authToken");
    try {
      const response = await fetch(endPoint, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      console.log("data from all chats", data);
      setChats(data);
    } catch (error) {
      console.error("Error fetching all chats:", error);
    }
  };

  useEffect(() => {
    handleGetChats();
  }, []);

  // Send a message (user role)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!input.trim()) return;

    const globalMessageContent = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    const chatId =
      localStorage.getItem("10dj-chatId") === "null" ||
      localStorage.getItem("10dj-chatId") === "undefined"
        ? null
        : localStorage.getItem("10dj-chatId");

    const taskId =
      localStorage.getItem("10dj-taskId") === "null" ||
      localStorage.getItem("10dj-taskId") === "undefined" ||
      !localStorage.getItem("10dj-taskId")
        ? null
        : localStorage.getItem("10dj-taskId");

    // Optimistic update in the UI
    const tempUserMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, tempUserMessage]);
    setIsTyping(true);

    const dataToSend = {
      globalMessage: globalMessageContent,
      currentMessageContent: input,
      taskId: taskId,
      chatId: chatId,
    };

    const endPoint = `http://localhost:8005/chat`;
    const authToken = localStorage.getItem("10dj-authToken");

    try {
      const response = await fetch(endPoint, {
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
      // The final assistant message arrives via streaming + socket “message” event
    } catch (error) {
      console.error("Error sending message:", error);
      setIsTyping(false);
    }

    setInput("");
  };

  const shouldShowAvatar = (message: any, index: number) => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return prevMessage.role !== message.role;
  };

  // Clear chat
  const handleClearChat = () => {
    localStorage.removeItem("10dj-chatId");
    localStorage.removeItem("10dj-taskId");
    handleGetChat();
  };

  // New chat
  const handleNewChat = () => {
    localStorage.removeItem("10dj-chatId");
    localStorage.removeItem("10dj-taskId");
    setMessages([]);
    router.push("/");
  };

  // Click on a sidebar chat
  const handleChatClick = (chat: any) => {
    localStorage.setItem("10dj-chatId", chat.id);
    localStorage.setItem("10dj-taskId", chat.task_id);
    router.push(`/${chat.id}`);
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
            {chats.length > 0 &&
              chats.map((chat) => (
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

        {/* User Profile (Google Login) */}
        <div className="mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-3 p-2">
            <LoginButton />
          </div>
        </div>
      </div>

      {/* Main Section (right) */}
      <div className="flex flex-col h-screen ml-64">
        {/* Header */}
        <header className="fixed top-0 left-64 right-0 z-10 border-b border-border/40 bg-background p-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold">
            {chats.length > 0
              ? chats.find((c) => c.id === localStorage.getItem("10dj-chatId"))
                  ?.taskTitle || "New Chat"
              : "New Chat"}
          </h1>
          <div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearChat}
              className="text-xs"
            >
              Clear Chat
            </Button>
          </div>
        </header>

        {/* Chat content area */}
        <div className="flex-1 overflow-hidden pt-16 p-4">
          <Card className="h-full flex flex-col bg-card">
            <CardContent
              ref={containerRef}
              className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth"
            >
              {/* If no messages and not typing, show an empty state */}
              {messages && messages.length === 0 && !isTyping && (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                  <h3 className="text-lg font-medium">No messages yet</h3>
                  <p className="max-w-sm">
                    Start a conversation by typing a message below.
                  </p>
                </div>
              )}

              {/* Render existing messages */}
              {messages &&
                messages.length > 0 &&
                messages.map((message, index) => {
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
                            {/* Render Markdown for the message text */}
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                              {message.content}
                            </ReactMarkdown>

                            {/* If there's media, show a clickable "chip" to open in new tab */}
                            {message.media_url && (
                              <div className="mt-2">
                                <a
                                  href={message.media_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 text-sm rounded-full bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                                >
                                  <Paperclip className="mr-2 w-4 h-4" />
                                  View Attachment
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

              {/* Streaming message (only if there's streaming content) */}
              {isTyping && streamingText && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%] items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        A
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground text-left">
                        Assistant
                      </span>
                      <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {streamingText}
                        </ReactMarkdown>
                        <span className="inline-block w-1 h-4 ml-1 bg-current animate-blink"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Typing indicator (if streaming hasn't started or ended) */}
              {isTyping && !streamingText && (
                <div className="flex justify-start">
                  <div className="flex max-w-[80%] items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        A
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-muted-foreground text-left">
                        Assistant
                      </span>
                      <div className="bg-secondary text-secondary-foreground rounded-lg px-4 py-2">
                        <div className="flex space-x-2">
                          <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                          <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                          <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </CardContent>
          </Card>
        </div>

        {/* Input area */}
        <div className="border-t bg-background p-4">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isTyping || !input.trim() || !session}
            >
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
