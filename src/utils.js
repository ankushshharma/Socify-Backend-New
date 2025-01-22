const fs = require('fs-extra');
const config = require('../config');

function extractMediaId(url) {
  // Handle various Instagram URL formats
  const urlPatterns = [
    /instagram\.com\/p\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/reel\/([A-Za-z0-9_-]+)/,
    /instagram\.com\/tv\/([A-Za-z0-9_-]+)/
  ];

  for (const pattern of urlPatterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Remove any query parameters and return clean shortcode
      return match[1].split('?')[0];
    }
  }
  
  throw new Error('Invalid Instagram URL format. Please provide a valid Instagram post, reel, or IGTV URL.');
}

async function setupDirectories() {
  await Promise.all([
    fs.ensureDir(config.downloadPath.images),
    fs.ensureDir(config.downloadPath.videos),
    fs.ensureDir(config.downloadPath.carousels)
  ]);
}

module.exports = {
  extractMediaId,
  setupDirectories
};