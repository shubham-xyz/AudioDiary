import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';

type HeaderProps = {
  title: string;
  showBack?: boolean;
  largeTitleMode?: boolean;
};

export const Header = ({ title, showBack = false, largeTitleMode = false }: HeaderProps) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isMainTitle = title === 'VoiceVault';

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View style={[
      styles.header,
      { 
        backgroundColor: theme.colors.background,
        borderBottomColor: theme.colors.border,
        borderBottomWidth: isMainTitle ? 0 : 1,
        paddingTop: insets.top,
      }
    ]}>
      <View style={styles.headerContent}>
        {showBack && (
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <ChevronLeft size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
        )}
        
        {largeTitleMode ? (
          <Animated.Text 
            style={[
              styles.title,
              isMainTitle && styles.mainTitle,
              { 
                color: theme.colors.foreground,
                opacity: titleOpacity,
                transform: [{
                  scale: scrollY.interpolate({
                    inputRange: [0, 100],
                    outputRange: [1, 0.8],
                    extrapolate: 'clamp',
                  })
                }]
              }
            ]}
          >
            {title}
          </Animated.Text>
        ) : (
          <Text 
            style={[
              styles.title,
              isMainTitle && styles.mainTitle,
              { color: theme.colors.foreground }
            ]}
          >
            {title}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: Platform.OS === 'ios' ? 88 : 96, // Includes safe area space
    width: '100%',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 44,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    padding: 8,
    marginLeft: -8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: Platform.OS === 'ios' ? '800' : '700',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif-medium',
    letterSpacing: -1,
  },
}); 