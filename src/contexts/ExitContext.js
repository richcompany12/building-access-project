import React, { createContext, useState, useContext, useCallback } from 'react';

const ExitContext = createContext();

export const useExit = () => useContext(ExitContext);

export const ExitProvider = ({ children }) => {
  const [exitAttempt, setExitAttempt] = useState(false);

  const attemptExit = useCallback(() => {
    if (exitAttempt) {
      window.close();
    } else {
      setExitAttempt(true);
      setTimeout(() => setExitAttempt(false), 3000); // 3초 후 리셋
    }
  }, [exitAttempt]);

  return (
    <ExitContext.Provider value={{ exitAttempt, attemptExit }}>
      {children}
    </ExitContext.Provider>
  );
};