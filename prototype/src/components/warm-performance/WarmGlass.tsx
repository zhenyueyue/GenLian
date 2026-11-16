import React from 'react';
import { motion } from 'motion/react';
import { WARM_TOKENS } from './warmTokens';

export type GlassTone = 'light' | 'dim';

export interface GlassDockProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const GlassDock: React.FC<GlassDockProps> = ({
  children,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`warm-lg-dock rounded-full p-1.5 ${className}`}
      {...rest}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: GlassTone;
  elevated?: boolean;
  children: React.ReactNode;
}

export const GlassButton: React.FC<GlassButtonProps> = ({
  tone = 'light',
  elevated = false,
  className = '',
  style,
  children,
  type = 'button',
  ...rest
}) => {
  const glassClass =
    tone === 'dim'
      ? 'warm-lg-dim-control'
      : elevated
      ? 'warm-lg-control-elevated warm-lg-interactive'
      : 'warm-lg-control warm-lg-interactive';

  const textColor =
    tone === 'dim' ? WARM_TOKENS.restTextPrimary : WARM_TOKENS.inkPrimary;

  return (
    <button
      type={type}
      className={`${glassClass} rounded-full inline-flex items-center justify-center cursor-pointer ${className}`}
      style={{ color: textColor, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
};

export interface GlassIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: GlassTone;
  elevated?: boolean;
  children: React.ReactNode;
}

export const GlassIconButton: React.FC<GlassIconButtonProps> = ({
  tone = 'light',
  elevated = false,
  className = '',
  style,
  children,
  type = 'button',
  ...rest
}) => {
  const glassClass =
    tone === 'dim'
      ? 'warm-lg-dim-control'
      : elevated
      ? 'warm-lg-control-elevated warm-lg-interactive'
      : 'warm-lg-control warm-lg-interactive';

  const textColor =
    tone === 'dim' ? WARM_TOKENS.restTextPrimary : WARM_TOKENS.inkPrimary;

  return (
    <button
      type={type}
      className={`${glassClass} min-h-[40px] min-w-[40px] rounded-full flex items-center justify-center shrink-0 cursor-pointer ${className}`}
      style={{ color: textColor, ...style }}
      {...rest}
    >
      {children}
    </button>
  );
};

export type GlassPanelVariant =
  | 'chip'
  | 'rest'
  | 'sheet'
  | 'control'
  | 'dim-control'
  | 'header';

export interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: GlassPanelVariant;
  children: React.ReactNode;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  variant = 'chip',
  className = '',
  children,
  ...rest
}) => {
  const variantClass =
    variant === 'rest'
      ? 'warm-lg-rest-card'
      : variant === 'sheet'
      ? 'warm-lg-sheet'
      : variant === 'dim-control'
      ? 'warm-lg-dim-control'
      : variant === 'control'
      ? 'warm-lg-control'
      : variant === 'header'
      ? 'warm-lg-header-blur'
      : 'warm-lg-chip';

  return (
    <div className={`${variantClass} ${className}`} {...rest}>
      {children}
    </div>
  );
};

export interface GlassSegmentOption<T extends string> {
  id: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
}

export interface GlassSegmentedControlProps<T extends string> {
  options: GlassSegmentOption<T>[];
  value: T;
  onChange: (value: T) => void;
  layoutId: string;
  reduceMotion?: boolean;
  contained?: boolean;
  className?: string;
  buttonClassName?: string;
}

export function GlassSegmentedControl<T extends string>({
  options,
  value,
  onChange,
  layoutId,
  reduceMotion = false,
  contained = true,
  className = '',
  buttonClassName = '',
}: GlassSegmentedControlProps<T>) {
  return (
    <div
      className={`${
        contained ? 'warm-lg-control inline-flex p-0.5 rounded-full' : 'flex items-center gap-2'
      } ${className}`}
    >
      {options.map((opt) => {
        const isActive = value === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`warm-lg-interactive relative rounded-full flex items-center justify-center gap-1 whitespace-nowrap cursor-pointer transition-colors ${buttonClassName}`}
            style={{
              color: isActive
                ? WARM_TOKENS.accentTextOnLight
                : contained
                ? WARM_TOKENS.inkSecondary
                : WARM_TOKENS.inkMuted,
              fontWeight: isActive ? 600 : 500,
            }}
          >
            {isActive && (
              <motion.span
                layoutId={reduceMotion ? undefined : layoutId}
                transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.9 }}
                aria-hidden="true"
                className="warm-lg-active-pill absolute inset-0 rounded-full"
              />
            )}
            <span className="relative z-10 inline-flex items-center gap-1">
              {opt.icon}
              <span>{opt.label}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}

export interface GlassOverlayProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'pause' | 'scrim';
  children: React.ReactNode;
}

export const GlassOverlay: React.FC<GlassOverlayProps> = ({
  variant = 'pause',
  className = '',
  style,
  children,
  ...rest
}) => {
  if (variant === 'scrim') {
    return (
      <div
        className={`absolute inset-0 z-40 bg-black/40 backdrop-blur-sm flex flex-col justify-end ${className}`}
        style={style}
        {...rest}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`absolute inset-0 z-40 backdrop-blur-md flex flex-col items-center justify-center px-6 text-center ${className}`}
      style={{
        backgroundColor: 'rgba(249, 247, 243, 0.92)',
        color: WARM_TOKENS.inkPrimary,
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
};
