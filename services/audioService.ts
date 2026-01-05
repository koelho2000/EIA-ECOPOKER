
/**
 * CONFIGURAÇÃO DE ÁUDIO PROFISSIONAL - EIA-ECOPOKER
 * Substitua as URLs abaixo pelos links dos seus ficheiros (.mp3 ou .wav).
 * O sistema tentará tocar o ficheiro externo; se falhar ou estiver vazio, 
 * usará a síntese de som interna (fallback).
 */
export const SOUND_SOURCES = {
  // Link para a música de fundo (Exemplo: Lofi ambiental)
  BACKGROUND_MUSIC: 'https://cdn.pixabay.com/download/audio/2022/02/22/audio_d171694f41.mp3?filename=lofi-study-112191.mp3',
  
  // Efeitos de Interface
  ROLL: '',
  HOLD: '',
  SUCCESS: '',
  CLICK: '',
  
  // Sons de Combos (Pode colocar um som épico para o Clean Power!)
  COMBO_GENERIC: '',
  COMBO_CLEAN_POWER: '',
  COMBO_CLEAN_FLUSH: '',
  COMBO_BLACKOUT: '',
};

class AudioService {
  private enabled: boolean = false;
  private musicEnabled: boolean = false;
  private context: AudioContext | null = null;
  private bgMusic: HTMLAudioElement | null = null;

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    if (enabled && !this.context) {
      this.context = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    this.updateMusic();
  }

  setMusicEnabled(enabled: boolean) {
    this.musicEnabled = enabled;
    this.updateMusic();
  }

  private updateMusic() {
    if (this.musicEnabled && this.enabled && SOUND_SOURCES.BACKGROUND_MUSIC) {
      if (!this.bgMusic) {
        this.bgMusic = new Audio(SOUND_SOURCES.BACKGROUND_MUSIC);
        this.bgMusic.loop = true;
        this.bgMusic.volume = 0.25;
      }
      this.bgMusic.play().catch(() => console.log("Música aguarda interação do utilizador"));
    } else if (this.bgMusic) {
      this.bgMusic.pause();
    }
  }

  private async createTone(freq: number, type: OscillatorType, duration: number, volume: number, delay: number = 0) {
    if (!this.enabled || !this.context) return;
    if (this.context.state === 'suspended') await this.context.resume();

    const osc = this.context.createOscillator();
    const gain = this.context.createGain();
    const filter = this.context.createBiquadFilter();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.context.currentTime + delay);
    
    gain.gain.setValueAtTime(0, this.context.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, this.context.currentTime + delay + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.context.currentTime + delay + duration);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(freq * 2, this.context.currentTime + delay);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.context.destination);

    osc.start(this.context.currentTime + delay);
    osc.stop(this.context.currentTime + delay + duration);
  }

  private playExternal(url: string, fallback: () => void) {
    if (!this.enabled) return;
    if (url && url.length > 5) {
      const audio = new Audio(url);
      audio.play().catch(fallback);
    } else {
      fallback();
    }
  }

  playRoll() {
    this.playExternal(SOUND_SOURCES.ROLL, () => {
      for(let i = 0; i < 5; i++) this.createTone(150 + Math.random() * 100, 'square', 0.1, 0.02, i * 0.05);
    });
  }

  playHold() {
    this.playExternal(SOUND_SOURCES.HOLD, () => this.createTone(660, 'sine', 0.15, 0.05));
  }

  playSuccess() {
    this.playExternal(SOUND_SOURCES.SUCCESS, () => {
      this.createTone(523.25, 'sine', 0.3, 0.1);
      this.createTone(659.25, 'sine', 0.4, 0.08, 0.1);
    });
  }

  playClick() {
    this.playExternal(SOUND_SOURCES.CLICK, () => this.createTone(1200, 'sine', 0.05, 0.03));
  }

  playComboSound(comboName: string) {
    if (!this.enabled) return;
    let url = SOUND_SOURCES.COMBO_GENERIC;
    if (comboName === "CLEAN POWER!") url = SOUND_SOURCES.COMBO_CLEAN_POWER;
    if (comboName === "BLACKOUT!") url = SOUND_SOURCES.COMBO_BLACKOUT;

    this.playExternal(url, () => {
      if (comboName === "BLACKOUT!") {
        this.createTone(60, 'sawtooth', 0.8, 0.15);
      } else {
        [329.63, 392.00, 523.25, 659.25].forEach((f, i) => 
          this.createTone(f, 'triangle', 0.6, 0.08, i * 0.08)
        );
      }
    });
  }
}

export const audioService = new AudioService();
