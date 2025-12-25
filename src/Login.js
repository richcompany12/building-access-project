import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './Auth';

function Login() {
  const { signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithGoogle();
      navigate('/');
    } catch (error) {
      console.error("Error signing in with Google", error);
      let errorMessage = "로그인에 실패했습니다. 다시 시도해주세요.";
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = "로그인 창이 닫혔습니다. 다시 시도해주세요.";
      } else if (error.code === 'auth/cancelled-popup-request') {
        errorMessage = "로그인이 취소되었습니다. 다시 시도해주세요.";
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = "팝업이 차단되었습니다. 팝업 차단을 해제하고 다시 시도해주세요.";
      }
      setError(errorMessage);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4 text-center">로그인</h2>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <button
          onClick={handleLogin}
          className="btn btn-primary w-full"
        >
          Google로 로그인
        </button>
      </div>
    </div>
  );
}

export default Login;