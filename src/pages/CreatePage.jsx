import { useState, useRef } from 'react';
import ImageSelector from '../components/ImageSelector';
import MemeCanvas from '../components/MemeCanvas';
import TextControls from '../components/TextControls';
import DownloadButton from '../components/DownloadButton';
import AICaptionGenerator from '../components/AICaptionGenerator';

export default function CreatePage() {
  const [imageUrl, setImageUrl] = useState(null);
  const [textOverlays, setTextOverlays] = useState([]);
  const [selectedTextId, setSelectedTextId] = useState(null);
  const canvasRef = useRef(null);

  const handleImageSelect = (url) => {
    setImageUrl(url);
  };

  const handleAddText = () => {
    const newText = {
      id: Date.now(),
      text: 'Your text here',
      x: imageUrl ? 400 : 300,
      y: imageUrl ? 200 : 200,
      fontSize: 40,
      textColor: '#FFFFFF',
      borderWidth: 4
    };
    setTextOverlays([...textOverlays, newText]);
    setSelectedTextId(newText.id);
  };

  const handleTextChange = (id, newText) => {
    setTextOverlays(textOverlays.map(overlay =>
      overlay.id === id ? { ...overlay, text: newText } : overlay
    ));
  };

  const handleFontSizeChange = (id, newSize) => {
    setTextOverlays(textOverlays.map(overlay =>
      overlay.id === id ? { ...overlay, fontSize: newSize } : overlay
    ));
  };

  const handleTextColorChange = (id, newColor) => {
    setTextOverlays(textOverlays.map(overlay =>
      overlay.id === id ? { ...overlay, textColor: newColor } : overlay
    ));
  };

  const handleBorderWidthChange = (id, newWidth) => {
    setTextOverlays(textOverlays.map(overlay =>
      overlay.id === id ? { ...overlay, borderWidth: newWidth } : overlay
    ));
  };

  const handleTextMove = (id, x, y) => {
    setTextOverlays(textOverlays.map(overlay =>
      overlay.id === id ? { ...overlay, x, y } : overlay
    ));
  };

  const handleDeleteText = (id) => {
    setTextOverlays(textOverlays.filter(overlay => overlay.id !== id));
    if (selectedTextId === id) {
      setSelectedTextId(null);
    }
  };

  const handleCaptionSelect = (caption) => {
    // Create a new text overlay with the selected caption
    const newText = {
      id: Date.now(),
      text: caption,
      x: imageUrl ? 400 : 300,
      y: imageUrl ? 200 : 200,
      fontSize: 40,
      textColor: '#FFFFFF',
      borderWidth: 4
    };
    setTextOverlays([...textOverlays, newText]);
    setSelectedTextId(newText.id);
  };

  const selectedText = textOverlays.find(overlay => overlay.id === selectedTextId);

  return (
    <>
      <div className="left-panel">
        <ImageSelector onImageSelect={handleImageSelect} />
        
        <div className="controls-section">
          <AICaptionGenerator 
            onCaptionSelect={handleCaptionSelect}
            imageUrl={imageUrl}
          />
          
          <TextControls
            selectedText={selectedText}
            onTextChange={handleTextChange}
            onFontSizeChange={handleFontSizeChange}
            onTextColorChange={handleTextColorChange}
            onBorderWidthChange={handleBorderWidthChange}
            onDelete={handleDeleteText}
            onAddText={handleAddText}
          />
          
          <DownloadButton 
            imageUrl={imageUrl} 
            textOverlays={textOverlays}
            canvasRef={canvasRef}
          />
        </div>
      </div>

      <div className="right-panel">
        <MemeCanvas
          imageUrl={imageUrl}
          textOverlays={textOverlays}
          onTextMove={handleTextMove}
          onTextSelect={setSelectedTextId}
          selectedTextId={selectedTextId}
          canvasRef={canvasRef}
        />
      </div>
    </>
  );
}

