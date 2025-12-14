/**
 * Wraps text to fit within a maximum width
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to wrap
 * @param {number} maxWidth - Maximum width in pixels
 * @returns {string[]} Array of text lines
 */
export function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

/**
 * Draws wrapped text on canvas with stroke and fill
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} text - Text to draw
 * @param {number} x - X position (center)
 * @param {number} y - Y position (center)
 * @param {number} maxWidth - Maximum width for wrapping
 * @param {number} fontSize - Font size in pixels
 * @param {string} textColor - Text fill color
 * @param {number} borderWidth - Stroke width
 */
export function drawWrappedText(ctx, text, x, y, maxWidth, fontSize, textColor, borderWidth) {
  ctx.save();
  
  ctx.font = `${fontSize}px Impact, Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = fontSize * 1.2;
  const totalHeight = lines.length * lineHeight;
  const startY = y - (totalHeight / 2) + (lineHeight / 2);
  
  lines.forEach((line, index) => {
    const lineY = startY + (index * lineHeight);
    
    // Draw stroke
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = borderWidth || 4;
    ctx.lineJoin = 'round';
    ctx.miterLimit = 2;
    ctx.strokeText(line, x, lineY);
    
    // Draw fill
    ctx.fillStyle = textColor || '#FFFFFF';
    ctx.fillText(line, x, lineY);
  });
  
  ctx.restore();
}
