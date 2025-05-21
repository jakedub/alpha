// src/utils/formatKey.ts
export const formatKey = (key: string): string =>
  key
    .replace(/([a-z])([A-Z])/g, '$1_$2') // camelCase to snake_case
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');