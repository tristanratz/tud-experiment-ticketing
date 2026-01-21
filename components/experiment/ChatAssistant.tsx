'use client';

import { useState, useEffect, useRef } from 'react';
import { ChatMessage, TicketWithStatus } from '@/types';
import { aiMockService } from '@/lib/aiMock';
import { tracking } from '@/lib/tracking';

interface ChatAssistantProps {
  currentTicket?: TicketWithStatus;
  onInsertResponse?: (response: string) => void;
}

export default function ChatAssistant({ currentTicket, onInsertResponse }: ChatAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize with welcome message
    const initialMessage = aiMockService.generateInitialChatMessage();
    setMessages([initialMessage]);
  }, []);

  useEffect(() => {
    // Auto-scroll to bottom when new messages arrive
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: input,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Track chat message
    tracking.chatMessageSent(input, currentTicket?.id);

    // Simulate AI response delay
    setTimeout(async () => {
      const aiResponse = await aiMockService.generateChatResponse(input, currentTicket);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: aiResponse,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 800);
  };

  const handleDraftResponse = async () => {
    if (!currentTicket) {
      alert('Please select a ticket first to draft a response.');
      return;
    }

    setIsLoading(true);

    // Request draft response
    const draftPrompt = `draft response for ${currentTicket.subject}`;
    tracking.chatMessageSent(draftPrompt, currentTicket.id);

    setTimeout(async () => {
      const draft = aiMockService.generateCompleteResponse(currentTicket);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: `Here's a draft response for ticket ${currentTicket.id}:\n\n${draft}`,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);

      // Optionally insert into ticket detail if callback provided
      if (onInsertResponse) {
        onInsertResponse(draft);
      }
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="bg-indigo-600 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <h3 className="text-lg font-semibold">AI Chat Assistant</h3>
        </div>
        <p className="text-xs text-indigo-200 mt-1">
          Ask questions about policies or request help drafting responses
        </p>
      </div>

      {/* Current Ticket Context */}
      {currentTicket && (
        <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 text-sm">
          <span className="text-indigo-700 font-medium">Working on:</span>
          <span className="text-indigo-900 ml-2">
            {currentTicket.id} - {currentTicket.subject}
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`chat-message flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              <p className={`text-xs mt-1 ${message.role === 'user' ? 'text-indigo-200' : 'text-gray-500'}`}>
                {new Date(message.timestamp).toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3">
              <div className="flex space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      {currentTicket && (
        <div className="border-t border-gray-200 px-4 py-2 bg-gray-50">
          <button
            onClick={handleDraftResponse}
            disabled={isLoading}
            className="w-full bg-indigo-100 text-indigo-700 px-3 py-2 rounded hover:bg-indigo-200 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            ✨ Draft Response for Current Ticket
          </button>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask a question..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm disabled:bg-gray-100"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</p>
      </div>
    </div>
  );
}
