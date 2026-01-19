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

const PRIVACY_TEXT =
  "Политика конфиденциальности Telegram-бота @somon_vpn_bot\n" +
  "Администрация Telegram-бота @somon_vpn_bot уважает конфиденциальность пользователей и принимает меры для защиты информации, используемой при работе сервиса. Настоящая политика разработана с учетом требований Telegram, а также общих правил защиты данных, применяемых в цифровых сервисах.\n\n" +
  "Обработка данных\n" +
  "Telegram-бот @somon_vpn_bot не запрашивает и не обрабатывает персональные данные пользователей.\n" +
  "В процессе работы сервиса используется только технический идентификатор Telegram (Telegram ID), который автоматически передается Telegram при взаимодействии с ботом и не позволяет установить личность пользователя.\n\n" +
  "Цели использования\n" +
  "Telegram ID применяется исключительно для:\n" +
  "функционирования сервиса;\n" +
  "предоставления доступа к услугам;\n" +
  "отправки сервисных уведомлений и обеспечения безопасности.\n\n" +
  "Хранение и удаление\n" +
  "Данные, связанные с Telegram ID, хранятся в течение времени, необходимого для работы сервиса.\n" +
  "Пользователь вправе запросить удаление данных, привязанных к его Telegram ID, за исключением информации, необходимой для соблюдения правил сервиса (например, данных о блокировке).\n\n" +
  "Передача данных третьим лицам\n" +
  "Администрация @somon_vpn_bot не продает, не передает и не раскрывает данные пользователей третьим лицам, за исключением случаев, предусмотренных законодательством.\n\n" +
  "Использование сервиса несовершеннолетними\n" +
  "Если вам стало известно, что данные несовершеннолетнего были использованы без согласия родителей или законных представителей, пожалуйста, свяжитесь с администрацией сервиса.\n\n" +
  "Изменения политики\n" +
  "Администрация @somon_vpn_bot вправе обновлять настоящую Политику конфиденциальности. Актуальная версия всегда доступна через Telegram-бот. О существенных изменениях пользователи могут быть уведомлены дополнительно.\n\n" +
  "Обратная связь\n" +
  "По вопросам, связанным с конфиденциальностью, вы можете обратиться в службу поддержки через раздел «Помощь» Telegram-бота @somon_vpn_bot.\n" +
  "Если вы не согласны с условиями данной Политики, пожалуйста, прекратите использование сервиса.";

const buildStartKeyboard = () => ({
  inline_keyboard: [[
    { text: "🚀 Открыть мини-апп", web_app: { url: "https://somon-app.com" } }
  ], [
    { text: "🔒 Политика конфиденциальности", callback_data: "privacy" }
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

bot.command("privacy", async (ctx) => {
  return ctx.reply(PRIVACY_TEXT, {
    reply_markup: buildBackKeyboard()
  });
});

bot.action("privacy", async (ctx) => {
  await ctx.answerCbQuery();
  return ctx.reply(PRIVACY_TEXT, {
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
