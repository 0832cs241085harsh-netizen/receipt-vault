export class ParserService {
  static parseCSVorTSV(text, delimiter = ',') {
    const lines = text.split('\n').filter(l => l.trim().length > 0);
    if (lines.length < 2) return [];
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.split(delimiter).map(v => v.trim().replace(/^"|"$/g, ''));
      const record = {};
      headers.forEach((h, i) => record[h] = values[i] || '');
      return record;
    });
  }

  static parseXML(text) {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');
    const records = [];
    const nodes = xmlDoc.querySelectorAll('transaction, receipt, record');
    nodes.forEach(node => {
      const item = {};
      Array.from(node.children).forEach(child => {
        item[child.tagName] = child.textContent;
      });
      records.push(item);
    });
    return records;
  }

  static normalizeRecord(r, index) {
    const amtStr = (r.amount || r.amt || r.Total || '0').toString().replace(/[^0-9.-]/g, '');
    const amount = parseFloat(amtStr) || 0;
    const isFraudRaw = (r.is_fraud || r.fraud || r.isFraud || '0').toString().toLowerCase();
    const isFraud = isFraudRaw === '1' || isFraudRaw === 'true' || isFraudRaw === 'yes';

    return {
      id: r.trans_id || r.id || `TXN-${index + 1000}`,
      dateTime: r.trans_date_trans_time || r.date || new Date().toISOString().split('T')[0],
      firstName: r.first || r.firstName || 'Customer',
      lastName: r.last || r.lastName || '',
      ccNum: r.cc_num || r.creditCard || '•••• 0000',
      merchant: r.merchant || r.vendor || 'Unknown Merchant',
      category: r.category || 'General',
      amount: amount,
      city: r.city || 'Local',
      state: r.state || 'N/A',
      isFraud: isFraud
    };
  }
}
