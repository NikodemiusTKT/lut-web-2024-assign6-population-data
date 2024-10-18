class ChartFactory {
  static createChart(type, container, data, options) {
    switch (type) {
      case "line":
        return new LineChart(container, data, options);
      case "bar":
        return new BarChart(container, data, options);
      default:
        throw new Error("Unknown chart type");
    }
  }
}

class LineChart {
  constructor(container, data, options) {
    return new frappe.Chart(container, {
      ...options,
      type: "line",
      data,
    });
  }
}

class BarChart {
  constructor(container, data, options) {
    return new frappe.Chart(container, {
      ...options,
      type: "bar",
      data,
    });
  }
}

export default ChartFactory;
