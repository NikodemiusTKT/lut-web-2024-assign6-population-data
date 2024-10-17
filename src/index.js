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
          values: ["SSS"], // Assuming "SSS" is the code for the whole country
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
  /**
   * Asynchronously fetches data from a specified URL using a POST request.
   *
   * @async
   * @function fetchData
   * @throws Will throw an error if the HTTP response is not ok.
   * @returns {Promise<Object>} A promise that resolves with the fetched data.
   */
  async fetchData() {
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(this.QUERY),
    };
    try {
      const response = await fetch(this.URL, options);
      if (!response.ok) {
        throw new Error("HTTP error " + response.status);
      }
      const data = await response.json();
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
      const chart = new frappe.Chart(document.getElementById("chart"), {
        title: "Population in Finland",
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
    const data = await this.fetchData();
    if (data) {
      this.initChart(data);
    }
  }
};


// Assign the function to window.onload
window.onload = () => PopulationData.onPageLoad();
