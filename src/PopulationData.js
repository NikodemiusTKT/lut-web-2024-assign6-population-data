import dataFetcher from "./DataFetcher.js";
import stateManager from "./StateManager.js";
import { renderChart, createChartData } from "./chartModule.js";

class PopulationData {
  constructor() {
    if (PopulationData.instance) {
      console.log("Instance already exists");
      return PopulationData.instance;
    }
    this.chart = null;
    this.chartContainer = null;
    this.currentMunicipality = stateManager.getCurrentMunicipality();
    stateManager.subscribe(this);
    PopulationData.instance = this;
  }

  async onPageLoad() {
    try {
      console.log("PopulationData -> onPageLoad -> this.currentMunicipality:", this.currentMunicipality.label);
      const data = await dataFetcher.fetchDataWithCache(
        this.currentMunicipality.value
      );

      console.log("PopulationData -> onPageLoad -> data", data);
      if (data) {
        this.update(data);
      } else {
        this.logError("No data found in localStorage.");
      }
    } catch (error) {
      this.logError("Error on page load:", error);
    }
  }

  update(data) {
    console.log("PopulationData -> update -> data", data);
    const { populationData } = data;
    if (populationData && populationData.years && populationData.values) {
      this.initChart(populationData.years, populationData.values);
    } else {
      console.error(
        "PopulationData -> update -> Invalid populationData",
        populationData
      );
    }
  }

  initChart(years, population) {
    if (years && population) {
      const chartData = createChartData(years, [
        { name: "Population", values: population },
      ]);
      this.chart = renderChart(
        this.chartContainer || document.getElementById("chart"),
        this.chart,
        chartData,
        `Population growth in ${this.currentMunicipality.label}`
      );
    } else {
      this.logError("Data format is incorrect or missing required fields.");
    }
  }

  async addDataPrediction() {
    const combinedData = await dataFetcher.fetchDataWithCache(
      this.currentMunicipality.code
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
  }

  addPredictedData(populationData) {
    let { years, values: population } = populationData;
    const lastYear = parseInt(years[years.length - 1]);
    const predictedYear = (lastYear + 1).toString();
    const predictedPopulation = dataFetcher.calculatePrediction(population);

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
  }

  getCacheKey() {
    return `combinedData-${this.currentMunicipality.value}`;
  }

  updateLocalStorage(cacheKey, updatedPopulationData) {
    const cachedData = JSON.parse(localStorage.getItem(cacheKey));
    const dataToStore = {
      ...cachedData,
      populationData: updatedPopulationData,
    };
    localStorage.setItem(cacheKey, JSON.stringify(dataToStore));
  }

  handleStorageChange(event) {
    if (event.key === "currentMunicipality") {
      this.currentMunicipality = JSON.parse(event.newValue);
      console.log("PopulationData -> handleStorageChange -> this.currentMunicipality", this.currentMunicipality);
      this.onPageLoad();
    }
  }

  async handleFetchMunicipalityData() {
    const municipalityInput = document.getElementById("input-area");
    const municipality = municipalityInput.value.trim();

    if (!municipality) {
      this.handleError("Municipality input is empty.");
      return;
    }

    try {
      const codes = await dataFetcher.fetchMunicipalityCodes();
      console.log("handleFetchMunicipalityData -> codes", codes);
      const alueCode = this.findMunicipalityCode(codes, municipality);
      console.log("handleFetchMunicipalityData -> alueCode", alueCode);

      if (alueCode) {
        stateManager.updateCurrentMunicipality(alueCode);
        this.currentMunicipality = alueCode; // Update the currentMunicipality
        console.log("handleFetchMunicipalityData -> this.currentMunicipality", this.currentMunicipality);
        await this.onPageLoad();
      } else {
        this.handleError(`Municipality code for "${municipality}" not found.`);
      }
    } catch (error) {
      this.handleError("Error fetching municipality codes.", error);
    }
  }

  findMunicipalityCode(codes, municipality) {
    return codes.find(
      (code) => code.label.toLowerCase() === municipality.toLowerCase()
    );
  }

  handleError(message, error = null) {
    this.logError(message, error);
    alert(message);
  }

  logError(message, error = null) {
    console.error(message, error);
  }
}

const populationDataInstance = new PopulationData();
export default populationDataInstance;