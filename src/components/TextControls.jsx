import './TextControls.css';

export default function TextControls({ 
  selectedText, 
  onTextChange, 
  onFontSizeChange,
  onTextColorChange,
  onBorderWidthChange,
  onDelete,
  onAddText 
}) {
  if (!selectedText) {
    return (
      <div className="text-controls">
        <button className="add-text-button" onClick={onAddText}>
          Add Text
        </button>
      </div>
    );
  }

  return (
    <div className="text-controls">
      <div className="control-group">
        <label>Text Content</label>
        <input
          type="text"
          value={selectedText.text}
          onChange={(e) => onTextChange(selectedText.id, e.target.value)}
          placeholder="Enter meme text..."
          className="text-input"
        />
      </div>

      <div className="control-group">
        <label>Font Size: {selectedText.fontSize}px</label>
        <div className="font-size-controls">
          <input
            type="range"
            min="20"
            max="100"
            value={selectedText.fontSize}
            onChange={(e) => onFontSizeChange(selectedText.id, parseInt(e.target.value))}
            className="font-size-slider"
          />
          <input
            type="number"
            min="20"
            max="100"
            value={selectedText.fontSize}
            onChange={(e) => onFontSizeChange(selectedText.id, parseInt(e.target.value) || 20)}
            className="font-size-input"
          />
        </div>
      </div>

      <div className="control-group">
        <label>Text Color</label>
        <div className="color-controls">
          <input
            type="color"
            value={selectedText.textColor ?? '#FFFFFF'}
            onChange={(e) => onTextColorChange(selectedText.id, e.target.value)}
            className="color-picker"
          />
          <input
            type="text"
            value={selectedText.textColor ?? '#FFFFFF'}
            onChange={(e) => onTextColorChange(selectedText.id, e.target.value)}
            className="color-input"
            placeholder="#FFFFFF"
          />
        </div>
      </div>

      <div className="control-group">
        <label>Border Thickness: {selectedText.borderWidth ?? 4}px</label>
        <div className="border-width-controls">
          <input
            type="range"
            min="0"
            max="20"
            value={selectedText.borderWidth ?? 4}
            onChange={(e) => onBorderWidthChange(selectedText.id, parseInt(e.target.value))}
            className="border-width-slider"
          />
          <input
            type="number"
            min="0"
            max="20"
            value={selectedText.borderWidth ?? 4}
            onChange={(e) => onBorderWidthChange(selectedText.id, parseInt(e.target.value) || 0)}
            className="border-width-input"
          />
        </div>
      </div>

      <div className="control-actions">
        <button className="add-text-button" onClick={onAddText}>
          Add Text
        </button>
        <button className="delete-button" onClick={() => onDelete(selectedText.id)}>
          Delete Text
        </button>
      </div>
    </div>
  );
}

