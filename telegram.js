/**
 * Telegram admin bridge.
 * The WhatsApp bot pushes curated updates here — staff watch this
 * Telegram chat/channel instead of sitting inside WhatsApp all day.
 *
 * SETUP:
 *   1. Message @BotFather on Telegram, send /newbot, follow the prompts.
 *      It gives you a TOKEN - put it below or in the TELEGRAM_TOKEN env var.
 *   2. Create a Telegram group or channel for staff, add your new bot to it.
 *   3. Get the chat ID: add @RawDataBot to the same group temporarily,
 *      it will post the chat's ID, then remove it. Put that ID below.
 */

const TelegramBot = require('node-telegram-bot-api');

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN || 'YOUR_TELEGRAM_BOT_TOKEN_HERE';
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID || 'YOUR_ADMIN_CHAT_ID_HERE';

let bot = null;
let enabled = false;

if (TELEGRAM_TOKEN !== 'YOUR_TELEGRAM_BOT_TOKEN_HERE') {
  bot = new TelegramBot(TELEGRAM_TOKEN, { polling: false });
  enabled = true;
  console.log('✅ Telegram admin bridge enabled.');
} else {
  console.log('⚠️  Telegram bridge not configured yet — admin updates will only log to console. See telegram.js setup notes.');
}

/**
 * Push a curated update to the staff Telegram chat.
 * Falls back to console logging if Telegram isn't configured yet,
 * so the bot still runs fine without it.
 */
async function notifyAdmin(text) {
  console.log(`[ADMIN UPDATE] ${text}`);
  if (!enabled) return;
  try {
    await bot.sendMessage(TELEGRAM_ADMIN_CHAT_ID, text);
  } catch (err) {
    console.error('Telegram notify failed:', err.message);
  }
}

module.exports = { notifyAdmin };
