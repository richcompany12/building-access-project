import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getAllBuildings } from './indexedDB';

function Search() {
  const [searchTerm, setSearchTerm] = useState('');
  const [buildings, setBuildings] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [recentBuildings, setRecentBuildings] = useState([]);
  const [showAllBuildings, setShowAllBuildings] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsList = await getAllBuildings();
        console.log('Buildings loaded in Search component:', buildingsList);
        setBuildings(buildingsList.reverse());
        setRecentBuildings(buildingsList.slice(0, 5));
      } catch (error) {
        console.error('Error loading buildings in Search component:', error);
      }
    };

    loadBuildings();
  }, []);

  useEffect(() => {
    // 컴포넌트가 마운트된 후 입력 필드에 포커스
    if (inputRef.current) {
      inputRef.current.focus();
      // 숫자 키패드가 나타나도록 inputMode 설정
      inputRef.current.setAttribute('inputmode', 'numeric');
    }
  }, []);

  // 초성 추출 함수
  const getInitials = (str) => {
    const initialConsonants = [
      'ㄱ', 'ㄲ', 'ㄴ', 'ㄷ', 'ㄸ', 'ㄹ', 'ㅁ', 'ㅂ', 'ㅃ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅉ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'
    ];
    return str.split('').map(char => {
      const code = char.charCodeAt(0) - 44032;
      if (code > -1 && code < 11172) return initialConsonants[Math.floor(code / 588)];
      return char;
    }).join('');
  };

  // 숫자 추출 함수
  const extractNumbers = (str) => {
    return str.replace(/[^0-9]/g, '');
  };

  // 공백 및 특수문자 제거 함수
  const removeSpacesAndSpecialChars = (str) => {
    return str.replace(/[\s{}[\]/?.,;:|)*~`!^\-_+<>@#$%&\\=('"]/g, '');
  };

  useEffect(() => {
    if (searchTerm.length > 0) {
      const results = buildings.filter(building => {
        if (!building || !building.name) return false;

        const buildingName = removeSpacesAndSpecialChars(building.name.toLowerCase());
        const searchTermCleaned = removeSpacesAndSpecialChars(searchTerm.toLowerCase());

        // 전체 글자 매칭 (중간 글자 포함)
        if (buildingName.includes(searchTermCleaned)) return true;

        // 초성 매칭 (중간 초성 포함)
        const buildingInitials = getInitials(buildingName);
        const searchInitials = getInitials(searchTermCleaned);
        if (buildingInitials.includes(searchInitials)) return true;

        // 숫자 연속 매칭
        const buildingNumbers = extractNumbers(buildingName);
        const searchNumbers = extractNumbers(searchTermCleaned);
        if (searchNumbers.length > 0 && buildingNumbers.includes(searchNumbers)) return true;

        return false;
      });

      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, buildings]);

  const InfoIndicator = ({ building }) => {
    return (
      <div className="flex flex-col items-center">
        {building.memo && <div className="w-2 h-2 rounded-full bg-red-500 mb-1" title="입출입 특이사항 메모"></div>}
        {building.note && <div className="w-2 h-2 rounded-full bg-black mb-1" title="특이사항"></div>}
        {building.shortcut && <div className="w-2 h-2 rounded-full bg-pink-500 mb-1" title="샛길 정보"></div>}
        {building.images && building.images.length > 0 && <div className="w-2 h-2 rounded-full bg-yellow-700 mb-1" title="이미지"></div>}
        {building.location && <div className="w-2 h-2 rounded-full bg-sky-400" title="지도에 위치 등록됨"></div>}
      </div>
    );
  };

  const handleCopyAndRegister = (building) => {
    const buildingData = {
      name: building.name,
      memo: building.memo || '',
      note: building.note || '',
      shortcut: building.shortcut || '',
      images: [], // 이미지는 복사하지 않음
      location: null // 지도 위치도 복사하지 않음
    };
    navigate('/register', { state: { buildingData } });
  };

  const renderBuildingList = (buildingList) => {
    return buildingList.map(building => (
      <li 
        key={building.id} 
        className="bg-secondary-100 p-3 mb-2 rounded flex items-center"
      >
        <Link to={`/detail/${building.id}`} className="text-lg hover:text-primary-600 flex-grow truncate mr-2">
          {building.name}
        </Link>
        <div className="flex items-center">
          <InfoIndicator building={building} />
          <button
            onClick={(e) => {
              e.preventDefault();
              handleCopyAndRegister(building);
            }}
            className="ml-2 p-1 bg-secondary-200 rounded"
            title="복사등록"
          >
            <svg className="w-5 h-5 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
        </div>
      </li>
    ));
  };

  return (
    <div className="p-4 flex flex-col max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-secondary-800">건물 조회</h1>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowAllBuildings(!showAllBuildings)}
            className="btn btn-secondary"
          >
            {showAllBuildings ? "최근 건물만 보기" : "모든 건물 보기"}
          </button>
          <Link to="/register" className="btn btn-secondary">
            등록하기
          </Link>
        </div>
      </div>

      <input
  ref={inputRef}
  className="input mb-4"
  value={searchTerm}
  onChange={(e) => setSearchTerm(e.target.value)}
  placeholder="건물 이름 검색 (초성, 전체 텍스트, 숫자 검색 가능)"
  type="text"
  inputMode="numeric" // 숫자 키패드를 기본으로 표시
/>
      {searchTerm.length > 0 ? (
        <>
          <ul className="overflow-auto flex-grow mb-4">
            {renderBuildingList(searchResults)}
          </ul>
          <p className="mb-4 text-secondary-600">검색 결과 수: {searchResults.length}</p>
        </>
      ) : (
        <>
          <h2 className="text-2xl font-bold mb-4 text-secondary-700">
            {showAllBuildings ? "모든 건물 목록" : "최근 등록된 건물"}
          </h2>
          <ul className="overflow-auto flex-grow mb-4">
            {renderBuildingList(showAllBuildings ? buildings : recentBuildings)}
          </ul>
        </>
      )}
      <Link to="/" className="btn btn-secondary text-center">
        홈으로
      </Link>
    </div>
  );
}

export default Search;