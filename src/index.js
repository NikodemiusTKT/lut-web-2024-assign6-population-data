import {
  fetchDataWithCache,
  fetchMunicipalityCodes,
  debounce,
  calculatePrediction,
} from "./dataUtils.js";
import {
  createChartData,
  renderChart,
  validateChartData,
} from "./chartUtils.js";

const DEFAULT_MUNICIPALITY = {
  code: "SSS",
  name: "Finland",
};

const PopulationData = {
  chart: null,
  chartContainer: null,
  currentMunicipality:
    JSON.parse(localStorage.getItem("currentMunicipality")) ||
    DEFAULT_MUNICIPALITY,

  async onPageLoad() {
    try {
      const data = await this.fetchAndInitData();
      if (!data) {
        this.logError("No data found in localStorage.");
      }
    } catch (error) {
      this.logError("Error on page load:", error);
    }
  },

  async fetchAndInitData() {
    const combinedData = await fetchDataWithCache(
      this.currentMunicipality.code,
    );
    if (combinedData) {
      const { populationData } = combinedData;
      this.initChart(populationData.years, populationData.values);
      return combinedData;
    }
    return null;
  },

  initChart(years, population) {
    if (years && population) {
      const chartData = createChartData(years, [
        { name: "Population", values: population },
      ]);
      this.chart = renderChart(
        this.chartContainer || document.getElementById("chart"),
        this.chart,
        chartData,
        `Population growth in ${this.currentMunicipality.name}`,
      );
    } else {
      this.logError("Data format is incorrect or missing required fields.");
    }
  },

  async addDataPrediction() {
    const combinedData = await fetchDataWithCache(
      this.currentMunicipality.code,
    );
    if (!combinedData) {
      this.logError("No cached data found.");
      return;
    }

    const { populationData } = combinedData;

    if (!populationData) {
      this.logError("Data format is incorrect or missing required fields.");
      return;
    }

    this.addPredictedData(populationData);
  },

  addPredictedData(populationData) {
    let { years, values: population } = populationData;
    const lastYear = parseInt(years[years.length - 1]);
    const predictedYear = (lastYear + 1).toString();
    const predictedPopulation = calculatePrediction(population);

    if (predictedYear && !isNaN(predictedPopulation)) {
      years.push(predictedYear);
      population.push(predictedPopulation);
    } else {
      this.logError("Predicted year or population is invalid.");
    }

    this.chart.update({
      labels: years,
      datasets: [
        {
          name: "Population",
          values: population,
        },
      ],
    });

    // Update local storage with the new predicted data
    const cacheKey = this.getCacheKey();
    this.updateLocalStorage(cacheKey, populationData);
  },

  getCacheKey() {
    return `combinedData-${this.currentMunicipality.code}`;
  },

  updateLocalStorage(cacheKey, updatedPopulationData) {
    const cachedData = JSON.parse(localStorage.getItem(cacheKey));
    const dataToStore = {
      ...cachedData,
      populationData: updatedPopulationData,
    };
    localStorage.setItem(cacheKey, JSON.stringify(dataToStore));
  },

  handleStorageChange(event) {
    if (event.key === "currentMunicipality") {
      this.currentMunicipality = JSON.parse(event.newValue);
      this.onPageLoad();
    }
  },

  async handleFetchMunicipalityData() {
    const municipalityInput = document.getElementById("input-area");
    const municipality = municipalityInput.value.trim();

    if (!municipality) {
      this.handleError("Municipality input is empty.");
      return;
    }

    try {
      const codes = await fetchMunicipalityCodes();
      const alueCode = this.findMunicipalityCode(codes, municipality);

      if (alueCode) {
        this.updateCurrentMunicipality(alueCode);
        await this.onPageLoad();
      } else {
        this.handleError(`Municipality code for "${municipality}" not found.`);
      }
    } catch (error) {
      this.handleError("Error fetching municipality codes.", error);
    }
  },

  findMunicipalityCode(codes, municipality) {
    return codes.find(
      (code) => code.label.toLowerCase() === municipality.toLowerCase(),
    );
  },

  handleError(message, error = null) {
    this.logError(message, error);
    alert(message);
  },

  logError(message, error = null) {
    console.error(message, error);
  },

  updateCurrentMunicipality(alueCode) {
    const municipalityData = { code: alueCode.value, name: alueCode.label };
    this.currentMunicipality = municipalityData;
    localStorage.setItem(
      "currentMunicipality",
      JSON.stringify(municipalityData),
    );
  },
};

window.onload = () => PopulationData.onPageLoad();

document.getElementById("submit-data").addEventListener(
  "click",
  debounce(() => PopulationData.handleFetchMunicipalityData(), 300),
);

document.getElementById("input-area").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    PopulationData.handleFetchMunicipalityData();
  }
});

document
  .getElementById("add-data")
  .addEventListener("click", () => PopulationData.addDataPrediction());

document.getElementById("navigation").addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = "newchart.html";
});
