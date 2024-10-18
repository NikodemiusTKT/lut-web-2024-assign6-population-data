function createChartData(years, datasets) {
  return {
    labels: years,
    datasets: datasets.map(({ name, values }) => ({
      name,
      values,
    })),
  };
}

function renderChart(
  chartContainer,
  chart,
  chartData,
  title,
  type = "line",
  colors = ["#eb5146"],
) {
  if (!chartContainer) {
    console.error("Chart container not found.");
    return;
  }

  if (!chart) {
    chart = new frappe.Chart(chartContainer, {
      title,
      height: 450,
      type,
      colors,
      data: chartData,
    });
  } else {
    chart.update(chartData);
  }

  return chart;
}

function validateChartData(chartData) {
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
export { createChartData, renderChart, validateChartData };
