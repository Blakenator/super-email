/**
 * Nuke Screen
 * Bulk archive old emails to reach inbox zero
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../theme';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';
import { DateTime } from 'luxon';
import { Button } from '../../components/ui';

const NUKE_OLD_EMAILS_MUTATION = gql`
  mutation NukeOldEmails($input: NukeOldEmailsInput!) {
    nukeOldEmails(input: $input)
  }
`;

interface NukeOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  getDate: () => Date | undefined;
}

const NUKE_OPTIONS: NukeOption[] = [
  {
    id: 'all',
    label: 'All Emails',
    description: 'Archive everything in your inbox',
    icon: '💥',
    getDate: () => undefined,
  },
  {
    id: '1week',
    label: '1 Week Ago',
    description: 'Archive emails older than 1 week',
    icon: '📅',
    getDate: () => DateTime.now().minus({ weeks: 1 }).toJSDate(),
  },
  {
    id: '1month',
    label: '1 Month Ago',
    description: 'Archive emails older than 1 month',
    icon: '📆',
    getDate: () => DateTime.now().minus({ months: 1 }).toJSDate(),
  },
  {
    id: '6months',
    label: '6 Months Ago',
    description: 'Archive emails older than 6 months',
    icon: '🗓️',
    getDate: () => DateTime.now().minus({ months: 6 }).toJSDate(),
  },
  {
    id: '1year',
    label: '1 Year Ago',
    description: 'Archive emails older than 1 year',
    icon: '📚',
    getDate: () => DateTime.now().minus({ years: 1 }).toJSDate(),
  },
];

interface NukeScreenProps {
  onComplete: () => void;
}

export function NukeScreen({ onComplete }: NukeScreenProps) {
  const theme = useTheme();
  const [selectedOption, setSelectedOption] = useState<string>('1month');
  const [isNuking, setIsNuking] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  
  const handleNuke = async () => {
    const option = NUKE_OPTIONS.find((o) => o.id === selectedOption);
    if (!option) return;
    
    const olderThan = option.getDate();
    const message = olderThan
      ? `Archive all emails older than ${option.label.toLowerCase()}?`
      : 'Archive ALL emails in your inbox?';
    
    Alert.alert(
      'Confirm Archive',
      message + '\n\nEmails will be moved to your Archive folder and can be recovered later.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: async () => {
            setIsNuking(true);
            
            try {
              const { data } = await apolloClient.mutate({
                mutation: NUKE_OLD_EMAILS_MUTATION,
                variables: {
                  input: { olderThan },
                },
              });
              
              setResult(data?.nukeOldEmails || 0);
            } catch (error) {
              Alert.alert('Error', 'Failed to archive emails');
            } finally {
              setIsNuking(false);
            }
          },
        },
      ]
    );
  };
  
  if (result !== null) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={styles.resultContainer}>
          <Text style={styles.resultIcon}>🎉</Text>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
            Success!
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textMuted }]}>
            {result} email{result !== 1 ? 's' : ''} archived
          </Text>
          <Button
            title="Back to Inbox"
            onPress={onComplete}
            style={{ marginTop: 32 }}
          />
        </View>
      </View>
    );
  }
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Header */}
      <LinearGradient
        colors={['#ff6b6b', '#ee5a24']}
        style={styles.header}
      >
        <Text style={styles.headerIcon}>💣</Text>
        <Text style={styles.headerTitle}>Inbox Nuke</Text>
        <Text style={styles.headerSubtitle}>
          Archive old emails to reach inbox zero
        </Text>
      </LinearGradient>
      
      {/* Options */}
      <View style={styles.optionsContainer}>
        <Text style={[styles.optionsTitle, { color: theme.colors.text }]}>
          Archive emails older than:
        </Text>
        
        {NUKE_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.id}
            onPress={() => setSelectedOption(option.id)}
            style={[
              styles.optionCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor:
                  selectedOption === option.id
                    ? theme.colors.primary
                    : theme.colors.border,
                borderWidth: selectedOption === option.id ? 2 : 1,
              },
            ]}
          >
            <View
              style={[
                styles.optionRadio,
                {
                  borderColor:
                    selectedOption === option.id
                      ? theme.colors.primary
                      : theme.colors.border,
                },
              ]}
            >
              {selectedOption === option.id && (
                <View
                  style={[
                    styles.optionRadioInner,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />
              )}
            </View>
            
            <Text style={styles.optionIcon}>{option.icon}</Text>
            
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                {option.label}
              </Text>
              <Text
                style={[styles.optionDescription, { color: theme.colors.textMuted }]}
              >
                {option.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Info */}
      <View
        style={[styles.infoCard, { backgroundColor: theme.colors.info + '20' }]}
      >
        <Text style={styles.infoIcon}>ℹ️</Text>
        <Text style={[styles.infoText, { color: theme.colors.info }]}>
          Emails will be moved to your Archive folder, not permanently deleted.
          You can find them later if needed.
        </Text>
      </View>
      
      {/* Action Button */}
      <View style={styles.actionContainer}>
        <Button
          title={isNuking ? 'Archiving...' : 'Archive Old Emails'}
          onPress={handleNuke}
          loading={isNuking}
          disabled={isNuking}
          fullWidth
          style={{ backgroundColor: '#ee5a24' }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 32,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  headerIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  optionsContainer: {
    padding: 16,
  },
  optionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  optionRadio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionRadioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionIcon: {
    fontSize: 24,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoIcon: {
    fontSize: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actionContainer: {
    padding: 16,
    paddingTop: 24,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  resultIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  resultSubtitle: {
    fontSize: 16,
  },
});
