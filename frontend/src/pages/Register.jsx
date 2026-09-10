import { useRef, useState } from "react";
import { registerEmployee } from "../api.js";

export default function Register() {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [rollNo, setRollNo] = useState("");
  const [name, setName] = useState("");
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState("");
  const [cameraOn, setCameraOn] = useState(false);

  async function startCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    streamRef.current = stream;
    videoRef.current.srcObject = stream;
    setCameraOn(true);
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    setCameraOn(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      setPhotos((prev) => [...prev, blob]);
    }, "image/jpeg", 0.92);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!rollNo.trim() || !name.trim()) {
      setStatus("Roll No and Name are required.");
      return;
    }
    if (photos.length === 0) {
      setStatus("Capture at least one photo first.");
      return;
    }

    setStatus("Registering...");
    try {
      const result = await registerEmployee(rollNo.trim(), name.trim(), photos);
      setStatus(result.message);
      setPhotos([]);
      setRollNo("");
      setName("");
    } catch (err) {
      setStatus(`Error: ${err.message}`);
    }
  }

  return (
    <div className="page">
      <h1>Register a new person</h1>

      <form onSubmit={handleSubmit} className="form">
        <label>
          Roll No
          <input value={rollNo} onChange={(e) => setRollNo(e.target.value)} />
        </label>
        <label>
          Name
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </label>

        <div className="camera-block">
          <video ref={videoRef} autoPlay playsInline muted width={320} height={240} />
          <canvas ref={canvasRef} style={{ display: "none" }} />

          <div className="camera-controls">
            {!cameraOn ? (
              <button type="button" onClick={startCamera}>Start camera</button>
            ) : (
              <>
                <button type="button" onClick={capturePhoto}>
                  Capture photo ({photos.length} captured)
                </button>
                <button type="button" onClick={stopCamera}>Stop camera</button>
              </>
            )}
          </div>
          <p className="hint">Capture 5+ photos, changing angle/expression slightly each time.</p>
        </div>

        <button type="submit">Register</button>
        {status && <p className="status">{status}</p>}
      </form>
    </div>
  );
}
