import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Rect, Text, Group, Image as KonvaImage } from 'react-konva';
import useImage from 'use-image';

const SimpleFloorPlanEditor = ({ onSave, onCancel }) => {
  const [elements, setElements] = useState([]);
  const [text, setText] = useState('');
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [lastTap, setLastTap] = useState(0);
  const stageRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: 300, height: 400 });
  const [showInstructions, setShowInstructions] = useState(true);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const containerHeight = window.innerHeight - 300;
        setStageSize({
          width: Math.min(containerWidth - 40, 400),
          height: Math.min(containerHeight, 500)
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const preventDefault = (e) => e.preventDefault();
    document.addEventListener('contextmenu', preventDefault);
    return () => document.removeEventListener('contextmenu', preventDefault);
  }, []);

  const addShape = (type) => {
    const newElement = {
      type: type,
      x: 50,
      y: 50,
      width: type === 'largeRect' ? 100 : 50,
      height: type === 'largeRect' ? 100 : 50,
      fill: '#e0e0e0',
      id: Date.now().toString(),
    };
    setElements(prev => [...prev, newElement]);
    setShowInstructions(false);
  };

  const addIcon = (type) => {
    const newElement = {
      type: type,
      x: 50,
      y: 50,
      width: 40,
      height: 40,
      fill: type === 'elevator' ? '#FFA500' : '#2ecc71',
      id: Date.now().toString(),
    };
    setElements(prev => [...prev, newElement]);
    setShowInstructions(false);
  };

  const addText = () => {
    const texts = text.split(',').map(t => t.trim()).filter(t => t);
    const newElements = texts.map((t, index) => ({
      type: 'text',
      x: 50 + index * 40,
      y: 50,
      text: t,
      fontSize: 40,
      id: Date.now().toString() + index,
    }));
    setElements(prev => [...prev, ...newElements]);
    setText('');
    setShowInstructions(false);
  };

  const handleTap = useCallback((e) => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    if (now - lastTap < DOUBLE_TAP_DELAY) {
      // Double tap
      const stage = e.target.getStage();
      const pointerPosition = stage.getPointerPosition();
      const element = stage.getIntersection(pointerPosition);
      if (element) {
        const id = element.attrs.id || (element.parent ? element.parent.attrs.id : null);
        setSelectedElement(prev => prev === id ? null : id);
      } else {
        setSelectedElement(null);
      }
    }
    setLastTap(now);
  }, [lastTap]);

  const handleDragStart = useCallback((e) => {
    if (!selectedElement) return;
    setIsDragging(true);
  }, [selectedElement]);

  const handleDragMove = useCallback((e) => {
    if (!isDragging || !selectedElement) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();

    setElements(prev => prev.map(el => {
      if (el.id === selectedElement) {
        return { ...el, x: pointerPosition.x - el.width / 2, y: pointerPosition.y - el.height / 2 };
      }
      return el;
    }));
  }, [isDragging, selectedElement]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleSave = () => {
    const uri = stageRef.current.toDataURL();
    onSave(uri);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.width / img.height;
          let newWidth, newHeight;
          if (aspectRatio > stageSize.width / stageSize.height) {
            newWidth = stageSize.width;
            newHeight = stageSize.width / aspectRatio;
          } else {
            newHeight = stageSize.height;
            newWidth = stageSize.height * aspectRatio;
          }
          const canvas = document.createElement('canvas');
          canvas.width = newWidth;
          canvas.height = newHeight;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, newWidth, newHeight);
          const resizedImage = canvas.toDataURL('image/jpeg', 0.7);
          setBackgroundImage(resizedImage);
          setShowInstructions(false);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const BackgroundImage = React.memo(({ image }) => {
    const [img] = useImage(image);
    
    if (!img) {
      return null;
    }

    const scale = Math.min(
      stageSize.width / img.width,
      stageSize.height / img.height
    );

    return (
      <KonvaImage
        image={img}
        width={img.width * scale}
        height={img.height * scale}
        x={(stageSize.width - img.width * scale) / 2}
        y={(stageSize.height - img.height * scale) / 2}
        opacity={0.5}
        listening={false}
      />
    );
  });

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(prev => prev.filter(el => el.id !== selectedElement));
      setSelectedElement(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4" ref={containerRef}>
        <h2 className="text-xl font-bold mb-4">층별 안내도 만들기</h2>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={() => addShape('largeRect')} className="btn btn-secondary text-sm">큰 사각형</button>
          <button onClick={() => addShape('smallRect')} className="btn btn-secondary text-sm">작은 사각형</button>
          <button onClick={() => addIcon('elevator')} className="btn btn-secondary text-sm">엘리베이터</button>
          <button onClick={() => addIcon('entrance')} className="btn btn-secondary text-sm">입구</button>
        </div>
        <div className="flex space-x-2 mb-4">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="호수 입력 (쉼표로 구분)"
            className="input flex-grow text-sm"
          />
          <button onClick={addText} className="btn btn-secondary text-sm">추가</button>
        </div>
        <div className="mb-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <button onClick={() => fileInputRef.current.click()} className="btn btn-secondary text-sm w-full">
            배경 이미지 업로드
          </button>
        </div>
        <div className="overflow-auto relative" style={{ maxHeight: `${stageSize.height}px` }}>
          <Stage 
            width={stageSize.width} 
            height={stageSize.height} 
            ref={stageRef} 
            className="border border-gray-300 mb-4"
            onTap={handleTap}
            onClick={handleTap}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
            onMouseDown={handleDragStart}
            onMouseMove={handleDragMove}
            onMouseUp={handleDragEnd}
          >
            <Layer>
              {backgroundImage && <BackgroundImage image={backgroundImage} />}
              {elements.map((elem) => {
                const isSelected = selectedElement === elem.id;
                switch (elem.type) {
                  case 'largeRect':
                  case 'smallRect':
                    return (
                      <Rect 
                        key={elem.id} 
                        {...elem} 
                        stroke={isSelected ? 'blue' : 'transparent'}
                        strokeWidth={isSelected ? 2 : 0}
                      />
                    );
                  case 'elevator':
                  case 'entrance':
                    return (
                      <Group 
                        key={elem.id} 
                        x={elem.x} 
                        y={elem.y}
                        id={elem.id}
                      >
                        <Rect 
                          width={elem.width} 
                          height={elem.height} 
                          fill={elem.fill} 
                          cornerRadius={5}
                          stroke={isSelected ? 'blue' : 'transparent'}
                          strokeWidth={isSelected ? 2 : 0}
                          id={elem.id}
                        />
                        <Text 
                          text={elem.type === 'elevator' ? '엘베' : '입구'} 
                          fontSize={14}
                          fill="white"
                          width={elem.width}
                          height={elem.height}
                          align="center"
                          verticalAlign="middle"
                          id={elem.id}
                        />
                      </Group>
                    );
                  case 'text':
                    return (
                      <Text 
                        key={elem.id} 
                        {...elem} 
                        stroke={isSelected ? 'blue' : 'transparent'}
                        strokeWidth={isSelected ? 1 : 0}
                      />
                    );
                  default:
                    return null;
                }
              })}
              {showInstructions && (
                <Text
                  text="객체를 빠르게 두번 터치하여 선택하세요.
선택 후 화면 어디서나 드래그하여 객체를 이동할 수 있습니다.
다시 빠르게 두번 터치하면 선택이 해제됩니다.
객체 선택 후 삭제 버튼을 누르면 객체가 삭제됩니다."
                  fontSize={20}
                  fill="gray"
                  width={stageSize.width}
                  height={stageSize.height}
                  align="center"
                  verticalAlign="middle"
                />
              )}
            </Layer>
          </Stage>
        </div>
        <div className="flex justify-between items-center">
          <button 
            onClick={deleteSelectedElement} 
            className={`btn ${selectedElement ? 'btn-danger' : 'btn-secondary opacity-50'} text-sm`}
            disabled={!selectedElement}
          >
            삭제
          </button>
          <div className="flex space-x-2">
            <button onClick={handleSave} className="btn btn-primary text-sm">저장</button>
            <button onClick={onCancel} className="btn btn-secondary text-sm">취소</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleFloorPlanEditor;