import React, { createContext, useContext, useState, useEffect } from 'react';

const SettingsContext = createContext();

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};

export const SettingsProvider = ({ children }) => {
  // ✅ ENHANCED DEFAULT SETTINGS
  const [settings, setSettings] = useState({
    // Personal Information
    firstName: 'User',
    lastName: '',
    age: '',
    city: '',
    country: '',
    
    // Professional Information
    occupation: '',
    monthlyIncome: '',
    
    // Financial Settings
    currency: 'INR',
    financialGoal: '',
    budgetLimit: '',
    
    // App Preferences
    theme: 'dark',
    
    // App Configuration
    lastUpdate: null,
    onboardingCompleted: false,
  });

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  // ✅ ENHANCED LOAD SETTINGS WITH ERROR HANDLING
  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // Get all setting keys
      const settingKeys = [
        'firstName', 'lastName', 'age', 'city', 'country',
        'occupation', 'monthlyIncome', 'currency', 'financialGoal', 
        'budgetLimit', 'theme', 'lastUpdate', 'onboardingCompleted'
      ];

      // Use localStorage for web compatibility
      const savedSettings = localStorage.getItem('user_settings');
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        
        // ✅ VALIDATE AND MERGE SETTINGS
        const validatedSettings = {};
        settingKeys.forEach(key => {
          if (parsedSettings[key] !== undefined && parsedSettings[key] !== null) {
            validatedSettings[key] = parsedSettings[key];
          }
        });

        setSettings(prevSettings => ({
          ...prevSettings,
          ...validatedSettings
        }));

        console.log('✅ Settings loaded successfully:', Object.keys(validatedSettings).length, 'keys');
      } else {
        console.log('⚠️ No saved settings found, using defaults');
      }
    } catch (error) {
      console.error('❌ Error loading settings:', error);
      // Keep default settings if loading fails
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ ENHANCED UPDATE SETTING WITH VALIDATION
  const updateSetting = async (key, value) => {
    try {
      // ✅ VALIDATE INPUT
      if (key === undefined || key === null) {
        throw new Error('Setting key cannot be null or undefined');
      }

      // ✅ SANITIZE VALUE
      let sanitizedValue = value;
      if (typeof value === 'string') {
        sanitizedValue = value.trim();
      }

      // ✅ UPDATE SETTINGS STATE
      const updatedSettings = {
        ...settings,
        [key]: sanitizedValue,
        lastUpdate: new Date().toISOString()
      };
      
      setSettings(updatedSettings);
      
      // ✅ PERSIST TO STORAGE
      localStorage.setItem('user_settings', JSON.stringify(updatedSettings));
      
      console.log(`✅ Setting updated: ${key} = ${sanitizedValue}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating setting:', error);
      return false;
    }
  };

  // ✅ BATCH UPDATE MULTIPLE SETTINGS
  const updateMultipleSettings = async (settingsObject) => {
    try {
      const updatedSettings = {
        ...settings,
        ...settingsObject,
        lastUpdate: new Date().toISOString()
      };
      
      setSettings(updatedSettings);
      localStorage.setItem('user_settings', JSON.stringify(updatedSettings));
      
      console.log(`✅ Multiple settings updated:`, Object.keys(settingsObject));
      return true;
    } catch (error) {
      console.error('❌ Error updating multiple settings:', error);
      return false;
    }
  };

  // ✅ REFRESH SETTINGS FROM STORAGE
  const refreshSettings = async () => {
    try {
      console.log('🔄 Refreshing settings from storage...');
      const savedSettings = localStorage.getItem('user_settings');
      
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(prevSettings => ({
          ...prevSettings,
          ...parsedSettings
        }));
        console.log('✅ Settings refreshed successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error refreshing settings:', error);
      return false;
    }
  };

  // ✅ RESET SETTINGS TO DEFAULTS
  const resetSettings = async () => {
    try {
      const defaultSettings = {
        firstName: 'User',
        lastName: '',
        age: '',
        city: '',
        country: '',
        occupation: '',
        monthlyIncome: '',
        currency: 'INR',
        financialGoal: '',
        budgetLimit: '',
        theme: 'dark',
        lastUpdate: new Date().toISOString(),
        onboardingCompleted: false,
      };
      
      setSettings(defaultSettings);
      localStorage.setItem('user_settings', JSON.stringify(defaultSettings));
      
      console.log('🔄 Settings reset to defaults');
      return true;
    } catch (error) {
      console.error('❌ Error resetting settings:', error);
      return false;
    }
  };

  // ✅ GET SPECIFIC SETTING
  const getSetting = (key, defaultValue = null) => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  // ✅ CHECK IF SETTING EXISTS
  const hasSetting = (key) => {
    return settings[key] !== undefined && settings[key] !== null && settings[key] !== '';
  };

  // ✅ GET USER PROFILE COMPLETENESS
  const getProfileCompleteness = () => {
    const requiredFields = ['firstName', 'currency'];
    const optionalFields = ['lastName', 'age', 'city', 'country', 'occupation', 'monthlyIncome', 'financialGoal', 'budgetLimit'];
    
    const completedRequired = requiredFields.filter(field => hasSetting(field)).length;
    const completedOptional = optionalFields.filter(field => hasSetting(field)).length;
    
    const totalRequired = requiredFields.length;
    const totalOptional = optionalFields.length;
    
    const requiredPercentage = (completedRequired / totalRequired) * 100;
    const overallPercentage = ((completedRequired + completedOptional) / (totalRequired + totalOptional)) * 100;
    
    return {
      requiredComplete: completedRequired === totalRequired,
      requiredPercentage: Math.round(requiredPercentage),
      overallPercentage: Math.round(overallPercentage),
      completedFields: completedRequired + completedOptional,
      totalFields: totalRequired + totalOptional,
      missingRequired: requiredFields.filter(field => !hasSetting(field)),
      missingOptional: optionalFields.filter(field => !hasSetting(field))
    };
  };

  // ✅ EXPORT DATA FOR BACKUP
  const exportSettings = () => {
    try {
      const exportData = {
        ...settings,
        exportedAt: new Date().toISOString(),
        version: '1.0'
      };
      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('❌ Error exporting settings:', error);
      return null;
    }
  };

  // ✅ IMPORT DATA FROM BACKUP
  const importSettings = async (importData) => {
    try {
      const parsedData = typeof importData === 'string' ? JSON.parse(importData) : importData;
      
      // Remove metadata
      const { exportedAt, version, ...settingsData } = parsedData;
      
      const success = await updateMultipleSettings(settingsData);
      if (success) {
        console.log('✅ Settings imported successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Error importing settings:', error);
      return false;
    }
  };

  // ✅ CLEAR ALL DATA
  const clearAllData = async () => {
    try {
      localStorage.removeItem('user_settings');
      await resetSettings();
      console.log('🗑️ All data cleared');
      return true;
    } catch (error) {
      console.error('❌ Error clearing data:', error);
      return false;
    }
  };

  // ✅ CONTEXT VALUE WITH ALL METHODS
  const contextValue = {
    // State
    settings,
    isLoading,
    
    // Basic Methods
    updateSetting,
    refreshSettings,
    
    // Advanced Methods
    updateMultipleSettings,
    resetSettings,
    getSetting,
    hasSetting,
    
    // Utility Methods
    getProfileCompleteness,
    exportSettings,
    importSettings,
    clearAllData,
    
    // Computed Properties
    isProfileComplete: getProfileCompleteness().requiredComplete,
    profileCompleteness: getProfileCompleteness().overallPercentage,
  };

  return (
    <SettingsContext.Provider value={contextValue}>
      {children}
    </SettingsContext.Provider>
  );
};
