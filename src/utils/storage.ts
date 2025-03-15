import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DiaryEntry {
  id: string;
  date: string;
  text: string;
  audioPath: string;
  createdAt: string;
  title: string;
  isImportant: boolean;
  uniqueKey?: string;
}

const DIARY_ENTRIES_KEY = 'diary_entries';

export const saveDiaryEntry = async (entry: DiaryEntry): Promise<void> => {
  try {
    const existingEntriesJson = await AsyncStorage.getItem(DIARY_ENTRIES_KEY);
    const existingEntries: DiaryEntry[] = existingEntriesJson ? JSON.parse(existingEntriesJson) : [];
    
    // Find the index of the existing entry with the same id
    const existingIndex = existingEntries.findIndex(e => e.id === entry.id);
    
    let entries;
    if (existingIndex >= 0) {
      // Update existing entry
      entries = existingEntries.map((e, index) => 
        index === existingIndex ? entry : e
      );
    } else {
      // Add new entry
      entries = [...existingEntries, entry];
    }
    
    await AsyncStorage.setItem(DIARY_ENTRIES_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error('Error saving diary entry:', error);
    throw error;
  }
};

export const getDiaryEntries = async (): Promise<DiaryEntry[]> => {
  try {
    const entriesJson = await AsyncStorage.getItem(DIARY_ENTRIES_KEY);
    return entriesJson ? JSON.parse(entriesJson) : [];
  } catch (error) {
    console.error('Error getting diary entries:', error);
    throw error;
  }
};

export const getDiaryEntryByDate = async (date: string): Promise<DiaryEntry | null> => {
  try {
    const entries = await getDiaryEntries();
    return entries.find(entry => entry.date === date) || null;
  } catch (error) {
    console.error('Error getting diary entry:', error);
    throw error;
  }
};

export const getMarkedDates = async (): Promise<Record<string, { marked: boolean }>> => {
  try {
    const entries = await getDiaryEntries();
    return entries.reduce((acc, entry) => ({
      ...acc,
      [entry.date]: { marked: true }
    }), {});
  } catch (error) {
    console.error('Error getting marked dates:', error);
    throw error;
  }
};

export const deleteDiaryEntry = async (entryId: string): Promise<void> => {
  try {
    const entriesJson = await AsyncStorage.getItem(DIARY_ENTRIES_KEY);
    const entries: DiaryEntry[] = entriesJson ? JSON.parse(entriesJson) : [];
    
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    await AsyncStorage.setItem(DIARY_ENTRIES_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    console.error('Error deleting diary entry:', error);
    throw error;
  }
}; 