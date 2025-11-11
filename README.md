🧠 Stampede Detection System

A deep learning–based system designed to detect and predict potential stampede risks in crowded environments using computer vision and AI-driven risk assessment.

🚀 Overview

Crowd stampedes in public spaces like stadiums, festivals, and transport hubs pose severe safety risks.
This project provides a real-time solution that:

Analyzes live or recorded video feeds to estimate crowd density.

Detects abnormal motion patterns and possible fall events.

Assesses stampede risk levels using Google Gemini LLM for contextual reasoning.

Delivers actionable insights via a Flask-based web interface.

⚙️ Features

🎥 Real-time video frame processing

👥 Crowd counting using CSRNet

🚨 Fall detection and motion anomaly analysis using YOLOv8

🧩 AI-generated risk assessment via Gemini LLM

🌐 Flask web dashboard for visualization and report generation

🧰 Tech Stack

Languages & Libraries:

Python, OpenCV, Flask, TensorFlow / PyTorch

CSRNet, YOLOv8, Gemini API

Tools:

Google Colab / VS Code

GitHub, Google Drive (for model storage)

🧑‍💻 How It Works

Video Input: Upload live or recorded video to the Flask interface.

Frame Extraction: The system processes frames at fixed intervals.

Crowd Counting: CSRNet generates density maps and counts people per frame.

Fall Detection: YOLOv8 identifies individuals who have fallen or are in distress.

Risk Analysis: Gemini LLM evaluates the data and predicts stampede likelihood.

Output: Real-time alerts and visual overlays showing risk zones.

📦 Installation
# Clone the repository
git clone https://github.com/Kishor237323/Stampede-Detection-System.git

# Navigate to the project folder
cd Stampede-Detection-System

# Install dependencies
pip install -r requirements.txt

▶️ Usage
# Run Flask server
python app.py


Then open your browser and go to:
http://127.0.0.1:5000

Upload your video and view the crowd analysis in real time.

📁 Pre-trained Model

The pre-trained CSRNet model (CSRNet_model.h5, 155 MB) is not stored in this repository due to GitHub file size limits.
Download it from Google Drive:
👉 (https://drive.google.com/file/d/1vdQwBmqFEOVp2lu-Rz2RquBzuuzVjRzC/view?usp=sharing)

Place the file in your project root folder before running the app.

📈 Results

Achieved accurate real-time crowd density estimation.

Risk levels automatically classified as Low, Moderate, High, or Critical.

Successful Flask deployment with interactive dashboard.

🔮 Future Enhancements

Real-time CCTV stream monitoring

Integration with IoT-based alert systems

Multi-camera analysis for large venues

Optimization for edge devices

👨‍💻 Contributors

C. H. Prabhu Kishor

Harsha Kumar S. M

Harshan Gowda K S
Under the guidance of Dr. Arulkumaran G,
Associate Professor, School of Computing & IT, REVA University.

📜 License

This project is open-source and available under the MIT License.
