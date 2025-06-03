<template>
  <div class="top-card-container">
    <div class="company-cards-row">
      <CompanyMetricCard
        v-for="company in companiesData"
        :key="company.ticker"
        :company="company"
        :is-active="company.ticker === selectedCompanyTicker"
      />
    </div>
  </div>
</template>

<script>
import CompanyMetricCard from './CompanyMetricCard.vue';

export default {
  name: 'TopCard',
  components: {
    CompanyMetricCard
  },
  props: {
    /**
     * An array of company objects, each containing its logo and dashboard data.
     * @type {Array<object>}
     * @default []
     */
    companiesData: {
      type: Array,
      default: () => []
    },
    /**
     * The ticker symbol of the currently selected company, used for visual highlighting.
     * @type {string}
     * @default ''
     */
    selectedCompanyTicker: {
      type: String,
      default: ''
    }
  }
};
</script>

<style scoped>
.top-card-container {
  background-color: #000a14;
  border-radius: 15px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.7);
  padding: 15px 20px;
  margin-bottom: 30px;
  border: 1px solid rgba(0, 123, 255, 0.3);
  width: 100%;
  box-sizing: border-box;
  overflow-x: scroll;
}

.company-cards-row {
  display: flex;
  gap: 25px;
}

@media (max-width: 768px) {
  .top-card-container {
    padding: 20px 25px;
  }
  .company-cards-row {
    flex-direction: column;
    align-items: center;
  }
}
</style>