import { fetchDataWithCache } from "./dataUtils.js";

const BirthsDeathsData = {
  currentMunicipality: JSON.parse(
    localStorage.getItem("currentMunicipality"),
  ) || {
    code: "SSS",
    name: "Finland",
  },
  chart: null,
  chartContainer: null,

  async onPageLoad() {
    try {
      const combinedData = await this.fetchData();
      if (combinedData) {
        const { birthData, deathData } = combinedData;
        this.initChart(birthData, deathData);
      } else {
        console.error("No data found in localStorage.");
      }
    } catch (error) {
      console.error("Error on page load:", error);
    }
  },

  async fetchData() {
    const combinedData = await fetchDataWithCache(
      this.currentMunicipality.code,
    );
    return combinedData;
  },

  initChart(birthData, deathData) {
    const { years, values: births } = birthData;
    const { values: deaths } = deathData;

    if (!years || !births || !deaths) {
      console.error("Data format is incorrect or missing required fields.");
      return;
    }

    const chartData = this.createChartData(years, births, deaths);
    this.renderChart(chartData);
  },

  createChartData(years, births, deaths) {
    return {
      labels: years,
      datasets: [
        {
          name: "Births",
          values: births,
        },
        {
          name: "Deaths",
          values: deaths,
        },
      ],
    };
  },

  renderChart(chartData) {
    if (!this.chartContainer) {
      this.chartContainer = document.getElementById("chart");
    }
    if (!this.chartContainer) {
      console.error("Chart container not found.");
      return;
    }
    if (!this.chart) {
      this.chart = new frappe.Chart(this.chartContainer, {
        title: `Births and Deaths in ${this.currentMunicipality.name}`,
        height: 450,
        type: "bar",
        colors: ["#63d0ff", "#363636"],
        data: chartData,
      });
    } else {
      this.chart.update(chartData);
    }
  },

  handleStorageChange(event) {
    if (event.key === "currentMunicipality") {
      this.currentMunicipality = JSON.parse(event.newValue);
      this.onPageLoad();
    }
  },
};

window.onload = () => BirthsDeathsData.onPageLoad();
window.addEventListener("storage", (event) =>
  BirthsDeathsData.handleStorageChange(event),
);
