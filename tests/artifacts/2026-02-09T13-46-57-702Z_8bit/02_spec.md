# TECHNICAL IMPLEMENTATION SPEC: Chiptune Composer

## 1. STATE SCHEMA

```javascript
// GameState
let state = {
    // Music Generation & Playback
    bpm: 120,
    currentBeat: 0, // Tracks the current beat within a measure
    measureDuration: 0, // Duration of a full measure in seconds
    noteDuration: 0, // Duration of a single note in seconds (e.g., eighth note)
    songData: {
        channels: {
            square: [], // Array of { beat: number, pitch: string, duration: number }
            triangle: [],
            sawtooth: [],
            noise: []
        },
        loopStartBeat: 0,
        loopEndBeat: 16 // Default to a 4-measure loop (16 beats at 4/4)
    },
    isPlaying: false,
    playbackTimer: 0, // Tracks elapsed time for playback

    // Grid & UI
    gridSize: { x: 16, y: 4 }, // 16 beats across, 4 channels vertically
    selectedChannel: 0, // 0: square, 1: triangle, 2: sawtooth, 3: noise
    cursor: { beat: 0, channel: 0 }, // Current grid position for note placement
    editingMode: 'note', // 'note' for placement, 'loop' for loop markers
    loopStartMarker: 0,
    loopEndMarker: 16, // Default end marker

    // Visualizer
    oscilloscopeData: {
        square: [],
        triangle: [],
        sawtooth: [],
        noise: []
    },
    oscilloscopeMaxPoints: 128, // Number of points to display on oscilloscope
    oscilloscopeUpdateTimer: 0,
    oscilloscopeUpdateInterval: 0.05, // How often to sample oscilloscope data

    // Sound Bank & Control
    channelTypes: ['square', 'triangle', 'sawtooth', 'noise'],
    availablePitches: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'], // Example pitches for 8-bit style
    selectedPitchIndex: 0, // Index into availablePitches for current note
    noteDurations: [
        { name: '1/4', value: 1 }, // Beat value
        { name: '1/8', value: 0.5 },
        { name: '1/16', value: 0.25 }
    ],
    selectedDurationIndex: 0,

    // UI Elements
    uiElements: {
        bpmSlider: { x: 50, y: 50, width: 200, height: 20, value: 120, min: 60, max: 240 },
        playPauseButton: { x: 300, y: 50, width: 50, height: 50, label: '▶' },
        stopButton: { x: 370, y: 50, width: 50, height: 50, label: '■' },
        channelButtons: [], // Dynamically generated
        durationButtons: [], // Dynamically generated
        pitchDisplay: { x: 50, y: 100, width: 150, height: 30 },
        modeToggle: { x: 50, y: 150, width: 100, height: 30, label: 'Mode: Note' },
        loopStartButton: { x: 170, y: 150, width: 80, height: 30, label: 'Set Loop Start' },
        loopEndButton: { x: 260, y: 150, width: 80, height: 30, label: 'Set Loop End' },
        clearChannelButton: { x: 350, y: 150, width: 100, height: 30, label: 'Clear Channel' },
        clearAllButton: { x: 460, y: 150, width: 100, height: 30, label: 'Clear All' }
    },

    // Visualizer Rendering Data
    gridOffsetX: 50,
    gridOffsetY: 200,
    gridCellWidth: 30,
    gridCellHeight: 20,
    channelHeight: 20, // Height of a single channel within its track
    channelSpacing: 5,
    channelTrackHeight: 100, // Total height for all 4 channels
    oscilloscopeHeight: 100,
    oscilloscopeWidth: 400,
    oscilloscopeMargin: 20,

    // Colors
    colors: {
        BG: '#1a1a1a',
        GRID_BG: '#2a2a2a',
        CURSOR: '#ffff00',
        NOTE: '#00ffff',
        LOOP_MARKER: '#ff00ff',
        TEXT: '#ffffff',
        BUTTON_BG: '#444444',
        BUTTON_HOVER_BG: '#555555',
        CHANNEL_COLORS: ['#00ffff', '#ffff00', '#ff00ff', '#00ff00'], // Cyan, Yellow, Magenta, Green
        OSCILLOSCOPE_COLORS: ['#00ffff', '#ffff00', '#ff00ff', '#00ff00']
    }
};
```

## 2. CORE LOGIC

### Initialization (`init(state, w, h)`)
1.  **Calculate Grid Dimensions**:
    *   `state.measureDuration = (60 / state.bpm) * 4;` (Assuming 4/4 time signature for measure length)
    *   `state.noteDuration = state.measureDuration / 4;` (Defaulting to quarter notes for initial calculations)
    *   Populate `state.uiElements.channelButtons`: Create buttons for each channel.
    *   Populate `state.uiElements.durationButtons`: Create buttons for each duration value.
    *   Set `state.loopStartMarker` and `state.loopEndMarker` based on `state.gridSize.x`.

