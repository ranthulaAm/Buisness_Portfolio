import { Order } from '../types';

const BOT_TOKEN = '8312949734:AAFMJwBwqYP5OPNMoeKg9_RhY6DL2cjK0vQ';
const CHAT_ID = '8072420741';

/**
 * Sends a notification to the specified Telegram bot when a new order is placed.
 */
export const sendTelegramNotification = async (order: Order): Promise<void> => {
  const date = new Date(order.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  const message = `${order.clientName} placed a new order on ${date}`;
  await sendTelegramMessage(message);
};

export const sendRevisionRequestedNotification = async (order: Order, notes: string): Promise<void> => {
  const message = `🔄 Revision Requested by ${order.clientName}\nOrder: ${order.id}\nNotes: ${notes}`;
  await sendTelegramMessage(message);
};

export const sendPaymentAwaitedNotification = async (order: Order): Promise<void> => {
  const message = `💳 Payment Awaited\n${order.clientName} is now in AWAITING_PAYMENT status for order ${order.id}.`;
  await sendTelegramMessage(message);
};

const sendTelegramMessage = async (message: string): Promise<void> => {
  const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
      }),
    });
    
    if (!response.ok) {
      console.error('Telegram API error:', await response.text());
    }
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
  }
};
