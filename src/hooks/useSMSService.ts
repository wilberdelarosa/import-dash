import { useState } from 'react';

interface SendSMSOptions {
  phoneNumber: string;
  message: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export const useSMSService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendSMS = async (options: SendSMSOptions): Promise<SMSResponse> => {
    setLoading(true);
    setError(null);

    try {
      // En desarrollo, simular el envío
      if (import.meta.env.DEV) {
        console.log(`📱 SMS enviado a ${options.phoneNumber}: ${options.message}`);
        return {
          success: true,
          messageId: `dev-${Date.now()}`,
        };
      }

      // En producción, usar Supabase Function para enviar con Twilio
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-sms`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('sb-auth-token') || ''}`,
          },
          body: JSON.stringify(options),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al enviar SMS');
      }

      const data = await response.json();
      return { success: true, messageId: data.messageId };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar SMS';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  return {
    sendSMS,
    loading,
    error,
  };
};
