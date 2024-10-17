# Population Growth Visualization

## Course: CT30A2910 Introduction to Web Programming
### Assignment: Weekly Assignment 6 (2024)

This project aims to visualize population growth data for municipalities in Finland using web technologies. The application fetches data from a public API and displays it using the Frappe Charts library.

## Table of Contents
- [Technologies Used](#technologies-used)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [License](#license)

## Technologies Used
- HTML
- CSS
- JavaScript
- Parcel (Module Bundler)
- Frappe Charts (Charting Library)
- GitHub CLI

## Features
- Fetch population data for the whole country or specific municipalities.
- Display population growth in a line chart.
- Allow users to input municipality codes for data retrieval.
- Predict future population values based on existing data.
- Navigate to a separate page for visualizing births and deaths data.

## Installation
To set up this project locally, follow these steps:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/lut-web-programming-assign6-2024.git
   cd lut-web-programming-assign6-2024
   ```

2. **Install dependencies**:
   Ensure you have Node.js and npm installed. Then, run:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run start
   ```

   Open your browser and navigate to `http://localhost:1234` to view the application.

## Usage
- On page load, the application fetches population data for Finland from the specified API.
- Users can enter a municipality code in the input field and click the "Fetch Data" button to see specific population data.
- The "Add Data Prediction" button generates a predicted future population value based on the existing data.
- Users can navigate to the births and deaths visualization page via the provided link.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

This `README.md` provides a comprehensive overview of your project, making it easy for others to understand its purpose, setup, and contribution guidelines.