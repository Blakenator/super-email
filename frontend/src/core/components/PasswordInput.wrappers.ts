import styled from 'styled-components';

export const PasswordInputWrapper = styled.div`
  position: relative;
  display: flex;
  align-items: center;
`;

export const ToggleButton = styled.button`
  position: absolute;
  right: 12px;
  background: none;
  border: none;
  color: #6c757d;
  cursor: pointer;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 4px;
  transition: all 0.2s ease;

  &:hover {
    background-color: rgba(0, 0, 0, 0.05);
    color: #495057;
  }

  &:focus {
    outline: 2px solid #667eea;
    outline-offset: 2px;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;
