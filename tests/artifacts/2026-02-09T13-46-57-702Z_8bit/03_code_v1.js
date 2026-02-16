const init = (state, w, h) => {
    // Initialize state with defaults
    state.bpm = 120;
    state.currentBeat = 0;
    state.measureDuration = (60 / 120) * 4;
    state.noteDuration = state.measureDuration / 4;
    state.isPlaying = false;
    state.playbackTimer = 0;

    // Grid & UI
    state.gridSize = { x: 16, y: 4 };
    state.selectedChannel = 0;
    state.cursor = { beat: 0, channel: 0 };
    state.editingMode = 'note';
    state.loopStartMarker = 0;
    state.loopEndMarker = 16;

    // Visualizer
    state.oscilloscopeData = {
        square: [],
        triangle: [],
        sawtooth: [],
        noise: []
    };
    state.oscilloscopeMaxPoints = 128;
    state.oscilloscopeUpdateTimer = 0;
    state.oscilloscopeUpdateInterval = 0.05;

    // Sound Bank
    state.channelTypes = ['square', 'triangle', 'sawtooth', 'noise'];
    state.availablePitches = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5', 'C6'];
    state.selectedPitchIndex = 0;
    state.noteDurations = [
        { name: '1/4', value: 1 },
        { name: '1/8', value: 0.5 },
        { name: '1/16', value: 0.25 }
    ];
    state.selectedDurationIndex = 0;

    // Song data
    state.songData = {
        channels: {
            square: [],
            triangle: [],
            sawtooth: [],
            noise: []
        },
        loopStartBeat: 0,
        loopEndBeat: 16
    };

    // Calculate UI dimensions
    state.gridOffsetX = 50;
    state.gridOffsetY = 200;
    state.gridCellWidth = 30;
    state.gridCellHeight = 20;
    state.channelHeight = 20;
    state.channelSpacing = 5;
    state.channelTrackHeight = 100;
    state.oscilloscopeHeight = 50;
    state.oscilloscopeWidth = 400;
    state.oscilloscopeMargin = 20;

    // Colors (overriding global COLORS with 8-bit palette)
    state.colors = {
        BG: '#1a1a1a',
        GRID_BG: '#2a2a2a',
        CURSOR: '#ffff00',
        NOTE: '#00ffff',
        LOOP_MARKER: '#ff00ff',
        TEXT: '#ffffff',
        BUTTON_BG: '#444444',
        BUTTON_HOVER_BG: '#555555',
        CHANNEL_COLORS: ['#00ffff', '#ffff00', '#ff00ff', '#00ff00'],
        OSCILLOSCOPE_COLORS: ['#00ffff', '#ffff00', '#ff00ff', '#00ff00']
    };

    // UI Elements
    state.uiElements = {
        bpmSlider: { x: 50, y: 50, width: 200, height: 20, min: 60, max: 240 },
        playPauseButton: { x: 300, y: 50, width: 50, height: 30, label: '▶' },
        stopButton: { x: 370, y: 50, width: 50, height: 30, label: '■' },
        channelButtons: [],
        durationButtons: [],
        pitchDisplay: { x: 50, y: 100, width: 150, height: 30 },
        modeToggle: { x: 50, y: 150, width: 100, height: 30, label: 'Mode: Note' },
        loopStartButton: { x: 170, y: 150, width: 100, height: 30, label: 'Set Loop Start' },
        loopEndButton: { x: 280, y: 150, width: 100, height: 30, label: 'Set Loop End' },
        clearChannelButton: { x: 390, y: 150, width: 100, height: 30, label: 'Clear Channel' },
        clearAllButton: { x: 500, y: 150, width: 100, height: 30, label: 'Clear All' }
    };

    // Initialize channel buttons
    for (let i = 0; i < 4; i++) {
        state.uiElements.channelButtons.push({
            x: 450 + i * 60,
            y: 100,
            width: 50,
            height: 30,
            label: state.channelTypes[i],
            channelIndex: i
        });
    }

    // Initialize duration buttons
    for (let i = 0; i < state.noteDurations.length; i++) {
        state.uiElements.durationButtons.push({
            x: 220 + i * 70,
            y: 100,
            width: 60,
            height: 30,
            label: state.noteDurations[i].name,
            durationIndex: i
        });
    }

    // Resize based on window
    resizeUI(state, w, h);
};

