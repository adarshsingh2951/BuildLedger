from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import uvicorn
import uuid
import os
import shutil
from PIL import Image

app = FastAPI()



BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best.pt")
model = YOLO(MODEL_PATH)
UPLOAD_DIR = os.path.join(BASE_DIR, "../uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

NODE_BACKEND_URL = os.getenv("NODE_BACKEND_URL", "http://localhost:4000")

@app.post("/detect")
def detect_objects(file: UploadFile = File(...)):
    unique_id = str(uuid.uuid4())
    original_path = os.path.join(UPLOAD_DIR, f"orig_{unique_id}.jpg")
    result_path = os.path.join(UPLOAD_DIR, f"res_{unique_id}.jpg")

    try:
        with open(original_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        results = model.predict(source=original_path)

        # 1. Dynamically count ONLY what is detected (no hardcoding)
        detections = {}
        if len(results[0].boxes) > 0:
            for c in results[0].boxes.cls:
                class_name = results[0].names[int(c)]
                detections[class_name] = detections.get(class_name, 0) + 1

        # 2. Grab the exact speed dictionary from YOLO
        speed_stats = results[0].speed 

        result_array = results[0].plot() 
        im = Image.fromarray(result_array[..., ::-1]) 
        im.save(result_path)

        return {
            "status": "success",
            "file_id": unique_id,
            "result_url": f"{NODE_BACKEND_URL}/uploads/res_{unique_id}.jpg",
            "detections": detections, 
            "speed": speed_stats      
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="127.0.0.1", port=port)