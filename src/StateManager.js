class StateManager {
  constructor() {
    if (StateManager.instance) {
      return StateManager.instance;
    }
    this.observers = [];
    StateManager.instance = this;
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter((obs) => obs !== observer);
  }

  notifyObservers(data) {
    this.observers.forEach((observer) => observer.update(data));
  }

  updateCurrentMunicipality(municipality) {
    localStorage.setItem("currentMunicipality", JSON.stringify(municipality));
    console.log("Current municipality updated:", municipality);
    this.notifyObservers({ currentMunicipality: municipality });
  }

  getCurrentMunicipality() {
    return JSON.parse(localStorage.getItem("currentMunicipality")) || {
      code: "SSS",
      name: "Finland",
    };
  }
}

const stateManagerInstance = new StateManager();
export default stateManagerInstance;