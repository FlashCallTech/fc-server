export const slugify = (str: string) =>
  str.toLowerCase().replace(/\s+/g, '-'); // e.g., "Legal Advisor" -> "legal-advisor"

export const deslugify = (slug: string) =>
  slug.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()); // e.g., "legal-advisor" -> "Legal Advisor"