const resizeUI = (state, w, h) => {
    // Adjust grid width to fit window
    const availableWidth = w - state.gridOffsetX * 2;
    state.gridCellWidth = Math.max(20, availableWidth / state.gridSize.x);
    
    // Adjust vertical layout
    state.gridOffsetY = Math.min(250, h * 0.4);
    state.channelTrackHeight = Math.min(80, (h - state.gridOffsetY - 100) / 4);
    state.channelHeight = state.channelTrackHeight - state.channelSpacing;
    
    // Adjust oscilloscope
    state.oscilloscopeWidth = availableWidth;
    state.oscilloscopeHeight = Math.min(40, (h - state.gridOffsetY - state.gridSize.y * state.channelTrackHeight) / 5);
};

const update = (state, input, dt, w, h) => {
    // Resize UI if window changed
    if (w !== state.lastWidth || h !== state.lastHeight) {
        resizeUI(state, w, h);
        state.lastWidth = w;
        state.lastHeight = h;
    }

    // Update playback if playing
    if (state.isPlaying) {
        updatePlayback(state, dt);
    }

    // Update oscilloscope
    updateOscilloscope(state, dt);

    // Handle input
    handleInput(state, input, w, h);
};

const updatePlayback = (state, dt) => {
    state.playbackTimer += dt;
    const secondsPerBeat = 60 / state.bpm;
    state.currentBeat = state.playbackTimer / secondsPerBeat;

    // Check for loop
    if (state.currentBeat >= state.loopEndMarker) {
        state.playbackTimer = state.loopStartMarker * secondsPerBeat;
        state.currentBeat = state.loopStartMarker;
    }

    // Trigger notes
    const channelNames = Object.keys(state.songData.channels);
    for (let i = 0; i < channelNames.length; i++) {
        const channel = channelNames[i];
        const notes = state.songData.channels[channel];
        
        for (const note of notes) {
            const noteStart = note.beat;
            const noteEnd = note.beat + note.duration;
            
            // Check if note should trigger this frame
            if (noteStart <= state.currentBeat && state.currentBeat < noteEnd) {
                // Trigger note if not already playing
                if (!note.isPlaying) {
                    const durationSec = note.duration * secondsPerBeat;
                    sfx.note(note.pitch, durationSec, channel);
                    note.isPlaying = true;
                }
            } else {
                note.isPlaying = false;
            }
        }
    }
};

const updateOscilloscope = (state, dt) => {
    state.oscilloscopeUpdateTimer += dt;
    if (state.oscilloscopeUpdateTimer >= state.oscilloscopeUpdateInterval) {
        const channelNames = ['square', 'triangle', 'sawtooth', 'noise'];
        
        for (const channel of channelNames) {
            let data = 0;
            
            // Check if any note is playing in this channel
            const notes = state.songData.channels[channel];
            const isPlaying = notes.some(note => note.isPlaying);
            
            // Generate simple waveform data
            if (isPlaying) {
                // Simple sine-like oscillation for visual effect
                const time = Date.now() / 100;
                data = Math.sin(time) * 0.5 + 0.5;
            }
            
            // Add to oscilloscope data
            state.oscilloscopeData[channel].push(data);
            if (state.oscilloscopeData[channel].length > state.oscilloscopeMaxPoints) {
                state.oscilloscopeData[channel].shift();
            }
        }
        
        state.oscilloscopeUpdateTimer = 0;
    }
};

const handleInput = (state, input, w, h) => {
    // Handle mouse clicks
    if (input.isDown && !state.lastDown) {
        const mouseX = input.x;
        const mouseY = input.y;
        
        // Check UI buttons
        handleButtonClicks(state, mouseX, mouseY);
        
        // Check grid clicks
        handleGridClick(state, mouseX, mouseY);
        
        // Check BPM slider
        const slider = state.uiElements.bpmSlider;
        if (mouseX >= slider.x && mouseX <= slider.x + slider.width &&
            mouseY >= slider.y && mouseY <= slider.y + slider.height) {
            const percent = (mouseX - slider.x) / slider.width;
            state.bpm = Math.floor(slider.min + percent * (slider.max - slider.min));
            state.measureDuration = (60 / state.bpm) * 4;
            state.noteDuration = state.measureDuration / 4;
        }
    }
    
    state.lastDown = input.isDown;
    
    // Handle keyboard
    handleKeyboard(state, input);
};

