import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Platform,
  SafeAreaView,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Plus, Star } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { getDiaryEntries, DiaryEntry, saveDiaryEntry } from '../utils/storage';
import { Calendar } from 'react-native-calendars';
import { RootStackParamList, TabParamList } from '../types/navigation';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList & TabParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [favoriteEntries, setFavoriteEntries] = useState<DiaryEntry[]>([]);
  const [recentEntries, setRecentEntries] = useState<DiaryEntry[]>([]);
  const [importantEntries, setImportantEntries] = useState<DiaryEntry[]>([]);
  const [markedDates, setMarkedDates] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  const loadEntries = useCallback(async () => {
    try {
      const diaryEntries = await getDiaryEntries();
      
      // Sort entries by date (newest first)
      const sortedEntries = diaryEntries.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      setEntries(sortedEntries);
      
      // Get recent entries (last 7 days)
      const recent = sortedEntries.filter(entry => {
        const entryDate = new Date(entry.date);
        return isToday(entryDate) || isYesterday(entryDate) || isThisWeek(entryDate);
      }).slice(0, 5);
      
      setRecentEntries(recent);
      
      // Get important entries
      const important = sortedEntries.filter(entry => entry.isImportant)
        .slice(0, 5);
      
      setImportantEntries(important);

      // Set up marked dates for calendar
      const markedDatesData = {};
      
      diaryEntries.forEach((entry: DiaryEntry) => {
        markedDatesData[entry.date] = {
          dots: [
            entry.text ? {
              key: 'text',
              color: theme.colors.primary.DEFAULT,
            } : null,
            entry.audioPath ? {
              key: 'audio',
              color: theme.colors.secondary.DEFAULT,
            } : null,
            entry.isImportant ? {
              key: 'important',
              color: '#f59e0b',
            } : null,
          ].filter(Boolean),
        };
      });

      setMarkedDates(markedDatesData);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const navigateToNewEntry = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    navigation.navigate('DiaryEntry', { date: today });
  };

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    navigation.navigate('DiaryEntry', { date: day.dateString });
  };

  const navigateToEntry = (date: string) => {
    navigation.navigate('DiaryEntry', { date });
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

  const renderEntryItem = useCallback(({ item }: { item: DiaryEntry }) => {
    const entryDate = new Date(item.date);
    let dateLabel;

    if (isToday(entryDate)) {
      dateLabel = 'Today';
    } else if (isYesterday(entryDate)) {
      dateLabel = 'Yesterday';
    } else {
      dateLabel = format(entryDate, 'MMM d, yyyy');
    }

    return (
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => navigateToEntry(item.date)}
      >
        <View style={styles.entryHeader}>
          <View style={styles.titleContainer}>
            <Text style={styles.entryTitle}>{item.title || `Entry ${dateLabel}`}</Text>
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
  }, [navigateToEntry]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Audio Diary</Text>
        </View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
        >
          <View style={styles.calendarContainer}>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: theme.colors.primary.DEFAULT }]} />
                <Text style={styles.legendText}>Text</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: theme.colors.secondary.DEFAULT }]} />
                <Text style={styles.legendText}>Audio</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.legendText}>Important</Text>
              </View>
            </View>

            <Calendar
              onDayPress={handleDayPress}
              markedDates={{
                ...markedDates,
                [selectedDate]: {
                  ...(markedDates[selectedDate] || {}),
                  selected: true,
                },
              }}
              markingType="multi-dot"
              style={styles.calendar}
              current={selectedDate}
              enableSwipeMonths={true}
              theme={{
                backgroundColor: theme.colors.background,
                calendarBackground: theme.colors.background,
                textSectionTitleColor: theme.colors.foreground,
                selectedDayBackgroundColor: theme.colors.primary.DEFAULT,
                selectedDayTextColor: theme.colors.primary.foreground,
                todayTextColor: theme.colors.primary.DEFAULT,
                dayTextColor: theme.colors.foreground,
                textDisabledColor: theme.colors.muted.foreground,
                monthTextColor: theme.colors.foreground,
                textMonthFontWeight: 'bold',
                textDayFontSize: 16,
                textMonthFontSize: 18,
              }}
            />
          </View>

          {importantEntries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Important Entries</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Entries')}>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={importantEntries}
                renderItem={renderEntryItem}
                keyExtractor={item => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.entriesListContent}
              />
            </View>
          )}

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Entries</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Entries')}>
                <Text style={styles.seeAllText}>See all</Text>
              </TouchableOpacity>
            </View>
            {recentEntries.length > 0 ? (
              <FlatList
                data={recentEntries}
                renderItem={renderEntryItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.entriesListContent}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No recent entries</Text>
                <Text style={styles.emptyStateSubText}>
                  Start by creating your first diary entry
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        <TouchableOpacity
          style={styles.newEntryButton}
          onPress={navigateToNewEntry}
        >
          <Plus size={24} color={theme.colors.primary.foreground} />
          <Text style={styles.newEntryButtonText}>New Entry</Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 100,
  },
  section: {
    marginBottom: theme.spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing[4],
    marginBottom: theme.spacing[3],
  },
  sectionTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  seeAllText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.primary.DEFAULT,
    fontWeight: '500',
  },
  entriesListContent: {
    paddingHorizontal: theme.spacing[4],
    gap: theme.spacing[3],
  },
  entryCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: 250,
    marginRight: theme.spacing[3],
  },
  entryHeader: {
    marginBottom: theme.spacing[2],
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing[1],
    justifyContent: 'space-between',
  },
  entryTitle: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
    flex: 1,
  },
  iconButton: {
    padding: theme.spacing[1],
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'transparent',
    marginLeft: theme.spacing[2],
  },
  importantButton: {
    backgroundColor: 'rgba(254, 243, 199, 0.2)',
  },
  entryDate: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.muted.foreground,
  },
  entryPreview: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.foreground,
    lineHeight: 20,
  },
  emptyState: {
    padding: theme.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.muted.DEFAULT,
    borderRadius: theme.borderRadius.lg,
    marginHorizontal: theme.spacing[4],
  },
  emptyStateText: {
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
    color: theme.colors.foreground,
    marginBottom: theme.spacing[2],
  },
  emptyStateSubText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.muted.foreground,
    textAlign: 'center',
  },
  newEntryButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing[4],
    alignItems: 'center',
    justifyContent: 'center',
    margin: theme.spacing[4],
    marginBottom: theme.spacing[6],
    flexDirection: 'row',
    gap: theme.spacing[2],
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  newEntryButtonText: {
    color: theme.colors.primary.foreground,
    fontSize: theme.typography.fontSize.base,
    fontWeight: '600',
  },
  calendarContainer: {
    marginBottom: theme.spacing[6],
    padding: theme.spacing[4],
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[3],
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.foreground,
    marginLeft: theme.spacing[2],
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calendar: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
}); 