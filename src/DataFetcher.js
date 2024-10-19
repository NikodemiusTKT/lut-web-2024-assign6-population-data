const API_URL =
  "https://statfin.stat.fi/PxWeb/api/v1/en/StatFin/synt/statfin_synt_pxt_12dy.px";

const QUERY_TEMPLATE = {
  query: [createYearQuery(), createAreaQuery(), createDataQuery()],
  response: {
    format: "json-stat2",
  },
};

function createYearQuery() {
  return {
    code: "Vuosi",
    selection: {
      filter: "item",
      values: Array.from({ length: 22 }, (_, i) => (2000 + i).toString()),
    },
  };
}

function createAreaQuery() {
  return {
    code: "Alue",
    selection: {
      filter: "item",
      values: ["SSS"], // Placeholder, will be dynamically set based on user input.
    },
  };
}

function createDataQuery() {
  return {
    code: "Tiedot",
    selection: {
      filter: "item",
      values: ["vaesto"],
    },
  };
}

class DataFetcher {
  async fetchDataWithCache(alueCode = "SSS") {
    const cacheKey = `combinedData-${alueCode}`;
    const cachedData = this.getCachedData(cacheKey);
    console.log("DataFetcher -> fetchDataWithCache -> alueCode", alueCode);
    if (cachedData) {
      console.log(`Using cached data for ${alueCode}`);
      return cachedData;
    }

    try {
      const dataTypes = ["vaesto", "vm01", "vm11"];
      const fetchPromises = dataTypes.map((dataType) => {
        const query = this.createQuery(alueCode, dataType);
        const fetchOptions = this.createFetchOptions(query);
        console.log(`DataFetcher -> Query for ${dataType}:`, query);
        return this.fetchDataFromAPI(fetchOptions);
      });
      const [populationData, birthData, deathData] = await Promise.all(
        fetchPromises
      );
      console.log("DataFetcher -> Fetched data:", {
        populationData,
        birthData,
        deathData,
      });
      const municipalityCodes = await this.fetchMunicipalityCodes();

      if (!populationData || !birthData || !deathData) {
        console.error("One or more data types are undefined:", {
          populationData,
          birthData,
          deathData,
        });
        throw new Error("One or more data types are undefined.");
      }

      const combinedData = {
        populationData: this.extractData(populationData),
        birthData: this.extractData(birthData),
        deathData: this.extractData(deathData),
        municipalityCodes,
      };
      localStorage.setItem(cacheKey, JSON.stringify(combinedData));
      console.log(`Fetched and cached data for ${alueCode}`);
      return combinedData;
    } catch (error) {
      console.error("Error fetching data:", error);
      return null;
    }
  }

  getCachedData(cacheKey) {
    const cachedData = localStorage.getItem(cacheKey);
    console.log("DataFetcher -> Cached data:", JSON.parse(cachedData));
    return cachedData ? JSON.parse(cachedData) : null;
  }

  createQuery(alueCode = "SSS", dataCode = "vaesto") {
    const query = { ...QUERY_TEMPLATE };
    query.query.find((q) => q.code === "Alue").selection.values = [alueCode];
    query.query.find((q) => q.code === "Tiedot").selection.values = [dataCode];
    return query;
  }

  createFetchOptions(query) {
    return {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(query),
    };
  }

  async fetchDataFromAPI(options) {
    try {
      const response = await fetch(API_URL, options);
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      const data = await response.json();
      console.log("DataFetcher -> Fetched data from API:", data);
      return data;
    } catch (error) {
      console.error("Error fetching data from API:", error);
      return null;
    }
  }

  async fetchMunicipalityCodes() {
    const cacheKey = "municipalityCodes";
    const cachedData = this.getCachedData(cacheKey);
    if (cachedData) {
      console.log(
        "DataFetcher -> Using cached municipality codes:",
        cachedData.municipalityCodes
      );
      return cachedData.municipalityCodes;
    }

    try {
      const data = await this.fetchMunicipalityData();
      if (!data) {
        throw new Error("No data returned from fetchMunicipalityData");
      }

      const municipalityCodes = this.parseMunicipalityData(data);
      if (!municipalityCodes || municipalityCodes.length === 0) {
        throw new Error("Parsed municipality codes are empty or invalid");
      }

      localStorage.setItem(cacheKey, JSON.stringify({ municipalityCodes }));
      console.log(
        "DataFetcher -> Fetched and cached municipality codes:",
        municipalityCodes
      );
      return municipalityCodes;
    } catch (error) {
      console.error("Error fetching municipality codes:", error);
      return []; // Return an empty array in case of error
    }
  }

  async fetchMunicipalityData() {
    try {
      const response = await fetch(API_URL);
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      const data = await response.json();
      console.log("DataFetcher -> Fetched municipality data:", data);
      return data;
    } catch (error) {
      console.error("Error fetching municipality data:", error);
      return null;
    }
  }

  parseMunicipalityData(data) {
    if (!data || !data.variables || !data.variables[1]) {
      console.error("Invalid municipality data format:", data);
      return [];
    }
    const names = data.variables[1].valueTexts;
    const codes = data.variables[1].values;
    const municipalityCodes = codes.map((code, index) => ({
      label: names[index],
      value: code,
    }));
    console.log("DataFetcher -> Parsed municipality codes:", municipalityCodes);
    return municipalityCodes;
  }

  extractData(data) {
    if (!data || !data.dimension || !data.value) {
      console.error("Invalid data format:", data);
      return { years: [], values: [] };
    }
    const years = Object.keys(data.dimension["Vuosi"].category.label || {});
    const values = data.value;
    return { years, values };
  }

  calculatePrediction(values) {
    const delta = values.slice(1).map((value, index) => value - values[index]);
    const meanDelta = delta.reduce((acc, curr) => acc + curr, 0) / delta.length;
    const newValue = values[values.length - 1] + meanDelta;
    return Math.round(newValue);
  }
}

const dataFetcherInstance = new DataFetcher();
export default dataFetcherInstance;
