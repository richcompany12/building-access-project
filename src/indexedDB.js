// indexedDB.js 파일 최상단에 주석으로 추가
/**
 * Building 데이터 모델
 * {
 *   id: string,
 *   name: string,
 *   memo: string,
 *   note: string,
 *   shortcut: string,
 *   images: string[],
 *   timestamp: number,
 *   location: {
 *     lat: number,
 *     lng: number
 *   },
 *   viewCount: number  // 조회수
 * }
 */

import { openDB } from 'idb';
import { getFirebaseBuildings } from './firebase';
import { syncData } from './secureDataSync';

const DB_NAME = 'BuildingsDB';
const STORE_NAME = 'buildings';
const DB_VERSION = 2;

const initDB = async () => {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
};

export const saveBuildings = async (buildings) => {
  const db = await initDB();
  const tx = db.transaction(STORE_NAME, 'readwrite');
  const store = tx.objectStore(STORE_NAME);
  for (const building of buildings) {
    await store.put(building);
  }
  await tx.done;
  console.log('Buildings saved to IndexedDB:', buildings);
  await syncData();  // 변경사항 동기화
};

export const saveBuilding = async (building) => {
  const db = await initDB();
  await db.put(STORE_NAME, building);
  console.log('Building saved to IndexedDB:', building);
  await syncData();  // 변경사항 동기화
};

export const getAllBuildings = async () => {
  const db = await initDB();
  const buildings = await db.getAll(STORE_NAME);
  console.log('Buildings retrieved from IndexedDB:', buildings);
  return buildings;
};

export const getBuilding = async (id) => {
  const db = await initDB();
  const building = await db.get(STORE_NAME, id);
  console.log('Building retrieved from IndexedDB:', building);
  return building;
};

export const updateBuilding = async (building) => {
  const db = await initDB();
  await db.put(STORE_NAME, building);
  console.log('Building updated in IndexedDB:', building);
  await syncData();  // 변경사항 동기화
};

export const deleteBuilding = async (id) => {
  const db = await initDB();
  await db.delete(STORE_NAME, id);
  console.log('Building deleted from IndexedDB:', id);
  await syncData();  // 변경사항 동기화
};

export const recoverDataFromFirebase = async () => {
  const localBuildings = await getAllBuildings();
  if (localBuildings.length === 0) {
    const firebaseBuildings = await getFirebaseBuildings();
    for (const building of firebaseBuildings) {
      await saveBuilding(building);
    }
    console.log('Data recovered from Firebase');
    return true;
  }
  return false;
};