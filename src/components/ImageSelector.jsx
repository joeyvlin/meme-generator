import { useState } from 'react';
import { templateImages } from '../utils/templateImages';
import { useFetchedTemplates } from '../utils/templateStorage';
import './ImageSelector.css';

export default function ImageSelector({ onImageSelect }) {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  
  // Load fetched templates from database using the hook
  const fetchedTemplates = useFetchedTemplates();

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        onImageSelect(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleTemplateSelect = (template) => {
    setSelectedTemplate(template.id);
    onImageSelect(template.url);
  };

  // Combine default templates with fetched templates
  const allTemplates = [
    ...templateImages,
    ...fetchedTemplates
  ];

  return (
    <div className="image-selector">
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          Upload
        </button>
        <button
          className={`tab ${activeTab === 'templates' ? 'active' : ''}`}
          onClick={() => setActiveTab('templates')}
        >
          Templates
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'upload' && (
          <div className="upload-section">
            <label className="upload-label">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
              <span className="upload-button">Choose Image</span>
            </label>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="templates-section">
            {fetchedTemplates.length > 0 && (
              <div className="templates-header">
                <span className="fetched-count">
                  {fetchedTemplates.length} fetched templates
                </span>
              </div>
            )}

            <div className="templates-grid">
              {allTemplates.map((template) => (
                <div
                  key={template.id}
                  className={`template-item ${selectedTemplate === template.id ? 'selected' : ''}`}
                  onClick={() => handleTemplateSelect(template)}
                  title={template.description || template.name}
                >
                  <img src={template.url} alt={template.name} />
                  <span className="template-name">{template.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
