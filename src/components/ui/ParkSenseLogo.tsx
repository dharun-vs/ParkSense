import React from 'react'

export interface ParkSenseLogoProps {
  /**
   * 'full': Icon + "ParkSense" wordmark + tagline
   * 'compact': Icon only
   * 'wordmark': Wordmark text only
   */
  variant?: 'full' | 'compact' | 'wordmark'
  /**
   * 'light': Rendered on white/light gray background (navy text)
   * 'dark': Rendered on dark navy background (white text)
   */
  theme?: 'light' | 'dark'
  /**
   * Size presets
   */
  size?: 'sm' | 'md' | 'lg'
  /**
   * Optional custom CSS class
   */
  className?: string
  /**
   * Optional show tagline in full variant (default true)
   */
  showTagline?: boolean
}

/**
 * Official ParkSense Brand Logo Component
 * Uses the genuine extracted reference artwork:
 * - App icon: /parksense-icon.png
 * - Full logo: /parksense-logo-full.png
 */
export const ParkSenseLogo: React.FC<ParkSenseLogoProps> = ({
  variant = 'full',
  theme = 'light',
  size = 'md',
  className = '',
  showTagline = true,
}) => {
  const isDark = theme === 'dark'

  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
  }[size]

  const fullHeights = {
    sm: 'h-7',
    md: 'h-9',
    lg: 'h-12',
  }[size]

  const textScale = {
    sm: { title: 'text-base', subtitle: 'text-[9px]' },
    md: { title: 'text-xl', subtitle: 'text-[11px]' },
    lg: { title: 'text-2xl', subtitle: 'text-xs' },
  }[size]

  if (variant === 'compact') {
    return (
      <img
        src="/parksense-icon.png"
        alt="ParkSense Logo"
        className={`rounded-xl object-contain shrink-0 ${iconSizes} ${className}`}
      />
    )
  }

  // Light full logo uses the reference image's full artwork
  if (!isDark && variant === 'full') {
    return (
      <div className={`inline-flex items-center select-none ${className}`}>
        <img
          src="/parksense-logo-full.png"
          alt="ParkSense — SMART PARKING. SIMPLER DAYS."
          className={`w-auto object-contain ${fullHeights}`}
        />
      </div>
    )
  }

  // Dark variant (used on dark navy sidebar and login dark column)
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {variant !== 'wordmark' && (
        <img
          src="/parksense-icon.png"
          alt="ParkSense"
          className={`rounded-xl object-contain shrink-0 ${iconSizes}`}
        />
      )}
      <div className="flex flex-col leading-tight">
        <div className={`font-black tracking-tight ${textScale.title}`}>
          <span className={isDark ? 'text-white' : 'text-[#0B1B3D]'}>Park</span>
          <span className="text-[#165DFB]">Sense</span>
        </div>
        {variant === 'full' && showTagline && (
          <span
            className={`font-bold tracking-[0.16em] uppercase text-[8px] sm:text-[9px] mt-0.5 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            SMART PARKING. SIMPLER DAYS.
          </span>
        )}
      </div>
    </div>
  )
}
