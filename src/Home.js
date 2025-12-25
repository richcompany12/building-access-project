import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getAllBuildings } from './indexedDB';
import { KakaoMap } from './components';
import { syncData } from './secureDataSync';

function Home() {
  const [buildings, setBuildings] = useState([]);
  const [activeTab, setActiveTab] = useState('list'); // 'list' or 'map'
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(8);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadBuildings = async () => {
      setLoading(true);
      try {
        // 먼저 동기화를 수행하여 최신 데이터 확보
        await syncData();
        
        // 데이터 로드
        const buildingsList = await getAllBuildings();
        // 원본 데이터를 변경하지 않도록 복사본을 만들어 역순 정렬
        setBuildings([...buildingsList].reverse());
      } catch (error) {
        console.error('건물 데이터 로드 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    };
  
    loadBuildings();
  }, [activeTab]);

  // 새로고침 기능 추가
  const refreshData = async () => {
    setLoading(true);
    try {
      await syncData();
      const buildingsList = await getAllBuildings();
      setBuildings(buildingsList.reverse());
      setCurrentPage(1); // 첫 페이지로 초기화
    } catch (error) {
      console.error('데이터 새로고침 중 오류 발생:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // 페이지네이션 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentBuildings = buildings.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(buildings.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // 보여줄 페이지 번호 범위 계산 (현재페이지 ± 3)
  const getPageNumbers = () => {
    const start = Math.max(1, currentPage - 3);
    const end = Math.min(totalPages, currentPage + 3);
    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="container p-4 animate-fade-in">
      <h1 className="text-3xl font-bold mb-6 text-center text-primary">스마트 라이더</h1>
      
      {/* 탭 버튼 추가 */}
      <div className="flex mb-6 border-b">
        <button
          onClick={() => setActiveTab('list')}
          className={`flex-1 py-3 px-4 text-lg transition-all ${activeTab === 'list' 
            ? 'border-b-2 border-primary text-primary font-medium' 
            : 'text-gray-600'}`}
        >
          건물 목록
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 py-3 px-4 text-lg transition-all ${activeTab === 'map' 
            ? 'border-b-2 border-primary text-primary font-medium' 
            : 'text-gray-600'}`}
        >
          지도로 조회/등록
        </button>
      </div>

      {activeTab === 'list' ? (
        <div className="animate-slide-in">
          <div className="flex justify-between mb-4">
            <Link to="/register" className="btn btn-primary btn-lg">
              건물 등록
            </Link>
            <button 
              onClick={refreshData} 
              className="btn btn-secondary btn-lg flex items-center"
              disabled={loading}
            >
              {loading ? (
                <span className="inline-block w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2"></span>
              ) : (
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              )}
              {loading ? '로딩 중...' : '새로고침'}
            </button>
          </div>
          
          <Link to="/search" className="btn btn-secondary mb-6 w-full text-center py-3 text-lg">
            건물 조회
          </Link>
          
          <h2 className="text-2xl font-bold mb-4">최근 등록된 건물</h2>
          
          {loading ? (
            <div className="flex justify-center my-6">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : buildings.length === 0 ? (
            <div className="card p-6 text-center text-gray-500 my-6">
              <p className="text-lg">등록된 건물이 없습니다.</p>
              <Link to="/register" className="btn btn-primary mt-4">첫 건물 등록하기</Link>
            </div>
          ) : (
            <ul className="mb-6">
              {currentBuildings.map(building => (
  <li 
    key={building.id}
    className="bg-secondary-100 p-3 mb-2 rounded flex items-center hover:shadow-md transition-all"
  >
    <Link to={`/detail/${building.id}`} className="text-lg hover:text-primary flex-grow truncate mr-2">
      {building.name}
    </Link>
    <div className="flex items-center">
      <InfoIndicator building={building} />
      <button
        onClick={(e) => {
          e.preventDefault();
          handleCopyAndRegister(building);
        }}
        className="ml-2 p-1 bg-secondary-200 rounded hover:bg-secondary-300 transition-all"
        title="복사등록"
      >
        <svg className="w-5 h-5 text-secondary-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>
    </div>
  </li>
))}
            </ul>
          )}
          
          {/* 페이지네이션 */}
          {!loading && totalPages > 1 && (
            <div className="flex justify-center items-center space-x-2 mb-4">
              {/* 맨 처음으로 */}
              <button
                onClick={() => paginate(1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded transition-all ${
                  currentPage === 1 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-white hover:bg-secondary-100 text-secondary-700 shadow-sm'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>
              
              {/* 이전 */}
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className={`px-3 py-2 rounded transition-all ${
                  currentPage === 1 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-white hover:bg-secondary-100 text-secondary-700 shadow-sm'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              {/* 페이지 번호들 (현재 ±3 범위) */}
              {getPageNumbers().map(number => (
                <button
                  key={number}
                  onClick={() => paginate(number)}
                  className={`w-10 h-10 flex items-center justify-center rounded font-medium transition-all ${
                    currentPage === number
                      ? 'bg-primary text-white shadow'
                      : 'bg-white hover:bg-secondary-100 text-secondary-700 shadow-sm'
                  }`}
                >
                  {number}
                </button>
              ))}
              
              {/* 다음 */}
              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded transition-all ${
                  currentPage === totalPages 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-white hover:bg-secondary-100 text-secondary-700 shadow-sm'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              
              {/* 맨 마지막으로 */}
              <button
                onClick={() => paginate(totalPages)}
                disabled={currentPage === totalPages}
                className={`px-3 py-2 rounded transition-all ${
                  currentPage === totalPages 
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed' 
                    : 'bg-white hover:bg-secondary-100 text-secondary-700 shadow-sm'
                }`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="animate-slide-in h-[calc(100vh-150px)]">
    <KakaoMap mode="home" />
  </div>
      )}
    </div>
  );
}

export default Home;