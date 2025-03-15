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
  GestureResponderEvent,
  PanResponder,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';
import { getDiaryEntries, deleteDiaryEntry, DiaryEntry, saveDiaryEntry } from '../utils/storage';
import { Trash2, Star, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { RootStackParamList, TabParamList } from '../types/navigation';
import { Header } from '../components/Header';
import { useTheme } from '../context/ThemeContext';

type EntriesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList & TabParamList>;

interface DotMarking {
  key: string;
  color: string;
}

interface MarkedDate {
  dots?: DotMarking[];
  marked?: boolean;
  selected?: boolean;
  selectedColor?: string;
}

export const EntriesScreen = () => {
  const { theme } = useTheme();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [touchStartX, setTouchStartX] = useState(0);
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

      // Set up marked dates for calendar
      const markedDatesData: MarkedDates = {};
      const today = format(new Date(), 'yyyy-MM-dd');
      
      diaryEntries.forEach((entry: DiaryEntry) => {
        const dots: DotMarking[] = [];
        
        if (entry.text) {
          dots.push({
            key: 'text',
            color: theme.colors.primary.DEFAULT,
          });
        }
        
        if (entry.audioPath) {
          dots.push({
            key: 'audio',
            color: theme.colors.secondary.DEFAULT,
          });
        }
        
        if (entry.isImportant) {
          dots.push({
            key: 'important',
            color: theme.colors.primary.DEFAULT,
          });
        }

        if (dots.length > 0) {
          markedDatesData[entry.date] = {
            dots,
            marked: true,
          };
        }
      });

      // Add today's date marking
      markedDatesData[today] = {
        ...markedDatesData[today],
        selected: true,
        selectedColor: theme.colors.primary.DEFAULT,
      };

      setMarkedDates(markedDatesData);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }, [currentMonth, theme.colors]);

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

  const handleTouchStart = (event: GestureResponderEvent) => {
    setTouchStartX(event.nativeEvent.pageX);
  };

  const handleTouchEnd = (event: GestureResponderEvent) => {
    const touchEndX = event.nativeEvent.pageX;
    const swipeDistance = touchEndX - touchStartX;
    
    // Minimum distance to trigger swipe
    if (Math.abs(swipeDistance) > 50) {
      if (swipeDistance > 0) {
        // Swipe right - go to previous month
        navigateMonth('prev');
      } else {
        // Swipe left - go to next month
        navigateMonth('next');
      }
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

  const handleMonthChange = (date: DateData) => {
    setCurrentMonth(new Date(date.timestamp));
  };

  const handleNavigate = (screen: string) => {
    navigation.navigate(screen as never);
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
        style={[
          styles.entryCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          }
        ]}
        onPress={() => navigation.navigate('DiaryEntry', { date: item.date })}
      >
        <View style={styles.entryHeader}>
          <View style={styles.titleContainer}>
            <Text style={[styles.entryTitle, { color: theme.colors.foreground }]}>
              {item.title || `Entry ${dateLabel}`}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                onPress={() => toggleImportant(item)}
                style={[
                  styles.iconButton,
                  item.isImportant && [styles.importantButton, { backgroundColor: `${theme.colors.muted.DEFAULT}20` }]
                ]}
              >
                <Star 
                  size={18} 
                  color={item.isImportant ? theme.colors.primary.DEFAULT : theme.colors.muted.foreground}
                  fill={item.isImportant ? theme.colors.primary.DEFAULT : 'none'}
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
          <Text style={[styles.entryDate, { color: theme.colors.muted.foreground }]}>
            {dateLabel}
          </Text>
        </View>
        {item.text && (
          <Text 
            style={[styles.entryPreview, { color: theme.colors.muted.foreground }]} 
            numberOfLines={2}
          >
            {item.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  }, [navigation, theme.colors, toggleImportant]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Your Entries" />
        <View style={styles.content}>
          <View style={[styles.monthSelector, { 
            backgroundColor: theme.colors.card,
            borderBottomColor: theme.colors.border,
          }]}>
            <TouchableOpacity 
              onPress={() => navigateMonth('prev')}
              style={[styles.monthButton, { backgroundColor: `${theme.colors.muted.DEFAULT}20` }]}
            >
              <ChevronLeft size={24} color={theme.colors.foreground} />
            </TouchableOpacity>
            <View style={styles.monthInfo}>
              <Text style={[styles.monthText, { color: theme.colors.foreground }]}>
                {format(currentMonth, 'MMMM yyyy')}
              </Text>
              <Text style={[styles.entriesCount, { color: theme.colors.muted.foreground }]}>
                {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => navigateMonth('next')}
              style={[styles.monthButton, { backgroundColor: `${theme.colors.muted.DEFAULT}20` }]}
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
              <Text style={[styles.emptyStateText, { color: theme.colors.foreground }]}>
                No entries this month
              </Text>
              <Text style={[styles.emptyStateSubText, { color: theme.colors.muted.foreground }]}>
                Create a new entry or navigate to another month
              </Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  entriesList: {
    padding: 16,
    paddingBottom: 150,
  },
  entryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  entryHeader: {
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  entryTitle: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
    borderRadius: 8,
  },
  importantButton: {
    borderRadius: 8,
  },
  entryDate: {
    fontSize: 14,
  },
  entryPreview: {
    fontSize: 16,
    marginTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyStateText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 16,
    textAlign: 'center',
  },
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    marginBottom: 12,
  },
  monthButton: {
    padding: 8,
    borderRadius: 20,
  },
  monthInfo: {
    alignItems: 'center',
  },
  monthText: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  entriesCount: {
    fontSize: 14,
  },
}); 