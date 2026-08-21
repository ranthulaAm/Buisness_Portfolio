export default async function handler(req: any, res: any) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { type, message, payload } = req.body || {};

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Invalid notification message" });
  }

  // Sanitize and limit message length to prevent spam abuse
  const trimmedMessage = message.trim().slice(0, 2000);
  if (trimmedMessage.length === 0) {
    return res.status(400).json({ error: "Message content cannot be empty" });
  }

  const defaultBotToken = "8312949734:AAF5_Jax7u6sMP6tpOr3Xw7lPZRleLDp1PA";
  const defaultChatId = "8072420741";

  const envToken = process.env.TELEGRAM_BOT_TOKEN;
  const envChatId = process.env.TELEGRAM_CHAT_ID;

  // Validate bot token format (must contain ':' and be sufficient length)
  const botToken = (envToken && envToken.includes(":") && envToken.length > 25)
    ? envToken
    : defaultBotToken;

  // Validate chat ID format
  const chatId = (envChatId && envChatId.length > 5 && envChatId !== "3963")
    ? envChatId
    : defaultChatId;

  if (!botToken || !chatId) {
    console.warn("Telegram bot token or chat ID is missing");
    return res.status(500).json({ error: "Telegram service is not configured" });
  }

  try {
    const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const response = await fetch(telegramUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: trimmedMessage,
        disable_web_page_preview: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Telegram API response error:", errorText);
      return res.status(response.status).json({ error: "Failed to send notification via Telegram" });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Error sending Telegram message from server:", error);
    return res.status(500).json({ error: "Internal server error sending notification" });
  }
}
