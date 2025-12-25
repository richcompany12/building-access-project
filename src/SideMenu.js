import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from './Auth';
import { ADMIN_UID } from './constants';
import { resetLocalData, resetAndSyncFromFirebase, forceCloudSync } from './secureDataSync';

function SideMenu({ isOpen, onClose, hasNewNotifications }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isResetting, setIsResetting] = useState(false);

  const isAdmin = user && user.uid === ADMIN_UID;

  useEffect(() => {
    const handleBackButton = (e) => {
      if (isOpen) {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
    };
  }, [isOpen, onClose]);

  const handleResetLocalData = async () => {
    if (window.confirm('로컬 데이터를 초기화하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      setIsResetting(true);
      try {
        await resetLocalData();
        alert('로컬 데이터가 초기화되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      } catch (error) {
        console.error('데이터 초기화 중 오류 발생:', error);
        alert('데이터 초기화 중 오류가 발생했습니다.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleSyncFromFirebase = async () => {
    if (window.confirm('Firebase에서 최신 데이터를 가져와 덮어쓰시겠습니까? 로컬 변경사항이 손실될 수 있습니다.')) {
      setIsResetting(true);
      try {
        await resetAndSyncFromFirebase();
        alert('데이터가 성공적으로 동기화되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      } catch (error) {
        console.error('데이터 동기화 중 오류 발생:', error);
        alert('데이터 동기화 중 오류가 발생했습니다.');
      } finally {
        setIsResetting(false);
      }
    }
  };

  const handleDeleteIndexedDB = () => {
    if (window.confirm('브라우저의 모든 데이터를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      try {
        indexedDB.deleteDatabase('BuildingsDB');
        localStorage.clear();
        sessionStorage.clear();
        alert('브라우저 데이터가 삭제되었습니다. 페이지를 새로고침합니다.');
        window.location.reload();
      } catch (error) {
        console.error('데이터베이스 삭제 중 오류 발생:', error);
        alert('데이터베이스 삭제 중 오류가 발생했습니다.');
      }
    }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose}></div>
      )}
      <div className={`fixed inset-y-0 left-0 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} w-64 bg-white shadow-lg transition-transform duration-300 ease-in-out z-50`}>
        <div className="p-6 flex flex-col h-full">
          <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <h2 className="text-2xl font-bold mb-6">메뉴</h2>
          <nav className="flex-grow overflow-y-auto">
            <ul className="space-y-4">
              <li><Link to="/" className="text-gray-700 hover:text-gray-900" onClick={onClose}>홈</Link></li>
              <li><Link to="/register" className="text-gray-700 hover:text-gray-900" onClick={onClose}>등록</Link></li>
              <li><Link to="/search" className="text-gray-700 hover:text-gray-900" onClick={onClose}>조회</Link></li>
              <li>
                <Link to="/notices" className="text-gray-700 hover:text-gray-900" onClick={onClose}>
                  공지사항
                  {hasNewNotifications && <span className="ml-2 inline-block w-2 h-2 bg-red-500 rounded-full"></span>}
                </Link>
              </li>
              <li><Link to="/suggestions" className="text-gray-700 hover:text-gray-900" onClick={onClose}>제안하기</Link></li>
              
              {/* 데이터 관리 섹션 */}
              {user && (
                <>
                  <li className="pt-4">
                    <h3 className="font-bold text-gray-800 border-t pt-4">데이터 관리</h3>
                  </li>
                  <li>
                    <button
                      className="text-amber-600 hover:text-amber-800"
                      onClick={() => {
                        onClose();
                        handleResetLocalData();
                      }}
                      disabled={isResetting}
                    >
                      {isResetting ? '처리 중...' : '로컬 데이터 초기화'}
                    </button>
                  </li>
                  <li>
                    <button
                      className="text-amber-600 hover:text-amber-800"
                      onClick={() => {
                        onClose();
                        handleSyncFromFirebase();
                      }}
                      disabled={isResetting}
                    >
                      {isResetting ? '처리 중...' : 'Firebase에서 데이터 복구'}
                    </button>
                  </li>
                  <li>
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => {
                        onClose();
                        handleDeleteIndexedDB();
                      }}
                    >
                      브라우저 데이터 완전 삭제
                    </button>
                  </li>
                </>
              )}

              {/* 관리자 전용 메뉴 */}
              {isAdmin && (
                <>
                  <li className="pt-4">
                    <h3 className="font-bold text-gray-800 border-t pt-4">관리자 메뉴</h3>
                  </li>
                  <li>
  <button
    className="text-green-600 hover:text-green-800"
    onClick={() => {
      onClose();
      forceCloudSync();
      window.location.reload();
    }}
  >
    공용 데이터로 동기화
  </button>
</li>
                  
                  <li>
                    <button
                      className="text-blue-600 hover:text-blue-800"
                      onClick={() => {
                        if (window.confirm('앱을 완전히 초기화하고 재시작하시겠습니까?')) {
                          indexedDB.deleteDatabase('BuildingsDB');
                          localStorage.clear();
                          sessionStorage.clear();
                          window.location.href = '/';
                        }
                      }}
                    >
                      앱 완전 초기화
                    </button>
                  </li>
                </>
              )}
            </ul>
          </nav>
          {user && (
            <p className="text-sm text-gray-600 mb-4">{user.email}</p>
          )}
          {user ? (
            <button onClick={() => { logout(); onClose(); }} className="w-full bg-red-500 text-white py-2 px-4 rounded">
              로그아웃
            </button>
          ) : (
            <Link to="/login" onClick={onClose} className="w-full bg-blue-500 text-white py-2 px-4 rounded text-center block">
              로그인
            </Link>
          )}
        </div>
      </div>
    </>
  );
}

export default SideMenu;