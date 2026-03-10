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
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme, sharedStyles, SPACING, FONT_SIZE, RADIUS } from '../../theme';
import { Icon, Button, RichTextEditor, EmailChipInput } from '../../components/ui';
import { useEmailStore, EmailAccount } from '../../stores/emailStore';
import { apolloClient } from '../../services/apollo';
import { gql } from '@apollo/client';
import { wrapReplyContent } from '../../../../common/src/emailHtmlStyles';

const SEND_EMAIL_MUTATION = gql`
  mutation SendEmail($input: ComposeEmailInput!) {
    sendEmail(input: $input) {
      id
      messageId
    }
  }
`;

const GET_SEND_PROFILES_QUERY = gql`
  query GetSendProfiles {
    getSendProfiles {
      id
      name
      email
      isDefault
    }
  }
`;

interface SendProfile {
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
    htmlBody?: string;
  };
  replyAll?: {
    emailId: string;
    toAddresses: string[];
    ccAddresses?: string[];
    subject: string;
    htmlBody?: string;
  };
  forward?: {
    emailId: string;
    subject: string;
    htmlBody?: string;
    attachments?: Array<{ id: string; filename: string }>;
  };
  mailto?: {
    to: string;
    cc?: string;
    bcc?: string;
    subject?: string;
    body?: string;
  };
}

