export const WA_NUMBER = "62895621072782";

export function formatRupiah(val) {
  if (!val) return 'Rp 0';
  const number = typeof val === 'number' ? val : parseInt(val.toString().replace(/[^0-9]/g, ''), 10) || 0;
  return `Rp ${number.toLocaleString('id-ID')}`;
}

export function getCategoryBadgeStyle(category) {
  const cat = (category || '').toLowerCase().trim();
  switch (cat) {
    case 'stiker':
      return 'bg-emerald-700 text-lime-300';
    case 'mini stiker':
      return 'bg-cyan-700 text-cyan-100';
    case 'keychain':
      return 'bg-amber-600 text-white';
    case 'poster':
      return 'bg-purple-700 text-white';
    case 'jersey':
      return 'bg-rose-700 text-white';
    case 'apparel':
      return 'bg-blue-700 text-white';
    case 'aksesoris':
      return 'bg-teal-700 text-white';
    default:
      return 'bg-emerald-800 text-white';
  }
}
