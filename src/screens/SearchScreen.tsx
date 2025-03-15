import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TextInput,
  FlatList,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import { Header } from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { Search as SearchIcon, Calendar, Clock } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

type SearchResult = {
  id: string;
  title: string;
  date: string;
  duration: string;
};

export const SearchScreen = () => {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // TODO: Replace with actual search logic
    const dummyResults: SearchResult[] = query ? [
      { id: '1', title: 'Morning Reflection', date: '2024-03-20', duration: '2:30' },
      { id: '2', title: 'Evening Thoughts', date: '2024-03-19', duration: '1:45' },
      { id: '3', title: 'Weekly Goals', date: '2024-03-18', duration: '3:15' },
    ] : [];
    setSearchResults(dummyResults);
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => (
    <TouchableOpacity
      style={[styles.resultItem, { backgroundColor: theme.colors.card }]}
      onPress={() => {
        // TODO: Navigate to entry details
        console.log('Navigate to entry:', item.id);
      }}
    >
      <View style={styles.resultContent}>
        <Text style={[styles.resultTitle, { color: theme.colors.foreground }]}>
          {item.title}
        </Text>
        <View style={styles.resultMetadata}>
          <View style={styles.metadataItem}>
            <Calendar size={14} color={theme.colors.muted.foreground} />
            <Text style={[styles.metadataText, { color: theme.colors.muted.foreground }]}>
              {item.date}
            </Text>
          </View>
          <View style={styles.metadataItem}>
            <Clock size={14} color={theme.colors.muted.foreground} />
            <Text style={[styles.metadataText, { color: theme.colors.muted.foreground }]}>
              {item.duration}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[
      styles.safeArea,
      { backgroundColor: theme.colors.background }
    ]}>
      <View style={[
        styles.container,
        { backgroundColor: theme.colors.background }
      ]}>
        <Header title="Search" />
        <View style={styles.searchContainer}>
          <View style={[
            styles.searchInputContainer,
            { 
              backgroundColor: theme.colors.card,
              borderColor: theme.colors.border,
            }
          ]}>
            <SearchIcon size={20} color={theme.colors.muted.foreground} />
            <TextInput
              style={[
                styles.searchInput,
                { color: theme.colors.foreground }
              ]}
              placeholder="Search your voice entries..."
              placeholderTextColor={theme.colors.muted.foreground}
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
              onSubmitEditing={Keyboard.dismiss}
              autoFocus
            />
          </View>
        </View>

        <FlatList
          data={searchResults}
          renderItem={renderSearchResult}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.resultsList}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: theme.colors.muted.foreground }]}>
                {searchQuery ? 'No results found' : 'Start typing to search your entries'}
              </Text>
            </View>
          }
        />
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
  searchContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    height: 24,
  },
  resultsList: {
    padding: 16,
  },
  resultItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultContent: {
    flex: 1,
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  resultMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  metadataText: {
    fontSize: 14,
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 