import Chart from 'chart.js/auto';

export class ChartManager {
  constructor(canvasId) {
    this.canvasId = canvasId;
    this.chart = null;
  }

  updateChart(transactions) {
    const ctx = document.getElementById(this.canvasId);
    if (!ctx) return;

    const categories = {};
    transactions.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categories);
    const data = Object.values(categories);

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Spending by Category (₹)',
          data,
          backgroundColor: '#0284c7',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  }
}
