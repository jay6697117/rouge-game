/**
 * SoundManager - Procedural 8-bit style sound effects using Web Audio API
 * No external audio files needed.
 */
export class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private currentMusic: OscillatorNode[] = [];
  private musicInterval: number | null = null;
  private enabled: boolean = true;

  constructor() {
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = 0.3;
      this.masterGain.connect(this.ctx.destination);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.value = 0.15;
      this.musicGain.connect(this.masterGain);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.value = 0.4;
      this.sfxGain.connect(this.masterGain);
    } catch {
      this.enabled = false;
    }
  }

  private ensureContext(): boolean {
    if (!this.enabled || !this.ctx) return false;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return true;
  }

  private playTone(
    freq: number,
    duration: number,
    type: OscillatorType = 'square',
    gainNode?: GainNode,
    volumeEnvelope?: { attack: number; decay: number; sustain: number; release: number }
  ): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const output = gainNode || this.sfxGain!;

    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    osc.connect(env);
    env.connect(output);

    const now = ctx.currentTime;
    if (volumeEnvelope) {
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(1, now + volumeEnvelope.attack);
      env.gain.linearRampToValueAtTime(volumeEnvelope.sustain, now + volumeEnvelope.attack + volumeEnvelope.decay);
      env.gain.linearRampToValueAtTime(0, now + duration);
    } else {
      env.gain.setValueAtTime(0.5, now);
      env.gain.exponentialRampToValueAtTime(0.01, now + duration);
    }

    osc.start(now);
    osc.stop(now + duration);
  }

  private playNoise(duration: number, volume: number = 0.3): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const bufferSize = ctx.sampleRate * duration;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * volume;
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const env = ctx.createGain();
    env.gain.setValueAtTime(volume, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);
    source.connect(env);
    env.connect(this.sfxGain!);
    source.start();
  }

  // --- SFX Methods ---

  playShoot(): void {
    this.playTone(880, 0.08, 'square');
    this.playTone(660, 0.05, 'square');
  }

  playShootSling(): void {
    this.playTone(220, 0.12, 'triangle');
    this.playTone(330, 0.08, 'triangle');
  }

  playShootBlowdart(): void {
    this.playNoise(0.06, 0.15);
    this.playTone(1200, 0.04, 'sine');
  }

  playShootSpear(): void {
    this.playTone(180, 0.15, 'sawtooth');
    this.playNoise(0.05, 0.1);
  }

  playShootSlingshot(): void {
    this.playTone(600, 0.05, 'square');
    this.playTone(900, 0.04, 'square');
  }

  playHit(): void {
    this.playTone(200, 0.1, 'square');
    this.playNoise(0.05, 0.2);
  }

  playEnemyDeath(): void {
    this.playTone(400, 0.08, 'square');
    this.playTone(300, 0.08, 'square');
    this.playTone(200, 0.12, 'square');
    this.playNoise(0.1, 0.15);
  }

  playPlayerHurt(): void {
    this.playTone(150, 0.15, 'sawtooth');
    this.playTone(100, 0.2, 'sawtooth');
  }

  playJump(): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(250, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);
    env.gain.setValueAtTime(0.3, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(env);
    env.connect(this.sfxGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  playDoubleJump(): void {
    if (!this.ensureContext()) return;
    const ctx = this.ctx!;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.08);
    env.gain.setValueAtTime(0.25, ctx.currentTime);
    env.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(env);
    env.connect(this.sfxGain!);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  playRoll(): void {
    this.playNoise(0.15, 0.2);
    this.playTone(120, 0.1, 'triangle');
  }

  playPickupBone(): void {
    this.playTone(800, 0.06, 'sine');
    this.playTone(1000, 0.06, 'sine');
    this.playTone(1200, 0.08, 'sine');
  }

  playPickupTotem(): void {
    this.playTone(600, 0.08, 'sine');
    this.playTone(900, 0.08, 'sine');
    this.playTone(1100, 0.1, 'sine');
    this.playTone(1400, 0.12, 'sine');
  }

  playBlessingSelect(): void {
    this.playTone(500, 0.1, 'sine');
    this.playTone(700, 0.1, 'sine');
    this.playTone(900, 0.15, 'sine');
    this.playTone(1200, 0.2, 'sine');
  }

  playBossAppear(): void {
    this.playTone(100, 0.3, 'sawtooth');
    this.playTone(80, 0.4, 'sawtooth');
    this.playTone(60, 0.5, 'sawtooth');
  }

  playStomp(): void {
    this.playTone(60, 0.2, 'sawtooth');
    this.playNoise(0.15, 0.3);
  }

  playChapterComplete(): void {
    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.2, 'square'), i * 150);
    });
  }

  playGameOver(): void {
    const notes = [400, 350, 300, 200];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.25, 'sawtooth'), i * 200);
    });
  }

  playVictory(): void {
    const notes = [523, 659, 784, 1047, 784, 1047, 1318];
    notes.forEach((freq, i) => {
      setTimeout(() => this.playTone(freq, 0.15, 'square'), i * 120);
    });
  }

  playShieldBlock(): void {
    this.playTone(300, 0.06, 'square');
    this.playTone(500, 0.04, 'triangle');
    this.playNoise(0.03, 0.15);
  }

  playShamanSummon(): void {
    this.playTone(200, 0.2, 'sine');
    this.playTone(300, 0.15, 'sine');
    this.playTone(250, 0.25, 'sine');
  }

  playPoisonHit(): void {
    this.playTone(150, 0.1, 'sine');
    this.playNoise(0.06, 0.1);
  }

  playEnvironmentBoulder(): void {
    this.playTone(80, 0.3, 'sawtooth');
    this.playNoise(0.2, 0.25);
  }

  // --- Music ---

  startMenuMusic(): void {
    this.stopMusic();
    if (!this.ensureContext()) return;

    // Simple arpeggiated melody loop
    const melody = [262, 330, 392, 330, 262, 392, 330, 262]; // C major arp
    let noteIndex = 0;

    this.musicInterval = window.setInterval(() => {
      if (!this.enabled) return;
      const freq = melody[noteIndex % melody.length];
      this.playTone(freq, 0.3, 'triangle', this.musicGain!);
      // Bass note every 2 beats
      if (noteIndex % 2 === 0) {
        this.playTone(freq / 2, 0.5, 'sine', this.musicGain!);
      }
      noteIndex++;
    }, 400);
  }

  startGameMusic(chapter: number): void {
    this.stopMusic();
    if (!this.ensureContext()) return;

    // Different melodies per chapter
    const melodies: number[][] = [
      [196, 220, 262, 294, 262, 220, 196, 165],      // Ch1: G minor (jungle)
      [220, 262, 294, 330, 294, 262, 220, 196],      // Ch2: A minor (wasteland)
      [165, 196, 220, 262, 294, 262, 220, 196],      // Ch3: E minor (volcano)
    ];
    const melody = melodies[(chapter - 1) % 3];
    let noteIndex = 0;
    const tempo = chapter === 3 ? 280 : chapter === 2 ? 320 : 350;

    this.musicInterval = window.setInterval(() => {
      if (!this.enabled) return;
      const freq = melody[noteIndex % melody.length];
      this.playTone(freq, 0.2, 'square', this.musicGain!);
      // Percussion every beat
      if (noteIndex % 2 === 0) {
        this.playTone(freq / 4, 0.15, 'sawtooth', this.musicGain!);
      }
      noteIndex++;
    }, tempo);
  }

  startBossMusic(): void {
    this.stopMusic();
    if (!this.ensureContext()) return;

    const melody = [147, 165, 175, 196, 175, 165, 147, 131]; // D minor aggressive
    let noteIndex = 0;

    this.musicInterval = window.setInterval(() => {
      if (!this.enabled) return;
      const freq = melody[noteIndex % melody.length];
      this.playTone(freq, 0.15, 'sawtooth', this.musicGain!);
      this.playTone(freq * 2, 0.1, 'square', this.musicGain!);
      // Heavy bass
      this.playTone(freq / 2, 0.2, 'sawtooth', this.musicGain!);
      noteIndex++;
    }, 220);
  }

  stopMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.currentMusic.forEach(osc => {
      try { osc.stop(); } catch { /* already stopped */ }
    });
    this.currentMusic = [];
  }

  setMasterVolume(vol: number): void {
    if (this.masterGain) this.masterGain.gain.value = Math.max(0, Math.min(1, vol));
  }

  toggle(): boolean {
    this.enabled = !this.enabled;
    if (!this.enabled) this.stopMusic();
    return this.enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  destroy(): void {
    this.stopMusic();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
