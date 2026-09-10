import cv2
import numpy as np
import face_recognition


def bytes_to_rgb(image_bytes: bytes) -> np.ndarray:
    """Decode raw image bytes into a clean, contiguous 8-bit RGB numpy array.

    Using OpenCV + np.ascontiguousarray here (instead of PIL via
    face_recognition.load_image_file) avoids a known 'Unsupported image type,
    must be 8bit gray or RGB image' error some numpy/dlib version
    combinations raise even on perfectly valid photos.
    """
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    image_bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if image_bgr is None:
        raise ValueError("Could not decode image data")
    image_rgb = cv2.cvtColor(image_bgr, cv2.COLOR_BGR2RGB)
    return np.ascontiguousarray(image_rgb, dtype=np.uint8)


def encode_single_image(image_rgb: np.ndarray):
    """Validate and encode one image.

    Returns (encoding, face_count). encoding is None unless exactly one
    face was found in the image.
    """
    face_locations = face_recognition.face_locations(image_rgb)
    if len(face_locations) != 1:
        return None, len(face_locations)

    encodings = face_recognition.face_encodings(image_rgb, face_locations)
    if not encodings:
        return None, len(face_locations)

    return encodings[0].tolist(), 1


def match_face(face_encoding, database, tolerance=0.6):
    """Compare one face encoding against every person in the database.

    database: list of {"rollNo": str, "name": str, "encodings": [[float, ...], ...]}
    Returns the best-matching person as {"rollNo", "name", "distance"}, or
    None if nobody matches closely enough.
    """
    best_match = None
    best_distance = tolerance
    face_encoding = np.array(face_encoding)

    for person in database:
        person_encodings = np.array(person.get("encodings", []))
        if person_encodings.size == 0:
            continue

        distances = face_recognition.face_distance(person_encodings, face_encoding)
        min_distance = float(np.min(distances))

        if min_distance < best_distance:
            best_distance = min_distance
            best_match = {
                "rollNo": person["rollNo"],
                "name": person["name"],
                "distance": min_distance,
            }

    return best_match
