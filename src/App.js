import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { db } from './firebase';
import { ref, onValue, query, orderByChild, get } from 'firebase/database';
import { AuthProvider, useAuth } from './Auth';
import SideMenu from './SideMenu';
import Home from './Home';
import Register from './Register';
import Search from './Search';
import Detail from './Detail';
import Notices from './Notices';
import Suggestions from './Suggestions';
import Login from './Login';
import { ADMIN_UID } from './constants';
import './App.css';
import { getAllBuildings, recoverDataFromFirebase } from './indexedDB';
import { initializeSync, syncData } from './secureDataSync';

function Popup({ imageUrl, onClose, onDontShowToday }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white p-4 rounded-lg max-w-lg w-full" onClick={e => e.stopPropagation()}>
        <img src={imageUrl} alt="Popup" className="w-full h-auto mb-4" />
        <div className="flex items-center justify-between">
          <label className="flex items-center">
            <input type="checkbox" onChange={onDontShowToday} className="mr-2" />
            <span>오늘 하루 보지 않기</span>
          </label>
          <button onClick={onClose} className="bg-blue-500 text-white px-4 py-2 rounded">
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

function AppContent() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [buildings, setBuildings] = useState([]);
  const { user, loading } = useAuth();
  const [appLoading, setAppLoading] = useState(true);
  const [showPopup, setShowPopup] = useState(false);
  const [popupImageUrl, setPopupImageUrl] = useState('');
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let backPressCount = 0;
    let backPressTimer;

    const handleBackButton = (e) => {
      if (isMenuOpen) {
        e.preventDefault();
        setIsMenuOpen(false);
      } else if (location.pathname === '/') {
        e.preventDefault();
        backPressCount++;
        if (backPressCount === 2) {
          if (window.confirm('앱을 종료하시겠습니까?')) {
            window.close();
          }
        } else {
          backPressTimer = setTimeout(() => {
            backPressCount = 0;
          }, 2000);
        }
      } else {
        if (location.pathname === '/register') {
          navigate('/');
        } else {
          navigate(-1);
        }
      }
    };

    window.addEventListener('popstate', handleBackButton);

    return () => {
      window.removeEventListener('popstate', handleBackButton);
      clearTimeout(backPressTimer);
    };
  }, [location, navigate, isMenuOpen]);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        await initializeSync();
        const wasRecovered = await recoverDataFromFirebase();
        if (wasRecovered) {
          console.log('데이터가 성공적으로 복구되었습니다.');
        } else {
          console.log('기존 데이터가 존재합니다. 복구가 필요하지 않습니다.');
        }
        
        const buildingsList = await getAllBuildings();
        setBuildings(buildingsList.reverse());
      } catch (error) {
        console.error('데이터 초기화 중 오류 발생:', error);
      } finally {
        setAppLoading(false);
      }
    };

    initializeApp();
  }, []);

  // 건물 삭제 이벤트 리스너 추가
  useEffect(() => {
    const handleBuildingDeleted = async () => {
      console.log('건물 삭제 이벤트 감지');
      try {
        // 새로운 데이터 로드
        const updatedBuildings = await getAllBuildings();
        setBuildings(updatedBuildings.reverse());
      } catch (error) {
        console.error('건물 목록 업데이트 실패:', error);
      }
    };

    window.addEventListener('buildingDeleted', handleBuildingDeleted);
    
    return () => {
      window.removeEventListener('buildingDeleted', handleBuildingDeleted);
    };
  }, []);

  useEffect(() => {
    const noticesRef = ref(db, 'notices');
    const noticesQuery = query(noticesRef, orderByChild('createdAt'));

    const unsubscribe = onValue(noticesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const lastCheckTime = sessionStorage.getItem('lastNotificationCheck') || 0;
        const hasNew = Object.values(data).some(notice => notice.createdAt > lastCheckTime);
        setHasNewNotifications(hasNew);
        sessionStorage.setItem('lastNotificationCheck', Date.now().toString());
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const checkPopup = async () => {
      const lastPopupDate = localStorage.getItem('lastPopupDate');
      const today = new Date().toDateString();
      
      if (lastPopupDate !== today) {
        const popupRef = ref(db, 'popup');
        const snapshot = await get(popupRef);
        if (snapshot.exists()) {
          const popupData = snapshot.val();
          if (popupData.active) {
            setPopupImageUrl(popupData.imageUrl);
            setShowPopup(true);
          }
        }
      }
    };

    checkPopup();
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  const handleDontShowToday = (e) => {
    e.stopPropagation();
    localStorage.setItem('lastPopupDate', new Date().toDateString());
    setShowPopup(false);
  };

  if (appLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-secondary-50">
      {showPopup && (
        <Popup
          imageUrl={popupImageUrl}
          onClose={handleClosePopup}
          onDontShowToday={handleDontShowToday}
        />
      )}
      <button 
        onClick={() => setIsMenuOpen(true)} 
        className="fixed top-4 left-4 z-40 p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition duration-300 ease-in-out"
      >
        <svg className="h-6 w-6 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
        {hasNewNotifications && (
          <span className="absolute top-0 right-0 inline-block w-3 h-3 bg-red-500 rounded-full"></span>
        )}
      </button>
      
      <SideMenu isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} hasNewNotifications={hasNewNotifications} />
      
      <div className="p-4 pt-20 max-w-4xl mx-auto">
        <Routes>
          <Route path="/" element={<Home buildings={buildings} />} />
          <Route path="/register" element={<Register />} />
          <Route path="/search" element={<Search buildings={buildings} />} />
          <Route path="/detail/:id" element={<Detail />} />
          <Route path="/notices" element={<Notices isAdmin={user?.uid === ADMIN_UID} />} />
          <Route path="/suggestions" element={<Suggestions isAdmin={user?.uid === ADMIN_UID} />} />
          <Route path="/login" element={<Login />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;