
# 2026.2.10 Audio Engine Upgrade Plan: "Harmonic Horizon"

## 1. Overview
This plan outlines the integration of advanced audio capabilities (Karplus-Strong Guitar & FM Piano) into the core `realtime-game` engine, enabling generative music and sound effects directly in game code. It also introduces a new `MusicSkeleton` to guide AI agents in composing music.

## 2. Core Audio Engine Upgrade
**Component**: `RetroAudio` (in `core/runtime/std/InjectionSource.ts`)
**Goal**: Transform `RetroAudio` from a simple SFX player to a multi-track synthesizer.

### 2.1 Synth Architecture
-   **Class Rename**: Rename `RetroAudio` to `AudioEngine` (backward compatible alias `RetroAudio` will remain).
-   **New Methods**:
    -   `playNote(note: string, duration: number, instrument: string)`: Play a specific note (e.g., 'C4') with a specific instrument preset ('piano', 'guitar', 'sine', 'square').
    -   `playChord(startNote: string, type: 'major'|'minor', duration: number)`: Play a basic chord.
    -   `setTempo(bpm: number)`: Set the global tempo for scheduling.
    -   `schedule(track: TrackData)`: Schedule a sequence of notes.

### 2.2 Instrument Presets
The engine will support internal presets based on our research:
-   **`piano`**: FM Synthesis (Modulator + Carrier) for bell-like tones.
-   **`guitar`**: Karplus-Strong Algorithm (Noise Burst + Delay Loop) for plucked string sounds.
-   **`retro`**: Basic waveforms (Square, Triangle) with ADSR envelopes.

## 3. Skeleton Integration: "The Composer"
**Component**: `server/skeletons/registry.ts` & Database
**Goal**: Create a specialized context for music-focused games or applications.

### 3.1 New Skeleton: `music_composer`
-   **Description**: A skeleton designed for rhythm games, music visualizers, or procedural composition tools.
-   **Interface Definition**:
    ```typescript
    interface AudioEngine {
        play(sfx: 'jump' | 'coin' | 'explosion'): void;
        playNote(note: string, duration: number, instrument: 'piano'|'guitar'|'lead'): void;
        // ... tempo and scheduling methods
    }
    ```
-   **System Prompt Addon**:
    "You are a music theory expert. When composing, use the `AudioEngine` to schedule notes.
    -   Use `playNote('C4', 0.5, 'piano')` for melody.
    -   Use `playNote('E2', 2.0, 'guitar')` for bass/chords.
    -   Valid instruments: 'piano', 'guitar', 'square', 'sawtooth'.
    -   Notes are standard Strings: 'A4', 'C#3', 'Gb2'."

## 4. Implementation Steps

1.  **Modify `InjectionSource.ts`**:
    -   Copy the `GuitarSynth` and `PianoSynth` logic from the demos into the main `RetroAudio` class.
    -   Add the `NOTE_FREQS` lookup table.
    -   Implement the scheduling logic (using `audioContext.currentTime`).

2.  **Update `StandardLibrary.ts`**:
    -   Ensure the updated `RetroAudio` class is correctly exported and aliased.

3.  **Seed the Database**:
    -   Create a new migration or seed script to insert the `music_composer` skeleton into the `Skeleton` table.

4.  **Verification**:
    -   Create a test script `scripts/verify/test_audio_engine.ts` that mocks `AudioContext` to verify the new methods are callable.
    -   Generate a "Music Sandbox" game using the new skeleton to verify AI usage.

## 5. Potential Challenges
-   **Browser Autoplay Policy**: The AI-generated code usually runs on user interaction (Game Start), so `AudioContext` resume shouldn't be an issue, but we must ensure `resume()` is called in the `init()` or `start()` methods.
-   **Performance**: Multiple oscillators/nodes can be CPU intensive. We will implement node cleanup (disconnecting) aggressively after notes finish.
