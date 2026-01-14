import { useState, useEffect, ReactNode } from 'react';
import styled from 'styled-components';
import { Tabs, Tab, Nav, Dropdown } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core';

interface TabItem {
  key: string;
  title: string;
  icon?: IconDefinition;
  content: ReactNode;
}

interface ResponsiveTabsProps {
  tabs: TabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  className?: string;
}

type ViewMode = 'horizontal' | 'vertical' | 'dropdown';

const BREAKPOINTS = {
  mobile: 576,
  tablet: 992,
};

const TabsContainer = styled.div`
  display: flex;
  flex-direction: column;
`;

const HorizontalTabsWrapper = styled.div`
  .nav-tabs {
    border-bottom: 1px solid ${({ theme }) => theme.colors.border};
    margin-bottom: ${({ theme }) => theme.spacing.lg};
    flex-wrap: wrap;
  }

  .nav-link {
    color: ${({ theme }) => theme.colors.textSecondary};
    border: none;
    padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
    margin-bottom: -1px;
    
    &:hover {
      color: ${({ theme }) => theme.colors.primary};
      border-color: transparent;
    }
    
    &.active {
      color: ${({ theme }) => theme.colors.primary};
      background: transparent;
      border-bottom: 2px solid ${({ theme }) => theme.colors.primary};
    }
  }
`;

const VerticalLayout = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.lg};
`;

const VerticalNavWrapper = styled.div`
  width: 200px;
  flex-shrink: 0;
`;

const VerticalNav = styled(Nav)`
  flex-direction: column;
  border-right: 1px solid ${({ theme }) => theme.colors.border};
  padding-right: ${({ theme }) => theme.spacing.md};
`;

const VerticalNavLink = styled(Nav.Link)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textSecondary)};
  background: ${({ $active, theme }) => ($active ? `${theme.colors.primary}15` : 'transparent')};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  margin-bottom: ${({ theme }) => theme.spacing.xs};
  transition: all 0.15s ease;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

const VerticalContent = styled.div`
  flex: 1;
  min-width: 0;
`;

const DropdownWrapper = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.md};
`;

const DropdownToggleButton = styled(Dropdown.Toggle)`
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
  background: ${({ theme }) => theme.colors.backgroundWhite};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.textPrimary};
  border-radius: ${({ theme }) => theme.borderRadius.md};

  &:hover, &:focus, &:active {
    background: ${({ theme }) => theme.colors.backgroundHover};
    border-color: ${({ theme }) => theme.colors.primary};
    color: ${({ theme }) => theme.colors.textPrimary};
  }

  &::after {
    display: none;
  }
`;

const DropdownMenu = styled(Dropdown.Menu)`
  width: 100%;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  box-shadow: ${({ theme }) => theme.shadows.md};
`;

const DropdownItem = styled(Dropdown.Item)<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
  padding: ${({ theme }) => theme.spacing.sm} ${({ theme }) => theme.spacing.md};
  color: ${({ $active, theme }) => ($active ? theme.colors.primary : theme.colors.textPrimary)};
  background: ${({ $active, theme }) => ($active ? `${theme.colors.primary}10` : 'transparent')};

  &:hover {
    background: ${({ theme }) => theme.colors.backgroundHover};
  }
`;

const TabIcon = styled.span`
  display: inline-flex;
  width: 20px;
  justify-content: center;
`;

export function ResponsiveTabs({
  tabs,
  activeKey,
  onSelect,
  className,
}: ResponsiveTabsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('horizontal');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < BREAKPOINTS.mobile) {
        setViewMode('dropdown');
      } else if (width < BREAKPOINTS.tablet) {
        setViewMode('vertical');
      } else {
        setViewMode('horizontal');
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const activeTab = tabs.find((t) => t.key === activeKey) || tabs[0];
  const activeContent = activeTab?.content;

  if (viewMode === 'dropdown') {
    return (
      <TabsContainer className={className}>
        <DropdownWrapper>
          <Dropdown>
            <DropdownToggleButton variant="outline-secondary">
              <span>
                {activeTab?.icon && (
                  <TabIcon>
                    <FontAwesomeIcon icon={activeTab.icon} />
                  </TabIcon>
                )}
                {activeTab?.title}
              </span>
              <FontAwesomeIcon icon={faChevronDown} />
            </DropdownToggleButton>
            <DropdownMenu>
              {tabs.map((tab) => (
                <DropdownItem
                  key={tab.key}
                  $active={tab.key === activeKey}
                  onClick={() => onSelect(tab.key)}
                >
                  {tab.icon && (
                    <TabIcon>
                      <FontAwesomeIcon icon={tab.icon} />
                    </TabIcon>
                  )}
                  {tab.title}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </Dropdown>
        </DropdownWrapper>
        {activeContent}
      </TabsContainer>
    );
  }

  if (viewMode === 'vertical') {
    return (
      <VerticalLayout className={className}>
        <VerticalNavWrapper>
          <VerticalNav>
            {tabs.map((tab) => (
              <VerticalNavLink
                key={tab.key}
                $active={tab.key === activeKey}
                onClick={() => onSelect(tab.key)}
              >
                {tab.icon && (
                  <TabIcon>
                    <FontAwesomeIcon icon={tab.icon} />
                  </TabIcon>
                )}
                {tab.title}
              </VerticalNavLink>
            ))}
          </VerticalNav>
        </VerticalNavWrapper>
        <VerticalContent>{activeContent}</VerticalContent>
      </VerticalLayout>
    );
  }

  // Horizontal tabs (default for large screens)
  return (
    <HorizontalTabsWrapper className={className}>
      <Tabs activeKey={activeKey} onSelect={(k) => k && onSelect(k)}>
        {tabs.map((tab) => (
          <Tab
            key={tab.key}
            eventKey={tab.key}
            title={
              <>
                {tab.icon && (
                  <FontAwesomeIcon icon={tab.icon} className="me-1" />
                )}
                {tab.title}
              </>
            }
          >
            {tab.content}
          </Tab>
        ))}
      </Tabs>
    </HorizontalTabsWrapper>
  );
}
