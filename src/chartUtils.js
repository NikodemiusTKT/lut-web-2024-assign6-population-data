export function createChartData(years, population) {
  return {
    labels: years,
    datasets: [
      {
        name: "Population",
        values: population,
      },
    ],
  };
}

export function renderChart(chartContainer, chart, chartData, title) {
  if (!chartContainer) {
    console.error("Chart container not found.");
    return;
  }

  if (!chart) {
    chart = new frappe.Chart(chartContainer, {
      title,
      height: 450,
      type: "line",
      colors: ["#eb5146"],
      data: chartData,
    });
  } else {
    chart.update(chartData);
  }

  return chart;
}

export function validateChartData(chartData) {
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
}
