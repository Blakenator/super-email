import styled from 'styled-components';

export const SpinnerWrapper = styled.div<{ $fullPage?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.md};
  height: ${(props) => (props.$fullPage ? '100vh' : '200px')};
  color: ${({ theme }) => theme.colors.textSecondary};
`;

export const SpinnerText = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;
