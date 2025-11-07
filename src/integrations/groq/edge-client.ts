import { supabase } from '@/integrations/supabase/client';
import { ChatRole } from '@/types/chat';

export interface GroqChatMessage {
  role: ChatRole;
  content: string;
}

export interface GroqChatCompletion {
  content: string;
  model: string;
  usage: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  } | null;
}

export interface CreateGroqChatCompletionOptions {
  messages: GroqChatMessage[];
  signal?: AbortSignal;
  temperature?: number;
  maxTokens?: number;
}

export async function createGroqChatCompletion({
  messages,
  signal,
  temperature = 0.2,
  maxTokens = 1024,
}: CreateGroqChatCompletionOptions): Promise<GroqChatCompletion> {
  // Get the current session
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No estás autenticado. Por favor inicia sesión.');
  }

  const { data, error } = await supabase.functions.invoke('groq-chat', {
    body: {
      messages,
      temperature,
      maxTokens,
    },
  });

  if (error) {
    throw new Error(error.message || 'Error al consultar el asistente de IA');
  }

  if (!data || !data.choices || !data.choices[0]) {
    throw new Error('Respuesta inválida del asistente de IA');
  }

  const messageContent = data.choices[0].message?.content?.trim();

  if (!messageContent) {
    throw new Error('La respuesta del asistente no contenía texto utilizable');
  }

  return {
    content: messageContent,
    model: data.model ?? 'unknown',
    usage: data.usage ?? null,
  };
}
