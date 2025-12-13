export const schema = {
  memes: {
    imageData: { type: 'string' },
    textOverlays: { type: 'string' }, // JSON stringified
    createdAt: { type: 'number' },
    votes: { type: 'number', defaultValue: 0 },
  },
  votes: {
    memeId: { type: 'string' },
    userId: { type: 'string' },
    createdAt: { type: 'number' },
  },
  fetched_templates: {
    name: { type: 'string' },
    description: { type: 'string' },
    source: { type: 'string' },
    originalUrl: { type: 'string' }, // Original URL to detect duplicates
    imageData: { type: 'string' }, // Base64 data URL
    fileName: { type: 'string' },
    filePath: { type: 'string' },
    metadata: { type: 'string' }, // JSON stringified
    fetchedAt: { type: 'number' },
    votes: { type: 'number', defaultValue: 0 },
  },
};

