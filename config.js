require('dotenv').config();

module.exports = {
  instagram: {
    username: process.env.IG_USERNAME,
    password: process.env.IG_PASSWORD
  },
  downloadPath: {
    images: './downloads/images',
    videos: './downloads/videos',
    carousels: './downloads/carousels'
  }
};