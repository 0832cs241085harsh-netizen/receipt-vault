
export class SecurityUtil {
  static sanitize(str) {
    if (typeof str !== 'string') return str;
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  static maskCreditCard(ccNum) {
    if (!ccNum) return '•••• 0000';
    const cleaned = ccNum.toString().replace(/\D/g, '');
    if (cleaned.length < 4) return '•••• 0000';
    return `•••• ${cleaned.slice(-4)}`;
  }

  static formatCurrency(amt) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amt);
  }
}
