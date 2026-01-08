import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import Layout from './components/Layout';
import Die from './components/Die';
import { EnergyType, Player, GameState, Settings, HallOfFameEntry } from './types';
import { 
  ENERGY_FACES, 
  CLEAN_ENERGIES, 
  FOSSIL_ENERGIES, 
  MAX_ROLLS, 
  DICE_COUNT,
  ENERGY_CONFIG
} from './constants';
import { audioService } from './services/audioService';
import { 
  ChevronRight, RotateCcw, Play, Plus, X, Moon, 
  Sun as SunIcon, Volume2, Award, Trophy, 
  Info, Zap, Leaf, Factory, Star, Medal,
  Music, CheckCircle2, LayoutDashboard, Settings as SettingsIcon,
  Flame, Droplets, Wind, Users, Globe, ExternalLink, Timer, AlertCircle, TrendingUp, TrendingDown
} from 'lucide-react';

const ScoreModal: React.FC<{ isOpen: boolean; onClose: () => void; currentHand: any }> = ({ isOpen, onClose, currentHand }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-sm:max-w-xs max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-pop-in">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="font-black text-xl italic tracking-tighter uppercase leading-none">Cálculo Eco</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mt-1">Impacto Ambiental</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-emerald-600">
                <span className="text-xs font-black uppercase flex items-center gap-2 tracking-widest"><Leaf size={14} /> Mix Limpo ({currentHand.cleanCount}x)</span>
                <span className="font-black">+{currentHand.cleanCount * 15}</span>
              </div>
              <div className="flex justify-between items-center text-red-500">
                <span className="text-xs font-black uppercase flex items-center gap-2 tracking-widest"><Factory size={14} /> Mix Fóssil ({currentHand.fossilCount}x)</span>
                <span className="font-black">-{currentHand.fossilCount * 20}</span>
              </div>
              <div className="border-t dark:border-zinc-700 pt-3 flex justify-between items-center mt-2">
                <span className="font-black text-sm uppercase italic">Saldo Base</span>
                <span className={`text-2xl font-black ${currentHand.mixedScore < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {currentHand.mixedScore}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[9px] text-zinc-400 font-bold uppercase text-center leading-tight">
            Combos de alto nível anulam a pontuação base e atribuem bónus fixos.
          </p>
        </div>
      </div>
    </div>
  );
};

const QuickRanking: React.FC<{ players: Player[], activeIdx: number, isOpen: boolean, onClose: () => void }> = ({ players, activeIdx, isOpen, onClose }) => {
  const sorted = [...players].sort((a, b) => b.score - a.score);
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/40 z-[100] md:hidden" onClick={onClose} />}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-zinc-950 z-[101] shadow-2xl transition-transform duration-500 border-r border-zinc-200 dark:border-zinc-800 p-6 pt-safe flex flex-col ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex justify-between items-center mb-8">
          <h3 className="font-black text-xs uppercase tracking-widest text-emerald-600 flex items-center gap-2"><Trophy size={14} /> Ranking Vivo</h3>
          <button onClick={onClose} className="md:hidden p-1 text-zinc-400"><X size={20} /></button>
        </div>
        <div className="space-y-4 overflow-y-auto no-scrollbar flex-1">
          {sorted.map((p, i) => {
            const isCurrent = players.indexOf(p) === activeIdx;
            return (
              <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isCurrent ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 shadow-md scale-105' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}>
                <div className="flex items-center gap-3">
                  <span className={`font-black text-[10px] w-5 h-5 flex items-center justify-center rounded-md ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'}`}>{i + 1}</span>
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold uppercase truncate max-w-[80px] ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{p.name}</span>
                    <span className="text-[7px] text-zinc-400 uppercase font-black">Recorde: {p.maxHand === -Infinity ? '-' : p.maxHand}</span>
                  </div>
                </div>
                <span className="font-black text-sm">{p.score}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
           <p className="text-[8px] font-bold text-zinc-400 uppercase text-center">EIA-ECOPOKER Pro v1.5</p>
        </div>
      </div>
    </>
  );
};

