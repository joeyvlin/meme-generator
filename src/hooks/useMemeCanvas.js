import { useEffect, useRef } from 'react';
import { drawWrappedText } from '../utils/textWrapping';

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
        const maxWidth = canvas.width * 0.85;
        drawWrappedText(
          ctx,
          overlay.text,
          overlay.x,
          overlay.y,
          maxWidth,
          overlay.fontSize,
          overlay.textColor,
          overlay.borderWidth
        );
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

