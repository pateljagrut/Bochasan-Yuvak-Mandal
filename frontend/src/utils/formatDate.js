/**
 * Utility functions for date formatting across the Bochasan Yuvak Mandal portal.
 */

/**
 * Formats a Date of Birth string into standard 'DD-MM-YYYY' display format.
 * Examples:
 *   "2000-12-27" -> "27-12-2000"
 *   "2002-05-15" -> "15-05-2002"
 *   "1998-01-01" -> "01-01-1998"
 *   "27-12-2000" -> "27-12-2000"
 * 
 * @param {string|Date} dobStr - Raw date string or object
 * @param {string} fallback - Fallback string if missing/invalid (default: 'N/A')
 * @returns {string} Formatted DD-MM-YYYY date string
 */
export function formatDob(dobStr, fallback = 'N/A') {
  if (!dobStr) return fallback;
  const str = String(dobStr).trim();
  if (!str) return fallback;

  // 1. Check if already in DD-MM-YYYY or DD/MM/YYYY pattern
  const ddmmyyyyMatch = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (ddmmyyyyMatch) {
    const day = ddmmyyyyMatch[1].padStart(2, '0');
    const month = ddmmyyyyMatch[2].padStart(2, '0');
    const year = ddmmyyyyMatch[3];
    return `${day}-${month}-${year}`;
  }

  // 2. Check if in YYYY-MM-DD or YYYY/MM/DD or ISO string pattern (e.g. 2000-12-27)
  const yyyymmddMatch = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (yyyymmddMatch) {
    const year = yyyymmddMatch[1];
    const month = yyyymmddMatch[2].padStart(2, '0');
    const day = yyyymmddMatch[3].padStart(2, '0');
    return `${day}-${month}-${year}`;
  }

  // 3. Fallback to JavaScript Date parsing
  try {
    const d = new Date(str);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {
    // Ignore and fallback
  }

  return str || fallback;
}

/**
 * Formats standard date strings to DD-MM-YYYY.
 */
export function formatDateDDMMYYYY(dateStr, fallback = 'N/A') {
  return formatDob(dateStr, fallback);
}
