"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"

type User = {
  id: string
  name: string
  avatar?: string
  color: string
}

type Message = {
  id: string
  userId: string
  content: string
  timestamp: Date
}
const END_POINT = process.env.NEXT_BACKEND_API_ENDPOINT
console.log({END_POINT})

// Mock users
const users: Record<string, User> = {
  "1": {
    id: "1",
    name: "Alice Chen",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "bg-blue-500",
  },
  "2": {
    id: "2",
    name: "Bob Smith",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "bg-green-500",
  },
  "3": {
    id: "3",
    name: "Carol White",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "bg-purple-500",
  },
  "4": {
    id: "4",
    name: "David Brown",
    avatar: "/placeholder.svg?height=40&width=40",
    color: "bg-orange-500",
  },
}

// Initial mock conversation
const initialMessages: Message[] = [
  {
    id: "1",
    userId: "1",
    content: "Hey everyone! How's the new project coming along?",
    timestamp: new Date("2024-02-25T10:00:00"),
  },
  {
    id: "2",
    userId: "2",
    content: "Making good progress! Just finished the authentication system.",
    timestamp: new Date("2024-02-25T10:01:00"),
  },
  {
    id: "3",
    userId: "3",
    content: "Great work Bob! I've been working on the UI components.",
    timestamp: new Date("2024-02-25T10:02:00"),
  },
  {
    id: "4",
    userId: "4",
    content: "Nice! I could use some help with the database schema if anyone's free.",
    timestamp: new Date("2024-02-25T10:03:00"),
  },
  {
    id: "5",
    userId: "1",
    content: "I can help with that David. Let's pair program after the standup?",
    timestamp: new Date("2024-02-25T10:04:00"),
  },
]

// Mock responses for demonstration
const mockResponses = [
  "Sure, that sounds good to me!",
  "I'll take a look at that issue.",
  "Could you share your screen?",
  "Great progress everyone!",
  "Let's discuss this in the next meeting.",
]

export default function ChatBubble() {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const currentUser = users["1"] // For demo, we'll use Alice as the current user

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" })
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [scrollToBottom])

  const getRandomResponse = () => {
    const randomIndex = Math.floor(Math.random() * mockResponses.length)
    const randomUserId = Object.keys(users)[Math.floor(Math.random() * Object.keys(users).length)]
    return { content: mockResponses[randomIndex], userId: randomUserId }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!input.trim()) return

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      userId: currentUser.id,
      content: input,
      timestamp: new Date(),
    }
    // const globalMessageContent = messages.map(
    //   (a) => a.content
    // )
    const data = {
      "globalMessage": { "role": "assistant", "message": "Let me take a look at your code. Could you share the error message or the code?" },
      "currentMessageContent": userMessage.content,
    };
    console.log({body: JSON.stringify(data)})
    const endPoint = `http://localhost:8000/chat`
    console.log({endPoint})
    const response = await fetch(`${endPoint}`,{
      method: "POST",
      headers: {
        'Content-Type': 'application/json', // Specifies that the body content is in JSON format
      },
      body: JSON.stringify(data),
      }
    ) .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });

    console.log({response})
    setMessages((prev) => [...prev, userMessage])
    setInput("")

    // Simulate response
    setIsTyping(true)
    setTimeout(() => {
      const { content, userId } = getRandomResponse()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        userId,
        content,
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsTyping(false)
    }, 1500)
  }

  const shouldShowAvatar = (message: Message, index: number) => {
    if (index === 0) return true
    const prevMessage = messages[index - 1]
    return prevMessage.userId !== message.userId
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      <Card className="w-full max-w-3xl h-[80vh] flex flex-col">
        <CardContent ref={containerRef} className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
          {messages.map((message, index) => {
            const user = users[message.userId]
            const showAvatar = shouldShowAvatar(message, index)
            const isCurrentUser = message.userId === currentUser.id

            return (
              <div
                key={message.id}
                className={`flex items-end space-x-2 ${isCurrentUser ? "flex-row-reverse space-x-reverse" : "flex-row"}`}
              >
                {showAvatar ? (
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className={user.color}>
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="w-8" />
                )}
                <div className="flex flex-col">
                  {showAvatar && (
                    <span className={`text-sm mb-1 ${isCurrentUser ? "text-right" : "text-left"}`}>{user.name}</span>
                  )}
                  <div
                    className={`
                      max-w-md rounded-2xl px-4 py-2
                      ${
                        isCurrentUser
                          ? "bg-primary text-primary-foreground rounded-br-none"
                          : "bg-muted text-muted-foreground rounded-bl-none"
                      }
                    `}
                  >
                    {message.content}
                  </div>
                </div>
              </div>
            )
          })}
          {isTyping && (
            <div className="flex items-end space-x-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gray-300">...</AvatarFallback>
              </Avatar>
              <div className="bg-muted text-muted-foreground rounded-2xl px-4 py-2 rounded-bl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} style={{ height: 1 }} />
        </CardContent>
        <CardFooter className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex w-full space-x-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isTyping}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Send message</span>
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}

