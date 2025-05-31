// Nexus Canvas - Code Editor Studio
// Advanced code editor with syntax highlighting and live preview

export class CodeEditorStudio {
    constructor(app) {
        this.app = app;
        this.storage = app.getStorage();
        this.utils = app.getUtils();
        
        this.currentProject = null;
        this.openFiles = new Map();
        this.activeFile = null;
        this.fileTree = {};
        
        this.fileExplorer = null;
        this.editorContainer = null;
        this.editorTabs = null;
        this.livePreview = null;
    }

    async init() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.initializeFileSystem();
            this.loadLastProject();
            
            console.log('Code Editor Studio initialized');
        } catch (error) {
            console.error('Failed to initialize Code Editor Studio:', error);
            throw error;
        }
    }

    setupElements() {
        this.fileExplorer = document.getElementById('file-explorer');
        this.editorContainer = document.querySelector('.editor-container');
        this.editorTabs = document.querySelector('.editor-tabs');
        this.livePreview = document.getElementById('live-preview');
    }

    setupEventListeners() {
        // Add file button
        const addFileBtn = document.getElementById('add-file');
        if (addFileBtn) {
            addFileBtn.addEventListener('click', () => this.showNewFileDialog());
        }

        // Refresh preview button
        const refreshBtn = document.getElementById('refresh-preview');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.updatePreview());
        }
    }

    initializeFileSystem() {
        this.fileTree = {
            'index.html': {
                type: 'file',
                content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Project</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <div class="container">
        <h1>Welcome to My Project</h1>
        <p>Start editing to see changes in the preview!</p>
        <button onclick="showAlert()">Click Me</button>
    </div>
    <script src="script.js"></script>
</body>
</html>`,
                language: 'html'
            },
            'styles.css': {
                type: 'file',
                content: `/* My Project Styles */
body {
    font-family: 'Noto Sans JP', sans-serif;
    margin: 0;
    padding: 0;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
}

.container {
    background: white;
    padding: 2rem;
    border-radius: 1rem;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    text-align: center;
    max-width: 500px;
}

h1 {
    color: #333;
    margin-bottom: 1rem;
}

p {
    color: #666;
    margin-bottom: 2rem;
    line-height: 1.6;
}

button {
    background: #667eea;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s ease;
}

button:hover {
    background: #5a6fd8;
}`,
                language: 'css'
            },
            'script.js': {
                type: 'file',
                content: `// My Project JavaScript
console.log('Project loaded successfully!');

function showAlert() {
    alert('Hello from Nexus Canvas!');
}

// Add some interactivity
document.addEventListener('DOMContentLoaded', function() {
    const button = document.querySelector('button');
    
    if (button) {
        button.addEventListener('mouseenter', function() {
            this.style.transform = 'scale(1.05)';
        });
        
        button.addEventListener('mouseleave', function() {
            this.style.transform = 'scale(1)';
        });
    }
});`,
                language: 'javascript'
            }
        };

        this.renderFileTree();
        this.openFile('index.html');
    }

    renderFileTree() {
        if (!this.fileExplorer) return;

        let html = '<ul class="file-tree">';
        
        Object.entries(this.fileTree).forEach(([name, file]) => {
            const icon = this.getFileIcon(name);
            const activeClass = this.activeFile === name ? 'active' : '';
            
            html += `
                <li class="file-item ${activeClass}" data-file="${name}">
                    <span class="file-icon">${icon}</span>
                    <span class="file-name">${name}</span>
                </li>
            `;
        });
        
        html += '</ul>';
        this.fileExplorer.innerHTML = html;

        // Add click listeners
        const fileItems = this.fileExplorer.querySelectorAll('.file-item');
        fileItems.forEach(item => {
            item.addEventListener('click', () => {
                this.openFile(item.dataset.file);
            });
        });
    }

    getFileIcon(filename) {
        const ext = this.utils.getFileExtension(filename);
        const icons = {
            html: '🌐',
            css: '🎨',
            js: '⚡',
            json: '📋',
            md: '📝',
            txt: '📄',
            png: '🖼️',
            jpg: '🖼️',
            jpeg: '🖼️',
            gif: '🖼️',
            svg: '🎭'
        };
        return icons[ext] || '📄';
    }

    openFile(filename) {
        const file = this.fileTree[filename];
        if (!file) return;

        this.activeFile = filename;
        
        // Update file tree
        this.renderFileTree();
        
        // Add to open files if not already open
        if (!this.openFiles.has(filename)) {
            this.openFiles.set(filename, {
                name: filename,
                content: file.content,
                language: file.language,
                modified: false
            });
        }

        // Update tabs
        this.renderTabs();
        
        // Show editor
        this.showEditor(filename);
        
        // Update preview if HTML file
        if (filename.endsWith('.html')) {
            this.updatePreview();
        }
    }

    renderTabs() {
        if (!this.editorTabs) return;

        let html = '';
        
        this.openFiles.forEach((file, filename) => {
            const activeClass = this.activeFile === filename ? 'active' : '';
            const modifiedIndicator = file.modified ? '●' : '';
            
            html += `
                <div class="editor-tab ${activeClass}" data-file="${filename}">
                    <span class="tab-icon">${this.getFileIcon(filename)}</span>
                    <span class="tab-name">${filename}</span>
                    <span class="tab-modified">${modifiedIndicator}</span>
                    <button class="tab-close" data-file="${filename}">&times;</button>
                </div>
            `;
        });

        this.editorTabs.innerHTML = html;

        // Add event listeners
        const tabs = this.editorTabs.querySelectorAll('.editor-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                if (!e.target.classList.contains('tab-close')) {
                    this.openFile(tab.dataset.file);
                }
            });
        });

        const closeBtns = this.editorTabs.querySelectorAll('.tab-close');
        closeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.closeFile(btn.dataset.file);
            });
        });
    }

    showEditor(filename) {
        if (!this.editorContainer) return;

        const file = this.openFiles.get(filename);
        if (!file) return;

        // Create editor if it doesn't exist
        let editor = this.editorContainer.querySelector(`[data-editor="${filename}"]`);
        
        if (!editor) {
            editor = document.createElement('div');
            editor.className = 'code-editor-instance';
            editor.dataset.editor = filename;
            
            const textarea = document.createElement('textarea');
            textarea.className = 'code-textarea';
            textarea.value = file.content;
            textarea.spellcheck = false;
            
            // Add syntax highlighting container
            const highlightContainer = document.createElement('div');
            highlightContainer.className = 'syntax-highlight';
            
            const lineNumbers = document.createElement('div');
            lineNumbers.className = 'line-numbers';
            
            editor.appendChild(lineNumbers);
            editor.appendChild(highlightContainer);
            editor.appendChild(textarea);
            
            this.editorContainer.appendChild(editor);
            
            // Setup editor functionality
            this.setupEditor(textarea, highlightContainer, lineNumbers, filename);
        }

        // Hide all editors
        const editors = this.editorContainer.querySelectorAll('.code-editor-instance');
        editors.forEach(ed => ed.style.display = 'none');

        // Show current editor
        editor.style.display = 'block';
        
        // Focus textarea
        const textarea = editor.querySelector('.code-textarea');
        if (textarea) {
            textarea.focus();
        }
    }

    setupEditor(textarea, highlightContainer, lineNumbers, filename) {
        const file = this.openFiles.get(filename);
        
        // Update content and highlighting
        const updateEditor = () => {
            const content = textarea.value;
            file.content = content;
            file.modified = this.fileTree[filename].content !== content;
            
            this.updateSyntaxHighlighting(highlightContainer, content, file.language);
            this.updateLineNumbers(lineNumbers, content);
            this.renderTabs();
            
            // Auto-update preview for HTML files
            if (filename.endsWith('.html')) {
                this.utils.debounce(() => this.updatePreview(), 500)();
            }
        };

        // Input event
        textarea.addEventListener('input', updateEditor);
        
        // Scroll synchronization
        textarea.addEventListener('scroll', () => {
            highlightContainer.scrollTop = textarea.scrollTop;
            highlightContainer.scrollLeft = textarea.scrollLeft;
            lineNumbers.scrollTop = textarea.scrollTop;
        });

        // Tab key handling
        textarea.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                e.preventDefault();
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                
                textarea.value = textarea.value.substring(0, start) + '    ' + textarea.value.substring(end);
                textarea.selectionStart = textarea.selectionEnd = start + 4;
                
                updateEditor();
            }
        });

        // Initial update
        updateEditor();
    }

    updateSyntaxHighlighting(container, content, language) {
        const highlighted = this.highlightSyntax(content, language);
        container.innerHTML = highlighted;
    }

    highlightSyntax(content, language) {
        if (!content) return '';

        let highlighted = this.utils.sanitizeHTML(content);

        switch (language) {
            case 'html':
                highlighted = this.highlightHTML(highlighted);
                break;
            case 'css':
                highlighted = this.highlightCSS(highlighted);
                break;
            case 'javascript':
                highlighted = this.highlightJavaScript(highlighted);
                break;
        }

        return highlighted;
    }

    highlightHTML(content) {
        return content
            .replace(/(&lt;\/?[^&gt;]+&gt;)/g, '<span class="html-tag">$1</span>')
            .replace(/(\w+)=/g, '<span class="html-attr">$1</span>=')
            .replace(/="([^"]*)"/g, '="<span class="html-value">$1</span>"')
            .replace(/(&lt;!--.*?--&gt;)/gs, '<span class="html-comment">$1</span>');
    }

    highlightCSS(content) {
        return content
            .replace(/(\/\*.*?\*\/)/gs, '<span class="css-comment">$1</span>')
            .replace(/([.#]?[\w-]+)\s*{/g, '<span class="css-selector">$1</span> {')
            .replace(/([\w-]+):/g, '<span class="css-property">$1</span>:')
            .replace(/:\s*([^;]+);/g, ': <span class="css-value">$1</span>;');
    }

    highlightJavaScript(content) {
        const keywords = ['function', 'var', 'let', 'const', 'if', 'else', 'for', 'while', 'return', 'class', 'import', 'export', 'default'];
        
        let highlighted = content
            .replace(/(\/\/.*$)/gm, '<span class="js-comment">$1</span>')
            .replace(/(\/\*.*?\*\/)/gs, '<span class="js-comment">$1</span>')
            .replace(/('.*?'|".*?")/g, '<span class="js-string">$1</span>');

        keywords.forEach(keyword => {
            const regex = new RegExp(`\\b(${keyword})\\b`, 'g');
            highlighted = highlighted.replace(regex, '<span class="js-keyword">$1</span>');
        });

        return highlighted;
    }

    updateLineNumbers(container, content) {
        const lines = content.split('\n').length;
        let html = '';
        
        for (let i = 1; i <= lines; i++) {
            html += `<div class="line-number">${i}</div>`;
        }
        
        container.innerHTML = html;
    }

    closeFile(filename) {
        const file = this.openFiles.get(filename);
        
        if (file && file.modified) {
            if (!confirm(`${filename} has unsaved changes. Close anyway?`)) {
                return;
            }
        }

        this.openFiles.delete(filename);
        
        // Remove editor
        const editor = this.editorContainer.querySelector(`[data-editor="${filename}"]`);
        if (editor) {
            editor.remove();
        }

        // Switch to another file if this was active
        if (this.activeFile === filename) {
            const remainingFiles = Array.from(this.openFiles.keys());
            if (remainingFiles.length > 0) {
                this.openFile(remainingFiles[0]);
            } else {
                this.activeFile = null;
                this.showWelcomeScreen();
            }
        }

        this.renderTabs();
    }

    showWelcomeScreen() {
        if (!this.editorContainer) return;

        this.editorContainer.innerHTML = `
            <div class="editor-placeholder">
                <h3>Welcome to Code Studio</h3>
                <p>Create or open a file to start coding</p>
                <button class="btn btn-primary" onclick="window.nexusCanvas.studios.codeEditor.showNewFileDialog()">
                    Create New File
                </button>
            </div>
        `;
    }

    showNewFileDialog() {
        const filename = prompt('Enter filename (e.g., script.js, styles.css):');
        if (!filename) return;

        if (this.fileTree[filename]) {
            this.app.showNotification('File already exists', 'warning');
            return;
        }

        const extension = this.utils.getFileExtension(filename);
        const language = this.getLanguageFromExtension(extension);
        
        this.fileTree[filename] = {
            type: 'file',
            content: this.getTemplateContent(language),
            language: language
        };

        this.renderFileTree();
        this.openFile(filename);
        
        this.app.showNotification(`Created ${filename}`, 'success');
    }

    getLanguageFromExtension(ext) {
        const languages = {
            html: 'html',
            css: 'css',
            js: 'javascript',
            json: 'json',
            md: 'markdown',
            txt: 'text'
        };
        return languages[ext] || 'text';
    }

    getTemplateContent(language) {
        const templates = {
            html: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    
</body>
</html>`,
            css: `/* Stylesheet */
body {
    margin: 0;
    padding: 0;
    font-family: 'Noto Sans JP', sans-serif;
}`,
            javascript: `// JavaScript file
console.log('Hello, World!');`,
            json: `{
    "name": "my-project",
    "version": "1.0.0"
}`,
            markdown: `# My Document

This is a markdown file.`,
            text: ''
        };
        return templates[language] || '';
    }

    updatePreview() {
        if (!this.livePreview) return;

        const htmlFile = this.openFiles.get('index.html') || this.fileTree['index.html'];
        const cssFile = this.openFiles.get('styles.css') || this.fileTree['styles.css'];
        const jsFile = this.openFiles.get('script.js') || this.fileTree['script.js'];

        if (!htmlFile) return;

        let html = htmlFile.content;
        
        // Inject CSS
        if (cssFile) {
            html = html.replace('</head>', `<style>${cssFile.content}</style></head>`);
        }
        
        // Inject JS
        if (jsFile) {
            html = html.replace('</body>', `<script>${jsFile.content}</script></body>`);
        }

        // Update iframe
        const doc = this.livePreview.contentDocument || this.livePreview.contentWindow.document;
        doc.open();
        doc.write(html);
        doc.close();
    }

    async saveProject() {
        const projectData = {
            type: 'code-editor',
            name: this.currentProject?.name || 'Untitled Project',
            data: {
                fileTree: this.fileTree,
                openFiles: Array.from(this.openFiles.entries()),
                activeFile: this.activeFile
            }
        };

        try {
            const projectId = await this.storage.saveProject(projectData);
            this.currentProject = { ...projectData, id: projectId };
            
            // Mark all files as saved
            this.openFiles.forEach(file => {
                file.modified = false;
            });
            this.renderTabs();
            
            this.app.showNotification('Project saved!', 'success');
        } catch (error) {
            console.error('Failed to save project:', error);
            this.app.showNotification('Failed to save project', 'error');
        }
    }

    async loadProject(projectId) {
        try {
            const project = await this.storage.getProject(projectId);
            if (project && project.type === 'code-editor') {
                this.currentProject = project;
                this.fileTree = project.data.fileTree || {};
                
                // Restore open files
                this.openFiles.clear();
                if (project.data.openFiles) {
                    project.data.openFiles.forEach(([filename, file]) => {
                        this.openFiles.set(filename, file);
                    });
                }
                
                this.renderFileTree();
                this.renderTabs();
                
                if (project.data.activeFile) {
                    this.openFile(project.data.activeFile);
                } else if (this.openFiles.size > 0) {
                    this.openFile(Array.from(this.openFiles.keys())[0]);
                }
                
                this.app.showNotification('Project loaded!', 'success');
            }
        } catch (error) {
            console.error('Failed to load project:', error);
            this.app.showNotification('Failed to load project', 'error');
        }
    }

    async loadLastProject() {
        try {
            const projects = await this.storage.getProjectsByType('code-editor');
            if (projects.length > 0) {
                const lastProject = projects.sort((a, b) => b.modified - a.modified)[0];
                await this.loadProject(lastProject.id);
            }
        } catch (error) {
            console.warn('Could not load last project:', error);
        }
    }

    newProject() {
        this.currentProject = null;
        this.openFiles.clear();
        this.activeFile = null;
        this.initializeFileSystem();
        
        this.app.showNotification('New project created', 'success');
    }

    async exportProject() {
        const files = [];
        
        Object.entries(this.fileTree).forEach(([filename, file]) => {
            files.push({
                name: filename,
                content: file.content
            });
        });

        try {
            if ('showDirectoryPicker' in window) {
                const dirHandle = await window.showDirectoryPicker();
                
                for (const file of files) {
                    const fileHandle = await dirHandle.getFileHandle(file.name, { create: true });
                    const writable = await fileHandle.createWritable();
                    await writable.write(file.content);
                    await writable.close();
                }
                
                this.app.showNotification('Project exported successfully!', 'success');
            } else {
                // Fallback: download individual files
                files.forEach(file => {
                    this.utils.downloadText(file.content, file.name);
                });
                this.app.showNotification('Files downloaded individually', 'info');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.app.showNotification('Export failed', 'error');
        }
    }

    // Studio lifecycle methods
    onActivate() {
        if (this.activeFile) {
            this.updatePreview();
        }
    }

    onPause() {
        if (this.currentProject) {
            this.saveProject();
        }
    }

    onResume() {
        // Refresh preview in case external changes occurred
        this.updatePreview();
    }

    handleKeyboard(e) {
        if ((e.ctrlKey || e.metaKey)) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveProject();
                    break;
                case 'n':
                    e.preventDefault();
                    this.showNewFileDialog();
                    break;
                case 'w':
                    e.preventDefault();
                    if (this.activeFile) {
                        this.closeFile(this.activeFile);
                    }
                    break;
            }
        }
    }
}