const handleButtonClicks = (state, mouseX, mouseY) => {
    const ui = state.uiElements;
    
    // Play/Pause button
    if (isPointInRect(mouseX, mouseY, ui.playPauseButton)) {
        state.isPlaying = !state.isPlaying;
        if (state.isPlaying && state.currentBeat >= state.loopEndMarker) {
            state.playbackTimer = state.loopStartMarker * (60 / state.bpm);
            state.currentBeat = state.loopStartMarker;
        }
        return;
    }
    
    // Stop button
    if (isPointInRect(mouseX, mouseY, ui.stopButton)) {
        state.isPlaying = false;
        state.playbackTimer = 0;
        state.currentBeat = 0;
        return;
    }
    
    // Channel buttons
    for (const button of ui.channelButtons) {
        if (isPointInRect(mouseX, mouseY, button)) {
            state.selectedChannel = button.channelIndex;
            return;
        }
    }
    
    // Duration buttons
    for (const button of ui.durationButtons) {
        if (isPointInRect(mouseX, mouseY, button)) {
            state.selectedDurationIndex = button.durationIndex;
            return;
        }
    }
    
    // Mode toggle
    if (isPointInRect(mouseX, mouseY, ui.modeToggle)) {
        state.editingMode = state.editingMode === 'note' ? 'loop' : 'note';
        ui.modeToggle.label = `Mode: ${state.editingMode === 'note' ? 'Note' : 'Loop'}`;
        return;
    }
    
    // Loop start button
    if (isPointInRect(mouseX, mouseY, ui.loopStartButton) && state.editingMode === 'loop') {
        state.loopStartMarker = state.cursor.beat;
        if (state.loopStartMarker >= state.loopEndMarker) {
            state.loopEndMarker = state.loopStartMarker + 1;
        }
        return;
    }
    
    // Loop end button
    if (isPointInRect(mouseX, mouseY, ui.loopEndButton) && state.editingMode === 'loop') {
        state.loopEndMarker = state.cursor.beat;
        if (state.loopEndMarker <= state.loopStartMarker) {
            state.loopStartMarker = state.loopEndMarker - 1;
        }
        return;
    }
    
    // Clear channel button
    if (isPointInRect(mouseX, mouseY, ui.clearChannelButton)) {
        const channel = state.channelTypes[state.selectedChannel];
        state.songData.channels[channel] = [];
        return;
    }
    
    // Clear all button
    if (isPointInRect(mouseX, mouseY, ui.clearAllButton)) {
        for (const channel of state.channelTypes) {
            state.songData.channels[channel] = [];
        }
        return;
    }
};

const handleGridClick = (state, mouseX, mouseY) => {
    const gridX = mouseX - state.gridOffsetX;
    const gridY = mouseY - state.gridOffsetY;
    
    if (gridX < 0 || gridY < 0) return;
    
    const beat = Math.floor(gridX / state.gridCellWidth);
    const channel = Math.floor(gridY / (state.channelTrackHeight + state.channelSpacing));
    
    if (beat >= 0 && beat < state.gridSize.x && 
        channel >= 0 && channel < state.gridSize.y) {
        
        state.cursor.beat = beat;
        state.cursor.channel = channel;
        
        if (state.editingMode === 'note') {
            const channelName = state.channelTypes[channel];
            const pitch = state.availablePitches[state.selectedPitchIndex];
            const duration = state.noteDurations[state.selectedDurationIndex].value;
            
            // Remove existing note at same beat and channel
            state.songData.channels[channelName] = state.songData.channels[channelName].filter(
                n => n.beat !== beat
            );
            
            // Add new note
            state.songData.channels[channelName].push({
                beat: beat,
                pitch: pitch,
                duration: duration,
                isPlaying: false
            });
        }
    }
};

