
import React, { useEffect, useRef } from 'react';

interface LogViewerProps {
  logs: string[];
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div
      ref={scrollRef}
      className="h-64 bg-black/50 p-4 font-mono text-xs text-slate-300 overflow-y-auto"
    >
      {logs.map((log, index) => {
        let textColor = 'text-slate-300';
        if (log.toLowerCase().includes('error')) {
          textColor = 'text-red-400';
        } else if (log.toLowerCase().includes('success') || log.toLowerCase().includes('running')) {
          textColor = 'text-green-400';
        }
        return <p key={index} className={textColor}>{log}</p>;
      })}
    </div>
  );
};
