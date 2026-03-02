import { useState } from "react";
import * as XLSX from "xlsx";

export default function App() {
  const [excavators, setExcavators] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [scenario, setScenario] = useState(null);
  const [result, setResult] = useState(null);

  // Read Excel file
  const handleEquipmentUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });

      const excSheet = workbook.Sheets["Excavators"];
      const trkSheet = workbook.Sheets["Trucks"];

      const excData = XLSX.utils.sheet_to_json(excSheet);
      const trkData = XLSX.utils.sheet_to_json(trkSheet);

      setExcavators(excData);
      setTrucks(trkData);
    };

    reader.readAsBinaryString(file);
  };

  const handleScenarioUpload = (e) => {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = (evt) => {
      const workbook = XLSX.read(evt.target.result, { type: "binary" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(sheet);
      setScenario(data[0]);
    };

    reader.readAsBinaryString(file);
  };

  const calculate = () => {
    if (!excavators.length || !trucks.length || !scenario) {
      alert("Upload equipment and scenario files first.");
      return;
    }

    const exc = excavators[0];
    const trk = trucks[0];

    const passes = Math.ceil(
      (trk.Payload_t / scenario.density) /
      (exc.Bucket_m3 * scenario.fillFactor / 100)
    );

    const loadingTime = passes * exc.SwingCycle_sec;

    const haulTime = (scenario.haulDistKm / scenario.haulSpeedKmh) * 3600;
    const returnTime = (scenario.haulDistKm / scenario.returnSpeedKmh) * 3600;

    const cycleTime =
      (loadingTime +
        scenario.waitSpotSec +
        haulTime +
        scenario.unloadSec +
        scenario.positionDumpSec +
        returnTime) /
      scenario.dispatchEff;

    const trucksPerExc = Math.ceil(cycleTime / loadingTime);

    setResult({
      passes,
      cycleTime: (cycleTime / 60).toFixed(2),
      trucksPerExc
    });
  };

  return (
    <div style={{ padding: 40, fontFamily: "Arial" }}>
      <h2>Fleet Optimization Engine (Excel Driven)</h2>

      <div style={{ marginBottom: 20 }}>
        <label>Upload Equipment Library (Excel with Excavators & Trucks sheets):</label>
        <br />
        <input type="file" onChange={handleEquipmentUpload} />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Upload Site Scenario (Excel):</label>
        <br />
        <input type="file" onChange={handleScenarioUpload} />
      </div>

      <button onClick={calculate} style={{ padding: "10px 20px" }}>
        Calculate
      </button>

      {result && (
        <div style={{ marginTop: 30 }}>
          <h3>Results</h3>
          <p>Bucket Passes per Truck: {result.passes}</p>
          <p>Total Cycle Time (min): {result.cycleTime}</p>
          <p>Required Trucks per Excavator: {result.trucksPerExc}</p>
        </div>
      )}
    </div>
  );
}
