import { init } from '@instantdb/react';

const APP_ID = '9818198c-ae0a-4c65-88af-f9a1252e08ae';

// Initialize InstantDB
// init() returns the db object directly, and auth is a property of db
const db = init({ appId: APP_ID });
const auth = db.auth;

export { db, auth };
export default db;

