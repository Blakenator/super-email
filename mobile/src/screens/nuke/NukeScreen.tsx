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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';
import { DateTime } from 'luxon';
import { Button, Icon, IconName } from '../../components/ui';

const NUKE_OLD_EMAILS_MUTATION = gql`
  mutation NukeOldEmails($input: NukeOldEmailsInput!) {
    nukeOldEmails(input: $input)
  }
`;

interface NukeOption {
  id: string;
  label: string;
  description: string;
  icon: IconName;
  getDate: () => Date | undefined;
}

const NUKE_OPTIONS: NukeOption[] = [
  {
    id: 'all',
    label: 'All Emails',
    description: 'Archive everything in your inbox',
    icon: 'zap',
    getDate: () => undefined,
  },
  {
    id: '1week',
    label: '1 Week Ago',
    description: 'Archive emails older than 1 week',
    icon: 'clock',
    getDate: () => DateTime.now().minus({ weeks: 1 }).toJSDate(),
  },
  {
    id: '1month',
    label: '1 Month Ago',
    description: 'Archive emails older than 1 month',
    icon: 'clock',
    getDate: () => DateTime.now().minus({ months: 1 }).toJSDate(),
  },
  {
    id: '6months',
    label: '6 Months Ago',
    description: 'Archive emails older than 6 months',
    icon: 'clock',
    getDate: () => DateTime.now().minus({ months: 6 }).toJSDate(),
  },
  {
    id: '1year',
    label: '1 Year Ago',
    description: 'Archive emails older than 1 year',
    icon: 'archive',
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
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.resultContainer}>
          <View style={[styles.successIcon, { backgroundColor: theme.colors.success + '20' }]}>
            <Icon name="check-circle" size="xl" color={theme.colors.success} />
          </View>
          <Text style={[styles.resultTitle, { color: theme.colors.text }]}>
            Success!
          </Text>
          <Text style={[styles.resultSubtitle, { color: theme.colors.textMuted }]}>
            {result} email{result !== 1 ? 's' : ''} archived
          </Text>
          <Button
            title="Back to Inbox"
            onPress={onComplete}
            style={{ marginTop: SPACING.xl }}
          />
        </View>
      </View>
    );
  }
  
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={sharedStyles.screenScrollContent}
    >
      {/* Header */}
      <LinearGradient
        colors={[theme.colors.error, theme.colors.primaryDark]}
        style={styles.header}
      >
        <View style={styles.headerIconContainer}>
          <Icon name="zap" size="xl" color={theme.colors.textInverse} />
        </View>
        <Text style={[styles.headerTitle, { color: theme.colors.textInverse }]}>Inbox Nuke</Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textInverse }]}>
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
            
            <View style={[styles.optionIconContainer, { backgroundColor: theme.colors.primary + '15' }]}>
              <Icon name={option.icon} size="md" color={theme.colors.primary} />
            </View>
            
            <View style={styles.optionContent}>
              <Text style={[styles.optionLabel, { color: theme.colors.text }]}>
                {option.label}
              </Text>
              <Text style={[styles.optionDescription, { color: theme.colors.textMuted }]}>
                {option.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
      
      {/* Info */}
      <View style={[styles.infoCard, { backgroundColor: theme.colors.info + '15' }]}>
        <Icon name="info" size="md" color={theme.colors.info} />
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
          style={{ backgroundColor: theme.colors.error }}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: 'bold',
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: FONT_SIZE.lg,
    textAlign: 'center',
    opacity: 0.9,
  },
  optionsContainer: {
    padding: SPACING.md,
  },
  optionsTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
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
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '500',
  },
  optionDescription: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginHorizontal: SPACING.md,
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    gap: SPACING.sm,
  },
  infoText: {
    flex: 1,
    fontSize: FONT_SIZE.sm,
    lineHeight: 20,
  },
  actionContainer: {
    padding: SPACING.md,
    paddingTop: SPACING.lg,
  },
  resultContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  successIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  resultTitle: {
    fontSize: FONT_SIZE.xxl,
    fontWeight: 'bold',
    marginBottom: SPACING.sm,
  },
  resultSubtitle: {
    fontSize: FONT_SIZE.lg,
  },
});