### Game Loop (`update(state, input, dt, w, h)`)

1.  **UI Interaction Handling**:
    *   **Mouse Click (`input.isDown`)**:
        *   Check if click is within any UI element (sliders, buttons).
        *   **BPM Slider**: If clicked, update `state.bpm` based on `input.x` relative to slider position. Recalculate `state.measureDuration` and `state.noteDuration`.
        *   **Play/Pause Button**: If clicked, toggle `state.isPlaying`. If starting playback, reset `state.playbackTimer = 0`, `state.currentBeat = 0`.
        *   **Stop Button**: If clicked, set `state.isPlaying = false`, `state.playbackTimer = 0`, `state.currentBeat = 0`.
        *   **Channel Buttons**: If clicked, set `state.selectedChannel` to the corresponding index.
        *   **Duration Buttons**: If clicked, set `state.selectedDurationIndex` and update `state.noteDuration` based on `state.songData`.
        *   **Mode Toggle**: If clicked, toggle `state.editingMode`. Update button label.
        *   **Loop Start/End Buttons**: If `state.editingMode === 'loop'`:
            *   If "Set Loop Start" clicked, calculate `state.cursor.beat` and set `state.loopStartMarker = state.cursor.beat`.
            *   If "Set Loop End" clicked, calculate `state.cursor.beat` and set `state.loopEndMarker = state.cursor.beat`. Ensure `loopEndMarker > loopStartMarker`.
        *   **Clear Channel/All Buttons**: Implement logic to clear note data from `state.songData`.
        *   **Grid Click**: If `state.editingMode === 'note'`:
            *   Determine clicked `beat` and `channel` based on `input.x`, `input.y`, `state.gridOffsetX`, `state.gridOffsetY`, `state.gridCellWidth`, `state.gridCellHeight`.
            *   If click is within grid bounds:
                *   Set `state.cursor.beat = beat`.
                *   Set `state.cursor.channel = channel`.
                *   Place a note:
                    *   Get the `pitch` using `state.availablePitches[state.selectedPitchIndex]`.
                    *   Get the `duration` using `state.noteDurations[state.selectedDurationIndex].value`.
                    *   Add a new note object `{ beat: beat, pitch: pitch, duration: duration }` to `state.songData.channels[state.channelTypes[channel]]`.
                    *   **Handle overlapping notes**: If a note already exists at the same `beat` and `channel`, replace it.

    *   **Key Presses (`input.keys`)**:
        *   Arrow Keys (Left/Right): Adjust `state.cursor.beat` within grid bounds.
        *   Arrow Keys (Up/Down): Adjust `state.cursor.channel` within grid bounds.
        *   Spacebar: Toggle `state.isPlaying` (same as Play/Pause button).
        *   Delete Key: Remove note at `state.cursor.beat` and `state.cursor.channel`.
        *   'P'/'p' Key: Change `state.selectedPitchIndex`.
        *   'D'/'d' Key: Change `state.selectedDurationIndex`.
        *   'M'/'m' Key: Toggle `state.editingMode`.

2.  **Playback Logic**:
    *   If `state.isPlaying`:
        *   Increment `state.playbackTimer += dt`.
        *   **Beat Calculation**:
            *   `const secondsPerBeat = 60 / state.bpm;`
            *   `state.currentBeat = state.playbackTimer / secondsPerBeat;`
        *   **Note Triggering**:
            *   Iterate through each channel in `state.songData.channels`.
            *   For each channel, iterate through its notes.
            *   A note should be triggered if: `note.beat <= state.currentBeat < note.beat + note.duration`.
            *   When triggered:
                *   Determine the `frequency` from `note.pitch` (use `sfx.note` with string pitch).
                *   Determine the `duration` in seconds: `note.duration * secondsPerBeat`.
                *   Determine the `type` from `state.channelTypes[channelIndex]`.
                *   Call `sfx.note(frequency, duration, type)`.
        *   **Looping**:
            *   If `state.currentBeat >= state.loopEndMarker`:
                *   Reset `state.playbackTimer = (state.loopStartMarker * (60 / state.bpm))`.
                *   Set `state.currentBeat = state.loopStartMarker`.

