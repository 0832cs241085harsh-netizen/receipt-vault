import { describe, it, expect } from 'vitest';
import { SecurityUtil } from '../services/SecurityUtil';
import { ParserService } from '../services/ParserService';

describe('Security and Parsing Utility Integrity', () => {
  it('sanitizes malicious string input', () => {
    const dirty = '<script>alert("xss")</script>';
    expect(SecurityUtil.sanitize(dirty)).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
  });

  it('masks credit cards showing last 4 digits', () => {
    expect(SecurityUtil.maskCreditCard('4126110000001234')).toBe('•••• 1234');
  });

  it('parses structured CSV correctly', () => {
    const csv = `trans_id,amt,merchant\n101,45.50,Store A`;
    const parsed = ParserService.parseCSVorTSV(csv, ',');
    expect(parsed).toHaveLength(1);
    expect(parsed[0].trans_id).toBe('101');
    expect(parsed[0].amt).toBe('45.50');
  });
});
