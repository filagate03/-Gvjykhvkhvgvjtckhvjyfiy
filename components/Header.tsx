
import React from 'react';
import { View } from '../types';
import { CodeIcon, DashboardIcon } from './icons';

interface HeaderProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

export const Header: React.FC<HeaderProps> = ({ activeView, setActiveView }) => {
  const getButtonClass = (view: View) => {
    return `flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
      activeView === view
        ? 'bg-sky-500 text-white'
        : 'text-slate-300 hover:bg-slate-700 hover:text-white'
    }`;
  };

  return (
    <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 sticky top-0 z-10">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-4">
            <svg
              className="w-8 h-8 text-sky-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m3 11 18-5v12L3 13V11Z" />
              <path d="M11.6 16.8a3 3 0 0 0-5.2-1.6" />
            </svg>
            <h1 className="text-xl font-bold text-white">TeleBot Deployer</h1>
          </div>
          <nav className="flex items-center gap-2 p-1 bg-slate-900 rounded-lg">
            <button onClick={() => setActiveView(View.EDITOR)} className={getButtonClass(View.EDITOR)}>
              <CodeIcon className="w-5 h-5" />
              Editor
            </button>
            <button onClick={() => setActiveView(View.DASHBOARD)} className={getButtonClass(View.DASHBOARD)}>
              <DashboardIcon className="w-5 h-5" />
              Dashboard
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
