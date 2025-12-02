import { useRef, useState, useEffect } from 'react';
import { useMemeCanvas } from '../hooks/useMemeCanvas';
import './MemeCanvas.css';

export default function MemeCanvas({ imageUrl, textOverlays, onTextMove, onTextSelect, selectedTextId, canvasRef: externalCanvasRef }) {
  const internalCanvasRef = useRef(null);
  const canvasRef = externalCanvasRef ? externalCanvasRef : internalCanvasRef;
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragTextId, setDragTextId] = useState(null);

  useMemeCanvas(imageUrl, textOverlays, canvasRef);

  const getTextPosition = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const findTextAtPosition = (x, y) => {
    const ctx = canvasRef.current.getContext('2d');
    
    for (let i = textOverlays.length - 1; i >= 0; i--) {
      const overlay = textOverlays[i];
      ctx.font = `${overlay.fontSize}px Impact, Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const metrics = ctx.measureText(overlay.text);
      const textWidth = metrics.width;
      const textHeight = overlay.fontSize;
      
      const left = overlay.x - textWidth / 2;
      const right = overlay.x + textWidth / 2;
      const top = overlay.y - textHeight / 2;
      const bottom = overlay.y + textHeight / 2;
      
      if (x >= left && x <= right && y >= top && y <= bottom) {
        return overlay.id;
      }
    }
    return null;
  };

  const handleMouseDown = (e) => {
    const pos = getTextPosition(e);
    const textId = findTextAtPosition(pos.x, pos.y);
    
    if (textId) {
      const overlay = textOverlays.find(t => t.id === textId);
      setIsDragging(true);
      setDragTextId(textId);
      setDragOffset({
        x: pos.x - overlay.x,
        y: pos.y - overlay.y
      });
      onTextSelect(textId);
    } else {
      onTextSelect(null);
    }
  };

  const handleMouseMove = (e) => {
    if (isDragging && dragTextId) {
      const pos = getTextPosition(e);
      onTextMove(dragTextId, pos.x - dragOffset.x, pos.y - dragOffset.y);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragTextId(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseup', handleMouseUp);
    canvas.addEventListener('mouseleave', handleMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseup', handleMouseUp);
      canvas.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [isDragging, dragTextId, dragOffset, textOverlays]);

  if (!imageUrl) {
    return (
      <div className="meme-canvas-placeholder">
        <p>Select or upload an image to get started</p>
      </div>
    );
  }

  return (
    <div className="meme-canvas-container">
      <canvas
        ref={canvasRef}
        className="meme-canvas"
        style={{ cursor: isDragging ? 'grabbing' : 'grab', display: 'block' }}
      />
    </div>
  );
}

