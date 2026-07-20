import { useCallback, useEffect, useRef } from "react";
import { Animated } from "react-native";

interface UseMetronomeOptions {
  bpm: number;
  isPlaying: boolean;
}

/**
 * Drives the metronome's visual pulse: a deliberately silent metronome for
 * on-stage use — the flash is for memorizing a tempo and counting in, never
 * an audible click.
 *
 * Returns the `Animated.Value` (1→0 over each beat) that the UI can bind to.
 */
export function useMetronome({ bpm, isPlaying }: UseMetronomeOptions) {
  const flashAnim = useRef(new Animated.Value(0)).current;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopScheduler = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const triggerBeat = useCallback(() => {
    const flashDuration = 60_000 / bpm;
    flashAnim.setValue(1);
    Animated.timing(flashAnim, {
      toValue: 0,
      duration: flashDuration,
      useNativeDriver: true,
    }).start();
  }, [flashAnim, bpm]);

  useEffect(() => {
    stopScheduler();

    if (!isPlaying) {
      return;
    }

    // Fire the first beat immediately, then repeat on an interval.
    triggerBeat();
    const intervalMs = Math.round(60_000 / bpm);
    intervalRef.current = setInterval(triggerBeat, intervalMs);

    return () => {
      stopScheduler();
      flashAnim.stopAnimation();
      flashAnim.setValue(0);
    };
  }, [bpm, isPlaying, triggerBeat, stopScheduler, flashAnim]);

  return { flashAnim };
}
