import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  ActivityIndicator,
  SafeAreaView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useMotivation } from '../context/MotivationContext';
import { MotivationEntry } from '../types/motivation';
import { theme } from '../theme/theme';
import { useFocusEffect } from '@react-navigation/native';
import { format, startOfMonth, endOfMonth, subMonths, startOfWeek, endOfWeek } from 'date-fns';

const MOTIVATION_EMOJIS = [
  { emoji: '😴', value: 1, label: 'Very Low' },
  { emoji: '😕', value: 2, label: 'Low' },
  { emoji: '😊', value: 3, label: 'Moderate' },
  { emoji: '😃', value: 4, label: 'High' },
  { emoji: '🔥', value: 5, label: 'Very High' },
];

type TimeRange = 'month' | 'week';

export const StatsScreen = () => {
  const { getMotivationHistory } = useMotivation();
  const [motivationData, setMotivationData] = useState<MotivationEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<TimeRange>('month');
  const [stats, setStats] = useState({
    average: 0,
    highest: 0,
    lowest: 5,
    mostFrequent: { level: 0, emoji: '' },
    totalEntries: 0,
  });

  const loadMotivationData = async () => {
    try {
      setLoading(true);
      const data = await getMotivationHistory();
      setMotivationData(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error loading motivation data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: MotivationEntry[]) => {
    if (data.length === 0) return;

    const levels = data.map(entry => entry.level);
    const sum = levels.reduce((acc, curr) => acc + curr, 0);
    const average = sum / levels.length;
    const highest = Math.max(...levels);
    const lowest = Math.min(...levels);

    // Calculate most frequent level
    const frequency: { [key: number]: number } = {};
    levels.forEach(level => {
      frequency[level] = (frequency[level] || 0) + 1;
    });
    const mostFrequentLevel = Object.entries(frequency)
      .reduce((a, b) => (b[1] > a[1] ? b : a))[0];

    const mostFrequentEmoji = MOTIVATION_EMOJIS.find(
      item => item.value === Number(mostFrequentLevel)
    );

    setStats({
      average: Number(average.toFixed(1)),
      highest,
      lowest,
      mostFrequent: {
        level: Number(mostFrequentLevel),
        emoji: mostFrequentEmoji?.emoji || '',
      },
      totalEntries: data.length,
    });
  };

  useFocusEffect(
    React.useCallback(() => {
      loadMotivationData();
    }, [])
  );

  const prepareChartData = () => {
    if (motivationData.length === 0) {
      return {
        labels: [],
        datasets: [{ data: [] }],
      };
    }

    const now = new Date();
    let startDate, endDate;

    if (timeRange === 'month') {
      startDate = startOfMonth(subMonths(now, 1));
      endDate = endOfMonth(now);
    } else {
      startDate = startOfWeek(now);
      endDate = endOfWeek(now);
    }

    const filteredData = motivationData
      .filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate >= startDate && entryDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    return {
      labels: filteredData.map(entry => 
        format(new Date(entry.date), timeRange === 'month' ? 'MMM d' : 'EEE')
      ),
      datasets: [{
        data: filteredData.map(entry => entry.level),
      }],
    };
  };

  const toggleTimeRange = () => {
    setTimeRange(prev => prev === 'month' ? 'week' : 'month');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
          <Text style={styles.loadingText}>Loading stats...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const chartData = prepareChartData();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Motivation Stats</Text>
          <Text style={styles.subtitle}>
            {timeRange === 'month' ? 'Last 30 Days' : 'This Week'}
          </Text>
        </View>

        {motivationData.length > 0 ? (
          <>
            <View style={styles.statsGrid}>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Average</Text>
                <Text style={styles.statsValue}>{stats.average}</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Highest</Text>
                <Text style={styles.statsValue}>{stats.highest}</Text>
              </View>
              <View style={styles.statsCard}>
                <Text style={styles.statsLabel}>Lowest</Text>
                <Text style={styles.statsValue}>{stats.lowest}</Text>
              </View>
            </View>

            <View style={styles.mostFrequentCard}>
              <Text style={styles.statsLabel}>Most Frequent Mood</Text>
              <View style={styles.mostFrequentContent}>
                <Text style={styles.mostFrequentEmoji}>{stats.mostFrequent.emoji}</Text>
                <Text style={styles.mostFrequentLevel}>
                  Level {stats.mostFrequent.level}
                </Text>
              </View>
            </View>

            <View style={styles.totalEntriesCard}>
              <Text style={styles.statsLabel}>Total Entries</Text>
              <Text style={styles.totalEntriesValue}>{stats.totalEntries}</Text>
            </View>

            <View style={styles.chartContainer}>
              <View style={styles.chartHeader}>
                <Text style={styles.chartTitle}>Motivation Timeline</Text>
                <TouchableOpacity 
                  style={styles.timeRangeToggle}
                  onPress={toggleTimeRange}
                >
                  <Text style={styles.timeRangeText}>
                    {timeRange === 'month' ? 'Switch to Week' : 'Switch to Month'}
                  </Text>
                </TouchableOpacity>
              </View>
              <LineChart
                data={chartData}
                width={Dimensions.get('window').width - theme.spacing[8]}
                height={220}
                chartConfig={{
                  backgroundColor: theme.colors.card,
                  backgroundGradientFrom: theme.colors.card,
                  backgroundGradientTo: theme.colors.card,
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(${theme.colors.primary.rgb}, ${opacity})`,
                  labelColor: () => theme.colors.foreground,
                  style: {
                    borderRadius: theme.borderRadius.lg,
                  },
                  propsForDots: {
                    r: '6',
                    strokeWidth: '2',
                    stroke: theme.colors.primary.DEFAULT,
                  },
                }}
                bezier
                style={{
                  marginVertical: theme.spacing[4],
                  borderRadius: theme.borderRadius.lg,
                }}
              />
              <View style={styles.legend}>
                <Text style={styles.legendText}>Motivation Levels:</Text>
                <View style={styles.legendItems}>
                  {MOTIVATION_EMOJIS.map((item) => (
                    <View key={item.value} style={styles.legendItem}>
                      <Text style={styles.legendEmoji}>{item.emoji}</Text>
                      <Text style={styles.legendLabel}>{item.label}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              No motivation data yet. Start by rating your motivation on the welcome screen!
            </Text>
          </View>
        )}
      </ScrollView>
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
    marginBottom: theme.spacing[2],
  },
  subtitle: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.muted.foreground,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: theme.spacing[4],
  },
  statsCard: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    width: '30%',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.foreground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  statsLabel: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.muted.foreground,
    marginBottom: theme.spacing[2],
    textAlign: 'center',
  },
  statsValue: {
    fontSize: theme.typography.fontSize.xl,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  mostFrequentCard: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing[4],
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.foreground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  mostFrequentContent: {
    alignItems: 'center',
  },
  mostFrequentEmoji: {
    fontSize: 40,
    marginVertical: theme.spacing[2],
  },
  mostFrequentLevel: {
    fontSize: theme.typography.fontSize.lg,
    color: theme.colors.foreground,
    fontWeight: '500',
  },
  totalEntriesCard: {
    backgroundColor: theme.colors.card,
    margin: theme.spacing[4],
    marginTop: 0,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.foreground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  totalEntriesValue: {
    fontSize: theme.typography.fontSize['2xl'],
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  chartContainer: {
    padding: theme.spacing[4],
    backgroundColor: theme.colors.card,
    margin: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: theme.colors.foreground,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing[4],
  },
  chartTitle: {
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
    color: theme.colors.foreground,
  },
  timeRangeToggle: {
    backgroundColor: theme.colors.muted.DEFAULT,
    paddingHorizontal: theme.spacing[3],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
  },
  timeRangeText: {
    fontSize: theme.typography.fontSize.sm,
    color: theme.colors.foreground,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.muted.foreground,
    textAlign: 'center',
  },
  legend: {
    marginTop: theme.spacing[4],
    padding: theme.spacing[4],
    backgroundColor: theme.colors.background,
    borderRadius: theme.borderRadius.md,
  },
  legendText: {
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
    marginBottom: theme.spacing[2],
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    alignItems: 'center',
    width: '18%',
    marginVertical: theme.spacing[1],
  },
  legendEmoji: {
    fontSize: 20,
    marginBottom: theme.spacing[1],
  },
  legendLabel: {
    fontSize: theme.typography.fontSize.xs,
    color: theme.colors.foreground,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
  },
}); 