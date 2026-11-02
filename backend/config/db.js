/**
 * ============================================================================
 * DATABASE ADAPTER: Key-Value NoSQL Store
 * ============================================================================
 * This module implements a Key-Value NoSQL storage layer for the Coffee Shop.
 * In a Key-Value database (such as Redis):
 *   - Each piece of data is identified by a unique key (e.g., 'menu:menu-1', 'order:ORD-101')
 *   - The value is stored as a serialized JSON string.
 *
 * To ensure this application runs smoothly both in cloud environments (Render + Redis)
 * and on local machines without requiring a local Redis server installation,
 * this adapter provides dual-mode persistence:
 *   1. Primary: Redis (via ioredis) if REDIS_URL is provided or Redis is running.
 *   2. Fallback: Persistent Key-Value file store (data/kv-store.json) on disk.
 *
 * Both modes share the exact same Key-Value API and ensure changes persist
 * after server restarts.
 */

const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');

// Path to fallback file storage
const DATA_DIR = path.join(__dirname, '..', 'data');
const FILE_STORE_PATH = path.join(DATA_DIR, 'kv-store.json');
const SEED_MENU_PATH = path.join(DATA_DIR, 'seedMenu.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// In-memory mirror of the key-value store for file-based fallback
let memoryStore = {};
let isUsingRedis = false;
let redisClient = null;

/**
 * Load the persistent file store into memory on startup
 */
function loadFileStore() {
  try {
    if (fs.existsSync(FILE_STORE_PATH)) {
      const rawData = fs.readFileSync(FILE_STORE_PATH, 'utf-8');
      memoryStore = JSON.parse(rawData);
    } else {
      memoryStore = {};
      saveFileStore();
    }
  } catch (err) {
    console.error('Warning: Could not read local KV store, starting empty:', err.message);
    memoryStore = {};
  }
}

/**
 * Save memoryStore to disk synchronously to ensure persistence across restarts
 */
function saveFileStore() {
  try {
    fs.writeFileSync(FILE_STORE_PATH, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving KV store to disk:', err.message);
  }
}

// Initialize file store mirror at module load
loadFileStore();

/**
 * Connect to Redis if configured, or fall back to file store
 */
async function connectDatabase() {
  const redisUrl = process.env.REDIS_URL;

  if (redisUrl && redisUrl.trim() !== '') {
    try {
      console.log('Attempting connection to Redis at:', redisUrl.replace(/:[^:@]+@/, ':****@'));
      redisClient = new Redis(redisUrl, {
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        retryStrategy(times) {
          if (times > 3) {
            console.log('Redis connection retry limit reached. Falling back to persistent file KV store.');
            return null; // Stop retrying
          }
          return Math.min(times * 1000, 3000);
        }
      });

      // Wait for connect event or error
      await new Promise((resolve) => {
        redisClient.once('ready', () => {
          isUsingRedis = true;
          console.log('Successfully connected to Redis Key-Value NoSQL database.');
          resolve();
        });

        redisClient.once('error', (err) => {
          console.log(`Redis not available (${err.message}). Using persistent local Key-Value store.`);
          isUsingRedis = false;
          resolve();
        });
      });
    } catch (error) {
      console.log('Could not connect to Redis. Using persistent local Key-Value store.');
      isUsingRedis = false;
    }
  } else {
    console.log('No REDIS_URL provided. Operating with persistent local Key-Value NoSQL store (data/kv-store.json).');
    isUsingRedis = false;
  }

  // Seed default menu items if database is empty
  await seedInitialData();
}

/**
 * Key-Value API: Get a value by its key
 * @param {string} key
 * @returns {Promise<any|null>} Parsed JSON object or null
 */
async function get(key) {
  if (isUsingRedis && redisClient) {
    const raw = await redisClient.get(key);
    return raw ? JSON.parse(raw) : null;
  }
  const raw = memoryStore[key];
  return raw ? JSON.parse(raw) : null;
}

/**
 * Key-Value API: Set a key to a JSON value
 * @param {string} key
 * @param {any} value
 */
async function set(key, value) {
  const jsonString = JSON.stringify(value);
  if (isUsingRedis && redisClient) {
    await redisClient.set(key, jsonString);
  } else {
    memoryStore[key] = jsonString;
    saveFileStore();
  }
  return value;
}

/**
 * Key-Value API: Delete a key
 * @param {string} key
 * @returns {Promise<boolean>}
 */
async function del(key) {
  if (isUsingRedis && redisClient) {
    const result = await redisClient.del(key);
    return result > 0;
  }
  if (key in memoryStore) {
    delete memoryStore[key];
    saveFileStore();
    return true;
  }
  return false;
}

/**
 * Key-Value API: Get all keys matching a prefix (e.g. 'menu:*' or 'order:*')
 * @param {string} prefix
 * @returns {Promise<string[]>}
 */
async function getKeysByPrefix(prefix) {
  if (isUsingRedis && redisClient) {
    return await redisClient.keys(`${prefix}*`);
  }
  return Object.keys(memoryStore).filter((k) => k.startsWith(prefix));
}

/**
 * Key-Value API: Retrieve all values whose keys start with prefix
 * @param {string} prefix
 * @returns {Promise<any[]>}
 */
async function getAllByPrefix(prefix) {
  const keys = await getKeysByPrefix(prefix);
  if (keys.length === 0) return [];

  const results = [];
  for (const key of keys) {
    const item = await get(key);
    if (item) results.push(item);
  }
  return results;
}

/**
 * Seed initial menu items from seedMenu.json if no menu keys exist
 */
async function seedInitialData() {
  try {
    const existingMenu = await getAllByPrefix('menu:');
    if (existingMenu.length === 0 && fs.existsSync(SEED_MENU_PATH)) {
      console.log('Database empty. Seeding initial coffee shop menu items...');
      const seedData = JSON.parse(fs.readFileSync(SEED_MENU_PATH, 'utf-8'));
      for (const item of seedData) {
        await set(`menu:${item.id}`, item);
      }
      console.log(`Seeded ${seedData.length} menu items into Key-Value NoSQL database.`);
    }
  } catch (err) {
    console.error('Error during menu seeding:', err.message);
  }
}

/**
 * Return health and connectivity status for monitoring
 */
function getStatus() {
  return {
    status: 'connected',
    type: isUsingRedis ? 'Redis Key-Value NoSQL' : 'Persistent File Key-Value NoSQL',
    isRedis: isUsingRedis,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  connectDatabase,
  get,
  set,
  del,
  getKeysByPrefix,
  getAllByPrefix,
  getStatus
};

