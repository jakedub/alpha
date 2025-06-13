import React, { useState, useEffect } from 'react';
import styles from '../Shared.module.css'; // <-- fix the import path

const ConsoleLogOverlay = () => {
  const [logs, setLogs] = useState<any[][]>([]);

  useEffect(() => {
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      setLogs((prevLogs) => [...prevLogs, args]);
      originalConsoleLog(...args);
    };

    return () => {
      console.log = originalConsoleLog;
    };
  }, []);

  return (
    <div className={styles.consoleLogOverlay}>
      {logs.map((log, index) => (
        <div key={index}>
          {log.map((item, itemIndex) => (
            <span key={itemIndex}>
              {typeof item === 'object' ? JSON.stringify(item) : String(item)}
              {' '}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
};

export default ConsoleLogOverlay;