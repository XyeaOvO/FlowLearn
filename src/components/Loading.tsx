import React from 'react';
import '../styles/loading.css';

// Loading Spinner Component
interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', className = '' }) => {
  const sizeClass = size === 'sm' ? 'spinner-sm' : size === 'lg' ? 'spinner-lg' : '';
  return <div className={`spinner ${sizeClass} ${className}`} />;
};

// Loading Dots Component
interface LoadingDotsProps {
  className?: string;
}

export const LoadingDots: React.FC<LoadingDotsProps> = ({ className = '' }) => {
  return (
    <div className={`loading-dots ${className}`}>
      <div className="dot"></div>
      <div className="dot"></div>
      <div className="dot"></div>
    </div>
  );
};

// Loading Pulse Component
interface LoadingPulseProps {
  className?: string;
}

export const LoadingPulse: React.FC<LoadingPulseProps> = ({ className = '' }) => {
  return <div className={`loading-pulse ${className}`} />;
};

// Skeleton Components
interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', width, height }) => {
  const style = {
    ...(width && { width }),
    ...(height && { height })
  };
  return <div className={`skeleton ${className}`} style={style} />;
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 3, 
  className = '' 
}) => {
  return (
    <div className={className}>
      {Array.from({ length: lines }, (_, i) => (
        <div key={i} className="skeleton skeleton-text" />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`skeleton-card ${className}`}>
      <div className="skeleton skeleton-title" />
      <SkeletonText lines={2} />
    </div>
  );
};

// Loading Overlay Component
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  spinner?: 'spinner' | 'dots' | 'pulse';
  dark?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  children,
  loadingText = 'Loading...',
  spinner = 'spinner',
  dark = false
}) => {
  const renderSpinner = () => {
    switch (spinner) {
      case 'dots':
        return <LoadingDots />;
      case 'pulse':
        return <LoadingPulse />;
      default:
        return <Spinner />;
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      {children}
      {isLoading && (
        <div className={`loading-overlay ${dark ? 'dark' : ''}`}>
          <div className="loading-container">
            {renderSpinner()}
            {loadingText && <div className="loading-text">{loadingText}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  progress?: number; // 0-100
  indeterminate?: boolean;
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  indeterminate = false,
  className = ''
}) => {
  if (indeterminate) {
    return <div className={`progress-bar progress-bar-indeterminate ${className}`} />;
  }

  return (
    <div className={`progress-bar ${className}`}>
      <div 
        className="progress-bar-fill" 
        style={{ width: `${progress || 0}%` }}
      />
    </div>
  );
};

// Button Loading State Hook
export const useButtonLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const withLoading = async (asyncFn: () => Promise<any>) => {
    setIsLoading(true);
    try {
      await asyncFn();
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, withLoading, setIsLoading };
};

// List Loading Component
interface ListLoadingProps {
  text?: string;
  spinner?: 'spinner' | 'dots' | 'pulse';
}

export const ListLoading: React.FC<ListLoadingProps> = ({ 
  text = 'Loading...', 
  spinner = 'spinner' 
}) => {
  const renderSpinner = () => {
    switch (spinner) {
      case 'dots':
        return <LoadingDots />;
      case 'pulse':
        return <LoadingPulse />;
      default:
        return <Spinner />;
    }
  };

  return (
    <div className="list-loading">
      {renderSpinner()}
      <div className="loading-text">{text}</div>
    </div>
  );
};

// Empty State Component
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action
}) => {
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <div className="empty-state-title">{title}</div>
      {description && <div className="empty-state-description">{description}</div>}
      {action && <div style={{ marginTop: '1rem' }}>{action}</div>}
    </div>
  );
};

// Fade In Wrapper
interface FadeInProps {
  children: React.ReactNode;
  className?: string;
}

export const FadeIn: React.FC<FadeInProps> = ({ children, className = '' }) => {
  return <div className={`fade-in ${className}`}>{children}</div>;
};