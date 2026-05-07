type Props = {
  size?: number
  withText?: boolean
  className?: string
}

export default function BrandLogo({ size = 28, withText = false, className }: Props) {
  return (
    <span className={['inline-flex items-center gap-2', className].filter(Boolean).join(' ')}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="Composer Studio"
      >
        <defs>
          <linearGradient id="cs-mark-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0" stopColor="#8A5CFF" />
            <stop offset="1" stopColor="#5B5FE3" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="8" fill="url(#cs-mark-grad)" />
        <rect x="7" y="7" width="18" height="5" rx="1.5" fill="#FFFFFF" fillOpacity="0.55" />
        <rect x="7" y="13.5" width="18" height="5" rx="1.5" fill="#FFFFFF" fillOpacity="0.78" />
        <rect x="7" y="20" width="18" height="5" rx="1.5" fill="#FFFFFF" />
      </svg>
      {withText && (
        <span className="font-display tracking-tight">
          <span className="font-semibold text-ink-900">Composer</span>
          <span className="font-semibold text-brand-600 ml-1">Studio</span>
        </span>
      )}
    </span>
  )
}
