print("script started")
import cv2
import numpy as np
from PIL import Image
import tensorflow as tf
from tensorflow.keras.losses import MeanSquaredError
import os

# Step 1: Define the path to your .h5 model file
model_path = r'C:\Users\kisho\OneDrive\Desktop\crowd-final\CSRNet_model.h5'  # Using raw string to handle Windows path

# Step 2: Check if the file exists
if not os.path.exists(model_path):
    raise FileNotFoundError(f"Model file not found at: {model_path}")

# Step 3: Load the model
model = tf.keras.models.load_model(
    model_path, 
    custom_objects={'mse': MeanSquaredError()}, 
    compile=False
)

print("✅ Model loaded successfully from:", model_path)
input("Press Enter to exit...")
