import fs from "fs";
import path from "path";

export default function startYoloGarbageCollector(uploadDir) {
    setInterval(() => {
        fs.readdir(uploadDir, (err, files) => {
            if (err) return;
            
            const now = new Date().getTime();
            files.forEach(file => {
                const filePath = path.join(uploadDir, file);
                const stat = fs.statSync(filePath);
                
                if (now > stat.ctimeMs + 3600000) {
                    try {
                        fs.unlinkSync(filePath);
                    } catch (error) {
                        console.error(`Could not delete file ${filePath}`, error);
                    }
                }
            });
        });
    }, 3600000);
}