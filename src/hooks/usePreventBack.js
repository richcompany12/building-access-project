import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

export function usePreventBack() {
  const navigate = useNavigate();

  const preventBack = useCallback((event) => {
    event.preventDefault();
    event.returnValue = '';
  }, []);

  const handlePopState = useCallback(() => {
    if (window.confirm('앱을 종료하시겠습니까?')) {
      window.removeEventListener('beforeunload', preventBack);
      window.close();
    } else {
      navigate('/');
    }
  }, [navigate, preventBack]);

  useEffect(() => {
    window.history.pushState(null, '', window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    window.addEventListener('beforeunload', preventBack);

    return () => {
      window.removeEventListener('popstate', handlePopState);
      window.removeEventListener('beforeunload', preventBack);
    };
  }, [handlePopState, preventBack]);
}