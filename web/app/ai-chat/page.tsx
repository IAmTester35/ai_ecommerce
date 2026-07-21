"use client";

import React, { useState, useRef, useEffect } from "react";
import { SearchBox } from "@/components/SearchBox";
import { ChatMessage } from "@/components/ChatMessage";
import { searchCars, SearchResponse } from "@/lib/api";
import { Sparkles } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content?: string;
  data?: SearchResponse;
};

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      data: {
        original_query: "",
        constraints: {},
        conflict_detected: false,
        results: [],
        ai_message: "Xin chào! Tôi là AutoMatch AI. Hãy nói cho tôi biết bạn đang tìm kiếm mẫu xe như thế nào, tôi sẽ giúp bạn tìm ra chiếc xe phù hợp nhất."
      }
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (query: string) => {
    // Add user message
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: query,
    };
    
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const response = await searchCars(query);
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        data: response,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        data: {
          original_query: query,
          constraints: {},
          conflict_detected: false,
          results: [],
          ai_message: "Xin lỗi, đã có lỗi xảy ra khi kết nối với máy chủ. Vui lòng thử lại sau."
        }
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <main className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Header */}
      <header className="py-4 px-6 border-b bg-card/50 backdrop-blur-sm z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary text-primary-foreground rounded-lg">
            <Sparkles className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">AutoMatch AI</h1>
        </div>
      </header>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto px-4 py-8">
        <div className="max-w-4xl mx-auto flex flex-col gap-2 pb-32">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              data={msg.data}
            />
          ))}
          {isLoading && (
            <div className="flex gap-4 p-6 my-4 w-full bg-secondary/30 rounded-3xl animate-pulse">
              <div className="w-10 h-10 rounded-full bg-primary/50 flex items-center justify-center shrink-0" />
              <div className="flex-1 space-y-4 py-2">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-2/4"></div>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="absolute bottom-0 w-full bg-gradient-to-t from-background via-background to-transparent pt-12 pb-6 px-4">
        <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        <p className="text-center text-xs text-muted-foreground mt-4">
          AutoMatch AI có thể mắc lỗi. Vui lòng kiểm tra lại các thông tin quan trọng.
        </p>
      </div>
    </main>
  );
}