const handleKeyboard = (state, input) => {
    // Arrow keys for cursor
    if (input.keys.ArrowLeft || input.left) {
        state.cursor.beat = Math.max(0, state.cursor.beat - 1);
    }
    if (input.keys.ArrowRight || input.right) {
        state.cursor.beat = Math.min(state.gridSize.x - 1, state.cursor.beat + 1);
    }
    if (input.keys.ArrowUp || input.up) {
        state.cursor.channel = Math.max(0, state.cursor.channel - 1);
    }
    if (input.keys.ArrowDown || input.down) {
        state.cursor.channel = Math.min(state.gridSize.y - 1, state.cursor.channel + 1);
    }
    
    // Space to play/pause
    if (input.keys.Space) {
        state.isPlaying = !state.isPlaying;
    }
    
    // Delete to remove note
    if (input.keys.Delete || input.keys.Backspace) {
        const channelName = state.channelTypes[state.cursor.channel];
        state.songData.channels[channelName] = state.songData.channels[channelName].filter(
            n => n.beat !== state.cursor.beat
        );
    }
    
    // P for pitch selection
    if (input.keys.p || input.keys.P) {
        state.selectedPitchIndex = (state.selectedPitchIndex + 1) % state.availablePitches.length;
    }
    
    // D for duration selection
    if (input.keys.d || input.keys.D) {
        state.selectedDurationIndex = (state.selectedDurationIndex + 1) % state.noteDurations.length;
    }
    
    // M for mode toggle
    if (input.keys.m || input.keys.M) {
        state.editingMode = state.editingMode === 'note' ? 'loop' : 'note';
        state.uiElements.modeToggle.label = `Mode: ${state.editingMode === 'note' ? 'Note' : 'Loop'}`;
    }
};

const draw = (state, ctx, w, h) => {
    // Clear canvas
    ctx.fillStyle = state.colors.BG;
    ctx.fillRect(0, 0, w, h);
    
    // Draw UI elements
    drawUI(state, ctx);
    
    // Draw music grid
    drawGrid(state, ctx);
    
    // Draw notes
    drawNotes(state, ctx);
    
    // Draw cursor
    drawCursor(state, ctx);
    
    // Draw loop markers
    drawLoopMarkers(state, ctx);
    
    // Draw oscilloscope
    drawOscilloscope(state, ctx);
    
    // Draw current beat indicator
    drawBeatIndicator(state, ctx);
};

const drawUI = (state, ctx) => {
    const ui = state.uiElements;
    
    // Draw BPM slider
    ctx.fillStyle = state.colors.BUTTON_BG;
    ctx.fillRect(ui.bpmSlider.x, ui.bpmSlider.y, ui.bpmSlider.width, ui.bpmSlider.height);
    
    const bpmPercent = (state.bpm - ui.bpmSlider.min) / (ui.bpmSlider.max - ui.bpmSlider.min);
    ctx.fillStyle = state.colors.CHANNEL_COLORS[0];
    ctx.fillRect(ui.bpmSlider.x, ui.bpmSlider.y, ui.bpmSlider.width * bpmPercent, ui.bpmSlider.height);
    
    // Draw BPM text
    ctx.fillStyle = state.colors.TEXT;
    ctx.font = '14px monospace';
    ctx.fillText(`BPM: ${state.bpm}`, ui.bpmSlider.x, ui.bpmSlider.y - 5);
    
    // Draw play/pause button
    drawButton(ctx, ui.playPauseButton, state.colors.BUTTON_BG, state.colors.TEXT);
    drawButton(ctx, ui.stopButton, state.colors.BUTTON_BG, state.colors.TEXT);
    
    // Draw channel buttons
    for (let i = 0; i < ui.channelButtons.length; i++) {
        const button = ui.channelButtons[i];
        const isSelected = state.selectedChannel === i;
        drawButton(ctx, button, 
                  isSelected ? state.colors.CHANNEL_COLORS[i] : state.colors.BUTTON_BG,
                  state.colors.TEXT);
    }
    
    // Draw duration buttons
    for (let i = 0; i < ui.durationButtons.length; i++) {
        const button = ui.durationButtons[i];
        const isSelected = state.selectedDurationIndex === i;
        drawButton(ctx, button,
                  isSelected ? state.colors.NOTE : state.colors.BUTTON_BG,
                  state.colors.TEXT);
    }
    
    // Draw other buttons
    drawButton(ctx, ui.modeToggle, state.colors.BUTTON_BG, state.colors.TEXT);
    drawButton(ctx, ui.loopStartButton, state.colors.BUTTON_BG, state.colors.TEXT);
    drawButton(ctx, ui.loopEndButton, state.colors.BUTTON_BG, state.colors.TEXT);
    drawButton(ctx, ui.clearChannelButton, state.colors.BUTTON_BG, state.colors.TEXT);
    drawButton(ctx, ui.clearAllButton, state.colors.BUTTON_BG, state.colors.TEXT);
    
    // Draw pitch display
    ctx.fillStyle = state.colors.BUTTON_BG;
    ctx.fillRect(ui.pitchDisplay.x, ui.pitchDisplay.y, ui.pitchDisplay.width, ui.pitchDisplay.height);
    ctx.fillStyle = state.colors.TEXT;
    ctx.fillText(`Pitch: ${state.availablePitches[state.selectedPitchIndex]}`, 
                 ui.pitchDisplay.x + 10, ui.pitchDisplay.y + 20);
};

