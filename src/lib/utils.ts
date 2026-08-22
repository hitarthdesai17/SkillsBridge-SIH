export type ClassValue = ClassValue[] | Record<string, any> | string | number | boolean | null | undefined;

/**
 * Robust, zero-dependency className merger compatible with strings, objects, booleans, and arrays.
 * Prevents webpack vendor-chunk resolution issues during Next.js SSR and fast refresh.
 */
export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = [];

  for (const input of inputs) {
    if (!input) continue;

    if (typeof input === 'string' || typeof input === 'number') {
      classes.push(String(input).trim());
    } else if (Array.isArray(input)) {
      const inner = cn(...input);
      if (inner) classes.push(inner);
    } else if (typeof input === 'object') {
      for (const [key, value] of Object.entries(input)) {
        if (value) classes.push(key.trim());
      }
    }
  }

  return classes.filter(Boolean).join(' ');
}
