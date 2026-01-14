import { Card, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPalette,
  faSun,
  faMoon,
  faDesktop,
  faList,
  faLayerGroup,
  faGripLines,
  faBars,
  faCalendarAlt,
  faCalendar,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuth } from '../../../contexts/AuthContext';
import type { ThemePreference } from '../../../core/theme';
import {
  SettingsContainer,
  ThemeCard,
  OptionsContainer,
  ThemeOption,
  ThemeIcon,
  ThemeLabel,
  ThemeName,
  ThemeDescription,
  PreviewSection,
  ColorSwatch,
  ColorGrid,
  SectionLabel,
  SectionContainer,
} from './ThemeSettings.wrappers';

const themeOptions: {
  id: ThemePreference;
  name: string;
  description: string;
  icon: typeof faSun;
}[] = [
  {
    id: 'LIGHT',
    name: 'Light',
    description: 'A clean, bright theme for daytime use',
    icon: faSun,
  },
  {
    id: 'DARK',
    name: 'Dark',
    description: 'Easy on the eyes in low-light environments',
    icon: faMoon,
  },
  {
    id: 'AUTO',
    name: 'System',
    description: 'Automatically match your device settings',
    icon: faDesktop,
  },
];

const densityOptions: {
  id: 'spacious' | 'dense';
  name: string;
  description: string;
  icon: typeof faGripLines;
}[] = [
  {
    id: 'spacious',
    name: 'Spacious',
    description: 'Shows more information per email with space between items',
    icon: faGripLines,
  },
  {
    id: 'dense',
    name: 'Dense',
    description: 'Shows more emails per screen with tightly packed items',
    icon: faBars,
  },
];

const groupByDateOptions: {
  id: 'enabled' | 'disabled';
  name: string;
  description: string;
  icon: typeof faLayerGroup;
}[] = [
  {
    id: 'enabled',
    name: 'Enabled',
    description: 'Group emails by recency (Today, Yesterday, etc.)',
    icon: faLayerGroup,
  },
  {
    id: 'disabled',
    name: 'Disabled',
    description: 'Show emails in chronological order without grouping',
    icon: faCalendar,
  },
];

