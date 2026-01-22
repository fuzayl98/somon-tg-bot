import dotenv from "dotenv";
import { Telegraf } from "telegraf";
import fs from "fs";
import path from "path";

dotenv.config();

const token = process.env.BOT_TOKEN || "";
if (!token) {
  console.error("BOT_TOKEN is missing. Set it in /opt/somon-vpn-bot/.env");
  process.exit(1);
}

const bot = new Telegraf(token);

const DATA_DIR = path.resolve(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "known_users.json");

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
};

const loadKnownUsers = () => {
  try {
    ensureDataDir();
    if (!fs.existsSync(USERS_FILE)) {
      return new Set();
    }
    const raw = fs.readFileSync(USERS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch (error) {
    console.error("Failed to load known users:", error);
    return new Set();
  }
};

const saveKnownUsers = (users) => {
  try {
    ensureDataDir();
    const data = JSON.stringify(Array.from(users), null, 2);
    fs.writeFileSync(USERS_FILE, data, "utf-8");
  } catch (error) {
    console.error("Failed to save known users:", error);
  }
};

const knownUsers = loadKnownUsers();

const CONTACTS_TEXT =
  "📬 Контакты\n\n" +
  "Если у вас есть вопросы или предложения, вы можете связаться с нами:\n" +
  "✉️ somonvpn.app@gmail.com";

const buildStartKeyboard = () => ({
  inline_keyboard: [[
    { text: "🚀 Открыть мини-апп", web_app: { url: "https://somon-app.com" } }
  ], [
    { text: "📄 Политика обработки данных", url: "https://somon-app.com/privacy-policy" }
  ], [
    { text: "📄 Пользовательское соглашение", url: "https://somon-app.com/terms-of-service" }
  ], [
    { text: "📬 Контакты", callback_data: "contacts" }
  ]]
});

const buildBackKeyboard = () => ({
  inline_keyboard: [[
    { text: "⬅️ Назад", callback_data: "back" }
  ]]
});

const sendWelcome = (ctx) => {
  const text =
    "Добро пожаловать в Somon VPN 🇹🇯\n\n" +
    "Нажми кнопку ниже, чтобы открыть приложение.";

  return ctx.reply(text, {
    reply_markup: buildStartKeyboard()
  });
};

const sendReturn = (ctx) => {
  const text =
    "Чтобы воспользоваться ботом, запустите мини-апп.";

  return ctx.reply(text, {
    reply_markup: buildStartKeyboard()
  });
};

bot.command("contacts", async (ctx) => {
  return ctx.reply(CONTACTS_TEXT, {
    reply_markup: buildBackKeyboard()
  });
});

bot.action("contacts", async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.reply(CONTACTS_TEXT, {
    reply_markup: buildBackKeyboard()
  });
});

bot.action("back", async (ctx) => {
  await ctx.answerCbQuery();
  return sendReturn(ctx);
});

bot.start(async (ctx) => {
  const userId = ctx.from?.id;
  const isKnown = userId ? knownUsers.has(String(userId)) : false;

  if (userId && !isKnown) {
    knownUsers.add(String(userId));
    saveKnownUsers(knownUsers);
    return sendWelcome(ctx);
  }

  return sendReturn(ctx);
});

bot.on("text", async (ctx) => {
  const text = "Бот не отвечает на другие сообщения.";
  return ctx.reply(text);
});

bot.launch();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