const App: React.FC = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState('play');
  const [rankingSubTab, setRankingSubTab] = useState<'current' | 'hall'>('current');
  const [hallFilter, setHallFilter] = useState<number>(3);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
  const [isRankingOpen, setIsRankingOpen] = useState(false);
  const [settings, setSettings] = useState<Settings>(() => {
    const saved = localStorage.getItem('ecoPoker_settings');
    if (saved) return JSON.parse(saved);
    return {
      soundEnabled: true,
      comboSoundEnabled: true,
      musicEnabled: true,
      darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches,
      musicVolume: 0.1,
      soundVolume: 0.1
    };
  });

  const [gameState, setGameState] = useState<GameState>({
    players: [],
    activePlayerIndex: 0,
    rollCount: 0,
    maxRolls: MAX_ROLLS,
    currentRound: 1,
    totalRounds: 5,
    diceValues: Array(DICE_COUNT).fill(null),
    heldDice: Array(DICE_COUNT).fill(false),
    isGameOver: false,
    roundScoreExplanation: [],
    currentRoundScore: 0
  });

  const [isRolling, setIsRolling] = useState(false);
  const [isCharging, setIsCharging] = useState(false);
  const [setupMode, setSetupMode] = useState(true);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [comboPopup, setComboPopup] = useState<string | null>(null);
  const [hallOfFame, setHallOfFame] = useState<HallOfFameEntry[]>([]);

  const lastProcessedRollId = useRef<string>("");

  useEffect(() => {
    localStorage.setItem('ecoPoker_settings', JSON.stringify(settings));
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
    
    audioService.setEnabled(settings.soundEnabled);
    audioService.setMusicEnabled(settings.musicEnabled);
    audioService.setMusicVolume(settings.musicVolume);
    audioService.setSoundVolume(settings.soundVolume);
  }, [settings]);

  useEffect(() => {
    const savedHall = localStorage.getItem('ecoPoker_hallOfFame_v2');
    if (savedHall) setHallOfFame(JSON.parse(savedHall));
  }, []);

  const currentHandResult = useMemo(() => {
    const values = gameState.diceValues;
    const validValues = values.filter((v): v is EnergyType => v !== null);
    if (validValues.length === 0) return { total: 0, explanation: ["Lança para começar"], combos: [], cleanCount: 0, fossilCount: 0, mixedScore: 0 };

    const cleanValues = validValues.filter(v => CLEAN_ENERGIES.includes(v));
    const fossilValues = validValues.filter(v => FOSSIL_ENERGIES.includes(v));
    
    const counts: Record<string, number> = {};
    validValues.forEach(v => counts[v] = (counts[v] || 0) + 1);
    const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    
    const maxFreq = sortedEntries[0]?.[1] || 0;
    const maxFreqFace = sortedEntries[0]?.[0] as EnergyType;
    const secondFreq = sortedEntries[1]?.[1] || 0;
    const secondFreqFace = sortedEntries[1]?.[0] as EnergyType;

    let total = 0;
    const combos: string[] = [];

    if (maxFreq === 6 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 1000; combos.push("CLEAN POWER!");
    } else if (cleanValues.length === 6) {
      total = 600; combos.push("CLEAN FLUSH TOTAL!");
    } else if (maxFreq === 5 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 400; combos.push("FIVE CLEAN!");
    } else if (maxFreq === 3 && secondFreq === 3 && CLEAN_ENERGIES.includes(maxFreqFace) && CLEAN_ENERGIES.includes(secondFreqFace)) {
      total = 300; combos.push("FULL HOUSE VERDE!");
    } else if (validValues.includes('Solar') && validValues.includes('Hidro') && validValues.includes('Eólica')) {
      total = 200; combos.push("STRAIGHT ENERGÉTICO!");
    } else if (maxFreq === 4 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 100; combos.push("FOUR CLEAN!");
    } else if (maxFreq === 3 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 60; combos.push("THREE CLEAN!");
    } else if (maxFreq === 2 && secondFreq === 2 && CLEAN_ENERGIES.includes(maxFreqFace) && CLEAN_ENERGIES.includes(secondFreqFace)) {
      total = 40; combos.push("TWO PAIR VERDE!");
    } else if (maxFreq === 2 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 20; combos.push("ONE PAIR CLEAN!");
    } else if (fossilValues.length === 6) {
      total = 0; combos.push("BLACKOUT!");
    } else if (fossilValues.length >= 4) {
      total = -100; combos.push("DIRTY ENERGY!");
    } else {
      total = (cleanValues.length * 15) - (fossilValues.length * 20);
      combos.push("MIXED ENERGY");
    }

    return { 
      total, 
      explanation: [`Mão: ${combos[0]}`, `Limpas: ${cleanValues.length}`, `Fósseis: ${fossilValues.length}`], 
      combos, 
      cleanCount: cleanValues.length, 
      fossilCount: fossilValues.length, 
      mixedScore: (cleanValues.length * 15) - (fossilValues.length * 20) 
    };
  }, [gameState.diceValues]);

  useEffect(() => {
    const currentRollId = `${gameState.activePlayerIndex}-${gameState.currentRound}-${gameState.rollCount}`;
    if (!isRolling && currentHandResult.combos.length > 0 && lastProcessedRollId.current !== currentRollId) {
      const comboName = currentHandResult.combos[0];
      if (gameState.rollCount > 0) {
        setComboPopup(comboName);
        lastProcessedRollId.current = currentRollId;
        if (settings.soundEnabled && settings.comboSoundEnabled) {
          audioService.playComboSound(comboName);
        }
        const timer = setTimeout(() => setComboPopup(null), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentHandResult.combos, isRolling, gameState.activePlayerIndex, gameState.currentRound, gameState.rollCount, settings.soundEnabled, settings.comboSoundEnabled]);

  const rollDice = useCallback(() => {
    if (gameState.rollCount >= gameState.maxRolls || isRolling) return;
    setIsRolling(true);
    audioService.playRoll();
    setComboPopup(null);
    setTimeout(() => {
      setGameState(prev => {
        const newDiceValues = prev.diceValues.map((v, i) => 
          prev.heldDice[i] ? v : ENERGY_FACES[Math.floor(Math.random() * ENERGY_FACES.length)]
        );
        return { ...prev, diceValues: newDiceValues, rollCount: prev.rollCount + 1 };
      });
      setIsRolling(false);
    }, 800);
  }, [gameState.rollCount, gameState.maxRolls, isRolling]);

  const startCharging = useCallback(() => { 
    if (gameState.rollCount < gameState.maxRolls && !isRolling) {
      setIsCharging(true); 
      audioService.playShake();
    }
  }, [gameState.rollCount, gameState.maxRolls, isRolling]);

  const stopChargingAndRoll = useCallback(() => { 
    if (isCharging) { 
      setIsCharging(false); 
      audioService.stopShake();
      rollDice(); 
    } 
  }, [isCharging, rollDice]);

  const endTurn = () => {
    if (gameState.rollCount === 0 || isRolling) return;
    audioService.playSuccess();
    setComboPopup(null);
    
    setGameState(prev => {
      const updatedPlayers = [...prev.players];
      const currentPlayer = updatedPlayers[prev.activePlayerIndex];
      
      const currentScore = currentHandResult.total;
      if (currentScore > currentPlayer.maxHand) currentPlayer.maxHand = currentScore;
      if (currentScore < currentPlayer.minHand) currentPlayer.minHand = currentScore;

      currentPlayer.score += currentScore;
      currentPlayer.lastScore = currentScore;
      currentPlayer.lastCombo = currentHandResult.combos[0];
      
      let nextIdx = prev.activePlayerIndex + 1;
      let nextRnd = prev.currentRound;
      let over = false;
      
      if (nextIdx >= prev.players.length) {
        nextIdx = 0;
        nextRnd += 1;
        if (nextRnd > prev.totalRounds) {
          over = true;
          nextRnd = prev.totalRounds;
          const finalPlayers = [...updatedPlayers];
          setTimeout(() => updateHallOfFame(finalPlayers, prev.totalRounds), 100);
        }
      }

      return { 
        ...prev, 
        players: updatedPlayers, 
        activePlayerIndex: nextIdx, 
        currentRound: nextRnd, 
        rollCount: 0, 
        diceValues: Array(DICE_COUNT).fill(null), 
        heldDice: Array(DICE_COUNT).fill(false), 
        isGameOver: over 
      };
    });
  };

  const updateHallOfFame = (finalPlayers: Player[], rounds: number) => {
    const currentHall = JSON.parse(localStorage.getItem('ecoPoker_hallOfFame_v2') || '[]');
    finalPlayers.forEach(p => {
      currentHall.push({ 
        name: p.name, 
        score: p.score, 
        date: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }), 
        rounds: rounds,
        maxHand: p.maxHand,
        minHand: p.minHand
      });
    });
    const sortedHall = currentHall.sort((a: any, b: any) => b.score - a.score).slice(0, 200);
    setHallOfFame(sortedHall);
    localStorage.setItem('ecoPoker_hallOfFame_v2', JSON.stringify(sortedHall));
  };

  const resetGame = () => { if (confirm("Deseja reiniciar a missão energética?")) { lastProcessedRollId.current = ""; setComboPopup(null); setGameState({ players: [], activePlayerIndex: 0, rollCount: 0, maxRolls: MAX_ROLLS, currentRound: 1, totalRounds: 5, diceValues: Array(DICE_COUNT).fill(null), heldDice: Array(DICE_COUNT).fill(false), isGameOver: false, roundScoreExplanation: [], currentRoundScore: 0 }); setSetupMode(true); } };

  const filteredHall = useMemo(() => {
    return hallOfFame
      .filter(entry => entry.rounds === hallFilter)
      .sort((a, b) => b.score - a.score);
  }, [hallOfFame, hallFilter]);

  const rankingContext = useMemo(() => {
    if (gameState.players.length < 1 || setupMode) return null;
    const sorted = [...gameState.players].sort((a, b) => b.score - a.score);
    const curr = gameState.players[gameState.activePlayerIndex];
    const pos = sorted.findIndex(p => p.id === curr.id) + 1;
    const above = pos > 1 ? sorted[pos - 2] : null;
    const below = pos < sorted.length ? sorted[pos] : null;
    return { pos, above, below, total: sorted.length, currentScore: curr.score };
  }, [gameState.players, gameState.activePlayerIndex, setupMode]);

  if (showSplash) {
    const currentDate = new Date().toLocaleDateString('pt-PT', { 
      day: '2-digit', 
      month: 'long', 
      year: 'numeric' 
    });

    return (
      <div className="fixed inset-0 bg-[#022c22] flex flex-col items-center justify-between p-8 z-[120] text-white text-center overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
          <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-500 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-emerald-600 rounded-full blur-[100px]"></div>
        </div>
        <div className="pt-safe w-full flex justify-between items-start opacity-40">
          <div className="text-left">
            <p className="text-[8px] font-black uppercase tracking-[0.3em]">Build v1.5.0 Pro</p>
            <p className="text-[8px] font-bold uppercase tracking-widest mt-0.5">Stable Release</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] font-black uppercase tracking-[0.1em]">{currentDate}</p>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="animate-float mb-8">
            <div className="w-28 h-28 bg-emerald-500 rounded-[40px] mx-auto mb-8 flex items-center justify-center shadow-[0_20px_60px_-15px_rgba(16,185,129,0.5)] ring-8 ring-white/5 relative group">
              <Zap size={56} className="text-white fill-white animate-pulse" />
              <div className="absolute inset-0 bg-white/20 rounded-[40px] opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>
            <h1 className="text-5xl font-black tracking-tighter mb-3 italic uppercase bg-gradient-to-b from-white to-emerald-300 bg-clip-text text-transparent">EIA-ECOPOKER</h1>
            <p className="text-emerald-400 font-bold uppercase text-[10px] tracking-[0.4em] opacity-80 leading-none">Sustainable Power Strategy</p>
          </div>
          <button onClick={() => { setShowSplash(false); audioService.resumeContext(); audioService.playClick(); }} className="group relative bg-white text-emerald-950 font-black px-14 py-5 rounded-[25px] shadow-2xl active:scale-95 transition-all uppercase tracking-[0.2em] text-sm overflow-hidden">
            <span className="relative z-10 flex items-center gap-3">INICIAR MISSÃO <ChevronRight size={18} /></span>
            <div className="absolute inset-0 bg-emerald-100 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
          </button>
        </div>
        <div className="pb-safe w-full space-y-4">
          <div className="flex flex-col items-center gap-1">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-30">Desenvolvido por</p>
            <p className="text-sm font-black italic tracking-tight uppercase text-emerald-400">By Koelho2000</p>
          </div>
          <div className="flex justify-center items-center gap-8 pt-4 border-t border-white/5">
            <a href="https://www.koelho2000.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest"><Globe size={10} /> koelho2000.com</a>
            <a href="https://www.eia.pt" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[9px] font-bold text-zinc-400 hover:text-white transition-colors uppercase tracking-widest"><ExternalLink size={10} /> eia.pt</a>
          </div>
        </div>
      </div>
    );
  }

  if (gameState.isGameOver) {
    const sortedFinalPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col p-6 text-white overflow-y-auto no-scrollbar pt-safe pb-safe">
        <div className="text-center mb-10 animate-pop-in">
          <Award size={64} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Relatório de Impacto</h2>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Ciclo de Produção Concluído</p>
        </div>
        <div className="space-y-4 mb-10 flex-1">
          {sortedFinalPlayers.map((p, i) => (
            <div key={p.id} className={`relative p-6 rounded-[35px] border animate-pop-in ${i === 0 ? 'bg-emerald-900/40 border-amber-500/50 scale-105 shadow-2xl' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-lg ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}º</div>
                  <div className="flex flex-col">
                    <span className="font-black text-xl uppercase tracking-tighter">{p.name}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="text-[8px] font-black text-emerald-400 uppercase bg-emerald-400/10 px-2 py-0.5 rounded">Máx: {p.maxHand}</span>
                      <span className="text-[8px] font-black text-red-400 uppercase bg-red-400/10 px-2 py-0.5 rounded">Min: {p.minHand}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                   <span className={`font-black text-3xl ${i === 0 ? 'text-emerald-400' : 'text-zinc-300'}`}>{p.score}</span>
                   <p className="text-[8px] font-black uppercase opacity-30 tracking-widest">PTS</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button onClick={resetGame} className="w-full bg-emerald-600 text-white font-black py-7 rounded-[35px] shadow-2xl uppercase tracking-widest text-sm active:scale-95 transition-all mb-8">Novo Ciclo Energético</button>
      </div>
    );
  }

  const isLastRound = gameState.currentRound === gameState.totalRounds;
  const activePlayer = gameState.players[gameState.activePlayerIndex];

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} gameStarted={!setupMode}>
      {activeTab === 'play' && (
        setupMode ? (
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-xl border border-zinc-100 dark:border-zinc-800">
              <h2 className="text-2xl font-black mb-6 italic uppercase flex items-center gap-3"><Users className="text-emerald-500" /> Equipa Técnica</h2>
              <div className="mb-8">
                <label className="text-[10px] font-black uppercase text-zinc-400 mb-4 block tracking-widest">Duração da Campanha (Rondas)</label>
                <div className="flex gap-2">
                  {[3, 5, 10, 15].map(r => (
                    <button key={r} onClick={() => { setGameState(prev => ({ ...prev, totalRounds: r })); audioService.playClick(); }} className={`flex-1 py-4 rounded-3xl font-black transition-all ${gameState.totalRounds === r ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{r}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 mb-6">
                <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nome do Jogador..." className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-3xl px-6 py-4 font-bold outline-none text-sm" />
                <button onClick={() => { if(newPlayerName.trim()) { setGameState(prev => ({ ...prev, players: [...prev.players, { id: crypto.randomUUID(), name: newPlayerName.trim(), score: 0, maxHand: -Infinity, minHand: Infinity }] })); setNewPlayerName(''); audioService.playClick(); } }} className="bg-emerald-600 text-white p-4 rounded-3xl shadow-lg active:scale-90 transition-all"><Plus /></button>
              </div>
              <div className="space-y-3">
                {gameState.players.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-4 rounded-3xl border border-zinc-100 dark:border-zinc-800 animate-pop-in">
                    <span className="font-black text-sm uppercase tracking-tighter">{p.name}</span>
                    <button onClick={() => { setGameState(prev => ({ ...prev, players: prev.players.filter(pl => pl.id !== p.id) })); audioService.playClick(); }} className="text-zinc-300 hover:text-red-500"><X size={18} strokeWidth={3} /></button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => { if(gameState.players.length > 0) { setSetupMode(false); audioService.playClick(); } }} disabled={gameState.players.length === 0} className="w-full bg-emerald-600 text-white font-black py-6 rounded-[35px] shadow-2xl disabled:opacity-50 uppercase tracking-widest text-sm active:scale-95 transition-all">INICIAR PARTIDA</button>
          </div>
        ) : (
          <div className="space-y-4">
            <QuickRanking players={gameState.players} activeIdx={gameState.activePlayerIndex} isOpen={isRankingOpen} onClose={() => setIsRankingOpen(false)} />
            
            {rankingContext && (
              <div className="flex flex-col gap-2 px-2 animate-in slide-in-from-top duration-500">
                <div className="flex items-center justify-between bg-emerald-600/10 dark:bg-emerald-500/5 p-3 rounded-2xl border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="bg-emerald-600 text-white px-3 h-8 rounded-xl flex items-center justify-center font-black text-xs shadow-md gap-2">
                      <span>{rankingContext.pos}º</span>
                      <span className="w-px h-3 bg-white/30"></span>
                      <span>{rankingContext.currentScore} pts</span>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[7px] font-black uppercase tracking-widest text-emerald-600 leading-none">Jogador Ativo</p>
                      <p className="text-xs font-black uppercase text-zinc-900 dark:text-zinc-100 mt-0.5">{activePlayer.name}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    {rankingContext.above && (
                      <div className="text-right">
                        <p className="text-[7px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1 justify-end"><TrendingUp size={8} /> Próximo Alvo</p>
                        <p className="text-[9px] font-bold text-zinc-600 dark:text-zinc-300 truncate max-w-[80px]">{rankingContext.above.name} (+{rankingContext.above.score - activePlayer.score})</p>
                      </div>
                    )}
                    {rankingContext.below && (
                      <div className="text-right">
                        <p className="text-[7px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-1 justify-end"><TrendingDown size={8} /> Cuidado com</p>
                        <p className="text-[9px] font-bold text-zinc-600 dark:text-zinc-300 truncate max-w-[80px]">{rankingContext.below.name} ({activePlayer.score - rankingContext.below.score})</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsRankingOpen(true); audioService.playClick(); }} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-md text-emerald-600 active:scale-90 transition-all"><LayoutDashboard size={20} /></button>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">Ronda {gameState.currentRound}/{gameState.totalRounds}</span>
                    {isLastRound && (
                      <span className="bg-red-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md uppercase animate-pulse">Última Ronda!</span>
                    )}
                  </div>
                  <div className="mt-1">
                    <span className="text-2xl font-black tracking-tighter italic uppercase truncate max-w-[140px] block leading-none">{activePlayer.name}</span>
                    <div className="flex gap-2 mt-1">
                       <span className="text-[7px] font-black text-emerald-500 uppercase">Melhor: {activePlayer.maxHand === -Infinity ? '-' : activePlayer.maxHand}</span>
                       <span className="text-[7px] font-black text-red-500 uppercase">Pior: {activePlayer.minHand === Infinity ? '-' : activePlayer.minHand}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900 px-5 py-3 rounded-[20px] flex items-center gap-3 border border-white dark:border-zinc-800 shadow-sm">
                <RotateCcw size={16} className={gameState.rollCount >= MAX_ROLLS ? 'text-red-500' : 'text-zinc-400'} strokeWidth={3} />
                <span className={`font-black text-lg ${gameState.rollCount >= MAX_ROLLS ? 'text-red-500' : ''}`}>{gameState.rollCount}/3</span>
              </div>
            </div>

            <div className={`bg-emerald-950 dark:bg-zinc-900 rounded-[60px] p-8 shadow-2xl relative overflow-hidden min-h-[420px] flex items-center justify-center transition-all ${isCharging ? 'ring-8 ring-emerald-500/20' : ''}`}>
              <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              <div className={`grid grid-cols-2 gap-y-12 gap-x-10 place-items-center py-4 ${isCharging ? 'animate-shake' : ''}`}>
                {gameState.diceValues.map((val, idx) => (
                  <Die key={idx} index={idx} value={val} held={gameState.heldDice[idx]} onHoldToggle={() => { if(gameState.rollCount > 0 && !isRolling && !gameState.isGameOver) { audioService.playHold(); setGameState(prev => { const n = [...prev.heldDice]; n[idx] = !n[idx]; return {...prev, heldDice: n}; }); } }} rolling={isRolling} />
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button onMouseDown={startCharging} onMouseUp={stopChargingAndRoll} onTouchStart={startCharging} onTouchEnd={stopChargingAndRoll} disabled={gameState.rollCount >= MAX_ROLLS || isRolling} className={`text-white font-black py-7 rounded-[35px] shadow-2xl uppercase tracking-widest text-sm transition-all ${gameState.rollCount >= MAX_ROLLS ? 'bg-zinc-300 dark:bg-zinc-800' : 'bg-amber-500'}`}>LANÇAR</button>
              <button onClick={endTurn} disabled={gameState.rollCount === 0 || isRolling} className="bg-emerald-600 text-white font-black py-7 rounded-[35px] shadow-2xl uppercase tracking-widest text-sm active:scale-95 disabled:opacity-50 transition-all">CONFIRMAR</button>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[45px] shadow-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-[10px] uppercase text-zinc-400 tracking-widest">Impacto da Jogada</h3>
                  <span className={`text-4xl font-black italic tracking-tighter ${currentHandResult.total < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{currentHandResult.total > 0 ? `+${currentHandResult.total}` : currentHandResult.total}</span>
                </div>
                <button onClick={() => { setIsScoreModalOpen(true); audioService.playClick(); }} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-emerald-600 active:scale-90 transition-all"><Info size={24} /></button>
              </div>
              <div className="space-y-2">
                {currentHandResult.explanation.map((line, i) => (
                  <div key={i} className={`flex items-center gap-3 text-[11px] font-bold p-3 rounded-2xl border-l-4 ${i === 0 ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-500 text-emerald-700' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500 border-zinc-200'}`}>{line}</div>
                ))}
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === 'scores' && (
        <div className="space-y-6">
          <div className="flex gap-4 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-[25px] sticky top-0 z-30 shadow-md">
            <button onClick={() => setRankingSubTab('current')} className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase transition-all ${rankingSubTab === 'current' ? 'bg-white dark:bg-zinc-800 shadow-sm text-emerald-600' : 'text-zinc-400'}`}>Campanha Atual</button>
            <button onClick={() => setRankingSubTab('hall')} className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase transition-all ${rankingSubTab === 'hall' ? 'bg-white dark:bg-zinc-800 shadow-sm text-emerald-600' : 'text-zinc-400'}`}>Hall of Fame</button>
          </div>

          {rankingSubTab === 'hall' && (
            <div className="space-y-6">
              <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                {[3, 5, 10, 15].map(r => (
                  <button 
                    key={r} 
                    onClick={() => { setHallFilter(r); audioService.playClick(); }}
                    className={`whitespace-nowrap px-6 py-3 rounded-2xl font-black text-[10px] uppercase transition-all flex items-center gap-2 ${hallFilter === r ? 'bg-emerald-600 text-white shadow-lg scale-105' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}
                  >
                    <Timer size={12} /> {r} Rondas
                  </button>
                ))}
              </div>

              {filteredHall.length > 0 && (
                <div className="bg-emerald-950 dark:bg-emerald-900/30 p-6 rounded-[40px] border-4 border-emerald-500/30 shadow-2xl relative overflow-hidden animate-pop-in">
                  <div className="absolute -right-4 -top-4 opacity-10 rotate-12">
                     <Trophy size={120} />
                  </div>
                  <div className="relative z-10 flex flex-col items-center">
                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-[0.4em] mb-2">Recorde Absoluto ({hallFilter} Rondas)</span>
                    <h3 className="text-4xl font-black italic tracking-tighter text-white mb-1 uppercase">{filteredHall[0].name}</h3>
                    <div className="bg-emerald-500 text-white px-8 py-2 rounded-full font-black text-2xl shadow-xl">
                      {filteredHall[0].score} PTS
                    </div>
                    <div className="flex gap-3 mt-4">
                       <span className="text-[8px] font-black text-emerald-300 uppercase px-3 py-1 bg-white/5 rounded-lg border border-white/10">Melhor Mão: {filteredHall[0].maxHand}</span>
                       <span className="text-[8px] font-black text-red-300 uppercase px-3 py-1 bg-white/5 rounded-lg border border-white/10">Pior Mão: {filteredHall[0].minHand}</span>
                    </div>
                    <p className="text-[8px] font-bold text-emerald-300 mt-4 uppercase tracking-widest flex items-center gap-2">
                       <CheckCircle2 size={10} /> Consolidado em {filteredHall[0].date}
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-3">
                {filteredHall.length === 0 ? (
                  <div className="bg-white dark:bg-zinc-900 p-12 rounded-[40px] text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60">
                    <Star size={40} className="mx-auto text-zinc-300 mb-4" />
                    <p className="font-black text-xs uppercase text-zinc-400">Sem registos nesta categoria</p>
                  </div>
                ) : (
                  filteredHall.map((p, i) => (
                    <div key={i} className={`flex items-center justify-between p-6 rounded-[35px] shadow-xl border animate-pop-in ${i === 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500/50' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}>
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black shadow-inner ${
                          i === 0 ? 'bg-amber-400 text-amber-950' : 
                          i === 1 ? 'bg-zinc-300 text-zinc-600' :
                          i === 2 ? 'bg-orange-400 text-orange-950' :
                          'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                        }`}>
                          {i === 0 ? <Trophy size={18} /> : i + 1}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-black text-sm uppercase tracking-tighter truncate max-w-[120px]">{p.name}</span>
                          <span className="text-[8px] font-bold text-zinc-400 uppercase">{p.date}</span>
                          <div className="flex gap-1.5 mt-1">
                             <span className="text-[6px] font-black text-emerald-500 uppercase">H: {p.maxHand}</span>
                             <span className="text-[6px] font-black text-red-500 uppercase">L: {p.minHand}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-black text-xl ${i === 0 ? 'text-emerald-600' : 'text-zinc-500'}`}>{p.score}</span>
                        <p className="text-[7px] font-black uppercase opacity-30">PTS</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {rankingSubTab === 'current' && (
            <div className="space-y-3">
              {gameState.players.length === 0 ? (
                <div className="bg-white dark:bg-zinc-900 p-12 rounded-[40px] text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 opacity-60">
                  <p className="font-black text-xs uppercase text-zinc-400">Nenhum jogador ativo</p>
                </div>
              ) : (
                [...gameState.players].sort((a,b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-[35px] shadow-xl border border-zinc-100 dark:border-zinc-800 animate-pop-in">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl font-black text-zinc-400">{i+1}</div>
                      <div className="flex flex-col">
                        <span className="font-black text-lg uppercase tracking-tighter">{p.name}</span>
                        <div className="flex gap-2">
                           <span className="text-[8px] font-black text-emerald-500 uppercase">Max: {p.maxHand === -Infinity ? '-' : p.maxHand}</span>
                           <span className="text-[8px] font-black text-red-500 uppercase">Min: {p.minHand === Infinity ? '-' : p.minHand}</span>
                        </div>
                      </div>
                    </div>
                    <span className="font-black text-2xl text-emerald-600">{p.score}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-8 p-2 pb-10 animate-in fade-in duration-500">
          <header className="px-2">
             <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">Manual Eco <Star className="text-amber-500" fill="currentColor" /></h2>
             <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">A Hierarquia da Sustentabilidade</p>
          </header>
          <div className="space-y-8">
            <section className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-xl space-y-5 border-l-8 border-emerald-500">
              <h3 className="font-black text-lg uppercase italic text-emerald-600 tracking-tight leading-none">O Poder Máximo</h3>
              <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium italic">
                A combinação de maior valor é o <span className="text-emerald-600 font-black">Clean Power</span>, que ocorre quando os seis dados apresentam exatamente o mesmo símbolo de energia limpa.
              </p>
            </section>
            <div className="grid gap-6">
               {[
                 { name: "Five Clean!", pts: 400, desc: "Acontece quando cinco dos seis dados apresentam o mesmo símbolo de energia limpa." },
                 { name: "Full House Verde!", pts: 300, desc: "Caracterizado por duas trincas distintas, ambas de energias limpas (ex: 3 Solars e 3 Hídricas)." },
                 { name: "Straight Energético!", pts: 200, desc: "Pelo menos um Solar, uma Eólica e uma Hidro presentes." },
                 { name: "Four Clean!", pts: 100, desc: "Quatro dados iguais de energia limpa." },
                 { name: "Three Clean!", pts: 60, desc: "Três dados iguais de energia limpa." },
                 { name: "Two Pair Verde!", pts: 40, desc: "Dois pares distintos de energias limpas." },
                 { name: "One Pair Clean!", pts: 20, desc: "Apenas um par de energia limpa." }
               ].map((c, i) => (
                 <div key={i} className="bg-white dark:bg-zinc-900 p-6 rounded-[35px] border border-zinc-100 dark:border-zinc-800 shadow-lg flex flex-col gap-2">
                    <div className="flex justify-between items-center">
                       <span className="font-black text-[14px] uppercase italic text-emerald-700 dark:text-emerald-400 tracking-tighter">{c.name}</span>
                       <span className="bg-emerald-600 text-white text-[10px] px-4 py-1.5 rounded-full font-black shadow-lg">+{c.pts} PTS</span>
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">{c.desc}</p>
                 </div>
               ))}
            </div>
            <section className="bg-orange-50 dark:bg-red-950/20 p-8 rounded-[40px] border-l-8 border-red-500 space-y-6">
               <h3 className="font-black text-lg uppercase italic text-red-600 tracking-tight leading-none">Risco Ambiental</h3>
               <div className="space-y-4">
                 <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
                   <span className="text-orange-600 font-black">Mixed Energy Hand:</span> Qualquer jogada que misture limpas com fósseis. Penalização de -20 pts por fóssil.
                 </p>
                 <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed border-t pt-4 border-red-100">
                   <span className="text-red-700 font-black">Dirty Energy:</span> Quatro ou mais dados fósseis (-100 pts fixos).
                 </p>
                 <p className="text-[12px] text-zinc-600 dark:text-zinc-400 leading-relaxed border-t pt-4 border-red-100">
                   <span className="text-zinc-900 dark:text-white font-black">Blackout:</span> Seis dados exclusivamente fósseis (0 PTS).
                 </p>
               </div>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <h2 className="text-3xl font-black italic tracking-tighter px-2 uppercase">Configuração</h2>
           <div className="bg-white dark:bg-zinc-900 rounded-[45px] p-8 space-y-8 shadow-xl border border-zinc-100 dark:border-zinc-800">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Volume2 size={18} /> Efeitos Sonoros</span>
                  <button onClick={() => { setSettings(s => ({...s, soundEnabled: !s.soundEnabled})); audioService.playClick(); }} className={`w-16 h-10 rounded-full relative transition-all ${settings.soundEnabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                    <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.soundEnabled ? 'left-7.5' : 'left-1.5'}`} />
                  </button>
                </div>
                <div className="px-2">
                  <input type="range" min="0" max="1" step="0.01" value={settings.soundVolume} onChange={(e) => setSettings(s => ({...s, soundVolume: parseFloat(e.target.value)}))} className="w-full accent-emerald-500" />
                  <p className="text-[8px] font-black uppercase text-zinc-400 mt-1">Volume Atual: {Math.round(settings.soundVolume * 100)}%</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Music size={18} /> Música de Fundo</span>
                  <button onClick={() => { setSettings(s => ({...s, musicEnabled: !s.musicEnabled})); audioService.playClick(); }} className={`w-16 h-10 rounded-full relative transition-all ${settings.musicEnabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                    <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.musicEnabled ? 'left-7.5' : 'left-1.5'}`} />
                  </button>
                </div>
                <div className="px-2">
                  <input type="range" min="0" max="1" step="0.01" value={settings.musicVolume} onChange={(e) => setSettings(s => ({...s, musicVolume: parseFloat(e.target.value)}))} className="w-full accent-emerald-500" />
                  <p className="text-[8px] font-black uppercase text-zinc-400 mt-1">Volume Atual: {Math.round(settings.musicVolume * 100)}%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2">{settings.darkMode ? <Moon size={18} /> : <SunIcon size={18} />} Modo Noite</span>
                <button onClick={() => { setSettings(s => ({...s, darkMode: !s.darkMode})); audioService.playClick(); }} className={`w-16 h-10 rounded-full relative transition-all ${settings.darkMode ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.darkMode ? 'left-7.5' : 'left-1.5'}`} />
                </button>
              </div>
           </div>
           <button onClick={resetGame} className="w-full py-6 text-red-500 font-black rounded-[35px] border-4 border-red-500/10 uppercase tracking-widest text-xs active:scale-95 transition-all">Reiniciar Campanha</button>
        </div>
      )}

      <ScoreModal isOpen={isScoreModalOpen} onClose={() => setIsScoreModalOpen(false)} currentHand={currentHandResult} />
      
      {comboPopup && (
        <div className="fixed inset-x-0 top-1/3 flex justify-center z-[150] pointer-events-none px-4 animate-pop-in">
          <div className="bg-white dark:bg-emerald-600 text-emerald-950 dark:text-white px-10 py-8 rounded-[40px] shadow-2xl border-4 border-emerald-400 flex flex-col items-center">
            <Medal size={48} className="text-amber-500 mb-3 animate-bounce" />
            <h4 className="font-black text-4xl italic tracking-tighter uppercase whitespace-nowrap text-center leading-none">{comboPopup}</h4>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;