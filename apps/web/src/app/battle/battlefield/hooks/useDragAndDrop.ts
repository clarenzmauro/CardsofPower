import { useState, useCallback, useEffect } from 'react';
import type { Card } from '../types';

export interface DragAndDropConfig {
  enabled: boolean;
  onCardMove?: (card: Card, fromIndex: number, toSlotIndex: number, targetType?: 'player' | 'enemy') => void;
  onSlotUpdate?: (slots: (Card | null)[]) => void;
}

export interface DragState {
  isDragging: boolean;
  draggedCard: Card | null;
  draggedFromIndex: number | null;
  dragOverSlot: number | null;
  mousePosition: { x: number; y: number };
}

export const useDragAndDrop = (config: DragAndDropConfig) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedCard: null,
    draggedFromIndex: null,
    dragOverSlot: null,
    mousePosition: { x: 0, y: 0 },
  });

  // Mouse tracking for floating card preview
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setDragState(prev => {
        if (prev.isDragging) {
          return {
            ...prev,
            mousePosition: { x: e.clientX, y: e.clientY },
          };
        }
        return prev;
      });
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      setDragState(prev => {
        if (prev.isDragging) {
          return {
            ...prev,
            mousePosition: { x: e.clientX, y: e.clientY },
          };
        }
        return prev;
      });
    };

    if (dragState.isDragging) {
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('dragover', handleDragOver, { passive: false });
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('dragover', handleDragOver);
      };
    }
  }, [dragState.isDragging]);

  const startDrag = useCallback((card: Card, fromIndex: number, mousePos: { x: number; y: number }) => {
    if (!config.enabled) return;
    setDragState({
      isDragging: true,
      draggedCard: card,
      draggedFromIndex: fromIndex,
      dragOverSlot: null,
      mousePosition: mousePos,
    });
  }, [config.enabled]);

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedCard: null,
      draggedFromIndex: null,
      dragOverSlot: null,
      mousePosition: { x: 0, y: 0 },
    });
  }, []);

  const setDragOverSlot = useCallback((slotIndex: number | null) => {
    setDragState(prev => ({
      ...prev,
      dragOverSlot: slotIndex,
    }));
  }, []);

  const updateMousePosition = useCallback((x: number, y: number) => {
    setDragState(prev => ({
      ...prev,
      mousePosition: { x, y },
    }));
  }, []);

  const handleDrop = useCallback((toSlotIndex: number, targetType?: 'player' | 'enemy') => {
    if (!config.enabled || !dragState.isDragging || !dragState.draggedCard || dragState.draggedFromIndex === null) {
      return false;
    }

    console.log('handleDrop called:', { 
      card: dragState.draggedCard.name, 
      type: dragState.draggedCard.type, 
      toSlotIndex, 
      targetType 
    });

    // Call the move callback if provided
    if (config.onCardMove) {
      config.onCardMove(dragState.draggedCard, dragState.draggedFromIndex, toSlotIndex, targetType);
    }

    endDrag();
    return true;
  }, [config.enabled, config.onCardMove, dragState, endDrag]);

  const createDragPreview = useCallback((card: Card, e: React.DragEvent) => {
    // Create a custom drag image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 80;
    canvas.height = 112;
    
    // Draw card background
    ctx.fillStyle = 'rgba(120, 113, 108, 0.9)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = 'rgba(87, 83, 78, 0.8)';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);
    
    // Draw card name
    ctx.fillStyle = 'white';
    ctx.font = '12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(card.name, canvas.width / 2, canvas.height - 20);
    
    e.dataTransfer.setDragImage(canvas, 40, 56);
  }, []);

  const getDragHandlers = useCallback((card: Card, index: number) => {
    if (!config.enabled) {
      console.log('Drag handlers disabled - config.enabled is false');
      return {};
    }

    console.log('Creating drag handlers for:', card.name, card.type);
    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        console.log('Drag started for:', card.name, card.type);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.id);
        // Hide the default drag image
        const emptyImg = new Image();
        emptyImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAUEBAAAACwAAAAAAQABAAACAkQBADs=';
        e.dataTransfer.setDragImage(emptyImg, 0, 0);
        startDrag(card, index, { x: e.clientX, y: e.clientY });
      },
      onDrag: (e: React.DragEvent) => {
        // Update position during drag
        if (e.clientX !== 0 && e.clientY !== 0) {
          setDragState(prev => ({
            ...prev,
            mousePosition: { x: e.clientX, y: e.clientY },
          }));
        }
      },
      onDragEnd: () => {
        endDrag();
      },
    };
  }, [config.enabled, startDrag, endDrag]);

  const getDropHandlers = useCallback((slotIndex: number, isEmpty: boolean, targetType?: 'player' | 'enemy') => {
    if (!config.enabled) return {};

    return {
      onDragOver: (e: React.DragEvent) => {
        // Allow dropping on empty slots OR on occupied slots for spell/trap cards
        const canDrop = isEmpty || (dragState.isDragging && dragState.draggedCard && 
          (dragState.draggedCard.type === 'spell' || dragState.draggedCard.type === 'trap'));
        
        if (canDrop && dragState.isDragging) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
          setDragOverSlot(slotIndex);
          // Update floating card position during dragover
          setDragState(prev => ({
            ...prev,
            mousePosition: { x: e.clientX, y: e.clientY },
          }));
        }
      },
      onDragLeave: () => {
        setDragOverSlot(null);
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        setDragOverSlot(null);
        console.log('Drop detected:', { slotIndex, isEmpty, targetType, draggedCard: dragState.draggedCard });
        handleDrop(slotIndex, targetType);
      },
    };
  }, [config.enabled, dragState.isDragging, dragState.draggedCard, handleDrop, setDragOverSlot]);

  const logSlotContents = useCallback((slots: (Card | null)[]) => {
    console.log('=== SLOT CONTENTS ===');
    slots.forEach((card, index) => {
      if (card) {
        console.log(`Slot${index + 1}:`);
        console.log(`  name: ${card.name}`);
        console.log(`  type: ${card.type}`);
      } else {
        console.log(`Slot${index + 1}: None`);
      }
    });
    console.log('====================');
  }, []);

  return {
    dragState,
    getDragHandlers,
    getDropHandlers,
    logSlotContents,
    updateMousePosition,
    isEnabled: config.enabled,
  };
};
