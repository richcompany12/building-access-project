import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from './firebase';
import { ref, onValue, push, remove, query, orderByChild } from "firebase/database";

function Notices({ isAdmin }) {
  const [notices, setNotices] = useState([]);
  const [newNotice, setNewNotice] = useState({ title: '', content: '' });
  const [isWriting, setIsWriting] = useState(false);
  const [expandedNoticeId, setExpandedNoticeId] = useState(null);

  useEffect(() => {
    const noticesRef = ref(db, 'notices');
    const noticesQuery = query(noticesRef, orderByChild('createdAt'));
    
    const unsubscribe = onValue(noticesQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const noticesList = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        setNotices(noticesList.reverse());
      } else {
        setNotices([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const addNotice = async () => {
    if (isAdmin && newNotice.title.trim() !== '' && newNotice.content.trim() !== '') {
      try {
        const noticesRef = ref(db, 'notices');
        await push(noticesRef, { 
          ...newNotice,
          createdAt: Date.now()
        });
        setNewNotice({ title: '', content: '' });
        setIsWriting(false);
      } catch (error) {
        console.error("Error adding notice: ", error);
      }
    }
  };

  const deleteNotice = async (noticeId) => {
    if (isAdmin) {
      if (window.confirm('정말로 이 공지사항을 삭제하시겠습니까?')) {
        try {
          const noticeRef = ref(db, `notices/${noticeId}`);
          await remove(noticeRef);
        } catch (error) {
          console.error("Error deleting notice: ", error);
        }
      }
    } else {
      alert('공지사항을 삭제할 권한이 없습니다.');
    }
  };

  const toggleNoticeExpansion = (id) => {
    setExpandedNoticeId(expandedNoticeId === id ? null : id);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">공지사항</h1>
      {!isWriting ? (
        <>
          <ul className="mb-6 space-y-4">
            {notices.map(notice => (
              <li key={notice.id} className="p-4 bg-white rounded-lg shadow-md cursor-pointer" onClick={() => toggleNoticeExpansion(notice.id)}>
                <h2 className="text-xl font-semibold">{notice.title}</h2>
                {expandedNoticeId === notice.id && (
                  <div className="mt-2">
                    <p className="text-lg">{notice.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(notice.createdAt).toLocaleString()}
                    </p>
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotice(notice.id);
                        }}
                        className="mt-2 bg-red-500 text-white px-3 py-1 rounded"
                      >
                        삭제
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
          <div className="flex justify-between">
            {isAdmin && (
              <button 
                onClick={() => setIsWriting(true)} 
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
              >
                글쓰기
              </button>
            )}
            <Link 
              to="/" 
              className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              홈으로 가기
            </Link>
          </div>
        </>
      ) : (
        <div className="mb-6">
          <input
            type="text"
            value={newNotice.title}
            onChange={(e) => setNewNotice({...newNotice, title: e.target.value})}
            className="w-full p-4 border rounded-lg text-lg mb-4"
            placeholder="제목"
          />
          <textarea
            value={newNotice.content}
            onChange={(e) => setNewNotice({...newNotice, content: e.target.value})}
            className="w-full p-4 border rounded-lg text-lg mb-4"
            placeholder="새 공지사항 입력"
            rows="6"
          />
          <div className="flex justify-end space-x-4">
            <button 
              onClick={addNotice} 
              className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              저장
            </button>
            <button 
              onClick={() => setIsWriting(false)} 
              className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Notices;