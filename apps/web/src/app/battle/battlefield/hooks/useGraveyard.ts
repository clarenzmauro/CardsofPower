import { useState, useCallback } from 'react';
import type { Card } from '../types';

export interface GraveyardConfig {
  enabled: boolean;
  onCardToGraveyard?: (card: Card, fromSlotIndex: number) => void;
}

export interface GraveyardAnimationState {
  isAnimating: boolean;
  animatingCard: Card | null;
  startPosition: { x: number; y: number };
  endPosition: { x: number; y: number };
}

export const useGraveyard = (config: GraveyardConfig) => {
  const [animationState, setAnimationState] = useState<GraveyardAnimationState>({
    isAnimating: false,
    animatingCard: null,
    startPosition: { x: 0, y: 0 },
    endPosition: { x: 0, y: 0 },
  });

  const sendToGraveyard = useCallback((
    card: Card, 
    fromSlotIndex: number,
    startPos: { x: number; y: number },
    endPos: { x: number; y: number }
  ) => {
    if (!config.enabled) return;

    // Start animation
    setAnimationState({
      isAnimating: true,
      animatingCard: card,
      startPosition: startPos,
      endPosition: endPos,
    });

    // Call the callback after animation starts
    if (config.onCardToGraveyard) {
      // Delay the actual state change to allow animation to play
      setTimeout(() => {
        config.onCardToGraveyard!(card, fromSlotIndex);
        // End animation
        setAnimationState({
          isAnimating: false,
          animatingCard: null,
          startPosition: { x: 0, y: 0 },
          endPosition: { x: 0, y: 0 },
        });
      }, 800); // Animation duration
    }
  }, [config.enabled, config.onCardToGraveyard]);

  const logGraveyardContents = useCallback((graveyard: Card[]) => {
    if (graveyard.length === 0) {
      console.log('Graveyard: No Cards');
    } else {
      // Show the top card (last in, first out)
      const topCard = graveyard[graveyard.length - 1];
      console.log(`Graveyard: ${topCard.name}/${topCard.type} (${graveyard.length} cards total)`);
    }
  }, []);

  return {
    animationState,
    sendToGraveyard,
    logGraveyardContents,
    isEnabled: config.enabled,
  };
};
