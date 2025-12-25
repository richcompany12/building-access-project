import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from './firebase';
import { ref, onValue, push, remove, query, orderByChild } from "firebase/database";

function Suggestions({ isAdmin }) {
  const [suggestions, setSuggestions] = useState([]);
  const [newSuggestion, setNewSuggestion] = useState({ title: '', content: '' });
  const [isWriting, setIsWriting] = useState(false);
  const [expandedSuggestionId, setExpandedSuggestionId] = useState(null);

  useEffect(() => {
    const suggestionsRef = ref(db, 'suggestions');
    const suggestionsQuery = query(suggestionsRef, orderByChild('createdAt'));
    
    const unsubscribe = onValue(suggestionsQuery, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const suggestionsList = Object.entries(data).map(([id, value]) => ({ id, ...value }));
        setSuggestions(suggestionsList.reverse());
      } else {
        setSuggestions([]);
      }
    });

    return () => unsubscribe();
  }, []);

  const addSuggestion = async () => {
    if (newSuggestion.title.trim() !== '' && newSuggestion.content.trim() !== '') {
      try {
        const suggestionsRef = ref(db, 'suggestions');
        await push(suggestionsRef, { 
          ...newSuggestion,
          createdAt: Date.now()
        });
        setNewSuggestion({ title: '', content: '' });
        setIsWriting(false);
      } catch (error) {
        console.error("Error adding suggestion: ", error);
      }
    }
  };

  const deleteSuggestion = async (suggestionId) => {
    if (isAdmin) {
      if (window.confirm('정말로 이 제안을 삭제하시겠습니까?')) {
        try {
          const suggestionRef = ref(db, `suggestions/${suggestionId}`);
          await remove(suggestionRef);
        } catch (error) {
          console.error("Error deleting suggestion: ", error);
        }
      }
    } else {
      alert('제안을 삭제할 권한이 없습니다.');
    }
  };

  const toggleSuggestionExpansion = (id) => {
    setExpandedSuggestionId(expandedSuggestionId === id ? null : id);
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-center">제안하기</h1>
      {!isWriting ? (
        <>
          <ul className="mb-6 space-y-4">
            {suggestions.map(suggestion => (
              <li key={suggestion.id} className="p-4 bg-white rounded-lg shadow-md cursor-pointer" onClick={() => toggleSuggestionExpansion(suggestion.id)}>
                <h2 className="text-xl font-semibold">{suggestion.title}</h2>
                {expandedSuggestionId === suggestion.id && (
                  <div className="mt-2">
                    <p className="text-lg">{suggestion.content}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {new Date(suggestion.createdAt).toLocaleString()}
                    </p>
                    {isAdmin && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSuggestion(suggestion.id);
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
            <button 
              onClick={() => setIsWriting(true)} 
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              글쓰기
            </button>
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
            value={newSuggestion.title}
            onChange={(e) => setNewSuggestion({...newSuggestion, title: e.target.value})}
            className="w-full p-4 border rounded-lg text-lg mb-4"
            placeholder="제목"
          />
          <textarea
            value={newSuggestion.content}
            onChange={(e) => setNewSuggestion({...newSuggestion, content: e.target.value})}
            className="w-full p-4 border rounded-lg text-lg mb-4"
            placeholder="새 제안 입력"
            rows="6"
          />
          <div className="flex justify-end space-x-4">
            <button 
              onClick={addSuggestion} 
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

export default Suggestions;