/**
 * Utility functions for variant attribute normalization and validation
 */

/**
 * Normalize a variant attribute value:
 * - Converts empty strings to null
 * - Trims whitespace
 * - Normalizes case (preserves original case, but ensures consistent comparison)
 * - Returns null if value is empty after trimming
 */
export function normalizeVariantAttribute(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const trimmed = value.trim()
  return trimmed === '' ? null : trimmed
}

/**
 * Normalize all variant attributes (size, color, material)
 */
export function normalizeVariantAttributes(data: {
  size?: string | null
  color?: string | null
  material?: string | null
}): {
  size: string | null
  color: string | null
  material: string | null
} {
  return {
    size: normalizeVariantAttribute(data.size),
    color: normalizeVariantAttribute(data.color),
    material: normalizeVariantAttribute(data.material),
  }
}

/**
 * Check if at least one attribute is provided
 */
export function hasAtLeastOneAttribute(
  size: string | null,
  color: string | null,
  material: string | null
): boolean {
  return size !== null || color !== null || material !== null
}

/**
 * Build a unique key for variant combination comparison
 * Uses normalized values for consistent comparison
 */
export function getVariantCombinationKey(
  size: string | null,
  color: string | null,
  material: string | null
): string {
  const normalized = normalizeVariantAttributes({ size, color, material })
  return `${normalized.size ?? 'null'}|${normalized.color ?? 'null'}|${normalized.material ?? 'null'}`
}
