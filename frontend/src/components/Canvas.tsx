import { useState, useRef } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text } from 'react-konva';
import Sidebar from './Sidebar';
import CoordinateDisplay from './CoordinateDisplay';
import ZoomControls from './ZoomControls';

type Shape = {
  id: string;
  type: 'rect' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  text?: string;
  fill: string;
};

const Canvas = () => {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get window dimensions
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Stage position state - initialize so world (0,0) is at screen center
  const [position, setPosition] = useState({
    x: width / 2,
    y: height / 2
  });

  // Zoom state - 1.0 = 100%
  const [zoom, setZoom] = useState(1.0);

  // Shapes state
  const [shapes, setShapes] = useState<Shape[]>([]);

  // Drag state
  const [draggingType, setDraggingType] = useState<string | null>(null);

  // Zoom handlers
  const handleZoomIn = () => {
    setZoom(prev => prev + 0.1); // +10% additive
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(0.1, prev - 0.1)); // -10% additive, minimum 10%
  };

  // Calculate world coordinates at screen center (zoom-aware)
  const worldX = -(position.x - width / 2) / zoom;
  const worldY = -(position.y - height / 2) / zoom;

  // Helper: Convert screen coordinates to world coordinates
  const getWorldCoordinates = (screenX: number, screenY: number) => {
    return {
      x: (screenX - position.x) / zoom,
      y: (screenY - position.y) / zoom
    };
  };

  // Add shape to canvas
  const addShape = (type: 'rect' | 'circle' | 'text', worldX: number, worldY: number) => {
    const baseShape = {
      id: `shape-${Date.now()}`,
      type,
      x: worldX,
      y: worldY
    };

    let newShape: Shape;

    if (type === 'rect') {
      newShape = { ...baseShape, width: 100, height: 100, fill: 'rgba(0, 100, 255, 0.5)' };
    } else if (type === 'circle') {
      newShape = { ...baseShape, radius: 50, fill: 'rgba(0, 255, 100, 0.5)' };
    } else {
      newShape = { ...baseShape, text: 'Text', fill: 'black' };
    }

    setShapes(prev => [...prev, newShape]);
  };

  // Update shape position after drag
  const updateShape = (id: string, newX: number, newY: number) => {
    setShapes(prev => prev.map(shape =>
      shape.id === id ? { ...shape, x: newX, y: newY } : shape
    ));
  };

  // Grid settings
  const gridSize = 50; // Grid cell size in pixels

  // Generate dynamic grid based on viewport
  const generateGrid = () => {
    const lines = [];

    // Calculate visible world bounds (accounting for zoom)
    const startX = -position.x / zoom;
    const endX = (-position.x + width) / zoom;
    const startY = -position.y / zoom;
    const endY = (-position.y + height) / zoom;

    // Find first/last grid line positions
    const firstVertical = Math.floor(startX / gridSize) * gridSize;
    const lastVertical = Math.ceil(endX / gridSize) * gridSize;
    const firstHorizontal = Math.floor(startY / gridSize) * gridSize;
    const lastHorizontal = Math.ceil(endY / gridSize) * gridSize;

    // Generate only visible vertical lines
    for (let x = firstVertical; x <= lastVertical; x += gridSize) {
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY - gridSize, x, endY + gridSize]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }

    // Generate only visible horizontal lines
    for (let y = firstHorizontal; y <= lastHorizontal; y += gridSize) {
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX - gridSize, y, endX + gridSize, y]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        if (!draggingType) return;

        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          const worldCoords = getWorldCoordinates(screenX, screenY);
          addShape(draggingType as 'rect' | 'circle' | 'text', worldCoords.x, worldCoords.y);
        }
        setDraggingType(null);
      }}
      onDragEnd={() => {
        // Always clear draggingType when drag ends, even if drop failed
        setDraggingType(null);
      }}
    >
      <Sidebar onDragStart={setDraggingType} />
      <CoordinateDisplay worldX={worldX} worldY={worldY} />
      <ZoomControls zoom={zoom} onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} />

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={!draggingType}
        x={position.x}
        y={position.y}
        scaleX={zoom}
        scaleY={zoom}
        onDragMove={(e) => {
          setPosition({
            x: e.target.x(),
            y: e.target.y()
          });
        }}
      >
        <Layer>
          {generateGrid()}

          {/* Render shapes */}
          {shapes.map(shape => {
            if (shape.type === 'rect') {
              return (
                <Rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={shape.width}
                  height={shape.height}
                  fill={shape.fill}
                  stroke="#666"
                  strokeWidth={2}
                  draggable={!draggingType}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    updateShape(shape.id, e.target.x(), e.target.y());
                  }}
                />
              );
            } else if (shape.type === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  radius={shape.radius}
                  fill={shape.fill}
                  stroke="#666"
                  strokeWidth={2}
                  draggable={!draggingType}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    updateShape(shape.id, e.target.x(), e.target.y());
                  }}
                />
              );
            } else if (shape.type === 'text') {
              return (
                <Text
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  text={shape.text}
                  fill={shape.fill}
                  fontSize={16}
                  fontFamily="Arial"
                  draggable={!draggingType}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    updateShape(shape.id, e.target.x(), e.target.y());
                  }}
                />
              );
            }
            return null;
          })}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
