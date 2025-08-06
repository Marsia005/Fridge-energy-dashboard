function convertToCsv() {
  const jsonData = JSON.parse(fs.readFileSync('history.json', 'utf8'));
  let csv = "time,wattage\n";
  jsonData.forEach(entry => {
    csv += `${entry.time},${entry.wattage}\n`;
  });

  try {
    fs.writeFileSync('history.csv', csv);
    console.log("✅ CSV updated at " + new Date().toLocaleTimeString());
  } catch (err) {
    if (err.code === 'EBUSY') {
      console.warn("⚠️ 'history.csv' is currently open in Excel. Skipping this update.");
    } else {
      console.error("❌ Unexpected error:", err.message);
    }
  }
}
