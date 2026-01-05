
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
  Sun as SunIcon, Volume2, VolumeX, Award, Trophy, 
  Info, Zap, Leaf, Factory, AlertCircle, History, Star, Medal,
  Music, CheckCircle2, Filter, Users, LayoutDashboard, Settings as SettingsIcon,
  Flame, Droplets, Wind
} from 'lucide-react';

const ScoreModal: React.FC<{ isOpen: boolean; onClose: () => void; currentHand: any }> = ({ isOpen, onClose, currentHand }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-900 w-full max-w-sm rounded-[40px] shadow-2xl overflow-hidden animate-pop-in">
        <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
          <div>
            <h3 className="font-black text-xl italic tracking-tighter uppercase">Calculadora Eco</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Transparência Energética</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800">
            <p className="text-[10px] font-black uppercase text-zinc-400 mb-4 tracking-widest">Matemática da Mão</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-emerald-600 flex items-center gap-2"><Leaf size={14} /> Bónus Limpo ({currentHand.cleanCount}x)</span>
                <span className="text-xs font-black">+{currentHand.cleanCount * 15}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-red-500 flex items-center gap-2"><Factory size={14} /> Multa Fóssil ({currentHand.fossilCount}x)</span>
                <span className="text-xs font-black">-{currentHand.fossilCount * 20}</span>
              </div>
              <div className="border-t dark:border-zinc-700 pt-3 flex justify-between items-center mt-2">
                <span className="font-black text-sm uppercase italic">Saldo Base</span>
                <span className={`text-2xl font-black ${currentHand.mixedScore < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {currentHand.mixedScore} pts
                </span>
              </div>
            </div>
          </div>
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
                  <span className={`text-xs font-bold uppercase truncate max-w-[80px] ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{p.name}</span>
                </div>
                <span className="font-black text-sm">{p.score}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
           <p className="text-[8px] font-bold text-zinc-400 uppercase text-center">EIA-ECOPOKER Pro v1.2</p>
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
  const [settings, setSettings] = useState<Settings>({
    soundEnabled: true,
    comboSoundEnabled: true,
    musicEnabled: false,
    darkMode: window.matchMedia('(prefers-color-scheme: dark)').matches
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
    const savedHall = localStorage.getItem('ecoPoker_hallOfFame_v2');
    if (savedHall) setHallOfFame(JSON.parse(savedHall));
    if (settings.darkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [settings.darkMode]);

  useEffect(() => {
    audioService.setEnabled(settings.soundEnabled);
    audioService.setMusicEnabled(settings.musicEnabled);
  }, [settings.soundEnabled, settings.musicEnabled]);

  const currentHandResult = useMemo(() => {
    const values = gameState.diceValues;
    const validValues = values.filter((v): v is EnergyType => v !== null);
    if (validValues.length === 0) return { total: 0, explanation: ["Lança os dados para começar"], combos: [], cleanCount: 0, fossilCount: 0, mixedScore: 0 };

    const cleanValues = validValues.filter(v => CLEAN_ENERGIES.includes(v));
    const fossilValues = validValues.filter(v => FOSSIL_ENERGIES.includes(v));
    
    const counts: Record<string, number> = {};
    validValues.forEach(v => counts[v] = (counts[v] || 0) + 1);
    
    const sortedEntries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const maxFreq = sortedEntries[0]?.[1] || 0;
    const maxFreqFace = sortedEntries[0]?.[0] as EnergyType;
    const secondFreq = sortedEntries[1]?.[1] || 0;

    let total = 0;
    const combos: string[] = [];

    // HIERARQUIA DE MÃOS (Precedência descendente)
    if (maxFreq === 6 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 1000; combos.push("CLEAN POWER!");
    } else if (cleanValues.length === 6) {
      total = 600; combos.push("CLEAN FLUSH TOTAL!");
    } else if (maxFreq === 5 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 400; combos.push("FIVE CLEAN!");
    } else if (maxFreq === 3 && secondFreq === 3 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 300; combos.push("FULL HOUSE VERDE!");
    } else if (CLEAN_ENERGIES.every(ce => validValues.includes(ce))) {
      total = 200; combos.push("STRAIGHT ENERGÉTICO!");
    } else if (maxFreq === 4 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 100; combos.push("FOUR CLEAN!");
    } else if (maxFreq === 3 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 60; combos.push("THREE CLEAN!");
    } else if (maxFreq === 2 && secondFreq === 2 && CLEAN_ENERGIES.includes(maxFreqFace)) {
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
      explanation: [`Impacto: ${total} pts`, `Mix Limpo: ${cleanValues.length}`, `Mix Fóssil: ${fossilValues.length}`], 
      combos, 
      cleanCount: cleanValues.length, 
      fossilCount: fossilValues.length, 
      mixedScore: (cleanValues.length * 15) - (fossilValues.length * 20) 
    };
  }, [gameState.diceValues]);

  // COMBO POPUP LOGIC - 1.5 Segundos
  useEffect(() => {
    const currentRollId = `${gameState.activePlayerIndex}-${gameState.currentRound}-${gameState.rollCount}`;
    if (!isRolling && currentHandResult.combos.length > 0 && lastProcessedRollId.current !== currentRollId) {
      const comboName = currentHandResult.combos[0];
      if (comboName !== "MIXED ENERGY" && gameState.rollCount > 0) {
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

  const startCharging = useCallback(() => { if (gameState.rollCount < gameState.maxRolls && !isRolling) setIsCharging(true); }, [gameState.rollCount, gameState.maxRolls, isRolling]);
  const stopChargingAndRoll = useCallback(() => { if (isCharging) { setIsCharging(false); rollDice(); } }, [isCharging, rollDice]);

  const endTurn = () => {
    if (gameState.rollCount === 0 || isRolling) return;
    audioService.playSuccess();
    setComboPopup(null);
    setGameState(prev => {
      const updatedPlayers = [...prev.players];
      updatedPlayers[prev.activePlayerIndex].score += currentHandResult.total;
      
      let nextIdx = prev.activePlayerIndex + 1;
      let nextRnd = prev.currentRound;
      let over = false;
      
      if (nextIdx >= prev.players.length) {
        nextIdx = 0;
        nextRnd += 1;
        if (nextRnd > prev.totalRounds) {
          over = true;
          nextRnd = prev.totalRounds;
          updateHallOfFame(updatedPlayers, prev.totalRounds);
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
    const currentHall = [...hallOfFame];
    finalPlayers.forEach(p => {
      currentHall.push({ name: p.name, score: p.score, date: new Date().toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }), rounds: rounds });
    });
    const sortedHall = currentHall.sort((a, b) => b.score - a.score);
    const categories = [3, 5, 10, 15];
    let filteredHall: HallOfFameEntry[] = [];
    categories.forEach(cat => { filteredHall = [...filteredHall, ...sortedHall.filter(e => e.rounds === cat).slice(0, 20)]; });
    setHallOfFame(filteredHall);
    localStorage.setItem('ecoPoker_hallOfFame_v2', JSON.stringify(filteredHall));
  };

  const resetGame = () => { if (confirm("Deseja reiniciar a campanha energética?")) { lastProcessedRollId.current = ""; setComboPopup(null); setGameState({ players: [], activePlayerIndex: 0, rollCount: 0, maxRolls: MAX_ROLLS, currentRound: 1, totalRounds: 5, diceValues: Array(DICE_COUNT).fill(null), heldDice: Array(DICE_COUNT).fill(false), isGameOver: false, roundScoreExplanation: [], currentRoundScore: 0 }); setSetupMode(true); } };

  // SPLASH SCREEN
  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-emerald-950 flex flex-col items-center justify-center p-8 z-[120] text-white text-center">
        <div className="animate-float mb-8">
          <div className="w-24 h-24 bg-emerald-500 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-2xl">
            <Trophy size={48} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic uppercase">EIA-ECOPOKER</h1>
          <p className="text-emerald-400 font-bold uppercase text-[10px] tracking-[0.2em]">Manual do Jogador Verde</p>
        </div>
        <button onClick={() => { setShowSplash(false); audioService.playClick(); }} className="bg-white text-emerald-900 font-black px-16 py-5 rounded-full shadow-2xl active:scale-90 transition-all uppercase tracking-widest">INICIAR MISSÃO</button>
      </div>
    );
  }

  // GAME OVER SCREEN
  if (gameState.isGameOver) {
    const sortedFinalPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col p-6 text-white overflow-y-auto no-scrollbar">
        <div className="text-center mb-8 animate-pop-in">
          <Award size={64} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Relatório de Impacto</h2>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Classificação Final Global</p>
        </div>
        <div className="space-y-4 mb-10">
          {sortedFinalPlayers.map((p, i) => (
            <div key={p.id} className={`relative overflow-hidden p-6 rounded-[35px] border transition-all animate-pop-in ${i === 0 ? 'bg-emerald-900/40 border-amber-500/50 scale-105 shadow-2xl shadow-emerald-500/20' : 'bg-zinc-900 border-zinc-800'}`} style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-5">
                  <div className={`w-12 h-12 flex items-center justify-center rounded-2xl font-black text-xl shadow-lg ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}º</div>
                  <div className="flex flex-col">
                    <span className="font-black text-xl uppercase tracking-tighter">{p.name}</span>
                    {i === 0 && <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1"><Trophy size={10} /> Líder de Sustentabilidade</span>}
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
        <button onClick={resetGame} className="mt-auto w-full bg-emerald-600 text-white font-black py-7 rounded-[35px] shadow-2xl uppercase tracking-widest text-sm active:scale-95 hover:bg-emerald-500 mb-8 transition-all">Novo Ciclo Energético</button>
      </div>
    );
  }

  const renderPlay = () => {
    if (setupMode) {
      return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-[40px] shadow-2xl border border-zinc-100 dark:border-zinc-800">
            <h2 className="text-2xl font-black mb-6 italic flex items-center gap-3 uppercase"><Users className="text-emerald-500" /> Equipa de Jogadores</h2>
            <div className="mb-8">
              <label className="text-[10px] font-black uppercase text-zinc-400 mb-4 block tracking-widest">Duração do Ciclo (Rondas)</label>
              <div className="flex gap-2">
                {[3, 5, 10, 15].map(r => (
                  <button key={r} onClick={() => { setGameState(prev => ({ ...prev, totalRounds: r })); audioService.playClick(); }} className={`flex-1 py-4 rounded-3xl font-black transition-all ${gameState.totalRounds === r ? 'bg-emerald-600 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>{r}</button>
                ))}
              </div>
            </div>
            <div className="flex gap-2 mb-6">
              <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Nome do Jogador..." className="flex-1 bg-zinc-100 dark:bg-zinc-800 border-none rounded-3xl px-6 py-4 font-bold outline-none text-sm" />
              <button onClick={() => { if(newPlayerName.trim()) { setGameState(prev => ({ ...prev, players: [...prev.players, { id: crypto.randomUUID(), name: newPlayerName.trim(), score: 0 }] })); setNewPlayerName(''); audioService.playClick(); } }} className="bg-emerald-600 text-white p-4 rounded-3xl shadow-lg"><Plus /></button>
            </div>
            <div className="space-y-3">
              {gameState.players.map((p) => (
                <div key={p.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800 animate-pop-in">
                  <span className="font-black text-sm uppercase tracking-tighter">{p.name}</span>
                  <button onClick={() => { setGameState(prev => ({ ...prev, players: prev.players.filter(pl => pl.id !== p.id) })); audioService.playClick(); }} className="text-zinc-300 hover:text-red-500"><X size={20} strokeWidth={3} /></button>
                </div>
              ))}
            </div>
          </div>
          <button onClick={() => { if(gameState.players.length > 0) { setSetupMode(false); audioService.playClick(); } }} disabled={gameState.players.length === 0} className="w-full bg-emerald-600 text-white font-black py-6 rounded-[35px] shadow-2xl disabled:opacity-50 uppercase tracking-widest text-sm">INICIAR PARTIDA</button>
        </div>
      );
    }

    const currentPlayer = gameState.players[gameState.activePlayerIndex];
    const isTurnFinished = gameState.rollCount >= gameState.maxRolls;

    return (
      <div className="space-y-4">
        <QuickRanking players={gameState.players} activeIdx={gameState.activePlayerIndex} isOpen={isRankingOpen} onClose={() => setIsRankingOpen(false)} />
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <button onClick={() => { setIsRankingOpen(true); audioService.playClick(); }} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-md text-emerald-600 dark:text-emerald-400 active:scale-90 transition-all">
               <LayoutDashboard size={20} />
            </button>
            <div className="flex flex-col">
              <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ronda {gameState.currentRound}/{gameState.totalRounds}</span>
              <span className="text-2xl font-black tracking-tighter italic uppercase leading-none truncate max-w-[150px]">{currentPlayer.name}</span>
            </div>
          </div>
          <div className="bg-zinc-100 dark:bg-zinc-900 px-5 py-3 rounded-[20px] flex items-center gap-3 shadow-inner border border-white dark:border-zinc-800">
            <RotateCcw size={16} className={`transition-colors ${isTurnFinished ? 'text-red-500' : 'text-zinc-400'}`} strokeWidth={3} />
            <span className={`font-black text-lg ${isTurnFinished ? 'text-red-500' : ''}`}>{gameState.rollCount}/3</span>
          </div>
        </div>

        <div className={`bg-emerald-950 dark:bg-zinc-900 rounded-[60px] p-8 shadow-2xl relative overflow-hidden min-h-[420px] flex items-center justify-center transition-all duration-300 ${isCharging ? 'scale-[1.02] ring-8 ring-emerald-500/20' : ''}`}>
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          {isTurnFinished && !isRolling && (
            <div className="absolute top-4 left-0 right-0 z-40 flex justify-center animate-in slide-in-from-top-4 duration-500 px-4">
               <div className="bg-white/95 dark:bg-zinc-800/95 backdrop-blur-md px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 border border-emerald-500/30">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <p className="font-black text-[10px] text-emerald-950 dark:text-white uppercase italic tracking-tighter whitespace-nowrap">Ronda Concluída! Passa ao próximo jogador</p>
               </div>
            </div>
          )}
          <div className={`grid grid-cols-2 gap-y-12 gap-x-10 place-items-center py-4 transition-transform ${isCharging ? 'animate-shake' : ''}`}>
            {gameState.diceValues.map((val, idx) => (
              <Die key={idx} index={idx} value={val} held={gameState.heldDice[idx]} onHoldToggle={() => { if(gameState.rollCount > 0 && !isRolling && !isCharging && !isTurnFinished) { audioService.playHold(); setGameState(prev => { const n = [...prev.heldDice]; n[idx] = !n[idx]; return {...prev, heldDice: n}; }); } }} rolling={isRolling} />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button onMouseDown={startCharging} onMouseUp={stopChargingAndRoll} onTouchStart={startCharging} onTouchEnd={stopChargingAndRoll} disabled={isTurnFinished || isRolling} className={`text-white font-black py-7 rounded-[35px] shadow-2xl transition-all uppercase tracking-widest text-sm active:scale-95 ${isTurnFinished ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400' : isCharging ? 'bg-emerald-400 scale-105' : 'bg-amber-500'}`}>{isRolling ? '...' : isTurnFinished ? 'ESGOTADO' : isCharging ? 'LANÇAR!' : 'DADOS'}</button>
          <button onClick={endTurn} disabled={gameState.rollCount === 0 || isRolling} className={`bg-emerald-600 text-white font-black py-7 rounded-[35px] shadow-2xl active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm transition-all ${isTurnFinished ? 'ring-4 ring-emerald-400 animate-pulse' : ''}`}>CONFIRMAR</button>
        </div>

        <div className={`p-8 rounded-[45px] shadow-xl border transition-all duration-500 ${isTurnFinished ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 scale-[1.02]' : 'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'}`}>
          <div className="flex justify-between items-end mb-6">
            <div>
              <h3 className="font-black text-[10px] uppercase text-zinc-400 tracking-widest mb-1">Impacto da Jogada</h3>
              <div className="flex items-center gap-3">
                <span className={`text-4xl font-black italic tracking-tighter ${currentHandResult.total < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{currentHandResult.total > 0 ? `+${currentHandResult.total}` : currentHandResult.total}</span>
              </div>
            </div>
            <button onClick={() => { setIsScoreModalOpen(true); audioService.playClick(); }} className="bg-zinc-50 dark:bg-zinc-800 p-3 rounded-2xl text-emerald-600 border border-zinc-100 dark:border-zinc-700 active:scale-90"><Info size={24} /></button>
          </div>
          <div className="space-y-2">
            {currentHandResult.explanation.map((line, i) => (
              <div key={i} className={`flex items-center gap-3 text-[11px] font-bold p-3 rounded-2xl border-l-4 transition-all ${i === 0 ? (isTurnFinished ? 'bg-emerald-600 text-white border-emerald-400' : 'bg-emerald-50 dark:bg-emerald-900/40 border-emerald-500 text-emerald-700 dark:text-emerald-300') : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-500'}`}>{line}</div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const filteredHall = hallOfFame.filter(e => e.rounds === hallFilter).slice(0, 20);

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} gameStarted={!setupMode}>
      {activeTab === 'play' && renderPlay()}
      {activeTab === 'scores' && (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="flex items-center gap-4 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-[25px]">
            <button onClick={() => setRankingSubTab('current')} className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${rankingSubTab === 'current' ? 'bg-white dark:bg-zinc-800 shadow-md text-emerald-600' : 'text-zinc-400'}`}>Atual</button>
            <button onClick={() => setRankingSubTab('hall')} className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase tracking-widest transition-all ${rankingSubTab === 'hall' ? 'bg-white dark:bg-zinc-800 shadow-md text-emerald-600' : 'text-zinc-400'}`}>Hall of Fame</button>
          </div>
          {rankingSubTab === 'hall' && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
              {[3, 5, 10, 15].map(cat => (
                <button key={cat} onClick={() => { setHallFilter(cat); audioService.playClick(); }} className={`px-4 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${hallFilter === cat ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg' : 'bg-white dark:bg-zinc-900 text-zinc-400'}`}>{cat} Rondas</button>
              ))}
            </div>
          )}
          <div className="space-y-3">
            {rankingSubTab === 'current' ? (
              gameState.players.length > 0 ? (
                [...gameState.players].sort((a,b) => b.score - a.score).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-[35px] shadow-xl border border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 flex items-center justify-center rounded-[14px] font-black text-sm ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>{i+1}</span>
                      <span className="font-black text-lg uppercase tracking-tighter">{p.name}</span>
                    </div>
                    <span className="font-black text-xl text-emerald-600">{p.score}</span>
                  </div>
                ))
              ) : <div className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest text-xs opacity-50 italic">Nenhum jogador ativo</div>
            ) : (
              filteredHall.length > 0 ? filteredHall.map((p, i) => (
                <div key={i} className="flex items-center justify-between bg-emerald-50/50 dark:bg-zinc-900 p-6 rounded-[35px] shadow-xl border border-emerald-100 dark:border-zinc-800">
                  <div className="flex items-center gap-4">
                    <span className={`w-10 h-10 flex items-center justify-center rounded-[14px] font-black text-sm ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-zinc-800'}`}>{i+1}</span>
                    <div className="flex flex-col">
                      <span className="font-black text-lg uppercase tracking-tighter">{p.name}</span>
                      <span className="text-[8px] font-bold uppercase opacity-50">{p.date}</span>
                    </div>
                  </div>
                  <span className="font-black text-xl text-emerald-600">{p.score}</span>
                </div>
              )) : <div className="text-center py-20 text-zinc-400 font-bold uppercase tracking-widest text-xs opacity-50 italic">Hall of Fame vazio para {hallFilter} rondas</div>
            )}
          </div>
        </div>
      )}
      
      {activeTab === 'rules' && (
        <div className="space-y-6 animate-in fade-in duration-500 p-2">
          <header className="px-2">
             <h2 className="text-3xl font-black italic tracking-tighter flex items-center gap-3 uppercase">Eco Manual <Star className="text-amber-500" fill="currentColor" /></h2>
             <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Guia de Estratégia Energética</p>
          </header>
          
          <div className="space-y-4">
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] border-b pb-2">Hierarquia de Mãos</p>
            <div className="space-y-3">
              {[
                { name: "Clean Power!", req: "6 Iguais (Limpas)", pts: 1000, color: "bg-emerald-600", desc: "Mix 100% renovável e perfeitamente estável." },
                { name: "Clean Flush Total!", req: "6 Limpas (Qualquer mix)", pts: 600, color: "bg-emerald-500", desc: "Sistema totalmente descarbonizado." },
                { name: "Five Clean!", req: "5 Iguais (Limpas)", pts: 400, color: "bg-emerald-400", desc: "Domínio absoluto de uma única fonte verde." },
                { name: "Full House Verde!", req: "3+3 Iguais (Limpas)", pts: 300, color: "bg-cyan-500", desc: "Equilíbrio perfeito entre duas fontes renováveis." },
                { name: "Straight Energético!", req: "Solar + Hidro + Eólica", pts: 200, color: "bg-sky-500", desc: "Simboliza a diversidade e complementaridade do sistema." },
                { name: "Four Clean!", req: "4 Iguais (Limpas)", pts: 100, color: "bg-teal-500", desc: "Produção verde robusta e predominante." },
                { name: "Three Clean!", req: "3 Iguais (Limpas)", pts: 60, color: "bg-teal-400", desc: "Transição energética bem encaminhada." },
                { name: "Two Pair Verde!", req: "2+2 Iguais (Limpas)", pts: 40, color: "bg-teal-300", desc: "Reflete uma transição em curso mas incompleta." },
                { name: "One Pair Clean!", req: "2 Iguais (Limpas)", pts: 20, color: "bg-teal-200", desc: "Modesta produção verde, mas superior a fósseis." },
                { name: "Mixed Energy Hand", req: "Mix Limpa + Fóssil", pts: "Var.", color: "bg-orange-400", desc: "Penaliza o sistema por cada símbolo fóssil (-20) vs cada limpa (+15)." },
                { name: "Dirty Energy!", req: "4+ Fósseis", pts: -100, color: "bg-red-600", desc: "Sistema altamente poluente e ineficiente." },
                { name: "Blackout!", req: "6 Fósseis", pts: 0, color: "bg-zinc-900", desc: "Dependência total e ausência de pontos." }
              ].map((c, i) => (
                <div key={i} className="bg-white dark:bg-zinc-900 p-5 rounded-[30px] shadow-lg border-l-[6px] border-emerald-500 flex flex-col gap-2">
                   <div className="flex items-center justify-between">
                      <span className="font-black text-sm uppercase italic tracking-tighter text-zinc-800 dark:text-zinc-100">{c.name}</span>
                      <div className={`px-4 py-1 rounded-full text-[10px] font-black text-white ${c.color}`}>
                         {typeof c.pts === 'number' ? (c.pts >= 0 ? `+${c.pts}` : c.pts) : c.pts}
                      </div>
                   </div>
                   <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{c.req}</p>
                   <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight italic">{c.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6 animate-in fade-in duration-500">
           <h2 className="text-3xl font-black italic tracking-tighter px-2 uppercase">Ajustes Profissionais</h2>
           <div className="bg-white dark:bg-zinc-900 rounded-[45px] p-8 space-y-8 shadow-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Volume2 size={18} /> Som Geral</span>
                <button onClick={() => { setSettings(s => ({...s, soundEnabled: !s.soundEnabled})); audioService.playClick(); }} className={`w-16 h-10 rounded-full relative transition-all ${settings.soundEnabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.soundEnabled ? 'left-7.5' : 'left-1.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Music size={18} /> Música Ambiente</span>
                <button onClick={() => { setSettings(s => ({...s, musicEnabled: !s.musicEnabled})); audioService.playClick(); }} className={`w-16 h-10 rounded-full relative transition-all ${settings.musicEnabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.musicEnabled ? 'left-7.5' : 'left-1.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><SettingsIcon size={18} /> Som de Combos</span>
                <button onClick={() => { setSettings(s => ({...s, comboSoundEnabled: !s.comboSoundEnabled})); audioService.playClick(); }} className={`w-16 h-10 rounded-full relative transition-all ${settings.comboSoundEnabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.comboSoundEnabled ? 'left-7.5' : 'left-1.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2">{settings.darkMode ? <Moon size={18} /> : <SunIcon size={18} />} Tema Noturno</span>
                <button onClick={() => { setSettings(s => ({...s, darkMode: !s.darkMode})); audioService.playClick(); }} className={`w-16 h-10 rounded-full relative transition-all ${settings.darkMode ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.darkMode ? 'left-7.5' : 'left-1.5'}`} />
                </button>
              </div>
           </div>
           <div className="p-4 space-y-4">
              <button onClick={resetGame} className="w-full py-6 text-red-500 font-black rounded-[35px] border-4 border-red-500/10 uppercase tracking-widest text-xs hover:bg-red-50 transition-colors active:scale-95">Reiniciar Ciclo</button>
              <div className="text-center space-y-2">
                 <p className="text-[10px] text-zinc-400 font-bold uppercase">Personalize os sons em audioService.ts</p>
                 <div className="flex justify-center gap-4 opacity-30">
                    <SunIcon size={16} /> <Wind size={16} /> <Droplets size={16} /> <Flame size={16} />
                 </div>
              </div>
           </div>
        </div>
      )}

      <ScoreModal isOpen={isScoreModalOpen} onClose={() => setIsScoreModalOpen(false)} currentHand={currentHandResult} />
      
      {comboPopup && (
        <div className="fixed inset-x-0 top-1/3 flex justify-center z-[150] pointer-events-none px-4 animate-pop-in">
          <div className="bg-white dark:bg-emerald-600 text-emerald-950 dark:text-white px-10 py-8 rounded-[40px] shadow-2xl border-4 border-emerald-400 flex flex-col items-center">
            <Medal size={48} className="text-amber-500 mb-3 animate-bounce" />
            <h4 className="font-black text-4xl italic tracking-tighter uppercase whitespace-nowrap">{comboPopup}</h4>
            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mt-2">Excelente Mix Energético!</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
