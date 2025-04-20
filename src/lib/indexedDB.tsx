// FILE: src/lib/indexedDB.ts
import type { Goal } from "~/types/kanbanBoard"

const DB_NAME = "TempoGoalsDB"
const DB_VERSION = 3
const GOALS_STORE_NAME = "goals"
const META_STORE_NAME = "meta"
const GOAL_ORDER_KEY = "goalOrder"

let dbPromise: Promise<IDBDatabase> | null = null

function initDB(): Promise<IDBDatabase> {
  if (dbPromise) {
    return dbPromise
  }

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = (event) => {
      console.error("IndexedDB error:", request.error)
      reject("Error opening DB")
    }

    request.onsuccess = (event) => {
      console.log("Database opened successfully")
      resolve(request.result)
    }

    request.onupgradeneeded = (event) => {
      console.log("Database upgrade needed")
      const db = request.result
      if (!db.objectStoreNames.contains(GOALS_STORE_NAME)) {
        // Store individual goals, keyed by their 'id'
        db.createObjectStore(GOALS_STORE_NAME, { keyPath: "id" })
        console.log(`Object store '${GOALS_STORE_NAME}' created`)
      }
      if (!db.objectStoreNames.contains(META_STORE_NAME)) {
        // Store metadata like the order of goals
        db.createObjectStore(META_STORE_NAME)
        console.log(`Object store '${META_STORE_NAME}' created`)
      }
      // Handle potential removal of old stores if migrating from version 1
      // if (event.oldVersion < 2 && db.objectStoreNames.contains('oldStoreName')) {
      //   db.deleteObjectStore('oldStoreName');
      // }
    }
  })
  return dbPromise
}

// --- Load All Goals (respecting order) ---
export async function loadGoalsFromDB(): Promise<Goal[]> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      [GOALS_STORE_NAME, META_STORE_NAME],
      "readonly"
    )
    const goalsStore = transaction.objectStore(GOALS_STORE_NAME)
    const metaStore = transaction.objectStore(META_STORE_NAME)

    const getAllGoalsRequest = goalsStore.getAll()
    const getOrderRequest = metaStore.get(GOAL_ORDER_KEY)

    let allGoals: Goal[] = []
    let goalOrder: string[] | undefined

    getAllGoalsRequest.onsuccess = () => {
      allGoals = getAllGoalsRequest.result
      checkCompletion()
    }
    getOrderRequest.onsuccess = () => {
      goalOrder = getOrderRequest.result // This will be an array of IDs
      checkCompletion()
    }

    getAllGoalsRequest.onerror = getOrderRequest.onerror = (event) => {
      console.error("Error reading from IndexedDB:", (event.target as any).error)
      reject("Failed to load data")
    }

    const checkCompletion = () => {
      // Wait for both requests to finish
      if (
        getAllGoalsRequest.readyState === "done" &&
        getOrderRequest.readyState === "done"
      ) {
        if (!goalOrder || goalOrder.length === 0) {
          // No order saved or empty, return goals as is (or sort by title/id if needed)
          console.log("No goal order found, returning goals as fetched.")
          resolve(allGoals)
        } else {
          // Sort goals based on the saved order
          const goalMap = new Map(allGoals.map((g) => [g.id, g]))
          const sortedGoals = goalOrder
            .map((id) => goalMap.get(id))
            .filter((g): g is Goal => !!g) // Filter out potential missing goals

          // Add any goals present in DB but missing from order (e.g., corruption)
          const orderedIds = new Set(goalOrder)
          allGoals.forEach((g) => {
            if (!orderedIds.has(g.id)) {
              sortedGoals.push(g)
            }
          })

          console.log("Goals sorted according to saved order.")
          resolve(sortedGoals)
        }
      }
    }
  })
}

// --- Save/Update a Single Goal ---
export async function saveGoal(goal: Goal): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GOALS_STORE_NAME, "readwrite")
    const store = transaction.objectStore(GOALS_STORE_NAME)
    const request = store.put(goal) // put = add or update

    request.onsuccess = () => resolve()
    request.onerror = (event) => {
      console.error("Error saving goal:", request.error)
      reject("Failed to save goal")
    }
  })
}

// --- Delete a Single Goal ---
export async function deleteGoalDB(goalId: string): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(GOALS_STORE_NAME, "readwrite")
    const store = transaction.objectStore(GOALS_STORE_NAME)
    const request = store.delete(goalId)

    request.onsuccess = () => resolve()
    request.onerror = (event) => {
      console.error("Error deleting goal:", request.error)
      reject("Failed to delete goal")
    }
  })
}

// --- Save the Order of Goal IDs ---
export async function saveGoalOrder(order: string[]): Promise<void> {
  const db = await initDB()
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(META_STORE_NAME, "readwrite")
    const store = transaction.objectStore(META_STORE_NAME)
    const request = store.put(order, GOAL_ORDER_KEY) // Overwrite the order array

    request.onsuccess = () => resolve()
    request.onerror = (event) => {
      console.error("Error saving goal order:", request.error)
      reject("Failed to save goal order")
    }
  })
}