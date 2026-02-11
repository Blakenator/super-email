import styled from 'styled-components';

export const ProviderGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

export const ProviderCard = styled.div<{ $selected?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.75rem;
  border-radius: 8px;
  border: 2px solid
    ${({ $selected, theme }) =>
      $selected ? theme.colors.primary : theme.colors.border};
  background: ${({ $selected, theme }) =>
    $selected ? `${theme.colors.primary}10` : theme.colors.background};
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  transition: all 0.15s ease;

  &:hover {
    border-color: ${({ theme }) => theme.colors.primary};
    background: ${({ theme }) => `${theme.colors.primary}05`};
  }

  .provider-icon {
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
  }

  .provider-name {
    font-size: 0.75rem;
    text-align: center;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text};
  }
`;

export const InstructionsCard = styled.div`
  background: ${({ theme }) => `${theme.colors.info}10`};
  border: 1px solid ${({ theme }) => `${theme.colors.info}30`};
  margin-bottom: 1rem;
`;

export const TestResult = styled.div<{ $success: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border-radius: 6px;
  margin-bottom: 1rem;
  background: ${({ $success }) => ($success ? '#d4edda' : '#f8d7da')};
  color: ${({ $success }) => ($success ? '#155724' : '#721c24')};
  font-size: 0.875rem;
`;
