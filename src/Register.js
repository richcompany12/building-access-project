import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { saveBuilding } from './indexedDB';
import MapLocationSelector from './components/MapLocationSelector';

function Register() {
  // 기존 코드 유지
  const navigate = useNavigate();
  const location = useLocation();
  
  // location.state에서 초기 데이터 추출
  const initialBuildingData = location.state?.buildingData || {
    name: '',
    memo: '',
    note: '',
    shortcut: '',
    images: []
  };
  
  const initialLocation = location.state?.location || null;
  
  const [buildingData, setBuildingData] = useState(initialBuildingData);
  const [showMap, setShowMap] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation || buildingData.location);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeField, setActiveField] = useState('name');
  
  // 입력 필드에 대한 ref 추가
  const nameInputRef = useRef(null);
  const memoInputRef = useRef(null);

  // 컴포넌트가 마운트되면 건물 이름 필드에 자동 포커스 및 키패드 표시
  useEffect(() => {
    if (nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, []);
  
  // 위치 정보가 넘어오면 buildingData에 저장
  useEffect(() => {
    if (initialLocation) {
      setBuildingData(prev => ({
        ...prev,
        location: initialLocation
      }));
    }
  }, [initialLocation]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBuildingData({
      ...buildingData,
      [name]: value
    });
  };

  const handleFieldFocus = (fieldName) => {
    setActiveField(fieldName);
    console.log('Active field set to:', fieldName);
  };

  // 특수 문자 단축키 삽입 함수
  const insertSpecialChar = (char) => {
    console.log('insertSpecialChar called with:', char, 'for field:', activeField);
    
    switch(activeField) {
      case 'name':
        const nameValue = buildingData.name || '';
        const nameInput = document.getElementById('name');
        
        if (nameInput && nameInput === document.activeElement) {
          // 커서 위치에 삽입
          const start = nameInput.selectionStart || 0;
          const end = nameInput.selectionEnd || 0;
          const newValue = nameValue.substring(0, start) + char + nameValue.substring(end);
          
          setBuildingData({
            ...buildingData,
            name: newValue
          });
          
          // 포커스와 커서 위치 유지
          setTimeout(() => {
            nameInput.focus();
            nameInput.setSelectionRange(start + char.length, start + char.length);
          }, 50);
        } else {
          // 필드의 끝에 추가
          setBuildingData({
            ...buildingData,
            name: nameValue + char
          });
          
          setTimeout(() => {
            if (nameInput) {
              nameInput.focus();
              nameInput.setSelectionRange(nameValue.length + char.length, nameValue.length + char.length);
            }
          }, 50);
        }
        break;
        
      case 'memo':
        const memoValue = buildingData.memo || '';
        const memoInput = document.getElementById('memo');
        
        if (memoInput && memoInput === document.activeElement) {
          // 커서 위치에 삽입
          const start = memoInput.selectionStart || 0;
          const end = memoInput.selectionEnd || 0;
          const newValue = memoValue.substring(0, start) + char + memoValue.substring(end);
          
          setBuildingData({
            ...buildingData,
            memo: newValue
          });
          
          // 포커스와 커서 위치 유지
          setTimeout(() => {
            memoInput.focus();
            memoInput.setSelectionRange(start + char.length, start + char.length);
          }, 50);
        } else {
          // 필드의 끝에 추가
          setBuildingData({
            ...buildingData,
            memo: memoValue + char
          });
          
          setTimeout(() => {
            if (memoInput) {
              memoInput.focus();
              memoInput.setSelectionRange(memoValue.length + char.length, memoValue.length + char.length);
            }
          }, 50);
        }
        break;
        
      case 'shortcut':
        const shortcutValue = buildingData.shortcut || '';
        const shortcutInput = document.getElementById('shortcut');
        
        if (shortcutInput && shortcutInput === document.activeElement) {
          // 커서 위치에 삽입
          const start = shortcutInput.selectionStart || 0;
          const end = shortcutInput.selectionEnd || 0;
          const newValue = shortcutValue.substring(0, start) + char + shortcutValue.substring(end);
          
          setBuildingData({
            ...buildingData,
            shortcut: newValue
          });
          
          // 포커스와 커서 위치 유지
          setTimeout(() => {
            shortcutInput.focus();
            shortcutInput.setSelectionRange(start + char.length, start + char.length);
          }, 50);
        } else {
          // 필드의 끝에 추가
          setBuildingData({
            ...buildingData,
            shortcut: shortcutValue + char
          });
          
          setTimeout(() => {
            if (shortcutInput) {
              shortcutInput.focus();
              shortcutInput.setSelectionRange(shortcutValue.length + char.length, shortcutValue.length + char.length);
            }
          }, 50);
        }
        break;
        
      case 'note':
        const noteValue = buildingData.note || '';
        const noteInput = document.getElementById('note');
        
        if (noteInput && noteInput === document.activeElement) {
          // 커서 위치에 삽입
          const start = noteInput.selectionStart || 0;
          const end = noteInput.selectionEnd || 0;
          const newValue = noteValue.substring(0, start) + char + noteValue.substring(end);
          
          setBuildingData({
            ...buildingData,
            note: newValue
          });
          
          // 포커스와 커서 위치 유지
          setTimeout(() => {
            noteInput.focus();
            noteInput.setSelectionRange(start + char.length, start + char.length);
          }, 50);
        } else {
          // 필드의 끝에 추가
          setBuildingData({
            ...buildingData,
            note: noteValue + char
          });
          
          setTimeout(() => {
            if (noteInput) {
              noteInput.focus();
              noteInput.setSelectionRange(noteValue.length + char.length, noteValue.length + char.length);
            }
          }, 50);
        }
        break;
        
      default:
        // 기본값으로 memo 필드 사용
        const defaultMemoValue = buildingData.memo || '';
        const defaultMemoInput = document.getElementById('memo');
        
        setBuildingData({
          ...buildingData,
          memo: defaultMemoValue + char
        });
        
        setTimeout(() => {
          if (defaultMemoInput) {
            defaultMemoInput.focus();
            defaultMemoInput.setSelectionRange(defaultMemoValue.length + char.length, defaultMemoValue.length + char.length);
          }
        }, 50);
    }
  };

  const handleSaveBuilding = async () => {
    if (!buildingData.name.trim()) {
      setError('건물 이름을 입력해주세요.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      // 위치 정보 추가
      const dataToSave = {
        ...buildingData,
        location: selectedLocation || buildingData.location,
        timestamp: new Date().toISOString(),
        id: buildingData.id || Date.now().toString()
      };

      // IndexedDB에 저장
      await saveBuilding(dataToSave);
      navigate('/');
    } catch (error) {
      console.error('건물 저장 중 오류 발생:', error);
      setError('건물 정보 저장 중 오류가 발생했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleMapSave = (location) => {
    setSelectedLocation(location);
    setBuildingData(prev => ({
      ...prev,
      location
    }));
    setShowMap(false);
  };

  const handleMapCancel = () => {
    setShowMap(false);
  };

  return (
    <div className="container p-4 max-w-xl mx-auto">
      {showMap ? (
        <div className="fixed inset-0 z-50 bg-white flex flex-col">
          <div className="p-4 bg-primary text-white flex justify-between items-center">
            <h2 className="text-xl font-bold">위치 선택</h2>
            <button 
              onClick={handleMapCancel}
              className="p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <MapLocationSelector 
            initialLocation={selectedLocation || buildingData.location} 
            onSave={handleMapSave}
            onCancel={handleMapCancel}
          />
        </div>
      ) : (
        <div className="animate-fade-in">
        <h1 className="text-3xl font-bold mb-6 text-center text-primary">건물 등록</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="name">
            건물 이름 <span className="text-red-500">*</span>
          </label>
          <input
            id="name"
            name="name"
            type="text"
            value={buildingData.name}
            onChange={handleInputChange}
            onFocus={() => handleFieldFocus('name')}
            className="input"
            placeholder="건물 이름 입력"
            ref={nameInputRef}
            autoFocus
            inputMode="text" // 한글 키패드가 뜨도록 설정
            required
          />
          <div className="grid grid-cols-4 gap-2 mt-2">
            <button onClick={() => insertSpecialChar('동')} className="btn btn-xs">동</button>
            <button onClick={() => insertSpecialChar('라인')} className="btn btn-xs">라인</button>
            <button onClick={() => insertSpecialChar('-')} className="btn btn-xs">-</button>
            <button onClick={() => insertSpecialChar(',')} className="btn btn-xs">,</button>
            
            <button onClick={() => insertSpecialChar('1,2라인')} className="btn btn-xs">1,2라인</button>
            <button onClick={() => insertSpecialChar('1,2,3라인')} className="btn btn-xs">1,2,3라인</button>
            <button onClick={() => insertSpecialChar('3,4라인')} className="btn btn-xs">3,4라인</button>
            <button onClick={() => insertSpecialChar('3,4,5라인')} className="btn btn-xs">3,4,5라인</button>
            
            <button onClick={() => insertSpecialChar('3,5라인')} className="btn btn-xs">3,5라인</button>
            <button onClick={() => insertSpecialChar('4,5라인')} className="btn btn-xs">4,5라인</button>
            <button onClick={() => insertSpecialChar('5,6라인')} className="btn btn-xs">5,6라인</button>
            <button onClick={() => insertSpecialChar('7,8라인')} className="btn btn-xs">7,8라인</button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="memo">
            출입 정보
          </label>
          <textarea
            id="memo"
            name="memo"
            value={buildingData.memo}
            onChange={handleInputChange}
            onFocus={() => handleFieldFocus('memo')}
            className="input"
            placeholder="건물 출입 관련 정보 (비밀번호 등)"
            rows="2"
            ref={memoInputRef}
            inputMode="numeric" // 숫자 키패드가 뜨도록 설정
          />
          <div className="grid grid-cols-3 gap-2 mt-2">
            <button onClick={() => insertSpecialChar('#')} className="btn btn-xs">#</button>
            <button onClick={() => insertSpecialChar('*')} className="btn btn-xs">*</button>
            <button onClick={() => insertSpecialChar('호출')} className="btn btn-xs">호출</button>
            
            <button onClick={() => insertSpecialChar('입력')} className="btn btn-xs">입력</button>
            <button onClick={() => insertSpecialChar('비번')} className="btn btn-xs">비번</button>
            <button onClick={() => insertSpecialChar('열쇠')} className="btn btn-xs">열쇠</button>
            
            <button onClick={() => insertSpecialChar('종')} className="btn btn-xs">종</button>
            <button onClick={() => insertSpecialChar('경비')} className="btn btn-xs">경비</button>
            <button onClick={() => insertSpecialChar('엔터')} className="btn btn-xs">엔터</button>
          </div>
        </div>

        {/* 기존 나머지 입력 필드 유지 */}
        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="shortcut">
            샛길 정보
          </label>
          <textarea
            id="shortcut"
            name="shortcut"
            value={buildingData.shortcut}
            onChange={handleInputChange}
            onFocus={() => handleFieldFocus('shortcut')}
            className="input"
            placeholder="샛길 정보 입력"
            rows="2"
            inputMode="text" // 일반 키패드
          />
        </div>

        <div className="mb-4">
          <label className="block text-gray-700 mb-2" htmlFor="note">
            특이사항
          </label>
          <textarea
            id="note"
            name="note"
            value={buildingData.note}
            onChange={handleInputChange}
            onFocus={() => handleFieldFocus('note')}
            className="input"
            placeholder="기타 특이사항 입력"
            rows="3"
            inputMode="text" // 일반 키패드
          />
        </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label className="block text-gray-700">위치 정보</label>
              <button
                onClick={() => setShowMap(true)}
                className="btn btn-secondary btn-sm"
              >
                지도에서 선택
              </button>
            </div>
            {selectedLocation ? (
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm">
                  <strong>위도:</strong> {selectedLocation.lat.toFixed(6)}
                </p>
                <p className="text-sm">
                  <strong>경도:</strong> {selectedLocation.lng.toFixed(6)}
                </p>
              </div>
            ) : buildingData.location ? (
              <div className="bg-gray-100 p-3 rounded">
                <p className="text-sm">
                  <strong>위도:</strong> {buildingData.location.lat.toFixed(6)}
                </p>
                <p className="text-sm">
                  <strong>경도:</strong> {buildingData.location.lng.toFixed(6)}
                </p>
              </div>
            ) : (
              <p className="text-sm text-gray-500">지도에서 위치를 선택해 주세요</p>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSaveBuilding}
              disabled={isSaving}
              className="btn btn-primary flex-1"
            >
              {isSaving ? (
                <span className="flex items-center justify-center">
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>
                  저장 중...
                </span>
              ) : (
                '저장'
              )}
            </button>
            <button
              onClick={() => navigate('/')}
              className="btn btn-secondary flex-1"
              disabled={isSaving}
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Register;