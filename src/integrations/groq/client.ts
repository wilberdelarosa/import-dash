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

const GROQ_API_BASE_URL = 'https://api.groq.com/openai/v1';

export const DEFAULT_GROQ_MODELS = [
  'llama-3.3-70b-versatile',
  'llama-3.1-70b-versatile',
  'llama-3.1-8b-instant',
  'mixtral-8x7b-32768',
] as const;

const getEnvModelPriority = (): string[] => {
  const raw = import.meta.env.VITE_GROQ_MODEL_PRIORITY as string | undefined;
  if (!raw) return [];
  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
};

export const getGroqModelPriority = (): string[] => {
  const fromEnv = getEnvModelPriority();
  if (fromEnv.length) {
    return fromEnv;
  }
  return [...DEFAULT_GROQ_MODELS];
};

const shouldRetry = (status: number, message: string, code?: string) => {
  if (status === 429 || status === 500 || status === 502 || status === 503) {
    return true;
  }

  const normalized = message.toLowerCase();
  if (
    normalized.includes('rate limit') ||
    normalized.includes('quota') ||
    normalized.includes('exceeded') ||
    normalized.includes('maximum context length') ||
    normalized.includes('context length') ||
    normalized.includes('token limit') ||
    normalized.includes('resource has been exhausted') ||
    normalized.includes('overloaded')
  ) {
    return true;
  }

  if (code) {
    const normalizedCode = code.toLowerCase();
    if (
      normalizedCode.includes('insufficient_quota') ||
      normalizedCode.includes('rate_limit_exceeded')
    ) {
      return true;
    }
  }

  return false;
};

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
  const apiKey = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

  if (!apiKey) {
    throw new Error(
      'No se encontró la clave VITE_GROQ_API_KEY. Configúrala en tu archivo .env local antes de usar el asistente.',
    );
  }

  const models = getGroqModelPriority();
  const errors: string[] = [];

  for (const model of models) {
    try {
      const response = await fetch(`${GROQ_API_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
        signal,
      });

      if (!response.ok) {
        let errorMessage = `Solicitud rechazada con estado ${response.status}`;
        let errorCode: string | undefined;

        try {
          const errorBody = (await response.json()) as { error?: { message?: string; code?: string } };
          if (errorBody?.error?.message) {
            errorMessage = errorBody.error.message;
          }
          if (errorBody?.error?.code) {
            errorCode = errorBody.error.code;
          }
        } catch {
          // Ignorar parseos fallidos y usar el mensaje por defecto
        }

        errors.push(`${model}: ${errorMessage}`);

        if (shouldRetry(response.status, errorMessage, errorCode)) {
          continue;
        }

        throw new Error(errorMessage);
      }

      const data = (await response.json()) as {
        choices?: { message?: { role: ChatRole; content?: string } }[];
        usage?: {
          prompt_tokens?: number;
          completion_tokens?: number;
          total_tokens?: number;
        };
        model?: string;
      };

      const messageContent = data.choices?.[0]?.message?.content?.trim();

      if (!messageContent) {
        throw new Error('La respuesta de Groq no contenía texto utilizable.');
      }

      return {
        content: messageContent,
        model: data.model ?? model,
        usage: data.usage ?? null,
      };
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw error;
      }

      const fallbackMessage =
        error instanceof Error ? error.message : 'Error desconocido al consultar el modelo actual';
      errors.push(`${model}: ${fallbackMessage}`);
      // Probar siguiente modelo
    }
  }

  const uniqueErrors = Array.from(new Set(errors));
  throw new Error(
    uniqueErrors.length
      ? `No se pudo obtener respuesta del asistente. Detalles: ${uniqueErrors.join(' | ')}`
      : 'No se pudo obtener respuesta del asistente. Verifica tu conexión e intenta nuevamente.',
  );
}
