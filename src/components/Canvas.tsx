import { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Line, Rect, Circle, Text } from 'react-konva';
import Sidebar from './Sidebar';
import CoordinateDisplay from './CoordinateDisplay';
import ZoomControls from './ZoomControls';
import { useCanvasSync } from '../contexts/CanvasSyncContext';
import { useCursorTracking } from '../contexts/CursorTrackingContext';
import { useShapeLock } from '../contexts/ShapeLockContext';
import { useViewport } from '../contexts/ViewportContext';

const Canvas = () => {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { shapes, addShape, updateShape, broadcastShapePosition, setLocallyDraggingShape, isLoading } = useCanvasSync();
  const { broadcastCursor } = useCursorTracking();
  const { lockShape, unlockShape, isLocked, getShapeLock } = useShapeLock();
  const { setViewport } = useViewport();

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

  // Drag state
  const [draggingType, setDraggingType] = useState<string | null>(null);

  // Sync viewport state to context whenever zoom or position changes
  useEffect(() => {
    setViewport({ zoom, position });
  }, [zoom, position, setViewport]);

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

  // Grid settings
  const gridSize = 50; // Grid cell size in pixels

  // Uniform shape sizes (constants)
  const RECT_SIZE = 100;
  const CIRCLE_RADIUS = 50;

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

  if (isLoading) {
    return (
      <div style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading canvas...
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const screenX = e.clientX - rect.left;
          const screenY = e.clientY - rect.top;
          // Convert screen coordinates to world coordinates before broadcasting
          const worldCoords = getWorldCoordinates(screenX, screenY);
          broadcastCursor(worldCoords.x, worldCoords.y);
        }
      }}
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
            const locked = isLocked(shape.id);
            const shapeLock = getShapeLock(shape.id);

            if (shape.type === 'rect') {
              return (
                <Rect
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  width={RECT_SIZE}
                  height={RECT_SIZE}
                  fill={shape.fill}
                  stroke={locked && shapeLock ? shapeLock.color : "#666"}
                  strokeWidth={locked ? 4 : 2}
                  draggable={!draggingType}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    // Try to acquire lock, but allow drag regardless
                    lockShape(shape.id);
                    // Mark as locally dragging to prevent applying remote updates
                    setLocallyDraggingShape(shape.id);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    // Broadcast real-time position to other users
                    broadcastShapePosition(shape.id, e.target.x(), e.target.y());
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    // Save final position to database
                    updateShape(shape.id, e.target.x(), e.target.y());
                    unlockShape(shape.id);
                    // Clear locally dragging flag
                    setLocallyDraggingShape(null);
                  }}
                />
              );
            } else if (shape.type === 'circle') {
              return (
                <Circle
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  radius={CIRCLE_RADIUS}
                  fill={shape.fill}
                  stroke={locked && shapeLock ? shapeLock.color : "#666"}
                  strokeWidth={locked ? 4 : 2}
                  draggable={!draggingType}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    // Try to acquire lock, but allow drag regardless
                    lockShape(shape.id);
                    // Mark as locally dragging to prevent applying remote updates
                    setLocallyDraggingShape(shape.id);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    // Broadcast real-time position to other users
                    broadcastShapePosition(shape.id, e.target.x(), e.target.y());
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    // Save final position to database
                    updateShape(shape.id, e.target.x(), e.target.y());
                    unlockShape(shape.id);
                    // Clear locally dragging flag
                    setLocallyDraggingShape(null);
                  }}
                />
              );
            } else if (shape.type === 'text') {
              return (
                <Text
                  key={shape.id}
                  x={shape.x}
                  y={shape.y}
                  text="Text"
                  fill={shape.fill}
                  fontSize={16}
                  fontFamily="Arial"
                  stroke={locked && shapeLock ? shapeLock.color : undefined}
                  strokeWidth={locked ? 2 : 0}
                  draggable={!draggingType}
                  onDragStart={(e) => {
                    e.cancelBubble = true;
                    // Try to acquire lock, but allow drag regardless
                    lockShape(shape.id);
                    // Mark as locally dragging to prevent applying remote updates
                    setLocallyDraggingShape(shape.id);
                  }}
                  onDragMove={(e) => {
                    e.cancelBubble = true;
                    // Broadcast real-time position to other users
                    broadcastShapePosition(shape.id, e.target.x(), e.target.y());
                  }}
                  onDragEnd={(e) => {
                    e.cancelBubble = true;
                    // Save final position to database
                    updateShape(shape.id, e.target.x(), e.target.y());
                    unlockShape(shape.id);
                    // Clear locally dragging flag
                    setLocallyDraggingShape(null);
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
