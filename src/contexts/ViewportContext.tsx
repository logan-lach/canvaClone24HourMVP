import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';

interface ViewportState {
  zoom: number;
  position: { x: number; y: number };
}

interface ViewportContextType {
  viewport: ViewportState;
  setViewport: (viewport: ViewportState) => void;
}

const ViewportContext = createContext<ViewportContextType | undefined>(undefined);

export function ViewportProvider({ children }: { children: ReactNode }) {
  const [viewport, setViewport] = useState<ViewportState>({
    zoom: 1.0,
    position: { x: window.innerWidth / 2, y: window.innerHeight / 2 }
  });

  return (
    <ViewportContext.Provider value={{ viewport, setViewport }}>
      {children}
    </ViewportContext.Provider>
  );
}

export function useViewport() {
  const context = useContext(ViewportContext);
  if (context === undefined) {
    throw new Error('useViewport must be used within a ViewportProvider');
  }
  return context;
}
