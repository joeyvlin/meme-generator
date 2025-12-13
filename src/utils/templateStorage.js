/**
 * Utility functions for storing and retrieving fetched templates from InstantDB
 */

// Import db - it should be available once the module system loads it
// If it's undefined, we'll handle it in the functions
import { db } from '../config/instantdb';

/**
 * Saves a fetched template to InstantDB
 */
export async function saveFetchedTemplate(template) {
  try {
    // Get db dynamically to ensure it's available
    const db = await import('../config/instantdb').then(m => m.db || m.default);
    
    if (!db) {
      console.error('db is undefined!');
      throw new Error('Database instance is not available');
    }
    
    if (typeof db.transact !== 'function') {
      console.error('db.transact is not a function, db:', db);
      throw new Error('db.transact is not a function');
    }

    const templateData = {
      name: template.name,
      description: template.description,
      source: template.source,
      imageData: template.imageData,
      fileName: template.fileName,
      filePath: template.filePath,
      metadata: template.metadata,
      fetchedAt: template.fetchedAt,
      votes: 0
    };

    const { data } = await db.transact([
      db.tx.fetched_templates[db.id()].update(templateData)
    ]);

    return data.id;
  } catch (error) {
    console.error('Error saving fetched template:', error);
    throw error;
  }
}

/**
 * Gets all fetched templates from InstantDB
 */
export async function getFetchedTemplates() {
  try {
    // Get db dynamically to ensure it's available
    const db = await import('../config/instantdb').then(m => m.db || m.default);
    
    if (!db) {
      console.warn('Database instance is not available');
      return [];
    }

    const { data } = await db.query({
      fetched_templates: {}
    });

    return (data.fetched_templates || []).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      source: t.source,
      originalUrl: t.originalUrl,
      url: t.imageData, // Use base64 data as URL
      fileName: t.fileName,
      filePath: t.filePath,
      metadata: JSON.parse(t.metadata || '{}'),
      fetchedAt: t.fetchedAt,
      votes: t.votes || 0
    }));
  } catch (error) {
    console.error('Error fetching templates from database:', error);
    return [];
  }
}

/**
 * Uses db.useQuery to reactively get fetched templates
 * Must be called from a React component
 */
export function useFetchedTemplates() {
  // This hook must be called unconditionally (React rules)
  // If db is undefined, this will throw, but we need to call it anyway
  // The component should handle the error or db should always be available
  try {
    // Always call useQuery - if db is undefined, it will throw
    // Note: fetchedAt is not indexed, so we can't order by it
    // We'll fetch all and sort in memory if needed
    const { data } = db.useQuery({
      fetched_templates: {}
    });

    return (data?.fetched_templates || []).map(t => ({
      id: t.id,
      name: t.name,
      description: t.description,
      source: t.source,
      originalUrl: t.originalUrl,
      url: t.imageData, // Use base64 data as URL
      fileName: t.fileName,
      filePath: t.filePath,
      metadata: JSON.parse(t.metadata || '{}'),
      fetchedAt: t.fetchedAt,
      votes: t.votes || 0
    }));
  } catch (error) {
    // If db is undefined or useQuery fails, return empty array
    // This allows the component to render even if db isn't available yet
    console.warn('useFetchedTemplates: db not available or query failed:', error.message);
    return [];
  }
}

