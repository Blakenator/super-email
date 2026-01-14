import styled from 'styled-components';
import { Button } from 'react-bootstrap';

export const TagButton = styled(Button).attrs({ variant: 'outline-secondary' })<{
  $isSelected: boolean;
  $color: string;
}>`
  border-color: ${({ $color }) => $color} !important;
  color: ${({ $isSelected, $color, theme }) =>
    $isSelected ? theme.colors.backgroundWhite : $color} !important;
  background-color: ${({ $isSelected, $color }) =>
    $isSelected ? $color : 'transparent'} !important;

  &:hover {
    border-color: ${({ $color }) => $color} !important;
    background-color: ${({ $isSelected, $color }) =>
      $isSelected ? $color : `${$color}20`} !important;
    color: ${({ $isSelected, $color, theme }) =>
      $isSelected ? theme.colors.backgroundWhite : $color} !important;
  }

  &:focus {
    border-color: ${({ $color }) => $color} !important;
    box-shadow: 0 0 0 0.2rem ${({ $color }) => `${$color}40`} !important;
  }

  &:active {
    border-color: ${({ $color }) => $color} !important;
    background-color: ${({ $isSelected, $color }) =>
      $isSelected ? $color : `${$color}30`} !important;
    color: ${({ $isSelected, $color, theme }) =>
      $isSelected ? theme.colors.backgroundWhite : $color} !important;
  }
`;
