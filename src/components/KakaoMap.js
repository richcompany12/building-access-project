import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllBuildings } from '../indexedDB';

function KakaoMap({ mode = 'home' }) {
  const mapContainer = useRef(null);
  const [map, setMap] = useState(null);
  const [buildings, setBuildings] = useState([]);
  const navigate = useNavigate();
  const clickedOnMarker = useRef(false);
  const currentPositionMarker = useRef(null);
  const currentPositionCircle = useRef(null);
  const [debugInfo, setDebugInfo] = useState({
    totalBuildings: 0,
    buildingsWithLocation: 0,
    markersCreated: 0
  });

  // 건물 데이터 로드
  useEffect(() => {
    const loadBuildings = async () => {
      try {
        const buildingsList = await getAllBuildings();
        
        // 위치 정보 검증 및 변환
        const processedBuildings = buildingsList.map(building => {
          // 건물 객체 복사하여 원본 데이터 보존
          const buildingCopy = {...building};
          
          // 위치 정보가 있을 경우 숫자형으로 변환
          if (buildingCopy.location) {
            try {
              const lat = typeof buildingCopy.location.lat === 'string' 
                ? parseFloat(buildingCopy.location.lat) 
                : buildingCopy.location.lat;
                
              const lng = typeof buildingCopy.location.lng === 'string' 
                ? parseFloat(buildingCopy.location.lng) 
                : buildingCopy.location.lng;
              
              // 유효한 좌표인지 검사
              if (!isNaN(lat) && !isNaN(lng)) {
                buildingCopy.location = { lat, lng };
              } else {
                console.warn(`유효하지 않은 좌표 (건물: ${buildingCopy.name}):`, buildingCopy.location);
                buildingCopy.location = null;
              }
            } catch (error) {
              console.error(`좌표 변환 중 오류 (건물: ${buildingCopy.name}):`, error);
              buildingCopy.location = null;
            }
          }
          return buildingCopy;
        });
        
        // 위치 정보가 있는 건물 개수 확인
        const buildingsWithLocation = processedBuildings.filter(b => b.location).length;
        console.log(`위치 정보가 있는 건물: ${buildingsWithLocation}/${processedBuildings.length}`);
        
        setBuildings(processedBuildings);
        setDebugInfo(prev => ({
          ...prev,
          totalBuildings: processedBuildings.length,
          buildingsWithLocation: buildingsWithLocation
        }));
      } catch (error) {
        console.error('건물 데이터 로드 중 오류 발생:', error);
      }
    };
    loadBuildings();
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!window.kakao || !window.kakao.maps) {
      console.error('카카오 맵 SDK가 로드되지 않았습니다.');
      return;
    }

    // 지도 초기화
    const options = {
      center: new window.kakao.maps.LatLng(33.450701, 126.570667),
      level: 3
    };

    const kakaoMap = new window.kakao.maps.Map(mapContainer.current, options);
    setMap(kakaoMap);

    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const accuracy = position.coords.accuracy; // 정확도 (미터 단위)
          const locPosition = new window.kakao.maps.LatLng(lat, lng);
          
          kakaoMap.setCenter(locPosition);
          
          // 현재 위치 마커 표시
          if (currentPositionMarker.current) {
            currentPositionMarker.current.setMap(null);
          }
          
          // 현재 위치 마커 생성
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
          if (currentPositionCircle.current) {
            currentPositionCircle.current.setMap(null);
          }
          
          // 정확도 원 생성
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
        }
      );
    }
  }, []);

  // 지도 클릭 이벤트
  useEffect(() => {
    if (!map) return;
  
    let pressTimer;
    let touchCount = 0;  // 터치 개수를 추적하기 위한 변수
  
    const handleMapMouseDown = () => {
      if (!clickedOnMarker.current) {
        pressTimer = setTimeout(() => {
          const center = map.getCenter();
          const lat = parseFloat(center.getLat().toFixed(6));
          const lng = parseFloat(center.getLng().toFixed(6));
          
          navigate('/register', { 
            state: { 
              location: { lat, lng }
            } 
          });
        }, 800);
      }
    };
  
    const handleMapMouseUp = () => {
      clearTimeout(pressTimer);
      setTimeout(() => {
        clickedOnMarker.current = false;
      }, 100);
    };
  
    const handleDragStart = () => {
      clearTimeout(pressTimer);
    };
  
    // 마우스 이벤트
    window.kakao.maps.event.addListener(map, 'mousedown', handleMapMouseDown);
    window.kakao.maps.event.addListener(map, 'mouseup', handleMapMouseUp);
    window.kakao.maps.event.addListener(map, 'dragstart', handleDragStart);
  
    // 터치 이벤트 추가
    if (mapContainer.current) {
      const handleTouchStart = (e) => {
        // 터치가 두 개 이상이면 타이머를 설정하지 않음 (확대/축소 제스처)
        touchCount = e.touches.length;
        
        if (touchCount > 1) {
          clearTimeout(pressTimer);
          return;
        }
        
        if (!clickedOnMarker.current) {
          pressTimer = setTimeout(() => {
            const center = map.getCenter();
            const lat = parseFloat(center.getLat().toFixed(6));
            const lng = parseFloat(center.getLng().toFixed(6));
            
            navigate('/register', { 
              state: { 
                location: { lat, lng }
              } 
            });
          }, 800);
        }
      };
  
      const handleTouchEnd = () => {
        clearTimeout(pressTimer);
        touchCount = 0;  // 터치 카운트 초기화
        setTimeout(() => {
          clickedOnMarker.current = false;
        }, 100);
      };
  
      const handleTouchMove = () => {
        clearTimeout(pressTimer);
      };
      
      // 멀티 터치 감지를 위한 추가 이벤트 핸들러
      const handleTouchCancel = () => {
        clearTimeout(pressTimer);
        touchCount = 0;  // 터치 카운트 초기화
      };
  
      mapContainer.current.addEventListener('touchstart', handleTouchStart);
      mapContainer.current.addEventListener('touchend', handleTouchEnd);
      mapContainer.current.addEventListener('touchmove', handleTouchMove);
      mapContainer.current.addEventListener('touchcancel', handleTouchCancel);
  
      return () => {
        window.kakao.maps.event.removeListener(map, 'mousedown', handleMapMouseDown);
        window.kakao.maps.event.removeListener(map, 'mouseup', handleMapMouseUp);
        window.kakao.maps.event.removeListener(map, 'dragstart', handleDragStart);
  
        if (mapContainer.current) {
          mapContainer.current.removeEventListener('touchstart', handleTouchStart);
          mapContainer.current.removeEventListener('touchend', handleTouchEnd);
          mapContainer.current.removeEventListener('touchmove', handleTouchMove);
          mapContainer.current.removeEventListener('touchcancel', handleTouchCancel);
        }
      };
    }
  
    return () => {
      window.kakao.maps.event.removeListener(map, 'mousedown', handleMapMouseDown);
      window.kakao.maps.event.removeListener(map, 'mouseup', handleMapMouseUp);
      window.kakao.maps.event.removeListener(map, 'dragstart', handleDragStart);
    };
  }, [map, navigate]);

  // 건물 마커 표시
  useEffect(() => {
    if (!map || !buildings.length) return;

    console.log('건물 마커 생성 시작:', buildings.length, '개 건물');
    
    // 기존에 생성된 마커 제거
    const markers = [];
    let markersCreated = 0;
    
    buildings.forEach((building) => {
      // 위치 정보 확인
      if (building.location && typeof building.location === 'object') {
        try {
          // 위치 정보를 숫자형으로 확실하게 변환
          const lat = parseFloat(String(building.location.lat));
          const lng = parseFloat(String(building.location.lng));
          
          // 유효한 좌표인지 확인
          if (isNaN(lat) || isNaN(lng)) {
            console.warn(`유효하지 않은 좌표 (건물: ${building.name}):`, building.location);
            return;
          }
          
          console.log(`마커 생성: ${building.name}, 위치: ${lat}, ${lng}`);
          
          // 마커 생성
          const marker = new window.kakao.maps.Marker({
            position: new window.kakao.maps.LatLng(lat, lng),
            map: map
          });
          
          markers.push(marker);
          markersCreated++;

          let markerPressTimer;

          // 마커 클릭 (짧은 클릭) - 정보 표시
          window.kakao.maps.event.addListener(marker, 'click', function() {
            clickedOnMarker.current = true;
            showBuildingInfo(building, marker);
          });

          // 마커 mousedown - 길게 누르면 상세 화면으로
          window.kakao.maps.event.addListener(marker, 'mousedown', function() {
            clickedOnMarker.current = true;
            markerPressTimer = setTimeout(() => {
              navigate(`/detail/${building.id}`);
            }, 800);
          });

          // 마커 mouseup
          window.kakao.maps.event.addListener(marker, 'mouseup', function() {
            clearTimeout(markerPressTimer);
          });
        } catch (error) {
          console.error(`마커 생성 중 오류 (건물: ${building.name}):`, error);
        }
      } else {
        console.log(`위치 정보 없음 (건물: ${building.name})`);
      }
    });
    
    setDebugInfo(prev => ({
      ...prev,
      markersCreated: markersCreated
    }));
    
    console.log(`마커 생성 완료: ${markersCreated}/${buildings.length}`);
    
    // 컴포넌트 언마운트 시 마커 제거
    return () => {
      markers.forEach(marker => marker.setMap(null));
    };
  }, [map, buildings, navigate]);

  // 위치 추적 기능
  useEffect(() => {
    if (!map || !navigator.geolocation) return;
    
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const newPosition = new window.kakao.maps.LatLng(lat, lng);
        
        // 마커 위치 업데이트
        if (currentPositionMarker.current) {
          currentPositionMarker.current.setPosition(newPosition);
        }
        
        // 정확도 원 업데이트
        if (currentPositionCircle.current) {
          // 중심 위치 업데이트
          if (typeof currentPositionCircle.current.setCenter === 'function') {
            currentPositionCircle.current.setCenter(newPosition);
          }
          // 반경 업데이트
          currentPositionCircle.current.setRadius(accuracy);
        }
      },
      (error) => {
        console.error('위치 추적 중 오류가 발생했습니다:', error);
      },
      { 
        enableHighAccuracy: true, 
        maximumAge: 10000, 
        timeout: 5000 
      }
    );
    
    // 컴포넌트 언마운트 시 위치 추적 중지
    return () => {
      if (watchId) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [map]);

  // 테스트 마커 생성 함수
  const createTestMarker = () => {
    if (!map) return;
    
    // 테스트 좌표 (서울시청)
    const lat = 37.566826;
    const lng = 126.9786567;
    
    try {
      // 테스트 마커 생성
      const testMarker = new window.kakao.maps.Marker({
        position: new window.kakao.maps.LatLng(lat, lng),
        map: map
      });
      
      // 해당 위치로 지도 이동
      map.setCenter(new window.kakao.maps.LatLng(lat, lng));
      
      // 테스트 정보창 생성
      const infoWindow = new window.kakao.maps.InfoWindow({
        content: '<div style="padding:5px;">테스트 마커</div>',
        removable: true
      });
      
      infoWindow.open(map, testMarker);
      
      alert('테스트 마커가 생성되었습니다!');
    } catch (error) {
      console.error('테스트 마커 생성 중 오류:', error);
      alert('테스트 마커 생성 실패: ' + error.message);
    }
  };

  // 건물 정보 표시 함수
  const showBuildingInfo = (building, marker) => {
    const content = `
      <div style="padding:5px; min-width:150px;">
        <div style="font-weight:bold; margin-bottom:3px;">${building.name}</div>
        <div style="display:flex; justify-content:center;">
          ${building.memo ? '<div style="width:8px; height:8px; background-color:#ef4444; border-radius:50%; margin:0 2px;" title="입출입 특이사항 메모"></div>' : ''}
          ${building.note ? '<div style="width:8px; height:8px; background-color:#000; border-radius:50%; margin:0 2px;" title="특이사항"></div>' : ''}
          ${building.shortcut ? '<div style="width:8px; height:8px; background-color:#ec4899; border-radius:50%; margin:0 2px;" title="샛길 정보"></div>' : ''}
          ${building.images?.length > 0 ? '<div style="width:8px; height:8px; background-color:#c17817; border-radius:50%; margin:0 2px;" title="이미지"></div>' : ''}
        </div>
      </div>
    `;

    const infowindow = new window.kakao.maps.InfoWindow({
      content: content,
      removable: true
    });

    infowindow.open(map, marker);

    // 5초 후 자동 닫기
    setTimeout(() => {
      infowindow.close();
    }, 5000);
  };

  return (
    <div className="h-full flex flex-col">
      <div 
        ref={mapContainer} 
        // 아래와 같이 스타일 수정
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 150px)', // 화면 높이에서 상단 영역 뺀 나머지 공간
          borderRadius: '8px'
        }}
        className="mb-2"
      />
      <p className="text-sm text-gray-600 mb-2">
        지도에서 건물 위치를 길게 눌러 등록할 수 있습니다.
      </p>
      
      {/* 디버그 정보 */}
      <div className="mb-2 p-2 bg-gray-100 rounded text-xs text-gray-600">
        <p>
          건물 {debugInfo.totalBuildings}개 중 
          {debugInfo.buildingsWithLocation}개에 위치 정보가 있으며,
          {debugInfo.markersCreated}개의 마커가 생성되었습니다.
        </p>
      </div>
      
      {/* 테스트 마커 생성 버튼 */}
      <button
        onClick={createTestMarker}
        className="text-xs text-blue-600 hover:text-blue-800"
      >
        테스트 마커 생성
      </button>
    </div>
  );
}

export default KakaoMap;