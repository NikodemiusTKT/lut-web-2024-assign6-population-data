function functionOne() {
  console.log("Function One executed");
}

function functionTwo() {
  console.log("Function Two executed");
}

function onPageLoad(arg1, arg2) {
  functionOne();
  functionTwo();
}

// Assign the function to window.onload
window.onload = onPageLoad;

document.onload = onPageLoad;
