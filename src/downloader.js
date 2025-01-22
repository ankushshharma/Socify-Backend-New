// src/downloader.js - Updated with better error handling
const axios = require('axios');
const fs = require('fs-extra');

async function downloadFile(url, path) {
  try {
    console.log(`Downloading file from: ${url}`);
    console.log(`Saving to: ${path}`);

    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream',
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const writer = fs.createWriteStream(path);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`File saved successfully to: ${path}`);
        resolve();
      });
      writer.on('error', reject);
    });
  } catch (error) {
    throw new Error(`Failed to download file: ${error.message}`);
  }
}

module.exports = {
  downloadFile
};