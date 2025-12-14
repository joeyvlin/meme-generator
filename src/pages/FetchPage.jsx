import { useState } from 'react';
import { id } from '@instantdb/react';
import { db } from '../config/instantdb';
import { fetchRedditTemplates, fetchImgflipTemplates } from '../utils/fetchExternalTemplates';
import { useFetchedTemplates } from '../utils/templateStorage';
import FetchGallery from '../components/FetchGallery';
import './FetchPage.css';

export default function FetchPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newlyFetchedIds, setNewlyFetchedIds] = useState(new Set());
  
  // Load fetched templates from database
  const fetchedTemplates = useFetchedTemplates();
  
  // TEST MODE TOGGLE - Set to false to enable saving
  const TEST_MODE = false;

  const fetchTemplates = async (source) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    
    const mode = TEST_MODE ? 'TEST' : 'SAVE';
    console.log(`\n=== ${mode} MODE: Fetching from ${source.toUpperCase()} ===`);

    try {
      // Step 1: Verify db is available
      console.log('=== STEP 1: Verifying database connection ===');
      let dbInstance = db;
      
      if (!dbInstance) {
        console.warn('db from import is undefined, trying dynamic import...');
        try {
          const instantdbModule = await import('../config/instantdb');
          dbInstance = instantdbModule.db || instantdbModule.default;
        } catch (importError) {
          console.error('Dynamic import failed:', importError);
          throw new Error('Database instance (db) is not available. Check instantdb.js initialization.');
        }
      }
      
      if (!dbInstance || typeof dbInstance.transact !== 'function') {
        throw new Error('Database instance (db) is not available.');
      }
      
      if (typeof id !== 'function') {
        throw new Error(`id is not a function.`);
      }
      
      console.log('✓ Database connection verified');

      // Step 1.5: Get existing templates to check for duplicates
      console.log('=== STEP 1.5: Checking for existing templates ===');
      let existingUrls = new Set();
      try {
        const existingTemplates = fetchedTemplates || [];
        existingUrls = new Set(
          existingTemplates
            .map(t => t.originalUrl)
            .filter(url => url)
        );
        console.log(`Found ${existingUrls.size} existing templates in database`);
      } catch (queryError) {
        console.warn('Could not get existing templates (will proceed anyway):', queryError.message);
      }

      // Step 2: Fetch templates from external sources with retry logic for duplicates
      console.log(`=== STEP 2: Fetching templates from ${source.toUpperCase()} ===`);
      const TARGET_TEMPLATES = 20;
      const MAX_RETRIES = 5;
      let allFetchedUrls = new Set(existingUrls);
      let templates = [];
      let attempt = 0;
      
      while (templates.length < TARGET_TEMPLATES && attempt < MAX_RETRIES) {
        attempt++;
        console.log(`\n--- Fetch attempt ${attempt}/${MAX_RETRIES} ---`);
        console.log(`Current new templates: ${templates.length}/${TARGET_TEMPLATES}`);
        
        try {
          const fetchedBatch = source === 'reddit' 
            ? await fetchRedditTemplates()
            : await fetchImgflipTemplates();
          console.log(`✓ Fetched ${fetchedBatch.length} templates in this batch`);
          
          // Filter out duplicates
          const newTemplates = fetchedBatch.filter(template => {
            if (!template.originalUrl) {
              return true;
            }
            
            if (allFetchedUrls.has(template.originalUrl)) {
              console.log(`⚠ Skipping duplicate: "${template.name}" (URL already exists)`);
              return false;
            }
            
            allFetchedUrls.add(template.originalUrl);
            return true;
          });
          
          console.log(`✓ Found ${newTemplates.length} new templates in this batch`);
          templates.push(...newTemplates);
          
          if (templates.length >= TARGET_TEMPLATES) {
            templates = templates.slice(0, TARGET_TEMPLATES);
            break;
          }
          
          if (attempt < MAX_RETRIES) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (error) {
          console.error(`Error in fetch attempt ${attempt}:`, error.message);
          if (attempt >= MAX_RETRIES) {
            throw error;
          }
        }
      }
      
      if (templates.length === 0) {
        setError('No new templates found after multiple attempts. All fetched templates were duplicates.');
        setLoading(false);
        return;
      }
      
      console.log(`\n✓ Final result: ${templates.length} new templates after ${attempt} attempt(s)`);
      
      // TEST MODE: Just display the results without saving
      if (TEST_MODE) {
        console.log('\n=== TEST MODE: Displaying fetched templates (not saving) ===');
        templates.slice(0, 5).forEach((t, i) => {
          console.log(`${i + 1}. ${t.name} - ${t.source}`);
        });
        setSuccess(`TEST MODE: Successfully fetched ${templates.length} templates from ${source}!`);
        setLoading(false);
        return;
      }

      // Step 3: Save each template to the database
      console.log('=== STEP 3: Saving templates to database ===');
      let savedCount = 0;
      let failedCount = 0;
      const newIds = [];
      
      for (let i = 0; i < templates.length; i++) {
        const template = templates[i];
        let saved = false;
        const maxRetries = 2;
        
        for (let retry = 0; retry <= maxRetries && !saved; retry++) {
          try {
            if (retry > 0) {
              await new Promise(resolve => setTimeout(resolve, 1000 * retry));
            }
            
            const templateData = {
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
            };
            
            const newId = id();
            await dbInstance.transact([
              dbInstance.tx.fetched_templates[newId].update(templateData)
            ]);
            
            savedCount++;
            saved = true;
            newIds.push(newId);
            console.log(`✓ SUCCESS: Saved "${template.name}" with ID: ${newId}`);
          } catch (err) {
            if (retry === maxRetries) {
              failedCount++;
              console.error(`✗ FAILED: Error saving "${template.name}":`, err);
            }
          }
        }
      }

      console.log(`\n=== SUMMARY ===`);
      console.log(`Total templates: ${templates.length}`);
      console.log(`Successfully saved: ${savedCount}`);
      console.log(`Failed: ${failedCount}`);

      if (savedCount > 0) {
        setSuccess(`Successfully fetched and saved ${savedCount} templates!${failedCount > 0 ? ` (${failedCount} failed)` : ''}`);
        // Track newly fetched template IDs
        setNewlyFetchedIds(new Set(newIds));
      } else {
        setError(`Failed to save templates. Check console for details.`);
      }
    } catch (err) {
      setError(`Failed to fetch templates: ${err.message}`);
      console.error('=== FATAL ERROR ===');
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchRedditTemplates = async () => {
    await fetchTemplates('reddit');
  };

  const handleFetchImgflipTemplates = async () => {
    await fetchTemplates('imgflip');
  };

  return (
    <div className="fetch-page">
      <div className="fetch-controls">
        <h2>Fetch Templates</h2>
        <p style={{ color: '#666', marginBottom: '20px' }}>
          Fetch trending meme templates from Reddit or Imgflip. Newly fetched templates will appear in the gallery below, grouped by day.
        </p>
        <div className="fetch-buttons">
          <button
            className="fetch-button fetch-button-reddit"
            onClick={handleFetchRedditTemplates}
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Fetch from Reddit'}
          </button>
          <button
            className="fetch-button fetch-button-imgflip"
            onClick={handleFetchImgflipTemplates}
            disabled={loading}
          >
            {loading ? 'Fetching...' : 'Fetch from Imgflip'}
          </button>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
      </div>

      <FetchGallery 
        templates={fetchedTemplates}
        newlyFetchedIds={newlyFetchedIds}
      />
    </div>
  );
}

