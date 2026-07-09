import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load server/.env by absolute path, not relative to the working directory.
// `npm start` runs from the repo root, `npm run dev` runs from server/ — plain
// `import 'dotenv/config'` only finds the file in the second case.
//
// dotenv never overwrites a variable that already exists, so on a host like
// Render (where there is no .env file at all) the dashboard's values win.
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
