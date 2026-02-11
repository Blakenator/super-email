import { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';

const DEFAULT_COLORS = [
  '#dc3545', // red
  '#fd7e14', // orange
  '#ffc107', // yellow
  '#28a745', // green
  '#17a2b8', // teal
  '#007bff', // blue
  '#6f42c1', // purple
  '#e83e8c', // pink
  '#6c757d', // gray
  '#343a40', // dark
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  mode?: 'simple' | 'full';
  colors?: string[];
  label?: string;
}

const PickerContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const Label = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

const ColorGrid = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

const ColorSwatch = styled.button<{ $color: string; $selected: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid ${({ $selected, theme }) => ($selected ? theme.colors.textPrimary : 'transparent')};
  background-color: ${({ $color }) => $color};
  cursor: pointer;
  transition: transform 0.1s ease, box-shadow 0.1s ease;
  padding: 0;

  &:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.primary}40;
  }
`;

const FullPickerWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

const CustomColorInput = styled.input`
  width: 40px;
  height: 40px;
  padding: 0;
  border: 2px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  cursor: pointer;
  background: transparent;

  &::-webkit-color-swatch-wrapper {
    padding: 2px;
  }

  &::-webkit-color-swatch {
    border: none;
    border-radius: ${({ theme }) => theme.borderRadius.sm};
  }
`;

const CustomColorLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export function ColorPicker({
  value,
  onChange,
  mode = 'simple',
  colors = DEFAULT_COLORS,
  label,
}: ColorPickerProps) {
  const [showCustom, setShowCustom] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if current value is in preset colors
  const isPresetColor = colors.includes(value.toLowerCase()) || colors.includes(value.toUpperCase());

  // In full mode, show custom picker if value is not a preset color
  useEffect(() => {
    if (mode === 'full' && !isPresetColor && value) {
      setShowCustom(true);
    }
  }, [mode, isPresetColor, value]);

  const handleSwatchClick = (color: string) => {
    onChange(color);
    setShowCustom(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <PickerContainer>
      {label && <Label>{label}</Label>}
      <ColorGrid>
        {colors.map((color) => (
          <ColorSwatch
            key={color}
            type="button"
            $color={color}
            $selected={value.toLowerCase() === color.toLowerCase()}
            onClick={() => handleSwatchClick(color)}
            title={color}
          />
        ))}
        {mode === 'full' && (
          <FullPickerWrapper>
            <CustomColorInput
              ref={inputRef}
              type="color"
              value={value}
              onChange={handleCustomColorChange}
              title="Pick a custom color"
            />
            {showCustom && !isPresetColor && (
              <CustomColorLabel>{value}</CustomColorLabel>
            )}
          </FullPickerWrapper>
        )}
      </ColorGrid>
    </PickerContainer>
  );
}

export { DEFAULT_COLORS };
