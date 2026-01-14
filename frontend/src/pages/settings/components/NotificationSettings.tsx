import { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, ListGroup, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBell,
  faBellSlash,
  faCheck,
  faTimes,
  faMobileAlt,
  faDesktop,
  faInfoCircle,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
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

interface PWAStatus {
  isInstalled: boolean;
  isInstallable: boolean;
  isStandalone: boolean;
  notificationPermission: NotificationPermission | 'unsupported';
  serviceWorkerActive: boolean;
}

export function NotificationSettings() {
  const [status, setStatus] = useState<PWAStatus>({
    isInstalled: false,
    isInstallable: false,
    isStandalone: false,
    notificationPermission: 'unsupported',
    serviceWorkerActive: false,
  });
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [requestingPermission, setRequestingPermission] = useState(false);
  const [notificationDetailLevel, setDetailLevel] =
    useState<NotificationDetailLevel>(getNotificationDetailLevel());

  const handleDetailLevelChange = (level: NotificationDetailLevel) => {
    setDetailLevel(level);
    setNotificationDetailLevel(level);
    toast.success(
      level === 'full'
        ? 'Notifications will now show email details'
        : 'Notifications will show minimal information',
    );
  };

  useEffect(() => {
    // Check PWA status
    const checkStatus = async () => {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true;

      const notificationPermission: NotificationPermission | 'unsupported' =
        'Notification' in window ? Notification.permission : 'unsupported';

      let serviceWorkerActive = false;
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        serviceWorkerActive = !!registration?.active;
      }

      setStatus({
        isInstalled: isStandalone,
        isInstallable: !!deferredPrompt,
        isStandalone,
        notificationPermission,
        serviceWorkerActive,
      });
    };

    checkStatus();

    // Listen for beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setStatus((prev) => ({ ...prev, isInstallable: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

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
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
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
      <StatusCard>
        <Card.Header>
          <FontAwesomeIcon icon={faBell} className="me-2" />
          Notification & PWA Status
        </Card.Header>
        <ListGroup variant="flush">
          <StatusItem>
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

          <StatusItem>
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

          <StatusItem>
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
            <li>Click the lock/info icon in your browser's address bar</li>
            <li>Find "Notifications" in the permissions list</li>
            <li>Change the setting to "Allow"</li>
            <li>Refresh this page</li>
          </ol>
        </Alert>
      )}

      {!status.isStandalone && !status.isInstallable && (
        <Alert variant="info">
          <FontAwesomeIcon icon={faInfoCircle} className="me-2" />
          <strong>Install as an App:</strong> You can install this email client
          as a standalone app on your device. Look for the install button in
          your browser's address bar or menu.
          <br />
          <small className="text-muted mt-2 d-block">
            <strong>Chrome/Edge:</strong> Click the install icon (⊕) in the
            address bar, or Menu (⋮) → "Install StacksMail..."
            <br />
            <strong>Firefox:</strong> Firefox does not support PWA installation
            natively. You can use the{' '}
            <a
              href="https://addons.mozilla.org/en-US/firefox/addon/pwas-for-firefox/"
              target="_blank"
              rel="noopener noreferrer"
            >
              PWAs for Firefox
            </a>{' '}
            extension, or bookmark this page for quick access.
            <br />
            <strong>Safari (iOS):</strong> Tap the Share button (⬆) → "Add to
            Home Screen"
            <br />
            <strong>Safari (macOS):</strong> File → "Add to Dock" (macOS Sonoma
            14+)
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
    </>
  );
}
