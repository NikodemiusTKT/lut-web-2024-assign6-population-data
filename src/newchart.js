const BirthsDeathsData = {
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
          values: ["vm01", "vm11"], // Assuming these are the codes for births and deaths data
        },
      },
    ],
    response: {
      format: "json-stat2",
    },
  },
  chart: null, // Reference to the chart instance

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
      console.log(data.value)
      const births = data.value.slice(0, years.length); // Assuming births data is first
      const deaths = data.value.slice(years.length); // Assuming deaths data is second

      if (this.chart) {
        this.chart.update({
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
        });
      } else {
        this.chart = new frappe.Chart(document.getElementById("chart"), {
          title: "Births and Deaths in Finland",
          height: 450,
          type: "bar",
          colors: ["#63d0ff", "#363636"],
          data: {
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
    console.log("Page loaded from newchart.js");
    try {
      // Fetch and display data for the whole country
      const data = await this.fetchData(); // Default to "SSS" for whole country
      if (data) {
        this.initChart(data);
      }
    } catch (error) {
      console.error("Error on page load:", error);
    }
  },
};

// Assign the function to window.onload
window.onload = () => BirthsDeathsData.onPageLoad();