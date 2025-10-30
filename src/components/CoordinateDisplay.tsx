const OVERLAY_BASE_STYLE = {
  position: 'absolute' as const,
  background: 'rgba(0, 0, 0, 0.8)',
  color: 'white',
  padding: '8px 12px',
  borderRadius: '4px',
  fontFamily: 'monospace',
  fontSize: '14px',
  zIndex: 1000
};

const CoordinateDisplay = ({ worldX, worldY }: { worldX: number; worldY: number }) => {
  return (
    <div style={{
      ...OVERLAY_BASE_STYLE,
      top: 10,
      left: 90,
      pointerEvents: 'none'
    }}>
      Position: ({Math.round(worldX)}, {Math.round(worldY)})
    </div>
  );
};

export default CoordinateDisplay;
