import { openDB } from 'idb';
import { getAuth } from 'firebase/auth';
import { getDatabase, ref, set, get } from 'firebase/database';
import CryptoJS from 'crypto-js';

const DB_NAME = 'BuildingsDB';
const STORE_NAME = 'buildings';
const DB_VERSION = 2;

// IndexedDB 설정
async function setupIndexedDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp');
      }
    },
  });
}

// 데이터 암호화
function encryptData(data, secretKey) {
  return CryptoJS.AES.encrypt(JSON.stringify(data), secretKey).toString();
}

// 데이터 복호화
function decryptData(encryptedData, secretKey) {
  const bytes = CryptoJS.AES.decrypt(encryptedData, secretKey);
  return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}

// Firebase에 암호화된 데이터 저장
async function saveToFirebase(userId, encryptedData) {
  const db = getDatabase();
  await set(ref(db, `users/${userId}/buildings`), encryptedData);
}

// Firebase에서 암호화된 데이터 가져오기
async function getFromFirebase(userId) {
  const db = getDatabase();
  const snapshot = await get(ref(db, `users/${userId}/buildings`));
  return snapshot.val();
}

// IndexedDB에서 모든 건물 데이터 가져오기
async function getAllBuildingsFromIndexedDB() {
  const db = await setupIndexedDB();
  return db.getAll(STORE_NAME);
}

// 데이터 병합 함수 수정
function mergeData(localData, cloudData) {
  const mergedData = [...cloudData]; // 클라우드 데이터를 기본으로 사용
  
  localData.forEach(localBuilding => {
    const cloudBuildingIndex = mergedData.findIndex(b => b.id === localBuilding.id);
    
    if (cloudBuildingIndex === -1) {
      // 로컬에만 있는 데이터는 추가
      console.log('로컬에만 있는 건물 추가:', localBuilding.name);
      mergedData.push(localBuilding);
    } else {
      // 양쪽 다 있는 경우, 최신 타임스탬프나 더 많은 정보 선택
      const cloudBuilding = mergedData[cloudBuildingIndex];
      
      // 타임스탬프 비교를 위해 숫자로 변환
      const localTime = Number(localBuilding.timestamp) || 0;
      const cloudTime = Number(cloudBuilding.timestamp) || 0;
      
      console.log(`건물 ${localBuilding.name} 타임스탬프 비교: 로컬=${localTime}, 클라우드=${cloudTime}`);
      
      if (localTime >= cloudTime) {
        // 로컬이 더 최신이거나 같으면
        console.log(`로컬 데이터가 더 최신. 병합 중: ${localBuilding.name}`);
        
        // 위치 정보 특별 처리
        if (localBuilding.location && !cloudBuilding.location) {
          console.log(`${localBuilding.name}: 로컬에 위치 정보 있음, 클라우드에 없음. 위치 정보 병합`);
          
          // 위치 정보 숫자형으로 변환
          if (typeof localBuilding.location === 'object') {
            localBuilding.location = {
              lat: parseFloat(String(localBuilding.location.lat)),
              lng: parseFloat(String(localBuilding.location.lng))
            };
          }
        }
        
        // 클라우드 데이터에 로컬 데이터 덮어쓰기
        mergedData[cloudBuildingIndex] = { ...localBuilding };
      } 
      // 클라우드가 더 최신인 경우에도 위치 정보 확인
      else if (cloudBuilding.location && !localBuilding.location) {
        console.log(`${cloudBuilding.name}: 클라우드에 위치 정보 있음, 로컬에 없음. 위치 정보 유지`);
        
        // 위치 정보 숫자형으로 변환
        if (typeof cloudBuilding.location === 'object') {
          mergedData[cloudBuildingIndex].location = {
            lat: parseFloat(String(cloudBuilding.location.lat)),
            lng: parseFloat(String(cloudBuilding.location.lng))
          };
        }
      }
    }
  });

  return mergedData;
}

