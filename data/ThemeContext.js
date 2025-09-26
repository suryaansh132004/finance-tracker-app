import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Define color themes
const lightTheme = {
  background: '#FFFFFF',           // Main background (was #0A0A0A)
  cardBackground: '#F2F2F7',       // Card background (was #1C1C1E)
  text: '#000000',                 // Primary text (was #FFFFFF)
  secondaryText: '#3A3A3C',        // Secondary text (was #8E8E93)
  tertiaryText: '#48484A',         // Tertiary text (was #6B7280)
  border: '#E5E5EA',               // Borders and dividers
  success: '#10B981',              // Keep green the same
  error: '#EF4444',                // Keep red the same
  activeButton: '#000000',         // Active filter button (was #FFFFFF)
  activeButtonText: '#FFFFFF',     // Active filter text (was #000000)
};

const darkTheme = {
  background: '#0A0A0A',           // Main background
  cardBackground: '#1C1C1E',       // Card background
  text: '#FFFFFF',                 // Primary text
  secondaryText: '#8E8E93',        // Secondary text
  tertiaryText: '#6B7280',         // Tertiary text
  border: '#1C1C1E',               // Borders and dividers
  success: '#10B981',              // Green
  error: '#EF4444',                // Red
  activeButton: '#FFFFFF',         // Active filter button
  activeButtonText: '#000000',     // Active filter text
};

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true); // Default to dark mode
  const [isLoading, setIsLoading] = useState(true);

  // Load theme preference from storage
  useEffect(() => {
    loadThemePreference();
  }, []);

  const loadThemePreference = () => {
    try {
      // Use localStorage for web compatibility
      const savedTheme = localStorage.getItem('theme_preference');
      if (savedTheme !== null) {
        setIsDarkMode(savedTheme === 'dark');
      }
    } catch (error) {
      console.error('Error loading theme preference:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveThemePreference = (isDark) => {
    try {
      // Use localStorage for web compatibility
      localStorage.setItem('theme_preference', isDark ? 'dark' : 'light');
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    saveThemePreference(newTheme);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      isDarkMode, 
      toggleTheme, 
      isLoading 
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
