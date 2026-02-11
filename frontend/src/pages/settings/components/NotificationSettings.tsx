import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  Button,
  Alert,
  Badge,
  ListGroup,
  Form,
  Spinner,
} from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faBellSlash,
  faCheck,
  faTimes,
  faMobileAlt,
  faDesktop,
  faInfoCircle,
  faEnvelope,
  faTrash,
  faGlobe,
} from '@fortawesome/free-solid-svg-icons';
import {
  faApple as fabApple,
  faAndroid as fabAndroid,
} from '@fortawesome/free-brands-svg-icons';
import toast from 'react-hot-toast';
import { gql } from '../../../__generated__/gql';
import { PushPlatform } from '../../../__generated__/graphql';
import { useMutation } from '@apollo/client/react';
import {
  getNotificationDetailLevel,
  setNotificationDetailLevel,
  type NotificationDetailLevel,
} from '../../../hooks/useMailboxSubscription';
import {
  StatusCard,
  StatusItem,
  StatusLabel,
  StatusValue,
} from './NotificationSettings.wrappers';
import {
  isFirebaseConfigured,
  getFCMToken,
  onForegroundMessage,
  initializeFirebase,
} from '../../../services/firebase';

// GraphQL mutations for push tokens (typed via __generated__/gql)
const GET_PUSH_TOKENS = gql(`
  mutation GetPushTokens {
    getPushTokens {
      id
      token
      platform
      deviceName
      isActive
      lastUsedAt
      createdAt
    }
  }
`);

const REGISTER_PUSH_TOKEN = gql(`
  mutation RegisterPushToken($input: RegisterPushTokenInput!) {
    registerPushToken(input: $input) {
      success
      message
    }
  }
`);

const UNREGISTER_PUSH_TOKEN = gql(`
  mutation UnregisterPushToken($token: String!) {
    unregisterPushToken(token: $token)
  }
`);

interface PushToken {
  id: string;
  token: string;
  platform: 'IOS' | 'ANDROID' | 'WEB';
  deviceName: string | null;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
}

type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'other';

function detectBrowser(): BrowserType {
  const ua = navigator.userAgent.toLowerCase();

  // Check Safari first (but not Chrome-based browsers pretending to be Safari)
  if (
    ua.includes('safari') &&
    !ua.includes('chrome') &&
    !ua.includes('chromium')
  ) {
    return 'safari';
  }
  // Edge (Chromium-based)
  if (ua.includes('edg/') || ua.includes('edge/')) {
    return 'edge';
  }
  // Firefox
  if (ua.includes('firefox') || ua.includes('fxios')) {
    return 'firefox';
  }
  // Chrome (and Chromium-based browsers)
  if (
    ua.includes('chrome') ||
    ua.includes('chromium') ||
    ua.includes('crios')
  ) {
    return 'chrome';
  }

  return 'other';
}

function isIOSSafari(): boolean {
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) && !('MSStream' in window);
}

function isMacOS(): boolean {
  return navigator.platform.toLowerCase().includes('mac');
}

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isStandalone: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  serviceWorkerActive: boolean;
  mailtoHandlerRegistered: boolean;
}

