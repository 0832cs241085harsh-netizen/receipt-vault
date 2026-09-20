import { createIcons, icons } from 'lucide';
import { ParserService } from './services/ParserService.js';
import { SecurityUtil } from './services/SecurityUtil.js';
import { ChartManager } from './components/ChartManager.js';

class App {
  constructor() {
    this.transactions = [];
    this.filtered = [];
    this.chartManager = new ChartManager('category-chart');
    this.init();
  }

  init() {
    createIcons({ icons });
    this.bindEvents();
  }

  bindEvents() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => e.preventDefault());
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      if (e.dataTransfer.files.length) this.processFiles(e.dataTransfer.files);
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) this.processFiles(e.target.files);
    });

    document.getElementById('search-input').addEventListener('input', () => this.applyFilters());
    document.getElementById('category-filter').addEventListener('change', () => this.applyFilters());
    document.getElementById('fraud-filter').addEventListener('change', () => this.applyFilters());
    document.getElementById('close-modal').addEventListener('click', () => {
      document.getElementById('receipt-modal').classList.add('hidden');
    });
  }

  async processFiles(fileList) {
    let loaded = 0;
    for (const file of fileList) {
      const text = await file.text();
      let raw = [];
      if (file.name.endsWith('.csv')) raw = ParserService.parseCSVorTSV(text, ',');
      else if (file.name.endsWith('.tsv')) raw = ParserService.parseCSVorTSV(text, '\t');
      else if (file.name.endsWith('.xml')) raw = ParserService.parseXML(text);

      const normalized = raw.map((r, i) => ParserService.normalizeRecord(r, this.transactions.length + i));
      this.transactions.push(...normalized);
      loaded += normalized.length;
    }

    document.getElementById('file-status').textContent = `Processed ${fileList.length} file(s) — Loaded ${loaded} records.`;
    this.populateCategories();
    this.applyFilters();
  }

  populateCategories() {
    const categories = Array.from(new Set(this.transactions.map(t => t.category))).sort();
    const select = document.getElementById('category-filter');
    select.innerHTML = '<option value="ALL">All Categories</option>';
    categories.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c;
      opt.textContent = c;
      select.appendChild(opt);
    });
  }

  applyFilters() {
    const search = document.getElementById('search-input').value.toLowerCase();
    const cat = document.getElementById('category-filter').value;
    const fraud = document.getElementById('fraud-filter').value;

    this.filtered = this.transactions.filter(t => {
      const matchesSearch = `${t.merchant} ${t.firstName} ${t.lastName} ${t.city}`.toLowerCase().includes(search);
      const matchesCat = cat === 'ALL' || t.category === cat;
      const matchesFraud = fraud === 'ALL' || (fraud === '1' ? t.isFraud : !t.isFraud);
      return matchesSearch && matchesCat && matchesFraud;
    });

    this.renderKPIs();
    this.renderTable();
    this.chartManager.updateChart(this.filtered);
  }

  renderKPIs() {
    const count = this.filtered.length;
    const total = this.filtered.reduce((sum, t) => sum + t.amount, 0);
    const fraud = this.filtered.filter(t => t.isFraud).length;

    document.getElementById('kpi-total-amt').textContent = SecurityUtil.formatCurrency(total);
    document.getElementById('kpi-total-count').textContent = count.toLocaleString();
    document.getElementById('kpi-fraud-count').textContent = fraud.toLocaleString();
    document.getElementById('kpi-avg-amt').textContent = SecurityUtil.formatCurrency(count ? total / count : 0);
  }

  renderTable() {
    const tbody = document.getElementById('transaction-rows');
    if (!this.filtered.length) {
      tbody.innerHTML = `<tr><td colspan="9" class="px-6 py-8 text-center text-slate-400">No matching records found.</td></tr>`;
      return;
    }

    tbody.innerHTML = this.filtered.map((t, idx) => `
      <tr class="hover:bg-slate-700/50 transition">
        <td class="px-3 py-2 font-mono text-xs text-slate-400">${t.id}</td>
        <td class="px-3 py-2 text-xs">${t.dateTime}</td>
        <td class="px-3 py-2 font-medium">${t.firstName} ${t.lastName}</td>
        <td class="px-3 py-2"><code class="bg-slate-900 px-2 py-1 rounded text-xs">${t.ccNum}</code></td>
        <td class="px-3 py-2">${t.merchant}</td>
        <td class="px-3 py-2"><span class="bg-slate-700 text-slate-200 text-xs font-semibold px-2 py-0.5 rounded">${t.category}</span></td>
        <td class="px-3 py-2 font-semibold">${SecurityUtil.formatCurrency(t.amount)}</td>
        <td class="px-3 py-2">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${t.isFraud ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}">
            ${t.isFraud ? 'Fraud' : 'Verified'}
          </span>
        </td>
        <td class="px-3 py-2 text-right">
          <button data-idx="${idx}" class="view-btn text-brand-500 hover:text-brand-400 font-medium text-xs">View Receipt</button>
        </td>
      </tr>
    `).join('');

    tbody.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', (e) => this.viewReceipt(e.target.dataset.idx));
    });
  }

  viewReceipt(index) {
    const t = this.filtered[index];
    if (!t) return;

    document.getElementById('modal-body').innerHTML = `
      <div class="font-mono bg-slate-900 p-4 rounded-lg border border-dashed border-slate-700 space-y-3 text-xs">
        <div class="text-center">
          <h4 class="font-bold text-sm text-slate-100">${t.merchant}</h4>
          <p class="text-slate-400">${t.city}, ${t.state}</p>
        </div>
        <div class="border-b border-slate-700 py-2 space-y-1">
          <p><span class="text-slate-400">Transaction ID:</span> ${t.id}</p>
          <p><span class="text-slate-400">Timestamp:</span> ${t.dateTime}</p>
          <p><span class="text-slate-400">Card Mask:</span> ${t.ccNum}</p>
          <p><span class="text-slate-400">Cardholder:</span> ${t.firstName} ${t.lastName}</p>
        </div>
        <div class="flex justify-between items-center text-sm font-bold text-slate-100 pt-2">
          <span>Amount Paid</span>
          <span>${SecurityUtil.formatCurrency(t.amount)}</span>
        </div>
      </div>
    `;
    document.getElementById('receipt-modal').classList.remove('hidden');
  }
}

new App();
