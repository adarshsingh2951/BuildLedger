import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import os from "os";

const router = express.Router();
const upload = multer({ dest: os.tmpdir() });

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No image uploaded" });
        }

        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        const pythonServerUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

        const pythonResponse = await axios.post(`${pythonServerUrl}/detect`, formData, {
            headers: formData.getHeaders()
        });

        // Immediately delete the temp file from Node's hard drive
        fs.unlinkSync(req.file.path);
        
        res.json(pythonResponse.data);
    } catch (error) {
        console.error("YOLO processing error:", error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).json({ error: 'Failed to process image' });
    }
});

router.post('/cleanup', (req, res) => {
    res.json({ message: "Cleanup handled automatically." });
});

export default router;