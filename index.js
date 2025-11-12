require('dotenv').config();

const { Telegraf } = require('telegraf');
const { OpenAI } = require('openai');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

bot.start((ctx) => ctx.reply('Welcome to the Tarot AI bot! Send /tarot to get a reading.'));

bot.command('tarot', async (ctx) => {
  try {
    ctx.reply('Drawing a card for you...');

    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo-0125',
      messages: [
        {
          role: 'system',
          content: 'You are a tarot reader. You will provide a one-card reading. The user is asking for a tarot reading.',
        },
        { role: 'user', content: 'Give me a one-card tarot reading.' },
      ],
    });

    const reading = response.choices[0].message.content;
    ctx.reply(reading);
  } catch (error) {
    console.error(error);
    ctx.reply('Sorry, something went wrong. Please try again later.');
  }
});

bot.launch();

console.log('Bot started');
