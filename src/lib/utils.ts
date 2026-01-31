/**
 * Utility functions for class name manipulation and other helpers
 */

/**
 * Combine class names with support for conditional classes
 * Filters out falsy values (false, null, undefined, empty strings)
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}
