import populationDataInstance from "./PopulationData";


function debounce(func, wait) {
  let timeout;
  return function (...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

window.onload = () => populationDataInstance.onPageLoad();

document.getElementById("submit-data").addEventListener(
  "click",
  debounce(() => populationDataInstance.handleFetchMunicipalityData(), 300)
);

document.getElementById("input-area").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    populationDataInstance.handleFetchMunicipalityData();
  }
});

document
  .getElementById("add-data")
  .addEventListener("click", () => populationDataInstance.addDataPrediction());

document.getElementById("navigation").addEventListener("click", (event) => {
  event.preventDefault();
  window.location.href = "newchart.html";
});
