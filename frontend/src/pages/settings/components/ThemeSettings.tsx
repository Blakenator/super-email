import { Card, Form } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPalette,
  faSun,
  faMoon,
  faDesktop,
} from '@fortawesome/free-solid-svg-icons';
import toast from 'react-hot-toast';
import { useTheme } from '../../../contexts/ThemeContext';
import type { ThemePreference } from '../../../core/theme';
import {
  ThemeCard,
  ThemeOption,
  ThemeIcon,
  ThemeLabel,
  ThemeName,
  ThemeDescription,
  PreviewSection,
  ColorSwatch,
  ColorGrid,
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

export function ThemeSettings() {
  const { themePreference, setThemePreference, theme, isDarkMode } = useTheme();

  const handleThemeChange = (preference: ThemePreference) => {
    setThemePreference(preference);
    toast.success(`Theme set to ${preference.toLowerCase()}`);
  };

  return (
    <>
      <ThemeCard>
        <Card.Header>
          <FontAwesomeIcon icon={faPalette} className="me-2" />
          Appearance
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-4">
            Choose how StacksMail looks to you. Select a theme preference below.
          </p>

          <Form>
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
          </Form>
        </Card.Body>
      </ThemeCard>

      <PreviewSection>
        <Card.Header>Current Theme Preview</Card.Header>
        <Card.Body>
          <p className="text-muted mb-3">
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
    </>
  );
}
