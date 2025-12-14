import { useState } from 'react';
import { generateMemeCaptions } from '../utils/aiCaptionGenerator';
import './AICaptionGenerator.css';

export default function AICaptionGenerator({ onCaptionSelect, imageUrl }) {
  const [userInput, setUserInput] = useState('');
  const [captions, setCaptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!userInput.trim()) {
      setError('Please enter your feeling, thought, or situation');
      return;
    }

    setLoading(true);
    setError(null);
    setCaptions([]);

    try {
      const generatedCaptions = await generateMemeCaptions(userInput);
      setCaptions(generatedCaptions);
    } catch (err) {
      setError(err.message || 'Failed to generate captions. Please check your API key.');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptionClick = (caption) => {
    onCaptionSelect(caption);
    setUserInput('');
  };

  return (
    <div className="ai-caption-generator">
      <div className="control-group">
        <label>Generate Caption with AI</label>
        <textarea
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          placeholder="Describe your feeling, thought, or situation..."
          className="ai-input"
          rows="3"
        />
        <button
          className="generate-button"
          onClick={handleGenerate}
          disabled={loading || !userInput.trim()}
        >
          {loading ? 'Generating...' : 'Generate Captions'}
        </button>
      </div>

      {error && (
        <div className="error-message">{error}</div>
      )}

      {captions.length > 0 && (
        <div className="captions-container">
          <p className="captions-label">Choose a caption:</p>
          <div className="captions-list">
            {captions.map((caption, index) => (
              <button
                key={index}
                className="caption-option"
                onClick={() => handleCaptionClick(caption)}
              >
                {caption}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