export function ComposeScreen({ onClose, replyTo, replyAll, forward, mailto }: ComposeScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { emailAccounts, fetchEmailAccounts } = useEmailStore();
  
  const [sendProfiles, setSendProfiles] = useState<SendProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [showFromPicker, setShowFromPicker] = useState(false);
  
  // Determine compose mode and initial values
  const isReply = !!replyTo;
  const isReplyAll = !!replyAll;
  const isForward = !!forward;
  
  const getInitialTo = (): string => {
    if (replyTo) return replyTo.toAddress;
    if (replyAll) return replyAll.toAddresses.join(', ');
    if (mailto?.to) return mailto.to;
    return '';
  };
  
  const getInitialCc = (): string => {
    if (replyAll?.ccAddresses) return replyAll.ccAddresses.join(', ');
    if (mailto?.cc) return mailto.cc;
    return '';
  };
  
  const getInitialSubject = (): string => {
    if (replyTo?.subject) return `Re: ${replyTo.subject.replace(/^Re:\s*/i, '')}`;
    if (replyAll?.subject) return `Re: ${replyAll.subject.replace(/^Re:\s*/i, '')}`;
    if (forward?.subject) return `Fwd: ${forward.subject.replace(/^Fwd:\s*/i, '')}`;
    if (mailto?.subject) return mailto.subject;
    return '';
  };
  
  // Get original HTML body for quoting
  const getOriginalHtmlBody = (): string | undefined => {
    return replyTo?.htmlBody || replyAll?.htmlBody || forward?.htmlBody;
  };
  
  const [to, setTo] = useState(getInitialTo());
  const [cc, setCc] = useState(getInitialCc());
  const [bcc, setBcc] = useState(mailto?.bcc || '');
  const [subject, setSubject] = useState(getInitialSubject());
  const [bodyHtml, setBodyHtml] = useState('');
  const [bodyText, setBodyText] = useState(mailto?.body || '');
  const [isSending, setIsSending] = useState(false);
  const [showCcBcc, setShowCcBcc] = useState(isReplyAll || !!getInitialCc() || !!mailto?.bcc);
  
  // Format quoted original email for reply/forward using shared utility
  const getQuotedOriginalEmail = (): string => {
    const originalHtml = getOriginalHtmlBody();
    if (!originalHtml) return '';
    
    // Get the original sender for the quote header
    const originalSender = replyTo?.toAddress || replyAll?.toAddresses?.[0] || 'Original sender';
    
    return wrapReplyContent(originalHtml, originalSender, new Date());
  };

  const handleEditorChange = (html: string, text: string) => {
    setBodyHtml(html);
    setBodyText(text);
  };

  useEffect(() => {
    loadSendProfiles();
    fetchEmailAccounts();
  }, []);

  const loadSendProfiles = async () => {
    try {
      const { data } = await apolloClient.query({
        query: GET_SEND_PROFILES_QUERY,
        fetchPolicy: 'network-only',
      });
      const profiles = data?.getSendProfiles ?? [];
      setSendProfiles(profiles);

      // Select default profile
      const defaultProfile = profiles.find((p: SendProfile) => p.isDefault);
      if (defaultProfile) {
        setSelectedProfileId(defaultProfile.id);
      } else if (profiles.length > 0) {
        setSelectedProfileId(profiles[0].id);
      }
    } catch (error) {
      console.error('Error loading send profiles:', error);
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
      Alert.alert('Error', 'Please select a send profile');
      return;
    }

    setIsSending(true);

    try {
      // Include quoted original email in replies and forwards
      const isQuotedReply = isReply || isReplyAll || isForward;
      const quotedEmail = isQuotedReply ? getQuotedOriginalEmail() : '';
      const fullHtmlBody = bodyHtml 
        ? `${bodyHtml}${quotedEmail}` 
        : `<p>${bodyText.replace(/\n/g, '<br/>')}</p>${quotedEmail}`;
      
      const result = await apolloClient.mutate({
        mutation: SEND_EMAIL_MUTATION,
        variables: {
          input: {
            emailAccountId: emailAccounts[0]?.id,
            sendProfileId: selectedProfileId,
            toAddresses: to.split(',').map(e => e.trim()),
            ccAddresses: cc ? cc.split(',').map(e => e.trim()) : [],
            bccAddresses: bcc ? bcc.split(',').map(e => e.trim()) : [],
            subject: subject.trim(),
            textBody: bodyText,
            htmlBody: fullHtmlBody,
          },
        },
      });

      if (result.errors && result.errors.length > 0) {
        throw new Error(result.errors[0].message);
      }

      onClose();
    } catch (error: any) {
      console.error('Error sending email:', error);
      Alert.alert('Error', error.message || 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const selectedProfile = sendProfiles.find(p => p.id === selectedProfileId);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header with safe area padding */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border, paddingTop: insets.top + SPACING.sm }]}>
        <TouchableOpacity onPress={onClose} style={styles.headerButton}>
          <Icon name="x" size="md" color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {isForward ? 'Forward' : isReplyAll ? 'Reply All' : isReply ? 'Reply' : 'New Email'}
        </Text>
        <TouchableOpacity
          onPress={handleSend}
          disabled={isSending}
          style={[styles.sendButton, { backgroundColor: theme.colors.primary }]}
        >
          <Icon name="send" size="sm" color={theme.colors.textInverse} />
          <Text style={[styles.sendButtonText, { color: theme.colors.textInverse }]}>{isSending ? 'Sending...' : 'Send'}</Text>
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
        <View style={[styles.chipFieldRow, { borderBottomColor: theme.colors.border }]}>
          <View style={styles.chipFieldHeader}>
            <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>To:</Text>
            {!showCcBcc && (
              <TouchableOpacity onPress={() => setShowCcBcc(true)}>
                <Text style={[styles.ccBccToggle, { color: theme.colors.primary }]}>Cc/Bcc</Text>
              </TouchableOpacity>
            )}
          </View>
          <EmailChipInput
            value={to}
            onChange={setTo}
            placeholder="Recipient email addresses"
          />
        </View>

        {/* CC & BCC */}
        {showCcBcc && (
          <>
            <View style={[styles.chipFieldRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Cc:</Text>
              <EmailChipInput
                value={cc}
                onChange={setCc}
                placeholder="CC recipients"
              />
            </View>
            <View style={[styles.chipFieldRow, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.fieldLabel, { color: theme.colors.textMuted }]}>Bcc:</Text>
              <EmailChipInput
                value={bcc}
                onChange={setBcc}
                placeholder="BCC recipients"
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
            autoFocus={!(isReply || isReplyAll || isForward)}
            initialHtml={
              getOriginalHtmlBody()
                ? getQuotedOriginalEmail()
                : mailto?.body
                  ? `<p>${mailto.body.replace(/\n/g, '<br/>')}</p>`
                  : undefined
            }
          />
        </View>

        {/* Bottom spacer to prevent overlap with tab bar */}
        <View style={{ height: insets.bottom + SPACING.xl * 2 }} />
      </ScrollView>

      {/* From Picker Modal */}
      <Modal
        visible={showFromPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFromPicker(false)}
      >
        <TouchableOpacity
          style={styles.pickerOverlay}
          activeOpacity={1}
          onPress={() => setShowFromPicker(false)}
        >
          <View style={[styles.pickerModal, { backgroundColor: theme.colors.surface, paddingBottom: insets.bottom }]}>
            <View style={[styles.pickerHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.pickerTitle, { color: theme.colors.text }]}>Select From</Text>
              <TouchableOpacity onPress={() => setShowFromPicker(false)}>
                <Icon name="x" size="md" color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            {sendProfiles.map(profile => (
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
        </TouchableOpacity>
      </Modal>
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
  chipFieldRow: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  chipFieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  fieldLabel: {
    fontSize: FONT_SIZE.md,
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
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
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
