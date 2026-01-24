import { useCallback } from 'react';
import { Nav, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { Link, useLocation, useNavigate } from 'react-router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faInbox,
  faStar,
  faPaperPlane,
  faFileAlt,
  faTrash,
  faPen,
  faEnvelope,
  faAddressBook,
  faArchive,
  faChevronLeft,
  faThumbtack,
  faSignOutAlt,
  faPalette,
  faBell,
  faTag,
  faFilter,
  faShieldAlt,
  faBolt,
  faCreditCard,
} from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';
import { EmailFolder } from '../../__generated__/graphql';
import {
  SidebarContainer,
  SidebarContent,
  Logo,
  LogoText,
  ComposeButton,
  ComposeButtonText,
  NavSection,
  StyledNavLink,
  NavIcon,
  NavLabel,
  UnreadBadge,
  SidebarFooter,
  UserDropdownToggle,
  UserAvatar,
  UserInfo,
  UserName,
  UserEmail,
  UserPopoverMenu,
  PopoverHeader,
  PopoverUserName,
  PopoverUserEmail,
  PopoverMenuItem,
  PopoverDivider,
  PopoverLogoutItem,
  CollapseHandle,
  CollapseButtonIcon,
} from './Sidebar.wrappers';
import { PortalDropdown } from './PortalDropdown';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

