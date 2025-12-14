import { useState, useMemo } from 'react';
import './FetchGallery.css';

export default function FetchGallery({ templates, newlyFetchedIds }) {
  const [currentPage, setCurrentPage] = useState(1);
  const templatesPerPage = 20;

  // Group templates by day
  const templatesByDay = useMemo(() => {
    const grouped = {};
    
    templates.forEach(template => {
      if (!template.fetchedAt) return;
      
      const date = new Date(template.fetchedAt);
      const dayKey = date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      
      if (!grouped[dayKey]) {
        grouped[dayKey] = [];
      }
      
      grouped[dayKey].push(template);
    });
    
    // Sort days in descending order (newest first)
    // Sort templates within each day by fetchedAt (newest first)
    const sortedDays = Object.keys(grouped).sort((a, b) => {
      const dateA = new Date(Object.values(grouped[a])[0]?.fetchedAt || 0);
      const dateB = new Date(Object.values(grouped[b])[0]?.fetchedAt || 0);
      return dateB - dateA;
    });
    
    sortedDays.forEach(day => {
      grouped[day].sort((a, b) => (b.fetchedAt || 0) - (a.fetchedAt || 0));
    });
    
    return { grouped, sortedDays };
  }, [templates]);

  // Flatten grouped templates for pagination
  const flattenedTemplates = useMemo(() => {
    const flat = [];
    templatesByDay.sortedDays.forEach(day => {
      flat.push({ type: 'day-header', day, count: templatesByDay.grouped[day].length });
      templatesByDay.grouped[day].forEach(template => {
        flat.push({ type: 'template', template });
      });
    });
    return flat;
  }, [templatesByDay]);

  // Calculate pagination
  const totalPages = Math.ceil(flattenedTemplates.length / templatesPerPage);
  const startIndex = (currentPage - 1) * templatesPerPage;
  const endIndex = startIndex + templatesPerPage;
  const currentTemplates = flattenedTemplates.slice(startIndex, endIndex);

  const handlePrevious = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNext = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (templates.length === 0) {
    return (
      <div className="fetch-gallery-empty">
        <p>No templates fetched yet. Use the buttons above to fetch templates from Reddit or Imgflip.</p>
      </div>
    );
  }

  return (
    <div className="fetch-gallery">
      <div className="gallery-header">
        <h3>Fetched Templates Gallery</h3>
        <p className="gallery-count">Total: {templates.length} templates</p>
      </div>

      <div className="gallery-content">
        {currentTemplates.map((item, index) => {
          if (item.type === 'day-header') {
            return (
              <div key={`day-${item.day}`} className="day-header">
                <h4>{item.day}</h4>
                <span className="day-count">{item.count} template{item.count !== 1 ? 's' : ''}</span>
              </div>
            );
          }
          
          const { template } = item;
          const isNewlyFetched = newlyFetchedIds.has(template.id);
          
          return (
            <div 
              key={template.id} 
              className={`template-card ${isNewlyFetched ? 'newly-fetched' : ''}`}
            >
              {isNewlyFetched && <div className="new-badge">NEW</div>}
              <img 
                src={template.url} 
                alt={template.name}
                loading="lazy"
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3EImage not available%3C/text%3E%3C/svg%3E';
                }}
              />
              <div className="template-info">
                <h5>{template.name}</h5>
                <p className="template-source">{template.source}</p>
                {template.description && (
                  <p className="template-description">{template.description}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="gallery-pagination">
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="pagination-button"
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="pagination-button"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

