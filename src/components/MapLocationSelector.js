import React, { useEffect, useRef, useState } from 'react';

function MapLocationSelector({ initialLocation, onSave, onCancel }) {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const markerRef = useRef(null);  // marker state 대신 ref 사용
  const currentPositionMarker = useRef(null);
  const currentPositionCircle = useRef(null);
  // 이벤트 리스너 제거를 위한 클린업 ref
  const eventCleanupRef = useRef(null);

  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('카카오 맵 SDK가 로드되지 않았습니다.');
      return;
    }

    // 초기 위치 정보 정확도 개선
    let initialLat = 33.450701;
    let initialLng = 126.570667;
    
    if (initialLocation) {
      // 문자열이나 다른 형식의 좌표값을 숫자로 변환
      initialLat = parseFloat(initialLocation.lat);
      initialLng = parseFloat(initialLocation.lng);
      
      // 유효한 좌표값인지 확인
      if (isNaN(initialLat) || isNaN(initialLng)) {
        console.error('유효하지 않은 초기 위치 좌표:', initialLocation);
        initialLat = 33.450701;
        initialLng = 126.570667;
      }
    }

    const options = {
      center: new window.kakao.maps.LatLng(initialLat, initialLng),
      level: 3
    };

    const kakaoMap = new window.kakao.maps.Map(mapContainer.current, options);
    setMap(kakaoMap);

    // 기존 위치에 마커 표시
    if (initialLocation) {
      const initialMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(initialLat, initialLng),
        map: kakaoMap
      });
      markerRef.current = initialMarker;
      
      // 초기 위치가 있으면 선택된 위치로 설정 (정확한 숫자형 좌표)
      setSelectedLocation({
        lat: initialLat,
        lng: initialLng
      });
    }

    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          // 높은 정확도의 현재 위치 가져오기
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy;
          const locPosition = new window.kakao.maps.LatLng(lat, lng);
          
          if (!initialLocation) {
            kakaoMap.setCenter(locPosition);
            
            // 초기 위치가 없으면 현재 위치를 기본 선택 위치로 설정 (숫자형 좌표)
            setSelectedLocation({
              lat: parseFloat(lat.toFixed(6)),
              lng: parseFloat(lng.toFixed(6))
            });
            
            // 현재 위치에 마커 생성
            const posMarker = new window.kakao.maps.Marker({
              position: locPosition,
              map: kakaoMap
            });
            markerRef.current = posMarker;
          }
          
          // 현재 위치 마커 표시 (다른 마커와 구별)
          const marker = new window.kakao.maps.Marker({
            position: locPosition,
            map: kakaoMap,
            image: new window.kakao.maps.MarkerImage(
              'https://t1.daumcdn.net/localimg/localimages/07/2018/pc/img/marker_spot.png',
              new window.kakao.maps.Size(24, 24),
              { offset: new window.kakao.maps.Point(12, 12) }
            )
          });
          currentPositionMarker.current = marker;
          
          // 정확도 원 표시
          const circle = new window.kakao.maps.Circle({
            center: locPosition,
            radius: accuracy,
            strokeWeight: 2,
            strokeColor: '#3F95FF',
            strokeOpacity: 0.6,
            strokeStyle: 'solid',
            fillColor: '#3F95FF',
            fillOpacity: 0.2
          });
          circle.setMap(kakaoMap);
          currentPositionCircle.current = circle;
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다.', error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }

    // 지도 클릭 이벤트
    const handleMapClick = (mouseEvent) => {
      const latlng = mouseEvent.latLng;
      
      // 클릭한 위치의 좌표를 더 정확하게 저장 (소수점 6자리까지)
      const lat = parseFloat(latlng.getLat().toFixed(6));
      const lng = parseFloat(latlng.getLng().toFixed(6));
      
      const newLocation = { lat, lng };
      console.log('새로 선택한 위치:', newLocation);
      
      setSelectedLocation(newLocation);

      // 기존 마커 제거
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }

      // 새 마커 생성
      const newMarker = new window.kakao.maps.Marker({
        position: latlng,
        map: kakaoMap
      });
      markerRef.current = newMarker;
    };

    const clickListener = window.kakao.maps.event.addListener(kakaoMap, 'click', handleMapClick);

    // 터치 이벤트를 위한 처리 (모바일 디바이스)
    let touchListeners = {};
    
    if (mapContainer.current) {
      const handleTouchEnd = (event) => {
        if (event.touches.length === 0) {
          const touch = event.changedTouches[0];
          // 브라우저에 따라 맵 컨테이너의 위치를 계산
          const rect = mapContainer.current.getBoundingClientRect();
          const x = touch.clientX - rect.left;
          const y = touch.clientY - rect.top;
          
          try {
            // 지도 상의 위치로 변환
            const projection = kakaoMap.getProjection();
            const point = new window.kakao.maps.Point(x, y);
            const position = projection.containerPointToCoordinate(point);
            
            // 좌표를 더 정확하게 저장 (소수점 6자리까지)
            const lat = parseFloat(position.getLat().toFixed(6));
            const lng = parseFloat(position.getLng().toFixed(6));
            
            const newLocation = { lat, lng };
            console.log('터치로 선택한 위치:', newLocation);
            
            setSelectedLocation(newLocation);

            // 기존 마커 제거
            if (markerRef.current) {
              markerRef.current.setMap(null);
            }

            // 새 마커 생성
            const newMarker = new window.kakao.maps.Marker({
              position: position,
              map: kakaoMap
            });
            markerRef.current = newMarker;
          } catch (err) {
            console.error('터치 위치를 지도 좌표로 변환하는 중 오류 발생:', err);
          }
        }
      };

      mapContainer.current.addEventListener('touchend', handleTouchEnd);
      touchListeners.touchend = handleTouchEnd;
      
      // 이벤트 클린업 함수 저장
      eventCleanupRef.current = {
        clickListener,
        touchListeners,
        mapContainer: mapContainer.current
      };
    }

    return () => {
      if (clickListener) {
        window.kakao.maps.event.removeListener(clickListener);
      }
      
      // 터치 이벤트 제거
      if (eventCleanupRef.current && eventCleanupRef.current.mapContainer) {
        const container = eventCleanupRef.current.mapContainer;
        const touchListeners = eventCleanupRef.current.touchListeners;
        
        if (touchListeners.touchend) {
          container.removeEventListener('touchend', touchListeners.touchend);
        }
      }
      
      // 마커 제거
      if (markerRef.current) {
        markerRef.current.setMap(null);
      }
      
      if (currentPositionMarker.current) {
        currentPositionMarker.current.setMap(null);
      }
      
      if (currentPositionCircle.current) {
        currentPositionCircle.current.setMap(null);
      }
    };
  }, [initialLocation]);

  const handleSave = () => {
    if (selectedLocation) {
      // 저장 전에 좌표를 정확한 형식으로 변환 (소수점 6자리 숫자형)
      const preciseLocation = {
        lat: parseFloat(selectedLocation.lat.toFixed(6)),
        lng: parseFloat(selectedLocation.lng.toFixed(6))
      };
      
      console.log('저장하는 정확한 위치:', preciseLocation);
      onSave(preciseLocation);
    }
  };

  return (
    <div className="flex-1 flex flex-col">
      <div 
  ref={mapContainer} 
  style={{ 
    width: '100%', 
    height: 'calc(100vh - 200px)', // 상단 네비게이션과 하단 버튼 영역 고려
    minHeight: '400px' 
  }}
/>
      <div className="p-4 bg-white">
        {selectedLocation && (
          <div className="mb-2 text-xs text-gray-600">
            <p>위도: {selectedLocation.lat.toFixed(6)}</p>
            <p>경도: {selectedLocation.lng.toFixed(6)}</p>
          </div>
        )}
        <p className="text-sm text-gray-600 mb-4">
          지도를 클릭하여 위치를 선택하세요
        </p>
        <div className="flex space-x-2">
          <button
            onClick={handleSave}
            className="btn btn-primary flex-1"
            disabled={!selectedLocation}
          >
            위치 저장
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              className="btn btn-secondary flex-1"
            >
              취소
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapLocationSelector;