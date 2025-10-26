import { useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';

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

  // Calculate world coordinates at screen center
  const worldX = -(position.x - width / 2);
  const worldY = -(position.y - height / 2);

  // Grid settings
  const gridSize = 50; // Grid cell size in pixels

  // Generate dynamic grid based on viewport
  const generateGrid = () => {
    const lines = [];

    // Calculate visible world bounds
    const startX = -position.x;
    const endX = -position.x + width;
    const startY = -position.y;
    const endY = -position.y + height;

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

      <Stage
        ref={stageRef}
        width={width}
        height={height}
        draggable={true}
        x={position.x}
        y={position.y}
        onDragMove={(e) => {
          setPosition({
            x: e.target.x(),
            y: e.target.y()
          });
        }}
      >
        <Layer>
          {generateGrid()}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
