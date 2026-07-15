import type { ParsedSearchFilters } from '../../contracts';

const AREAS = [
  'lekki', 'yaba', 'ikeja', 'surulere', 'gbagada', 'victoria island', 'vi', 'ikoyi', 'ajah',
  'maryland', 'magodo', 'ojota', 'oshodi', 'apapa', 'festac', ' isolo', 'ilupeju',
];
const AMENITIES = ['water', 'parking', 'security', 'wifi', 'furnished', 'kitchen', 'generator'];

/**
 * Heuristic NL → structured filters (§7.5). This is the deterministic keyword
 * fallback; M5 places an AI `generateObject` parse in front and falls back here.
 */
export function parseQueryHeuristic(query: string): ParsedSearchFilters {
  const q = query.toLowerCase();
  const filters: ParsedSearchFilters = {};

  const beds = /(\d+)\s*(?:bed|bedroom|br)\b/.exec(q);
  if (beds) filters.minBeds = Number(beds[1]);

  // "under 800k", "below 1.5m", "less than 1,200,000"
  const price = /(?:under|below|less than|max)\s*₦?\s*([\d.,]+)\s*(k|m)?/.exec(q);
  if (price) {
    let amount = Number(price[1]!.replace(/,/g, ''));
    if (price[2] === 'k') amount *= 1_000;
    if (price[2] === 'm') amount *= 1_000_000;
    if (amount > 0) filters.maxPrice = Math.round(amount);
  } else {
    // bare "800k" / "1m"
    const bare = /([\d.]+)\s*(k|m)\b/.exec(q);
    if (bare) {
      let amount = Number(bare[1]);
      amount *= bare[2] === 'm' ? 1_000_000 : 1_000;
      filters.maxPrice = Math.round(amount);
    }
  }

  for (const area of AREAS) {
    if (q.includes(area)) {
      filters.area = area === 'vi' ? 'victoria island' : area.trim();
      break;
    }
  }

  const found = AMENITIES.filter((a) => q.includes(a));
  if (found.length) filters.amenities = found;

  return filters;
}
