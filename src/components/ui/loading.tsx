import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  variant?: 'spinner' | 'pulse' | 'dots' | 'bars' | 'skeleton' | 'wave' | 'ring' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  text?: string;
  className?: string;
  fullScreen?: boolean;
  overlay?: boolean;
  progress?: number; // For progress-based loading
  interactive?: boolean;
}

const LoadingSpinner: React.FC<{ size: string; className?: string; interactive?: boolean }> = ({
  size,
  className,
  interactive = false
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={cn('relative group cursor-pointer', className)}>
      <div className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-eeu-orange transition-all duration-300',
        interactive && 'group-hover:border-t-eeu-green group-hover:scale-110',
        sizeClasses[size as keyof typeof sizeClasses]
      )} />
      {interactive && (
        <div className="absolute inset-0 rounded-full border border-eeu-orange/20 animate-ping opacity-0 group-hover:opacity-100" />
      )}
    </div>
  );
};

const LoadingPulse: React.FC<{ size: string; className?: string }> = ({ size, className }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  return (
    <div className={cn('relative', className)}>
      <div className={cn(
        'bg-eeu-orange rounded-full animate-pulse',
        sizeClasses[size as keyof typeof sizeClasses]
      )} />
    </div>
  );
};

const LoadingDots: React.FC<{ size: string; className?: string; interactive?: boolean }> = ({
  size,
  className,
  interactive = false
}) => {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-2 h-2',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4'
  };

  return (
    <div className={cn('flex space-x-1 group cursor-pointer', className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-eeu-orange rounded-full animate-bounce transition-all duration-300',
            interactive && 'group-hover:bg-eeu-green group-hover:scale-125',
            sizeClasses[size as keyof typeof sizeClasses]
          )}
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
      {interactive && (
        <div className="absolute inset-0 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {[0, 1, 2].map((i) => (
            <div
              key={`hover-${i}`}
              className={cn(
                'bg-eeu-green/30 rounded-full animate-pulse',
                sizeClasses[size as keyof typeof sizeClasses]
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const LoadingBars: React.FC<{ size: string; className?: string; interactive?: boolean }> = ({
  size,
  className,
  interactive = false
}) => {
  const heightClasses = {
    sm: 'h-3',
    md: 'h-4',
    lg: 'h-6',
    xl: 'h-8'
  };

  const widthClasses = {
    sm: 'w-1',
    md: 'w-1.5',
    lg: 'w-2',
    xl: 'w-3'
  };

  return (
    <div className={cn('flex space-x-0.5 items-end group cursor-pointer', className)}>
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className={cn(
            'bg-eeu-orange animate-pulse rounded-sm transition-all duration-300',
            interactive && 'group-hover:bg-eeu-green group-hover:scale-y-110',
            widthClasses[size as keyof typeof widthClasses],
            heightClasses[size as keyof typeof heightClasses]
          )}
          style={{
            animationDelay: `${i * 0.1}s`,
            height: `${Math.random() * 100}%`
          }}
        />
      ))}
      {interactive && (
        <div className="absolute inset-0 flex space-x-0.5 items-end opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={`hover-${i}`}
              className="bg-eeu-green/30 animate-pulse rounded-sm"
              style={{
                width: widthClasses[size as keyof typeof widthClasses],
                height: heightClasses[size as keyof typeof heightClasses],
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const LoadingWave: React.FC<{ size: string; className?: string; interactive?: boolean }> = ({
  size,
  className,
  interactive = false
}) => {
  const sizeClasses = {
    sm: 'w-16 h-8',
    md: 'w-24 h-12',
    lg: 'w-32 h-16',
    xl: 'w-40 h-20'
  };

  return (
    <div className={cn('relative group cursor-pointer', className)}>
      <div className={cn('flex items-end justify-center space-x-1', sizeClasses[size as keyof typeof sizeClasses])}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={cn(
              'bg-gradient-to-t from-eeu-orange to-eeu-orange/80 rounded-sm animate-pulse transition-all duration-500',
              interactive && 'group-hover:from-eeu-green group-hover:to-eeu-green/80 group-hover:scale-y-110',
              size === 'sm' ? 'w-0.5' : size === 'md' ? 'w-1' : size === 'lg' ? 'w-1.5' : 'w-2'
            )}
            style={{
              animationDelay: `${i * 0.1}s`,
              height: `${20 + Math.sin(i * 0.5) * 15}%`,
              animation: `wave 1.5s ease-in-out infinite ${i * 0.1}s`
            }}
          />
        ))}
      </div>
      {interactive && (
        <div className="absolute inset-0 flex items-end justify-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={`glow-${i}`}
              className="bg-eeu-green/30 rounded-sm animate-pulse"
              style={{
                width: size === 'sm' ? '2px' : size === 'md' ? '4px' : size === 'lg' ? '6px' : '8px',
                height: `${20 + Math.sin(i * 0.5) * 15}%`,
                animationDelay: `${i * 0.1}s`
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const LoadingRing: React.FC<{ size: string; className?: string; interactive?: boolean }> = ({
  size,
  className,
  interactive = false
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-20 h-20'
  };

  return (
    <div className={cn('relative group cursor-pointer', className)}>
      <div className={cn(
        'rounded-full border-4 border-transparent bg-gradient-to-r from-eeu-orange via-eeu-orange/50 to-transparent animate-spin',
        interactive && 'group-hover:from-eeu-green group-hover:via-eeu-green/50 group-hover:scale-110',
        sizeClasses[size as keyof typeof sizeClasses]
      )} />
      <div className={cn(
        'absolute inset-1 rounded-full border-2 border-eeu-orange/30 animate-ping',
        interactive && 'group-hover:border-eeu-green/30',
        sizeClasses[size as keyof typeof sizeClasses].replace('w-', 'w-[').replace('h-', 'h-[') + ']'
      )} />
      {interactive && (
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-eeu-green/10 to-transparent animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  );
};

const LoadingGradient: React.FC<{ size: string; className?: string; interactive?: boolean }> = ({
  size,
  className,
  interactive = false
}) => {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
    xl: 'w-24 h-24'
  };

  return (
    <div className={cn('relative group cursor-pointer', className)}>
      <div className={cn(
        'rounded-full bg-gradient-to-r from-eeu-orange via-eeu-green to-eeu-orange animate-spin',
        interactive && 'group-hover:scale-110 group-hover:shadow-lg',
        sizeClasses[size as keyof typeof sizeClasses]
      )}
      style={{
        backgroundSize: '200% 200%',
        animation: 'gradient-shift 2s ease infinite'
      }}
      />
      <div className={cn(
        'absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm animate-pulse',
        interactive && 'group-hover:bg-white/30'
      )} />
      {interactive && (
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-eeu-orange/20 to-eeu-green/20 animate-ping opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      )}
    </div>
  );
};

const LoadingSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('animate-pulse', className)}>
      <div className="space-y-3">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-3/4 animate-shimmer"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-1/2 animate-shimmer"></div>
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded w-5/6 animate-shimmer"></div>
      </div>
    </div>
  );
};

export const Loading: React.FC<LoadingProps> = ({
  variant = 'spinner',
  size = 'md',
  text,
  className,
  fullScreen = false,
  overlay = false,
  progress,
  interactive = false
}) => {
  const renderLoader = () => {
    switch (variant) {
      case 'spinner':
        return <LoadingSpinner size={size} interactive={interactive} />;
      case 'pulse':
        return <LoadingPulse size={size} />;
      case 'dots':
        return <LoadingDots size={size} interactive={interactive} />;
      case 'bars':
        return <LoadingBars size={size} interactive={interactive} />;
      case 'wave':
        return <LoadingWave size={size} interactive={interactive} />;
      case 'ring':
        return <LoadingRing size={size} interactive={interactive} />;
      case 'gradient':
        return <LoadingGradient size={size} interactive={interactive} />;
      case 'skeleton':
        return <LoadingSkeleton />;
      default:
        return <LoadingSpinner size={size} interactive={interactive} />;
    }
  };

  const content = (
    <div className={cn(
      'flex flex-col items-center justify-center gap-4',
      fullScreen && 'min-h-screen',
      className
    )}>
      {renderLoader()}
      {progress !== undefined && (
        <div className="w-full max-w-xs space-y-2">
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-eeu-orange to-eeu-green rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-xs text-center text-muted-foreground">
            {Math.round(progress)}% complete
          </p>
        </div>
      )}
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse text-center max-w-xs">
          {text}
        </p>
      )}
    </div>
  );

  if (overlay) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
};

// Page-level loading component with modern design
interface PageLoadingProps {
  title?: string;
  subtitle?: string;
  variant?: 'cards' | 'list' | 'dashboard' | 'form' | 'hero' | 'content';
  className?: string;
  showProgress?: boolean;
  progress?: number;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  title = 'Loading...',
  subtitle,
  variant = 'cards',
  className,
  showProgress = false,
  progress
}) => {
  const renderSkeleton = () => {
    switch (variant) {
      case 'cards':
        return (
          <div className="space-y-6">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-64 animate-shimmer"></div>
                <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-80 animate-shimmer"></div>
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-10 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer"></div>
                ))}
              </div>
            </div>

            {/* Cards skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="p-6 border rounded-lg bg-gradient-to-br from-card to-card/50 shadow-sm hover:shadow-md transition-shadow duration-300">
                  <div className="space-y-3">
                    <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-3/4 animate-shimmer"></div>
                    <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-1/2 animate-shimmer"></div>
                    <div className="h-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="space-y-4">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="h-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-64 animate-shimmer"></div>
                <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-80 animate-shimmer"></div>
              </div>
            </div>

            {/* List items skeleton */}
            <div className="space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg bg-gradient-to-r from-card to-card/50 hover:shadow-sm transition-all duration-300 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="h-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-1/3 animate-shimmer"></div>
                      <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-2/3 animate-shimmer"></div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-8 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer"></div>
                      <div className="h-8 w-8 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full animate-shimmer"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6">
            {/* Stats skeleton */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-6 border rounded-lg animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-4 bg-muted rounded w-20"></div>
                      <div className="h-8 bg-muted rounded w-16"></div>
                    </div>
                    <div className="h-12 w-12 bg-muted rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Chart skeleton */}
            <div className="p-6 border rounded-lg animate-pulse">
              <div className="h-64 bg-muted rounded"></div>
            </div>
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6 max-w-2xl">
            {/* Form skeleton */}
            <div className="space-y-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-muted rounded animate-pulse"></div>
                </div>
              ))}
            </div>

            {/* Button skeleton */}
            <div className="flex gap-4">
              <div className="h-10 w-24 bg-muted rounded animate-pulse"></div>
              <div className="h-10 w-20 bg-muted rounded animate-pulse"></div>
            </div>
          </div>
        );

      case 'hero':
        return (
          <div className="relative min-h-[500px] flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
            <div className="text-center space-y-6 max-w-2xl mx-auto px-4">
              <div className="space-y-4">
                <div className="h-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-96 mx-auto animate-shimmer"></div>
                <div className="h-6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-80 mx-auto animate-shimmer"></div>
              </div>
              <Loading variant="gradient" size="xl" interactive />
              {showProgress && progress !== undefined && (
                <div className="w-full max-w-md mx-auto space-y-2">
                  <div className="w-full bg-muted/50 rounded-full h-3 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-eeu-orange to-eeu-green rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Loading... {Math.round(progress)}%
                  </p>
                </div>
              )}
            </div>
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-eeu-orange/20 rounded-full animate-ping"></div>
              <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-eeu-green/20 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
              <div className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-eeu-orange/30 rounded-full animate-bounce" style={{ animationDelay: '2s' }}></div>
            </div>
          </div>
        );

      case 'content':
        return (
          <div className="max-w-4xl mx-auto space-y-8 p-6">
            {/* Article header */}
            <div className="space-y-4">
              <div className="h-10 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-3/4 animate-shimmer"></div>
              <div className="h-6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-1/2 animate-shimmer"></div>
              <div className="flex gap-4">
                <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-24 animate-shimmer"></div>
                <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-32 animate-shimmer"></div>
              </div>
            </div>

            {/* Content blocks */}
            <div className="space-y-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-full animate-shimmer"></div>
                  <div className="h-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-11/12 animate-shimmer"></div>
                  <div className="h-5 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-4/5 animate-shimmer"></div>
                  {i % 2 === 0 && (
                    <div className="h-32 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-shimmer mt-4"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
            <Loading variant="gradient" size="lg" interactive />
            <div className="text-center space-y-2">
              <div className="h-6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-32 animate-shimmer"></div>
              {subtitle && <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded w-48 animate-shimmer"></div>}
            </div>
            {showProgress && progress !== undefined && (
              <div className="w-full max-w-xs space-y-2">
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-eeu-orange to-eeu-green rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
                <p className="text-xs text-center text-muted-foreground">
                  {Math.round(progress)}% complete
                </p>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {renderSkeleton()}
    </div>
  );
};

// Inline loading component for buttons and small areas
interface InlineLoadingProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'sm',
  text,
  className
}) => {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <LoadingSpinner size={size} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
};

// Add custom CSS animations
const styles = `
  @keyframes wave {
    0%, 100% { transform: scaleY(0.5); }
    50% { transform: scaleY(1); }
  }

  @keyframes gradient-shift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
`;

// Inject styles into head if not already present
if (typeof document !== 'undefined' && !document.getElementById('loading-animations')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'loading-animations';
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default Loading;