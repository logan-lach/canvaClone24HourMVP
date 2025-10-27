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

const ZoomControls = ({
  zoom,
  onZoomIn,
  onZoomOut
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
}) => {
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      right: 10,
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <button onClick={onZoomOut}>-</button>
      <span style={{
        ...OVERLAY_BASE_STYLE,
        position: 'relative',
        minWidth: '60px',
        textAlign: 'center'
      }}>
        {Math.round(zoom * 100)}%
      </span>
      <button onClick={onZoomIn}>+</button>
    </div>
  );
};

export default ZoomControls;
