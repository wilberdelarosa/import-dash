const EMAIL_WEBHOOK_URL = import.meta.env.VITE_EMAIL_WEBHOOK_URL;
const EMAIL_WEBHOOK_TOKEN = import.meta.env.VITE_EMAIL_WEBHOOK_TOKEN;

type EmailPayload = {
  to: string;
  subject: string;
  body: string;
  metadata?: Record<string, unknown>;
};

export async function sendEmailNotification({ to, subject, body, metadata }: EmailPayload) {
  if (!EMAIL_WEBHOOK_URL || !to) {
    return { skipped: true };
  }

  try {
    const response = await fetch(EMAIL_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(EMAIL_WEBHOOK_TOKEN ? { Authorization: `Bearer ${EMAIL_WEBHOOK_TOKEN}` } : {}),
      },
      body: JSON.stringify({ to, subject, body, metadata }),
    });

    if (!response.ok) {
      throw new Error(`Email webhook responded with ${response.status}`);
    }

    return { skipped: false };
  } catch (error) {
    console.error('Error sending email notification', error);
    return { skipped: false, error };
  }
}
