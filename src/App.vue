<template>
  <div class="dashboard-main-wrapper">
    <div v-if="isLoading" class="loading-state">
      <h1>Loading...</h1>
    </div>
    <div v-else-if="error" class="error-state">
      <h1>Error</h1>
      <p>{{ error }}</p>
    </div>
    <div v-else-if="magnificentSeven.every(c => c.dashboardData)">
      <TopCard
        :companies-data="magnificentSeven"
        :selected-company-ticker="currentCompany.ticker"
      />
    </div>
  </div>
</template>

<script>
import TopCard from './components/TopCard.vue';
import { stockService } from '@/services/stockService';

export default {
  name: 'App',
  components: {
    TopCard
  },
  data() {
    return {
      /**
       * Indicates if data is currently being loaded.
       * @type {boolean}
       */
      isLoading: true,
      /**
       * Stores any error message that occurred during data loading.
       * @type {string|null}
       */
      error: null,
      /**
       * An array of company objects representing the "Magnificent Seven",
       * each pre-populated with company name, ticker, and logo,
       * and will be enriched with `dashboardData` after fetching.
       * @type {Array<object>}
       */
      magnificentSeven: [
        { companyName: "Alphabet", ticker: "GOOG", logo: require('@/assets/logos/GOOG.png') },
        { companyName: "Apple", ticker: "AAPL", logo: require('@/assets/logos/AAPL.png') },
        { companyName: "Meta", ticker: "META", logo: require('@/assets/logos/META.png') },
        { companyName: "Microsoft", ticker: "MSFT", logo: require('@/assets/logos/MSFT.png') },
        { companyName: "Amazon", ticker: "AMZN", logo: require('@/assets/logos/AMZN.png') },
        { companyName: "NVIDIA", ticker: "NVDA", logo: require('@/assets/logos/NVDA.png') },
        { companyName: "Tesla", ticker: "TSLA", logo: require('@/assets/logos/TSLA.png') },
      ],
      /**
       * The currently selected company, including its ticker, name, and dashboard data.
       * @type {object}
       * @property {string} ticker - The ticker symbol of the current company.
       * @property {string} companyName - The name of the current company.
       * @property {object|null} dashboardData - The dashboard data for the current company.
       */
      currentCompany: {
        ticker: '',
        companyName: '',
        dashboardData: null,
      },
    };
  },
  /**
   * Lifecycle hook: Called after the instance is created.
   * Initiates loading of all company dashboard data.
   */
  async created() {
    await this.loadAllCompanyDashboardData();
    // Select the first company by default if data is loaded successfully
    if (!this.error && this.magnificentSeven.every(c => c.dashboardData && c.dashboardData.cardData)) {
      this.selectCompany(this.magnificentSeven[0].ticker);
    }
  },
  methods: {
    /**
     * Loads dashboard data for all companies in the `magnificentSeven` array.
     * Sets `isLoading` and `error` states accordingly.
     * @async
     * @returns {Promise<void>}
     */
    async loadAllCompanyDashboardData() {
      this.isLoading = true;
      this.error = null;
      try {
        const fetchPromises = this.magnificentSeven.map(async company => {
          const dashboardData = await stockService.getCompanyDashboardData(`$${company.ticker}`);
          company.dashboardData = dashboardData;
          return company;
        });
        await Promise.all(fetchPromises);
        console.log("All company dashboard data loaded and updated:", this.magnificentSeven);
      } catch (err) {
        console.error("Error loading all company dashboard data:", err);
        this.error = "Fehler beim Laden der Unternehmensdaten.";
      } finally {
        this.isLoading = false;
      }
    },
    /**
     * Sets the `currentCompany` to the company matching the provided ticker.
     * @param {string} ticker - The ticker symbol of the company to select.
     * @returns {void}
     */
    selectCompany(ticker) {
      this.currentCompany = this.magnificentSeven.find(c => c.ticker === ticker);
      console.log(`Selected company:`, this.currentCompany);
    },
  },
};
</script>

<style>
body {
  margin: 0;
  background: radial-gradient(71.11% 100% at 50% 0%, #020204 14.6%, #011F35 100%);
  font-family: 'Arial', sans-serif;
  color: white;
}

#app {
  width: 100vw;
  min-height: 100vh;
  padding: 50px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.company-selection {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 30px;
  justify-content: center;
  width: 100%;
  max-width: 1000px;
}

.company-selection button {
  background-color: #011F35;
  color: #87CEEB;
  border: 1px solid #007bff;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease;
  font-size: 1em;
  font-weight: 600;
}

.company-selection button:hover {
  background-color: #0056b3;
  border-color: #0056b3;
  color: white;
}

.company-selection button.active {
  background-color: #007bff;
  border-color: #007bff;
  color: white;
  font-weight: bold;
  box-shadow: 0 0 10px rgba(0, 123, 255, 0.5);
}

.dashboard-main-wrapper {
  width: 100%;
  max-width: 1223px;
}

.loading-state, .error-state, .no-data-message {
  text-align: center;
  padding: 20px;
  font-size: 1.2em;
  color: #ddd;
}
.error-state {
  color: #ff6b6b;
}

@media (max-width: 768px) {
  #app {
    padding: 30px 15px;
  }
  .company-selection button {
    padding: 8px 12px;
    font-size: 0.9em;
  }
}
</style>