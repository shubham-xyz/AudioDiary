import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { format, isToday, isYesterday, isThisWeek } from 'date-fns';
import { Plus, Star } from 'lucide-react-native';
import { Calendar } from 'react-native-calendars';
import { getDiaryEntries, DiaryEntry, saveDiaryEntry } from '../utils/storage';
import { RootStackParamList, TabParamList } from '../types/navigation';
import { Header } from '../components/Header';
import { useTheme } from '../context/ThemeContext';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList & TabParamList>;

export const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const { theme } = useTheme();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [recentEntries, setRecentEntries] = useState<DiaryEntry[]>([]);
  const [importantEntries, setImportantEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [markedDates, setMarkedDates] = useState({});

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
      const today = new Date().toISOString().split('T')[0];
      
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
              color: theme.colors.muted.foreground,
            } : null,
          ].filter(Boolean),
        };
      });

      // Mark today's date
      markedDatesData[today] = {
        ...(markedDatesData[today] || {}),
        selected: true,
        selectedColor: theme.colors.primary.DEFAULT,
      };

      setMarkedDates(markedDatesData);
    } catch (error) {
      console.error('Error loading entries:', error);
    }
  }, [theme.colors]);

  useFocusEffect(
    useCallback(() => {
      loadEntries();
    }, [loadEntries])
  );

  const handleDayPress = (day: any) => {
    setSelectedDate(day.dateString);
    navigation.navigate('DiaryEntry', { date: day.dateString });
  };

  const navigateToNewEntry = () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    navigation.navigate('DiaryEntry', { date: today });
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
        style={[
          styles.entryCard,
          {
            backgroundColor: theme.colors.card,
            borderColor: theme.colors.border,
          }
        ]}
        onPress={() => navigateToEntry(item.date)}
      >
        <View style={styles.entryHeader}>
          <View style={styles.titleContainer}>
            <Text style={[styles.entryTitle, { color: theme.colors.foreground }]}>
              {item.title || `Entry ${dateLabel}`}
            </Text>
            <TouchableOpacity 
              onPress={() => toggleImportant(item)}
              style={[
                styles.iconButton,
                item.isImportant && styles.importantButton
              ]}
            >
              <Star 
                size={18} 
                color={item.isImportant ? theme.colors.primary.DEFAULT : theme.colors.muted.foreground}
                fill={item.isImportant ? theme.colors.primary.DEFAULT : 'none'}
                strokeWidth={item.isImportant ? 2.5 : 2}
              />
            </TouchableOpacity>
          </View>
          <Text style={[styles.entryDate, { color: theme.colors.muted.foreground }]}>
            {dateLabel}
          </Text>
        </View>
        {item.text && (
          <Text style={[styles.entryPreview, { color: theme.colors.foreground }]} numberOfLines={2}>
            {item.text}
          </Text>
        )}
      </TouchableOpacity>
    );
  }, [theme.colors, navigateToEntry, toggleImportant]);

  return (
    <SafeAreaView 
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <View style={[
        styles.container,
        { backgroundColor: theme.colors.background }
      ]}>
        <Header title="VoiceVault" largeTitleMode />
        <ScrollView 
          style={[styles.scrollView, { backgroundColor: theme.colors.background }]}
          contentContainerStyle={[
            styles.scrollViewContent,
            { paddingTop: 8 }
          ]}
        >
          <View style={styles.calendarContainer}>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: theme.colors.primary.DEFAULT }]} />
                <Text style={[styles.legendText, { color: theme.colors.foreground }]}>Text</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: theme.colors.secondary.DEFAULT }]} />
                <Text style={[styles.legendText, { color: theme.colors.foreground }]}>Audio</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.dot, { backgroundColor: theme.colors.muted.foreground }]} />
                <Text style={[styles.legendText, { color: theme.colors.foreground }]}>Important</Text>
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
              style={[styles.calendar, { borderColor: theme.colors.border }]}
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
                dotColor: theme.colors.primary.DEFAULT,
                selectedDotColor: theme.colors.primary.foreground,
              }}
            />
          </View>

          {importantEntries.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Important Entries</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Entries')}>
                  <Text style={[styles.seeAllText, { color: theme.colors.primary.DEFAULT }]}>See all</Text>
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
              <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Recent Entries</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Entries')}>
                <Text style={[styles.seeAllText, { color: theme.colors.primary.DEFAULT }]}>See all</Text>
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
              <View style={[styles.emptyState, { backgroundColor: theme.colors.muted.DEFAULT }]}>
                <Text style={[styles.emptyStateText, { color: theme.colors.foreground }]}>No recent entries</Text>
                <Text style={[styles.emptyStateSubText, { color: theme.colors.muted.foreground }]}>
                  Start by creating your first diary entry
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
        
        <TouchableOpacity
          style={[styles.newEntryButton, { backgroundColor: theme.colors.primary.DEFAULT }]}
          onPress={navigateToNewEntry}
        >
          <Plus size={24} color={theme.colors.primary.foreground} />
          <Text style={[styles.newEntryButtonText, { color: theme.colors.primary.foreground }]}>New Entry</Text>
        </TouchableOpacity>
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
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 150,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
  entriesListContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  entryCard: {
    width: 250,
    marginRight: 12,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
  },
  entryHeader: {
    marginBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    justifyContent: 'space-between',
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  iconButton: {
    padding: 4,
    borderRadius: 9999,
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  importantButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  entryDate: {
    fontSize: 14,
  },
  entryPreview: {
    fontSize: 14,
    lineHeight: 20,
  },
  emptyState: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  emptyStateSubText: {
    fontSize: 14,
    textAlign: 'center',
  },
  newEntryButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 16,
    marginBottom: 24,
    flexDirection: 'row',
    gap: 8,
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
    fontSize: 16,
    fontWeight: '600',
  },
  calendarContainer: {
    marginBottom: 24,
    padding: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendText: {
    fontSize: 14,
    marginLeft: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  calendar: {
    borderRadius: 12,
    borderWidth: 1,
  },
}); 