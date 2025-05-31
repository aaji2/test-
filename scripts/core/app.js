// Nexus Canvas - Main Application Controller

import { StorageManager } from './storage.js';
import { Utils } from './utils.js';
import { WebCreatorStudio } from '../studios/web-creator.js';
import { CodeEditorStudio } from '../studios/code-editor.js';
import { ImageEditorStudio } from '../studios/image-editor.js';
import { VideoEditorStudio } from '../studios/video-editor.js';
import { ScreenRecorderStudio } from '../studios/screen-recorder.js';
import { ProductivityStudio } from '../studios/productivity.js';

class NexusCanvasApp {
    constructor() {
        this.currentStudio = 'web-creator';
        this.studios = {};
        this.storage = new StorageManager();
        this.theme = 'dark';
        
        this.init();
    }

    async init() {
        try {
            // Show loading screen
            this.showLoading();
            
            // Initialize storage
            await this.storage.init();
            
            // Load user preferences
            await this.loadPreferences();
            
            // Initialize studios
            await this.initializeStudios();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Apply theme
            this.applyTheme();
            
            // Hide loading screen and show app
            this.hideLoading();
            
            console.log('Nexus Canvas initialized successfully');
        } catch (error) {
            console.error('Failed to initialize Nexus Canvas:', error);
            this.showError('Failed to initialize application');
        }
    }

    showLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        if (loadingScreen) loadingScreen.classList.remove('hidden');
        if (app) app.classList.add('hidden');
    }

    hideLoading() {
        const loadingScreen = document.getElementById('loading-screen');
        const app = document.getElementById('app');
        
        setTimeout(() => {
            if (loadingScreen) {
                loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    loadingScreen.classList.add('hidden');
                    if (app) app.classList.remove('hidden');
                }, 300);
            }
        }, 1000); // Show loading for at least 1 second
    }

    async loadPreferences() {
        try {
            const preferences = await this.storage.getItem('user-preferences');
            if (preferences) {
                this.theme = preferences.theme || 'dark';
                this.currentStudio = preferences.lastStudio || 'web-creator';
            }
        } catch (error) {
            console.warn('Could not load user preferences:', error);
        }
    }

    async savePreferences() {
        try {
            const preferences = {
                theme: this.theme,
                lastStudio: this.currentStudio,
                timestamp: Date.now()
            };
            await this.storage.setItem('user-preferences', preferences);
        } catch (error) {
            console.warn('Could not save user preferences:', error);
        }
    }

    async initializeStudios() {
        try {
            // Initialize each studio
            this.studios.webCreator = new WebCreatorStudio(this);
            this.studios.codeEditor = new CodeEditorStudio(this);
            this.studios.imageEditor = new ImageEditorStudio(this);
            this.studios.videoEditor = new VideoEditorStudio(this);
            this.studios.screenRecorder = new ScreenRecorderStudio(this);
            this.studios.productivity = new ProductivityStudio(this);

            // Initialize all studios
            await Promise.all([
                this.studios.webCreator.init(),
                this.studios.codeEditor.init(),
                this.studios.imageEditor.init(),
                this.studios.videoEditor.init(),
                this.studios.screenRecorder.init(),
                this.studios.productivity.init()
            ]);

            // Show the current studio
            this.switchStudio(this.currentStudio);
        } catch (error) {
            console.error('Failed to initialize studios:', error);
            throw error;
        }
    }

    setupEventListeners() {
        // Studio tab switching
        const studioTabs = document.querySelectorAll('.studio-tab');
        studioTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const studioId = tab.dataset.studio;
                this.switchStudio(studioId);
            });
        });

        // Theme toggle
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // Settings button
        const settingsBtn = document.getElementById('settings-btn');
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettings();
            });
        }

        // Help button
        const helpBtn = document.getElementById('help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', () => {
                this.showHelp();
            });
        }

        // Modal close
        const modalOverlay = document.getElementById('modal-overlay');
        const modalClose = document.querySelector('.modal-close');
        
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.hideModal();
                }
            });
        }
        
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                this.hideModal();
            });
        }

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            this.handleKeyboardShortcuts(e);
        });

        // Window events
        window.addEventListener('beforeunload', () => {
            this.savePreferences();
        });

        // Handle visibility change for PWA
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
                this.handleAppResume();
            } else {
                this.handleAppPause();
            }
        });
    }

    switchStudio(studioId) {
        // Update current studio
        this.currentStudio = studioId;

        // Update tab states
        const tabs = document.querySelectorAll('.studio-tab');
        tabs.forEach(tab => {
            if (tab.dataset.studio === studioId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update studio visibility
        const studios = document.querySelectorAll('.studio');
        studios.forEach(studio => {
            if (studio.id === `${studioId}-studio`) {
                studio.classList.add('active');
            } else {
                studio.classList.remove('active');
            }
        });

        // Notify the studio that it's now active
        const studioKey = this.getStudioKey(studioId);
        if (this.studios[studioKey] && this.studios[studioKey].onActivate) {
            this.studios[studioKey].onActivate();
        }

        // Save preference
        this.savePreferences();
    }

    getStudioKey(studioId) {
        const keyMap = {
            'web-creator': 'webCreator',
            'code-editor': 'codeEditor',
            'image-editor': 'imageEditor',
            'video-editor': 'videoEditor',
            'screen-recorder': 'screenRecorder',
            'productivity': 'productivity'
        };
        return keyMap[studioId];
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        this.applyTheme();
        this.savePreferences();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('.icon');
            if (icon) {
                icon.textContent = this.theme === 'dark' ? '☀️' : '🌙';
            }
        }
    }

    handleKeyboardShortcuts(e) {
        // Ctrl/Cmd + Number keys for studio switching
        if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '6') {
            e.preventDefault();
            const studioIndex = parseInt(e.key) - 1;
            const studioIds = ['web-creator', 'code-editor', 'image-editor', 'video-editor', 'screen-recorder', 'productivity'];
            if (studioIds[studioIndex]) {
                this.switchStudio(studioIds[studioIndex]);
            }
        }

        // Ctrl/Cmd + T for theme toggle
        if ((e.ctrlKey || e.metaKey) && e.key === 't') {
            e.preventDefault();
            this.toggleTheme();
        }

        // Escape to close modals
        if (e.key === 'Escape') {
            this.hideModal();
        }

        // Pass keyboard events to current studio
        const studioKey = this.getStudioKey(this.currentStudio);
        if (this.studios[studioKey] && this.studios[studioKey].handleKeyboard) {
            this.studios[studioKey].handleKeyboard(e);
        }
    }

    handleAppResume() {
        // Notify current studio that app resumed
        const studioKey = this.getStudioKey(this.currentStudio);
        if (this.studios[studioKey] && this.studios[studioKey].onResume) {
            this.studios[studioKey].onResume();
        }
    }

    handleAppPause() {
        // Notify current studio that app paused
        const studioKey = this.getStudioKey(this.currentStudio);
        if (this.studios[studioKey] && this.studios[studioKey].onPause) {
            this.studios[studioKey].onPause();
        }
    }

    showModal(title, content) {
        const modalOverlay = document.getElementById('modal-overlay');
        const modalTitle = document.querySelector('.modal-title');
        const modalContent = document.querySelector('.modal-content');

        if (modalTitle) modalTitle.textContent = title;
        if (modalContent) modalContent.innerHTML = content;
        if (modalOverlay) modalOverlay.classList.remove('hidden');
    }

    hideModal() {
        const modalOverlay = document.getElementById('modal-overlay');
        if (modalOverlay) modalOverlay.classList.add('hidden');
    }

    showSettings() {
        const settingsContent = `
            <div class="settings-panel">
                <div class="setting-group">
                    <h4>Appearance</h4>
                    <div class="setting-item">
                        <label>Theme</label>
                        <div class="theme-selector">
                            <button class="theme-option ${this.theme === 'dark' ? 'active' : ''}" data-theme="dark">
                                🌙 Dark
                            </button>
                            <button class="theme-option ${this.theme === 'light' ? 'active' : ''}" data-theme="light">
                                ☀️ Light
                            </button>
                        </div>
                    </div>
                </div>
                <div class="setting-group">
                    <h4>Keyboard Shortcuts</h4>
                    <div class="shortcuts-list">
                        <div class="shortcut-item">
                            <span class="shortcut-keys">Ctrl/Cmd + 1-6</span>
                            <span class="shortcut-desc">Switch between studios</span>
                        </div>
                        <div class="shortcut-item">
                            <span class="shortcut-keys">Ctrl/Cmd + T</span>
                            <span class="shortcut-desc">Toggle theme</span>
                        </div>
                        <div class="shortcut-item">
                            <span class="shortcut-keys">Escape</span>
                            <span class="shortcut-desc">Close modal</span>
                        </div>
                    </div>
                </div>
                <div class="setting-group">
                    <h4>Storage</h4>
                    <div class="storage-info">
                        <p>Local storage is used to save your projects and preferences.</p>
                        <button class="btn btn-secondary" id="clear-storage">Clear All Data</button>
                    </div>
                </div>
            </div>
        `;

        this.showModal('Settings', settingsContent);

        // Add event listeners for settings
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            option.addEventListener('click', () => {
                const newTheme = option.dataset.theme;
                if (newTheme !== this.theme) {
                    this.theme = newTheme;
                    this.applyTheme();
                    this.savePreferences();
                    
                    // Update active state
                    themeOptions.forEach(opt => opt.classList.remove('active'));
                    option.classList.add('active');
                }
            });
        });

        const clearStorageBtn = document.getElementById('clear-storage');
        if (clearStorageBtn) {
            clearStorageBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
                    await this.storage.clear();
                    location.reload();
                }
            });
        }
    }

    showHelp() {
        const helpContent = `
            <div class="help-panel">
                <div class="help-section">
                    <h4>🌐 Web Creator</h4>
                    <p>Create beautiful websites with drag-and-drop components. No coding required!</p>
                    <ul>
                        <li>Drag components from the left panel to the canvas</li>
                        <li>Select elements to edit properties in the right panel</li>
                        <li>Switch between device previews</li>
                        <li>Export your website as HTML/CSS/JS</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>💻 Code Studio</h4>
                    <p>Write and edit code with syntax highlighting and live preview.</p>
                    <ul>
                        <li>Create and manage files in the file explorer</li>
                        <li>Edit HTML, CSS, and JavaScript</li>
                        <li>See changes in real-time in the preview panel</li>
                        <li>Export your project files</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>🖼️ Image Studio</h4>
                    <p>Edit images with professional tools and effects.</p>
                    <ul>
                        <li>Open images from your device</li>
                        <li>Use drawing tools and filters</li>
                        <li>Work with layers for complex edits</li>
                        <li>Save your edited images</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>🎬 Video Studio</h4>
                    <p>Edit videos with timeline-based editing tools.</p>
                    <ul>
                        <li>Import video and audio files</li>
                        <li>Arrange clips on the timeline</li>
                        <li>Apply effects and transitions</li>
                        <li>Export your finished video</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>📹 Screen Recorder</h4>
                    <p>Record your screen for tutorials and presentations.</p>
                    <ul>
                        <li>Choose recording source (screen, window, or tab)</li>
                        <li>Configure audio settings</li>
                        <li>Start, pause, and stop recordings</li>
                        <li>Save recordings to your device</li>
                    </ul>
                </div>
                <div class="help-section">
                    <h4>📊 Productivity</h4>
                    <p>Create documents, spreadsheets, and presentations.</p>
                    <ul>
                        <li>Document editor with rich text formatting</li>
                        <li>Spreadsheet with formulas and calculations</li>
                        <li>Presentation builder with slides and animations</li>
                        <li>Export to various formats</li>
                    </ul>
                </div>
            </div>
        `;

        this.showModal('Help & Documentation', helpContent);
    }

    showError(message) {
        const errorContent = `
            <div class="error-panel">
                <div class="error-icon">⚠️</div>
                <h4>Error</h4>
                <p>${message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Reload Application</button>
            </div>
        `;

        this.showModal('Error', errorContent);
    }

    // Public API for studios
    getStorage() {
        return this.storage;
    }

    getUtils() {
        return Utils;
    }

    getCurrentTheme() {
        return this.theme;
    }

    getStudio(studioName) {
        const studioKey = this.getStudioKey(studioName);
        return this.studios[studioKey];
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <span class="notification-message">${message}</span>
            <button class="notification-close">&times;</button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Position notification
        const notifications = document.querySelectorAll('.notification');
        const offset = (notifications.length - 1) * 60;
        notification.style.top = `${20 + offset}px`;

        // Auto remove after 5 seconds
        setTimeout(() => {
            this.removeNotification(notification);
        }, 5000);

        // Close button
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            this.removeNotification(notification);
        });
    }

    removeNotification(notification) {
        if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                notification.remove();
                this.repositionNotifications();
            }, 300);
        }
    }

    repositionNotifications() {
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach((notification, index) => {
            notification.style.top = `${20 + index * 60}px`;
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nexusCanvas = new NexusCanvasApp();
});

// Add notification styles
const notificationStyles = `
    .notification {
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--glass-bg);
        backdrop-filter: blur(20px);
        border: 1px solid var(--border-color);
        border-radius: var(--radius-xl);
        padding: var(--space-4);
        box-shadow: var(--shadow-lg);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: var(--space-3);
        max-width: 400px;
        transition: all var(--transition-normal);
        animation: slideInRight 0.3s ease-out;
    }

    .notification-info {
        border-left: 4px solid var(--accent-blue);
    }

    .notification-success {
        border-left: 4px solid var(--accent-green);
    }

    .notification-warning {
        border-left: 4px solid var(--accent-orange);
    }

    .notification-error {
        border-left: 4px solid var(--accent-red);
    }

    .notification-message {
        flex: 1;
        color: var(--text-primary);
        font-size: var(--font-size-sm);
    }

    .notification-close {
        width: 20px;
        height: 20px;
        border: none;
        background: transparent;
        color: var(--text-muted);
        cursor: pointer;
        border-radius: var(--radius-sm);
        transition: all var(--transition-fast);
    }

    .notification-close:hover {
        background: var(--surface-bg);
        color: var(--text-primary);
    }

    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    .settings-panel {
        max-width: 500px;
    }

    .setting-group {
        margin-bottom: var(--space-6);
    }

    .setting-group h4 {
        margin-bottom: var(--space-4);
        color: var(--text-primary);
        border-bottom: 1px solid var(--border-color);
        padding-bottom: var(--space-2);
    }

    .setting-item {
        margin-bottom: var(--space-4);
    }

    .setting-item label {
        display: block;
        margin-bottom: var(--space-2);
        font-weight: 500;
        color: var(--text-secondary);
    }

    .theme-selector {
        display: flex;
        gap: var(--space-2);
    }

    .theme-option {
        padding: var(--space-3) var(--space-4);
        border: 1px solid var(--border-color);
        background: var(--surface-bg);
        color: var(--text-primary);
        border-radius: var(--radius-lg);
        cursor: pointer;
        transition: all var(--transition-fast);
    }

    .theme-option:hover {
        background: var(--glass-bg);
    }

    .theme-option.active {
        background: var(--accent-blue);
        color: white;
        border-color: var(--accent-blue);
    }

    .shortcuts-list {
        display: flex;
        flex-direction: column;
        gap: var(--space-3);
    }

    .shortcut-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--space-3);
        background: var(--surface-bg);
        border-radius: var(--radius-lg);
    }

    .shortcut-keys {
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        background: var(--tertiary-bg);
        padding: var(--space-1) var(--space-2);
        border-radius: var(--radius-sm);
        font-size: var(--font-size-xs);
    }

    .shortcut-desc {
        color: var(--text-secondary);
        font-size: var(--font-size-sm);
    }

    .storage-info {
        text-align: center;
    }

    .storage-info p {
        margin-bottom: var(--space-4);
        color: var(--text-secondary);
    }

    .help-panel {
        max-width: 600px;
        max-height: 70vh;
        overflow-y: auto;
    }

    .help-section {
        margin-bottom: var(--space-6);
        padding-bottom: var(--space-4);
        border-bottom: 1px solid var(--border-color);
    }

    .help-section:last-child {
        border-bottom: none;
    }

    .help-section h4 {
        margin-bottom: var(--space-3);
        color: var(--text-primary);
    }

    .help-section p {
        margin-bottom: var(--space-3);
        color: var(--text-secondary);
    }

    .help-section ul {
        list-style: none;
        padding-left: 0;
    }

    .help-section li {
        padding: var(--space-1) 0;
        color: var(--text-secondary);
        position: relative;
        padding-left: var(--space-4);
    }

    .help-section li::before {
        content: '•';
        color: var(--accent-blue);
        position: absolute;
        left: 0;
    }

    .error-panel {
        text-align: center;
        padding: var(--space-6);
    }

    .error-icon {
        font-size: 3rem;
        margin-bottom: var(--space-4);
    }

    .error-panel h4 {
        color: var(--accent-red);
        margin-bottom: var(--space-3);
    }

    .error-panel p {
        color: var(--text-secondary);
        margin-bottom: var(--space-6);
    }
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

export { NexusCanvasApp };