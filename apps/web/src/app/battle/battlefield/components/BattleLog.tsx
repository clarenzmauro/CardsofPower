import React, { useEffect, useRef } from 'react';

interface BattleLogEntry {
  id: string;
  message: string;
  timestamp: number;
  type: 'effect' | 'action' | 'system';
}

interface BattleLogProps {
  logs: BattleLogEntry[];
  className?: string;
}

export const BattleLog: React.FC<BattleLogProps> = ({ logs, className = '' }) => {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new logs are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className={`bg-stone-900/80 backdrop-blur-sm border border-stone-600/50 rounded-lg ${className}`}>
      <div className="p-3 border-b border-stone-600/50">
        <h3 className="text-stone-200 text-sm font-semibold" style={{ fontFamily: 'var(--font-pirata-one)' }}>
          Battle Log
        </h3>
      </div>
      <div 
        ref={logContainerRef}
        className="h-32 overflow-y-auto p-3 space-y-1"
      >
        {logs.length === 0 ? (
          <div className="text-stone-400 text-xs italic">
            Battle logs will appear here...
          </div>
        ) : (
          logs.map((log) => (
            <div 
              key={log.id} 
              className={`text-xs p-2 rounded ${
                log.type === 'effect' 
                  ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30' 
                  : log.type === 'action'
                  ? 'bg-blue-500/20 text-blue-200 border border-blue-500/30'
                  : 'bg-stone-500/20 text-stone-300 border border-stone-500/30'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="flex-1">{log.message}</span>
                <span className="text-xs opacity-60 ml-2">
                  {new Date(log.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
