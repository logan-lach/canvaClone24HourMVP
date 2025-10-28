const ShapeButton = ({
  children,
  shapeType,
  onDragStart
}: {
  children: React.ReactNode;
  shapeType: string;
  onDragStart: (type: string) => void;
}) => {
  return (
    <div
      draggable="true"
      onDragStart={() => onDragStart(shapeType)}
      style={{
        width: '50px',
        height: '50px',
        background: 'rgba(100, 100, 100, 0.5)',
        border: '2px solid #888',
        borderRadius: '4px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'grab',
        transition: 'all 0.2s'
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(150, 150, 150, 0.5)'}
      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(100, 100, 100, 0.5)'}
    >
      {children}
    </div>
  );
};

export default ShapeButton;
