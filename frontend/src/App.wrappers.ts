import styled from 'styled-components';

export const AppWrapper = styled.div<{ $hasBanner: boolean }>`
  display: flex;
  height: 100vh;
  max-height: 100vh;
  background: ${({ theme }) => theme.colors.background};
  overflow: hidden;
  padding-top: ${({ $hasBanner }) => ($hasBanner ? '40px' : '0')};
  transition: padding-top 0.3s ease-out;
  box-sizing: border-box;
`;

export const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  min-height: 0;
`;
