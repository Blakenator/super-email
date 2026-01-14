import styled from 'styled-components';
import { Card, Form } from 'react-bootstrap';

export const SettingsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const ThemeCard = styled(Card)`
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const OptionsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ThemeOption = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
  padding: ${({ theme }) => theme.spacing.md};
  border: 2px solid
    ${({ theme, $selected }) =>
      $selected ? theme.colors.primary : theme.colors.borderLight};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  background: ${({ theme, $selected }) =>
    $selected ? `${theme.colors.primary}10` : theme.colors.backgroundWhite};
  transition: all ${({ theme }) => theme.transitions.fast};

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}05`};
  }
`;

export const SectionLabel = styled(Form.Label)`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  display: block;
`;

export const SectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.lg};
`;

export const ThemeIcon = styled.div<{ $selected?: boolean }>`
  width: 48px;
  height: 48px;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  background: ${({ theme, $selected }) =>
    $selected ? theme.colors.primary : theme.colors.background};
  color: ${({ theme, $selected }) =>
    $selected ? 'white' : theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  transition: all ${({ theme }) => theme.transitions.fast};
`;

export const ThemeLabel = styled.div`
  flex: 1;
`;

export const ThemeName = styled.div`
  font-weight: 600;
  font-size: ${({ theme }) => theme.fontSizes.md};
  color: ${({ theme }) => theme.colors.textPrimary};
`;

export const ThemeDescription = styled.div`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const PreviewSection = styled(Card)`
  border: 1px solid ${({ theme }) => theme.colors.borderLight};
  box-shadow: ${({ theme }) => theme.shadows.sm};
`;

export const ColorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ColorSwatch = styled.div<{ $color: string }>`
  background: ${({ $color }) => $color};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.md};
  aspect-ratio: 1;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  position: relative;
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.border};

  span {
    font-size: ${({ theme }) => theme.fontSizes.xs};
    font-weight: 600;
    background: rgba(0, 0, 0, 0.6);
    color: white;
    padding: 2px 8px;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
`;
