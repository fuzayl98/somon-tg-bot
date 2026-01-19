import dotenv from "dotenv";
import { Telegraf } from "telegraf";

dotenv.config();

const token = process.env.BOT_TOKEN || "";
if (!token) {
  console.error("BOT_TOKEN is missing. Set it in /opt/somon-vpn-bot/.env");
  process.exit(1);
}

const bot = new Telegraf(token);

bot.start(async (ctx) => {
  const text =
    "Добро пожаловать в Somon VPN 🇹🇯\n\n" +
    "Нажми кнопку ниже, чтобы открыть приложение.";

  return ctx.reply(text, {
    reply_markup: {
      inline_keyboard: [[
        { text: "🚀 Открыть мини-апп", web_app: { url: "https://somon-app.com" } }
      ]]
    }
  });
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
