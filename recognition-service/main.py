import json
from typing import List

import face_recognition
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from utils import bytes_to_rgb, encode_single_image, match_face

app = FastAPI(title="Face Recognition Service")

# In production, replace "*" with your Node backend's actual URL.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/encode")
async def encode_images(files: List[UploadFile] = File(...)):
    """Validate each uploaded photo and return one face encoding per valid photo.

    Used during registration: the Node backend uploads the photos captured
    in the browser and stores whatever encodings come back.
    """
    encodings = []
    rejected = []

    for upload in files:
        content = await upload.read()

        try:
            image_rgb = bytes_to_rgb(content)
        except ValueError:
            rejected.append({"filename": upload.filename, "reason": "could not decode image"})
            continue

        encoding, face_count = encode_single_image(image_rgb)
        if encoding is None:
            rejected.append({
                "filename": upload.filename,
                "reason": f"expected exactly 1 face, found {face_count}",
            })
            continue

        encodings.append(encoding)

    if not encodings:
        raise HTTPException(status_code=422, detail="No valid face found in any uploaded photo")

    return {"encodings": encodings, "valid_count": len(encodings), "rejected": rejected}


@app.post("/recognize")
async def recognize(
    file: UploadFile = File(...),
    database: str = Form(...),
    tolerance: float = Form(0.6),
):
    """Detect faces in a frame and match each one against a provided database.

    `database` is a JSON string: a list of
    {"rollNo": str, "name": str, "encodings": [[float, ...], ...]}
    The Node backend builds this from MongoDB on every request, so this
    service never needs to store anything itself.
    """
    try:
        known_people = json.loads(database)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail="database must be valid JSON")

    content = await file.read()
    try:
        image_rgb = bytes_to_rgb(content)
    except ValueError:
        raise HTTPException(status_code=400, detail="Could not decode image data")

    face_locations = face_recognition.face_locations(image_rgb)
    face_encodings = face_recognition.face_encodings(image_rgb, face_locations)

    matches = []
    for (top, right, bottom, left), face_encoding in zip(face_locations, face_encodings):
        match = match_face(face_encoding.tolist(), known_people, tolerance=tolerance)
        matches.append({
            "box": {"top": top, "right": right, "bottom": bottom, "left": left},
            "match": match,  # None if nobody matched closely enough
        })

    return {"faces_detected": len(face_locations), "matches": matches}
