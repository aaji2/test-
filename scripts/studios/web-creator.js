// Nexus Canvas - Web Creator Studio
// Visual website builder with drag-and-drop components

export class WebCreatorStudio {
    constructor(app) {
        this.app = app;
        this.storage = app.getStorage();
        this.utils = app.getUtils();
        
        this.currentProject = null;
        this.selectedElement = null;
        this.currentDevice = 'desktop';
        this.components = {};
        this.history = [];
        this.historyIndex = -1;
        
        this.canvas = null;
        this.propertiesPanel = null;
        this.componentLibrary = null;
    }

    async init() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.initializeComponents();
            this.loadLastProject();
            
            console.log('Web Creator Studio initialized');
        } catch (error) {
            console.error('Failed to initialize Web Creator Studio:', error);
            throw error;
        }
    }

    setupElements() {
        this.canvas = document.getElementById('design-canvas');
        this.propertiesPanel = document.getElementById('properties-panel');
        this.componentLibrary = document.querySelector('.component-library');
    }

    setupEventListeners() {
        // Device preview buttons
        const deviceBtns = document.querySelectorAll('.device-btn');
        deviceBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.switchDevice(btn.dataset.device);
            });
        });

        // Canvas actions
        const previewBtn = document.getElementById('preview-btn');
        const exportBtn = document.getElementById('export-btn');
        
        if (previewBtn) {
            previewBtn.addEventListener('click', () => this.previewProject());
        }
        
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportProject());
        }

        // Component drag and drop
        this.setupDragAndDrop();

        // Canvas click handling
        if (this.canvas) {
            this.canvas.addEventListener('click', (e) => {
                this.handleCanvasClick(e);
            });
        }
    }

    initializeComponents() {
        this.components = {
            container: {
                name: 'Container',
                icon: '📦',
                html: '<div class="container">Container</div>',
                styles: {
                    'max-width': '1200px',
                    'margin': '0 auto',
                    'padding': '20px',
                    'background': '#f8f9fa',
                    'border-radius': '8px'
                },
                properties: {
                    'max-width': { type: 'text', label: 'Max Width' },
                    'padding': { type: 'text', label: 'Padding' },
                    'background': { type: 'color', label: 'Background' },
                    'border-radius': { type: 'text', label: 'Border Radius' }
                }
            },
            section: {
                name: 'Section',
                icon: '📄',
                html: '<section class="section">Section Content</section>',
                styles: {
                    'padding': '40px 20px',
                    'margin': '20px 0',
                    'background': '#ffffff',
                    'border': '1px solid #e9ecef'
                },
                properties: {
                    'padding': { type: 'text', label: 'Padding' },
                    'margin': { type: 'text', label: 'Margin' },
                    'background': { type: 'color', label: 'Background' },
                    'border': { type: 'text', label: 'Border' }
                }
            },
            grid: {
                name: 'Grid',
                icon: '⚏',
                html: '<div class="grid"><div class="grid-item">Item 1</div><div class="grid-item">Item 2</div><div class="grid-item">Item 3</div></div>',
                styles: {
                    'display': 'grid',
                    'grid-template-columns': 'repeat(3, 1fr)',
                    'gap': '20px',
                    'padding': '20px'
                },
                properties: {
                    'grid-template-columns': { type: 'text', label: 'Columns' },
                    'gap': { type: 'text', label: 'Gap' },
                    'padding': { type: 'text', label: 'Padding' }
                }
            },
            text: {
                name: 'Text',
                icon: '📝',
                html: '<p class="text">Your text here</p>',
                styles: {
                    'font-size': '16px',
                    'line-height': '1.6',
                    'color': '#333333',
                    'margin': '10px 0'
                },
                properties: {
                    'font-size': { type: 'text', label: 'Font Size' },
                    'line-height': { type: 'text', label: 'Line Height' },
                    'color': { type: 'color', label: 'Color' },
                    'font-weight': { type: 'select', label: 'Font Weight', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
                    'text-align': { type: 'select', label: 'Text Align', options: ['left', 'center', 'right', 'justify'] }
                }
            },
            heading: {
                name: 'Heading',
                icon: '📰',
                html: '<h2 class="heading">Your Heading</h2>',
                styles: {
                    'font-size': '32px',
                    'font-weight': '600',
                    'color': '#333333',
                    'margin': '20px 0 10px 0',
                    'line-height': '1.3'
                },
                properties: {
                    'font-size': { type: 'text', label: 'Font Size' },
                    'font-weight': { type: 'select', label: 'Font Weight', options: ['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900'] },
                    'color': { type: 'color', label: 'Color' },
                    'text-align': { type: 'select', label: 'Text Align', options: ['left', 'center', 'right'] }
                }
            },
            image: {
                name: 'Image',
                icon: '🖼️',
                html: '<img class="image" src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIFBsYWNlaG9sZGVyPC90ZXh0Pjwvc3ZnPg==" alt="Image">',
                styles: {
                    'max-width': '100%',
                    'height': 'auto',
                    'border-radius': '8px',
                    'margin': '10px 0'
                },
                properties: {
                    'src': { type: 'text', label: 'Image URL' },
                    'alt': { type: 'text', label: 'Alt Text' },
                    'width': { type: 'text', label: 'Width' },
                    'height': { type: 'text', label: 'Height' },
                    'border-radius': { type: 'text', label: 'Border Radius' }
                }
            },
            button: {
                name: 'Button',
                icon: '🔘',
                html: '<button class="button">Click Me</button>',
                styles: {
                    'padding': '12px 24px',
                    'background': '#007bff',
                    'color': '#ffffff',
                    'border': 'none',
                    'border-radius': '6px',
                    'font-size': '16px',
                    'font-weight': '500',
                    'cursor': 'pointer',
                    'transition': 'all 0.3s ease'
                },
                properties: {
                    'padding': { type: 'text', label: 'Padding' },
                    'background': { type: 'color', label: 'Background' },
                    'color': { type: 'color', label: 'Text Color' },
                    'border-radius': { type: 'text', label: 'Border Radius' },
                    'font-size': { type: 'text', label: 'Font Size' }
                }
            },
            navbar: {
                name: 'Navbar',
                icon: '🧭',
                html: '<nav class="navbar"><div class="nav-brand">Brand</div><ul class="nav-menu"><li><a href="#">Home</a></li><li><a href="#">About</a></li><li><a href="#">Contact</a></li></ul></nav>',
                styles: {
                    'display': 'flex',
                    'justify-content': 'space-between',
                    'align-items': 'center',
                    'padding': '15px 30px',
                    'background': '#ffffff',
                    'border-bottom': '1px solid #e9ecef',
                    'box-shadow': '0 2px 4px rgba(0,0,0,0.1)'
                },
                properties: {
                    'padding': { type: 'text', label: 'Padding' },
                    'background': { type: 'color', label: 'Background' },
                    'border-bottom': { type: 'text', label: 'Border Bottom' }
                }
            },
            menu: {
                name: 'Menu',
                icon: '☰',
                html: '<ul class="menu"><li class="menu-item"><a href="#">Menu Item 1</a></li><li class="menu-item"><a href="#">Menu Item 2</a></li><li class="menu-item"><a href="#">Menu Item 3</a></li></ul>',
                styles: {
                    'list-style': 'none',
                    'padding': '0',
                    'margin': '0',
                    'background': '#f8f9fa',
                    'border-radius': '8px',
                    'overflow': 'hidden'
                },
                properties: {
                    'background': { type: 'color', label: 'Background' },
                    'border-radius': { type: 'text', label: 'Border Radius' },
                    'padding': { type: 'text', label: 'Padding' }
                }
            }
        };
    }

    setupDragAndDrop() {
        // Make component items draggable
        const componentItems = document.querySelectorAll('.component-item');
        componentItems.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', item.dataset.component);
                e.dataTransfer.effectAllowed = 'copy';
            });
        });

        // Setup canvas drop zone
        if (this.canvas) {
            this.canvas.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'copy';
                this.canvas.classList.add('drag-over');
            });

            this.canvas.addEventListener('dragleave', (e) => {
                if (!this.canvas.contains(e.relatedTarget)) {
                    this.canvas.classList.remove('drag-over');
                }
            });

            this.canvas.addEventListener('drop', (e) => {
                e.preventDefault();
                this.canvas.classList.remove('drag-over');
                
                const componentType = e.dataTransfer.getData('text/plain');
                if (componentType && this.components[componentType]) {
                    this.addComponent(componentType, e.clientX, e.clientY);
                }
            });
        }
    }

    addComponent(type, x = 0, y = 0) {
        const component = this.components[type];
        if (!component) return;

        // Create element
        const element = document.createElement('div');
        element.className = `component component-${type}`;
        element.dataset.componentType = type;
        element.dataset.componentId = this.utils.generateId('comp');
        element.innerHTML = component.html;

        // Apply styles
        Object.entries(component.styles).forEach(([property, value]) => {
            element.style[property] = value;
        });

        // Make element selectable and editable
        element.style.position = 'relative';
        element.style.cursor = 'pointer';
        element.style.outline = '2px solid transparent';
        element.style.transition = 'outline 0.2s ease';

        // Add to canvas
        const canvasContent = this.canvas.querySelector('.canvas-content');
        if (canvasContent) {
            canvasContent.appendChild(element);
        }

        // Select the new element
        this.selectElement(element);

        // Save state
        this.saveState();

        // Show notification
        this.app.showNotification(`Added ${component.name} component`, 'success');
    }

    selectElement(element) {
        // Deselect previous element
        if (this.selectedElement) {
            this.selectedElement.style.outline = '2px solid transparent';
            this.selectedElement.classList.remove('selected');
        }

        // Select new element
        this.selectedElement = element;
        if (element) {
            element.style.outline = '2px solid #007bff';
            element.classList.add('selected');
            this.updatePropertiesPanel();
        } else {
            this.clearPropertiesPanel();
        }
    }

    updatePropertiesPanel() {
        if (!this.selectedElement || !this.propertiesPanel) return;

        const componentType = this.selectedElement.dataset.componentType;
        const component = this.components[componentType];
        
        if (!component) return;

        let html = `
            <div class="property-group">
                <h4>${component.name} Properties</h4>
        `;

        // Content properties
        if (this.selectedElement.textContent && componentType !== 'image') {
            html += `
                <div class="property-row">
                    <label class="property-label">Content</label>
                    <input type="text" class="property-input" data-property="textContent" value="${this.selectedElement.textContent}">
                </div>
            `;
        }

        // Style properties
        Object.entries(component.properties).forEach(([property, config]) => {
            const currentValue = this.selectedElement.style[property] || '';
            
            html += `
                <div class="property-row">
                    <label class="property-label">${config.label}</label>
            `;

            switch (config.type) {
                case 'color':
                    html += `<input type="color" class="property-input" data-property="${property}" value="${this.extractColorValue(currentValue)}">`;
                    break;
                case 'select':
                    html += `<select class="property-input" data-property="${property}">`;
                    config.options.forEach(option => {
                        const selected = currentValue === option ? 'selected' : '';
                        html += `<option value="${option}" ${selected}>${option}</option>`;
                    });
                    html += `</select>`;
                    break;
                default:
                    html += `<input type="text" class="property-input" data-property="${property}" value="${currentValue}">`;
            }

            html += `</div>`;
        });

        // Special properties for images
        if (componentType === 'image') {
            const img = this.selectedElement.querySelector('img');
            if (img) {
                html += `
                    <div class="property-row">
                        <label class="property-label">Image URL</label>
                        <input type="text" class="property-input" data-property="src" value="${img.src}">
                    </div>
                    <div class="property-row">
                        <label class="property-label">Alt Text</label>
                        <input type="text" class="property-input" data-property="alt" value="${img.alt}">
                    </div>
                `;
            }
        }

        html += `
            </div>
            <div class="property-group">
                <h4>Actions</h4>
                <button class="btn btn-secondary" onclick="window.nexusCanvas.studios.webCreator.duplicateElement()">Duplicate</button>
                <button class="btn btn-secondary" onclick="window.nexusCanvas.studios.webCreator.deleteElement()">Delete</button>
            </div>
        `;

        this.propertiesPanel.innerHTML = html;

        // Add event listeners to property inputs
        const propertyInputs = this.propertiesPanel.querySelectorAll('.property-input');
        propertyInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                this.updateElementProperty(e.target.dataset.property, e.target.value);
            });
        });
    }

    clearPropertiesPanel() {
        if (this.propertiesPanel) {
            this.propertiesPanel.innerHTML = `
                <div class="no-selection">
                    <p>Select an element to edit its properties</p>
                </div>
            `;
        }
    }

    updateElementProperty(property, value) {
        if (!this.selectedElement) return;

        if (property === 'textContent') {
            this.selectedElement.textContent = value;
        } else if (property === 'src' || property === 'alt') {
            const img = this.selectedElement.querySelector('img');
            if (img) {
                img[property] = value;
            }
        } else {
            this.selectedElement.style[property] = value;
        }

        this.saveState();
    }

    extractColorValue(cssValue) {
        // Extract hex color from CSS value
        if (cssValue.startsWith('#')) return cssValue;
        if (cssValue.startsWith('rgb')) {
            // Convert rgb to hex
            const match = cssValue.match(/\d+/g);
            if (match && match.length >= 3) {
                const r = parseInt(match[0]);
                const g = parseInt(match[1]);
                const b = parseInt(match[2]);
                return this.utils.rgbToHex(r, g, b);
            }
        }
        return '#000000';
    }

    duplicateElement() {
        if (!this.selectedElement) return;

        const clone = this.selectedElement.cloneNode(true);
        clone.dataset.componentId = this.utils.generateId('comp');
        clone.style.transform = 'translate(20px, 20px)';
        
        this.selectedElement.parentNode.insertBefore(clone, this.selectedElement.nextSibling);
        this.selectElement(clone);
        this.saveState();
        
        this.app.showNotification('Element duplicated', 'success');
    }

    deleteElement() {
        if (!this.selectedElement) return;

        this.selectedElement.remove();
        this.selectedElement = null;
        this.clearPropertiesPanel();
        this.saveState();
        
        this.app.showNotification('Element deleted', 'success');
    }

    handleCanvasClick(e) {
        // Find the clicked component
        let target = e.target;
        while (target && target !== this.canvas) {
            if (target.classList.contains('component')) {
                this.selectElement(target);
                return;
            }
            target = target.parentNode;
        }

        // Clicked on empty canvas
        this.selectElement(null);
    }

    switchDevice(device) {
        this.currentDevice = device;
        
        // Update device buttons
        const deviceBtns = document.querySelectorAll('.device-btn');
        deviceBtns.forEach(btn => {
            if (btn.dataset.device === device) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update canvas
        if (this.canvas) {
            this.canvas.dataset.device = device;
        }
    }

    previewProject() {
        const html = this.generateHTML();
        const css = this.generateCSS();
        const js = this.generateJS();

        const previewContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Preview</title>
                <style>${css}</style>
            </head>
            <body>
                ${html}
                <script>${js}</script>
            </body>
            </html>
        `;

        // Open in new window
        const previewWindow = window.open('', '_blank');
        previewWindow.document.write(previewContent);
        previewWindow.document.close();
    }

    async exportProject() {
        const html = this.generateHTML();
        const css = this.generateCSS();
        const js = this.generateJS();

        const files = [
            { name: 'index.html', content: this.generateCompleteHTML(html, css, js) },
            { name: 'styles.css', content: css },
            { name: 'script.js', content: js }
        ];

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
                // Fallback: download as zip
                this.downloadAsZip(files);
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.app.showNotification('Export failed', 'error');
        }
    }

    generateHTML() {
        const canvasContent = this.canvas.querySelector('.canvas-content');
        if (!canvasContent) return '';

        let html = '';
        const components = canvasContent.querySelectorAll('.component');
        
        components.forEach(component => {
            html += component.innerHTML + '\n';
        });

        return html;
    }

    generateCSS() {
        const canvasContent = this.canvas.querySelector('.canvas-content');
        if (!canvasContent) return '';

        let css = `
            /* Generated by Nexus Canvas */
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Noto Sans JP', sans-serif;
                line-height: 1.6;
                color: #333;
            }
        `;

        const components = canvasContent.querySelectorAll('.component');
        
        components.forEach((component, index) => {
            const componentId = component.dataset.componentId;
            css += `\n/* Component ${index + 1} */\n`;
            css += `[data-component-id="${componentId}"] {\n`;
            
            // Extract inline styles
            const styles = component.style;
            for (let i = 0; i < styles.length; i++) {
                const property = styles[i];
                const value = styles.getPropertyValue(property);
                css += `    ${property}: ${value};\n`;
            }
            
            css += `}\n`;
        });

        return css;
    }

    generateJS() {
        return `
            // Generated by Nexus Canvas
            document.addEventListener('DOMContentLoaded', function() {
                console.log('Website loaded successfully!');
                
                // Add interactive behaviors
                const buttons = document.querySelectorAll('button');
                buttons.forEach(button => {
                    button.addEventListener('click', function() {
                        console.log('Button clicked:', this.textContent);
                    });
                });
            });
        `;
    }

    generateCompleteHTML(html, css, js) {
        return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>My Website</title>
    <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    ${html}
    <script src="script.js"></script>
</body>
</html>`;
    }

    downloadAsZip(files) {
        // Simple fallback - download individual files
        files.forEach(file => {
            this.utils.downloadText(file.content, file.name);
        });
        
        this.app.showNotification('Files downloaded individually', 'info');
    }

    saveState() {
        if (!this.canvas) return;

        const state = {
            html: this.canvas.innerHTML,
            device: this.currentDevice,
            timestamp: Date.now()
        };

        // Add to history
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex = this.history.length - 1;

        // Limit history size
        if (this.history.length > 50) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreState(this.history[this.historyIndex]);
            this.app.showNotification('Undone', 'info');
        }
    }

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreState(this.history[this.historyIndex]);
            this.app.showNotification('Redone', 'info');
        }
    }

    restoreState(state) {
        if (this.canvas && state) {
            this.canvas.innerHTML = state.html;
            this.switchDevice(state.device);
            this.selectElement(null);
        }
    }

    async saveProject() {
        const projectData = {
            type: 'web-creator',
            name: this.currentProject?.name || 'Untitled Website',
            data: {
                html: this.canvas.innerHTML,
                device: this.currentDevice,
                history: this.history
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
            if (project && project.type === 'web-creator') {
                this.currentProject = project;
                
                if (this.canvas) {
                    this.canvas.innerHTML = project.data.html || '';
                }
                
                this.switchDevice(project.data.device || 'desktop');
                this.history = project.data.history || [];
                this.historyIndex = this.history.length - 1;
                
                this.selectElement(null);
                this.app.showNotification('Project loaded!', 'success');
            }
        } catch (error) {
            console.error('Failed to load project:', error);
            this.app.showNotification('Failed to load project', 'error');
        }
    }

    async loadLastProject() {
        try {
            const projects = await this.storage.getProjectsByType('web-creator');
            if (projects.length > 0) {
                // Load the most recently modified project
                const lastProject = projects.sort((a, b) => b.modified - a.modified)[0];
                await this.loadProject(lastProject.id);
            }
        } catch (error) {
            console.warn('Could not load last project:', error);
        }
    }

    newProject() {
        this.currentProject = null;
        if (this.canvas) {
            this.canvas.innerHTML = '<div class="canvas-content"></div>';
        }
        this.history = [];
        this.historyIndex = -1;
        this.selectElement(null);
        this.switchDevice('desktop');
        
        this.app.showNotification('New project created', 'success');
    }

    // Studio lifecycle methods
    onActivate() {
        // Called when studio becomes active
        this.setupDragAndDrop();
    }

    onPause() {
        // Called when app is paused
        if (this.currentProject) {
            this.saveProject();
        }
    }

    onResume() {
        // Called when app resumes
    }

    handleKeyboard(e) {
        // Handle keyboard shortcuts
        if ((e.ctrlKey || e.metaKey)) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    this.saveProject();
                    break;
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 'd':
                    e.preventDefault();
                    this.duplicateElement();
                    break;
                case 'Delete':
                case 'Backspace':
                    if (this.selectedElement) {
                        e.preventDefault();
                        this.deleteElement();
                    }
                    break;
            }
        }
    }
}

// Add drag-over styles
const dragStyles = `
    .design-canvas.drag-over {
        background: rgba(0, 123, 255, 0.1);
        border: 2px dashed #007bff;
    }
    
    .component.selected {
        position: relative;
    }
    
    .component.selected::after {
        content: '';
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px solid #007bff;
        pointer-events: none;
        border-radius: 4px;
    }
`;

const styleSheet = document.createElement('style');
styleSheet.textContent = dragStyles;
document.head.appendChild(styleSheet);