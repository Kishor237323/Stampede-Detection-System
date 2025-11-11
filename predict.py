import os
import cv2
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.losses import MeanSquaredError
from flask import Flask, request, jsonify, render_template, send_from_directory
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__, static_folder='static', template_folder='templates')
CORS(app)

UPLOAD_FOLDER = 'uploads'
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Set your model path here
model_path = r"C:\Users\kisho\OneDrive\Desktop\crowd-final\CSRNet_model.h5"

# Load model once at startup
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model file not found at: {model_path}")
model = tf.keras.models.load_model(model_path, custom_objects={'mse': MeanSquaredError()}, compile=False)

# Gemini API key setup
genai.configure(api_key="AIzaSyA-OLKULNEd5sJju0oeM180y6LF_ForJuo")  # Replace with your actual API key

# Configure Gemini model
generation_config = {
    "temperature": 0.7,
    "top_p": 0.8,
    "top_k": 40,
    "max_output_tokens": 2048,
}

safety_settings = [
    {
        "category": "HARM_CATEGORY_HARASSMENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_HATE_SPEECH",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
    {
        "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
        "threshold": "BLOCK_MEDIUM_AND_ABOVE"
    },
]

# Create Gemini model instance
try:
    gemini_model = genai.GenerativeModel(
        model_name="gemini-pro",
        generation_config=generation_config,
        safety_settings=safety_settings
    )
except Exception as e:
    print(f"Error initializing Gemini model: {str(e)}")
    gemini_model = None

def preprocess_image(frame, target_size=(256, 256)):
    resized = cv2.resize(frame, target_size)
    normalized = resized.astype(np.float32) / 255.0
    return np.expand_dims(normalized, axis=0), resized

def calculate_density_metrics(density_map, area_m2=10.0):
    total_count = np.sum(density_map)
    people_per_m2 = (total_count / area_m2) / 3 
    return total_count, people_per_m2

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/upload', methods=['POST'])
def upload_video():
    file = request.files['file']
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    cap = cv2.VideoCapture(filepath)
    frame_skip = 10
    max_count, max_density, max_frame_index = 0, 0, -1
    frame_index = 0
    density_data = []

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_index % frame_skip == 0:
            input_frame, _ = preprocess_image(frame)
            pred_density_map = model.predict(input_frame, verbose=0)[0, :, :, 0]
            count, density = calculate_density_metrics(pred_density_map)
            density_data.append({"frame": frame_index, "count": float(count), "density": float(density)})
            if count > max_count:
                max_count = count
                max_density = density
                max_frame_index = frame_index
        frame_index += 1
    cap.release()

    # Gemini analysis with structured safety assessment
    risk_level = "High" if max_density > 4 else "Medium" if max_density > 2 else "Low"
    
    # Prepare the prompt for Gemini
    prompt = f"""
Analyze the given image and estimate whether the scene indicates a potential stampede or not.

Use the following model-generated data for context:
- Total crowd count: {max_count:.2f}
- People per square meter (density): {max_density:.2f}

1. Check whether these values match what you observe in the image. If they seem inaccurate, estimate based on the image.
2. If a stampede is likely, give urgent safety recommendations.
3. If the crowd is manageable, provide normal crowd control suggestions.
4. Conclude clearly whether there's a stampede risk or not.
"""
    
    # Get analysis from Gemini with timeout
    if gemini_model is None:
        gemini_analysis = """
Crowd Analysis Summary:
- Current crowd density: {:.2f} people/m²
- Total count: {:.2f} people
- Risk Level: {}
""".format(
            max_density,
            max_count,
            risk_level
        )
    else:
        try:
            # Set a timeout of 5 seconds for the API call
            response = gemini_model.generate_content(
                prompt,
                generation_config={"timeout": 5}
            )
            if response and hasattr(response, 'text'):
                gemini_analysis = response.text
            else:
                raise Exception("No valid response from Gemini")
        except Exception as e:
            # If Gemini fails or times out, use the basic analysis
            gemini_analysis = """
Crowd Analysis Summary:
- Current crowd density: {:.2f} people/m²
- Total count: {:.2f} people
- Risk Level: {}
""".format(
                max_density,
                max_count,
                risk_level
            )

    # Prepare the response data
    response_data = {
        "maxCount": float(max_count),
        "maxDensity": float(max_density),
        "densityData": [{"frame": d["frame"], "count": float(d["count"]), "density": float(d["density"])} for d in density_data],
        "riskLevel": risk_level,
        "geminiAnalysis": gemini_analysis
    }

    return jsonify(response_data)

# Optional: serve uploaded files
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(UPLOAD_FOLDER, filename)

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

@app.route('/favicon.ico')
def favicon():
    return send_from_directory(os.path.join(app.root_path, 'static'),
                             'favicon.ico', mimetype='image/vnd.microsoft.icon')

if __name__ == '__main__':
    app.run(debug=True)