const drawButton = (ctx, button, bgColor, textColor) => {
    ctx.fillStyle = bgColor;
    ctx.fillRect(button.x, button.y, button.width, button.height);
    ctx.strokeStyle = state.colors.TEXT;
    ctx.strokeRect(button.x, button.y, button.width, button.height);
    ctx.fillStyle = textColor;
    ctx.font = '12px monospace';
    ctx.fillText(button.label, 
                 button.x + button.width/2 - ctx.measureText(button.label).width/2, 
                 button.y + button.height/2 + 4);
};

const drawGrid = (state, ctx) => {
    const { gridOffsetX, gridOffsetY, gridCellWidth, gridCellHeight, channelTrackHeight, channelSpacing } = state;
    
    // Draw grid background for each cell
    for (let beat = 0; beat < state.gridSize.x; beat++) {
        for (let channel = 0; channel < state.gridSize.y; channel++) {
            const x = gridOffsetX + beat * gridCellWidth;
            const y = gridOffsetY + channel * (channelTrackHeight + channelSpacing);
            
            ctx.fillStyle = (beat % 4 === 0) ? '#333333' : '#2a2a2a';
            ctx.fillRect(x, y, gridCellWidth, channelTrackHeight);
            
            // Draw beat numbers on first row
            if (channel === 0 && beat % 4 === 0) {
                ctx.fillStyle = state.colors.TEXT;
                ctx.font = '10px monospace';
                ctx.fillText(beat.toString(), x + 2, y - 5);
            }
        }
    }
    
    // Draw grid lines
    ctx.strokeStyle = '#444444';
    ctx.lineWidth = 1;
    
    // Vertical lines
    for (let beat = 0; beat <= state.gridSize.x; beat++) {
        const x = gridOffsetX + beat * gridCellWidth;
        ctx.beginPath();
        ctx.moveTo(x, gridOffsetY);
        ctx.lineTo(x, gridOffsetY + state.gridSize.y * (channelTrackHeight + channelSpacing));
        ctx.stroke();
    }
    
    // Horizontal lines
    for (let channel = 0; channel <= state.gridSize.y; channel++) {
        const y = gridOffsetY + channel * (channelTrackHeight + channelSpacing);
        ctx.beginPath();
        ctx.moveTo(gridOffsetX, y);
        ctx.lineTo(gridOffsetX + state.gridSize.x * gridCellWidth, y);
        ctx.stroke();
    }
    
    // Draw channel labels
    ctx.fillStyle = state.colors.TEXT;
    ctx.font = '12px monospace';
    for (let channel = 0; channel < state.gridSize.y; channel++) {
        const y = gridOffsetY + channel * (channelTrackHeight + channelSpacing) + channelTrackHeight/2 + 4;
        ctx.fillText(state.channelTypes[channel], gridOffsetX - 45, y);
    }
};