export function ThemeSettings() {
  const { themePreference, setThemePreference, theme, isDarkMode } = useTheme();
  const { user, updatePreferences } = useAuth();

  const handleThemeChange = (preference: ThemePreference) => {
    setThemePreference(preference);
    toast.success(`Theme set to ${preference.toLowerCase()}`);
  };

  const handleInboxDensityChange = async (dense: boolean) => {
    try {
      await updatePreferences({ inboxDensity: dense });
      toast.success(`Inbox density set to ${dense ? 'dense' : 'spacious'}`);
    } catch (error) {
      toast.error('Failed to update inbox density preference');
    }
  };

  const handleInboxGroupByDateChange = async (groupByDate: boolean) => {
    try {
      await updatePreferences({ inboxGroupByDate: groupByDate });
      toast.success(`Group by date ${groupByDate ? 'enabled' : 'disabled'}`);
    } catch (error) {
      toast.error('Failed to update group by date preference');
    }
  };

  return (
    <SettingsContainer>
      <ThemeCard>
        <Card.Header>
          <FontAwesomeIcon icon={faPalette} className="me-2" />
          Appearance
        </Card.Header>
        <Card.Body>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            Choose how StacksMail looks to you. Select a theme preference below.
          </p>

          <Form>
            <OptionsContainer>
              {themeOptions.map((option) => (
                <ThemeOption
                  key={option.id}
                  $selected={themePreference === option.id}
                  onClick={() => handleThemeChange(option.id)}
                >
                  <ThemeIcon $selected={themePreference === option.id}>
                    <FontAwesomeIcon icon={option.icon} />
                  </ThemeIcon>
                  <ThemeLabel>
                    <ThemeName>{option.name}</ThemeName>
                    <ThemeDescription>{option.description}</ThemeDescription>
                  </ThemeLabel>
                  <Form.Check
                    type="radio"
                    name="themePreference"
                    checked={themePreference === option.id}
                    onChange={() => handleThemeChange(option.id)}
                    className="ms-auto"
                  />
                </ThemeOption>
              ))}
            </OptionsContainer>
          </Form>
        </Card.Body>
      </ThemeCard>

      <PreviewSection>
        <Card.Header>Current Theme Preview</Card.Header>
        <Card.Body>
          <p className="text-muted" style={{ marginBottom: '0.75rem' }}>
            Currently using: <strong>{isDarkMode ? 'Dark' : 'Light'}</strong>{' '}
            mode
            {themePreference === 'AUTO' && ' (following system preference)'}
          </p>
          <ColorGrid>
            <ColorSwatch $color={theme.colors.primary} title="Primary">
              <span>Primary</span>
            </ColorSwatch>
            <ColorSwatch $color={theme.colors.secondary} title="Secondary">
              <span>Secondary</span>
            </ColorSwatch>
            <ColorSwatch $color={theme.colors.background} title="Background">
              <span>Background</span>
            </ColorSwatch>
            <ColorSwatch
              $color={theme.colors.backgroundWhite}
              title="Surface"
            >
              <span>Surface</span>
            </ColorSwatch>
            <ColorSwatch $color={theme.colors.success} title="Success">
              <span>Success</span>
            </ColorSwatch>
            <ColorSwatch $color={theme.colors.warning} title="Warning">
              <span>Warning</span>
            </ColorSwatch>
            <ColorSwatch $color={theme.colors.danger} title="Danger">
              <span>Danger</span>
            </ColorSwatch>
            <ColorSwatch $color={theme.colors.info} title="Info">
              <span>Info</span>
            </ColorSwatch>
          </ColorGrid>
        </Card.Body>
      </PreviewSection>

      <ThemeCard>
        <Card.Header>
          <FontAwesomeIcon icon={faList} className="me-2" />
          Inbox Display Preferences
        </Card.Header>
        <Card.Body>
          <p className="text-muted" style={{ marginBottom: '1rem' }}>
            Customize how your inbox is displayed. These settings apply to both
            the inbox and triage views.
          </p>

          <Form>
            <SectionContainer>
              <div>
                <SectionLabel>List Density</SectionLabel>
                <OptionsContainer>
                  {densityOptions.map((option) => {
                    const isSelected =
                      option.id === 'dense'
                        ? user?.inboxDensity ?? false
                        : !(user?.inboxDensity ?? false);
                    return (
                      <ThemeOption
                        key={option.id}
                        $selected={isSelected}
                        onClick={() =>
                          handleInboxDensityChange(option.id === 'dense')
                        }
                      >
                        <ThemeIcon $selected={isSelected}>
                          <FontAwesomeIcon icon={option.icon} />
                        </ThemeIcon>
                        <ThemeLabel>
                          <ThemeName>{option.name}</ThemeName>
                          <ThemeDescription>{option.description}</ThemeDescription>
                        </ThemeLabel>
                        <Form.Check
                          type="radio"
                          name="inboxDensity"
                          checked={isSelected}
                          onChange={() =>
                            handleInboxDensityChange(option.id === 'dense')
                          }
                          className="ms-auto"
                        />
                      </ThemeOption>
                    );
                  })}
                </OptionsContainer>
              </div>

              <div>
                <SectionLabel>Group by Date</SectionLabel>
                <OptionsContainer>
                  {groupByDateOptions.map((option) => {
                    const isSelected =
                      option.id === 'enabled'
                        ? user?.inboxGroupByDate ?? false
                        : !(user?.inboxGroupByDate ?? false);
                    return (
                      <ThemeOption
                        key={option.id}
                        $selected={isSelected}
                        onClick={() =>
                          handleInboxGroupByDateChange(option.id === 'enabled')
                        }
                      >
                        <ThemeIcon $selected={isSelected}>
                          <FontAwesomeIcon icon={option.icon} />
                        </ThemeIcon>
                        <ThemeLabel>
                          <ThemeName>{option.name}</ThemeName>
                          <ThemeDescription>{option.description}</ThemeDescription>
                        </ThemeLabel>
                        <Form.Check
                          type="radio"
                          name="inboxGroupByDate"
                          checked={isSelected}
                          onChange={() =>
                            handleInboxGroupByDateChange(option.id === 'enabled')
                          }
                          className="ms-auto"
                        />
                      </ThemeOption>
                    );
                  })}
                </OptionsContainer>
              </div>
            </SectionContainer>
          </Form>
        </Card.Body>
      </ThemeCard>
    </SettingsContainer>
  );
}
