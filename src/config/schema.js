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
};

