
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
            <h3 className="font-black text-xl italic tracking-tighter uppercase">Eco-Calculadora</h3>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Matemática Sustentável</p>
          </div>
          <button onClick={onClose} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition-colors">
            <X size={20} strokeWidth={3} />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-zinc-50 dark:bg-zinc-800/50 p-5 rounded-3xl border border-zinc-100 dark:border-zinc-800">
            <div className="space-y-3">
              <div className="flex justify-between items-center text-emerald-600">
                <span className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest"><Leaf size={14} /> Mix Renovável ({currentHand.cleanCount}x)</span>
                <span className="text-xs font-black">+{currentHand.cleanCount * 15}</span>
              </div>
              <div className="flex justify-between items-center text-red-500">
                <span className="text-xs font-bold flex items-center gap-2 uppercase tracking-widest"><Factory size={14} /> Mix Poluente ({currentHand.fossilCount}x)</span>
                <span className="text-xs font-black">-{currentHand.fossilCount * 20}</span>
              </div>
              <div className="border-t dark:border-zinc-700 pt-3 flex justify-between items-center mt-2">
                <span className="font-black text-sm uppercase italic">Saldo Base</span>
                <span className={`text-2xl font-black ${currentHand.mixedScore < 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {currentHand.mixedScore}
                </span>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-zinc-400 font-bold uppercase text-center leading-relaxed">
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
                  <span className={`text-xs font-bold uppercase truncate max-w-[80px] ${isCurrent ? 'text-emerald-700 dark:text-emerald-400' : ''}`}>{p.name}</span>
                </div>
                <span className="font-black text-sm">{p.score}</span>
              </div>
            );
          })}
        </div>
        <div className="mt-8 pt-4 border-t border-zinc-100 dark:border-zinc-800">
           <p className="text-[8px] font-bold text-zinc-400 uppercase text-center">EIA-ECOPOKER v1.3</p>
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
    const secondFreqFace = sortedEntries[1]?.[0] as EnergyType;

    let total = 0;
    const combos: string[] = [];

    // HIERARQUIA RIGOROSA DE MÃOS
    if (maxFreq === 6 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 1000; combos.push("CLEAN POWER!");
    } else if (cleanValues.length === 6) {
      total = 600; combos.push("CLEAN FLUSH TOTAL!");
    } else if (maxFreq === 5 && CLEAN_ENERGIES.includes(maxFreqFace)) {
      total = 400; combos.push("FIVE CLEAN!");
    } else if (maxFreq === 3 && secondFreq === 3 && CLEAN_ENERGIES.includes(maxFreqFace) && CLEAN_ENERGIES.includes(secondFreqFace)) {
      total = 300; combos.push("FULL HOUSE VERDE!");
    } else if (CLEAN_ENERGIES.every(ce => validValues.includes(ce)) && cleanValues.length >= 3) {
      // Pelo menos um de cada limpa
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

  const resetGame = () => { if (confirm("Reiniciar campanha energética?")) { lastProcessedRollId.current = ""; setComboPopup(null); setGameState({ players: [], activePlayerIndex: 0, rollCount: 0, maxRolls: MAX_ROLLS, currentRound: 1, totalRounds: 5, diceValues: Array(DICE_COUNT).fill(null), heldDice: Array(DICE_COUNT).fill(false), isGameOver: false, roundScoreExplanation: [], currentRoundScore: 0 }); setSetupMode(true); } };

  if (showSplash) {
    return (
      <div className="fixed inset-0 bg-emerald-950 flex flex-col items-center justify-center p-8 z-[120] text-white text-center">
        <div className="animate-float mb-8">
          <div className="w-24 h-24 bg-emerald-500 rounded-3xl mx-auto mb-4 flex items-center justify-center shadow-2xl">
            <Trophy size={48} />
          </div>
          <h1 className="text-4xl font-black tracking-tighter mb-2 italic uppercase">EIA-ECOPOKER</h1>
          <p className="text-emerald-400 font-bold uppercase text-[10px] tracking-[0.2em]">Sustainable Strategy Pro</p>
        </div>
        <button onClick={() => { setShowSplash(false); audioService.playClick(); }} className="bg-white text-emerald-900 font-black px-16 py-5 rounded-full shadow-2xl active:scale-90 transition-all uppercase tracking-widest">INICIAR MISSÃO</button>
      </div>
    );
  }

  if (gameState.isGameOver) {
    const sortedFinalPlayers = [...gameState.players].sort((a, b) => b.score - a.score);
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col p-6 text-white overflow-y-auto no-scrollbar">
        <div className="text-center mb-8 animate-pop-in">
          <Award size={64} className="text-amber-400 mx-auto mb-4" />
          <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none">Relatório Final</h2>
          <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Classificação Global de Impacto</p>
        </div>
        <div className="space-y-4 mb-10">
          {sortedFinalPlayers.map((p, i) => (
            <div key={p.id} className={`relative p-6 rounded-[35px] border transition-all animate-pop-in ${i === 0 ? 'bg-emerald-900/40 border-amber-500/50 scale-105 shadow-2xl' : 'bg-zinc-900 border-zinc-800'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center rounded-xl font-black ${i === 0 ? 'bg-amber-400 text-amber-950' : 'bg-zinc-800 text-zinc-500'}`}>{i + 1}</div>
                  <span className="font-black text-lg uppercase">{p.name}</span>
                </div>
                <span className={`font-black text-2xl ${i === 0 ? 'text-emerald-400' : 'text-zinc-400'}`}>{p.score}</span>
              </div>
            </div>
          ))}
        </div>
        <button onClick={resetGame} className="mt-auto w-full bg-emerald-600 text-white font-black py-7 rounded-[35px] shadow-2xl uppercase tracking-widest transition-all">Novo Ciclo Energético</button>
      </div>
    );
  }

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
                <button onClick={() => { if(newPlayerName.trim()) { setGameState(prev => ({ ...prev, players: [...prev.players, { id: crypto.randomUUID(), name: newPlayerName.trim(), score: 0 }] })); setNewPlayerName(''); audioService.playClick(); } }} className="bg-emerald-600 text-white p-4 rounded-3xl"><Plus /></button>
              </div>
              <div className="space-y-2">
                {gameState.players.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-800 p-4 rounded-2xl animate-pop-in">
                    <span className="font-black text-sm uppercase tracking-tighter">{p.name}</span>
                    <button onClick={() => setGameState(prev => ({ ...prev, players: prev.players.filter(pl => pl.id !== p.id) }))} className="text-zinc-300 hover:text-red-500"><X size={18} /></button>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => { if(gameState.players.length > 0) setSetupMode(false); }} disabled={gameState.players.length === 0} className="w-full bg-emerald-600 text-white font-black py-6 rounded-[35px] shadow-2xl disabled:opacity-50 uppercase tracking-widest">INICIAR PARTIDA</button>
          </div>
        ) : (
          <div className="space-y-4">
            <QuickRanking players={gameState.players} activeIdx={gameState.activePlayerIndex} isOpen={isRankingOpen} onClose={() => setIsRankingOpen(false)} />
            <div className="flex items-center justify-between px-2">
              <div className="flex items-center gap-3">
                <button onClick={() => { setIsRankingOpen(true); audioService.playClick(); }} className="p-3 bg-white dark:bg-zinc-900 rounded-2xl shadow-md text-emerald-600"><LayoutDashboard size={20} /></button>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Ronda {gameState.currentRound}/{gameState.totalRounds}</span>
                  <span className="text-2xl font-black tracking-tighter italic uppercase truncate max-w-[120px] leading-none">{gameState.players[gameState.activePlayerIndex].name}</span>
                </div>
              </div>
              <div className="bg-zinc-100 dark:bg-zinc-900 px-5 py-3 rounded-[20px] flex items-center gap-3 border border-white dark:border-zinc-800">
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
              <button onClick={endTurn} disabled={gameState.rollCount === 0 || isRolling} className="bg-emerald-600 text-white font-black py-7 rounded-[35px] shadow-2xl uppercase tracking-widest text-sm transition-all active:scale-95 disabled:opacity-50">CONFIRMAR</button>
            </div>

            <div className="bg-white dark:bg-zinc-900 p-8 rounded-[45px] shadow-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-black text-[10px] uppercase text-zinc-400 tracking-widest">Impacto Estimado</h3>
                  <span className={`text-4xl font-black italic tracking-tighter ${currentHandResult.total < 0 ? 'text-red-500' : 'text-emerald-600'}`}>{currentHandResult.total > 0 ? `+${currentHandResult.total}` : currentHandResult.total}</span>
                </div>
                <button onClick={() => setIsScoreModalOpen(true)} className="p-3 bg-zinc-50 dark:bg-zinc-800 rounded-2xl text-emerald-600 active:scale-90 transition-all"><Info size={24} /></button>
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
          <div className="flex gap-4 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-[25px]">
            <button onClick={() => setRankingSubTab('current')} className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase transition-all ${rankingSubTab === 'current' ? 'bg-white dark:bg-zinc-800 shadow-md text-emerald-600' : 'text-zinc-400'}`}>Campanha</button>
            <button onClick={() => setRankingSubTab('hall')} className={`flex-1 py-3 rounded-[20px] font-black text-xs uppercase transition-all ${rankingSubTab === 'hall' ? 'bg-white dark:bg-zinc-800 shadow-md text-emerald-600' : 'text-zinc-400'}`}>Hall of Fame</button>
          </div>
          <div className="space-y-3">
            {(rankingSubTab === 'current' ? gameState.players : hallOfFame).map((p, i) => (
              <div key={i} className="flex items-center justify-between bg-white dark:bg-zinc-900 p-6 rounded-[35px] shadow-xl border border-zinc-100 dark:border-zinc-800 animate-pop-in">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 rounded-xl font-black text-zinc-400">{i+1}</div>
                   <span className="font-black text-lg uppercase">{p.name}</span>
                </div>
                <span className="font-black text-xl text-emerald-600">{p.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'rules' && (
        <div className="space-y-8 p-2 pb-10">
          <header className="px-2">
             <h2 className="text-3xl font-black italic tracking-tighter uppercase flex items-center gap-3">Manual Eco <Star className="text-amber-500" fill="currentColor" /></h2>
             <p className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">A Hierarquia da Sustentabilidade</p>
          </header>
          
          <div className="space-y-6">
            <section className="bg-white dark:bg-zinc-900 p-6 rounded-[40px] shadow-xl space-y-4">
              <h3 className="font-black text-sm uppercase italic text-emerald-600 tracking-tight border-b border-emerald-100 pb-2">O Poder das Renováveis</h3>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">A combinação de maior valor é o <span className="text-emerald-600 font-black">Clean Power</span>, que ocorre quando os seis dados apresentam exatamente o mesmo símbolo de energia limpa (ex: 6 Solares). Representa um sistema totalmente homogéneo e 100% renovável.</p>
              <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">Logo abaixo surge o <span className="text-emerald-600 font-black">Clean Flush Total</span>: seis dados apenas de energias limpas em qualquer mix (Solar, Eólica, Hidro). É o mix energético totalmente descarbonizado.</p>
            </section>

            <div className="grid gap-4">
               {[
                 { name: "Five Clean!", desc: "Cinco dados iguais de energia limpa. Sistema dominado por uma única fonte verde.", pts: 400 },
                 { name: "Full House Verde!", desc: "Duas trincas distintas de energias limpas (ex: 3 Solar + 3 Hidro). Equilíbrio estável.", pts: 300 },
                 { name: "Straight Energético!", desc: "Pelo menos um Solar, uma Eólica e uma Hidro. Simboliza diversidade e complementaridade.", pts: 200 },
                 { name: "Four Clean!", desc: "Quatro dados iguais de energia limpa. Produção verde predominante.", pts: 100 },
                 { name: "Three Clean!", desc: "Três dados iguais de energia limpa. Transição relevante mas incompleta.", pts: 60 },
                 { name: "Two Pair Verde!", desc: "Dois pares distintos de energias limpas. Transição em curso.", pts: 40 },
                 { name: "One Pair Clean!", desc: "Um par de energia limpa. Modesta mas superior a fósseis.", pts: 20 }
               ].map((c, i) => (
                 <div key={i} className="bg-zinc-50 dark:bg-zinc-800 p-5 rounded-[30px] border border-zinc-100 dark:border-zinc-700 flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                       <span className="font-black text-[12px] uppercase italic text-emerald-700 dark:text-emerald-400 tracking-tighter">{c.name}</span>
                       <span className="bg-emerald-600 text-white text-[9px] px-3 py-1 rounded-full font-black">+{c.pts}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-tight">{c.desc}</p>
                 </div>
               ))}
            </div>

            <section className="bg-red-50 dark:bg-red-950/20 p-6 rounded-[40px] border border-red-100 dark:border-red-900/50 space-y-4">
               <h3 className="font-black text-sm uppercase italic text-red-600 tracking-tight border-b border-red-100 pb-2">Risco Ambiental</h3>
               <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                 <span className="text-red-600 font-black">Mixed Energy Hand:</span> Qualquer mix sem combos limpos. Cada fóssil penaliza (-20 pts).<br/><br/>
                 <span className="text-red-700 font-black">Dirty Energy:</span> Quatro ou mais dados fósseis. Sistema poluente com penalização de -100 pts.<br/><br/>
                 <span className="text-zinc-900 dark:text-white font-black">Blackout:</span> Seis dados exclusivamente fósseis. Dependência total, sem atribuição de pontos.
               </p>
            </section>
          </div>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="space-y-6">
           <h2 className="text-3xl font-black italic tracking-tighter px-2 uppercase">Configuração</h2>
           <div className="bg-white dark:bg-zinc-900 rounded-[45px] p-8 space-y-8 shadow-xl border border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Volume2 size={18} /> Efeitos Sonoros</span>
                <button onClick={() => setSettings(s => ({...s, soundEnabled: !s.soundEnabled}))} className={`w-16 h-10 rounded-full relative transition-all ${settings.soundEnabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.soundEnabled ? 'left-7.5' : 'left-1.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2"><Music size={18} /> Música Ambiente</span>
                <button onClick={() => setSettings(s => ({...s, musicEnabled: !s.musicEnabled}))} className={`w-16 h-10 rounded-full relative transition-all ${settings.musicEnabled ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.musicEnabled ? 'left-7.5' : 'left-1.5'}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-black text-sm uppercase tracking-widest flex items-center gap-2">{settings.darkMode ? <Moon size={18} /> : <SunIcon size={18} />} Modo Noite</span>
                <button onClick={() => setSettings(s => ({...s, darkMode: !s.darkMode}))} className={`w-16 h-10 rounded-full relative transition-all ${settings.darkMode ? 'bg-emerald-500' : 'bg-zinc-300'}`}>
                  <div className={`absolute top-1.5 w-7 h-7 bg-white rounded-full shadow-lg transition-all ${settings.darkMode ? 'left-7.5' : 'left-1.5'}`} />
                </button>
              </div>
           </div>
           <button onClick={resetGame} className="w-full py-6 text-red-500 font-black rounded-[35px] border-4 border-red-500/10 uppercase tracking-widest text-xs hover:bg-red-50 transition-colors">Reiniciar Campanha</button>
        </div>
      )}

      <ScoreModal isOpen={isScoreModalOpen} onClose={() => setIsScoreModalOpen(false)} currentHand={currentHandResult} />
      
      {comboPopup && (
        <div className="fixed inset-x-0 top-1/3 flex justify-center z-[150] pointer-events-none px-4 animate-pop-in">
          <div className="bg-white dark:bg-emerald-600 text-emerald-950 dark:text-white px-10 py-8 rounded-[40px] shadow-2xl border-4 border-emerald-400 flex flex-col items-center">
            <Medal size={48} className="text-amber-500 mb-3 animate-bounce" />
            <h4 className="font-black text-3xl italic tracking-tighter uppercase whitespace-nowrap">{comboPopup}</h4>
            <p className="text-[10px] font-black opacity-50 uppercase tracking-widest mt-2">Ponto de Viragem Energético!</p>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
