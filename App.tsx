import React, { useState, useEffect, useCallback, useRef } from 'react';
import { EditorView } from './components/EditorView';
import { DashboardView } from './components/DashboardView';
import { Header } from './components/Header';
import { Bot, BotStatus, View, Message } from './types';

const App: React.FC = () => {
  const [bots, setBots] = useState<Bot[]>([]);
  const [activeView, setActiveView] = useState<View>(View.EDITOR);
  const [nextBotId, setNextBotId] = useState(1);
  const [editingBot, setEditingBot] = useState<Bot | null>(null);

  const simulationIntervals = useRef<Record<number, number>>({});

  const addLog = useCallback((id: number, log: string) => {
    setBots(prevBots =>
      prevBots.map(bot =>
        bot.id === id ? { ...bot, logs: [...bot.logs.slice(-99), `[${new Date().toISOString()}] ${log}`] } : bot
      )
    );
  }, []);

  const updateBotWithLog = useCallback((id: number, updates: Partial<Bot>, logMessage: string) => {
    setBots(prevBots =>
      prevBots.map(bot =>
        bot.id === id ? { ...bot, ...updates, logs: [...bot.logs.slice(-99), `[${new Date().toISOString()}] ${logMessage}`] } : bot
      )
    );
  }, []);
  
  useEffect(() => {
    const realisticLogs = [
      "Polling for updates...",
      "API call to telegram successful. No new messages.",
      "Processing update queue... empty.",
      "Memory usage stable.",
      "CPU load nominal.",
      "Healthcheck passed.",
      "Connection to Telegram API is healthy.",
      "Checking for pending tasks...",
    ];

    const runningBotIds = new Set(bots.filter(b => b.status === BotStatus.RUNNING).map(b => b.id));

    bots.forEach(bot => {
      if (runningBotIds.has(bot.id) && !simulationIntervals.current[bot.id]) {
        const intervalId = window.setInterval(() => {
          if (Math.random() < 0.02) { 
            updateBotWithLog(bot.id, { status: BotStatus.ERROR }, 'Error: Unhandled exception. Bot halted.');
            return;
          }

          const randomLog = realisticLogs[Math.floor(Math.random() * realisticLogs.length)];
          setBots(prevBots =>
            prevBots.map(b =>
              b.id === bot.id
                ? {
                    ...b,
                    cpuUsage: parseFloat((Math.random() * 8 + 2).toFixed(2)), // 2-10%
                    ramUsage: parseFloat((Math.random() * 25 + 25).toFixed(2)), // 25-50MB
                    logs: [...b.logs.slice(-99), `[${new Date().toISOString()}] ${randomLog}`],
                  }
                : b
            )
          );
        }, 5000 + Math.random() * 2000);
        simulationIntervals.current[bot.id] = intervalId;
      }
    });

    Object.keys(simulationIntervals.current).forEach(botIdStr => {
      const botId = parseInt(botIdStr, 10);
      if (!runningBotIds.has(botId)) {
        clearInterval(simulationIntervals.current[botId]);
        delete simulationIntervals.current[botId];
      }
    });

    return () => {
      Object.values(simulationIntervals.current).forEach(clearInterval);
    };
  }, [bots, updateBotWithLog]);

  const simulateBotConnection = useCallback((bot: Bot) => {
    addLog(bot.id, 'Attempting to connect to Telegram API...');
    setTimeout(() => {
      addLog(bot.id, 'Validating Telegram token...');
      setTimeout(() => {
        const isTokenValid = bot.token && bot.token.includes(':') && bot.token.split(':')[0].length > 5;
        
        if (isTokenValid) {
          addLog(bot.id, 'Token validation successful.');
          setTimeout(() => {
            addLog(bot.id, 'Establishing connection to api.telegram.org...');
            setTimeout(() => {
              updateBotWithLog(bot.id, { status: BotStatus.RUNNING }, 'Successfully connected. Bot is now running and polling for updates.');
            }, 1200);
          }, 800);
        } else {
          updateBotWithLog(bot.id, { status: BotStatus.ERROR }, 'Error: Invalid Telegram token format. Please check your token.');
        }
      }, 1000);
    }, 500);
  }, [addLog, updateBotWithLog]);

  const handleLaunch = (code: string, token: string, language: 'python' | 'javascript') => {
    const newBot: Bot = {
      id: nextBotId,
      name: `Bot #${nextBotId}`,
      status: BotStatus.STOPPED,
      code,
      token,
      language,
      logs: [`[${new Date().toISOString()}] Bot created.`],
      messages: [],
      cpuUsage: 0,
      ramUsage: 0,
    };
    setBots(prev => [...prev, newBot]);
    setNextBotId(prev => prev + 1);
    
    setTimeout(() => {
      addLog(newBot.id, 'Deployment initiated...');
      simulateBotConnection(newBot);
    }, 0);

    setActiveView(View.DASHBOARD);
    setEditingBot(null);
  };

  const handleUpdate = (id: number, code: string, token: string, language: 'python' | 'javascript') => {
    const botToUpdate = bots.find(b => b.id === id);
    if (!botToUpdate) return;

    updateBotWithLog(id, { code, token, language, status: BotStatus.STOPPED, cpuUsage: 0, ramUsage: 0, messages: [] }, 'Bot update initiated...');
    
    setTimeout(() => {
      const updatedBotForSimulation = { ...botToUpdate, code, token, language };
      addLog(id, 'Redeploying with new configuration...');
      simulateBotConnection(updatedBotForSimulation);
    }, 1000);

    setEditingBot(null);
    setActiveView(View.DASHBOARD);
  };

  const handleUpdateStatus = (id: number, status: BotStatus) => {
    if (status === BotStatus.STOPPED) {
      updateBotWithLog(id, { status: BotStatus.STOPPED, cpuUsage: 0, ramUsage: 0 }, 'Bot stopped by user.');
    }
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Are you sure you want to delete this bot? This action cannot be undone.')) {
      setBots(prevBots => prevBots.filter(bot => bot.id !== id));
      if (editingBot?.id === id) {
        setEditingBot(null);
      }
    }
  };

  const handleRestart = (id: number) => {
    const bot = bots.find(b => b.id === id);
    if (bot) {
      updateBotWithLog(id, { status: BotStatus.STOPPED, cpuUsage: 0, ramUsage: 0, messages: [] }, 'Restarting bot...');
      setTimeout(() => simulateBotConnection(bot), 1000);
    }
  };

  const handleSendMessage = async (botId: number, text: string) => {
      const bot = bots.find(b => b.id === botId);
      if (!bot || bot.status !== BotStatus.RUNNING) return;
  
      const userMessage: Message = { sender: 'user', text };
      
      setBots(prevBots =>
        prevBots.map(b =>
          b.id === botId ? { ...b, messages: [...b.messages, userMessage] } : b
        )
      );
      addLog(botId, `User message received: "${text}"`);
      addLog(botId, `Simulating bot response via code execution...`);
  
      let botReply: Message | null = null;
  
      try {
        if (bot.language === 'javascript') {
          botReply = simulateJavaScriptBot(bot.code, bot.token, text);
        } else {
          addLog(botId, `Python simulation is regex-based and may not cover all edge cases.`);
          botReply = simulatePythonBot(bot.code, text);
        }
  
        if (botReply) {
          setBots(prevBots =>
            prevBots.map(b =>
              b.id === botId ? { ...b, messages: [...b.messages, botReply!] } : b
            )
          );
          addLog(botId, `Simulation sent reply: "${botReply.text}"`);
        } else {
            addLog(botId, `Code did not produce a reply for this message.`);
        }
      } catch (e: any) {
        console.error("Simulation Error:", e);
        const errorMessage = e.message || "An unknown error occurred during code execution.";
        addLog(botId, `Error: ${errorMessage}`);
        const errorReply: Message = { sender: 'bot', text: `Sorry, an error occurred in the simulation: ${errorMessage}` };
        setBots(prevBots =>
          prevBots.map(b =>
            b.id === botId ? { ...b, messages: [...b.messages, errorReply] } : b
          )
        );
      }
  };

  const simulateJavaScriptBot = (code: string, token: string, messageText: string): Message | null => {
    let botReply: Message | null = null;
    let botInstance: any = null;

    // --- Mocks & Sandbox Environment ---
    const TelegrafMock = class {
        handlers: Map<string, Function> = new Map();
        constructor(t: string) {
            if (t !== token) {
              // Commenting out for now as process.env.TOKEN may not match exactly if user changes it
              // throw new Error("Bot initialized with incorrect token.");
            }
            botInstance = this; // Capture the instance
        }
        start(fn: Function) { this.handlers.set('/start', fn); }
        command(cmd: string | string[], fn: Function) {
            const commands = Array.isArray(cmd) ? cmd : [cmd];
            commands.forEach(c => this.handlers.set(`/${c}`, fn));
        }
        on(updateType: string, fn: Function) {
            this.handlers.set(`on_${updateType}`, fn);
        }
        launch() { /* No-op in simulation */ }
        stop() { /* No-op in simulation */ }
    };
    
    const Markup = {
        keyboard: (buttons: any[]) => ({ keyboard: buttons, resize_keyboard: true }),
        inlineKeyboard: (buttons: any[]) => ({ inline_keyboard: buttons }),
        button: {
          callback: (text: string, data: string) => ({ text, callback_data: data }),
          text: (text: string) => ({ text }),
        }
    };

    const process = { env: { TELEGRAM_TOKEN: token }, once: () => {} };
    const require = (name: string) => {
        if (name === 'telegraf') return { Telegraf: TelegrafMock, Markup };
        throw new Error(`Module '${name}' is not available in this sandbox.`);
    };

    // --- Execution ---
    try {
        // Use Function constructor for a slightly safer execution scope than eval
        const sandboxedCode = new Function('require', 'process', code);
        sandboxedCode(require, process);
    } catch (e: any) {
        throw new Error(`Code execution failed: ${e.message}`);
    }

    if (!botInstance) {
        throw new Error("Could not find a 'new Telegraf()' instance in your code.");
    }

    const command = messageText.startsWith('/') ? messageText.split(' ')[0] : null;
    const handler = command ? botInstance.handlers.get(command) : botInstance.handlers.get('on_message') || botInstance.handlers.get('on_text');

    if (handler) {
        const mockCtx = {
            message: { text: messageText },
            reply: (text: string, extra: any) => {
                const buttons = extra?.reply_markup?.inline_keyboard || extra?.reply_markup?.keyboard || [];
                botReply = { sender: 'bot', text, buttons };
            },
        };
        handler(mockCtx);
    }
    
    return botReply;
  };

  const simulatePythonBot = (code: string, messageText: string): Message | null => {
      if (!messageText.startsWith('/')) return null;
      const command = messageText.substring(1).split(' ')[0];

      // Find the command handler registration, e.g., CommandHandler("start", start)
      const handlerRegex = new RegExp(`CommandHandler\\(\\s*["']${command}["']\\s*,\\s*(\\w+)\\s*\\)`);
      const handlerMatch = code.match(handlerRegex);
      if (!handlerMatch) return null;

      const functionName = handlerMatch[1];
      
      // Find the function definition, e.g., def start(update, context):
      const functionRegex = new RegExp(`def\\s+${functionName}\\s*\\(.*?\\):\\s*([\\s\\S]*?)(?:\\ndef\\s|$)`);
      const functionMatch = code.match(functionRegex);
      if (!functionMatch) return null;

      const functionBody = functionMatch[1];

      // Find the reply_text call inside the function
      const replyRegex = /reply_text\s*\(\s*["'](.*?)["']/;
      const replyMatch = functionBody.match(replyRegex);
      if (!replyMatch) return null;
      
      const replyText = replyMatch[1];

      // Basic button parsing (very simplified)
      const buttons = [];
      const keyboardRegex = /KeyboardButton\(\s*["'](.*?)["']\s*\)/g;
      let buttonMatch;
      while ((buttonMatch = keyboardRegex.exec(functionBody)) !== null) {
          buttons.push({ text: buttonMatch[1] });
      }

      return {
          sender: 'bot',
          text: replyText,
          buttons: buttons.length > 0 ? [buttons] : undefined,
      };
  };
  
  const handleEdit = (id: number) => {
    const botToEdit = bots.find(b => b.id === id);
    if (botToEdit) {
      setEditingBot(botToEdit);
      setActiveView(View.EDITOR);
    }
  };
  
  const handleCancelEdit = () => {
    setEditingBot(null);
  };

  return (
    <>
      <Header activeView={activeView} setActiveView={setActiveView} />
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeView === View.EDITOR ? (
          <EditorView
            onLaunch={handleLaunch}
            onUpdate={handleUpdate}
            botToEdit={editingBot}
            onCancelEdit={handleCancelEdit}
          />
        ) : (
          <DashboardView
            bots={bots}
            onUpdateStatus={handleUpdateStatus}
            onDelete={handleDelete}
            onRestart={handleRestart}
            onEdit={handleEdit}
            onSendMessage={handleSendMessage}
          />
        )}
      </main>
    </>
  );
};

export default App;