// Add syntax highlighting styles
const syntaxStyles = `
    .code-editor-instance {
        position: relative;
        height: 100%;
        display: flex;
        background: #1e1e1e;
        color: #d4d4d4;
        font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
        font-size: 14px;
        line-height: 1.5;
    }

    .line-numbers {
        background: #252526;
        color: #858585;
        padding: 10px 8px;
        text-align: right;
        user-select: none;
        min-width: 50px;
        border-right: 1px solid #3e3e3e;
        overflow: hidden;
    }

    .line-number {
        height: 21px;
        line-height: 21px;
    }

    .syntax-highlight {
        position: absolute;
        top: 0;
        left: 58px;
        right: 0;
        bottom: 0;
        padding: 10px;
        white-space: pre;
        overflow: auto;
        pointer-events: none;
        color: transparent;
    }

    .code-textarea {
        position: absolute;
        top: 0;
        left: 58px;
        right: 0;
        bottom: 0;
        background: transparent;
        border: none;
        outline: none;
        resize: none;
        padding: 10px;
        color: #d4d4d4;
        font-family: inherit;
        font-size: inherit;
        line-height: inherit;
        white-space: pre;
        overflow: auto;
        caret-color: #d4d4d4;
    }

    /* Syntax highlighting colors */
    .html-tag { color: #569cd6; }
    .html-attr { color: #9cdcfe; }
    .html-value { color: #ce9178; }
    .html-comment { color: #6a9955; }

    .css-selector { color: #d7ba7d; }
    .css-property { color: #9cdcfe; }
    .css-value { color: #ce9178; }
    .css-comment { color: #6a9955; }

    .js-keyword { color: #569cd6; }
    .js-string { color: #ce9178; }
    .js-comment { color: #6a9955; }

    .editor-placeholder {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        text-align: center;
        color: var(--text-muted);
    }

    .editor-placeholder h3 {
        margin-bottom: var(--space-4);
        color: var(--text-primary);
    }

    .editor-placeholder p {
        margin-bottom: var(--space-6);
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = syntaxStyles;
document.head.appendChild(styleSheet);