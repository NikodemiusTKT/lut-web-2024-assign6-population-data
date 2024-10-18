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

async function fetchDataWithCache(alueCode) {
  const cacheKey = `combinedData-${alueCode}`;
  const cachedData = getCachedData(cacheKey);
  if (cachedData) return cachedData;

  try {
    const dataTypes = ["vaesto", "vm01", "vm11"];
    const fetchPromises = dataTypes.map((dataType) =>
      fetchDataFromAPI(createFetchOptions(createQuery(alueCode, dataType))),
    );
    const [populationData, birthData, deathData] =
      await Promise.all(fetchPromises);
    const municipalityCodes = await fetchMunicipalityCodes();

    const combinedData = {
      populationData: extractData(populationData),
      birthData: extractData(birthData),
      deathData: extractData(deathData),
      municipalityCodes,
    };
    localStorage.setItem(cacheKey, JSON.stringify(combinedData));
    return combinedData;
  } catch (error) {
    console.error("Error fetching data:", error);
  }
  return null;
}

function extractData(data) {
  const years = Object.keys(data?.dimension?.["Vuosi"]?.category?.label || {});
  const values = data?.value;
  return { years, values };
}

function getCachedData(cacheKey) {
  const cachedData = localStorage.getItem(cacheKey);
  return cachedData ? JSON.parse(cachedData) : null;
}

function createQuery(alueCode, dataCode) {
  const query = { ...QUERY_TEMPLATE };
  query.query.find((q) => q.code === "Alue").selection.values = [alueCode];
  query.query.find((q) => q.code === "Tiedot").selection.values = [dataCode];
  return query;
}

function createFetchOptions(query) {
  return {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(query),
  };
}

async function fetchDataFromAPI(options) {
  const response = await fetch(API_URL, options);
  if (!response.ok) {
    throw new Error("HTTP error " + response.status);
  }
  return response.json();
}

async function fetchMunicipalityCodes() {
  const cacheKey = "municipalityCodes";
  const cachedData = getCachedData(cacheKey);
  if (cachedData) return cachedData.municipalityCodes;

  try {
    const data = await fetchMunicipalityData();
    const municipalityCodes = parseMunicipalityData(data);
    localStorage.setItem(cacheKey, JSON.stringify({ municipalityCodes }));
    return municipalityCodes;
  } catch (error) {
    console.error("Error fetching municipality codes:", error);
    return []; // Return an empty array in case of error
  }
}

async function fetchMunicipalityData() {
  const response = await fetch(API_URL);
  if (!response.ok) {
    throw new Error("HTTP error " + response.status);
  }
  return response.json();
}

function parseMunicipalityData(data) {
  const names = data.variables[1].valueTexts;
  const codes = data.variables[1].values;
  return codes.map((code, index) => ({
    label: names[index],
    value: code,
  }));
}

function calculatePrediction(values) {
  const delta = values.slice(1).map((value, index) => value - values[index]);
  const meanDelta = delta.reduce((acc, curr) => acc + curr, 0) / delta.length;
  const newValue = values[values.length - 1] + meanDelta;
  return Math.round(newValue);
}

function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export {
  fetchDataWithCache,
  fetchMunicipalityCodes,
  calculatePrediction,
  debounce,
};
