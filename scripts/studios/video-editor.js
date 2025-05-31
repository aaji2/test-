// Nexus Canvas - Video Editor Studio
// Timeline-based video editing with effects and transitions

export class VideoEditorStudio {
    constructor(app) {
        this.app = app;
        this.storage = app.getStorage();
        this.utils = app.getUtils();
        
        this.mediaLibrary = [];
        this.timeline = {
            videoTracks: [[]],
            audioTracks: [[]],
            duration: 0,
            currentTime: 0
        };
        this.previewVideo = null;
        this.isPlaying = false;
        this.selectedClip = null;
    }

    async init() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.initializeTimeline();
            
            console.log('Video Editor Studio initialized');
        } catch (error) {
            console.error('Failed to initialize Video Editor Studio:', error);
            throw error;
        }
    }

    setupElements() {
        this.mediaLibraryEl = document.getElementById('media-library');
        this.previewVideo = document.getElementById('video-preview');
        this.timelineEl = document.querySelector('.timeline-tracks');
        this.timecodeEl = document.querySelector('.timecode');
    }

    setupEventListeners() {
        // Import media button
        const importBtn = document.getElementById('import-media');
        if (importBtn) {
            importBtn.addEventListener('click', () => this.importMedia());
        }

        // Playback controls
        const playPauseBtn = document.getElementById('play-pause');
        const stopBtn = document.getElementById('stop');
        
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => this.togglePlayback());
        }
        
        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopPlayback());
        }

        // Export button
        const exportBtn = document.getElementById('export-video');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportVideo());
        }

        // Effects
        const effectItems = document.querySelectorAll('.effect-item');
        effectItems.forEach(item => {
            item.addEventListener('click', () => {
                this.applyEffect(item.dataset.effect);
            });
        });

        // Timeline events
        this.setupTimelineEvents();
    }

    setupTimelineEvents() {
        if (!this.timelineEl) return;

        this.timelineEl.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
        });

        this.timelineEl.addEventListener('drop', (e) => {
            e.preventDefault();
            const mediaId = e.dataTransfer.getData('text/plain');
            const track = e.target.closest('.track');
            
            if (mediaId && track) {
                this.addClipToTrack(mediaId, track.dataset.track);
            }
        });
    }

    initializeTimeline() {
        this.renderTimeline();
        this.updateTimecode(0);
    }

    async importMedia() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'video/*,audio/*';
            input.multiple = true;
            
            input.onchange = async (e) => {
                const files = Array.from(e.target.files);
                
                for (const file of files) {
                    await this.addMediaToLibrary(file);
                }
                
                this.renderMediaLibrary();
                this.app.showNotification(`Imported ${files.length} file(s)`, 'success');
            };
            
            input.click();
        } catch (error) {
            console.error('Failed to import media:', error);
            this.app.showNotification('Failed to import media', 'error');
        }
    }

    async addMediaToLibrary(file) {
        const mediaItem = {
            id: this.utils.generateId('media'),
            name: file.name,
            type: file.type.startsWith('video/') ? 'video' : 'audio',
            file: file,
            url: URL.createObjectURL(file),
            duration: 0,
            thumbnail: null
        };

        // Get duration and thumbnail for video files
        if (mediaItem.type === 'video') {
            const video = document.createElement('video');
            video.src = mediaItem.url;
            
            await new Promise((resolve) => {
                video.addEventListener('loadedmetadata', () => {
                    mediaItem.duration = video.duration;
                    
                    // Generate thumbnail
                    video.currentTime = Math.min(1, video.duration / 2);
                    video.addEventListener('seeked', () => {
                        const canvas = this.utils.createCanvas(160, 90);
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, 160, 90);
                        mediaItem.thumbnail = canvas.toDataURL();
                        resolve();
                    }, { once: true });
                }, { once: true });
            });
        } else {
            // For audio files, get duration
            const audio = document.createElement('audio');
            audio.src = mediaItem.url;
            
            await new Promise((resolve) => {
                audio.addEventListener('loadedmetadata', () => {
                    mediaItem.duration = audio.duration;
                    resolve();
                }, { once: true });
            });
        }

        this.mediaLibrary.push(mediaItem);
        
        // Save to storage
        await this.storage.saveMedia({
            id: mediaItem.id,
            name: mediaItem.name,
            type: mediaItem.type,
            data: await this.utils.readFileAsArrayBuffer(file),
            duration: mediaItem.duration,
            thumbnail: mediaItem.thumbnail
        });
    }

    renderMediaLibrary() {
        if (!this.mediaLibraryEl) return;

        let html = '';
        
        this.mediaLibrary.forEach(item => {
            const thumbnail = item.thumbnail || (item.type === 'video' ? '🎬' : '🎵');
            const duration = this.utils.formatDuration(item.duration);
            
            html += `
                <div class="media-item" draggable="true" data-media="${item.id}">
                    <div class="media-thumbnail">
                        ${item.thumbnail ? `<img src="${item.thumbnail}" alt="${item.name}">` : thumbnail}
                    </div>
                    <div class="media-info">
                        <div class="media-name">${item.name}</div>
                        <div class="media-duration">${duration}</div>
                    </div>
                </div>
            `;
        });

        this.mediaLibraryEl.innerHTML = html;

        // Add drag event listeners
        const mediaItems = this.mediaLibraryEl.querySelectorAll('.media-item');
        mediaItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.media);
                e.dataTransfer.effectAllowed = 'copy';
            });

            item.addEventListener('dblclick', () => {
                this.previewMedia(item.dataset.media);
            });
        });
    }

    previewMedia(mediaId) {
        const mediaItem = this.mediaLibrary.find(item => item.id === mediaId);
        if (!mediaItem || !this.previewVideo) return;

        if (mediaItem.type === 'video') {
            this.previewVideo.src = mediaItem.url;
            this.previewVideo.load();
        }
    }

    addClipToTrack(mediaId, trackId) {
        const mediaItem = this.mediaLibrary.find(item => item.id === mediaId);
        if (!mediaItem) return;

        const clip = {
            id: this.utils.generateId('clip'),
            mediaId: mediaId,
            name: mediaItem.name,
            type: mediaItem.type,
            startTime: this.timeline.duration,
            duration: mediaItem.duration,
            inPoint: 0,
            outPoint: mediaItem.duration,
            effects: []
        };

        if (trackId.startsWith('video')) {
            const trackIndex = parseInt(trackId.replace('video', '')) - 1;
            if (!this.timeline.videoTracks[trackIndex]) {
                this.timeline.videoTracks[trackIndex] = [];
            }
            this.timeline.videoTracks[trackIndex].push(clip);
        } else if (trackId.startsWith('audio')) {
            const trackIndex = parseInt(trackId.replace('audio', '')) - 1;
            if (!this.timeline.audioTracks[trackIndex]) {
                this.timeline.audioTracks[trackIndex] = [];
            }
            this.timeline.audioTracks[trackIndex].push(clip);
        }

        this.timeline.duration = Math.max(this.timeline.duration, clip.startTime + clip.duration);
        this.renderTimeline();
        
        this.app.showNotification(`Added ${clip.name} to timeline`, 'success');
    }

    renderTimeline() {
        if (!this.timelineEl) return;

        let html = '';

        // Video tracks
        this.timeline.videoTracks.forEach((track, index) => {
            html += `<div class="track video-track" data-track="video${index + 1}">`;
            
            track.forEach(clip => {
                const width = (clip.duration / Math.max(this.timeline.duration, 10)) * 100;
                const left = (clip.startTime / Math.max(this.timeline.duration, 10)) * 100;
                
                html += `
                    <div class="clip video-clip" 
                         data-clip="${clip.id}"
                         style="left: ${left}%; width: ${width}%;">
                        <div class="clip-name">${clip.name}</div>
                        <div class="clip-duration">${this.utils.formatDuration(clip.duration)}</div>
                    </div>
                `;
            });
            
            html += '</div>';
        });

        // Audio tracks
        this.timeline.audioTracks.forEach((track, index) => {
            html += `<div class="track audio-track" data-track="audio${index + 1}">`;
            
            track.forEach(clip => {
                const width = (clip.duration / Math.max(this.timeline.duration, 10)) * 100;
                const left = (clip.startTime / Math.max(this.timeline.duration, 10)) * 100;
                
                html += `
                    <div class="clip audio-clip" 
                         data-clip="${clip.id}"
                         style="left: ${left}%; width: ${width}%;">
                        <div class="clip-name">${clip.name}</div>
                        <div class="clip-duration">${this.utils.formatDuration(clip.duration)}</div>
                    </div>
                `;
            });
            
            html += '</div>';
        });

        this.timelineEl.innerHTML = html;

        // Add clip event listeners
        const clips = this.timelineEl.querySelectorAll('.clip');
        clips.forEach(clip => {
            clip.addEventListener('click', () => {
                this.selectClip(clip.dataset.clip);
            });
        });
    }

    selectClip(clipId) {
        // Remove previous selection
        const clips = this.timelineEl.querySelectorAll('.clip');
        clips.forEach(clip => clip.classList.remove('selected'));

        // Select new clip
        const clipEl = this.timelineEl.querySelector(`[data-clip="${clipId}"]`);
        if (clipEl) {
            clipEl.classList.add('selected');
            this.selectedClip = this.findClip(clipId);
        }
    }

    findClip(clipId) {
        for (const track of [...this.timeline.videoTracks, ...this.timeline.audioTracks]) {
            const clip = track.find(c => c.id === clipId);
            if (clip) return clip;
        }
        return null;
    }

    togglePlayback() {
        if (!this.previewVideo) return;

        if (this.isPlaying) {
            this.previewVideo.pause();
            this.isPlaying = false;
            
            const playPauseBtn = document.getElementById('play-pause');
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<span class="icon">▶️</span>';
            }
        } else {
            this.previewVideo.play();
            this.isPlaying = true;
            
            const playPauseBtn = document.getElementById('play-pause');
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<span class="icon">⏸️</span>';
            }
            
            this.startTimelineUpdate();
        }
    }

    stopPlayback() {
        if (!this.previewVideo) return;

        this.previewVideo.pause();
        this.previewVideo.currentTime = 0;
        this.timeline.currentTime = 0;
        this.isPlaying = false;
        
        const playPauseBtn = document.getElementById('play-pause');
        if (playPauseBtn) {
            playPauseBtn.innerHTML = '<span class="icon">▶️</span>';
        }
        
        this.updateTimecode(0);
    }

    startTimelineUpdate() {
        if (!this.isPlaying) return;

        const update = () => {
            if (this.isPlaying && this.previewVideo) {
                this.timeline.currentTime = this.previewVideo.currentTime;
                this.updateTimecode(this.timeline.currentTime);
                requestAnimationFrame(update);
            }
        };
        
        requestAnimationFrame(update);
    }

    updateTimecode(time) {
        if (this.timecodeEl) {
            this.timecodeEl.textContent = this.utils.formatDuration(time);
        }
    }

    applyEffect(effectType) {
        if (!this.selectedClip) {
            this.app.showNotification('Please select a clip first', 'warning');
            return;
        }

        const effect = {
            id: this.utils.generateId('effect'),
            type: effectType,
            parameters: this.getDefaultEffectParameters(effectType)
        };

        this.selectedClip.effects.push(effect);
        this.app.showNotification(`Applied ${effectType} effect`, 'success');
    }

    getDefaultEffectParameters(effectType) {
        const defaults = {
            brightness: { value: 0 },
            contrast: { value: 0 },
            saturation: { value: 0 },
            blur: { radius: 5 },
            'motion-blur': { angle: 0, distance: 10 }
        };
        
        return defaults[effectType] || {};
    }

    async exportVideo() {
        try {
            this.app.showNotification('Starting video export...', 'info');
            
            // This is a simplified export - in a real implementation,
            // you would use WebCodecs API or ffmpeg.wasm for proper video processing
            
            const format = document.getElementById('export-format').value;
            const quality = document.getElementById('export-quality').value;
            
            // For now, just export the current preview video
            if (this.previewVideo && this.previewVideo.src) {
                const response = await fetch(this.previewVideo.src);
                const blob = await response.blob();
                
                const filename = `exported-video.${format}`;
                this.utils.downloadBlob(blob, filename);
                
                this.app.showNotification('Video exported successfully!', 'success');
            } else {
                this.app.showNotification('No video to export', 'warning');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.app.showNotification('Export failed', 'error');
        }
    }

    async saveProject() {
        const projectData = {
            type: 'video-editor',
            name: this.currentProject?.name || 'Untitled Video Project',
            data: {
                timeline: this.timeline,
                mediaLibrary: this.mediaLibrary.map(item => ({
                    id: item.id,
                    name: item.name,
                    type: item.type,
                    duration: item.duration
                }))
            }
        };

        try {
            const projectId = await this.storage.saveProject(projectData);
            this.currentProject = { ...projectData, id: projectId };
            this.app.showNotification('Project saved!', 'success');
        } catch (error) {
            console.error('Failed to save project:', error);
            this.app.showNotification('Failed to save project', 'error');
        }
    }

    async loadProject(projectId) {
        try {
            const project = await this.storage.getProject(projectId);
            if (project && project.type === 'video-editor') {
                this.currentProject = project;
                this.timeline = project.data.timeline || { videoTracks: [[]], audioTracks: [[]], duration: 0, currentTime: 0 };
                
                // Restore media library references
                this.mediaLibrary = [];
                if (project.data.mediaLibrary) {
                    for (const mediaRef of project.data.mediaLibrary) {
                        const mediaData = await this.storage.getMedia(mediaRef.id);
                        if (mediaData) {
                            const blob = new Blob([mediaData.data]);
                            const mediaItem = {
                                id: mediaRef.id,
                                name: mediaRef.name,
                                type: mediaRef.type,
                                file: blob,
                                url: URL.createObjectURL(blob),
                                duration: mediaRef.duration,
                                thumbnail: mediaData.thumbnail
                            };
                            this.mediaLibrary.push(mediaItem);
                        }
                    }
                }
                
                this.renderMediaLibrary();
                this.renderTimeline();
                this.app.showNotification('Project loaded!', 'success');
            }
        } catch (error) {
            console.error('Failed to load project:', error);
            this.app.showNotification('Failed to load project', 'error');
        }
    }

    newProject() {
        this.currentProject = null;
        this.mediaLibrary = [];
        this.timeline = {
            videoTracks: [[]],
            audioTracks: [[]],
            duration: 0,
            currentTime: 0
        };
        this.selectedClip = null;
        
        this.renderMediaLibrary();
        this.renderTimeline();
        this.stopPlayback();
        
        this.app.showNotification('New project created', 'success');
    }

    // Studio lifecycle methods
    onActivate() {
        // Refresh timeline display
        this.renderTimeline();
    }

    onPause() {
        if (this.currentProject) {
            this.saveProject();
        }
        this.stopPlayback();
    }

    onResume() {
        // Resume any paused operations
    }

    handleKeyboard(e) {
        if ((e.ctrlKey || e.metaKey)) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveProject();
                    break;
                case 'i':
                    e.preventDefault();
                    this.importMedia();
                    break;
            }
        }

        // Playback shortcuts
        switch (e.key) {
            case ' ':
                e.preventDefault();
                this.togglePlayback();
                break;
            case 'Escape':
                this.stopPlayback();
                break;
        }
    }
}

// Add timeline styles
const timelineStyles = `
    .clip {
        position: absolute;
        height: 50px;
        background: var(--accent-blue);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-sm);
        padding: var(--space-2);
        cursor: pointer;
        transition: all var(--transition-fast);
        overflow: hidden;
        display: flex;
        flex-direction: column;
        justify-content: center;
    }

    .clip:hover {
        background: var(--accent-purple);
        transform: translateY(-2px);
    }

    .clip.selected {
        border-color: var(--accent-orange);
        box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.3);
    }

    .video-clip {
        background: var(--accent-blue);
    }

    .audio-clip {
        background: var(--accent-green);
    }

    .clip-name {
        font-size: var(--font-size-xs);
        font-weight: 500;
        color: white;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .clip-duration {
        font-size: var(--font-size-xs);
        color: rgba(255, 255, 255, 0.8);
    }

    .media-item img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: var(--radius-sm);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = timelineStyles;
document.head.appendChild(styleSheet);