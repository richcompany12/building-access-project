import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { storage, db, auth } from './firebase';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { ref as dbRef, remove, update } from 'firebase/database';
import { getAuth } from 'firebase/auth'; // 추가
import imageCompression from 'browser-image-compression';
import { getBuilding, updateBuilding, deleteBuilding as deleteIndexedDBBuilding } from './indexedDB';
import { ADMIN_UID } from './constants';
import { syncData, deleteFromAllStorages } from './secureDataSync'; // 함수 추가
import { MapLocationSelector } from './components';

function Detail() {
  const { id } = useParams();
  const [building, setBuilding] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [showMapSelector, setShowMapSelector] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const [saveStatus, setSaveStatus] = useState({ saving: false, message: '', error: false });

  useEffect(() => {
    const loadBuilding = async () => {
      try {
        const buildingData = await getBuilding(id);
        console.log('Building loaded from IndexedDB:', buildingData);
        
        // 위치 정보가 있으면 형식 확인 및 변환
        if (buildingData && buildingData.location) {
          console.log('원본 위치 정보:', buildingData.location);
          
          // 위치 정보가 문자열이면 숫자로 변환
          const locationObj = {
            lat: typeof buildingData.location.lat === 'string' 
              ? parseFloat(buildingData.location.lat) 
              : buildingData.location.lat,
            lng: typeof buildingData.location.lng === 'string' 
              ? parseFloat(buildingData.location.lng) 
              : buildingData.location.lng
          };
          
          // NaN 체크
          if (!isNaN(locationObj.lat) && !isNaN(locationObj.lng)) {
            buildingData.location = locationObj;
            console.log('변환된 위치 정보:', locationObj);
          } else {
            console.warn('유효하지 않은 위치 정보:', buildingData.location);
            delete buildingData.location; // 유효하지 않으면 제거
          }
        }
        
        if (buildingData) {
          setBuilding(buildingData);
        } else {
          console.log("No such building!");
          navigate('/');
        }
      } catch (error) {
        console.error("Error loading building:", error);
        navigate('/');
      }
    };

    loadBuilding();
  }, [id, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBuilding(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file && (!building.images || building.images.length < 2)) {
      try {
        const options = {
          maxSizeMB: 0.2,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        const compressedFile = await imageCompression(file, options);
        const imageRef = storageRef(storage, `images/${Date.now()}_${file.name}`);
        await uploadBytes(imageRef, compressedFile);
        const url = await getDownloadURL(imageRef);
        const updatedBuilding = {
          ...building,
          images: [...(building.images || []), url]
        };
        setBuilding(updatedBuilding);
        await updateBuilding(updatedBuilding);
        await syncData();  // 데이터 동기화
      } catch (error) {
        console.error("Error uploading image: ", error);
        alert("이미지 업로드에 실패했습니다. 다시 시도해주세요.");
      }
    }
  };

  const deleteImage = async (index) => {
    if (building.images && building.images[index]) {
      const imageUrl = building.images[index];
      const imageRef = storageRef(storage, imageUrl);
      try {
        await deleteObject(imageRef);
        const newImages = building.images.filter((_, i) => i !== index);
        const updatedBuilding = { ...building, images: newImages };
        setBuilding(updatedBuilding);
        await updateBuilding(updatedBuilding);
        await syncData();  // 데이터 동기화
      } catch (error) {
        console.error("Error deleting image: ", error);
        if (error.code === 'storage/unauthorized') {
          alert("이미지 삭제 권한이 없습니다. 관리자에게 문의하세요.");
        } else {
          alert("이미지 삭제에 실패했습니다. 다시 시도해주세요.");
        }
      }
    }
  };

  const handleMapLocationSave = async (location) => {
    console.log('선택한 위치 정보:', location);
    
    try {
      // 위치 정보 숫자형으로 변환
      const preciseLocation = {
        lat: parseFloat(String(location.lat)),
        lng: parseFloat(String(location.lng))
      };
      
      // 유효성 검사
      if (isNaN(preciseLocation.lat) || isNaN(preciseLocation.lng)) {
        throw new Error('유효하지 않은 위치 정보입니다.');
      }
      
      console.log('변환된 위치 정보:', preciseLocation);
      
      // 상태 업데이트
      setBuilding(prev => ({
        ...prev,
        location: preciseLocation
      }));
      
      setShowMapSelector(false);
      
      // 상태 메시지 표시
      setSaveStatus({
        saving: false,
        message: '위치가 선택되었습니다. 저장 버튼을 눌러 완료하세요.',
        error: false
      });
    } catch (error) {
      console.error('위치 정보 처리 중 오류:', error);
      setSaveStatus({
        saving: false,
        message: '위치 정보 처리 중 오류가 발생했습니다: ' + error.message,
        error: true
      });
    }
  };

  const updateBuildingData = async () => {
    try {
      setSaveStatus({
        saving: true,
        message: '저장 중...',
        error: false
      });
  
      // 위치 정보 확인 및 변환
      let locationToSave = null;
      if (building.location) {
        // 반드시 숫자형으로 변환 (문자열 -> 숫자)
        locationToSave = {
          lat: parseFloat(String(building.location.lat)),
          lng: parseFloat(String(building.location.lng))
        };
        
        // 유효성 검사 강화
        if (isNaN(locationToSave.lat) || isNaN(locationToSave.lng)) {
          throw new Error('유효하지 않은 위치 정보입니다.');
        }
        
        console.log('저장할 위치 정보:', locationToSave);
      }
      
      // 타임스탬프는 Date.now()로 통일 (ISO 문자열이 아닌 숫자로)
      const updatedBuilding = {
        ...building,
        location: locationToSave,
        timestamp: Date.now()  // 타임스탬프를 밀리초로 통일
      };
      
      // 디버깅 용도로 출력
      console.log('최종 저장 데이터:', JSON.stringify(updatedBuilding));
  
      // IndexedDB 업데이트
      await updateBuilding(updatedBuilding);
  
      // Firebase 업데이트
      const buildingRef = dbRef(db, `buildings/${id}`);
      await update(buildingRef, updatedBuilding);
  
      // 명시적으로 동기화 호출
      await syncData();
  
      setEditMode(false);
      setSaveStatus({
        saving: false,
        message: '저장 완료!',
        error: false
      });
      
      // 2초 후 메시지 제거
      setTimeout(() => {
        setSaveStatus({
          saving: false,
          message: '',
          error: false
        });
      }, 2000);
      
      console.log('Building updated successfully with location:', locationToSave);
    } catch (error) {
      console.error("Error updating building: ", error);
      setSaveStatus({
        saving: false,
        message: '건물 정보 업데이트에 실패했습니다: ' + error.message,
        error: true
      });
    }
  };

  const deleteBuildingData = async () => {
    if (window.confirm('정말로 이 건물을 삭제하시겠습니까?')) {
      try {
        setSaveStatus({
          saving: true,
          message: '삭제 중...',
          error: false
        });
        
        // Firebase 공용 경로에서 삭제
        const buildingRef = dbRef(db, `buildings/${id}`);
        await remove(buildingRef);
  
        // 이미지 삭제
        if (building.images) {
          for (let imageUrl of building.images) {
            const imageRef = storageRef(storage, imageUrl);
            await deleteObject(imageRef);
          }
        }
  
        // 모든 저장소에서 삭제
        await deleteFromAllStorages(id);
  
        // 삭제 이벤트 발생
        const event = new Event('buildingDeleted');
        window.dispatchEvent(event);
        
        console.log("Building deleted successfully");
        navigate('/');
      } catch (error) {
        console.error("Error deleting building: ", error);
        setSaveStatus({
          saving: false,
          message: '건물 삭제에 실패했습니다: ' + error.message,
          error: true
        });
      }
    }
  };

  const isAdmin = auth.currentUser && auth.currentUser.uid === ADMIN_UID;

  if (!building) return <div className="flex justify-center items-center h-screen">Loading...</div>;

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center text-secondary-800">건물 상세 정보</h1>
      
      {/* 저장 상태 메시지 */}
      {saveStatus.message && (
        <div className={`mb-4 p-3 rounded ${saveStatus.error ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {saveStatus.message}
        </div>
      )}
      
      {editMode ? (
        <>
          <input
            name="name"
            value={building.name}
            onChange={handleInputChange}
            className="input mb-4"
            placeholder="건물 이름"
          />
          <input
            name="memo"
            value={building.memo || ''}
            onChange={handleInputChange}
            placeholder="입출입 특이사항 메모"
            className="input mb-4"
            type="text"
          />
          <textarea
            name="note"
            value={building.note || ''}
            onChange={handleInputChange}
            className="input mb-4"
            placeholder="특이사항"
            rows="4"
          />
          <textarea
            name="shortcut"
            value={building.shortcut || ''}
            onChange={handleInputChange}
            className="input mb-4"
            placeholder="샛길 정보"
            rows="4"
          />
          {/* 지도 위치 등록 버튼 추가 */}
          <div className="mb-4">
            <button
              onClick={() => setShowMapSelector(true)}
              className="btn btn-secondary mb-2"
            >
              {building.location ? '지도 위치 수정' : '지도에 위치 등록'}
            </button>
            {building.location && (
              <div>
                <p className="text-sm text-gray-600">
                  위도: {building.location.lat.toFixed(6)}, 경도: {building.location.lng.toFixed(6)}
                </p>
                <div className="mt-1 p-2 bg-gray-100 rounded-md text-xs text-gray-500">
                  위치 정보가 변경되었습니다. 저장 버튼을 눌러 완료하세요.
                </div>
              </div>
            )}
          </div>
          <div className="mb-4">
            <button
              onClick={() => fileInputRef.current.click()}
              className="btn btn-secondary"
            >
              이미지 추가 ({building.images ? building.images.length : 0}/2)
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageUpload}
              className="hidden"
              accept="image/*"
            />
          </div>
          {building.images && building.images.map((image, index) => (
            <div key={index} className="mb-4">
              <img src={image} alt={`Building ${index + 1}`} className="w-full rounded mb-2" />
              <button 
                onClick={() => deleteImage(index)}
                className="btn btn-danger"
              >
                이미지 삭제
              </button>
            </div>
          ))}
          <div className="flex justify-center space-x-4">
            <button 
              onClick={updateBuildingData} 
              className="btn btn-primary"
              disabled={saveStatus.saving}
            >
              {saveStatus.saving ? (
                <span className="flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  저장 중...
                </span>
              ) : (
                '저장'
              )}
            </button>
            <button 
              onClick={() => setEditMode(false)} 
              className="btn btn-secondary"
              disabled={saveStatus.saving}
            >
              취소
            </button>
          </div>
          
          {/* 디버그 정보 */}
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs font-mono">
            <p className="font-bold mb-1">디버그 정보:</p>
            <p>건물 ID: {building.id}</p>
            <p>위치 정보: {building.location ? 'O' : 'X'}</p>
            {building.location && (
              <>
                <p>위도: {building.location.lat} (타입: {typeof building.location.lat})</p>
                <p>경도: {building.location.lng} (타입: {typeof building.location.lng})</p>
              </>
            )}
          </div>
        </>
      ) : (
        <>
          <p className="text-xl mb-4"><strong>이름:</strong> {building.name}</p>
          <p className="text-xl mb-4"><strong>입출입 특이사항 메모:</strong> {building.memo || '없음'}</p>
          <p className="text-xl mb-4"><strong>특이사항:</strong> {building.note || '없음'}</p>
          <p className="text-xl mb-4"><strong>샛길 정보:</strong> {building.shortcut || '없음'}</p>
          
          {/* 위치 정보 표시 */}
          {building.location && (
            <div className="mb-4">
              <p className="text-xl mb-1"><strong>위치 정보:</strong></p>
              <p className="text-sm text-gray-600">
                위도: {building.location.lat.toFixed(6)}, 경도: {building.location.lng.toFixed(6)}
              </p>
            </div>
          )}
          
          {building.images && building.images.map((image, index) => (
            <img key={index} src={image} alt={`Building ${index + 1}`} className="w-full mb-4 rounded" />
          ))}
          {isAdmin && (
            <div className="flex justify-center space-x-4">
              <button onClick={() => setEditMode(true)} className="btn btn-secondary">수정</button>
              <button 
                onClick={deleteBuildingData} 
                className="btn btn-danger"
                disabled={saveStatus.saving}
              >
                {saveStatus.saving ? '삭제 중...' : '삭제'}
              </button>
            </div>
          )}
          
          {/* 디버그 정보 */}
          <div className="mt-6 p-3 bg-gray-100 rounded text-xs font-mono">
            <p className="font-bold mb-1">디버그 정보:</p>
            <p>건물 ID: {building.id}</p>
            <p>위치 정보: {building.location ? 'O' : 'X'}</p>
            {building.location && (
              <>
                <p>위도: {building.location.lat} (타입: {typeof building.location.lat})</p>
                <p>경도: {building.location.lng} (타입: {typeof building.location.lng})</p>
              </>
            )}
          </div>
        </>
      )}
      <button onClick={() => navigate('/')} className="btn btn-secondary w-full mt-4">
        홈으로
      </button>
      
      {showMapSelector && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50">
          <div className="absolute top-0 left-0 w-full h-full flex flex-col">
            <div className="p-4 bg-white">
              <button 
                onClick={() => setShowMapSelector(false)}
                className="btn btn-secondary mb-2"
              >
                취소
              </button>
            </div>
            <MapLocationSelector
              initialLocation={building.location}
              onSave={handleMapLocationSave}
              onCancel={() => setShowMapSelector(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Detail;