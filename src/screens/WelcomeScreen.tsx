import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { theme } from '../theme/theme';
import { RootStackParamList } from '../types/navigation';
import { WelcomingIllustration } from '../components/WelcomingIllustration';
import { quotes } from '../data/quotes';
import { useMotivation } from '../context/MotivationContext';
import { useTheme } from '../context/ThemeContext';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Quote {
  content: string;
  author: string;
}

const MOTIVATION_EMOJIS = [
  { emoji: '😴', value: 1, label: 'Very Low' },
  { emoji: '😕', value: 2, label: 'Low' },
  { emoji: '😊', value: 3, label: 'Moderate' },
  { emoji: '😃', value: 4, label: 'High' },
  { emoji: '🔥', value: 5, label: 'Very High' },
];

export const WelcomeScreen = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { width } = useWindowDimensions();
  const { addMotivationEntry } = useMotivation();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingMotivation, setSavingMotivation] = useState(false);
  const { theme } = useTheme();

  const getRandomQuote = () => {
    setLoading(true);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * quotes.length);
      setQuote(quotes[randomIndex]);
      setLoading(false);
    }, 500);
  };

  useEffect(() => {
    getRandomQuote();
  }, []);

  const handleNewQuote = () => {
    getRandomQuote();
  };

  const handleMotivationSelect = async (level: number) => {
    if (savingMotivation) return;

    try {
      setSavingMotivation(true);
      await addMotivationEntry(level);
      navigation.replace('MainTabs');
    } catch (error) {
      console.error('Error saving motivation:', error);
      setSavingMotivation(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Audio Diary</Text>
        
        <View style={styles.illustrationContainer}>
          <WelcomingIllustration 
            width={width * 0.6} 
            height={width * 0.6}
            color={theme.colors.primary.DEFAULT}
          />
        </View>

        <View style={styles.quoteContainer}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={theme.colors.primary.DEFAULT} />
              <Text style={styles.loadingText}>Loading quote...</Text>
            </View>
          ) : quote ? (
            <>
              <Text style={[styles.quoteText, { color: theme.colors.foreground }]}>"{quote.content}"</Text>
              <Text style={[styles.authorText, { color: theme.colors.primary.DEFAULT }]}>— {quote.author}</Text>
              <TouchableOpacity style={[styles.newQuoteButton, { backgroundColor: theme.colors.muted.DEFAULT }]} onPress={handleNewQuote}>
                <Text style={[styles.newQuoteButtonText, { color: theme.colors.foreground }]}>New Quote</Text>
              </TouchableOpacity>
            </>
          ) : null}
        </View>

        <View style={styles.motivationContainer}>
          <View style={[styles.motivationTitleContainer, { borderColor: '#ffffff', backgroundColor: '#000000' }]}>
            <Text style={[styles.motivationTitle, { color: '#ffffff', fontWeight: '700' }]}>How motivated are you now?</Text>
          </View>
          <View style={styles.emojiContainer}>
            {MOTIVATION_EMOJIS.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.emojiButton,
                  savingMotivation && styles.emojiButtonDisabled,
                  { backgroundColor: theme.colors.card }
                ]}
                onPress={() => handleMotivationSelect(item.value)}
                disabled={savingMotivation}
              >
                {savingMotivation ? (
                  <ActivityIndicator size="small" color={theme.colors.primary.DEFAULT} />
                ) : (
                  <>
                    <Text style={[styles.emojiText, { color: theme.colors.foreground }]}>{item.emoji}</Text>
                    <Text style={[styles.emojiLabel, { color: theme.colors.foreground }]}>{item.label}</Text>
                  </>
                )}
              </TouchableOpacity>
            ))}
          </View>
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
    paddingTop: Platform.OS === 'android' ? theme.spacing[6] : 0,
    padding: theme.spacing[4],
    justifyContent: 'space-between',
  },
  title: {
    fontSize: theme.typography.fontSize['4xl'],
    fontWeight: '700',
    textAlign: 'center',
    marginTop: theme.spacing[8],
  },
  illustrationContainer: {
    alignItems: 'center',
    marginVertical: theme.spacing[6],
  },
  quoteContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing[6],
  },
  quoteText: {
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: theme.spacing[4],
    fontStyle: 'italic',
  },
  authorText: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
  },
  errorText: {
    fontSize: theme.typography.fontSize.base,
    textAlign: 'center',
    marginBottom: theme.spacing[4],
  },
  retryButton: {
    backgroundColor: theme.colors.muted.DEFAULT,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
  },
  retryButtonText: {
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  loadingContainer: {
    alignItems: 'center',
  },
  loadingText: {
    marginTop: theme.spacing[4],
    fontSize: theme.typography.fontSize.base,
    color: theme.colors.foreground,
  },
  newQuoteButton: {
    backgroundColor: theme.colors.muted.DEFAULT,
    paddingHorizontal: theme.spacing[4],
    paddingVertical: theme.spacing[2],
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing[4],
  },
  newQuoteButtonText: {
    color: theme.colors.foreground,
    fontSize: theme.typography.fontSize.sm,
    fontWeight: '500',
  },
  motivationContainer: {
    marginTop: theme.spacing[6],
    marginBottom: theme.spacing[4],
  },
  motivationTitleContainer: {
    backgroundColor: theme.colors.card,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing[4],
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  motivationTitle: {
    fontSize: theme.typography.fontSize.xl,
    textAlign: 'center',
    fontWeight: '600',
  },
  emojiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing[2],
    marginTop: theme.spacing[2],
  },
  emojiButton: {
    alignItems: 'center',
    padding: theme.spacing[3],
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 70,
  },
  selectedEmojiButton: {
    borderColor: theme.colors.primary.DEFAULT,
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  emojiText: {
    fontSize: 28,
    marginBottom: theme.spacing[2],
  },
  emojiLabel: {
    fontSize: theme.typography.fontSize.xs,
    textAlign: 'center',
  },
  motivationError: {
    color: theme.colors.destructive.DEFAULT,
    fontSize: theme.typography.fontSize.sm,
    textAlign: 'center',
    marginTop: theme.spacing[2],
  },
  continueButtonDisabled: {
    opacity: 0.5,
  },
  continueButton: {
    backgroundColor: theme.colors.primary.DEFAULT,
    padding: theme.spacing[4],
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    marginTop: theme.spacing[6],
  },
  continueButtonText: {
    color: theme.colors.primary.foreground,
    fontSize: theme.typography.fontSize.lg,
    fontWeight: '600',
  },
  emojiButtonDisabled: {
    opacity: 0.5,
  },
}); 