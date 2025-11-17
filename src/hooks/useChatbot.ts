import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  createGroqChatCompletion,
  GroqChatMessage,
  GroqChatCompletion,
} from '@/integrations/groq/edge-client';
import { ChatMessage, ChatUsage } from '@/types/chat';

const STORAGE_KEY = 'chatbot-conversation-history';

const loadMessagesFromStorage = (): ChatMessage[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error loading chat history:', error);
  }
  return [];
};

const saveMessagesToStorage = (messages: ChatMessage[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  } catch (error) {
    console.error('Error saving chat history:', error);
  }
};

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2);
};

const mapUsage = (usage: GroqChatCompletion['usage']): ChatUsage | null => {
  if (!usage) return null;
  return {
    promptTokens: usage.prompt_tokens ?? 0,
    completionTokens: usage.completion_tokens ?? 0,
    totalTokens: usage.total_tokens ?? 0,
  };
};

interface UseChatbotOptions {
  systemPrompt: string;
  initialAssistantMessage?: string;
}

export function useChatbot({ systemPrompt, initialAssistantMessage }: UseChatbotOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    // Intentar cargar del localStorage primero
    const storedMessages = loadMessagesFromStorage();
    if (storedMessages.length > 0) {
      return storedMessages;
    }
    
    // Si no hay mensajes guardados y hay mensaje inicial, usarlo
    if (!initialAssistantMessage) return [];
    return [
      {
        id: createId(),
        role: 'assistant',
        content: initialAssistantMessage,
        createdAt: new Date().toISOString(),
      },
    ];
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string | null>(null);
  const [usage, setUsage] = useState<ChatUsage | null>(null);

  const abortControllerRef = useRef<AbortController | null>(null);
  const systemPromptRef = useRef(systemPrompt);
  const messagesRef = useRef<ChatMessage[]>(messages);

  useEffect(() => {
    systemPromptRef.current = systemPrompt;
  }, [systemPrompt]);

  useEffect(() => {
    messagesRef.current = messages;
    // Guardar en localStorage cada vez que cambien los mensajes
    if (messages.length > 0) {
      saveMessagesToStorage(messages);
    }
  }, [messages]);

  useEffect(() => {
    if (!initialAssistantMessage) {
      return;
    }

    const hasUserMessages = messagesRef.current.some((message) => message.role === 'user');
    if (hasUserMessages) {
      return;
    }

    if (messagesRef.current.length === 0) {
      const initialMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: initialAssistantMessage,
        createdAt: new Date().toISOString(),
      };
      messagesRef.current = [initialMessage];
      setMessages([initialMessage]);
      return;
    }

    if (messagesRef.current.length === 1 && messagesRef.current[0].role === 'assistant') {
      const current = messagesRef.current[0];
      if (current.content !== initialAssistantMessage) {
        const updatedMessage: ChatMessage = {
          ...current,
          content: initialAssistantMessage,
        };
        messagesRef.current = [updatedMessage];
        setMessages([updatedMessage]);
      }
    }
  }, [initialAssistantMessage]);

  const stop = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setIsLoading(false);
  }, []);

  const reset = useCallback(() => {
    stop();
    setError(null);
    setUsage(null);
    setActiveModel(null);

    // Limpiar localStorage al resetear
    localStorage.removeItem(STORAGE_KEY);

    if (!initialAssistantMessage) {
      messagesRef.current = [];
      setMessages([]);
      return;
    }

    const initialMessage: ChatMessage = {
      id: createId(),
      role: 'assistant',
      content: initialAssistantMessage,
      createdAt: new Date().toISOString(),
    };
    messagesRef.current = [initialMessage];
    setMessages([initialMessage]);
  }, [initialAssistantMessage, stop]);

  const sendMessage = useCallback(
    async (content: string) => {
      const trimmed = content.trim();
      if (!trimmed) return;

      setError(null);
      setIsLoading(true);

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: trimmed,
        createdAt: new Date().toISOString(),
      };

      const pendingMessages = [...messagesRef.current, userMessage];
      messagesRef.current = pendingMessages;
      setMessages(pendingMessages);

      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      const payloadMessages: GroqChatMessage[] = [
        { role: 'system', content: systemPromptRef.current },
        ...pendingMessages.map((message) => ({ role: message.role, content: message.content })),
      ];

      try {
        const response = await createGroqChatCompletion({
          messages: payloadMessages,
          signal: controller.signal,
        });

        const assistantMessage: ChatMessage = {
          id: createId(),
          role: 'assistant',
          content: response.content,
          createdAt: new Date().toISOString(),
          model: response.model,
        };

        const nextMessages = [...messagesRef.current, assistantMessage];
        messagesRef.current = nextMessages;
        setMessages(nextMessages);
        setActiveModel(response.model);
        setUsage(mapUsage(response.usage));
      } catch (caughtError) {
        if (caughtError instanceof DOMException && caughtError.name === 'AbortError') {
          return;
        }

        const fallbackMessage =
          caughtError instanceof Error
            ? caughtError.message
            : 'Ocurrió un error desconocido al consultar el asistente.';
        setError(fallbackMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  return useMemo(
    () => ({
      messages,
      isLoading,
      error,
      activeModel,
      usage,
      sendMessage,
      stop,
      reset,
    }),
    [messages, isLoading, error, activeModel, usage, sendMessage, stop, reset],
  );
}
