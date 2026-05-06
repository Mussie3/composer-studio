type StyleMap = Record<string, string | number | undefined | null | false>

export const renderStyle = (styles: StyleMap): string => {
  return Object.entries(styles)
    .filter(([, value]) => value !== undefined && value !== null && value !== false)
    .map(([key, value]) => `${camelToKebab(key)}: ${formatValue(key, value as string | number)};`)
    .join(' ')
}

const camelToKebab = (s: string) =>
  s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`).replace(/^ms-/, 'mso-')

const formatValue = (key: string, value: string | number): string => {
  if (typeof value === 'number') {
    if (UNITLESS.has(key)) return String(value)
    return `${value}px`
  }
  return value
}

const UNITLESS = new Set(['fontWeight', 'lineHeight', 'opacity', 'zIndex'])

export const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export const escapeAttr = (s: string): string => escapeHtml(s)
