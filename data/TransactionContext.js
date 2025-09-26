import React, { createContext, useContext, useState, useEffect } from 'react';
import { dummyTransactions } from './dummyData';

const TransactionContext = createContext();

export const useTransactions = () => {
  const context = useContext(TransactionContext);
  if (!context) {
    throw new Error('useTransactions must be used within TransactionProvider');
  }
  return context;
};

export const TransactionProvider = ({ children }) => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dataSource, setDataSource] = useState('dummy'); // 'dummy' or 'sms'
  
  // Load transactions based on data source
  const loadTransactions = async () => {
    setLoading(true);
    try {
      if (dataSource === 'dummy') {
        // Use existing dummy data
        setTransactions(dummyTransactions);
      } else if (dataSource === 'sms') {
        // TODO: Later we'll add SMS parsing here
        console.log('SMS parsing not implemented yet, using dummy data');
        setTransactions(dummyTransactions);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Fallback to dummy data
      setTransactions(dummyTransactions);
    } finally {
      setLoading(false);
    }
  };

  // Switch between data sources
  const switchDataSource = async (newSource) => {
    setDataSource(newSource);
    await loadTransactions();
  };

  // Refresh transactions
  const refreshTransactions = async () => {
    await loadTransactions();
  };

  useEffect(() => {
    loadTransactions();
  }, [dataSource]);

  const value = {
    transactions,
    loading,
    dataSource,
    switchDataSource,
    refreshTransactions,
  };

  return (
    <TransactionContext.Provider value={value}>
      {children}
    </TransactionContext.Provider>
  );
};
