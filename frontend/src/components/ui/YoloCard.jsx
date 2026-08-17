import React from "react";
import { ScanLine, Box, X } from "lucide-react";

export default function YoloCard({ detectionData, speedStats, onClose }) {
  
  // Converts exactly what YOLO found into a sorted list. No zeroes.
  const detectedItems = Object.entries(detectionData || {}).sort((a, b) => b[1] - a[1]);
  const totalDetections = detectedItems.reduce((sum, item) => sum + item[1], 0);

  // Safely format speed numbers
  const pre = speedStats?.preprocess ? speedStats.preprocess.toFixed(1) : "0.0";
  const inf = speedStats?.inference ? speedStats.inference.toFixed(1) : "0.0";
  const post = speedStats?.postprocess ? speedStats.postprocess.toFixed(1) : "0.0";

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh",
      backgroundColor: "rgba(0, 0, 0, 0.55)", backdropFilter: "blur(12px)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 9999
    }}>
      <div style={{
        backgroundColor: "#ffffff", borderRadius: "16px", width: "90%", maxWidth: "400px",
        boxShadow: "0 30px 60px rgba(0,0,0,0.3)", overflow: "hidden", border: "1px solid rgba(255,255,255,0.2)"
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: "24px", background: "linear-gradient(to right, #f8f9fa, #ffffff)",
          borderBottom: "1px solid #eaeaea", display: "flex", justifyContent: "space-between", alignItems: "flex-start"
        }}>
          <div>
            <h3 style={{ margin: 0, color: "#111", display: "flex", alignItems: "center", gap: "10px", fontSize: "1.25rem" }}>
              <ScanLine size={22} color="#000" /> Vision Report
            </h3>
            <p style={{ margin: "6px 0 0 0", fontSize: "14px", color: "#666", fontWeight: "500" }}>
              {totalDetections} total objects identified
            </p>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "#999", padding: "4px" }}>
            <X size={20} />
          </button>
        </div>

        {/* Dynamic Detected Items List */}
        <div style={{ padding: "16px 24px", maxHeight: "350px", overflowY: "auto" }}>
          {detectedItems.length > 0 ? (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {detectedItems.map(([name, count], index) => (
                <li key={name} style={{ 
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "14px 0", borderBottom: index === detectedItems.length - 1 ? "none" : "1px solid #f0f0f0"
                }}>
                  <span style={{ fontSize: "16px", color: "#222", textTransform: "capitalize", display: "flex", alignItems: "center", gap: "8px", fontWeight: "500" }}>
                    <Box size={16} color="#888" /> {name}
                  </span>
                  <span style={{ 
                    backgroundColor: "#111", color: "#fff", padding: "6px 14px", 
                    borderRadius: "8px", fontSize: "15px", fontWeight: "700", boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                  }}>
                    {count}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <div style={{ padding: "30px 0", textAlign: "center", color: "#888" }}>
              <ScanLine size={32} style={{ opacity: 0.2, marginBottom: "10px" }} />
              <p style={{ margin: 0 }}>No recognized materials in frame.</p>
            </div>
          )}
        </div>

        {/* Technical Terminal Footer */}
        <div style={{ 
          padding: "16px 24px", backgroundColor: "#0d1117", color: "#00ff41",
          fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace",
          fontSize: "12px", borderTop: "1px solid #222"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", opacity: 0.8, color: "#8b949e" }}>
            <span>PROCESS</span><span>LATENCY</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>preprocess</span><span>{pre}ms</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
            <span>inference</span><span>{inf}ms</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span>postprocess</span><span>{post}ms</span>
          </div>
        </div>

      </div>
    </div>
  );
}