export interface Card {
  id: string;
  name: string;
  image?: string;
  type: 'monster' | 'spell' | 'trap';
}

export interface BattlefieldState {
  playerHand: Card[];
  enemyHand: Card[];
  playerField: (Card | null)[];
  enemyField: (Card | null)[];
  playerGraveyard: Card[];
  enemyGraveyard: Card[];
  selectedCard: Card | null;
}
