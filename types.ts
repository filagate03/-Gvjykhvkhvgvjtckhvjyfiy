export enum BotStatus {
  RUNNING = 'running',
  STOPPED = 'stopped',
  ERROR = 'error',
}

export interface KeyboardButton {
  text: string;
}
export interface InlineKeyboardButton {
  text: string;
  callback_data: string;
}


export interface Message {
  text: string;
  sender: 'user' | 'bot';
  buttons?: (KeyboardButton[] | InlineKeyboardButton[])[];
}

export interface Bot {
  id: number;
  name:string;
  status: BotStatus;
  code: string;
  token: string;
  language: 'python' | 'javascript';
  logs: string[];
  messages: Message[];
  cpuUsage: number;
  ramUsage: number;
}

export enum View {
  EDITOR = 'editor',
  DASHBOARD = 'dashboard',
}