interface SidebarProps {
  user: User | null;
  isCollapsed: boolean;
  unreadCount: number;
  onToggleCollapse: () => void;
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

export function Sidebar({
  user,
  isCollapsed,
  unreadCount,
  onToggleCollapse,
  onLogout,
}: SidebarProps) {
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

  const renderNavLink = (
    path: string,
    label: string,
    icon: IconDefinition,
    showBadge?: boolean,
  ) => {
    const content = (
      <StyledNavLink
        as={Link}
        to={path}
        $active={isPathActive(path)}
        $collapsed={isCollapsed}
      >
        <span style={{ display: 'flex', alignItems: 'center' }}>
          <NavIcon $collapsed={isCollapsed}>
            <FontAwesomeIcon icon={icon} />
          </NavIcon>
          <NavLabel $collapsed={isCollapsed}>{label}</NavLabel>
        </span>
        {showBadge && unreadCount > 0 && (
          <UnreadBadge $collapsed={isCollapsed}>
            <Badge bg="secondary" pill>
              {unreadCount}
            </Badge>
          </UnreadBadge>
        )}
      </StyledNavLink>
    );

    if (isCollapsed) {
      return (
        <OverlayTrigger
          placement="right"
          overlay={
            <Tooltip id={`tooltip-${path}`}>
              {label}
              {showBadge && unreadCount > 0 && ` (${unreadCount})`}
            </Tooltip>
          }
        >
          {content}
        </OverlayTrigger>
      );
    }

    return content;
  };

  return (
    <SidebarContainer $collapsed={isCollapsed}>
      <SidebarContent $collapsed={isCollapsed}>
        <Logo $collapsed={isCollapsed}>
          <FontAwesomeIcon
            icon={faEnvelope}
            className={isCollapsed ? '' : 'me-2'}
          />
          <LogoText $collapsed={isCollapsed}>SuperMail</LogoText>
        </Logo>

        <ComposeButton
          $collapsed={isCollapsed}
          onClick={() => navigate('/compose')}
        >
          <FontAwesomeIcon icon={faPen} className={isCollapsed ? '' : 'me-2'} />
          <ComposeButtonText $collapsed={isCollapsed}>
            Compose
          </ComposeButtonText>
        </ComposeButton>

        <NavSection>
          <Nav className="flex-column">
            {navItems.map((item) => (
              <Nav.Item key={item.path}>
                {renderNavLink(
                  item.path,
                  item.label,
                  item.icon,
                  item.showBadge,
                )}
              </Nav.Item>
            ))}
          </Nav>

          <hr style={{ margin: isCollapsed ? '1rem 0.5rem' : '1rem' }} />

          <Nav className="flex-column">
            <Nav.Item>
              {renderNavLink('/triage', 'Inbox Triage', faBolt)}
            </Nav.Item>
            <Nav.Item>
              {renderNavLink('/contacts', 'Contacts', faAddressBook)}
            </Nav.Item>
          </Nav>
        </NavSection>

        <SidebarFooter $collapsed={isCollapsed}>
          {user && (
            <PortalDropdown
              drop="up"
              align={isCollapsed ? 'start' : 'end'}
              toggle={
                <UserDropdownToggle $collapsed={isCollapsed}>
                  <OverlayTrigger
                    placement="right"
                    container={document.body}
                    overlay={
                      isCollapsed ? (
                        <Tooltip id="user-tooltip">
                          {user.firstName} {user.lastName}
                          <br />
                          {user.email}
                        </Tooltip>
                      ) : (
                        <></>
                      )
                    }
                  >
                    <UserAvatar $collapsed={isCollapsed}>
                      {user.firstName[0]}
                      {user.lastName[0]}
                    </UserAvatar>
                  </OverlayTrigger>
                  <UserInfo $collapsed={isCollapsed}>
                    <UserName>
                      {user.firstName} {user.lastName}
                    </UserName>
                    <UserEmail>{user.email}</UserEmail>
                  </UserInfo>
                </UserDropdownToggle>
              }
            >
              <UserPopoverMenu>
                <PopoverHeader>
                  <PopoverUserName>
                    {user.firstName} {user.lastName}
                  </PopoverUserName>
                  <PopoverUserEmail>{user.email}</PopoverUserEmail>
                </PopoverHeader>

                <PopoverMenuItem onClick={() => navigate('/settings/accounts')}>
                  <FontAwesomeIcon icon={faInbox} />
                  Email Accounts
                </PopoverMenuItem>
                <PopoverMenuItem onClick={() => navigate('/settings/smtp')}>
                  <FontAwesomeIcon icon={faPaperPlane} />
                  SMTP Profiles
                </PopoverMenuItem>
                <PopoverMenuItem onClick={() => navigate('/settings/tags')}>
                  <FontAwesomeIcon icon={faTag} />
                  Tags
                </PopoverMenuItem>
                <PopoverMenuItem onClick={() => navigate('/settings/rules')}>
                  <FontAwesomeIcon icon={faFilter} />
                  Mail Rules
                </PopoverMenuItem>

                <PopoverDivider />

                <PopoverMenuItem
                  onClick={() => navigate('/settings/appearance')}
                >
                  <FontAwesomeIcon icon={faPalette} />
                  Appearance
                </PopoverMenuItem>
                <PopoverMenuItem
                  onClick={() => navigate('/settings/notifications')}
                >
                  <FontAwesomeIcon icon={faBell} />
                  Notifications
                </PopoverMenuItem>
                <PopoverMenuItem onClick={() => navigate('/settings/auth')}>
                  <FontAwesomeIcon icon={faShieldAlt} />
                  Login Methods
                </PopoverMenuItem>
                <PopoverMenuItem onClick={() => navigate('/settings/billing')}>
                  <FontAwesomeIcon icon={faCreditCard} />
                  Billing
                </PopoverMenuItem>

                <PopoverDivider />

                <PopoverLogoutItem onClick={onLogout}>
                  <FontAwesomeIcon icon={faSignOutAlt} />
                  Sign Out
                </PopoverLogoutItem>
              </UserPopoverMenu>
            </PortalDropdown>
          )}
        </SidebarFooter>
      </SidebarContent>

      <CollapseHandle onClick={onToggleCollapse} $collapsed={isCollapsed}>
        <CollapseButtonIcon $collapsed={isCollapsed}>
          <FontAwesomeIcon icon={isCollapsed ? faThumbtack : faChevronLeft} />
        </CollapseButtonIcon>
      </CollapseHandle>
    </SidebarContainer>
  );
}
