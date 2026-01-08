/**
 * CONFIGURAÇÃO DE ÁUDIO PROFISSIONAL - EIA-ECOPOKER
 */
export const SOUND_SOURCES = {
  BACKGROUND_MUSIC: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/d1ea714600870d663d1dba4a944459083bd3fd29/MUSICA/MUSICA_APP_EIA-ECOPOKER.mp3',

  // Sons de dados
  ROLL: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/873f49e210de04ce99b9748c6f562cf63d8cb06b/SOM/dice-95077.mp3',
  SHAKE: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/873f49e210de04ce99b9748c6f562cf63d8cb06b/SOM/diceshake-90280.mp3',
  
  HOLD: '',
  SUCCESS: '',
  CLICK: '',
  
  // Sons de Combos (Atualizados com links diretos)
  COMBO_CLEAN_POWER: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/c63f8a8a831b420a9b1f7e8c22833285f6e11eb4/SOM/material-load-booster-394510.mp3',
  COMBO_CLEAN_FLUSH: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/06402a2376785c92c416334b3ab47d4030edea9c/SOM/material-buy-success-394517.mp3',
  COMBO_FIVE_CLEAN: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/06402a2376785c92c416334b3ab47d4030edea9c/SOM/material-butterfly-energy-394513.mp3',
  COMBO_FULL_HOUSE_VERDE: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/06402a2376785c92c416334b3ab47d4030edea9c/SOM/funny-lighthearted-springy-boing-effect-20-416269.mp3',
  COMBO_STRAIGHT_ENERGETICO: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/06402a2376785c92c416334b3ab47d4030edea9c/SOM/funny-lighthearted-springy-boing-effect-17-416253.mp3',
  COMBO_FOUR_CLEAN: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/06402a2376785c92c416334b3ab47d4030edea9c/SOM/funny-lighthearted-springy-boing-effect-01-416262.mp3',
  COMBO_THREE_CLEAN: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/06402a2376785c92c416334b3ab47d4030edea9c/SOM/clear-combo-1-394489.mp3',
  COMBO_TWO_PAIR_VERDE: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/d403541761df679e4f2efcaa5fd4fe507c8c1d62/SOM/clear-combo-7-394494.mp3',
  COMBO_ONE_PAIR_CLEAN: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/c63f8a8a831b420a9b1f7e8c22833285f6e11eb4/SOM/material-load-booster-394510.mp3',
  COMBO_MIXED_ENERGY: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/06402a2376785c92c416334b3ab47d4030edea9c/SOM/rpg-sword-attack-combo-9-388928.mp3',
  COMBO_DIRTY_ENERGY: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/59e7e721dc9e59edfae9c8e03f7963bdb4b702a4/SOM/funny-lighthearted-springy-boing-effect-02-416259.mp3',
  COMBO_BLACKOUT: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/59e7e721dc9e59edfae9c8e03f7963bdb4b702a4/SOM/funny-lighthearted-springy-boing-effect-16-416266.mp3',
};

