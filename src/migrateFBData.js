import { db } from './firebase';
import { ref, get, set } from 'firebase/database';

export const migrateFirebaseData = async () => {
  const buildingsRef = ref(db, 'buildings');
  const snapshot = await get(buildingsRef);

  if (snapshot.exists()) {
    const buildings = snapshot.val();
    const migratedBuildings = {};

    for (const [id, building] of Object.entries(buildings)) {
      migratedBuildings[id] = {
        name: building.name || '',
        note: building.note || '',
        shortcut: building.shortcut || '',
        timestamp: building.timestamp || Date.now(),
        memo: building.password || building.memo || ''  // password를 memo로 변경
      };
    }

    await set(buildingsRef, migratedBuildings);
    console.log('Firebase data migration completed');
  }
};