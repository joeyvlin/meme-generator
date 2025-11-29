import './DownloadButton.css';

export default function DownloadButton({ imageUrl, textOverlays }) {

  const handleDownload = async () => {
    if (!imageUrl) {
      alert('Please select an image first');
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
        tempCtx.save();
        
        tempCtx.font = `${overlay.fontSize}px Impact, Arial, sans-serif`;
        tempCtx.textAlign = 'center';
        tempCtx.textBaseline = 'middle';

        // Draw black stroke
        tempCtx.strokeStyle = '#000000';
        tempCtx.lineWidth = overlay.borderWidth || 4;
        tempCtx.lineJoin = 'round';
        tempCtx.miterLimit = 2;
        tempCtx.strokeText(overlay.text, overlay.x, overlay.y);

        // Draw text fill with custom color
        tempCtx.fillStyle = overlay.textColor || '#FFFFFF';
        tempCtx.fillText(overlay.text, overlay.x, overlay.y);

        tempCtx.restore();
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

  return (
    <button className="download-button" onClick={handleDownload}>
      Download Meme
    </button>
  );
}

