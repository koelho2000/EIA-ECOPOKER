
export type EnergyType = 'Solar' | 'Carvão' | 'Hidro' | 'Petróleo' | 'Eólica' | 'Gás';

export interface Player {
  id: string;
  name: string;
  score: number;
}

export interface GameState {
  players: Player[];
  activePlayerIndex: number;
  rollCount: number;
  maxRolls: number;
  currentRound: number;
  totalRounds: number;
  diceValues: (EnergyType | null)[];
  heldDice: boolean[];
  isGameOver: boolean;
  roundScoreExplanation: string[];
  currentRoundScore: number;
}

export interface Settings {
  soundEnabled: boolean;
  comboSoundEnabled: boolean;
  musicEnabled: boolean;
  darkMode: boolean;
  musicVolume: number;
  soundVolume: number;
}

export interface HallOfFameEntry {
  name: string;
  score: number;
  date: string;
  rounds: number;
}
