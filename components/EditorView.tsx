import React, { useState, useEffect } from 'react';
import { PlayIcon, SaveIcon, DownloadIcon } from './icons';
import { Bot } from '../types';

interface EditorViewProps {
  onLaunch: (code: string, token: string, language: 'python' | 'javascript') => void;
  onUpdate: (id: number, code: string, token: string, language: 'python' | 'javascript') => void;
  botToEdit: Bot | null;
  onCancelEdit: () => void;
}

const pythonTemplate = `import os
from telegram import Update, ReplyKeyboardMarkup, KeyboardButton
from telegram.ext import Updater, CommandHandler, CallbackContext

def start(update: Update, context: CallbackContext) -> None:
    """Sends a message with three inline buttons attached."""
    keyboard = [
        [KeyboardButton("Option 1"), KeyboardButton("Option 2")],
        [KeyboardButton("Help")],
    ]
    reply_markup = ReplyKeyboardMarkup(keyboard, resize_keyboard=True)
    update.message.reply_text('Hello! I am your new bot. Choose an option:', reply_markup=reply_markup)

def main() -> None:
    # IMPORTANT: The bot token is read from an environment variable.
    updater = Updater(token=os.environ.get("TELEGRAM_TOKEN"))
    dispatcher = updater.dispatcher
    dispatcher.add_handler(CommandHandler("start", start))
    updater.start_polling()
    updater.idle()

if __name__ == '__main__':
    main()
`;

const jsTemplate = `const { Telegraf, Markup } = require('telegraf');

// IMPORTANT: The bot token is read from an environment variable.
const bot = new Telegraf(process.env.TELEGRAM_TOKEN);

bot.start((ctx) => {
  return ctx.reply(
    'Welcome! I am your new bot. Choose an option:',
    Markup.inlineKeyboard([
      Markup.button.callback('Option 1', 'option_1'),
      Markup.button.callback('Option 2', 'option_2'),
    ])
  );
});

bot.command('help', (ctx) => ctx.reply('This is a help message.'));

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
`;

export const EditorView: React.FC<EditorViewProps> = ({ onLaunch, onUpdate, botToEdit, onCancelEdit }) => {
  const [code, setCode] = useState<string>(pythonTemplate);
  const [token, setToken] = useState<string>('');
  const [language, setLanguage] = useState<'python' | 'javascript'>('python');
  const [error, setError] = useState<string>('');

  const isEditing = botToEdit !== null;

  useEffect(() => {
    if (botToEdit) {
      setCode(botToEdit.code);
      setToken(botToEdit.token);
      setLanguage(botToEdit.language);
      setError('');
    } else {
      // Reset to default python template when creating a new bot
      setCode(pythonTemplate);
      setToken('');
      setLanguage('python');
      setError('');
    }
  }, [botToEdit]);

  const handleSubmit = () => {
    if (!token.trim()) {
      setError('Telegram Bot Token is required.');
      return;
    }
    setError('');
    if (isEditing) {
      onUpdate(botToEdit.id, code, token, language);
    } else {
      onLaunch(code, token, language);
    }
  };
  
  const handleTemplateChange = (lang: 'python' | 'javascript') => {
    setLanguage(lang);
    if (!isEditing) {
      setCode(lang === 'python' ? pythonTemplate : jsTemplate);
    }
  };

  const handleDownload = () => {
    const fileExtension = language === 'python' ? 'py' : 'js';
    const botName = (botToEdit ? botToEdit.name.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'new_bot').replace(/ /g, '_');
    const filename = `${botName}.${fileExtension}`;
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
       <div className="text-center">
        <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
          {isEditing 
            ? <>Update <span className="text-sky-400">{botToEdit.name}</span></>
            : <>Deploy a Telegram Bot in <span className="text-sky-400">Seconds</span></>
          }
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-slate-400">
           {isEditing
            ? 'Modify the code or token below, then update the simulation or download the file to run.'
            : 'Write your code, enter your token, and instantly deploy a simulation or download the file to run.'
           }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 rounded-lg shadow-lg overflow-hidden border border-slate-700">
          <div className="flex items-center justify-between p-3 bg-slate-900/50 border-b border-slate-700">
             <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-red-500 rounded-full"></span>
              <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
              <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            </div>
            <div className="flex gap-2 rounded-md p-1 bg-slate-700/50">
               <button onClick={() => handleTemplateChange('python')} className={`px-3 py-1 text-xs rounded ${language === 'python' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>Python</button>
               <button onClick={() => handleTemplateChange('javascript')} className={`px-3 py-1 text-xs rounded ${language === 'javascript' ? 'bg-sky-500 text-white' : 'text-slate-300 hover:bg-slate-600'}`}>JavaScript</button>
            </div>
          </div>
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full h-[500px] p-4 bg-transparent text-slate-300 font-mono text-sm focus:outline-none resize-none"
            placeholder="Paste your bot code here..."
            spellCheck="false"
          />
        </div>

        <div className="bg-slate-800 rounded-lg shadow-lg p-6 border border-slate-700 flex flex-col justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-4">Configuration</h2>
            <div className="space-y-4">
              <div>
                <label htmlFor="token" className="block text-sm font-medium text-slate-300 mb-1">
                  Telegram Bot Token
                </label>
                <input
                  id="token"
                  type="password"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-200"
                  placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                />
              </div>
              {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
            </div>
          </div>
          <div className="space-y-3 mt-4">
             <button
              onClick={handleSubmit}
              className={`w-full flex items-center justify-center gap-2 font-bold py-3 px-4 rounded-lg transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 ${
                isEditing
                  ? 'bg-sky-600 hover:bg-sky-500 text-white focus:ring-sky-500'
                  : 'bg-green-600 hover:bg-green-500 text-white focus:ring-green-500'
              }`}
            >
              {isEditing ? <SaveIcon className="w-6 h-6" /> : <PlayIcon className="w-6 h-6" />}
              {isEditing ? 'Update Simulation' : 'Launch Simulation'}
            </button>
            <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 bg-slate-600 hover:bg-slate-500 text-white font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-500"
              >
                <DownloadIcon className="w-6 h-6" />
                Download Code
            </button>
            {isEditing && (
              <button
                onClick={onCancelEdit}
                className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 font-bold py-3 px-4 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-slate-600"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