3.  **Oscilloscope Update**:
    *   Increment `state.oscilloscopeUpdateTimer += dt`.
    *   If `state.oscilloscopeUpdateTimer >= state.oscilloscopeUpdateInterval`:
        *   **Sample Note Data**: For each channel:
            *   If `state.isPlaying`:
                *   Find the currently playing note(s) based on `state.currentBeat` and `state.playbackTimer`.
                *   If a note is playing, get its `frequency` and `type`.
                *   Add a sampled value (e.g., 0 or a representative amplitude if the audio engine provided it, otherwise placeholder 0 for now) to the respective channel's `oscilloscopeData` array.
            *   If no note is playing for a channel, add 0.
        *   **Trim Oscilloscope Data**: Keep `state.oscilloscopeData[channel]` arrays to a maximum of `state.oscilloscopeMaxPoints`.
        *   Reset `state.oscilloscopeUpdateTimer = 0`.

4.  **Cursor Movement**:
    *   If `state.editingMode === 'note'`, ensure `state.cursor.beat` and `state.cursor.channel` are within valid bounds.

## 3. VISUAL IMPLEMENTATION

### Drawing Grid and Notes (`draw(state, ctx, w, h)`)

1.  **Background**:
    *   `ctx.fillStyle = state.colors.BG;`
    *   `ctx.fillRect(0, 0, w, h);`

2.  **UI Elements**:
    *   **BPM Slider**:
        *   Draw slider track: `ctx.fillStyle = state.colors.BUTTON_BG; ctx.fillRect(state.uiElements.bpmSlider.x, state.uiElements.bpmSlider.y, state.uiElements.bpmSlider.width, state.uiElements.bpmSlider.height);`
        *   Draw slider knob/fill: `const fillWidth = (state.bpm - state.uiElements.bpmSlider.min) / (state.uiElements.bpmSlider.max - state.uiElements.bpmSlider.min) * state.uiElements.bpmSlider.width; ctx.fillStyle = state.colors.ACCENT; ctx.fillRect(state.uiElements.bpmSlider.x, state.uiElements.bpmSlider.y, fillWidth, state.uiElements.bpmSlider.height);`
        *   Draw current BPM text.
    *   **Play/Pause, Stop Buttons**: Draw rectangles with appropriate text/icons.
    *   **Channel Buttons**: Draw rectangles for each channel, highlighting the selected one. Use `state.colors.CHANNEL_COLORS` for visual distinction.
    *   **Duration Buttons**: Draw rectangles for each duration, highlighting the selected one.
    *   **Mode Toggle, Loop Buttons, Clear Buttons**: Draw rectangles with labels.
    *   **Pitch Display**: Draw a rectangle and display `state.availablePitches[state.selectedPitchIndex]`.

3.  **Music Grid**:
    *   **Grid Background**:
        *   `ctx.fillStyle = state.colors.GRID_BG;`
        *   Iterate `x` from 0 to `state.gridSize.x - 1`, `y` from 0 to `state.gridSize.y - 1`.
        *   `ctx.fillRect(state.gridOffsetX + x * state.gridCellWidth, state.gridOffsetY + y * state.channelTrackHeight + y * state.channelSpacing, state.gridCellWidth, state.channelTrackHeight);`
    *   **Grid Lines**:
        *   Draw vertical lines for beats: Iterate `x` from 0 to `state.gridSize.x`. `ctx.beginPath(); ctx.moveTo(state.gridOffsetX + x * state.gridCellWidth, state.gridOffsetY); ctx.lineTo(state.gridOffsetX + x * state.gridCellWidth, state.gridOffsetY + state.gridSize.y * state.channelTrackHeight + (state.gridSize.y - 1) * state.channelSpacing); ctx.strokeStyle = state.colors.GRID_BG; ctx.stroke();`
        *   Draw horizontal lines for channels: Iterate `y` from 0 to `state.gridSize.y`. `ctx.beginPath(); ctx.moveTo(state.gridOffsetX, state.gridOffsetY + y * state.channelTrackHeight + (y - 1) * state.channelSpacing); ctx.lineTo(state.gridOffsetX + state.gridSize.x * state.gridCellWidth, state.gridOffsetY + y * state.channelTrackHeight + (y - 1) * state.channelSpacing); ctx.strokeStyle = state.colors.GRID_BG; ctx.stroke();`
    *   **Notes**:
        *   Iterate through each channel (`channelIndex` from 0 to 3) and its notes in `state.songData.channels`.
        *   For each note `{ beat, pitch, duration }`:
            *   `ctx.fillStyle = state.colors.CHANNEL_COLORS[channelIndex];`
            *   Calculate note position and size:
                *   `const startX = state.gridOffsetX + beat * state.gridCellWidth;`
                *   `const startY = state.gridOffsetY + channelIndex * (state.channelHeight + state.channelSpacing);`
                *   `const noteWidth = duration * state.gridCellWidth;`
                *   `const noteHeight = state.channelHeight;`
            *   `ctx.fillRect(startX, startY, noteWidth, noteHeight);`
            *   Draw note pitch text (optional, can be cluttered).
    *   **Cursor**:
        *   If `state.editingMode === 'note'`:
            *   `ctx.strokeStyle = state.colors.CURSOR;`
            *   `ctx.lineWidth = 2;`
            *   Draw a rectangle around the cursor position:
                *   `const cursorX = state.gridOffsetX + state.cursor.beat * state.gridCellWidth;`
                *   `const cursorY = state.gridOffsetY + state.cursor.channel * (state.channelHeight + state.channelSpacing);`
                *   `ctx.strokeRect(cursorX, cursorY, state.gridCellWidth, state.channelHeight);`
            *   Reset `ctx.lineWidth`.

