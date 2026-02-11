import styled from 'styled-components';

export const TagListItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing.md};
`;

export const TagInfo = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const TagColorDot = styled.div<{ $color: string }>`
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background-color: ${({ $color }) => $color};
  flex-shrink: 0;
`;

export const TagName = styled.span`
  font-weight: 500;
`;

export const TagDescription = styled.span`
  color: ${({ theme }) => theme.colors.textSecondary};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

export const EmailCount = styled.span`
  margin-left: ${({ theme }) => theme.spacing.sm};
`;

export const TagActions = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const ColorPicker = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const ColorOption = styled.button<{
  $color: string;
  $selected: boolean;
}>`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 3px solid ${({ $selected }) => ($selected ? '#000' : 'transparent')};
  background-color: ${({ $color }) => $color};
  cursor: pointer;
  transition: transform 0.1s ease;

  &:hover {
    transform: scale(1.1);
  }
`;
