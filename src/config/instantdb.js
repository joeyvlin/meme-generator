import { init } from '@instantdb/react';

const APP_ID = '9818198c-ae0a-4c65-88af-f9a1252e08ae';

const { db, auth } = init({ appId: APP_ID });

export { db, auth };
export default db;

