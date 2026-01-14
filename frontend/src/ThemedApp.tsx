import { Toaster } from 'react-hot-toast';
import App from './App';
import { useAuth } from './contexts/AuthContext';
import { ThemeContextProvider } from './contexts/ThemeContext';

/**
 * ThemedApp wraps the main App with ThemeContextProvider
 * This component has access to the AuthContext to get user's theme preference
 */
export function ThemedApp() {
  const { user } = useAuth();

  return (
    <ThemeContextProvider userThemePreference={user?.themePreference}>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </ThemeContextProvider>
  );
}
