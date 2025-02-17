import express from 'express';
import multer from 'multer';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import Papa from 'papaparse';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
    fs.writeFileSync('uploads/.gitkeep', '');
}

const upload = multer({ dest: 'uploads/' });

// ONLY serve static files from the static directory
app.use('/static', express.static(path.join(__dirname, 'static')));

// Serve index.html from the root
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

[... rest of server.js remains the same ...]