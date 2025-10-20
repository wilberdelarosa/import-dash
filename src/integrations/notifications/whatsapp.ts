const WHATSAPP_WEBHOOK_URL = import.meta.env.VITE_WHATSAPP_WEBHOOK_URL;
const WHATSAPP_WEBHOOK_TOKEN = import.meta.env.VITE_WHATSAPP_WEBHOOK_TOKEN;

type WhatsappPayload = {
  message: string;
  metadata?: Record<string, unknown>;
};

export async function sendWhatsappNotification({ message, metadata }: WhatsappPayload) {
  if (!WHATSAPP_WEBHOOK_URL) {
    return { skipped: true };
  }

  try {
    const response = await fetch(WHATSAPP_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(WHATSAPP_WEBHOOK_TOKEN ? { Authorization: `Bearer ${WHATSAPP_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ message, metadata }),
    });

    if (!response.ok) {
      throw new Error(`WhatsApp webhook responded with ${response.status}`);
    }

    return { skipped: false };
  } catch (error) {
    console.error('Error sending WhatsApp notification', error);
    return { skipped: false, error };
  }
}
