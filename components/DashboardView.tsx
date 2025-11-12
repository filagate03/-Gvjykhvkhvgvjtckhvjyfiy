import React, { useState, useRef, useEffect } from 'react';
// FIX: Import KeyboardButton type to handle both button types.
import { Bot, BotStatus, Message, InlineKeyboardButton, KeyboardButton } from '../types';
import { LogViewer } from './LogViewer';
import { StopIcon, RestartIcon, TrashIcon, CpuIcon, RamIcon, CheckCircleIcon, XCircleIcon, WarningIcon, ChevronDownIcon, ChevronUpIcon, PencilIcon, SendIcon } from './icons';

interface DashboardViewProps {
  bots: Bot[];
  onUpdateStatus: (id: number, status: BotStatus) => void;
  onDelete: (id: number) => void;
  onRestart: (id: number) => void;
  onEdit: (id: number) => void;
  onSendMessage: (id: number, text: string) => void;
}

interface ChatSimulatorProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  botStatus: BotStatus;
}

const ChatSimulator: React.FC<ChatSimulatorProps> = ({ messages, onSendMessage, botStatus }) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && botStatus === BotStatus.RUNNING) {
      onSendMessage(input.trim());
      setInput('');
    }
  };
  
  // FIX: Broaden button type to handle both KeyboardButton and InlineKeyboardButton, which resolves the TypeScript error on the following line.
  const handleButtonClick = (button: KeyboardButton | InlineKeyboardButton) => {
    if (botStatus === BotStatus.RUNNING) {
      // For inline keyboards, we send the callback_data. For reply keyboards, we send the text.
      const messageToSend = 'callback_data' in button ? button.callback_data : button.text;
      onSendMessage(messageToSend);
    }
  };

  const isBotRunning = botStatus === BotStatus.RUNNING;

  return (
    <div className="bg-slate-900/50 rounded-lg h-64 flex flex-col border border-slate-700">
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full text-slate-500 text-sm p-4 text-center">
            {isBotRunning ? 'Your bot is running. Send a message to start the simulation.' : 'Start the bot to begin the chat simulation.'}
          </div>
        )}
        {messages.map((msg, index) => (
          <div key={index} className="flex flex-col">
            <div className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm break-words ${
                  msg.sender === 'user'
                    ? 'bg-sky-600 text-white'
                    : 'bg-slate-700 text-slate-200'
                }`}>
                {msg.text}
              </div>
            </div>
            {msg.sender === 'bot' && msg.buttons && (
              <div className="mt-2 flex flex-wrap gap-2 justify-start">
                {msg.buttons.map((row, rIndex) => (
                  <div key={rIndex} className="flex flex-wrap gap-2">
                    {row.map((button, bIndex) => (
                      <button
                        key={bIndex}
                        // FIX: Remove incorrect type assertion to pass the correct button type.
                        onClick={() => handleButtonClick(button)}
                        className="bg-slate-600 hover:bg-slate-500 text-white text-sm py-1 px-3 rounded-md transition-colors"
                      >
                        {button.text}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-slate-700 p-2">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isBotRunning ? "Type /start and press Enter" : "Bot is not running"}
            className="flex-1 bg-slate-800 border border-slate-600 rounded-md px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-800/50 disabled:cursor-not-allowed"
            aria-label="Chat input"
            disabled={!isBotRunning}
          />
          <button type="submit" className="bg-sky-600 text-white p-2 rounded-md hover:bg-sky-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center" aria-label="Send message" disabled={!isBotRunning}>
            <SendIcon className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
};


const statusConfig = {
  [BotStatus.RUNNING]: { color: 'bg-green-500', icon: <CheckCircleIcon className="w-5 h-5 text-green-300" />, text: 'Running' },
  [BotStatus.STOPPED]: { color: 'bg-gray-500', icon: <XCircleIcon className="w-5 h-5 text-gray-300" />, text: 'Stopped' },
  [BotStatus.ERROR]: { color: 'bg-red-500', icon: <WarningIcon className="w-5 h-5 text-red-300" />, text: 'Error' },
};

const BotCard: React.FC<{ bot: Bot } & Omit<DashboardViewProps, 'bots'>> = ({ bot, onUpdateStatus, onDelete, onRestart, onEdit, onSendMessage }) => {
  const [simVisible, setSimVisible] = useState(false);
  const config = statusConfig[bot.status];

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg border border-slate-700 transition-all hover:border-sky-500/50">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-bold text-white">{bot.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-3 h-3 rounded-full ${config.color}`}></span>
              <span className="text-sm font-medium text-slate-300">{config.text}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(bot.id)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md" aria-label="Edit Bot"><PencilIcon className="w-5 h-5"/></button>
            {bot.status === BotStatus.RUNNING && (
              <button onClick={() => onUpdateStatus(bot.id, BotStatus.STOPPED)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md" aria-label="Stop Bot"><StopIcon className="w-5 h-5"/></button>
            )}
             {(bot.status === BotStatus.STOPPED || bot.status === BotStatus.ERROR) && (
              <button onClick={() => onRestart(bot.id)} className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-md" aria-label="Restart Bot"><RestartIcon className="w-5 h-5"/></button>
            )}
            <button onClick={() => onDelete(bot.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-slate-700 rounded-md" aria-label="Delete Bot"><TrashIcon className="w-5 h-5"/></button>
          </div>
        </div>
        
        <div className="mt-4 flex gap-4 text-sm text-slate-400">
          <div className="flex items-center gap-2">
            <CpuIcon className="w-5 h-5"/>
            <span>CPU: {bot.cpuUsage}%</span>
          </div>
          <div className="flex items-center gap-2">
            <RamIcon className="w-5 h-5"/>
            <span>RAM: {bot.ramUsage} MB</span>
          </div>
        </div>
      </div>
       <div className="border-t border-slate-700 px-4 py-2">
        <button onClick={() => setSimVisible(!simVisible)} className="w-full flex justify-between items-center text-sm text-slate-300 hover:text-white">
          <span>{simVisible ? 'Hide' : 'Show'} Simulation & Logs</span>
          {simVisible ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
        </button>
      </div>
      {simVisible && (
        <div className="border-t border-slate-700 bg-black/20 p-2 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
             <h4 className="text-xs font-bold text-slate-400 uppercase px-2 pb-2">Telegram Simulation</h4>
             <ChatSimulator messages={bot.messages} onSendMessage={(text) => onSendMessage(bot.id, text)} botStatus={bot.status} />
          </div>
          <div>
             <h4 className="text-xs font-bold text-slate-400 uppercase px-2 pb-2">Live Logs</h4>
             <LogViewer logs={bot.logs} />
          </div>
        </div>
      )}
    </div>
  );
};


export const DashboardView: React.FC<DashboardViewProps> = ({ bots, ...props }) => {
  if (bots.length === 0) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">No Bots Deployed</h2>
        <p className="text-slate-400 mt-2">Go to the Editor to launch your first bot.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {bots.map(bot => (
        <BotCard key={bot.id} bot={bot} {...props} />
      ))}
    </div>
  );
};