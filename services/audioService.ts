
/**
 * CONFIGURAÇÃO DE ÁUDIO PROFISSIONAL - EIA-ECOPOKER
 */
export const SOUND_SOURCES = {
  BACKGROUND_MUSIC: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/e994924df0fe5d121a328a118496c448f321e8ed/MUSICA/EIA-ECOPOKER.mp3',

  ROLL: '',
  HOLD: '',
  SUCCESS: '',
  CLICK: '',
  
  // Link convertido para RAW para funcionamento correto no navegador
  COMBO_CLEAN_POWER: 'https://raw.githubusercontent.com/koelho2000/EIA-ECOPOKER/54a66cde28cc052bb3695f13a232758a0c334df2/SONS/clean_power_combo.wav',
  COMBO_CLEAN_FLUSH: '',
  COMBO_FIVE_CLEAN: '',
  COMBO_FULL_HOUSE_VERDE: '',
  COMBO_STRAIGHT_ENERGETICO: '',
  COMBO_FOUR_CLEAN: '',
  COMBO_THREE_CLEAN: '',
  COMBO_TWO_PAIR_VERDE: '',
  COMBO_ONE_PAIR_CLEAN: '',
  COMBO_MIXED_ENERGY: '',
  COMBO_DIRTY_ENERGY: '',
  COMBO_BLACKOUT: '',
};

class AudioService {
  private enabled: boolean = false;
  private musicEnabled: boolean = false;
  private context: AudioContext | null = null;
  private bgMusic: HTMLAudioElement | null = null;
  private masterGain: GainNode | null = null;
  private currentMusicVolume: number = 0.5;
  private currentSoundVolume: number = 1.0;

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
      // Ajuste suave do volume mestre de efeitos
      this.masterGain.gain.setTargetAtTime(vol, this.context.currentTime, 0.05);
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
      // O volume do áudio individual é multiplicado pelo volume master de sons
      audio.volume = this.currentSoundVolume;
      audio.play().catch(fallback);
    } else {
      fallback();
    }
  }

  playRoll() {
    this.playExternal(SOUND_SOURCES.ROLL, () => {
      for(let i = 0; i < 4; i++) this.createTone(180 + Math.random() * 120, 'square', 0.12, 0.05, i * 0.06);
    });
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
