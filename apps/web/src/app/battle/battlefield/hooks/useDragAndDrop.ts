import { useState, useCallback } from 'react';
import type { Card } from '../types';

export interface DragAndDropConfig {
  enabled: boolean;
  onCardMove?: (card: Card, fromIndex: number, toSlotIndex: number) => void;
  onSlotUpdate?: (slots: (Card | null)[]) => void;
}

export interface DragState {
  isDragging: boolean;
  draggedCard: Card | null;
  draggedFromIndex: number | null;
}

export const useDragAndDrop = (config: DragAndDropConfig) => {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedCard: null,
    draggedFromIndex: null,
  });

  const startDrag = useCallback((card: Card, fromIndex: number) => {
    if (!config.enabled) return;
    
    setDragState({
      isDragging: true,
      draggedCard: card,
      draggedFromIndex: fromIndex,
    });
  }, [config.enabled]);

  const endDrag = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedCard: null,
      draggedFromIndex: null,
    });
  }, []);

  const handleDrop = useCallback((toSlotIndex: number) => {
    if (!config.enabled || !dragState.isDragging || !dragState.draggedCard || dragState.draggedFromIndex === null) {
      return false;
    }

    // Call the move callback if provided
    if (config.onCardMove) {
      config.onCardMove(dragState.draggedCard, dragState.draggedFromIndex, toSlotIndex);
    }

    endDrag();
    return true;
  }, [config.enabled, config.onCardMove, dragState, endDrag]);

  const getDragHandlers = useCallback((card: Card, index: number) => {
    if (!config.enabled) return {};

    return {
      draggable: true,
      onDragStart: (e: React.DragEvent) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', card.id);
        startDrag(card, index);
      },
      onDragEnd: () => {
        endDrag();
      },
    };
  }, [config.enabled, startDrag, endDrag]);

  const getDropHandlers = useCallback((slotIndex: number, isEmpty: boolean) => {
    if (!config.enabled) return {};

    return {
      onDragOver: (e: React.DragEvent) => {
        if (isEmpty && dragState.isDragging) {
          e.preventDefault();
          e.dataTransfer.dropEffect = 'move';
        }
      },
      onDrop: (e: React.DragEvent) => {
        e.preventDefault();
        if (isEmpty) {
          handleDrop(slotIndex);
        }
      },
    };
  }, [config.enabled, dragState.isDragging, handleDrop]);

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
    isEnabled: config.enabled,
  };
};
