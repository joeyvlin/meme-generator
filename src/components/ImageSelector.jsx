import { useState, useEffect } from 'react';
import { id } from '@instantdb/react';
import { db } from '../config/instantdb';
import { templateImages } from '../utils/templateImages';
import { fetchRedditTemplates, fetchImgflipTemplates } from '../utils/fetchExternalTemplates';
import { saveFetchedTemplate, useFetchedTemplates } from '../utils/templateStorage';
import './ImageSelector.css';

export default function ImageSelector({ onImageSelect }) {
  // ========================================
  // TEST MODE TOGGLE
  // Set to true for TEST MODE (don't save to database)
  // Set to false for SAVE MODE (save to database)
  // ========================================
  const TEST_MODE = true; // Change to false to enable saving
  
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // Note: db is imported dynamically in the function to avoid module loading issues
  
  // Load fetched templates from database using the hook
  // The hook handles the case where db might not be available
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

  const handleFetchRedditTemplates = async () => {
    await fetchTemplates('reddit', !TEST_MODE); // !TEST_MODE = save to database
  };

  const handleFetchImgflipTemplates = async () => {
    await fetchTemplates('imgflip', !TEST_MODE); // !TEST_MODE = save to database
  };

  const fetchTemplates = async (source, saveToDatabase = true) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const mode = saveToDatabase ? 'SAVE' : 'TEST';
    console.log(`\n=== ${mode} MODE: Fetching from ${source.toUpperCase()} ===`);

    try {
      // Step 1: Verify db is available
      console.log('=== STEP 1: Verifying database connection ===');
      console.log('db from import:', db);
      console.log('db type:', typeof db);
      
      // Use db directly from import (like MemeFeed does)
      // If it's undefined, try dynamic import as fallback
      let dbInstance = db;
      
      if (!dbInstance) {
        console.warn('db from import is undefined, trying dynamic import...');
        try {
          const instantdbModule = await import('../config/instantdb');
          console.log('Dynamic import result:', instantdbModule);
          dbInstance = instantdbModule.db || instantdbModule.default;
        } catch (importError) {
          console.error('Dynamic import failed:', importError);
          throw new Error('Database instance (db) is not available. Check instantdb.js initialization.');
        }
      }
      
      if (!dbInstance) {
        throw new Error('Database instance (db) is not available. Check instantdb.js initialization.');
      }
      
      console.log('Using dbInstance:', dbInstance);
      
      console.log('db.transact type:', typeof dbInstance?.transact);
      console.log('db.id type:', typeof dbInstance?.id);
      console.log('db.tx:', dbInstance?.tx);
      console.log('db.tx.fetched_templates:', dbInstance?.tx?.fetched_templates);
      
      if (typeof dbInstance.transact !== 'function') {
        throw new Error(`db.transact is not a function. It is: ${typeof dbInstance.transact}`);
      }
      
      // id is imported directly from @instantdb/react, not from db
      if (typeof id !== 'function') {
        throw new Error(`id is not a function. It is: ${typeof id}`);
      }
      
      if (!dbInstance.tx) {
        throw new Error('db.tx is not available. Schema may not be loaded.');
      }
      
      if (!dbInstance.tx.fetched_templates) {
        throw new Error('db.tx.fetched_templates is not available. Check schema.js registration.');
      }
      
      console.log('✓ Database connection verified');

      // Step 1.5: Get existing templates to check for duplicates
      console.log('=== STEP 1.5: Checking for existing templates ===');
      let existingUrls = new Set();
      try {
        // Use the already-loaded fetched templates from the hook
        // These are reactive and should be up-to-date
        const existingTemplates = fetchedTemplates || [];
        existingUrls = new Set(
          existingTemplates
            .map(t => t.originalUrl)
            .filter(url => url) // Filter out null/undefined
        );
        console.log(`Found ${existingUrls.size} existing templates in database`);
        if (existingUrls.size > 0) {
          console.log('Existing URLs:', Array.from(existingUrls).slice(0, 5), existingUrls.size > 5 ? '...' : '');
        }
      } catch (queryError) {
        console.warn('Could not get existing templates (will proceed anyway):', queryError.message);
      }

      // Step 2: Fetch templates from external sources with retry logic for duplicates
      console.log(`=== STEP 2: Fetching templates from ${source.toUpperCase()} ===`);
      const TARGET_TEMPLATES = 20; // Target number of new templates to fetch
      const MAX_RETRIES = 5; // Maximum number of fetch attempts
      let allFetchedTemplates = [];
      let allFetchedUrls = new Set(existingUrls); // Track all URLs we've seen (existing + newly fetched)
      let templates = [];
      let attempt = 0;
      
      while (templates.length < TARGET_TEMPLATES && attempt < MAX_RETRIES) {
        attempt++;
        console.log(`\n--- Fetch attempt ${attempt}/${MAX_RETRIES} ---`);
        console.log(`Current new templates: ${templates.length}/${TARGET_TEMPLATES}`);
        
        try {
          const fetchedBatch = await fetchExternalTemplates();
          console.log(`✓ Fetched ${fetchedBatch.length} templates in this batch`);
          
          // Filter out duplicates (both existing and newly fetched in this session)
          const newTemplates = fetchedBatch.filter(template => {
            if (!template.originalUrl) {
              console.warn(`Template "${template.name}" has no originalUrl, skipping duplicate check`);
              return true; // Include it if we can't check
            }
            
            if (allFetchedUrls.has(template.originalUrl)) {
              console.log(`⚠ Skipping duplicate: "${template.name}" (URL already exists)`);
              return false;
            }
            
            // Mark this URL as seen
            allFetchedUrls.add(template.originalUrl);
            return true;
          });
          
          console.log(`✓ Found ${newTemplates.length} new templates in this batch (${fetchedBatch.length - newTemplates.length} duplicates)`);
          
          // Add new templates to our collection
          templates.push(...newTemplates);
          
          if (templates.length >= TARGET_TEMPLATES) {
            console.log(`✓ Reached target of ${TARGET_TEMPLATES} new templates!`);
            // Trim to exact target if we exceeded it
            templates = templates.slice(0, TARGET_TEMPLATES);
            break;
          }
          
          if (attempt < MAX_RETRIES) {
            console.log(`Need ${TARGET_TEMPLATES - templates.length} more templates. Retrying...`);
            // Small delay between retries to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error in fetch attempt ${attempt}:`, error.message);
          if (attempt >= MAX_RETRIES) {
            throw error; // Re-throw if this was the last attempt
          }
          // Continue to next attempt
        }
      }
      
      if (templates.length === 0) {
        setError('No new templates found after multiple attempts. All fetched templates were duplicates. Please check the console for details.');
        setLoading(false);
        return;
      }
      
      console.log(`\n✓ Final result: ${templates.length} new templates after ${attempt} attempt(s)`);
      
      // TEST MODE: Just display the results without saving
      if (!saveToDatabase) {
        console.log('\n=== TEST MODE: Displaying fetched templates (not saving) ===');
        console.log('Sample templates fetched:');
        templates.slice(0, 5).forEach((t, i) => {
          console.log(`${i + 1}. ${t.name}`);
          console.log(`   Source: ${t.source}`);
          console.log(`   Original URL: ${t.originalUrl}`);
          console.log(`   Has imageData: ${!!t.imageData}`);
          console.log(`   ImageData length: ${t.imageData?.length || 0} chars`);
        });
        setSuccess(`TEST MODE: Successfully fetched ${templates.length} templates from ${source}! Check console for details.`);
        setLoading(false);
        return;
      }

      // Step 3: Verify template structure
      console.log('=== STEP 3: Verifying template structure ===');
      const firstTemplate = templates[0];
      console.log('Sample template:', {
        name: firstTemplate.name,
        hasImageData: !!firstTemplate.imageData,
        imageDataLength: firstTemplate.imageData?.length,
        imageDataStart: firstTemplate.imageData?.substring(0, 50),
        fileName: firstTemplate.fileName,
        filePath: firstTemplate.filePath,
        metadata: firstTemplate.metadata
      });
      console.log('✓ Template structure verified');

      // Step 4: Save each template to the database
      console.log('=== STEP 4: Saving templates to database ===');
      let savedCount = 0;
      let failedCount = 0;
      
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        try {
          console.log(`\n[${i + 1}/${templates.length}] Saving: ${template.name}`);
          
          const templateData = {
            name: template.name,
            description: template.description,
            source: template.source,
            originalUrl: template.originalUrl, // Include originalUrl for duplicate detection
            imageData: template.imageData,
            fileName: template.fileName,
            filePath: template.filePath,
            metadata: template.metadata,
            fetchedAt: template.fetchedAt,
            votes: 0
          };

          console.log('Template data keys:', Object.keys(templateData));
          console.log('Template data being saved:', {
            name: templateData.name,
            hasImageData: !!templateData.imageData,
            imageDataLength: templateData.imageData?.length,
            fileName: templateData.fileName,
            filePath: templateData.filePath
          });
          
          const newId = id();
          console.log('Generated ID:', newId);
          console.log('Calling db.transact...');
          
          // InstantDB transaction - just await it, no return value to check
          await dbInstance.transact([
            dbInstance.tx.fetched_templates[newId].update(templateData)
          ]);
          
          savedCount++;
          console.log(`✓ SUCCESS: Saved "${template.name}" with ID: ${newId}`);
        } catch (err) {
          // Check if it's a timeout error and retry
          const isTimeout = err.message && (err.message.includes('timeout') || err.message.includes('timed out'));
          
          if (isTimeout && failedCount === 0) {
            // First timeout - retry once
            console.warn(`⚠ Timeout saving "${template.name}", retrying...`);
            try {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
              const retryId = id();
              await dbInstance.transact([
                dbInstance.tx.fetched_templates[retryId].update({
                  name: template.name,
                  description: template.description,
                  source: template.source,
                  originalUrl: template.originalUrl,
                  imageData: template.imageData,
                  fileName: template.fileName,
                  filePath: template.filePath,
                  metadata: template.metadata,
                  fetchedAt: template.fetchedAt,
                  votes: 0
                })
              ]);
              savedCount++;
              console.log(`✓ SUCCESS: Saved "${template.name}" with ID: ${retryId} (after retry)`);
              continue; // Skip to next template
            } catch (retryErr) {
              // Retry also failed
              failedCount++;
              console.error(`✗ FAILED: Error saving "${template.name}" after retry:`, retryErr);
            }
          } else {
            failedCount++;
            console.error(`✗ FAILED: Error saving "${template.name}":`, err);
            console.error('Error details:', {
              message: err.message,
              stack: err.stack,
              name: err.name
            });
          }
        }
      }

      console.log(`\n=== SUMMARY ===`);
      console.log(`Total templates: ${templates.length}`);
      console.log(`Successfully saved: ${savedCount}`);
      console.log(`Failed: ${failedCount}`);

      if (savedCount > 0) {
        setSuccess(`Successfully fetched and saved ${savedCount} templates!${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
      } else {
        setError(`Failed to save templates. Check console for details.`);
      }
    } catch (err) {
      setError(`Failed to fetch templates: ${err.message}`);
      console.error('=== FATAL ERROR ===');
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
      console.error('Full error:', err);
    } finally {
      setLoading(false);
    }
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
            <div className="templates-header">
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  className="fetch-external-button"
                  onClick={handleFetchImgflipTemplates}
                  disabled={loading}
                >
                  {loading ? 'Fetching...' : 'Fetch from Imgflip'}
                </button>
                <button
                  className="fetch-external-button"
                  onClick={handleFetchRedditTemplates}
                  disabled={loading}
                >
                  {loading ? 'Fetching...' : 'Fetch from Reddit'}
                </button>
              </div>
              {fetchedTemplates.length > 0 && (
                <span className="fetched-count">
                  {fetchedTemplates.length} fetched templates
                </span>
              )}
            </div>

            {error && (
              <div className="error-message">{error}</div>
            )}

            {success && (
              <div className="success-message">{success}</div>
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Fetching templates from multiple sources...</p>
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
