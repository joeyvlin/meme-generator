import { useState, useRef } from 'react';
import ImageSelector from './components/ImageSelector';
import MemeCanvas from './components/MemeCanvas';
import TextControls from './components/TextControls';
import DownloadButton from './components/DownloadButton';
import MemeFeed from './components/MemeFeed';
import './styles/App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('create'); // 'create' or 'browse'
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

  const selectedText = textOverlays.find(overlay => overlay.id === selectedTextId);

  return (
    <div className="app">
      <header className="app-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1>Meme Generator</h1>
          <nav style={{ display: 'flex', gap: '20px' }}>
            <button
              onClick={() => setCurrentPage('create')}
              style={{
                background: 'none',
                border: 'none',
                color: currentPage === 'create' ? '#333' : '#999',
                fontWeight: currentPage === 'create' ? 600 : 400,
                cursor: 'pointer',
                fontSize: '16px',
                textDecoration: 'none'
              }}
            >
              Create
            </button>
            <button
              onClick={() => setCurrentPage('browse')}
              style={{
                background: 'none',
                border: 'none',
                color: currentPage === 'browse' ? '#333' : '#999',
                fontWeight: currentPage === 'browse' ? 600 : 400,
                cursor: 'pointer',
                fontSize: '16px',
                textDecoration: 'none'
              }}
            >
              Browse
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {currentPage === 'create' ? (
          <>
            <div className="left-panel">
              <ImageSelector onImageSelect={handleImageSelect} />
              
              <div className="controls-section">
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
        ) : (
          <MemeFeed />
        )}
      </main>
    </div>
  );
}

export default App;