export function NotificationSettings() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isStandalone: false,
    notificationPermission: 'unsupported',
    serviceWorkerActive: false,
    mailtoHandlerRegistered: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [registeringMailto, setRegisteringMailto] = useState(false);
  const [notificationDetailLevel, setDetailLevel] =
    useState<NotificationDetailLevel>(getNotificationDetailLevel());

  // Push tokens state
  const [pushTokens, setPushTokens] = useState<PushToken[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(true);
  const [removingToken, setRemovingToken] = useState<string | null>(null);

  // GraphQL mutations
  const [getPushTokensMutation] = useMutation(GET_PUSH_TOKENS);
  const [registerPushTokenMutation] = useMutation(REGISTER_PUSH_TOKEN);
  const [unregisterPushTokenMutation] = useMutation(UNREGISTER_PUSH_TOKEN);

  // Fetch push tokens
  const fetchPushTokens = async () => {
    setLoadingTokens(true);
    try {
      const { data } = await getPushTokensMutation();
      const tokens = data?.getPushTokens ?? [];
      setPushTokens(
        tokens.map((t) => ({
          id: t.id,
          token: t.token,
          platform: t.platform,
          deviceName: t.deviceName ?? null,
          isActive: t.isActive,
          lastUsedAt: t.lastUsedAt ?? null,
          createdAt: t.createdAt ?? '',
        })),
      );
    } catch (error) {
      console.error('Failed to fetch push tokens:', error);
    } finally {
      setLoadingTokens(false);
    }
  };

  // Remove a push token
  const handleRemoveToken = async (token: string) => {
    setRemovingToken(token);
    try {
      await unregisterPushTokenMutation({ variables: { token } });
      setPushTokens((prev) => prev.filter((t) => t.token !== token));
      toast.success('Device removed successfully');
    } catch (error) {
      console.error('Failed to remove push token:', error);
      toast.error('Failed to remove device');
    } finally {
      setRemovingToken(null);
    }
  };

  // Register browser for push notifications using Firebase Cloud Messaging
  const registerWebPushToken = async () => {
    try {
      let tokenToUse: string | null = null;

      // Try to get FCM token if Firebase is configured
      if (isFirebaseConfigured()) {
        // Initialize Firebase and send config to service worker
        initializeFirebase();
        await sendFirebaseConfigToServiceWorker();

        tokenToUse = await getFCMToken();
        if (tokenToUse) {
          // Store the FCM token
          localStorage.setItem('web-push-token', tokenToUse);
          console.log('Got FCM token for web push');
        }
      }

      // Fallback to simple token if FCM is not available
      if (!tokenToUse) {
        const storedToken = localStorage.getItem('web-push-token');
        if (storedToken && !storedToken.startsWith('web-')) {
          // Already have an FCM token stored
          tokenToUse = storedToken;
        } else {
          // Generate a fallback token (won't work for background notifications)
          tokenToUse = `web-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
          localStorage.setItem('web-push-token', tokenToUse);
          console.warn(
            'Using fallback web token - background notifications will not work',
          );
        }
      }

      // Get browser and device name
      const browserName = browser.charAt(0).toUpperCase() + browser.slice(1);
      const deviceName = `${browserName} on ${navigator.platform || 'Unknown'}`;

      await registerPushTokenMutation({
        variables: {
          input: {
            token: tokenToUse,
            platform: PushPlatform.Web,
            deviceName,
          },
        },
      });

      // Refresh the tokens list
      await fetchPushTokens();
    } catch (error) {
      console.error('Failed to register web push token:', error);
    }
  };

  // Send Firebase config to service worker
  const sendFirebaseConfigToServiceWorker = async () => {
    if (!('serviceWorker' in navigator)) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      if (registration.active) {
        registration.active.postMessage({
          type: 'FIREBASE_CONFIG',
          config: {
            apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
            authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
            projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
            storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
            messagingSenderId: import.meta.env
              .VITE_FIREBASE_MESSAGING_SENDER_ID,
            appId: import.meta.env.VITE_FIREBASE_APP_ID,
          },
        });
      }
    } catch (error) {
      console.error('Failed to send Firebase config to service worker:', error);
    }
  };

  // Load push tokens on mount and register if notifications already granted
  useEffect(() => {
    void fetchPushTokens();

    // Initialize Firebase if configured
    if (isFirebaseConfigured()) {
      void initializeFirebase();
      void sendFirebaseConfigToServiceWorker();

      // Set up foreground message handler
      const unsubscribe = onForegroundMessage((payload) => {
        // Show notification manually for foreground messages
        if (payload.notification) {
          new Notification(payload.notification.title || 'New Email', {
            body: payload.notification.body,
            icon: '/icon-192x192.svg',
          });
        }
      });

      // Cleanup on unmount
      return () => {
        if (unsubscribe) {
          unsubscribe();
        }
      };
    }

    // If notifications are already granted, ensure browser is registered
    if ('Notification' in window && Notification.permission === 'granted') {
      const existingToken = localStorage.getItem('web-push-token');
      if (!existingToken || existingToken.startsWith('web-')) {
        // Register with FCM token if possible
        void registerWebPushToken();
      }
    }
  }, []);

  // Browser and platform detection
  const browser = useMemo(() => detectBrowser(), []);
  const isIOS = useMemo(() => isIOSSafari(), []);
  const isMac = useMemo(() => isMacOS(), []);

  const handleDetailLevelChange = (level: NotificationDetailLevel) => {
    setDetailLevel(level);
    setNotificationDetailLevel(level);
    toast.success(
      level === 'full'
        ? 'Notifications will now show email details'
        : 'Notifications will show minimal information',
    );
  };

  // Check if mailto handler is registered
  const checkMailtoHandler = () => {
    try {
      if ('navigator' in window && 'registerProtocolHandler' in navigator) {
        // There's no direct way to check if a protocol handler is registered,
        // so we store it in localStorage when we register it
        const registered =
          localStorage.getItem('mailto-handler-registered') === 'true';
        return registered;
      }
    } catch (err) {
      console.error('Error checking mailto handler:', err);
    }
    return false;
  };

  useEffect(() => {
    // Check PWA status
    const checkStatus = async () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as NavigatorStandalone).standalone === true;

      const notificationPermission: NotificationPermission | 'unsupported' =
        'Notification' in window ? Notification.permission : 'unsupported';

      let serviceWorkerActive = false;
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        serviceWorkerActive = !!registration?.active;
      }

      const mailtoHandlerRegistered = checkMailtoHandler();

      setStatus({
        isInstalled: isStandalone,
        isInstallable: !!deferredPrompt,
        isStandalone,
        notificationPermission,
        serviceWorkerActive,
        mailtoHandlerRegistered,
      });
    };

    void checkStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setStatus((prev) => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setStatus((prev) => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
      }));
      toast.success('App installed successfully!');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        toast.success('App installation started!');
      }
      setDeferredPrompt(null);
    } catch (err) {
      console.error('Install error:', err);
      toast.error('Failed to install app');
    }
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications are not supported in this browser');
      return;
    }

    setRequestingPermission(true);
    try {
      const permission = await Notification.requestPermission();
      setStatus((prev) => ({ ...prev, notificationPermission: permission }));

      if (permission === 'granted') {
        toast.success('Notifications enabled!');
        // Show a test notification
        new Notification('Notifications Enabled', {
          body: 'You will now receive notifications for new emails.',
          icon: '/icon-192x192.svg',
        });
        // Register this browser as a push device
        await registerWebPushToken();
      } else if (permission === 'denied') {
        toast.error(
          'Notifications blocked. Please enable them in your browser settings.',
        );
      }
    } catch (err) {
      console.error('Notification permission error:', err);
      toast.error('Failed to request notification permission');
    } finally {
      setRequestingPermission(false);
    }
  };

  const handleRegisterMailtoHandler = () => {
    setRegisteringMailto(true);
    try {
      if ('registerProtocolHandler' in navigator) {
        const composeUrl = `${window.location.origin}/compose?mailto=%s`;
        navigator.registerProtocolHandler('mailto', composeUrl);
        localStorage.setItem('mailto-handler-registered', 'true');
        setStatus((prev) => ({ ...prev, mailtoHandlerRegistered: true }));
        toast.success('SuperMail registered as mailto handler!');
      } else {
        toast.error(
          'Protocol handler registration not supported in this browser',
        );
      }
    } catch (err) {
      console.error('Failed to register mailto handler:', err);
      toast.error(
        'Failed to register mailto handler. Try again or check browser permissions.',
      );
    } finally {
      setRegisteringMailto(false);
    }
  };

  const renderPermissionBadge = () => {
    switch (status.notificationPermission) {
      case 'granted':
        return (
          <Badge bg="success">
            <FontAwesomeIcon icon={faCheck} className="me-1" />
            Enabled
          </Badge>
        );
      case 'denied':
        return (
          <Badge bg="danger">
            <FontAwesomeIcon icon={faTimes} className="me-1" />
            Blocked
          </Badge>
        );
      case 'default':
        return (
          <Badge bg="warning" text="dark">
            <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
            Not Set
          </Badge>
        );
      case 'unsupported':
        return (
          <Badge bg="secondary">
            <FontAwesomeIcon icon={faTimes} className="me-1" />
            Not Supported
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <StatusCard className="card">
        <Card.Header>
          <FontAwesomeIcon icon={faBell} className="me-2" />
          Notification & PWA Status
        </Card.Header>
        <ListGroup variant="flush">
          <StatusItem className="list-group-item">
            <StatusLabel>
              <FontAwesomeIcon icon={faBell} />
              <span>Push Notifications</span>
            </StatusLabel>
            <StatusValue>
              {renderPermissionBadge()}
              {status.notificationPermission === 'default' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRequestNotificationPermission}
                  disabled={requestingPermission}
                >
                  {requestingPermission ? 'Requesting...' : 'Enable'}
                </Button>
              )}
              {status.notificationPermission === 'granted' && (
                <Button
                  variant="outline-secondary"
                  size="sm"
                  onClick={() => {
                    toast.error(
                      'To disable notifications, use your browser settings. Click the lock icon in the address bar.',
                    );
                  }}
                  title="Disable notifications via browser settings"
                >
                  Disable
                </Button>
              )}
            </StatusValue>
          </StatusItem>

          <StatusItem className="list-group-item">
            <StatusLabel>
              <FontAwesomeIcon icon={faMobileAlt} />
              <span>PWA Installation</span>
            </StatusLabel>
            <StatusValue>
              {status.isStandalone ? (
                <Badge bg="success">
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                  Installed
                </Badge>
              ) : status.isInstallable ? (
                <Button variant="primary" size="sm" onClick={handleInstall}>
                  Install App
                </Button>
              ) : (
                <Badge bg="secondary">
                  <FontAwesomeIcon icon={faInfoCircle} className="me-1" />
                  Not Available
                </Badge>
              )}
            </StatusValue>
          </StatusItem>

          <StatusItem className="list-group-item">
            <StatusLabel>
              <FontAwesomeIcon icon={faDesktop} />
              <span>Service Worker</span>
            </StatusLabel>
            <StatusValue>
              {status.serviceWorkerActive ? (
                <Badge bg="success">
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                  Active
                </Badge>
              ) : (
                <Badge bg="secondary">
                  <FontAwesomeIcon icon={faTimes} className="me-1" />
                  Inactive
                </Badge>
              )}
            </StatusValue>
          </StatusItem>

          <StatusItem className="list-group-item">
            <StatusLabel>
              <FontAwesomeIcon icon={faEnvelope} />
              <span>Mailto Links Handler</span>
            </StatusLabel>
            <StatusValue>
              {status.mailtoHandlerRegistered ? (
                <Badge bg="success">
                  <FontAwesomeIcon icon={faCheck} className="me-1" />
                  Registered
                </Badge>
              ) : (
                <>
                  <Badge bg="secondary">
                    <FontAwesomeIcon icon={faTimes} className="me-1" />
                    Not Registered
                  </Badge>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleRegisterMailtoHandler}
                    disabled={registeringMailto}
                    className="ms-2"
                  >
                    {registeringMailto ? 'Registering...' : 'Register'}
                  </Button>
                </>
              )}
            </StatusValue>
          </StatusItem>
        </ListGroup>
      </StatusCard>

      {/* Notification Detail Level Setting */}
      {status.notificationPermission === 'granted' && (
        <Card className="mb-3">
          <Card.Header>
            <FontAwesomeIcon icon={faBell} className="me-2" />
            Notification Details
          </Card.Header>
          <Card.Body>
            <Form.Group>
              <Form.Label>
                Choose how much detail to show in notifications
              </Form.Label>
              <div>
                <Form.Check
                  type="radio"
                  id="notification-minimal"
                  name="notificationDetail"
                  label={
                    <span>
                      <strong>Minimal</strong> — "You have 1 new email"
                    </span>
                  }
                  checked={notificationDetailLevel === 'minimal'}
                  onChange={() => handleDetailLevelChange('minimal')}
                />
                <Form.Check
                  type="radio"
                  id="notification-full"
                  name="notificationDetail"
                  label={
                    <span>
                      <strong>Full Details</strong> — Shows sender name and
                      subject line
                    </span>
                  }
                  checked={notificationDetailLevel === 'full'}
                  onChange={() => handleDetailLevelChange('full')}
                  className="mt-2"
                />
              </div>
              <Form.Text className="text-muted mt-2">
                Note: Full details only shows for individual emails. Bulk email
                notifications always show counts.
              </Form.Text>
            </Form.Group>
          </Card.Body>
        </Card>
      )}

      {status.notificationPermission === 'denied' && (
        <Alert variant="warning">
          <FontAwesomeIcon icon={faBellSlash} className="me-2" />
          <strong>Notifications are blocked.</strong> To enable them:
          <ol className="mb-0 mt-2">
            {browser === 'chrome' && (
              <>
                <li>Click the lock icon (🔒) in the address bar</li>
                <li>Click "Site settings"</li>
                <li>Find "Notifications" and change to "Allow"</li>
                <li>Refresh this page</li>
              </>
            )}
            {browser === 'edge' && (
              <>
                <li>Click the lock icon in the address bar</li>
                <li>Find "Notifications" in the dropdown</li>
                <li>Change the setting to "Allow"</li>
                <li>Refresh this page</li>
              </>
            )}
            {browser === 'firefox' && (
              <>
                <li>Click the info icon (ⓘ) in the address bar</li>
                <li>Click "Connection secure" → "More Information"</li>
                <li>Go to "Permissions" tab → Find "Send Notifications"</li>
                <li>Uncheck "Use Default" and select "Allow"</li>
                <li>Refresh this page</li>
              </>
            )}
            {browser === 'safari' && (
              <>
                <li>Open Safari → Settings → Websites → Notifications</li>
                <li>Find this site and change to "Allow"</li>
                <li>Refresh this page</li>
              </>
            )}
            {browser === 'other' && (
              <>
                <li>Click the lock/info icon in your browser's address bar</li>
                <li>Find "Notifications" in the permissions list</li>
                <li>Change the setting to "Allow"</li>
                <li>Refresh this page</li>
              </>
            )}
          </ol>
        </Alert>
      )}

      {!status.isStandalone && !status.isInstallable && (
        <Alert variant="info">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          <strong>Install as an App:</strong> You can install this email client
          as a standalone app on your device.
          <br />
          <small className="text-muted mt-2 d-block">
            {browser === 'chrome' && (
              <>
                Click the install icon (⊕) in the address bar, or Menu (⋮) →
                "Install SuperMail..."
              </>
            )}
            {browser === 'edge' && (
              <>
                Click the install icon in the address bar, or Menu (···) → Apps
                → "Install SuperMail"
              </>
            )}
            {browser === 'firefox' && (
              <>
                Firefox does not support PWA installation natively. You can use
                the{' '}
                <a
                  href="https://addons.mozilla.org/en-US/firefox/addon/pwas-for-firefox/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  PWAs for Firefox
                </a>{' '}
                extension, or bookmark this page for quick access.
              </>
            )}
            {browser === 'safari' && isIOS && (
              <>Tap the Share button (⬆) → "Add to Home Screen"</>
            )}
            {browser === 'safari' && isMac && (
              <>File → "Add to Dock" (macOS Sonoma 14+)</>
            )}
            {browser === 'other' && (
              <>
                Look for the install button in your browser's address bar or
                menu.
              </>
            )}
          </small>
        </Alert>
      )}

      <Card>
        <Card.Header>About Notifications</Card.Header>
        <Card.Body>
          <p className="text-muted mb-0">
            When enabled, you'll receive browser notifications for new emails
            even when the app is running in the background. The app polls for
            new emails every minute.
          </p>
        </Card.Body>
      </Card>

      {/* Connected Devices Section */}
      <Card className="mt-3">
        <Card.Header className="d-flex justify-content-between align-items-center">
          <span>
            <FontAwesomeIcon icon={faMobileAlt} className="me-2" />
            Connected Devices
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => void fetchPushTokens()}
            disabled={loadingTokens}
          >
            {loadingTokens ? (
              <Spinner animation="border" size="sm" />
            ) : (
              'Refresh'
            )}
          </Button>
        </Card.Header>
        <Card.Body>
          {loadingTokens ? (
            <div className="text-center py-3">
              <Spinner animation="border" size="sm" className="me-2" />
              Loading devices...
            </div>
          ) : pushTokens.length === 0 ? (
            <p className="text-muted mb-0">
              No mobile devices connected. Install the SuperMail mobile app to
              receive push notifications on your phone.
            </p>
          ) : (
            <ListGroup variant="flush">
              {pushTokens.map((token) => (
                <ListGroup.Item
                  key={token.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <FontAwesomeIcon
                      icon={
                        token.platform === 'IOS'
                          ? fabApple
                          : token.platform === 'ANDROID'
                            ? fabAndroid
                            : faGlobe
                      }
                      className="me-2"
                    />
                    <strong>
                      {token.deviceName ||
                        (token.platform === 'IOS'
                          ? 'iPhone/iPad'
                          : token.platform === 'ANDROID'
                            ? 'Android Device'
                            : 'Web Browser')}
                    </strong>
                    <br />
                    <small className="text-muted">
                      Added {new Date(token.createdAt).toLocaleDateString()}
                      {token.lastUsedAt && (
                        <>
                          {' '}
                          • Last used{' '}
                          {new Date(token.lastUsedAt).toLocaleDateString()}
                        </>
                      )}
                    </small>
                  </div>
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => handleRemoveToken(token.token)}
                    disabled={removingToken === token.token}
                  >
                    {removingToken === token.token ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      <FontAwesomeIcon icon={faTrash} />
                    )}
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          )}
          <p className="text-muted small mt-3 mb-0">
            These are devices that can receive push notifications when new
            emails arrive. Remove devices you no longer use to stop sending
            notifications to them.
          </p>
        </Card.Body>
      </Card>
    </>
  );
}
