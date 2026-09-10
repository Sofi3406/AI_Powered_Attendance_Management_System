import { useEffect, useState } from "react";
import { getAttendance, getSummary } from "../api.js";

export default function Reports() {
  const [date, setDate] = useState("");
  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState([]);

  async function loadRecords(filterDate) {
    const data = await getAttendance(filterDate || undefined);
    setRecords(data);
  }

  async function loadSummary() {
    const data = await getSummary();
    setSummary(data);
  }

  useEffect(() => {
    loadRecords();
    loadSummary();
  }, []);

  return (
    <div className="page">
      <h1>Attendance reports</h1>

      <div className="filter-row">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <button onClick={() => loadRecords(date)}>Filter</button>
        <button
          onClick={() => {
            setDate("");
            loadRecords();
          }}
        >
          Clear
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Time</th>
            <th>Roll No</th>
            <th>Name</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r._id}>
              <td>{r.date}</td>
              <td>{r.time}</td>
              <td>{r.rollNo}</td>
              <td>{r.name}</td>
              <td>{r.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Summary by person</h2>
      <table>
        <thead>
          <tr>
            <th>Roll No</th>
            <th>Name</th>
            <th>Status</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          {summary.map((s, i) => (
            <tr key={i}>
              <td>{s._id.rollNo}</td>
              <td>{s._id.name}</td>
              <td>{s._id.status}</td>
              <td>{s.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
