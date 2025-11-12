require('dotenv').config();

const { Telegraf } = require('telegraf');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

bot.start((ctx) => ctx.reply('Добро пожаловать в бот Таро! Отправьте /tarot, чтобы получить расклад.'));

bot.command('tarot', async (ctx) => {
  try {
    ctx.reply('Тяну карту для вас...');

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = 'Ты — таролог. Сделай расклад на одну карту для пользователя.';

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const reading = response.text();

    ctx.reply(reading);
  } catch (error) {
    console.error(error);
    ctx.reply('Извините, что-то пошло не так. Пожалуйста, попробуйте еще раз позже.');
  }
});

bot.launch();

console.log('Бот запущен');
