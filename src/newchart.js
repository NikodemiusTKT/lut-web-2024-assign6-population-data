import { fetchDataWithCache } from "./dataUtils.js";
import {
  createChartData,
  renderChart,
  validateChartData,
} from "./chartUtils.js";

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
    return await fetchDataWithCache(this.currentMunicipality.code);
  },

  initChart(birthData, deathData) {
    const { years, values: births } = birthData;
    const { values: deaths } = deathData;

    if (!years || !births || !deaths) {
      console.error("Data format is incorrect or missing required fields.");
      return;
    }

    const chartData = createChartData(years, [
      { name: "Births", values: births },
      { name: "Deaths", values: deaths },
    ]);
    this.chart = renderChart(
      this.chartContainer || document.getElementById("chart"),
      this.chart,
      chartData,
      `Births and Deaths in ${this.currentMunicipality.name}`,
      "bar",
      ["#63d0ff", "#363636"],
    );
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
