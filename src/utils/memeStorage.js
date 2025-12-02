/**
 * Utility functions for storing and retrieving memes from InstantDB
 */

/**
 * Converts a canvas element to base64 data URL
 * @param {HTMLCanvasElement} canvas - The canvas element to convert
 * @returns {Promise<string>} Base64 data URL of the canvas image
 */
export async function canvasToBase64(canvas) {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    }, 'image/png');
  });
}

/**
 * Saves a meme to InstantDB
 * @param {Object} db - InstantDB database instance
 * @param {string} imageData - Base64 encoded image data
 * @param {Array} textOverlays - Array of text overlay objects
 * @returns {Promise<string>} The ID of the created meme
 */
export async function saveMeme(db, imageData, textOverlays) {
  const memeData = {
    imageData,
    textOverlays: JSON.stringify(textOverlays),
    createdAt: Date.now(),
    votes: 0,
  };

  const { data } = await db.transact([
    db.tx.memes[db.id()].update(memeData),
  ]);

  return data.id;
}

