/**
 * Utility for handling offline data storage using IndexedDB
 */

// Open IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("nrstbuild-offline", 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = request.result

      // Create stores for offline data
      if (!db.objectStoreNames.contains("products")) {
        db.createObjectStore("products", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("pages")) {
        db.createObjectStore("pages", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("settings")) {
        db.createObjectStore("settings", { keyPath: "id" })
      }

      if (!db.objectStoreNames.contains("pendingChanges")) {
        const store = db.createObjectStore("pendingChanges", { keyPath: "id", autoIncrement: true })
        store.createIndex("type", "type", { unique: false })
        store.createIndex("timestamp", "timestamp", { unique: false })
      }
    }
  })
}

// Save data to IndexedDB
export async function saveOfflineData<T>(storeName: string, data: T): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.put(data)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()

      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error("Error saving offline data:", error)
    throw error
  }
}

// Get data from IndexedDB
export async function getOfflineData<T>(storeName: string, id: string): Promise<T | null> {
  try {
    const db = await openDB()
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result || null)

      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error("Error getting offline data:", error)
    return null
  }
}

// Get all data from a store
export async function getAllOfflineData<T>(storeName: string): Promise<T[]> {
  try {
    const db = await openDB()
    const transaction = db.transaction(storeName, "readonly")
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)

      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error("Error getting all offline data:", error)
    return []
  }
}

// Delete data from IndexedDB
export async function deleteOfflineData(storeName: string, id: string): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()

      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error("Error deleting offline data:", error)
    throw error
  }
}

// Save pending changes for sync when online
export async function savePendingChange(change: {
  type: string
  action: "create" | "update" | "delete"
  data: any
}): Promise<void> {
  try {
    const db = await openDB()
    const transaction = db.transaction("pendingChanges", "readwrite")
    const store = transaction.objectStore("pendingChanges")

    return new Promise((resolve, reject) => {
      const request = store.add({
        ...change,
        timestamp: new Date().toISOString(),
      })
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()

      transaction.oncomplete = () => db.close()
    })
  } catch (error) {
    console.error("Error saving pending change:", error)
    throw error
  }
}

// Get all pending changes
export async function getPendingChanges(): Promise<any[]> {
  return getAllOfflineData("pendingChanges")
}

// Clear pending change after sync
export async function clearPendingChange(id: string): Promise<void> {
  return deleteOfflineData("pendingChanges", id)
}

// Clear all data (useful for logout)
export async function clearAllOfflineData(): Promise<void> {
  try {
    const db = await openDB()
    const storeNames = Array.from(db.objectStoreNames)

    await Promise.all(
      storeNames.map((storeName) => {
        return new Promise<void>((resolve, reject) => {
          const transaction = db.transaction(storeName, "readwrite")
          const store = transaction.objectStore(storeName)
          const request = store.clear()

          request.onerror = () => reject(request.error)
          request.onsuccess = () => resolve()

          transaction.oncomplete = () => db.close()
        })
      }),
    )
  } catch (error) {
    console.error("Error clearing offline data:", error)
    throw error
  }
}

