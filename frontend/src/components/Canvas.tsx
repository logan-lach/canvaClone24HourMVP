import { useState, useRef } from 'react';
import { Stage, Layer, Line, Rect } from 'react-konva';

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
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>
      {/* Coordinate display overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        left: 10,
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '4px',
        fontFamily: 'monospace',
        fontSize: '14px',
        pointerEvents: 'none',
        zIndex: 1000
      }}>
        Position: ({Math.round(worldX)}, {Math.round(worldY)})
      </div>

      {/* Zoom controls */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        display: 'flex',
        gap: '8px',
        alignItems: 'center',
        zIndex: 1000
      }}>
        <button onClick={handleZoomOut}>-</button>
        <span style={{
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '8px 12px',
          borderRadius: '4px',
          fontFamily: 'monospace',
          fontSize: '14px',
          minWidth: '60px',
          textAlign: 'center'
        }}>
          {Math.round(zoom * 100)}%
        </span>
        <button onClick={handleZoomIn}>+</button>
      </div>

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={true}
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

          {/* Test rectangle at world origin (0, 0) */}
          <Rect
            x={-50}
            y={-50}
            width={100}
            height={100}
            fill="rgba(255, 0, 0, 0.5)"
            stroke="red"
            strokeWidth={2}
          />
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
