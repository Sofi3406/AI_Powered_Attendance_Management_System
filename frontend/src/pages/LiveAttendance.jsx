import { useEffect, useRef, useState } from "react";
import { markAbsentees, recognizeFrame } from "../api.js";

const SCAN_INTERVAL_MS = 2000;

export default function LiveAttendance() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [running, setRunning] = useState(false);
  const [presentToday, setPresentToday] = useState([]);
  const [log, setLog] = useState([]);

  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    setRunning(true);
    intervalRef.current = setInterval(scanFrame, SCAN_INTERVAL_MS);
  }

  function stop() {
    clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setRunning(false);
  }

  function scanFrame() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || video.videoWidth === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {
      try {
        const result = await recognizeFrame(blob);
        if (result.marked?.length) {
          setPresentToday((prev) => [...prev, ...result.marked]);
          setLog((prev) => [
            ...result.marked.map((m) => `${m.name} marked ${m.status}`),
            ...prev,
          ]);
        }
      } catch (err) {
        setLog((prev) => [`Error: ${err.message}`, ...prev]);
      }
    }, "image/jpeg", 0.85);
  }

  async function handleEndSession() {
    stop();
    const result = await markAbsentees();
    setLog((prev) => [...result.marked.map((m) => `${m.name} marked Absent`), ...prev]);
  }

  useEffect(() => () => stop(), []);

  return (
    <div className="page">
      <h1>Live attendance recognition</h1>

      <video ref={videoRef} autoPlay playsInline muted width={480} height={360} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="camera-controls">
        {!running ? (
          <button onClick={start}>Start session</button>
        ) : (
          <button onClick={handleEndSession}>End session (mark absentees)</button>
        )}
      </div>

      <h2>Marked present this session</h2>
      <ul>
        {presentToday.map((p, i) => (
          <li key={i}>{p.name} ({p.rollNo})</li>
        ))}
      </ul>

      <h2>Activity log</h2>
      <ul className="log">
        {log.map((entry, i) => (
          <li key={i}>{entry}</li>
        ))}
      </ul>
    </div>
  );
}
