import { useEffect, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';

const Canvas = () => {
  const stageRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get window dimensions
  const width = window.innerWidth;
  const height = window.innerHeight;

  // Grid settings
  const gridSize = 50; // Grid cell size in pixels

  // Generate grid lines
  const generateGrid = () => {
    const lines = [];

    // Vertical lines
    for (let i = 0; i <= width / gridSize; i++) {
      lines.push(
        <Line
          key={`v-${i}`}
          points={[i * gridSize, 0, i * gridSize, height]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }

    // Horizontal lines
    for (let i = 0; i <= height / gridSize; i++) {
      lines.push(
        <Line
          key={`h-${i}`}
          points={[0, i * gridSize, width, i * gridSize]}
          stroke="#ddd"
          strokeWidth={1}
        />
      );
    }

    return lines;
  };

  return (
    <div ref={containerRef} style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <Stage
        ref={stageRef}
        width={width}
        height={height}
      >
        <Layer>
          {generateGrid()}
        </Layer>
      </Stage>
    </div>
  );
};

export default Canvas;
