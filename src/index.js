import {
  fetchDataWithCache,
  fetchMunicipalityCodes,
  debounce,
  calculatePrediction,
} from "./dataUtils.js";

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
      const { populationData, birthData, deathData } = combinedData;
      this.initChart(populationData.years, populationData.values);
      return combinedData;
    }
    return null;
  },

  initChart(years, population) {
    if (years && population) {
      const chartData = this.createChartData(years, population);
      this.renderChart(chartData);
    } else {
      this.logError("Data format is incorrect or missing required fields.");
    }
  },

  createChartData(years, population) {
    return {
      labels: years,
      datasets: [
        {
          name: "Population",
          values: population,
        },
      ],
    };
  },

  renderChart(chartData) {
    this.chartContainer =
      this.chartContainer || document.getElementById("chart");

    if (!this.chartContainer) {
      this.logError("Chart container not found.");
      return;
    }

    if (!this.validateChartData(chartData)) {
      this.logError("Invalid chart data.");
      return;
    }

    if (this.chart) {
      this.chart.update(chartData);
    } else {
      this.chart = new frappe.Chart(this.chartContainer, {
        title: `Population growth in ${this.currentMunicipality.name}`,
        height: 450,
        type: "line",
        colors: ["#eb5146"],
        data: chartData,
      });
    }
  },

  validateChartData(chartData) {
    const { labels, datasets } = chartData;
    if (!labels || !datasets) return false;

    for (const label of labels) {
      if (label === undefined || label === null) return false;
    }

    for (const dataset of datasets) {
      if (!dataset.values) return false;
      for (const value of dataset.values) {
        if (value === undefined || value === null) return false;
      }
    }

    return true;
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
    console.log("predicting data", years, population);
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

  updateDataPoint(label, valueFromEachDataset, index = null) {
    if (this.chart) {
      if (index !== null) {
        this.chart.addDataPoint(label, valueFromEachDataset, index);
      } else {
        this.chart.addDataPoint(label, valueFromEachDataset);
      }
    } else {
      this.logError("Chart instance not found.");
    }
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
