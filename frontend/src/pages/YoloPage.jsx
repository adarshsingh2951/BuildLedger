import React, { useState } from "react";
import { ScanLine, AlertCircle } from "lucide-react";
import axios from "axios";
import YoloCard from "../components/ui/YoloCard";

export default function YoloPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [resultImageUrl, setResultImageUrl] = useState(null);
  
  const [detectionData, setDetectionData] = useState({});
  const [speedStats, setSpeedStats] = useState(null); 
  const [showModal, setShowModal] = useState(false);

  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:4000";
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    setResultImageUrl(null);
    setFileId(null);
    setDetectionData({});
    setSpeedStats(null);
    setShowModal(false);

    if (!selectedFile) return;
    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Please upload a standard image (JPG, PNG, or WEBP).");
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await axios.post(`${BACKEND_URL}/api/yolo/upload`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      
      setFileId(response.data.file_id);
      setResultImageUrl(response.data.result_url);
      
      if (response.data.detections) setDetectionData(response.data.detections);
      if (response.data.speed) setSpeedStats(response.data.speed);
      
    } catch (err) {
      console.error(err);
      setError("Failed to analyze the image.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = async () => {
    if (fileId) {
      try {
        await axios.post(`${BACKEND_URL}/api/yolo/cleanup`, { fileId: fileId });
      } catch (err) {
        console.error("Cleanup failed:", err);
      }
    }
    setFileId(null);
    setResultImageUrl(null);
    setFile(null);
    setPreview(null);
    setDetectionData({});
    setSpeedStats(null);
    setShowModal(false);
  };

  return (
    <div className="future-page">
      <div className="future-copy">
        <span className="eyebrow">VISION WORKSPACE / ROADMAP</span>
        <h2>Count materials<br /><em>from the field.</em></h2>
        <p>Upload a site image and automatically reconcile visible material quantities with your ledger.</p>
        <div className="future-badge">
          <ScanLine size={17} /> LIVE YOLO INTEGRATION
        </div>
      </div>
      
      <div className="upload-zone">
        <input type="file" accept="image/jpeg, image/png, image/webp" onChange={handleFileChange} />
        
        {resultImageUrl ? (
            <img src={resultImageUrl} alt="YOLO Results" className="yolo-result-img" />
        ) : preview ? (
            <img src={preview} alt="Upload Preview" className="yolo-preview-img" />
        ) : (
          <>
            <ScanLine size={42} />
            <strong>Drop a site image here</strong>
            <small>Only JPEG, PNG, and WEBP formats supported.</small>
          </>
        )}

        {error && (
            <div className="yolo-error-message">
                <AlertCircle size={16} /> <small>{error}</small>
            </div>
        )}

        <div className="yolo-action-buttons">
          {!resultImageUrl ? (
              <button
                className="primary-btn compact"
                disabled={!file || loading}
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleAnalyze(); }}
              >
                {loading ? "Analyzing..." : "Analyze image"}
              </button>
          ) : (
              <button
                className="primary-btn compact results-btn"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowModal(true); }}
              >
                Show Results
              </button>
          )}

          {(file || resultImageUrl) && (
            <button
               className="secondary-btn compact"
               onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleClose(); }}
               disabled={loading}
            >
               Close & Delete
            </button>
          )}
        </div>
      </div>

      {showModal && (
        <YoloCard 
          detectionData={detectionData} 
          speedStats={speedStats} 
          onClose={() => setShowModal(false)} 
        />
      )}
    </div>
  );
}