class AudioService {
  private enabled: boolean = false;
  private musicEnabled: boolean = false;
  private context: AudioContext | null = null;
  private bgMusic: HTMLAudioElement | null = null;
  private shakeAudio: HTMLAudioElement | null = null;
  private masterGain: GainNode | null = null;
  private currentMusicVolume: number = 0.1; 
  private currentSoundVolume: number = 0.1;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled && !this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.masterGain = this.context.createGain();
      this.masterGain.gain.setValueAtTime(this.currentSoundVolume, this.context.currentTime);
      this.masterGain.connect(this.context.destination);
    }
    this.updateMusic();
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    this.updateMusic();
  }

  setMusicVolume(vol: number) {
    this.currentMusicVolume = vol;
    if (this.bgMusic) {
      this.bgMusic.volume = vol;
    }
  }

  setSoundVolume(vol: number) {
    this.currentSoundVolume = vol;
    if (this.context && this.masterGain) {
      this.masterGain.gain.setTargetAtTime(vol, this.context.currentTime, 0.05);
    }
    if (this.shakeAudio) {
      this.shakeAudio.volume = vol;
    }
  }

  async resumeContext() {
    if (this.context && this.context.state === 'suspended') {
      await this.context.resume();
    }
    this.updateMusic();
  }

  private updateMusic() {
    if (this.musicEnabled && this.enabled && SOUND_SOURCES.BACKGROUND_MUSIC) {
      if (!this.bgMusic) {
        this.bgMusic = new Audio(SOUND_SOURCES.BACKGROUND_MUSIC);
        this.bgMusic.loop = true;
        this.bgMusic.volume = this.currentMusicVolume; 
      }
      this.bgMusic.play().catch(() => console.log("Música aguarda interação"));
    } else if (this.bgMusic) {
      this.bgMusic.pause();
    }
  }

  playShake() {
    if (!this.enabled || !SOUND_SOURCES.SHAKE) return;
    if (!this.shakeAudio) {
      this.shakeAudio = new Audio(SOUND_SOURCES.SHAKE);
      this.shakeAudio.loop = true;
    }
    this.shakeAudio.volume = this.currentSoundVolume;
    this.shakeAudio.play().catch(() => {});
  }

  stopShake() {
    if (this.shakeAudio) {
      this.shakeAudio.pause();
      this.shakeAudio.currentTime = 0;
    }
  }

  playRoll() {
    this.playExternal(SOUND_SOURCES.ROLL, () => {
      for(let i = 0; i < 4; i++) this.createTone(180 + Math.random() * 120, 'square', 0.12, 0.05, i * 0.06);
    });
  }

  private async createTone(freq: number, type: OscillatorType, duration: number, volume: number, delay: number = 0) {
    if (!this.enabled || !this.context || !this.masterGain) return;
    if (this.context.state === 'suspended') await this.context.resume();

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime + delay);
    
    gain.gain.setValueAtTime(0, this.context.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, this.context.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + delay + duration);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(this.context.currentTime + delay);
    osc.stop(this.context.currentTime + delay + duration);
  }

  private playExternal(url: string, fallback: () => void) {
    if (!this.enabled) return;
    if (url && url.length > 5) {
      const audio = new Audio(url);
      audio.volume = this.currentSoundVolume;
      audio.play().catch(fallback);
    } else {
      fallback();
    }
  }

  playHold() {
    this.playExternal(SOUND_SOURCES.HOLD, () => this.createTone(700, 'sine', 0.1, 0.08));
  }

  playSuccess() {
    this.playExternal(SOUND_SOURCES.SUCCESS, () => {
      this.createTone(523, 'sine', 0.4, 0.15);
      this.createTone(659, 'sine', 0.4, 0.12, 0.1);
    });
  }

  playClick() {
    this.playExternal(SOUND_SOURCES.CLICK, () => this.createTone(1000, 'sine', 0.04, 0.05));
  }

  playComboSound(comboName: string) {
    if (!this.enabled) return;
    let url = '';
    switch(comboName) {
      case "CLEAN POWER!": url = SOUND_SOURCES.COMBO_CLEAN_POWER; break;
      case "CLEAN FLUSH TOTAL!": url = SOUND_SOURCES.COMBO_CLEAN_FLUSH; break;
      case "FIVE CLEAN!": url = SOUND_SOURCES.COMBO_FIVE_CLEAN; break;
      case "FULL HOUSE VERDE!": url = SOUND_SOURCES.COMBO_FULL_HOUSE_VERDE; break;
      case "STRAIGHT ENERGÉTICO!": url = SOUND_SOURCES.COMBO_STRAIGHT_ENERGETICO; break;
      case "FOUR CLEAN!": url = SOUND_SOURCES.COMBO_FOUR_CLEAN; break;
      case "THREE CLEAN!": url = SOUND_SOURCES.COMBO_THREE_CLEAN; break;
      case "TWO PAIR VERDE!": url = SOUND_SOURCES.COMBO_TWO_PAIR_VERDE; break;
      case "ONE PAIR CLEAN!": url = SOUND_SOURCES.COMBO_ONE_PAIR_CLEAN; break;
      case "MIXED ENERGY": url = SOUND_SOURCES.COMBO_MIXED_ENERGY; break;
      case "DIRTY ENERGY!": url = SOUND_SOURCES.COMBO_DIRTY_ENERGY; break;
      case "BLACKOUT!": url = SOUND_SOURCES.COMBO_BLACKOUT; break;
    }

    this.playExternal(url, () => {
      if (comboName === "BLACKOUT!" || comboName === "DIRTY ENERGY!") {
        this.createTone(55, 'sawtooth', 0.8, 0.2);
      } else {
        [329, 392, 523, 659, 783].forEach((f, i) => this.createTone(f, 'triangle', 0.7, 0.1, i * 0.08));
      }
    });
  }
}

export const audioService = new AudioService();