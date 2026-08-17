from fastapi import FastAPI, UploadFile, File
from ultralytics import YOLO
import uvicorn
import base64
from io import BytesIO
from PIL import Image
import os

app = FastAPI()

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "best.pt")
model = YOLO(MODEL_PATH)

@app.post("/detect")
def detect_objects(file: UploadFile = File(...)):
    try:
        # Read the incoming image directly into RAM
        image = Image.open(file.file)

        # Run the AI model
        results = model.predict(source=image)

        # Dynamically count what is detected
        detections = {}
        if len(results[0].boxes) > 0:
            for c in results[0].boxes.cls:
                class_name = results[0].names[int(c)]
                detections[class_name] = detections.get(class_name, 0) + 1

        speed_stats = results[0].speed 

        # Convert the analyzed picture into a Base64 text string
        result_array = results[0].plot() 
        im = Image.fromarray(result_array[..., ::-1]) 
        
        buffered = BytesIO()
        im.save(buffered, format="JPEG")
        img_base64 = base64.b64encode(buffered.getvalue()).decode("utf-8")

        return {
            "status": "success",
            # Send the text string straight to React
            "result_url": f"data:image/jpeg;base64,{img_base64}",
            "detections": detections, 
            "speed": speed_stats      
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}

if __name__ == "__main__":
    port = int(os.getenv("PORT", 8000))
    # Host must be 0.0.0.0 for Render
    uvicorn.run(app, host="0.0.0.0", port=port)