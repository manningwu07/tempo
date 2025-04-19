import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Goal } from '~/types/kanbanBoard' // Adjust path if needed

const DB_NAME = 'TempoGoalsDB'
const STORE_NAME = 'goalsStore'
const VERSION = 1
const GOALS_KEY = 'userGoals' // Fixed key to store the single goals array

// Define the database schema using DBSchema
interface TempoDB extends DBSchema {
  [STORE_NAME]: {
    key: string // We use a fixed string key
    value: Goal[] // The value is the array of goals
  }
}

let dbPromise: Promise<IDBPDatabase<TempoDB>> | null = null

function getDb(): Promise<IDBPDatabase<TempoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<TempoDB>(DB_NAME, VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        console.log(`Upgrading DB from version ${oldVersion} to ${newVersion}`)
        // Create store if it doesn't exist
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME)
          console.log(`Object store "${STORE_NAME}" created.`)
        }
        // Handle future schema upgrades here based on oldVersion
      },
    })
  }
  return dbPromise
}

/**
 * Loads the goals array from IndexedDB.
 * Returns an empty array if no data is found or on error.
 */
export async function loadGoalsFromDB(): Promise<Goal[]> {
  try {
    const db = await getDb()
    const tx = db.transaction(STORE_NAME, 'readonly')
    const store = tx.objectStore(STORE_NAME)
    const goals = await store.get(GOALS_KEY)
    await tx.done
    console.log('Goals loaded from DB:', goals)
    return goals ?? [] // Return empty array if undefined/null
  } catch (error) {
    console.error('Failed to load goals from IndexedDB:', error)
    return [] // Return empty array on error
  }
}

/**
 * Saves the entire goals array to IndexedDB.
 */
export async function saveGoalsToDB(goals: Goal[]): Promise<void> {
  try {
    const db = await getDb()
    const tx = db.transaction(STORE_NAME, 'readwrite')
    const store = tx.objectStore(STORE_NAME)
    await store.put(goals, GOALS_KEY) // Use put to insert or update
    await tx.done
    console.log('Goals saved to DB')
  } catch (error) {
    console.error('Failed to save goals to IndexedDB:', error)
  }
}
