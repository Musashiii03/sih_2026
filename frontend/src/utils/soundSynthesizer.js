// Web Audio API Synthesizer for Atmarakshak Emergency Siren
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays emergency sound alarm based on severity
 * @param {'CRITICAL' | 'WARNING' | 'TEST'} type 
 */
export function playEmergencyAlarm(type = 'CRITICAL') {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const freq = type === 'CRITICAL' ? 1500 : 1000;
    const beeps = type === 'CRITICAL' ? 3 : 2;
    const beepDuration = 0.15;
    const pauseDuration = 0.1;

    for (let i = 0; i < beeps; i++) {
      const startTime = ctx.currentTime + i * (beepDuration + pauseDuration);
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, startTime);
      // Frequency pitch bend down slightly for emergency feel
      osc.frequency.exponentialRampToValueAtTime(freq * 0.85, startTime + beepDuration);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + beepDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + beepDuration);
    }
  } catch (err) {
    console.warn("Audio Context playback error:", err);
  }
}
