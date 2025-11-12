require('dotenv').config();

const { Telegraf } = require('telegraf');
const { OpenAI } = require('openai');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

// Настраиваем клиент OpenAI для работы с вашим API
const openai = new OpenAI({
  apiKey: process.env.GEMINI_API_KEY,
  baseURL: 'https://api.artemox.com/v1',
});

bot.start((ctx) => ctx.reply('Добро пожаловать в бот Таро! Отправьте /tarot, чтобы получить расклад.'));

bot.command('tarot', async (ctx) => {
  try {
    ctx.reply('Тяну карту для вас...');

    const response = await openai.chat.completions.create({
      model: 'gemini-2.5-flash',
      messages: [
        {
          role: 'system',
          content: 'Ты — таролог. Сделай расклад на одну карту для пользователя.',
        },
        { role: 'user', content: 'Сделай мне расклад на одну карту.' },
      ],
    });

    const reading = response.choices[0].message.content;
    ctx.reply(reading);
  } catch (error) {
    console.error('Ошибка при обращении к API:', error);
    ctx.reply('Извините, что-то пошло не так. Пожалуйста, попробуйте еще раз позже.');
  }
});

bot.launch();

console.log('Бот запущен');
