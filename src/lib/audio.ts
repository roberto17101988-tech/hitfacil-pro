import type { Genre, Mood } from './types';

const genreFreqs: Record<string, number[]> = {
  Pop: [261.63, 329.63, 392.0, 523.25],
  Rap: [130.81, 155.56, 196.0, 233.08],
  Rock: [164.81, 207.65, 246.94, 329.63],
  EDM: [220.0, 277.18, 329.63, 440.0],
  'R&B': [174.61, 220.0, 261.63, 349.23],
  'Hip-hop': [146.83, 174.61, 220.0, 261.63],
};

const moodTempos: Record<string, number> = {
  Happy: 140,
  Romantic: 70,
  Uplifting: 128,
  Chill: 85,
};

export interface AudioController {
  stop: () => void;
  getElapsed: () => number;
  duration: number;
}

export function generateAudio(
  context: AudioContext,
  genre: string,
  mood: string,
  duration = 30,
): AudioController {
  const freqs = genreFreqs[genre] || genreFreqs['Pop'];
  const tempo = moodTempos[mood] || 120;
  const beatInterval = 60 / tempo;
  const startTime = context.currentTime;

  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(0, context.currentTime);
  masterGain.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.1);
  masterGain.gain.linearRampToValueAtTime(0, context.currentTime + duration);
  masterGain.connect(context.destination);

  const oscillators: OscillatorNode[] = [];
  const intervals: number[] = [];
  const timeouts: number[] = [];

  // Bass line
  const bassOsc = context.createOscillator();
  bassOsc.type = 'sine';
  bassOsc.frequency.value = freqs[0] / 2;
  const bassGain = context.createGain();
  bassGain.gain.value = 0.15;
  bassOsc.connect(bassGain);
  bassGain.connect(masterGain);
  bassOsc.start();
  oscillators.push(bassOsc);

  // Melody — cycle through notes
  let noteIndex = 0;
  const melodyOsc = context.createOscillator();
  melodyOsc.type = 'triangle';
  melodyOsc.frequency.value = freqs[0];
  const melodyGain = context.createGain();
  melodyGain.gain.value = 0.08;
  melodyOsc.connect(melodyGain);
  melodyGain.connect(masterGain);
  melodyOsc.start();
  oscillators.push(melodyOsc);

  const melodyInterval = window.setInterval(() => {
    noteIndex = (noteIndex + 1) % freqs.length;
    melodyOsc.frequency.setValueAtTime(freqs[noteIndex], context.currentTime);
  }, beatInterval * 1000 * 2);
  intervals.push(melodyInterval);

  // Harmony pad
  const padOsc = context.createOscillator();
  padOsc.type = 'sawtooth';
  padOsc.frequency.value = freqs[2];
  const padGain = context.createGain();
  padGain.gain.value = 0.04;
  const padFilter = context.createBiquadFilter();
  padFilter.type = 'lowpass';
  padFilter.frequency.value = 800;
  padOsc.connect(padFilter);
  padFilter.connect(padGain);
  padGain.connect(masterGain);
  padOsc.start();
  oscillators.push(padOsc);

  // Hi-hat — noise burst on off-beats
  const hatInterval = window.setInterval(() => {
    const bufferSize = context.sampleRate * 0.05;
    const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.3;
    }
    const noise = context.createBufferSource();
    noise.buffer = buffer;
    const hatFilter = context.createBiquadFilter();
    hatFilter.type = 'highpass';
    hatFilter.frequency.value = 5000;
    const hatGain = context.createGain();
    hatGain.gain.setValueAtTime(0.06, context.currentTime);
    hatGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.05);
    noise.connect(hatFilter);
    hatFilter.connect(hatGain);
    hatGain.connect(masterGain);
    noise.start();
  }, beatInterval * 1000 / 2);
  intervals.push(hatInterval);

  // Beat — kick drum on every beat
  const kickInterval = window.setInterval(() => {
    const kickOsc = context.createOscillator();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(150, context.currentTime);
    kickOsc.frequency.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
    const kickGain = context.createGain();
    kickGain.gain.setValueAtTime(0.25, context.currentTime);
    kickGain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    kickOsc.connect(kickGain);
    kickGain.connect(masterGain);
    kickOsc.start();
    kickOsc.stop(context.currentTime + 0.1);
  }, beatInterval * 1000);
  intervals.push(kickInterval);

  let stopped = false;

  const stop = () => {
    if (stopped) return;
    stopped = true;
    intervals.forEach(clearInterval);
    timeouts.forEach(clearTimeout);
    oscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {
        // already stopped
      }
    });
    try {
      masterGain.disconnect();
    } catch {
      // already disconnected
    }
  };

  // Auto-stop after duration
  const autoStop = window.setTimeout(stop, duration * 1000);
  timeouts.push(autoStop);

  return {
    stop,
    getElapsed: () => {
      if (stopped) return duration;
      return Math.min(context.currentTime - startTime, duration);
    },
    duration,
  };
}
