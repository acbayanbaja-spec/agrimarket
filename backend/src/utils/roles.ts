/**
 * Canonical Role Management & Normalization Utility
 *
 * Establishes a single authoritative representation for user roles across AgriMarket:
 * Canonical roles: 'admin' | 'seller' | 'buyer' | 'delivery'
 *
 * Normalizes legacy aliases such as 'delivery_man', 'driver', 'rider' to 'delivery'.
 */

export const CANONICAL_ROLES = ['admin', 'seller', 'buyer', 'delivery'] as const;
export type CanonicalRole = typeof CANONICAL_ROLES[number];

/**
 * Normalizes a single role string to its canonical representation.
 * Maps legacy role aliases ('delivery_man', 'driver', 'rider') to 'delivery'.
 */
export function normalizeRole(role: unknown): string {
  if (!role || typeof role !== 'string') return '';
  const trimmed = role.trim().toLowerCase();
  if (trimmed === 'delivery_man' || trimmed === 'driver' || trimmed === 'rider') {
    return 'delivery';
  }
  return trimmed;
}

/**
 * Normalizes an array or comma-separated string of roles.
 * - Converts legacy aliases ('delivery_man' -> 'delivery')
 * - Deduplicates roles
 * - Ensures valid role list (defaults to ['buyer'] if empty)
 */
export function normalizeRoles(roles: unknown): string[] {
  let list: string[] = [];
  if (typeof roles === 'string') {
    list = roles.split(',').map((r) => r.trim());
  } else if (Array.isArray(roles)) {
    list = roles.map((r) => (typeof r === 'string' ? r.trim() : ''));
  }

  const normalized = list
    .map(normalizeRole)
    .filter((r) => r.length > 0);

  const unique = Array.from(new Set(normalized));
  return unique.length > 0 ? unique : ['buyer'];
}

/**
 * Checks whether the user roles list satisfies the target role check,
 * taking canonical aliases into account.
 */
export function hasRole(userRoles: string[] | undefined | null, targetRole: string): boolean {
  if (!userRoles || !Array.isArray(userRoles)) return false;
  const canonicalTarget = normalizeRole(targetRole);
  return userRoles.some((r) => normalizeRole(r) === canonicalTarget);
}
