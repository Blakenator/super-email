/**
 * Compose Email Screen
 * Create and send new emails
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon, Button, RichTextEditor } from '../../components/ui';
import { useEmailStore, EmailAccount } from '../../stores/emailStore';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';

const SEND_EMAIL_MUTATION = gql`
  mutation SendEmail($input: SendEmailInput!) {
    sendEmail(input: $input) {
      id
      messageId
    }
  }
`;

const GET_SMTP_PROFILES_QUERY = gql`
  query GetSmtpProfiles {
    getSmtpProfiles {
      id
      name
      email
      isDefault
    }
  }
`;

interface SmtpProfile {
  id: string;
  name: string;
  email: string;
  isDefault: boolean;
}

interface ComposeScreenProps {
  onClose: () => void;
  replyTo?: {
    emailId: string;
    toAddress: string;
    subject: string;
  };
}

export function ComposeScreen({ onClose, replyTo }: ComposeScreenProps) {
  const theme = useTheme();
  const { emailAccounts, fetchEmailAccounts } = useEmailStore();
  
  const [smtpProfiles, setSmtpProfiles] = useState<SmtpProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  
  const [to, setTo] = useState(replyTo?.toAddress || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(replyTo?.subject ? `Re: ${replyTo.subject}` : '');
  const [bodyHtml, setBodyHtml] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(false);

  const handleEditorChange = (html: string, text: string) => {
    setBodyHtml(html);
    setBodyText(text);
  };

  useEffect(() => {
    loadSmtpProfiles();
    fetchEmailAccounts();
  }, []);

  const loadSmtpProfiles = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_SMTP_PROFILES_QUERY,
        fetchPolicy: 'network-only',
      });
      const profiles = data?.getSmtpProfiles ?? [];
      setSmtpProfiles(profiles);
      
      // Select default profile
      const defaultProfile = profiles.find((p: SmtpProfile) => p.isDefault);
      if (defaultProfile) {
        setSelectedProfileId(defaultProfile.id);
      } else if (profiles.length > 0) {
        setSelectedProfileId(profiles[0].id);
      }
    } catch (error) {
      console.error('Error loading SMTP profiles:', error);
    }
  };

  const handleSend = async () => {
    if (!to.trim()) {
      Alert.alert('Error', 'Please enter a recipient');
      return;
    }
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject');
      return;
    }
    if (!selectedProfileId) {
      Alert.alert('Error', 'Please select an SMTP profile');
      return;
    }

    setIsSending(true);

    try {
      await apolloClient.mutate({
        mutation: SEND_EMAIL_MUTATION,
        variables: {
          input: {
            smtpProfileId: selectedProfileId,
            to: to.split(',').map(e => e.trim()),
            cc: cc ? cc.split(',').map(e => e.trim()) : [],
            bcc: bcc ? bcc.split(',').map(e => e.trim()) : [],
            subject: subject.trim(),
            textBody: bodyText,
            htmlBody: bodyHtml || `<p>${bodyText.replace(/\n/g, '<br/>')}</p>`,
          },
        },
      });

      Alert.alert('Success', 'Email sent successfully', [
        { text: 'OK', onPress: onClose },
      ]);
    } catch (error) {
      console.error('Error sending email:', error);
      Alert.alert('Error', 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const selectedProfile = smtpProfiles.find(p => p.id === selectedProfileId);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="x" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {replyTo ? 'Reply' : 'New Email'}
        </Text>
        <TouchableOpacity
          onPress={handleSend}
          disabled={isSending}
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
        >
          <Icon name="send" size="sm" color="#fff" />
          <Text style={styles.sendButtonText}>{isSending ? 'Sending...' : 'Send'}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.form} keyboardShouldPersistTaps="handled">
        {/* From */}
        <TouchableOpacity
          style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}
          onPress={() => setShowFromPicker(true)}
        >
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>From:</Text>
          <Text style={[styles.fieldValue, { color: theme.colors.text }]} numberOfLines={1}>
            {selectedProfile?.email || 'Select profile...'}
          </Text>
          <Icon name="chevron-down" size="sm" color={theme.colors.textMuted} />
        </TouchableOpacity>

        {/* To */}
        <View style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>To:</Text>
          <TextInput
            style={[styles.fieldInput, { color: theme.colors.text }]}
            value={to}
            onChangeText={setTo}
            placeholder="Recipient email"
            placeholderTextColor={theme.colors.textMuted}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {!showCcBcc && (
            <TouchableOpacity onPress={() => setShowCcBcc(true)}>
              <Text style={[styles.ccBccToggle, { color: theme.colors.primary }]}>Cc/Bcc</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* CC & BCC */}
        {showCcBcc && (
          <>
            <View style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Cc:</Text>
              <TextInput
                style={[styles.fieldInput, { color: theme.colors.text }]}
                value={cc}
                onChangeText={setCc}
                placeholder="CC recipients"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Bcc:</Text>
              <TextInput
                style={[styles.fieldInput, { color: theme.colors.text }]}
                value={bcc}
                onChangeText={setBcc}
                placeholder="BCC recipients"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </>
        )}

        {/* Subject */}
        <View style={[styles.fieldRow, { borderBottomColor: theme.colors.border }]}>
          <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Subject:</Text>
          <TextInput
            style={[styles.fieldInput, { color: theme.colors.text }]}
            value={subject}
            onChangeText={setSubject}
            placeholder="Email subject"
            placeholderTextColor={theme.colors.textMuted}
          />
        </View>

        {/* Body - Rich Text Editor */}
        <View style={styles.editorContainer}>
          <RichTextEditor
            onChange={handleEditorChange}
            placeholder="Compose your email..."
            minHeight={250}
            autoFocus={!replyTo}
          />
        </View>
      </ScrollView>

      {/* From Picker Modal */}
      {showFromPicker && (
        <View style={[styles.pickerOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <View style={[styles.pickerModal, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>Select From</Text>
              <TouchableOpacity onPress={() => setShowFromPicker(false)}>
                <Icon name="x" size="md" color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {smtpProfiles.map(profile => (
              <TouchableOpacity
                key={profile.id}
                style={[
                  styles.pickerOption,
                  { borderBottomColor: theme.colors.border },
                  profile.id === selectedProfileId && { backgroundColor: theme.colors.primary + '10' },
                ]}
                onPress={() => {
                  setSelectedProfileId(profile.id);
                  setShowFromPicker(false);
                }}
              >
                <Text style={[styles.pickerOptionText, { color: theme.colors.text }]}>
                  {profile.name}
                </Text>
                <Text style={[styles.pickerOptionSubtext, { color: theme.colors.textMuted }]}>
                  {profile.email}
                </Text>
                {profile.id === selectedProfileId && (
                  <Icon name="check" size="md" color={theme.colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  headerButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    flex: 1,
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
  },
  sendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    gap: SPACING.xs,
  },
  sendButtonText: {
    color: '#fff',
    fontSize: FONT_SIZE.md,
    fontWeight: '600',
  },
  form: {
    flex: 1,
  },
  fieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.md,
    width: 60,
  },
  fieldValue: {
    flex: 1,
    fontSize: FONT_SIZE.md,
  },
  fieldInput: {
    flex: 1,
    fontSize: FONT_SIZE.md,
    padding: 0,
  },
  ccBccToggle: {
    fontSize: FONT_SIZE.sm,
    fontWeight: '500',
  },
  editorContainer: {
    flex: 1,
    minHeight: 250,
  },
  pickerOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  pickerModal: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '50%',
  },
  pickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pickerTitle: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: SPACING.sm,
  },
  pickerOptionText: {
    flex: 1,
    fontSize: FONT_SIZE.lg,
  },
  pickerOptionSubtext: {
    fontSize: FONT_SIZE.sm,
  },
});
