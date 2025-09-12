export interface Card {
  id: string;
  name: string;
  image?: string;
  type: 'monster' | 'spell' | 'trap';
  character?: string;
  position?: 'attack' | 'defense';
  atkPts?: number;
  defPts?: number;
  inGameAtkPts?: number;
  inGameDefPts?: number;
}

export interface Player {
  name: string;
  hp: number;
  maxHp: number;
  hand?: Card[];
  field?: (Card | null)[];
  graveyard?: Card[];
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

export interface PreparationState {
  isActive: boolean;
  durationSec: number;
  endsAt?: string;
  playerAReady: boolean;
  playerBReady: boolean;
}
