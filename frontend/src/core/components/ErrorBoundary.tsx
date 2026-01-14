import { Component, type ReactNode } from 'react';
import { Container, Button, Alert, Card } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDizzy,
  faSync,
  faHome,
  faExclamationTriangle,
} from '@fortawesome/free-solid-svg-icons';
import {
  ErrorWrapper,
  ErrorCard,
  ErrorIcon,
  InlineErrorWrapper,
} from './ErrorBoundary.wrappers';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorWrapper>
          <Container>
            <ErrorCard className="mx-auto">
              <Card.Body className="p-5 text-center">
                <ErrorIcon>
                  <FontAwesomeIcon icon={faDizzy} />
                </ErrorIcon>
                <h2 className="mb-3">Something went wrong</h2>
                <p className="text-muted mb-4">
                  An unexpected error occurred. Please try refreshing the page
                  or go back to the home page.
                </p>

                {import.meta.env.DEV && this.state.error && (
                  <Alert variant="danger" className="text-start mb-4">
                    <strong>Error:</strong> {this.state.error.message}
                    {this.state.errorInfo && (
                      <details className="mt-2">
                        <summary>Stack trace</summary>
                        <pre
                          style={{
                            fontSize: '0.75rem',
                            overflow: 'auto',
                            maxHeight: '200px',
                          }}
                        >
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </details>
                    )}
                  </Alert>
                )}

                <div className="d-flex gap-2 justify-content-center">
                  <Button variant="primary" onClick={this.handleReload}>
                    <FontAwesomeIcon icon={faSync} className="me-1" />
                    Refresh Page
                  </Button>
                  <Button variant="outline-secondary" onClick={this.handleGoHome}>
                    <FontAwesomeIcon icon={faHome} className="me-1" />
                    Go Home
                  </Button>
                </div>
              </Card.Body>
            </ErrorCard>
          </Container>
        </ErrorWrapper>
      );
    }

    return this.props.children;
  }
}

interface InlineErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export function InlineErrorFallback({
  error,
  resetError,
}: InlineErrorFallbackProps) {
  return (
    <InlineErrorWrapper>
      <h5>
        <FontAwesomeIcon icon={faExclamationTriangle} className="me-2" />
        This section encountered an error
      </h5>
      <p className="text-muted mb-3">{error.message}</p>
      <Button variant="warning" size="sm" onClick={resetError}>
        Try Again
      </Button>
    </InlineErrorWrapper>
  );
}

// Page-level error boundary with reset capability
interface PageErrorBoundaryState extends State {
  key: number;
}

export class PageErrorBoundary extends Component<Props, PageErrorBoundaryState> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, key: 0 };
  }

  static getDerivedStateFromError(
    error: Error,
  ): Partial<PageErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PageErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  resetError = () => {
    this.setState((prev) => ({
      hasError: false,
      error: null,
      errorInfo: null,
      key: prev.key + 1,
    }));
  };

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <InlineErrorFallback
          error={this.state.error}
          resetError={this.resetError}
        />
      );
    }

    return <div key={this.state.key}>{this.props.children}</div>;
  }
}
