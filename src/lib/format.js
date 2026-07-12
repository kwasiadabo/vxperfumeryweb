// Money formatter: 2920 -> "2,920.00"
export function money(value) {
  return Number(value || 0).toLocaleString('en-GH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// Date formatter: "3rd Jan 2000"
export function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  const day = d.getDate();
  const suffix = [11, 12, 13].includes(day % 100)
    ? 'th'
    : { 1: 'st', 2: 'nd', 3: 'rd' }[day % 10] || 'th';
  const month = d.toLocaleString('en-GB', { month: 'short' });
  return `${day}${suffix} ${month} ${d.getFullYear()}`;
}
