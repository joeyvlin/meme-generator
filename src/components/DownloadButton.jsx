import { useState } from 'react';
import { id } from '@instantdb/react';
import { db } from '../config/instantdb';
import { canvasToBase64 } from '../utils/memeStorage';
import { drawWrappedText } from '../utils/textWrapping';
import './DownloadButton.css';

export default function DownloadButton({ imageUrl, textOverlays, canvasRef }) {
  const [isPosting, setIsPosting] = useState(false);
  const [postSuccess, setPostSuccess] = useState(false);

  const handleDownload = async () => {
    if (!imageUrl) {
      alert('Please select an image first');
      return;
    }

    if (!canvasRef?.current) {
      alert('Canvas not ready');
      return;
    }

    // Create a temporary canvas for export
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      tempCtx.drawImage(img, 0, 0);

      // Draw all text overlays
      textOverlays.forEach(overlay => {
        const maxWidth = tempCanvas.width * 0.85;
        drawWrappedText(
          tempCtx,
          overlay.text,
          overlay.x,
          overlay.y,
          maxWidth,
          overlay.fontSize,
          overlay.textColor,
          overlay.borderWidth
        );
      });

      // Download the image
      tempCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'meme.png';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    };

    img.src = imageUrl;
  };

  const handlePost = async () => {
    if (!imageUrl) {
      alert('Please select an image first');
      return;
    }

    if (!canvasRef?.current) {
      alert('Canvas not ready');
      return;
    }

    setIsPosting(true);
    setPostSuccess(false);

    try {
      const canvas = canvasRef.current;
      
      // Check if canvas has content
      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Canvas is empty. Please wait for the image to load.');
      }
      
      // Wait a bit to ensure canvas is fully rendered
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Convert canvas to base64
      const imageData = await canvasToBase64(canvas);
      
      if (!imageData) {
        throw new Error('Failed to convert canvas to image');
      }
      
      // Save to InstantDB
      const memeId = id();
      console.log('Posting meme with ID:', memeId);
      console.log('Image data length:', imageData.length);
      
      await db.transact([
        db.tx.memes[memeId].update({
          imageData,
          textOverlays: JSON.stringify(textOverlays),
          createdAt: Date.now(),
          votes: 0,
        }),
      ]);

      console.log('Meme posted successfully');
      setPostSuccess(true);
      setTimeout(() => setPostSuccess(false), 3000);
    } catch (error) {
      console.error('Error posting meme:', error);
      alert(`Failed to post meme: ${error.message || 'Unknown error'}`);
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div className="download-post-buttons">
      <button className="download-button" onClick={handleDownload}>
        Download Meme
      </button>
      <button 
        className={`post-button ${postSuccess ? 'success' : ''}`}
        onClick={handlePost}
        disabled={isPosting || !imageUrl}
      >
        {isPosting ? 'Posting...' : postSuccess ? 'Posted!' : 'Post Meme'}
      </button>
    </div>
  );
}

