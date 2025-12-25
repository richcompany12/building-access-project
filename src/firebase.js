import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";
import { ref, get } from 'firebase/database';

const firebaseConfig = {
  apiKey: "AIzaSyDBINhRyBEzIkDc5dK9GUdHE74q3TnaPyo",
  authDomain: "building-access-project.firebaseapp.com",
  databaseURL: "https://building-access-project-default-rtdb.firebaseio.com",
  projectId: "building-access-project",
  storageBucket: "building-access-project.appspot.com",
  messagingSenderId: "187177864249",
  appId: "1:187177864249:web:3c45f591793521643051e8",
  measurementId: "G-1J23BTPHRY"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const analytics = getAnalytics(app);

export const getFirebaseBuildings = async () => {
  try {
    const buildingsRef = ref(db, 'buildings');
    const snapshot = await get(buildingsRef);
    if (snapshot.exists()) {
      return Object.entries(snapshot.val())
        .filter(([_, data]) => data !== null) // 삭제된 데이터 필터링
        .map(([id, data]) => ({
          id,
          ...data
        }));
    }
  } catch (error) {
    console.error('Firebase data fetch failed:', error);
  }
  return [];
};

// 새로운 Firestore Native 모드 데이터베이스 (smartrider)
//export const smartriderDb = getFirestore(app, 'smartrider');