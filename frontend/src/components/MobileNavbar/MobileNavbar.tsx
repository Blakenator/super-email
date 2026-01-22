import { useCallback } from 'react';
import { Badge, Dropdown } from 'react-bootstrap';
import { useLocation, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInbox,
  faStar,
  faPaperPlane,
  faFileAlt,
  faTrash,
  faEnvelope,
  faAddressBook,
  faArchive,
  faBars,
  faPen,
  faSignOutAlt,
  faPalette,
  faBell,
  faTag,
  faFilter,
  faShieldAlt,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { EmailFolder } from '../../__generated__/graphql';
import {
  MobileNavbarContainer,
  MobileLogo,
  MobileNavActions,
  MobileNavDropdown,
  MobileNavMenu,
  MobileNavItem,
  MobileNavDivider,
  MobileUserSection,
  MobileUserAvatar,
  MobileUserInfo,
  MobileUserName,
  MobileUserEmail,
  ComposeButtonMobile,
} from './MobileNavbar.wrappers';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface MobileNavbarProps {
  user: User | null;
  unreadCount: number;
  onLogout: () => void;
}

const navItems: {
  path: string;
  label: string;
  icon: IconDefinition;
  folder: EmailFolder | undefined;
  showBadge?: boolean;
}[] = [
  {
    path: '/inbox',
    label: 'Inbox',
    icon: faInbox,
    folder: EmailFolder.Inbox,
    showBadge: true,
  },
  { path: '/starred', label: 'Starred', icon: faStar, folder: undefined },
  {
    path: '/sent',
    label: 'Sent',
    icon: faPaperPlane,
    folder: EmailFolder.Sent,
  },
  {
    path: '/drafts',
    label: 'Drafts',
    icon: faFileAlt,
    folder: EmailFolder.Drafts,
  },
  {
    path: '/trash',
    label: 'Trash',
    icon: faTrash,
    folder: EmailFolder.Trash,
  },
  {
    path: '/archive',
    label: 'Archive',
    icon: faArchive,
    folder: EmailFolder.Archive,
  },
];

export function MobileNavbar({ user, unreadCount, onLogout }: MobileNavbarProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const isPathActive = useCallback(
    (basePath: string) => {
      return (
        location.pathname === basePath ||
        location.pathname.startsWith(`${basePath}/`)
      );
    },
    [location.pathname],
  );

  const handleNavigate = (path: string) => {
    void navigate(path);
  };

  return (
    <MobileNavbarContainer>
      <MobileLogo>
        <FontAwesomeIcon icon={faEnvelope} />
        StacksMail
      </MobileLogo>

      <MobileNavActions>
        <ComposeButtonMobile onClick={() => navigate('/compose')}>
          <FontAwesomeIcon icon={faPen} />
        </ComposeButtonMobile>

        <MobileNavDropdown>
          <Dropdown.Toggle id="mobile-nav-dropdown">
            <FontAwesomeIcon icon={faBars} size="lg" />
          </Dropdown.Toggle>

          <MobileNavMenu align="end">
            {user && (
              <>
                <MobileUserSection>
                  <MobileUserAvatar>
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </MobileUserAvatar>
                  <MobileUserInfo>
                    <MobileUserName>
                      {user.firstName} {user.lastName}
                    </MobileUserName>
                    <MobileUserEmail>{user.email}</MobileUserEmail>
                  </MobileUserInfo>
                </MobileUserSection>
              </>
            )}

            {navItems.map((item) => (
              <MobileNavItem
                key={item.path}
                $active={isPathActive(item.path)}
                onClick={() => handleNavigate(item.path)}
              >
                <FontAwesomeIcon icon={item.icon} />
                {item.label}
                {item.showBadge && unreadCount > 0 && (
                  <Badge bg="secondary" pill>
                    {unreadCount}
                  </Badge>
                )}
              </MobileNavItem>
            ))}

            <MobileNavDivider />

            <MobileNavItem
              $active={isPathActive('/contacts')}
              onClick={() => handleNavigate('/contacts')}
            >
              <FontAwesomeIcon icon={faAddressBook} />
              Contacts
            </MobileNavItem>

            <MobileNavDivider />

            <MobileNavItem onClick={() => handleNavigate('/settings/accounts')}>
              <FontAwesomeIcon icon={faInbox} />
              Email Accounts
            </MobileNavItem>
            <MobileNavItem onClick={() => handleNavigate('/settings/smtp')}>
              <FontAwesomeIcon icon={faPaperPlane} />
              SMTP Profiles
            </MobileNavItem>
            <MobileNavItem onClick={() => handleNavigate('/settings/tags')}>
              <FontAwesomeIcon icon={faTag} />
              Tags
            </MobileNavItem>
            <MobileNavItem onClick={() => handleNavigate('/settings/rules')}>
              <FontAwesomeIcon icon={faFilter} />
              Mail Rules
            </MobileNavItem>
            <MobileNavItem onClick={() => handleNavigate('/settings/appearance')}>
              <FontAwesomeIcon icon={faPalette} />
              Appearance
            </MobileNavItem>
            <MobileNavItem onClick={() => handleNavigate('/settings/notifications')}>
              <FontAwesomeIcon icon={faBell} />
              Notifications
            </MobileNavItem>
            <MobileNavItem onClick={() => handleNavigate('/settings/auth')}>
              <FontAwesomeIcon icon={faShieldAlt} />
              Login Methods
            </MobileNavItem>
            <MobileNavItem onClick={() => handleNavigate('/settings/billing')}>
              <FontAwesomeIcon icon={faCreditCard} />
              Billing
            </MobileNavItem>

            <MobileNavDivider />

            <MobileNavItem onClick={onLogout} style={{ color: 'var(--bs-danger)' }}>
              <FontAwesomeIcon icon={faSignOutAlt} />
              Sign Out
            </MobileNavItem>
          </MobileNavMenu>
        </MobileNavDropdown>
      </MobileNavActions>
    </MobileNavbarContainer>
  );
}
