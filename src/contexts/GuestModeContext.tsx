import React, { createContext, useContext, useState, useEffect } from 'react';

interface GuestModeContextType {
  isGuestMode: boolean;
  guestApiKey: string | null;
  setGuestApiKey: (key: string | null) => void;
  enableGuestMode: () => void;
  disableGuestMode: () => void;
}

const GuestModeContext = createContext<GuestModeContextType | undefined>(undefined);

export const useGuestMode = () => {
  const context = useContext(GuestModeContext);
  if (context === undefined) {
    throw new Error('useGuestMode must be used within a GuestModeProvider');
  }
  return context;
};

interface GuestModeProviderProps {
  children: React.ReactNode;
}

export const GuestModeProvider: React.FC<GuestModeProviderProps> = ({ children }) => {
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [guestApiKey, setGuestApiKey] = useState<string | null>(null);

  // Load guest mode state from localStorage on mount
  useEffect(() => {
    const savedGuestMode = localStorage.getItem('guestMode');
    const savedApiKey = localStorage.getItem('guestApiKey');
    
    if (savedGuestMode === 'true') {
      setIsGuestMode(true);
    }
    
    if (savedApiKey) {
      setGuestApiKey(savedApiKey);
    }
  }, []);

  // Save guest mode state to localStorage
  useEffect(() => {
    localStorage.setItem('guestMode', isGuestMode.toString());
  }, [isGuestMode]);

  // Save API key to localStorage
  useEffect(() => {
    if (guestApiKey) {
      localStorage.setItem('guestApiKey', guestApiKey);
    } else {
      localStorage.removeItem('guestApiKey');
    }
  }, [guestApiKey]);

  const enableGuestMode = () => {
    setIsGuestMode(true);
  };

  const disableGuestMode = () => {
    setIsGuestMode(false);
    setGuestApiKey(null);
  };

  const value: GuestModeContextType = {
    isGuestMode,
    guestApiKey,
    setGuestApiKey,
    enableGuestMode,
    disableGuestMode,
  };

  return (
    <GuestModeContext.Provider value={value}>
      {children}
    </GuestModeContext.Provider>
  );
};
