import dataFetcher from "./DataFetcher.js";
import stateManager from "./StateManager.js";
import { createChartData, renderChart } from "./chartModule.js";

class BirthsDeathsData {
  constructor(dataFetcher, stateManager) {
    if (BirthsDeathsData.instance) {
      console.log("Instance already exists");
      return BirthsDeathsData.instance;
    }
    this.dataFetcher = dataFetcher;
    this.stateManager = stateManager;
    this.chart = null;
    this.chartContainer = null;
    this.currentMunicipality = stateManager.getCurrentMunicipality();
    stateManager.subscribe(this);
    BirthsDeathsData.instance = this;
  }

  async onPageLoad() {
    try {
      const combinedData = await this.fetchDataWithCache();
      if (combinedData) {
        this.update(combinedData);
      } else {
        console.error("No data found in localStorage.");
      }
    } catch (error) {
      console.error("Error on page load:", error);
    }
  }
  async fetchDataWithCache() {
    return await this.dataFetcher.fetchDataWithCache(
      this.currentMunicipality.value
    );
  }

  update(data) {
    const { birthData, deathData } = data;
    this.initChart(birthData, deathData);
  }

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
      `Births and Deaths in ${this.currentMunicipality.label}`,
      "bar",
      ["#63d0ff", "#363636"]
    );
  }

  handleStorageChange(event) {
    if (event.key === "currentMunicipality") {
      this.currentMunicipality = JSON.parse(event.newValue);
      this.onPageLoad();
    }
  }
}

const birthsDeathsDataInstance = new BirthsDeathsData();
export default birthsDeathsDataInstance;

window.onload = () => birthsDeathsDataInstance.onPageLoad();
window.addEventListener("storage", (event) =>
  birthsDeathsDataInstance.handleStorageChange(event)
);
