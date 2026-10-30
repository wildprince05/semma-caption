import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'yellow' | 'orange' | 'black' | 'white' | 'green' | 'red';
  size?: 'sm' | 'md' | 'lg';
  rotate?: boolean;
  className?: string;
  onClick?: () => void;
  active?: boolean;
}

const variantClasses: Record<string, string> = {
  yellow: 'bg-yello text-ink border-2 border-ink',
  orange: 'bg-accent-orange text-white border-2 border-ink',
  black: 'bg-ink text-white border-2 border-ink',
  white: 'bg-white text-ink border-2 border-ink',
  green: 'bg-green-400 text-ink border-2 border-ink',
  red: 'bg-red-400 text-white border-2 border-ink',
};

const sizeClasses: Record<string, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-sm',
  lg: 'px-4 py-1.5 text-base',
};

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'yellow',
  size = 'md',
  rotate = false,
  className = '',
  onClick,
  active,
}) => {
  const rotateClass = rotate ? 'rotate-[-2deg]' : '';
  const clickableClass = onClick
    ? 'cursor-pointer hover:shadow-[3px_3px_0px_#171717] transition-all duration-150'
    : '';
  const activeClass =
    active !== undefined
      ? active
        ? 'shadow-[3px_3px_0px_#171717] ring-2 ring-yello'
        : 'opacity-70 hover:opacity-100'
      : '';

  return (
    <span
      className={`
        inline-flex items-center gap-1 rounded-full font-heading font-bold whitespace-nowrap
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        ${rotateClass}
        ${clickableClass}
        ${activeClass}
        ${className}
      `}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
    >
      {children}
    </span>
  );
};

export default Badge;
