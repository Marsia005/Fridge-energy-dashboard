const fs = require('fs');
const axios = require('axios'); // Assuming you're using axios to call Tuya API

// Simulated API call - replace with your actual API code
async function fetchDataFromTuya() {
  // This should be replaced with your real API call to Tuya
  return {
    time: new Date().toISOString(),
    wattage: Math.floor(Math.random() * 1000 + 1000) // Fake data for testing
  };
}

// Append new data to history.json
function saveToJson(data) {
  let history = [];
  try {
    history = JSON.parse(fs.readFileSync('history.json', 'utf8'));
  } catch (e) {
    // File might not exist yet — that's fine
  }
  history.push(data);
  fs.writeFileSync('history.json', JSON.stringify(history, null, 2));
}

// Convert JSON to CSV
function convertToCsv() {
  const jsonData = JSON.parse(fs.readFileSync('history.json', 'utf8'));
  let csv = "time,wattage\n";
  jsonData.forEach(entry => {
    csv += `${entry.time},${entry.wattage}\n`;
  });
  fs.writeFileSync('history.csv', csv);
  console.log("✅ CSV updated at " + new Date().toLocaleTimeString());
}

// Main function to fetch + save + convert
async function collectAndSave() {
  const data = await fetchDataFromTuya();
  saveToJson(data);
  convertToCsv();
}

// Repeat every 1 minute (60000 ms)
setInterval(collectAndSave, 60000); // or 10000 for every 10 seconds

console.log("🚀 Live data collection started...");
