import { useEffect, useRef } from 'react';

export function useMemeCanvas(imageUrl, textOverlays, canvasRef) {
  const imageRef = useRef(null);

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // Set canvas dimensions to match image
      canvas.width = img.width;
      canvas.height = img.height;

      // Draw image
      ctx.drawImage(img, 0, 0);

      // Draw all text overlays
      textOverlays.forEach(overlay => {
        ctx.save();
        
        // Set font
        ctx.font = `${overlay.fontSize}px Impact, Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Draw black stroke (border)
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = overlay.borderWidth || 4;
        ctx.lineJoin = 'round';
        ctx.miterLimit = 2;
        ctx.strokeText(overlay.text, overlay.x, overlay.y);

        // Draw text fill with custom color
        ctx.fillStyle = overlay.textColor || '#FFFFFF';
        ctx.fillText(overlay.text, overlay.x, overlay.y);

        ctx.restore();
      });
    };

    img.src = imageUrl;
    imageRef.current = img;
  }, [imageUrl, textOverlays, canvasRef]);

  const exportImage = () => {
    if (!canvasRef.current) return null;
    
    return new Promise((resolve) => {
      canvasRef.current.toBlob((blob) => {
        resolve(blob);
      }, 'image/png');
    });
  };

  return { exportImage };
}

