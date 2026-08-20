import { Order } from '../types';

/**
 * Sends a notification to the server-side Telegram proxy when a new order is placed.
 * The Telegram Bot Token and Chat ID are kept secure on the backend.
 */
export const sendTelegramNotification = async (order: Order): Promise<void> => {
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const message = `✨ ${order.clientName} placed a new order on ${date}\n🆔 Order ID: ${order.id}\n💼 Service: ${order.serviceType}\n💰 Price: $${order.price}`;
  await sendTelegramMessage(message, 'order_created');
};

export const sendRevisionRequestedNotification = async (order: Order, notes: string): Promise<void> => {
  const message = `🔄 Revision Requested by ${order.clientName}\n🆔 Order: ${order.id}\n📝 Notes: ${notes}`;
  await sendTelegramMessage(message, 'revision_requested');
};

export const sendPaymentAwaitedNotification = async (order: Order): Promise<void> => {
  const message = `💳 Payment Awaited\n${order.clientName} is now in AWAITING_PAYMENT status for order ${order.id}.`;
  await sendTelegramMessage(message, 'payment_awaited');
};

export const sendClientUploadNotification = async (uploadData: {
  clientName: string;
  email: string;
  whatsapp: string;
  eventName: string;
  filesCount: number;
}): Promise<void> => {
  const message = `📤 New Client Upload\n` +
    `👤 Client: ${uploadData.clientName}\n` +
    `📧 Email: ${uploadData.email}\n` +
    `💬 WhatsApp/Mobile: ${uploadData.whatsapp}\n` +
    `🎉 Event/Project: ${uploadData.eventName}\n` +
    `📁 Files: ${uploadData.filesCount} file(s) uploaded.`;
  await sendTelegramMessage(message, 'client_upload');
};

const sendTelegramMessage = async (message: string, type: string = 'general'): Promise<void> => {
  try {
    const response = await fetch('/api/telegram-notify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        message,
      }),
    });
    
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      console.warn('Telegram notification endpoint response:', err);
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
};
