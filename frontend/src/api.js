const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

async function readResponse(res) {
  const text = await res.text();
  let data;

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(
      `API returned ${res.status} ${res.statusText} instead of JSON. ` +
      "Check that the backend is running and VITE_API_BASE is correct."
    );
  }

  if (!res.ok) throw new Error(data.error || data.detail || `Request failed (${res.status})`);
  return data;
}

export async function registerEmployee(rollNo, name, photoBlobs) {
  const form = new FormData();
  form.append("rollNo", rollNo);
  form.append("name", name);
  photoBlobs.forEach((blob, i) => form.append("photos", blob, `photo_${i}.jpg`));

  try {
    const res = await fetch(`${API_BASE}/employees`, { method: "POST", body: form });
    return await readResponse(res);
  } catch (err) {
    if (err instanceof TypeError) {
      throw new Error(`Could not connect to the backend at ${API_BASE}. Start the backend and try again.`);
    }
    throw err;
  }
}

export async function listEmployees() {
  const res = await fetch(`${API_BASE}/employees`);
  return res.json();
}

export async function recognizeFrame(frameBlob) {
  const form = new FormData();
  form.append("frame", frameBlob, "frame.jpg");

  const res = await fetch(`${API_BASE}/attendance/recognize`, { method: "POST", body: form });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Recognition failed");
  return data;
}

export async function markAbsentees() {
  const res = await fetch(`${API_BASE}/attendance/mark-absentees`, { method: "POST" });
  return res.json();
}

export async function getAttendance(date) {
  const url = date ? `${API_BASE}/attendance?date=${date}` : `${API_BASE}/attendance`;
  const res = await fetch(url);
  return res.json();
}

export async function getSummary() {
  const res = await fetch(`${API_BASE}/attendance/summary`);
  return res.json();
}