const drawNotes = (state, ctx) => {
    for (let channelIdx = 0; channelIdx < state.channelTypes.length; channelIdx++) {
        const channelName = state.channelTypes[channelIdx];
        const notes = state.songData.channels[channelName];
        
        ctx.fillStyle = state.colors.CHANNEL_COLORS[channelIdx];
        
        for (const note of notes) {
            const x = state.gridOffsetX + note.beat * state.gridCellWidth;
            const y = state.gridOffsetY + channelIdx * (state.channelTrackHeight + state.channelSpacing);
            const width = note.duration * state.gridCellWidth;
            
            // Draw note rectangle
            ctx.fillRect(x, y, width, state.channelTrackHeight);
            
            // Draw note highlight if playing
            if (note.isPlaying) {
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                ctx.fillRect(x, y, width, state.channelTrackHeight);
                ctx.fillStyle = state.colors.CHANNEL_COLORS[channelIdx];
            }
        }
    }
};

const drawCursor = (state, ctx) => {
    if (state.editingMode !== 'note') return;
    
    const x = state.gridOffsetX + state.cursor.beat * state.gridCellWidth;
    const y = state.gridOffsetY + state.cursor.channel * (state.channelTrackHeight + state.channelSpacing);
    
    ctx.strokeStyle = state.colors.CURSOR;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, state.gridCellWidth, state.channelTrackHeight);
};

const drawLoopMarkers = (state, ctx) => {
    if (state.editingMode !== 'loop') return;
    
    ctx.strokeStyle = state.colors.LOOP_MARKER;
    ctx.lineWidth = 2;
    
    // Draw loop start marker
    const startX = state.gridOffsetX + state.loopStartMarker * state.gridCellWidth;
    ctx.beginPath();
    ctx.moveTo(startX, state.gridOffsetY);
    ctx.lineTo(startX, state.gridOffsetY + state.gridSize.y * (state.channelTrackHeight + state.channelSpacing));
    ctx.stroke();
    
    // Draw loop end marker
    const endX = state.gridOffsetX + state.loopEndMarker * state.gridCellWidth;
    ctx.beginPath();
    ctx.moveTo(endX, state.gridOffsetY);
    ctx.lineTo(endX, state.gridOffsetY + state.gridSize.y * (state.channelTrackHeight + state.channelSpacing));
    ctx.stroke();
    
    // Draw loop area highlight
    ctx.fillStyle = 'rgba(255, 0, 255, 0.1)';
    ctx.fillRect(startX, state.gridOffsetY, 
                 (state.loopEndMarker - state.loopStartMarker) * state.gridCellWidth,
                 state.gridSize.y * (state.channelTrackHeight + state.channelSpacing));
};

const drawOscilloscope = (state, ctx) => {
    const startY = state.gridOffsetY + state.gridSize.y * (state.channelTrackHeight + state.channelSpacing) + 30;
    
    for (let i = 0; i < state.channelTypes.length; i++) {
        const channel = state.channelTypes[i];
        const data = state.oscilloscopeData[channel];
        const color = state.colors.OSCILLOSCOPE_COLORS[i];
        
        const channelY = startY + i * (state.oscilloscopeHeight + 10);
        
        // Draw background
        ctx.fillStyle = '#222222';
        ctx.fillRect(state.gridOffsetX, channelY, state.oscilloscopeWidth, state.oscilloscopeHeight);
        
        // Draw waveform
        if (data.length > 1) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            const stepX = state.oscilloscopeWidth / state.oscilloscopeMaxPoints;
            
            for (let j = 0; j < data.length; j++) {
                const x = state.gridOffsetX + j * stepX;
                const y = channelY + state.oscilloscopeHeight/2 - data[j] * state.oscilloscopeHeight/2;
                
                if (j === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
        }
        
        // Draw channel label
        ctx.fillStyle = color;
        ctx.font = '10px monospace';
        ctx.fillText(channel, state.gridOffsetX + state.oscilloscopeWidth + 10, channelY + state.oscilloscopeHeight/2);
    }
};

const drawBeatIndicator = (state, ctx) => {
    if (!state.isPlaying) return;
    
    const x = state.gridOffsetX + state.currentBeat * state.gridCellWidth;
    const y = state.gridOffsetY;
    const height = state.gridSize.y * (state.channelTrackHeight + state.channelSpacing);
    
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + height);
    ctx.stroke();
};

const isPointInRect = (x, y, rect) => {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
};

return { init, update, draw };