<template>
    <div class="company-metric-card">
      <div class="company-header">
        <img :src="company.logo" :alt="company.companyName + ' Logo'" class="company-logo">
        <h3 class="company-name">{{ company.companyName }}</h3>
      </div>
      <div><p class="metric-label">{{ company.dashboardData.cardData.revenueLabel || 'Umsatz' }}</p></div>
      <div class="metrics-section">
        <div class="metric-item">
          <p class="metric-value">{{ company.dashboardData.cardData.revenue }}</p>
        </div>
  
        <div class="metric-item trend-metric">
          <p class="metric-value" :class="changeColorClass">
            <span class="arrow">{{ changeArrow }}</span>
            {{ company.dashboardData.cardData.percentageChange }}
          </p>
        </div>
      </div>
      <p class="metric-label">in Bill USD</p>
    </div>
  </template>
  
  <script>
  export default {
    name: 'CompanyMetricCard',
    props: {
      /**
       * @typedef {object} Company
       * @property {string} companyName - The name of the company.
       * @property {string} logo - The URL of the company's logo.
       * @property {object} dashboardData - The dashboard data for the company.
       * @property {object} dashboardData.cardData - Data specifically for the metric card.
       * @property {string} dashboardData.cardData.revenue - The current revenue value.
       * @property {string} dashboardData.cardData.percentageChange - The percentage change in revenue (formatted string).
       * @property {number} dashboardData.cardData.numericPercentageChange - The numeric percentage change in revenue.
       * @property {string} [dashboardData.cardData.revenueLabel='Umsatz'] - The label for the revenue metric.
       */
      /**
       * The company object containing display and dashboard data.
       * @type {Company}
       * @required
       */
      company: {
        type: Object,
        required: true,
        validator: (value) => {
          return value && value.companyName && value.logo && value.dashboardData && value.dashboardData.cardData;
        }
      },
      /**
       * Indicates if this card is currently active (selected).
       * @type {boolean}
       * @default false
       */
      isActive: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      /**
       * Determines the trend arrow (▲, ▼, or ▬) based on `numericPercentageChange`.
       * @returns {string} The arrow symbol.
       */
      changeArrow() {
        const numericChange = this.company.dashboardData.cardData.numericPercentageChange;
        if (numericChange === null || isNaN(numericChange)) return '';
        return numericChange > 0 ? '▲' : (numericChange < 0 ? '▼' : '▬');
      },
      /**
       * Determines the CSS class for the change value (green, red, or gray).
       * @returns {string} The CSS class name.
       */
      changeColorClass() {
        const numericChange = this.company.dashboardData.cardData.numericPercentageChange;
        if (numericChange === null || isNaN(numericChange)) return 'text-gray';
        return numericChange > 0 ? 'text-green' : (numericChange < 0 ? 'text-red' : 'text-gray');
      }
    }
  };
  </script>
  
  <style scoped>
  .company-metric-card {
    background-color: #000d1a;
    border-radius: 12px;
    padding: 20px 25px;
    text-align: center;
    flex: 1;
    width: 173px;
    height: 143px;
    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4);
    transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
    border: 1px solid transparent;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
  }
  
  .company-metric-card:hover {
    transform: translateY(-5px);
    border-color: rgba(0, 123, 255, 0.2);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.6);
  }
  
  .company-metric-card.active {
    border-color: #007bff;
    box-shadow: 0 0 20px rgba(0, 123, 255, 0.7);
    transform: scale(1.02);
  }
  
  .company-header {
    display: flex;
    gap: 20px;
    align-items: center;
  }
  
  .company-logo {
    width: 50px;
    height: 50px;
    object-fit: contain;
    margin-bottom: 10px;
  }
  
  .company-name {
    font-size: 1.2em;
    color: #fff;
    margin: 0;
    font-weight: bold;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
  }
  
  .metrics-section {
    display: flex;
    justify-content: flex-start;
    gap: 15px;
  }
  
  
  .metric-label {
    font-size: 0.9em;
    color: #87CEEB;
    margin-top: 0;
    margin-bottom: 15px;
    font-weight: 500;
    text-align: start;
  }
  
  .metric-value {
    font-size: 1.2em;
    font-weight: bold;
    color: #fff;
    margin-top: 0;
    text-shadow: 0 0 5px rgba(255, 255, 255, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
  }
  
  .arrow {
    font-size: 0.8em;
  }
  
  .text-green {
    color: #4CAF50;
  }
  
  .text-red {
    color: #F44336;
  }
  
  .text-gray {
    color: #AAA;
  }
  
  @media (max-width: 768px) {
    .company-metric-card {
      padding: 15px 20px;
      min-width: unset;
      width: 90%;
      max-width: unset;
    }
    .company-name {
      font-size: 1.4em;
    }
    .metrics-section {
      flex-direction: column;
    }
    .metric-value {
      font-size: 1.2em;
    }
  }
  </style>