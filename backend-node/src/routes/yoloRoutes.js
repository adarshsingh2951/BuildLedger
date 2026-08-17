import express from "express";
import multer from "multer";
import axios from "axios";
import FormData from "form-data";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const router = express.Router();

// FIX 1: Use the absolute UPLOAD_DIR path so files don't get lost in production
const upload = multer({ dest: UPLOAD_DIR });

router.post('/upload', upload.single('image'), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(req.file.path));

        // FIX 2: Replace hardcoded localhost with an environment variable
        // It defaults to localhost for your local testing, but uses the real URL in production
        const pythonServerUrl = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:8000';

        const pythonResponse = await axios.post(`${pythonServerUrl}/detect`, formData, {
            headers: formData.getHeaders()
        });

        fs.unlinkSync(req.file.path);
        res.json(pythonResponse.data);
    } catch (error) {
        console.error("YOLO processing error:", error);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

router.post('/cleanup', (req, res) => {
    const { fileId } = req.body;
    if (!fileId) return res.status(400).send("No file ID");

    const origPath = path.join(UPLOAD_DIR, `orig_${fileId}.jpg`);
    const resPath = path.join(UPLOAD_DIR, `res_${fileId}.jpg`);

    if (fs.existsSync(origPath)) fs.unlinkSync(origPath);
    if (fs.existsSync(resPath)) fs.unlinkSync(resPath);

    res.json({ message: "Images deleted." });
});

export default router;