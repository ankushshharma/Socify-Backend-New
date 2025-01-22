const instagramGetUrl = require("instagram-url-direct");
const { downloadFile } = require('./downloader');
const config = require('../config');

async function downloadContent(url, streamMode = false) {
  try {
    console.log('Fetching media information...');
    const response = await instagramGetUrl(url);
    
    if (!response || (!response.url_list && !response.url_list_v2)) {
      throw new Error('No media found in the response');
    }

    // Get all URLs (both video and image)
    const urls = response.url_list || response.url_list_v2 || [];
    
    if (urls.length === 0) {
      throw new Error('No downloadable URLs found');
    }

    // If there are multiple URLs, it's a carousel
    if (urls.length > 1) {
      console.log(`Downloading carousel with ${urls.length} items...`);
      for (let [index, mediaUrl] of urls.entries()) {
        const isVideo = mediaUrl.includes('.mp4');
        const extension = isVideo ? 'mp4' : 'jpg';
        const timestamp = Date.now();
        
        await downloadFile(
          mediaUrl,
          `${config.downloadPath.carousels}/carousel_${timestamp}_${index}.${extension}`
        );
      }
    } else {
      // Single media
      const mediaUrl = urls[0];
      const isVideo = mediaUrl.includes('.mp4');
      const extension = isVideo ? 'mp4' : 'jpg';
      const timestamp = Date.now();
      const folder = isVideo ? config.downloadPath.videos : config.downloadPath.images;
      
      console.log(`Downloading ${isVideo ? 'video' : 'image'}...`);
      await downloadFile(
        mediaUrl,
        `${folder}/media_${timestamp}.${extension}`
      );
    }
    
    console.log('Download completed successfully!');

    if (streamMode) {
      // Return an object with stream and metadata instead of saving
      return {
        stream: responseStream, // The actual content stream
        filename: 'instagram-content.mp4', // Or appropriate filename
        mimeType: 'video/mp4' // Or appropriate mime type
      };
    }
  } catch (error) {
    throw new Error(`Failed to download content: ${error.message}`);
  }
}

module.exports = {
  downloadContent
};