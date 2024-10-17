const PopulationData = {
  URL: "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/statfin_synt_pxt_12dy.px",
  QUERY: {
    query: [
      {
        code: "Vuosi",
        selection: {
          filter: "item",
          values: [
            "2000",
            "2001",
            "2002",
            "2003",
            "2004",
            "2005",
            "2006",
            "2007",
            "2008",
            "2009",
            "2010",
            "2011",
            "2012",
            "2013",
            "2014",
            "2015",
            "2016",
            "2017",
            "2018",
            "2019",
            "2020",
            "2021",
            "2022",
            "2023",
          ],
        },
      },
      {
        code: "Alue",
        selection: {
          filter: "item",
          values: ["SSS"], // This will be dynamically set
        },
      },
      {
        code: "Tiedot",
        selection: {
          filter: "item",
          values: ["vaesto"], // Assuming "vaesto" is the code for population data
        },
      },
    ],
    response: {
      format: "json-stat2",
    },
  },
  populationData: null, // Cache for population data
  municipalityCodes: null, // Cache for municipality codes
  chart: null, // Reference to the chart instance
  currentMunicipality: "SSS", // Cache for the current municipality

  /**
   * Fetches municipality codes from the API.
   *
   * @async
   * @function fetchMunicipalityCodes
   * @returns {Promise<Array>} A promise that resolves with the municipality codes.
   */
  async fetchMunicipalityCodes() {
    if (this.municipalityCodes) {
      return this.municipalityCodes;
    }
    try {
      const response = await fetch(this.URL);
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      const data = await response.json();
      const names = Object.values(data.variables[1].valueTexts);
      const codes = Object.values(data.variables[1].values);
      this.municipalityCodes = codes.map((code, index) => ({
        label: names[index],
        value: code,
      }));
      localStorage.setItem(
        "municipalityCodes",
        JSON.stringify(this.municipalityCodes)
      ); // Cache in local storage
      return this.municipalityCodes;
    } catch (error) {
      console.error("Error fetching municipality codes:", error);
    }
  },

  /**
   * Asynchronously fetches data from a specified URL using a POST request.
   *
   * @async
   * @function fetchData
   * @param {string} alueCode - The code for the municipality.
   * @throws Will throw an error if the HTTP response is not ok.
   * @returns {Promise<Object>} A promise that resolves with the fetched data.
   */
  async fetchData(alueCode = "SSS") {
    const query = { ...this.QUERY };
    query.query.find((q) => q.code === "Alue").selection.values = [alueCode];

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(query),
    };

    try {
      const response = await fetch(this.URL, options);
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      const data = await response.json();
      localStorage.setItem(`populationData-${alueCode}`, JSON.stringify(data)); // Cache in local storage
      return data;
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  },

  /**
   * Initializes the Frappe chart with the fetched data.
   *
   * @function initChart
   * @param {Object} data - The data fetched from the API.
   */
  initChart(data) {
    if (data?.dimension?.["Vuosi"]?.category?.label && data?.value) {
      const years = Object.keys(data.dimension["Vuosi"].category.label);
      const population = data.value;
      if (this.chart) {
        this.chart.update({
          labels: years,
          datasets: [
            {
              name: "Population",
              values: population,
            },
          ],
        });
      } else {
        this.chart = new frappe.Chart(document.getElementById("chart"), {
          title: "Population growth in whole country",
          height: 450,
          type: "line",
          colors: ["#eb5146"],
          data: {
            labels: years,
            datasets: [
              {
                name: "Population",
                values: population,
              },
            ],
          },
        });
      }
    } else {
      console.error("Data format is incorrect or missing required fields.");
    }
  },

  /**
   * Fetches data and initializes the chart on page load.
   *
   * @async
   * @function onPageLoad
   */
  async onPageLoad() {
    try {
      const populationData = localStorage.getItem("populationData");
      // Fetch and cache municipality codes
      const cachedCodes = localStorage.getItem("municipalityCodes");
      if (cachedCodes) {
        this.municipalityCodes = JSON.parse(cachedCodes);
      } else {
        await this.fetchMunicipalityCodes();
      }
      // Fetch and display data for the whole country
      const cachedPopulationData = localStorage.getItem("populationData-SSS");
      let data;
      if (cachedPopulationData) {
        data = JSON.parse(cachedPopulationData);
      } else {
        data = await this.fetchData();
      }
      if (data) {
        this.initChart(data);
      }
    } catch (error) {
      console.error("Error on page load:", error);
    }
  },
  /**
   * Fetches population data for a specific municipality and updates the chart.
   *
   * @async
   * @function fetchAndDisplayMunicipalityData
   * @param {string} alueCode - The code for the municipality.
   */
  async fetchAndDisplayMunicipalityData(alueCode) {
    const cachedData = localStorage.getItem(`populationData-${alueCode}`);
    let data;
    if (cachedData) {
      data = JSON.parse(cachedData);
    } else {
      data = await this.fetchData(alueCode);
    }
    if (data) {
      this.currentMunicipality = alueCode; // Update the current municipality
      this.initChart(data);
    }
  },
  // adds data prediction to chart
  async addDataPrediction() {
    const cachedData = localStorage.getItem(`populationData-${this.currentMunicipality}`);
    let data;
    if (cachedData) {
      data = JSON.parse(cachedData);
    } else {
      data = await PopulationData.fetchData(this.currentMunicipality);
      localStorage.setItem(`populationData-${this.currentMunicipality}`, JSON.stringify(data));
    }

    if (data?.dimension?.["Vuosi"]?.category?.label && data?.value) {
      const years = Object.keys(data.dimension["Vuosi"].category.label);
      const population = data.value;

      // Add a predicted data point (e.g., for the next year)
      const lastYear = parseInt(years[years.length - 1]);
      const predictedYear = (lastYear + 1).toString();
      const predictedPopulation = calculatePrediction(population);
      console.log(
        `Predicted population for ${predictedYear}: ${predictedPopulation}`
      );

      years.push(predictedYear);
      population.push(predictedPopulation);

      // Draw the new chart with the predicted data point
      this.chart.update({
        labels: [...years, predictedYear],
        datasets: [
          {
            name: "Population",
            values: [...population, predictedPopulation],
          },
        ],
      });
    } else {
      console.error("Data format is incorrect or missing required fields.");
    }
  },
};

