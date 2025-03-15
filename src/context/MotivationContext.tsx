import React, { createContext, useContext, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MotivationEntry, getMotivationLabel } from '../types/motivation';

interface MotivationContextType {
  addMotivationEntry: (level: number) => Promise<void>;
  getMotivationHistory: () => Promise<MotivationEntry[]>;
  clearMotivationHistory: () => Promise<void>;
}

const MotivationContext = createContext<MotivationContextType | undefined>(undefined);

const MOTIVATION_STORAGE_KEY = '@audio_diary_motivation';

export const MotivationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const addMotivationEntry = useCallback(async (level: number) => {
    try {
      if (level < 1 || level > 5) {
        throw new Error('Invalid motivation level');
      }

      const existingData = await AsyncStorage.getItem(MOTIVATION_STORAGE_KEY);
      let entries: MotivationEntry[] = [];
      
      if (existingData) {
        try {
          entries = JSON.parse(existingData);
          if (!Array.isArray(entries)) {
            entries = [];
          }
        } catch (e) {
          console.error('Error parsing motivation data:', e);
          entries = [];
        }
      }
      
      const newEntry: MotivationEntry = {
        date: new Date().toISOString(),
        level,
        label: getMotivationLabel(level),
      };
      
      entries.push(newEntry);
      await AsyncStorage.setItem(MOTIVATION_STORAGE_KEY, JSON.stringify(entries));
    } catch (error) {
      console.error('Error adding motivation entry:', error);
      throw error;
    }
  }, []);

  const getMotivationHistory = useCallback(async () => {
    try {
      const data = await AsyncStorage.getItem(MOTIVATION_STORAGE_KEY);
      if (!data) return [];

      try {
        const entries = JSON.parse(data);
        if (!Array.isArray(entries)) {
          return [];
        }
        return entries;
      } catch (e) {
        console.error('Error parsing motivation history:', e);
        return [];
      }
    } catch (error) {
      console.error('Error getting motivation history:', error);
      return [];
    }
  }, []);

  const clearMotivationHistory = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(MOTIVATION_STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing motivation history:', error);
      throw error;
    }
  }, []);

  return (
    <MotivationContext.Provider
      value={{
        addMotivationEntry,
        getMotivationHistory,
        clearMotivationHistory,
      }}
    >
      {children}
    </MotivationContext.Provider>
  );
};

export const useMotivation = () => {
  const context = useContext(MotivationContext);
  if (context === undefined) {
    throw new Error('useMotivation must be used within a MotivationProvider');
  }
  return context;
}; 