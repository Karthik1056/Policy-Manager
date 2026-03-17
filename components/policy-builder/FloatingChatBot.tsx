"use client";

import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import api from "@/lib/api";


interface ChatMessage {
  role: "user" | "ai";
  content: string;
}

interface FloatingChatBotProps {
  currentPolicy: any;
  onPolicyUpdate: (action: any) => void;
  policyId: string;
}

export default function FloatingChatBot({ currentPolicy, onPolicyUpdate, policyId }: FloatingChatBotProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const savedMessages = localStorage.getItem(`chat-${policyId}`);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([{
        role: "ai",
        content: "Hi! I'm your AI assistant. I can help you build your policy by creating tabs, subtabs, and fields. What would you like to add?"
      }]);
    }
  }, [policyId, mounted]);

  useEffect(() => {
    if (!mounted || messages.length === 0) return;
    localStorage.setItem(`chat-${policyId}`, JSON.stringify(messages));
  }, [messages, policyId, mounted]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const createPolicyItem = async (action: any) => {
    const postJsonOrThrow = async (url: string, payload: any) => {
      const { data } = await api.post(url, payload);
      return data;
    };

    const resolvePolicyId = () => {
      const candidate =
        action?.tab?.policyEngineId ||
        policyId ||
        currentPolicy?.id ||
        currentPolicy?.policyEngineId;

      const normalized = String(candidate || "").trim();
      if (!normalized || normalized === "undefined" || normalized === "null") {
        throw new Error("Policy ID is missing. Reload the builder and try again.");
      }
      return normalized;
    };

    const effectivePolicyId = resolvePolicyId();

    const getNextTabOrderIndex = () => {
      const tabs = (currentPolicy?.tabs || []) as any[];
      if (tabs.length === 0) return 0;
      const maxOrder = Math.max(
        ...tabs.map((tab: any) => (Number.isFinite(tab?.orderIndex) ? Number(tab.orderIndex) : -1))
      );
      return maxOrder + 1;
    };

    if (action.type === "create_tab") {
      await postJsonOrThrow("/tab/createTab", {
        ...action.tab,
        name: action?.tab?.name || "New Tab",
        orderIndex: action?.tab?.orderIndex ?? getNextTabOrderIndex(),
        documentNotes: action?.tab?.documentNotes || "",
        policyEngineId: effectivePolicyId,
      });
    } else if (action.type === "create_subtab") {
      const existingTab = currentPolicy?.tabs?.find((tab: any) => 
        tab.name.toLowerCase().includes(action.subtab.name.toLowerCase()) || action.subtab.tabId === tab.id
      );
      const subtabPayload = { ...action.subtab, tabId: existingTab?.id || action.subtab.tabId };
      if (!subtabPayload.tabId) {
        throw new Error("Unable to resolve tabId for subtab. Add tabId or tabName in draft JSON.");
      }
      await postJsonOrThrow("/subtab/create", subtabPayload);
    } else if (action.type === "create_field") {
      await postJsonOrThrow("/field/create", action.field);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user" as const, content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);

    try {
      const { data } = await api.post("http://localhost:8000/api/chat/policy-builder", {
        message: input,
        current_policy: currentPolicy,
      });
      const result = data?.result || {};

      setMessages((prev) => [...prev, { role: "ai", content: result.message || "I've processed your request!" }]);

      if (result.action && result.action.type !== "error") {
        setPendingAction(result.action);
      } else {
        setPendingAction(null);
      }

      setSuggestions(result.suggestions || null);
    } catch {
      setMessages((prev) => [...prev, { role: "ai", content: "Sorry, I encountered an error. Please try again." }]);
    }

    setInput("");
    setLoading(false);
  };

  if (!mounted) return null;

  return (
    <>
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-1/2 right-0 -translate-y-1/2 w-12 h-24 bg-gradient-to-r from-blue-600 to-purple-600 rounded-l-xl shadow-lg hover:shadow-xl transition-all flex flex-col items-center justify-center text-white z-50 hover:w-14 gap-1"
        >
          <MessageCircle size={20} />
          <span className="text-xs font-medium writing-mode-vertical transform rotate-180">AI Chat</span>
        </button>
      )}

      {isOpen && (
        <div className={`fixed top-0 right-0 h-screen bg-white shadow-2xl z-50 transition-all ${isMinimized ? 'w-16' : 'w-96'}`}>
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle size={18} />
              </div>
              <div>
                <h3 className="font-semibold text-sm">AI Assistant</h3>
                <p className="text-xs opacity-90">Online</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsMinimized(!isMinimized)} className="hover:bg-white/20 p-1 rounded">
                <Minimize2 size={18} />
              </button>
              <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-1 rounded">
                <X size={18} />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === "user" ? "bg-blue-600 text-white rounded-br-sm" : "bg-gray-100 text-gray-800 rounded-bl-sm"}`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}

                {pendingAction && (
                  <div className="border-2 border-blue-300 rounded-xl p-3 bg-blue-50">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className="bg-white">
                        {pendingAction.type.replace("_", " ").toUpperCase()}
                      </Badge>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={async () => {
                            try {
                              await createPolicyItem(pendingAction);
                              setPendingAction(null);
                              setSuggestions(null);
                              setDraftError(null);
                              onPolicyUpdate(pendingAction);
                            } catch (error: any) {
                              setDraftError(error?.message || "Failed to create item");
                            }
                          }}
                          className="h-7 text-xs"
                        >
                          <Check size={12} className="mr-1" /> Create
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setPendingAction(null)} className="h-7 text-xs">
                          <X size={12} className="mr-1" /> Dismiss
                        </Button>
                      </div>
                    </div>
                    <div className="text-xs text-gray-700">
                      {pendingAction?.tab && <p><strong>Tab:</strong> {pendingAction.tab.name}</p>}
                      {pendingAction?.subtab && <p><strong>SubTab:</strong> {pendingAction.subtab.name}</p>}
                      {pendingAction?.field && <p><strong>Field:</strong> {pendingAction.field.fieldName}</p>}
                    </div>
                  </div>
                )}

                {draftError && (
                  <p className="text-xs text-red-600">{draftError}</p>
                )}

                {suggestions && (
                  <div className="border rounded-xl p-3 bg-gray-50">
                    <p className="text-xs font-medium mb-2">Suggestions:</p>
                    {suggestions?.subtabs && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {suggestions.subtabs.map((item: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    )}
                    {suggestions?.fields && (
                      <div className="flex flex-wrap gap-1">
                        {suggestions.fields.map((item: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{item}</Badge>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-2xl rounded-bl-sm p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                </div>

                <div className="p-4 border-t">
                  <div className="flex gap-2">
                    <Input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your message..."
                      onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={loading || !input.trim()} size="icon">
                      <Send size={18} />
                    </Button>
                  </div>
                </div>
            </div>
          )}
        </div>
      )}
    </>
  );
}
