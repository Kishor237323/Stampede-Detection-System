let analysisData = null;
let videoFile = null;

// Drag-and-drop logic
const dropArea = document.getElementById('dropArea');
dropArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropArea.classList.add('dragover');
});
dropArea.addEventListener('dragleave', () => dropArea.classList.remove('dragover'));
dropArea.addEventListener('drop', (e) => {
    e.preventDefault();
    dropArea.classList.remove('dragover');
    const files = e.dataTransfer.files;
    if (files.length) {
        document.getElementById('fileInput').files = files;
        videoFile = files[0];
        showVideoPreview(videoFile);
        document.getElementById('uploadStatus').innerText = `Selected: ${videoFile.name}`;
        document.getElementById('uploadBtn').style.display = 'block';
    }
});

// File input logic
document.getElementById('fileInput').onchange = function(e) {
    videoFile = e.target.files[0];
    showVideoPreview(videoFile);
    document.getElementById('uploadStatus').innerText = `Selected: ${videoFile.name}`;
    document.getElementById('uploadBtn').style.display = 'block';
};

function showVideoPreview(file) {
    const videoURL = URL.createObjectURL(file);
    document.getElementById('videoPlayer').src = videoURL;
    document.getElementById('videoSection').style.display = '';
    document.getElementById('resultsSection').style.display = 'none';
    document.getElementById('realtimeStats').innerText = '';
    document.getElementById('analyzeBtn').disabled = true;
    document.getElementById('analyzeBtn').style.display = 'block';
    
    // Clear previous results
    document.getElementById('metrics').innerHTML = '';
    document.getElementById('riskLevel').innerHTML = '';
    document.getElementById('geminiAnalysis').innerHTML = '';
    document.getElementById('recommendations').innerHTML = '';
    
    // Safely destroy chart if it exists
    if (window.densityChart && typeof window.densityChart.destroy === 'function') {
        window.densityChart.destroy();
    }
    window.densityChart = null;
}

// Upload form logic
document.getElementById('uploadForm').onsubmit = async function(e) {
    e.preventDefault();
    if (!videoFile) {
        document.getElementById('uploadStatus').innerText = "Please select a video file first.";
        return;
    }
    
    document.getElementById('uploadStatus').innerHTML = 'Uploading... <span class="spinner"></span>';
    document.getElementById('uploadBtn').disabled = true;
    
    try {
        const formData = new FormData();
        formData.append('file', videoFile);
        const res = await fetch('/upload', { 
            method: 'POST', 
            body: formData 
        });
        
        if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
        }
        
        const data = await res.json();
        if (data.error) {
            document.getElementById('uploadStatus').innerText = "Error: " + data.error;
            return;
        }
        
        analysisData = data;
        document.getElementById('uploadStatus').innerText = "Upload complete! Click 'Start Analyzing' to see results.";
        document.getElementById('analyzeBtn').disabled = false;
        document.getElementById('uploadBtn').style.display = 'none';
    } catch (err) {
        console.error('Upload error:', err);
        document.getElementById('uploadStatus').innerText = "Upload failed: " + err.message;
        document.getElementById('uploadBtn').disabled = false;
    }
};

// Real-time stats and heatmap overlay (placeholder logic)
document.getElementById('videoPlayer').ontimeupdate = function() {
    if (!analysisData) return;
    const video = this;
    const frame = Math.floor(video.currentTime * 30 / 10) * 10; // match frame_skip
    const frameData = analysisData.densityData.find(d => d.frame === frame);
    if (frameData) {
        document.getElementById('realtimeStats').innerHTML = `
            <b>Crowd Count:</b> ${frameData.count.toFixed(1)}<br>
            <b>Density:</b> ${frameData.density.toFixed(2)} people/m²
        `;
        // Draw heatmap overlay (placeholder: just clear for now)
        const canvas = document.getElementById('heatmapOverlay');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // TODO: Draw actual heatmap using frameData if available from backend
    }
};

// Start analysis button
document.getElementById('analyzeBtn').onclick = function() {
    if (!analysisData) {
        document.getElementById('metrics').innerHTML = '<span style="color:red">No analysis data available. Please upload and process a video first.</span>';
        return;
    }

    // Show loading state
    document.getElementById('analyzeBtn').innerHTML = 'Analyzing... <span class="spinner"></span>';
    document.getElementById('analyzeBtn').disabled = true;

    // Process and display results
    setTimeout(() => {
        // Show metrics
        document.getElementById('metrics').innerHTML = `
            <h3>Key Metrics</h3>
            <p><b>Max Crowd Count:</b> ${analysisData.maxCount}</p>
            <p><b>Max Density:</b> ${analysisData.maxDensity.toFixed(2)} people/m²</p>
        `;

        // Show risk level
        document.getElementById('riskLevel').innerHTML = `
            <h3>Risk Level: <span class="${analysisData.riskLevel.toLowerCase()}">${analysisData.riskLevel}</span></h3>
        `;

        // Show Gemini analysis
        document.getElementById('geminiAnalysis').innerHTML = `
            <h3>Gemini Analysis</h3>
            <pre>${analysisData.geminiAnalysis}</pre>
        `;

        // Show chart
        const ctx = document.getElementById('densityChart').getContext('2d');
        if (window.densityChart) {
            window.densityChart.destroy();
        }
        window.densityChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: analysisData.densityData.map(d => d.frame),
                datasets: [{
                    label: 'Density (people/m²)',
                    data: analysisData.densityData.map(d => d.density),
                    borderColor: '#1976d2',
                    fill: false,
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: true } }
            }
        });

        // Show results section
        document.getElementById('resultsSection').style.display = 'block';
        
        // Reset button state
        document.getElementById('analyzeBtn').innerText = 'Start Analyzing';
        document.getElementById('analyzeBtn').disabled = false;
    }, 800);
};

// Download report functionality
window.downloadReport = function() {
    if (!analysisData) return;
    const report = `
Crowd Analysis Report

Max Crowd Count: ${analysisData.maxCount}
Max Density: ${analysisData.maxDensity.toFixed(2)} people/m²
Risk Level: ${analysisData.riskLevel}

Gemini Analysis:
${analysisData.geminiAnalysis}
    `;
    const blob = new Blob([report], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'crowd_analysis_report.txt';
    link.click();
};