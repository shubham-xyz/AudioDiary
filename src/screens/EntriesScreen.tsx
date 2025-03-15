import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { theme } from '../theme/theme';
import { getDiaryEntries, deleteDiaryEntry, DiaryEntry, saveDiaryEntry } from '../utils/storage';
import { Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { RootStackParamList, TabParamList } from '../types/navigation';

type EntriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList & TabParamList>;

export const EntriesScreen = () => {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const navigation = useNavigation<EntriesScreenNavigationProp>();

  const loadEntries = useCallback(async () => {
    try {
      const diaryEntries = await getDiaryEntries();
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);
      
      // Filter entries for current month and sort by date
      const monthEntries = diaryEntries
        .filter(entry => {
          const entryDate = parseISO(entry.date);
          return entryDate >= start && entryDate <= end;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setEntries(monthEntries);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }, [currentMonth]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleDeleteEntry = async (id: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDiaryEntry(id);
              loadEntries();
            } catch (error) {
              console.error('Error deleting entry:', error);
            }
          },
        },
      ]
    );
  };

  const toggleImportant = async (entry: DiaryEntry) => {
    try {
      const updatedEntry = {
        ...entry,
        isImportant: !entry.isImportant
      };
      await saveDiaryEntry(updatedEntry);
      loadEntries();
    } catch (error) {
      console.error('Error updating important status:', error);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prevMonth => {
      const newMonth = new Date(prevMonth);
      if (direction === 'prev') {
        newMonth.setMonth(newMonth.getMonth() - 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() + 1);
      }
      return newMonth;
    });
  };

  const renderEntryItem = useCallback(({ item }: { item: DiaryEntry }) => {
    const entryDate = new Date(item.date);
    let dateLabel;

    if (format(entryDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
      dateLabel = 'Today';
    } else if (format(entryDate, 'yyyy-MM-dd') === format(new Date(Date.now() - 86400000), 'yyyy-MM-dd')) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = format(entryDate, 'MMM d, yyyy');
    }

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => navigation.navigate('DiaryEntry', { date: item.date })}
      >
        <View style={styles.entryHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.entryTitle}>{item.title || `Entry ${dateLabel}`}</Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                onPress={() => toggleImportant(item)}
                style={[
                  styles.iconButton,
                  item.isImportant && styles.importantButton
                ]}
              >
                <Star 
                  size={18} 
                  color={item.isImportant ? '#f59e0b' : theme.colors.muted.foreground}
                  fill={item.isImportant ? '#f59e0b' : 'none'}
                  strokeWidth={item.isImportant ? 2.5 : 2}
                />
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={() => handleDeleteEntry(item.id)}
                style={styles.iconButton}
              >
                <Trash2 size={18} color={theme.colors.destructive.DEFAULT} />
              </TouchableOpacity>
            </View>
          </View>
          <Text style={styles.entryDate}>{dateLabel}</Text>
        </View>
        {item.text && (
          <Text style={styles.entryPreview} numberOfLines={2}>
            {item.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Entries</Text>
        </View>

        <View style={styles.monthSelector}>
          <TouchableOpacity 
            onPress={() => navigateMonth('prev')}
            style={styles.monthButton}
          >
            <ChevronLeft size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <Text style={styles.monthText}>
            {format(currentMonth, 'MMMM yyyy')}
          </Text>
          <TouchableOpacity 
            onPress={() => navigateMonth('next')}
            style={styles.monthButton}
          >
            <ChevronRight size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
        </View>
        
        {entries.length > 0 ? (
          <FlatList
            data={entries}
            renderItem={renderEntryItem}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.entriesList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No entries this month</Text>
            <Text style={styles.emptyStateSubText}>
              Create a new entry or swipe to view another month
            </Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: Platform.OS === 'android' ? theme.spacing[6] : 0,
  },
  header: {
    padding: theme.spacing[4],
    paddingTop: theme.spacing[6],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '700',
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  entriesList: {
    padding: theme.spacing[4],
  },
  entryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    marginBottom: theme.spacing[3],
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  entryHeader: {
    marginBottom: theme.spacing[2],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing[1],
  },
  entryTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  iconButton: {
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
  },
  importantButton: {
    backgroundColor: theme.colors.muted.DEFAULT + '20',
  },
  entryDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.muted.foreground,
  },
  entryPreview: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.muted.foreground,
    marginTop: theme.spacing[2],
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[4],
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing[2],
  },
  emptyStateSubText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.muted.foreground,
    textAlign: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  monthButton: {
    padding: theme.spacing[2],
    borderRadius: theme.borderRadius.full,
  },
  monthText: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
}); 