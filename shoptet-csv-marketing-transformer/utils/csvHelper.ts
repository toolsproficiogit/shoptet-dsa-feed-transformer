
/**
 * Since we're using PapaParse directly in the component for better progress control,
 * this utility file can serve as a place for extra formatting if needed.
 */

export const sanitizeString = (str: string): string => {
  return str.trim().replace(/\r?\n|\r/g, " ");
};

// No complex logic needed here yet as PapaParse is quite robust.
