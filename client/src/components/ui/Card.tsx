import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'flat' | 'yellow';
  padding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  variant = 'default',
  padding = true,
}) => {
  const variantClasses: Record<string, string> = {
    default: 'bg-white border-2 border-ink shadow-[4px_4px_0px_#171717]',
    elevated: 'bg-white border-2 border-ink shadow-[6px_6px_0px_#171717]',
    flat: 'bg-white border-2 border-ink',
    yellow: 'bg-yello border-2 border-ink shadow-[4px_4px_0px_#171717]',
  };

  return (
    <div className={`${variantClasses[variant]} ${padding ? 'p-5' : ''} ${className}`}>
      {children}
    </div>
  );
};

export default Card;