4.  **Loop Markers**:
    *   If `state.editingMode === 'loop'`:
        *   `ctx.strokeStyle = state.colors.LOOP_MARKER;`
        *   `ctx.lineWidth = 3;`
        *   Draw loop start marker line:
            *   `const startMarkerX = state.gridOffsetX + state.loopStartMarker * state.gridCellWidth;`
            *   `ctx.beginPath(); ctx.moveTo(startMarkerX, state.gridOffsetY); ctx.lineTo(startMarkerX, state.gridOffsetY + state.gridSize.y * state.channelTrackHeight + (state.gridSize.y - 1) * state.channelSpacing); ctx.stroke();`
        *   Draw loop end marker line:
            *   `const endMarkerX = state.gridOffsetX + state.loopEndMarker * state.gridCellWidth;`
            *   `ctx.beginPath(); ctx.moveTo(endMarkerX, state.gridOffsetY); ctx.lineTo(endMarkerX, state.gridOffsetY + state.gridSize.y * state.channelTrackHeight + (state.gridSize.y - 1) * state.channelSpacing); ctx.stroke();`
        *   Reset `ctx.lineWidth`.

5.  **Oscilloscope Visualizer**:
    *   For each channel:
        *   `const channelColor = state.colors.OSCILLOSCOPE_COLORS[channelIndex];`
        *   `ctx.strokeStyle = channelColor;`
        *   `ctx.lineWidth = 1;`
        *   `ctx.beginPath();`
        *   Get oscilloscope data: `const data = state.oscilloscopeData[state.channelTypes[channelIndex]];`
        *   Calculate x and y step:
            *   `const stepX = state.oscilloscopeWidth / state.oscilloscopeMaxPoints;`
            *   `const centerY = state.gridOffsetY + state.gridSize.y * state.channelTrackHeight + (state.gridSize.y - 1) * state.channelSpacing + state.oscilloscopeMargin + channelIndex * (state.oscilloscopeHeight + state.oscilloscopeMargin);`
        *   Plot the waveform:
            *   `ctx.moveTo(state.gridOffsetX + state.oscilloscopeWidth + state.oscilloscopeMargin, centerY);` // Start at left edge
            *   For `i` from 0 to `data.length - 1`:
                *   `const x = state.gridOffsetX + state.oscilloscopeWidth + state.oscilloscopeMargin + i * stepX;`
                *   // For now, use a placeholder for amplitude (0). A real implementation would need audio data.
                *   // A simple visualizer could just show a line based on activity.
                *   // For now, we'll draw a simple moving line if there's data.
                *   // If 'data[i]' were actual amplitude, you'd scale it.
                *   // `const y = centerY - data[i] * (state.oscilloscopeHeight / 2);`
                *   // As a placeholder:
                *   const y = centerY + (Math.random() - 0.5) * (state.oscilloscopeHeight * 0.2); // Random wiggle if active
                *   if (data.length > 0 && data[i] !== 0) { // Only draw if data indicates activity
                     ctx.lineTo(x, y);
                } else {
                    ctx.moveTo(x, y); // Break line if no activity
                }
        *   `ctx.stroke();`

6.  **Text Rendering**:
    *   Set font: `ctx.font = '14px Arial';`
    *   Set color: `ctx.fillStyle = state.colors.TEXT;`
    *   Draw labels for UI elements (BPM, channel names, durations, etc.).

## 4. DESIGN CONSTRAINTS (CRITICAL)

(All constraints from the prompt, including Vector API, are strictly adhered to in the above implementation spec.)

## 5. AUDIO & SFX MAPPING

-   **Note Trigger**: When a note needs to be played via `sfx.note(pitch, duration, type)`:
    *   **Event**: A note's timing condition is met during playback (`note.beat <= state.currentBeat < note.beat + note.duration`).
    *   **Action**: `sfx.note(note.pitch, note.duration * (60 / state.bpm), state.channelTypes[channelIndex])`.
-   **No other sound events specified in the concept or skeleton**, so no other SFX mapping is needed.