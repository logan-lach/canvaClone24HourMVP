import ShapeButton from './ShapeButton';

const Sidebar = ({ onDragStart }: { onDragStart: (type: string) => void }) => {
  return (
    <div style={{
      position: 'absolute',
      left: '20px',
      top: '50%',
      transform: 'translateY(-50%)',
      width: '80px',
      background: 'rgba(0, 0, 0, 0.9)',
      border: '1px solid #444',
      borderRadius: '20px',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 15px',
      gap: '15px',
      alignItems: 'center',
      zIndex: 1000
    }}>
      {/* Rectangle */}
      <ShapeButton shapeType="rect" onDragStart={onDragStart}>
        <div style={{
          width: '30px',
          height: '20px',
          border: '2px solid white',
          borderRadius: '2px'
        }} />
      </ShapeButton>

      {/* Circle */}
      <ShapeButton shapeType="circle" onDragStart={onDragStart}>
        <div style={{
          width: '25px',
          height: '25px',
          border: '2px solid white',
          borderRadius: '50%'
        }} />
      </ShapeButton>

      {/* Text */}
      <ShapeButton shapeType="text" onDragStart={onDragStart}>
        <span style={{
          color: 'white',
          fontFamily: 'monospace',
          fontSize: '20px',
          fontWeight: 'bold'
        }}>
          T
        </span>
      </ShapeButton>
    </div>
  );
};

export default Sidebar;
