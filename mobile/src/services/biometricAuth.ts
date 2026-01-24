/**
 * Biometric Authentication Service
 * Handles fingerprint and face recognition authentication
 */

import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';
import { secureGet, secureSet, STORAGE_KEYS } from './secureStorage';

export type BiometricType = 'fingerprint' | 'facial' | 'iris' | 'none';

export interface BiometricAuthResult {
  success: boolean;
  error?: string;
  biometricType?: BiometricType;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function isBiometricAvailable(): Promise<boolean> {
  try {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    if (!compatible) {
      return false;
    }

    const enrolled = await LocalAuthentication.isEnrolledAsync();
    return enrolled;
  } catch (error) {
    console.error('Error checking biometric availability:', error);
    return false;
  }
}

/**
 * Get the type of biometric authentication available
 */
export async function getBiometricType(): Promise<BiometricType> {
  try {
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();

    if (
      types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)
    ) {
      return 'facial';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'fingerprint';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'iris';
    }

    return 'none';
  } catch (error) {
    console.error('Error getting biometric type:', error);
    return 'none';
  }
}

/**
 * Get a user-friendly name for the biometric type
 */
export function getBiometricTypeName(type: BiometricType): string {
  switch (type) {
    case 'facial':
      return Platform.OS === 'ios' ? 'Face ID' : 'Face Recognition';
    case 'fingerprint':
      return Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    case 'iris':
      return 'Iris Scanner';
    default:
      return 'Biometric';
  }
}

/**
 * Authenticate using biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage?: string,
): Promise<BiometricAuthResult> {
  try {
    const biometricType = await getBiometricType();
    const typeName = getBiometricTypeName(biometricType);

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: promptMessage || `Unlock SuperMail with ${typeName}`,
      cancelLabel: 'Use Password',
      disableDeviceFallback: false,
      fallbackLabel: 'Use Passcode',
    });

    if (result.success) {
      return { success: true, biometricType };
    }

    return {
      success: false,
      error: result.error || 'Authentication failed',
      biometricType,
    };
  } catch (error) {
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Check if biometric authentication is enabled for the app
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const enabled = await secureGet(STORAGE_KEYS.BIOMETRIC_ENABLED);
  return enabled === 'true';
}

/**
 * Enable or disable biometric authentication
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await secureSet(STORAGE_KEYS.BIOMETRIC_ENABLED, String(enabled));
}

/**
 * Full biometric login flow:
 * 1. Check if biometric is available and enabled
 * 2. Authenticate with biometrics
 * 3. Return stored credentials if successful
 */
export async function attemptBiometricLogin(): Promise<{
  success: boolean;
  email?: string;
  error?: string;
}> {
  // Check if biometric is available and enabled
  const available = await isBiometricAvailable();
  if (!available) {
    return { success: false, error: 'Biometric authentication not available' };
  }

  const enabled = await isBiometricEnabled();
  if (!enabled) {
    return { success: false, error: 'Biometric authentication not enabled' };
  }

  // Check if we have saved credentials
  const savedEmail = await secureGet(STORAGE_KEYS.SAVED_EMAIL);
  if (!savedEmail) {
    return { success: false, error: 'No saved credentials' };
  }

  // Authenticate with biometrics
  const authResult = await authenticateWithBiometrics();
  if (!authResult.success) {
    return { success: false, error: authResult.error };
  }

  return { success: true, email: savedEmail };
}
