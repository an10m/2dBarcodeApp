// Usage: node scripts/create-pharmacy-user.mjs <username> <password> "<Pharmacy name>" "<City>"
// Prints SQL; apply it with:
//   node scripts/create-pharmacy-user.mjs apteka1 'StrongPass123' "Dorixona №1" "Samarqand" > user.sql
//   npx wrangler d1 execute signalcode --remote --config wrangler.pharmacy.jsonc --file user.sql
import { pbkdf2Sync, randomBytes } from "node:crypto";

const [username, password, pharmacy, city] = process.argv.slice(2);
if (!username || !password || !pharmacy || !city) {
  console.error('Usage: node scripts/create-pharmacy-user.mjs <username> <password> "<Pharmacy name>" "<City>"');
  process.exit(1);
}
if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const ITERATIONS = 100000; // Cloudflare Workers caps PBKDF2 at 100000 iterations.
const salt = randomBytes(16);
const hash = pbkdf2Sync(password, salt, ITERATIONS, 32, "sha256");
const stored = `pbkdf2$${ITERATIONS}$${salt.toString("base64")}$${hash.toString("base64")}`;
const q = (s) => `'${String(s).replaceAll("'", "''")}'`;

console.log(
  `INSERT INTO users (username, password_hash, pharmacy_name, city) VALUES (${q(username)}, ${q(stored)}, ${q(pharmacy)}, ${q(city)})` +
  ` ON CONFLICT(username) DO UPDATE SET password_hash = excluded.password_hash, pharmacy_name = excluded.pharmacy_name, city = excluded.city, active = 1;`
);