// Assign the function to window.onload
window.onload = () => PopulationData.onPageLoad();

/**
 * Debounce function to limit the rate at which a function can fire.
 *
 * @param {Function} func - The function to debounce.
 * @param {number} wait - The number of milliseconds to wait before invoking the function.
 * @returns {Function} - The debounced function.
 */
function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

/**
 * Handles user input and fetches data for the specified municipality.
 *
 * This function retrieves the value from the input field, validates it, and then
 * fetches the corresponding municipality code. If the code is found, it fetches
 * and displays the data for that municipality. If any errors occur during the
 * process, appropriate error messages are logged and optionally displayed to the user.
 *
 * @async
 * @function handleFetchMunicipalityData
 */
async function handleFetchMunicipalityData() {
  const municipalityInput = document.getElementById("input-area");
  const municipality = municipalityInput.value.trim();
  if (!municipality) {
    console.error("Municipality input is empty.");
    // Optionally, display an error message to the user
    alert("Municipality input is empty.");
    return;
  }
  try {
    const codes = await PopulationData.fetchMunicipalityCodes();
    const alueCode = codes.find(
      (code) => code.label.toLowerCase() === municipality.toLowerCase()
    );

    if (alueCode) {
      PopulationData.fetchAndDisplayMunicipalityData(alueCode.value);
    } else {
      console.error(`Municipality code for "${municipality}" not found.`);
      // Optionally, display an error message to the user
      alert(`Municipality code for "${municipality}" not found.`);
    }
  } catch (error) {
    console.error("Error fetching municipality codes:", error);
    // Optionally, display an error message to the user
    alert("Error fetching municipality codes.");
  }
}

/**
 * Calculates the predicted next value in a series based on the average change between consecutive values.
 *
 * @param {number[]} values - An array of numerical values representing the series.
 * @returns {number} The predicted next value in the series.
 */
function calculatePrediction(values) {
  const delta = values.slice(1).map((value, index) => value - values[index]);
  const meanDelta = delta.reduce((acc, curr) => acc + curr, 0) / delta.length;
  const newValue = values[values.length - 1] + meanDelta;
  return newValue;
}
document
  .getElementById("submit-data")
  .addEventListener("click", debounce(handleFetchMunicipalityData, 300));

document.getElementById("input-area").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("submit-data").click();
  }
});

document
  .getElementById("add-data")
  .addEventListener("click", () => PopulationData.addDataPrediction());
