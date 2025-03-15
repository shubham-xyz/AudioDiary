import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { format } from 'date-fns';
import { BookText, Mic, Star } from 'lucide-react-native';
import { getDiaryEntries, DiaryEntry } from '../utils/storage';
import { Header } from '../components/Header';
import { useTheme } from '../context/ThemeContext';

export const StatsScreen = () => {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [diaryStats, setDiaryStats] = useState({
    totalEntries: 0,
    textEntries: 0,
    audioEntries: 0,
    importantEntries: 0,
    averageTextLength: 0,
    longestEntry: { title: '', length: 0 },
    lastEntry: { title: '', date: '' },
    streakDays: 0,
  });
  const navigation = useNavigation();

  const loadData = async () => {
    try {
      setLoading(true);
      const entries = await getDiaryEntries();
      calculateDiaryStats(entries);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDiaryStats = (entries: DiaryEntry[]) => {
    if (entries.length === 0) return;

    const textEntries = entries.filter(entry => entry.text.trim().length > 0);
    const audioEntries = entries.filter(entry => entry.audioPath);
    const importantEntries = entries.filter(entry => entry.isImportant);
    
    const totalTextLength = textEntries.reduce((acc, entry) => acc + entry.text.length, 0);
    const averageTextLength = Math.round(totalTextLength / (textEntries.length || 1));
    
    const longestEntry = textEntries.reduce((longest, current) => {
      return current.text.length > longest.length 
        ? { title: current.title || format(new Date(current.date), 'MMM d, yyyy'), length: current.text.length }
        : longest;
    }, { title: '', length: 0 });

    // Find the last entry
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const lastEntry = sortedEntries[0] || { title: '', date: '' };

    setDiaryStats({
      totalEntries: entries.length,
      textEntries: textEntries.length,
      audioEntries: audioEntries.length,
      importantEntries: importantEntries.length,
      averageTextLength,
      longestEntry,
      lastEntry: {
        title: lastEntry.title || format(new Date(lastEntry.date), 'MMM d, yyyy'),
        date: lastEntry.date,
      },
      streakDays: calculateStreak(entries),
    });
  };

  const calculateStreak = (entries: DiaryEntry[]) => {
    if (entries.length === 0) return 0;
    
    const sortedDates = [...new Set(entries.map(entry => entry.date))]
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
    
    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < sortedDates.length; i++) {
      const currentDate = new Date(sortedDates[i]);
      currentDate.setHours(0, 0, 0, 0);
      
      if (i === 0) {
        const timeDiff = Math.floor((today.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
        if (timeDiff > 1) break;
        streak++;
        continue;
      }
      
      const prevDate = new Date(sortedDates[i - 1]);
      prevDate.setHours(0, 0, 0, 0);
      
      const dayDiff = Math.floor((prevDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24));
      if (dayDiff === 1) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
        <Header title="Your Stats" />
        <View style={[styles.loadingContainer, { marginTop: Platform.OS === 'android' ? 80 : 110 }]}>
          <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
          <Text style={[styles.loadingText, { color: theme.colors.foreground }]}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Header title="Your Stats" />
        <ScrollView 
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Overview Stats */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Overview</Text>
            <View style={styles.statsGrid}>
              <View style={[styles.statsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <BookText size={24} color={theme.colors.primary.DEFAULT} />
                <Text style={[styles.statsValue, { color: theme.colors.foreground }]}>{diaryStats.textEntries}</Text>
                <Text style={[styles.statsLabel, { color: theme.colors.muted.foreground }]}>Text Entries</Text>
              </View>
              <View style={[styles.statsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Mic size={24} color={theme.colors.secondary.DEFAULT} />
                <Text style={[styles.statsValue, { color: theme.colors.foreground }]}>{diaryStats.audioEntries}</Text>
                <Text style={[styles.statsLabel, { color: theme.colors.muted.foreground }]}>Audio Notes</Text>
              </View>
              <View style={[styles.statsCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
                <Star size={24} color={theme.colors.primary.DEFAULT} />
                <Text style={[styles.statsValue, { color: theme.colors.foreground }]}>{diaryStats.importantEntries}</Text>
                <Text style={[styles.statsLabel, { color: theme.colors.muted.foreground }]}>Important</Text>
              </View>
            </View>
          </View>

          {/* Writing Stats */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Writing Stats</Text>
            <View style={[styles.detailCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.muted.foreground }]}>Total Entries:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.foreground }]}>{diaryStats.totalEntries}</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.muted.foreground }]}>Current Streak:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.foreground }]}>{diaryStats.streakDays} days</Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: theme.colors.muted.foreground }]}>Average Length:</Text>
                <Text style={[styles.detailValue, { color: theme.colors.foreground }]}>{diaryStats.averageTextLength} characters</Text>
              </View>
              {diaryStats.longestEntry.title && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.muted.foreground }]}>Longest Entry:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.foreground }]}>
                    {diaryStats.longestEntry.title} ({diaryStats.longestEntry.length} chars)
                  </Text>
                </View>
              )}
              {diaryStats.lastEntry.title && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: theme.colors.muted.foreground }]}>Last Entry:</Text>
                  <Text style={[styles.detailValue, { color: theme.colors.foreground }]}>
                    {diaryStats.lastEntry.title}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </ScrollView>
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
  scrollViewContent: {
    paddingTop: 36,
    paddingBottom: 150,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginHorizontal: 16,
    marginBottom: 16,
    letterSpacing: -0.5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
  },
  statsCard: {
    padding: 16,
    borderRadius: 12,
    width: '30%',
    alignItems: 'center',
    borderWidth: 1,
  },
  statsLabel: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  statsValue: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 8,
    letterSpacing: -0.5,
  },
  detailCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
}); 