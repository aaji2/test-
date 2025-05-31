// Nexus Canvas - Screen Recorder Studio
// Screen recording with audio capture and settings

export class ScreenRecorderStudio {
    constructor(app) {
        this.app = app;
        this.storage = app.getStorage();
        this.utils = app.getUtils();
        
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.stream = null;
        this.isRecording = false;
        this.isPaused = false;
        this.recordingStartTime = 0;
        this.recordingDuration = 0;
        this.recordings = [];
        
        this.settings = {
            source: 'screen',
            systemAudio: true,
            microphoneAudio: false,
            resolution: '1920x1080',
            framerate: 30,
            format: 'webm'
        };
    }

    async init() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.loadSettings();
            await this.loadRecordings();
            
            console.log('Screen Recorder Studio initialized');
        } catch (error) {
            console.error('Failed to initialize Screen Recorder Studio:', error);
            throw error;
        }
    }

    setupElements() {
        this.previewVideo = document.getElementById('screen-preview');
        this.recordingTimer = document.getElementById('recording-timer');
        this.recordingStatus = document.getElementById('recording-status');
        this.recordingIndicator = document.getElementById('recording-indicator');
        this.recordingsList = document.getElementById('recordings-list');
    }

    setupEventListeners() {
        // Source selection
        const sourceBtns = document.querySelectorAll('.source-btn');
        sourceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectSource(btn.dataset.source);
            });
        });

        // Audio settings
        const systemAudioCheck = document.getElementById('system-audio');
        const microphoneAudioCheck = document.getElementById('microphone-audio');
        
        if (systemAudioCheck) {
            systemAudioCheck.addEventListener('change', (e) => {
                this.settings.systemAudio = e.target.checked;
                this.saveSettings();
            });
        }
        
        if (microphoneAudioCheck) {
            microphoneAudioCheck.addEventListener('change', (e) => {
                this.settings.microphoneAudio = e.target.checked;
                this.saveSettings();
            });
        }

        // Recording settings
        const resolutionSelect = document.getElementById('recording-resolution');
        const framerateSelect = document.getElementById('recording-framerate');
        
        if (resolutionSelect) {
            resolutionSelect.addEventListener('change', (e) => {
                this.settings.resolution = e.target.value;
                this.saveSettings();
            });
        }
        
        if (framerateSelect) {
            framerateSelect.addEventListener('change', (e) => {
                this.settings.framerate = parseInt(e.target.value);
                this.saveSettings();
            });
        }

        // Recording controls
        const startBtn = document.getElementById('start-recording');
        const pauseBtn = document.getElementById('pause-recording');
        const stopBtn = document.getElementById('stop-recording');
        
        if (startBtn) {
            startBtn.addEventListener('click', () => this.startRecording());
        }
        
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.pauseRecording());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopRecording());
        }
    }

    selectSource(source) {
        this.settings.source = source;
        
        // Update source buttons
        const sourceBtns = document.querySelectorAll('.source-btn');
        sourceBtns.forEach(btn => {
            if (btn.dataset.source === source) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        this.saveSettings();
    }

    async startRecording() {
        try {
            // Request screen capture
            await this.requestScreenCapture();
            
            // Setup media recorder
            this.setupMediaRecorder();
            
            // Start recording
            this.mediaRecorder.start();
            this.isRecording = true;
            this.isPaused = false;
            this.recordingStartTime = Date.now();
            this.recordedChunks = [];
            
            // Update UI
            this.updateRecordingUI();
            this.startTimer();
            
            this.app.showNotification('Recording started', 'success');
        } catch (error) {
            console.error('Failed to start recording:', error);
            this.app.showNotification('Failed to start recording: ' + error.message, 'error');
        }
    }

    async requestScreenCapture() {
        try {
            const constraints = {
                video: {
                    mediaSource: this.settings.source,
                    width: { ideal: parseInt(this.settings.resolution.split('x')[0]) },
                    height: { ideal: parseInt(this.settings.resolution.split('x')[1]) },
                    frameRate: { ideal: this.settings.framerate }
                }
            };

            // Get display media
            this.stream = await navigator.mediaDevices.getDisplayMedia(constraints);
            
            // Add audio if requested
            if (this.settings.microphoneAudio) {
                const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
                const audioTrack = audioStream.getAudioTracks()[0];
                this.stream.addTrack(audioTrack);
            }
            
            // Show preview
            if (this.previewVideo) {
                this.previewVideo.srcObject = this.stream;
            }
            
        } catch (error) {
            throw new Error('Screen capture permission denied or not supported');
        }
    }

    setupMediaRecorder() {
        if (!this.stream) {
            throw new Error('No stream available');
        }

        const options = {
            mimeType: this.getMimeType(),
            videoBitsPerSecond: this.getVideoBitrate(),
            audioBitsPerSecond: 128000
        };

        this.mediaRecorder = new MediaRecorder(this.stream, options);
        
        this.mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                this.recordedChunks.push(event.data);
            }
        };
        
        this.mediaRecorder.onstop = () => {
            this.handleRecordingStop();
        };
        
        this.mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            this.app.showNotification('Recording error: ' + event.error.message, 'error');
        };
    }

    getMimeType() {
        const types = [
            'video/webm;codecs=vp9,opus',
            'video/webm;codecs=vp8,opus',
            'video/webm',
            'video/mp4'
        ];
        
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                return type;
            }
        }
        
        return 'video/webm';
    }

    getVideoBitrate() {
        const quality = {
            '1920x1080': 5000000,
            '1280x720': 2500000,
            '854x480': 1000000
        };
        
        return quality[this.settings.resolution] || 2500000;
    }

    pauseRecording() {
        if (this.mediaRecorder && this.isRecording && !this.isPaused) {
            this.mediaRecorder.pause();
            this.isPaused = true;
            this.updateRecordingUI();
            this.app.showNotification('Recording paused', 'info');
        } else if (this.mediaRecorder && this.isPaused) {
            this.mediaRecorder.resume();
            this.isPaused = false;
            this.updateRecordingUI();
            this.app.showNotification('Recording resumed', 'info');
        }
    }

    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            this.isPaused = false;
            
            // Stop all tracks
            if (this.stream) {
                this.stream.getTracks().forEach(track => track.stop());
                this.stream = null;
            }
            
            // Clear preview
            if (this.previewVideo) {
                this.previewVideo.srcObject = null;
            }
            
            this.updateRecordingUI();
            this.app.showNotification('Recording stopped', 'success');
        }
    }

    async handleRecordingStop() {
        if (this.recordedChunks.length === 0) {
            this.app.showNotification('No recording data available', 'warning');
            return;
        }

        // Create blob from recorded chunks
        const blob = new Blob(this.recordedChunks, { type: this.getMimeType() });
        const duration = (Date.now() - this.recordingStartTime) / 1000;
        
        // Create recording object
        const recording = {
            id: this.utils.generateId('recording'),
            name: `Recording ${new Date().toLocaleString()}`,
            blob: blob,
            url: URL.createObjectURL(blob),
            duration: duration,
            size: blob.size,
            format: this.settings.format,
            settings: { ...this.settings },
            created: Date.now()
        };

        // Save to storage
        try {
            await this.storage.saveRecording({
                id: recording.id,
                name: recording.name,
                data: blob,
                size: blob.size,
                duration: duration,
                format: recording.format,
                settings: recording.settings
            });
            
            this.recordings.push(recording);
            this.renderRecordings();
            
            this.app.showNotification('Recording saved successfully', 'success');
        } catch (error) {
            console.error('Failed to save recording:', error);
            this.app.showNotification('Failed to save recording', 'error');
        }
    }

    updateRecordingUI() {
        const startBtn = document.getElementById('start-recording');
        const pauseBtn = document.getElementById('pause-recording');
        const stopBtn = document.getElementById('stop-recording');
        
        if (this.isRecording) {
            if (startBtn) {
                startBtn.disabled = true;
                startBtn.style.opacity = '0.5';
            }
            if (pauseBtn) {
                pauseBtn.disabled = false;
                pauseBtn.style.opacity = '1';
                pauseBtn.innerHTML = this.isPaused ? 
                    '<span class="icon">▶️</span><span class="text">Resume</span>' :
                    '<span class="icon">⏸️</span><span class="text">Pause</span>';
            }
            if (stopBtn) {
                stopBtn.disabled = false;
                stopBtn.style.opacity = '1';
            }
            
            // Update status
            if (this.recordingStatus) {
                this.recordingStatus.textContent = this.isPaused ? 'Recording Paused' : 'Recording...';
            }
            
            if (this.recordingIndicator) {
                this.recordingIndicator.className = 'status-indicator status-recording';
            }
        } else {
            if (startBtn) {
                startBtn.disabled = false;
                startBtn.style.opacity = '1';
            }
            if (pauseBtn) {
                pauseBtn.disabled = true;
                pauseBtn.style.opacity = '0.5';
                pauseBtn.innerHTML = '<span class="icon">⏸️</span><span class="text">Pause</span>';
            }
            if (stopBtn) {
                stopBtn.disabled = true;
                stopBtn.style.opacity = '0.5';
            }
            
            // Update status
            if (this.recordingStatus) {
                this.recordingStatus.textContent = 'Ready to Record';
            }
            
            if (this.recordingIndicator) {
                this.recordingIndicator.className = 'status-indicator status-offline';
            }
        }
    }

    startTimer() {
        if (!this.isRecording) return;

        const updateTimer = () => {
            if (this.isRecording && !this.isPaused) {
                const elapsed = (Date.now() - this.recordingStartTime) / 1000;
                if (this.recordingTimer) {
                    this.recordingTimer.textContent = this.utils.formatDuration(elapsed);
                }
            }
            
            if (this.isRecording) {
                requestAnimationFrame(updateTimer);
            }
        };
        
        requestAnimationFrame(updateTimer);
    }

    async loadRecordings() {
        try {
            const savedRecordings = await this.storage.getAllRecordings();
            
            this.recordings = savedRecordings.map(recording => ({
                id: recording.id,
                name: recording.name,
                blob: new Blob([recording.data]),
                url: URL.createObjectURL(new Blob([recording.data])),
                duration: recording.duration,
                size: recording.size,
                format: recording.format,
                settings: recording.settings,
                created: recording.created
            }));
            
            this.renderRecordings();
        } catch (error) {
            console.error('Failed to load recordings:', error);
        }
    }

    renderRecordings() {
        if (!this.recordingsList) return;

        let html = '';
        
        this.recordings.forEach(recording => {
            const date = new Date(recording.created).toLocaleDateString();
            const size = this.utils.formatBytes(recording.size);
            const duration = this.utils.formatDuration(recording.duration);
            
            html += `
                <div class="recording-item" data-recording="${recording.id}">
                    <div class="recording-thumbnail">🎬</div>
                    <div class="recording-info">
                        <div class="recording-name">${recording.name}</div>
                        <div class="recording-date">${date}</div>
                        <div class="recording-details">${duration} • ${size}</div>
                        <div class="recording-actions">
                            <button class="recording-action" onclick="window.nexusCanvas.studios.screenRecorder.playRecording('${recording.id}')">Play</button>
                            <button class="recording-action" onclick="window.nexusCanvas.studios.screenRecorder.downloadRecording('${recording.id}')">Download</button>
                            <button class="recording-action" onclick="window.nexusCanvas.studios.screenRecorder.deleteRecording('${recording.id}')">Delete</button>
                        </div>
                    </div>
                </div>
            `;
        });

        if (html === '') {
            html = '<div class="no-recordings"><p>No recordings yet</p></div>';
        }

        this.recordingsList.innerHTML = html;
    }

    playRecording(recordingId) {
        const recording = this.recordings.find(r => r.id === recordingId);
        if (!recording) return;

        // Create a modal to play the recording
        const modalContent = `
            <div class="recording-player">
                <video controls style="width: 100%; max-height: 70vh;">
                    <source src="${recording.url}" type="${recording.blob.type}">
                    Your browser does not support the video tag.
                </video>
                <div class="recording-info-modal">
                    <h4>${recording.name}</h4>
                    <p>Duration: ${this.utils.formatDuration(recording.duration)}</p>
                    <p>Size: ${this.utils.formatBytes(recording.size)}</p>
                    <p>Format: ${recording.format}</p>
                </div>
            </div>
        `;

        this.app.showModal('Recording Player', modalContent);
    }

    downloadRecording(recordingId) {
        const recording = this.recordings.find(r => r.id === recordingId);
        if (!recording) return;

        const filename = `${recording.name.replace(/[^a-z0-9]/gi, '_')}.${recording.format}`;
        this.utils.downloadBlob(recording.blob, filename);
        
        this.app.showNotification('Recording downloaded', 'success');
    }

    async deleteRecording(recordingId) {
        if (!confirm('Are you sure you want to delete this recording?')) {
            return;
        }

        try {
            await this.storage.deleteRecording(recordingId);
            
            const index = this.recordings.findIndex(r => r.id === recordingId);
            if (index !== -1) {
                // Revoke object URL to free memory
                URL.revokeObjectURL(this.recordings[index].url);
                this.recordings.splice(index, 1);
            }
            
            this.renderRecordings();
            this.app.showNotification('Recording deleted', 'success');
        } catch (error) {
            console.error('Failed to delete recording:', error);
            this.app.showNotification('Failed to delete recording', 'error');
        }
    }

    saveSettings() {
        this.app.getStorage().setItem('screen-recorder-settings', this.settings);
    }

    async loadSettings() {
        try {
            const savedSettings = await this.app.getStorage().getItem('screen-recorder-settings');
            if (savedSettings) {
                this.settings = { ...this.settings, ...savedSettings };
                this.applySettings();
            }
        } catch (error) {
            console.warn('Could not load settings:', error);
        }
    }

    applySettings() {
        // Apply source selection
        this.selectSource(this.settings.source);
        
        // Apply audio settings
        const systemAudioCheck = document.getElementById('system-audio');
        const microphoneAudioCheck = document.getElementById('microphone-audio');
        
        if (systemAudioCheck) {
            systemAudioCheck.checked = this.settings.systemAudio;
        }
        
        if (microphoneAudioCheck) {
            microphoneAudioCheck.checked = this.settings.microphoneAudio;
        }
        
        // Apply recording settings
        const resolutionSelect = document.getElementById('recording-resolution');
        const framerateSelect = document.getElementById('recording-framerate');
        
        if (resolutionSelect) {
            resolutionSelect.value = this.settings.resolution;
        }
        
        if (framerateSelect) {
            framerateSelect.value = this.settings.framerate.toString();
        }
    }

    // Studio lifecycle methods
    onActivate() {
        this.renderRecordings();
        this.updateRecordingUI();
    }

    onPause() {
        // Pause recording if active
        if (this.isRecording && !this.isPaused) {
            this.pauseRecording();
        }
    }

    onResume() {
        // Resume recording if paused
        if (this.isRecording && this.isPaused) {
            this.pauseRecording();
        }
    }

    handleKeyboard(e) {
        // Recording shortcuts
        if (e.key === 'F9') {
            e.preventDefault();
            if (!this.isRecording) {
                this.startRecording();
            } else {
                this.stopRecording();
            }
        } else if (e.key === 'F10') {
            e.preventDefault();
            if (this.isRecording) {
                this.pauseRecording();
            }
        }
    }
}

// Add recording player styles
const playerStyles = `
    .recording-player {
        max-width: 800px;
        margin: 0 auto;
    }

    .recording-info-modal {
        margin-top: var(--space-4);
        padding: var(--space-4);
        background: var(--surface-bg);
        border-radius: var(--radius-lg);
    }

    .recording-info-modal h4 {
        margin-bottom: var(--space-3);
        color: var(--text-primary);
    }

    .recording-info-modal p {
        margin-bottom: var(--space-2);
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
    }

    .no-recordings {
        text-align: center;
        padding: var(--space-8);
        color: var(--text-muted);
    }

    .recording-details {
        font-size: var(--font-size-xs);
        color: var(--text-muted);
        margin-bottom: var(--space-2);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = playerStyles;
document.head.appendChild(styleSheet);