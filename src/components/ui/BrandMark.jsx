/** Shared app brand mark (sidebar, auth title, favicon source). */
export const BRAND_MARK_SRC = '/brand-mark.png'
export const BRAND_MARK_ALT = 'Parking Device Maintenance'

/**
 * Teal P / parking pin mark used in the rail and auth title.
 * Transparent PNG — no black plate behind the squircle.
 * @param {{ className?: string, size?: number }} props
 */
export function BrandMark({ className = '', size }) {
  const style = size
    ? { width: size, height: size }
    : undefined
  return (
    <img
      className={`brand-glyph${className ? ` ${className}` : ''}`}
      src={BRAND_MARK_SRC}
      alt=""
      width={size || 36}
      height={size || 36}
      style={style}
      decoding="async"
      aria-hidden="true"
    />
  )
}