// syncData 함수 수정
export async function syncData() {
  console.log('데이터 동기화 시작...');
  
  const db = await setupIndexedDB();
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('사용자가 인증되지 않았습니다');
    return false;
  }

  const secretKey = user.uid;

  try {
    // Firebase에서 먼저 최신 데이터 가져오기
    const encryptedCloudData = await getFromFirebase(user.uid);
    
    let cloudData = [];
    if (encryptedCloudData) {
      cloudData = decryptData(encryptedCloudData, secretKey);
      console.log('Firebase에서 가져온 데이터:', cloudData.length, '개 건물');
    } else {
      console.log('Firebase에 저장된 데이터가 없습니다');
    }

    // IndexedDB에서 로컬 데이터 가져오기
    const localData = await getAllBuildingsFromIndexedDB();
    console.log('IndexedDB에서 가져온 데이터:', localData.length, '개 건물');

    // 위치 정보가 있는 건물 수 확인
    const localWithLocation = localData.filter(b => b.location).length;
    const cloudWithLocation = cloudData.filter(b => b.location).length;
    console.log(`위치 정보가 있는 건물: 로컬=${localWithLocation}/${localData.length}, 클라우드=${cloudWithLocation}/${cloudData.length}`);

    // 병합된 데이터 생성
    const mergedData = mergeData(localData, cloudData);
    console.log('병합 후 총 건물 수:', mergedData.length);
    
    // 병합된 데이터의 위치 정보 확인
    const mergedWithLocation = mergedData.filter(b => b.location).length;
    console.log(`병합 후 위치 정보가 있는 건물: ${mergedWithLocation}/${mergedData.length}`);

    // 병합된 데이터를 IndexedDB에 저장
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.clear(); // 기존 데이터 제거
    await Promise.all(mergedData.map(item => tx.store.put(item)));
    await tx.done;
    console.log('IndexedDB에 병합된 데이터 저장 완료');

    // 병합된 데이터를 Firebase에 저장
    const encryptedMergedData = encryptData(mergedData, secretKey);
    await saveToFirebase(user.uid, encryptedMergedData);
    console.log('Firebase에 병합된 데이터 저장 완료');

    console.log('데이터 동기화가 성공적으로 완료되었습니다');
    return true;
  } catch (error) {
    console.error('데이터 동기화 중 오류 발생:', error);
    return false;
  }
}

// 앱 시작 시 동기화 실행
export async function initializeSync() {
  try {
    await syncData();
    console.log('Initial data synchronization completed');
  } catch (error) {
    console.error('Error during initial data synchronization:', error);
  }
}

// 로컬 데이터 초기화 함수
export async function resetLocalData() {
  try {
    // IndexedDB 레퍼런스 가져오기
    const db = await setupIndexedDB();
    
    // 기존 데이터 모두 제거
    const tx = db.transaction(STORE_NAME, 'readwrite');
    await tx.store.clear();
    await tx.done;
    
    console.log('로컬 데이터가 초기화되었습니다.');
    return true;
  } catch (error) {
    console.error('로컬 데이터 초기화 중 오류 발생:', error);
    return false;
  }
}

// Firebase에서 최신 데이터를 가져와 로컬 데이터 복구
export async function resetAndSyncFromFirebase() {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    console.error('사용자가 로그인되어 있지 않습니다.');
    return false;
  }

  try {
    // 먼저 로컬 데이터 초기화
    await resetLocalData();
    
    // Firebase에서 데이터 가져오기
    const secretKey = user.uid;
    const encryptedCloudData = await getFromFirebase(user.uid);
    
    if (encryptedCloudData) {
      // 데이터 복호화
      const cloudData = decryptData(encryptedCloudData, secretKey);
      
      // IndexedDB에 저장
      const db = await setupIndexedDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      await Promise.all(cloudData.map(item => tx.store.put(item)));
      await tx.done;
      
      console.log('Firebase에서 데이터를 성공적으로 복구했습니다.');
      return true;
    } else {
      console.log('Firebase에 저장된 데이터가 없습니다.');
      return false;
    }
  } catch (error) {
    console.error('데이터 복구 중 오류 발생:', error);
    return false;
  }
}

export async function deleteFromAllStorages(buildingId) {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (user) {
    // 사용자 개인 암호화 데이터에서 삭제
    const encryptedData = await getFromFirebase(user.uid);
    if (encryptedData) {
      const secretKey = user.uid;
      let userData = decryptData(encryptedData, secretKey);
      
      // 해당 건물 제거
      userData = userData.filter(item => item.id !== buildingId);
      
      // 다시 암호화하여 저장
      const encryptedUserData = encryptData(userData, secretKey);
      await saveToFirebase(user.uid, encryptedUserData);
    }
  }
  
  // IndexedDB에서도 제거하고 동기화 실행하지 않음
  const db = await setupIndexedDB();
  await db.delete(STORE_NAME, buildingId);
  
  console.log('Building deleted from all storages:', buildingId);
  return true;
}

export async function forceCloudSync() {
  const auth = getAuth();
  const user = auth.currentUser;
  
  if (!user) {
    console.error('User not authenticated');
    return;
  }

  // Firebase의 공용 buildings 데이터 가져오기
  const db = getDatabase();
  const buildingsRef = ref(db, 'buildings');
  const snapshot = await get(buildingsRef);
  
  if (!snapshot.exists()) {
    console.log('공용 데이터가 없습니다.');
    return;
  }
  
  // 공용 데이터를 배열로 변환
  const publicBuildings = Object.entries(snapshot.val()).map(([id, data]) => ({
    id,
    ...data
  }));
  
  // 사용자 고유 데이터로 저장
  const secretKey = user.uid;
  const encryptedData = encryptData(publicBuildings, secretKey);
  await saveToFirebase(user.uid, encryptedData);
  
  // IndexedDB 갱신
  const db2 = await setupIndexedDB();
  const tx = db2.transaction(STORE_NAME, 'readwrite');
  await tx.store.clear();
  await Promise.all(publicBuildings.map(item => tx.store.put(item)));
  await tx.done;
  
  console.log('공용 데이터로 사용자 데이터 동기화 완료');
}