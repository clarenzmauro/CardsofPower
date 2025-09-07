export interface Card {
  id: string;
  name: string;
  image?: string;
  type: 'monster' | 'spell' | 'trap';
}

export interface Player {
  name: string;
  hp: number;
  maxHp: number;
}

export interface BattlefieldState {
  playerHand: Card[];
  enemyHand: Card[];
  playerField: (Card | null)[];
  enemyField: (Card | null)[];
  playerGraveyard: Card[];
  enemyGraveyard: Card[];
  selectedCard: Card | null;
  player: Player;
  enemy: Player;
}
