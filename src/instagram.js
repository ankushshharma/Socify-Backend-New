const { IgApiClient } = require('instagram-private-api');
const config = require('../config');
const { downloadFile } = require('./downloader');
const { extractMediaId } = require('./utils');

const ig = new IgApiClient();

async function login() {
  try {
    ig.state.generateDevice(config.instagram.username);
    await ig.account.login(config.instagram.username, config.instagram.password);
  } catch (error) {
    throw new Error(`Instagram login failed: ${error.message}`);
  }
}

async function getMediaInfo(url) {
  try {
    const shortcode = extractMediaId(url);
    console.log(`Fetching media info for shortcode: ${shortcode}`);
    
    // Convert shortcode to media ID
    const buf = Buffer.from(shortcode, 'base64');
    const mediaId = buf.toString('hex');
    
    // Add the user ID prefix (common for Instagram media IDs)
    // Try different user ID prefixes as Instagram might use different ones
    const possibleMediaIds = [
      mediaId,
      `1_${mediaId}`,
      `2_${mediaId}`,
    ];

    let mediaInfo = null;
    let lastError = null;

    // Try each possible media ID format
    for (const id of possibleMediaIds) {
      try {
        mediaInfo = await ig.media.info(id);
        if (mediaInfo) break;
      } catch (error) {
        lastError = error;
        continue;
      }
    }

    if (!mediaInfo) {
      throw lastError || new Error('Could not fetch media info');
    }

    return mediaInfo;
  } catch (error) {
    throw new Error(`Failed to fetch media info: ${error.message}`);
  }
}

async function downloadContent(url) {
  try {
    console.log('Logging in to Instagram...');
    await login();
    
    console.log('Fetching media information...');
    const mediaInfo = await getMediaInfo(url);
    
    if (!mediaInfo || !mediaInfo.items || mediaInfo.items.length === 0) {
      throw new Error('No media found in the response');
    }

    const media = mediaInfo.items[0];

    if (media.carousel_media) {
      console.log(`Downloading carousel with ${media.carousel_media.length} items...`);
      for (let [index, item] of media.carousel_media.entries()) {
        if (item.video_versions && item.video_versions.length > 0) {
          console.log(`Downloading carousel video ${index + 1}...`);
          await downloadFile(
            item.video_versions[0].url,
            `${config.downloadPath.carousels}/carousel_${media.id}_video_${index}.mp4`
          );
        } else if (item.image_versions2 && item.image_versions2.candidates.length > 0) {
          console.log(`Downloading carousel image ${index + 1}...`);
          await downloadFile(
            item.image_versions2.candidates[0].url,
            `${config.downloadPath.carousels}/carousel_${media.id}_image_${index}.jpg`
          );
        }
      }
    } else if (media.video_versions && media.video_versions.length > 0) {
      console.log('Downloading video...');
      await downloadFile(
        media.video_versions[0].url,
        `${config.downloadPath.videos}/video_${media.id}.mp4`
      );
    } else if (media.image_versions2 && media.image_versions2.candidates.length > 0) {
      console.log('Downloading image...');
      await downloadFile(
        media.image_versions2.candidates[0].url,
        `${config.downloadPath.images}/image_${media.id}.jpg`
      );
    } else {
      throw new Error('No downloadable media found in the post');
    }
    
    console.log('Download completed successfully!');
  } catch (error) {
    throw new Error(`Failed to download content: ${error.message}`);
  }
}

module.exports = {
  downloadContent
};