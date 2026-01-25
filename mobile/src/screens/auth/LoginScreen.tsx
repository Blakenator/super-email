/**
 * Login Screen
 * Supports email/password and biometric authentication
 * When biometric is available and enabled, it shows as the primary option
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme, SPACING, FONT_SIZE } from '../../theme';
import { useAuthStore } from '../../stores/authStore';
import { Button, Input, useSafeInsets } from '../../components/ui';
import { getBiometricTypeName } from '../../services/biometricAuth';

interface LoginScreenProps {
  onNavigateToSignup: () => void;
}

export function LoginScreen({ onNavigateToSignup }: LoginScreenProps) {
  const theme = useTheme();
  const { padding: safeAreaPadding } = useSafeInsets(['top', 'bottom']);
  const {
    login,
    loginWithBiometric,
    isLoading,
    biometricAvailable,
    biometricEnabled,
    biometricType,
  } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordLogin, setShowPasswordLogin] = useState(false);

  const canUseBiometric = biometricAvailable && biometricEnabled;

  // Auto-prompt biometric on mount when available
  useEffect(() => {
    if (canUseBiometric && !showPasswordLogin) {
      handleBiometricLogin();
    }
  }, [canUseBiometric]);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter your email and password');
      return;
    }

    setError(null);

    try {
      await login(email.trim(), password, rememberMe);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  };

  const handleBiometricLogin = async () => {
    setError(null);

    const success = await loginWithBiometric();

    if (!success) {
      // Biometric failed - don't automatically switch, let user retry or switch manually
    }
  };

  const biometricName = getBiometricTypeName(biometricType);

  // Biometric-first view
  if (canUseBiometric && !showPasswordLogin) {
    return (
      <LinearGradient
        colors={[theme.colors.primary, theme.colors.secondary]}
        style={styles.gradient}
      >
        <View style={[styles.biometricContainer, safeAreaPadding]}>
          <View style={styles.header}>
            <Text style={styles.logoIcon}>✉️</Text>
            <Text
              style={[styles.logoText, { color: theme.colors.textInverse }]}
            >
              SuperMail
            </Text>
          </View>

          <View
            style={[styles.biometricCard, { backgroundColor: theme.colors.surface }]}
          >
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.colors.error + '20' },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              </View>
            )}

            <View style={styles.biometricIconContainer}>
              <Text style={styles.biometricIcon}>
                {biometricType === 'facial' ? '👤' : '👆'}
              </Text>
            </View>

            <Text
              style={[styles.biometricTitle, { color: theme.colors.text }]}
            >
              Welcome back
            </Text>
            <Text
              style={[styles.biometricSubtitle, { color: theme.colors.textMuted }]}
            >
              Use {biometricName} to sign in
            </Text>

            <Button
              title={`Sign in with ${biometricName}`}
              onPress={handleBiometricLogin}
              loading={isLoading}
              fullWidth
              style={styles.biometricButton}
              icon={<Text>{biometricType === 'facial' ? '👤' : '👆'}</Text>}
            />

            <View style={styles.divider}>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
              <Text
                style={[
                  styles.dividerText,
                  { color: theme.colors.textMuted },
                ]}
              >
                or
              </Text>
              <View
                style={[
                  styles.dividerLine,
                  { backgroundColor: theme.colors.border },
                ]}
              />
            </View>

            <Button
              title="Sign in with password"
              onPress={() => setShowPasswordLogin(true)}
              variant="outline"
              fullWidth
              style={styles.switchButton}
            />

            <View style={styles.footer}>
              <Text
                style={[styles.footerText, { color: theme.colors.textMuted }]}
              >
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={onNavigateToSignup}>
                <Text
                  style={[styles.linkText, { color: theme.colors.primary }]}
                >
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </LinearGradient>
    );
  }

  // Traditional email/password view
  return (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={styles.gradient}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, safeAreaPadding]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.logoIcon}>✉️</Text>
            <Text
              style={[styles.logoText, { color: theme.colors.textInverse }]}
            >
              SuperMail
            </Text>
            <Text
              style={[
                styles.tagline,
                { color: theme.colors.textInverse, opacity: 0.8 },
              ]}
            >
              Sign in to your account
            </Text>
          </View>

          <View
            style={[styles.card, { backgroundColor: theme.colors.surface }]}
          >
            {error && (
              <View
                style={[
                  styles.errorContainer,
                  { backgroundColor: theme.colors.error + '20' },
                ]}
              >
                <Text style={[styles.errorText, { color: theme.colors.error }]}>
                  {error}
                </Text>
              </View>
            )}

            <Input
              label="Email address"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              autoComplete="password"
            />

            <TouchableOpacity
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberMe}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: rememberMe
                      ? theme.colors.primary
                      : theme.colors.border,
                    backgroundColor: rememberMe
                      ? theme.colors.primary
                      : 'transparent',
                  },
                ]}
              >
                {rememberMe && (
                  <Text style={{ color: theme.colors.textInverse }}>✓</Text>
                )}
              </View>
              <Text
                style={[styles.rememberMeText, { color: theme.colors.text }]}
              >
                Remember me on this device
              </Text>
            </TouchableOpacity>

            <Button
              title="Sign In"
              onPress={handleLogin}
              loading={isLoading}
              fullWidth
              style={styles.signInButton}
            />

            {canUseBiometric && (
              <>
                <View style={styles.divider}>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                  <Text
                    style={[
                      styles.dividerText,
                      { color: theme.colors.textMuted },
                    ]}
                  >
                    or
                  </Text>
                  <View
                    style={[
                      styles.dividerLine,
                      { backgroundColor: theme.colors.border },
                    ]}
                  />
                </View>

                <Button
                  title={`Sign in with ${biometricName}`}
                  onPress={() => {
                    setShowPasswordLogin(false);
                    handleBiometricLogin();
                  }}
                  variant="outline"
                  fullWidth
                  icon={<Text>{biometricType === 'facial' ? '👤' : '👆'}</Text>}
                />
              </>
            )}

            <View style={styles.footer}>
              <Text
                style={[styles.footerText, { color: theme.colors.textMuted }]}
              >
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity onPress={onNavigateToSignup}>
                <Text
                  style={[styles.linkText, { color: theme.colors.primary }]}
                >
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  biometricContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  logoText: {
    fontSize: FONT_SIZE.xxxl,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: FONT_SIZE.lg,
    marginTop: SPACING.sm,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  biometricCard: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    alignItems: 'center',
  },
  biometricIconContainer: {
    marginBottom: SPACING.lg,
  },
  biometricIcon: {
    fontSize: 64,
  },
  biometricTitle: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  biometricSubtitle: {
    fontSize: FONT_SIZE.md,
    marginBottom: SPACING.xl,
  },
  biometricButton: {
    marginBottom: SPACING.md,
  },
  switchButton: {
    marginBottom: SPACING.sm,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    width: '100%',
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  rememberMe: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 2,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rememberMeText: {
    fontSize: 14,
  },
  signInButton: {
    marginBottom: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    width: '100%',
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
  },
  linkText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
