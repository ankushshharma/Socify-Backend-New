// server.js
const express = require('express');
const cors = require('cors');
const { downloadContent } = require('./src/instagram-alt'); // Using the alternative downloader
const path = require('path');
const fs = require('fs-extra');
const stream = require('stream');
const { promisify } = require('util');

const app = express()

// Development-only CORS configuration
app.use(cors({
  origin: '*',
  credentials: true
}));

app.use(express.json());

// Serve downloaded files statically
app.use(express.static(path.join(__dirname, 'downloads')));

app.post('/api/download', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ message: 'URL is required' });
    }

    // Download the content
    await downloadContent(url);

    // Get list of downloaded files
    const directories = ['images', 'videos', 'carousels'];
    let downloadedFiles = [];

    for (const dir of directories) {
      const dirPath = path.join(__dirname, 'downloads', dir);
      if (await fs.pathExists(dirPath)) {
        const files = await fs.readdir(dirPath);
        const fileDetails = await Promise.all(
          files.map(async (file) => {
            const stats = await fs.stat(path.join(dirPath, file));
            return {
              name: file,
              downloadUrl: `/api/download/${dir}/${file}`,
              size: formatBytes(stats.size),
              type: dir,
              mimeType: file.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg'
            };
          })
        );
        downloadedFiles = [...downloadedFiles, ...fileDetails];
      }
    }

    res.json({
      message: 'Download completed successfully',
      files: downloadedFiles
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Add a new endpoint for actual file download
app.get('/api/download/:dir/:filename', async (req, res) => {
  try {
    const { dir, filename } = req.params;
    const filePath = path.resolve(__dirname, 'downloads', dir, filename);
    
    console.log('Request params:', { dir, filename });
    console.log('Looking for file at:', filePath);
    
    // Check if directory exists
    const dirPath = path.resolve(__dirname, 'downloads', dir);
    const dirExists = await fs.pathExists(dirPath);
    console.log('Directory exists:', dirExists);
    
    // List files in directory if it exists
    if (dirExists) {
      const files = await fs.readdir(dirPath);
      console.log('Files in directory:', files);
    }
    
    // Check if file exists
    const fileExists = await fs.pathExists(filePath);
    console.log('File exists:', fileExists);

    if (!fileExists) {
      console.log('File not found at path:', filePath);
      return res.status(404).json({ 
        message: 'File not found',
        requestedPath: filePath,
        directory: dir,
        filename: filename
      });
    }

    // Set headers to force download
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', filename.endsWith('.mp4') ? 'video/mp4' : 'image/jpeg');
    
    // Use sendFile with absolute path
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).send('Error downloading file');
      }
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ 
      message: 'Error downloading file',
      error: error.message
    });
  }
});

// Add health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

// Add helper function for formatting file sizes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
