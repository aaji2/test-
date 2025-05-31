// Nexus Canvas - Image Editor Studio
// Professional image editing with layers, filters, and drawing tools

export class ImageEditorStudio {
    constructor(app) {
        this.app = app;
        this.storage = app.getStorage();
        this.utils = app.getUtils();
        
        this.canvas = null;
        this.ctx = null;
        this.currentTool = 'select';
        this.currentImage = null;
        this.layers = [];
        this.activeLayer = null;
        this.history = [];
        this.historyIndex = -1;
        
        this.zoom = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDrawing = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.brushSize = 5;
        this.brushColor = '#000000';
        this.brushOpacity = 1;
    }

    async init() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.initializeCanvas();
            this.setupTools();
            
            console.log('Image Editor Studio initialized');
        } catch (error) {
            console.error('Failed to initialize Image Editor Studio:', error);
            throw error;
        }
    }

    setupElements() {
        this.canvas = document.getElementById('image-canvas');
        this.layersPanel = document.getElementById('layers-panel');
        this.toolsPanel = document.querySelector('.tools-panel');
    }

    setupEventListeners() {
        // File operations
        const openBtn = document.getElementById('open-image');
        const saveBtn = document.getElementById('save-image');
        
        if (openBtn) {
            openBtn.addEventListener('click', () => this.openImage());
        }
        
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveImage());
        }

        // Zoom controls
        const zoomInBtn = document.getElementById('zoom-in');
        const zoomOutBtn = document.getElementById('zoom-out');
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => this.zoomIn());
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => this.zoomOut());
        }

        // Tool selection
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.selectTool(btn.dataset.tool);
            });
        });

        // Layer management
        const addLayerBtn = document.getElementById('add-layer');
        if (addLayerBtn) {
            addLayerBtn.addEventListener('click', () => this.addLayer());
        }

        // Adjustment controls
        this.setupAdjustmentControls();

        // Canvas events
        this.setupCanvasEvents();
    }

    initializeCanvas() {
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 800;
        this.canvas.height = 600;
        
        // Set default canvas background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create initial layer
        this.addLayer('Background');
    }

    setupTools() {
        this.tools = {
            select: {
                name: 'Select',
                cursor: 'default',
                onMouseDown: (e) => this.startSelection(e),
                onMouseMove: (e) => this.updateSelection(e),
                onMouseUp: (e) => this.endSelection(e)
            },
            crop: {
                name: 'Crop',
                cursor: 'crosshair',
                onMouseDown: (e) => this.startCrop(e),
                onMouseMove: (e) => this.updateCrop(e),
                onMouseUp: (e) => this.endCrop(e)
            },
            brush: {
                name: 'Brush',
                cursor: 'crosshair',
                onMouseDown: (e) => this.startDrawing(e),
                onMouseMove: (e) => this.draw(e),
                onMouseUp: (e) => this.stopDrawing(e)
            },
            eraser: {
                name: 'Eraser',
                cursor: 'crosshair',
                onMouseDown: (e) => this.startErasing(e),
                onMouseMove: (e) => this.erase(e),
                onMouseUp: (e) => this.stopErasing(e)
            },
            text: {
                name: 'Text',
                cursor: 'text',
                onMouseDown: (e) => this.addText(e)
            },
            rectangle: {
                name: 'Rectangle',
                cursor: 'crosshair',
                onMouseDown: (e) => this.startShape(e, 'rectangle'),
                onMouseMove: (e) => this.updateShape(e),
                onMouseUp: (e) => this.endShape(e)
            },
            circle: {
                name: 'Circle',
                cursor: 'crosshair',
                onMouseDown: (e) => this.startShape(e, 'circle'),
                onMouseMove: (e) => this.updateShape(e),
                onMouseUp: (e) => this.endShape(e)
            }
        };
    }

    setupCanvasEvents() {
        if (!this.canvas) return;

        this.canvas.addEventListener('mousedown', (e) => {
            const tool = this.tools[this.currentTool];
            if (tool && tool.onMouseDown) {
                tool.onMouseDown(e);
            }
        });

        this.canvas.addEventListener('mousemove', (e) => {
            const tool = this.tools[this.currentTool];
            if (tool && tool.onMouseMove) {
                tool.onMouseMove(e);
            }
        });

        this.canvas.addEventListener('mouseup', (e) => {
            const tool = this.tools[this.currentTool];
            if (tool && tool.onMouseUp) {
                tool.onMouseUp(e);
            }
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                this.zoomIn();
            } else {
                this.zoomOut();
            }
        });
    }

    setupAdjustmentControls() {
        const adjustments = ['brightness', 'contrast', 'saturation'];
        
        adjustments.forEach(adjustment => {
            const slider = document.getElementById(adjustment);
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.applyAdjustment(adjustment, e.target.value);
                });
            }
        });
    }

    selectTool(toolName) {
        this.currentTool = toolName;
        
        // Update tool buttons
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            if (btn.dataset.tool === toolName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update cursor
        const tool = this.tools[toolName];
        if (tool && this.canvas) {
            this.canvas.style.cursor = tool.cursor;
        }
    }

    async openImage() {
        try {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            
            input.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    const dataURL = await this.utils.readFileAsDataURL(file);
                    await this.loadImageFromDataURL(dataURL);
                    this.app.showNotification('Image loaded successfully', 'success');
                }
            };
            
            input.click();
        } catch (error) {
            console.error('Failed to open image:', error);
            this.app.showNotification('Failed to open image', 'error');
        }
    }

    async loadImageFromDataURL(dataURL) {
        const img = await this.utils.loadImage(dataURL);
        
        // Resize canvas to fit image
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        
        // Clear existing layers
        this.layers = [];
        
        // Create background layer with image
        const layer = this.createLayer('Background');
        layer.ctx.drawImage(img, 0, 0);
        
        this.currentImage = img;
        this.redrawCanvas();
        this.updateLayersPanel();
        this.saveState();
    }

    createLayer(name = 'Layer') {
        const canvas = document.createElement('canvas');
        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;
        
        const layer = {
            id: this.utils.generateId('layer'),
            name: name,
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            visible: true,
            opacity: 1,
            blendMode: 'normal'
        };
        
        return layer;
    }

    addLayer(name) {
        const layer = this.createLayer(name);
        this.layers.push(layer);
        this.activeLayer = layer;
        this.updateLayersPanel();
        this.saveState();
        
        this.app.showNotification(`Added layer: ${name}`, 'success');
    }

    updateLayersPanel() {
        if (!this.layersPanel) return;

        let html = '';
        
        this.layers.slice().reverse().forEach((layer, index) => {
            const actualIndex = this.layers.length - 1 - index;
            const activeClass = this.activeLayer === layer ? 'active' : '';
            const visibilityIcon = layer.visible ? '👁️' : '🚫';
            
            html += `
                <div class="layer-item ${activeClass}" data-layer="${layer.id}">
                    <div class="layer-thumbnail"></div>
                    <div class="layer-name">${layer.name}</div>
                    <button class="layer-visibility" data-layer="${layer.id}">${visibilityIcon}</button>
                </div>
            `;
        });

        this.layersPanel.innerHTML = html;

        // Add event listeners
        const layerItems = this.layersPanel.querySelectorAll('.layer-item');
        layerItems.forEach(item => {
            item.addEventListener('click', (e) => {
                if (!e.target.classList.contains('layer-visibility')) {
                    this.selectLayer(item.dataset.layer);
                }
            });
        });

        const visibilityBtns = this.layersPanel.querySelectorAll('.layer-visibility');
        visibilityBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLayerVisibility(btn.dataset.layer);
            });
        });
    }

    selectLayer(layerId) {
        this.activeLayer = this.layers.find(layer => layer.id === layerId);
        this.updateLayersPanel();
    }

    toggleLayerVisibility(layerId) {
        const layer = this.layers.find(layer => layer.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;
            this.redrawCanvas();
            this.updateLayersPanel();
        }
    }

    redrawCanvas() {
        if (!this.ctx) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw all visible layers
        this.layers.forEach(layer => {
            if (layer.visible) {
                this.ctx.globalAlpha = layer.opacity;
                this.ctx.globalCompositeOperation = layer.blendMode;
                this.ctx.drawImage(layer.canvas, 0, 0);
            }
        });
        
        // Reset composite operation
        this.ctx.globalAlpha = 1;
        this.ctx.globalCompositeOperation = 'source-over';
    }

    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left) / this.zoom - this.panX,
            y: (e.clientY - rect.top) / this.zoom - this.panY
        };
    }

    // Drawing tools implementation
    startDrawing(e) {
        if (!this.activeLayer) return;
        
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        this.activeLayer.ctx.globalCompositeOperation = 'source-over';
        this.activeLayer.ctx.lineCap = 'round';
        this.activeLayer.ctx.lineJoin = 'round';
        this.activeLayer.ctx.lineWidth = this.brushSize;
        this.activeLayer.ctx.strokeStyle = this.brushColor;
        this.activeLayer.ctx.globalAlpha = this.brushOpacity;
        
        this.activeLayer.ctx.beginPath();
        this.activeLayer.ctx.moveTo(this.lastX, this.lastY);
    }

    draw(e) {
        if (!this.isDrawing || !this.activeLayer) return;
        
        const pos = this.getMousePos(e);
        
        this.activeLayer.ctx.lineTo(pos.x, pos.y);
        this.activeLayer.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        this.redrawCanvas();
    }

    stopDrawing(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.activeLayer.ctx.globalAlpha = 1;
        this.saveState();
    }

    startErasing(e) {
        if (!this.activeLayer) return;
        
        this.isDrawing = true;
        const pos = this.getMousePos(e);
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        this.activeLayer.ctx.globalCompositeOperation = 'destination-out';
        this.activeLayer.ctx.lineCap = 'round';
        this.activeLayer.ctx.lineJoin = 'round';
        this.activeLayer.ctx.lineWidth = this.brushSize;
        
        this.activeLayer.ctx.beginPath();
        this.activeLayer.ctx.moveTo(this.lastX, this.lastY);
    }

    erase(e) {
        if (!this.isDrawing || !this.activeLayer) return;
        
        const pos = this.getMousePos(e);
        
        this.activeLayer.ctx.lineTo(pos.x, pos.y);
        this.activeLayer.ctx.stroke();
        
        this.lastX = pos.x;
        this.lastY = pos.y;
        
        this.redrawCanvas();
    }

    stopErasing(e) {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        this.activeLayer.ctx.globalCompositeOperation = 'source-over';
        this.saveState();
    }

    addText(e) {
        const pos = this.getMousePos(e);
        const text = prompt('Enter text:');
        
        if (text && this.activeLayer) {
            this.activeLayer.ctx.font = '24px Noto Sans JP';
            this.activeLayer.ctx.fillStyle = this.brushColor;
            this.activeLayer.ctx.fillText(text, pos.x, pos.y);
            
            this.redrawCanvas();
            this.saveState();
        }
    }

    startShape(e, shapeType) {
        if (!this.activeLayer) return;
        
        this.isDrawing = true;
        this.shapeType = shapeType;
        const pos = this.getMousePos(e);
        this.shapeStartX = pos.x;
        this.shapeStartY = pos.y;
    }

    updateShape(e) {
        if (!this.isDrawing || !this.activeLayer) return;
        
        // This would show a preview of the shape being drawn
        // For simplicity, we'll just draw the final shape on mouse up
    }

    endShape(e) {
        if (!this.isDrawing || !this.activeLayer) return;
        
        const pos = this.getMousePos(e);
        const width = pos.x - this.shapeStartX;
        const height = pos.y - this.shapeStartY;
        
        this.activeLayer.ctx.strokeStyle = this.brushColor;
        this.activeLayer.ctx.lineWidth = this.brushSize;
        
        if (this.shapeType === 'rectangle') {
            this.activeLayer.ctx.strokeRect(this.shapeStartX, this.shapeStartY, width, height);
        } else if (this.shapeType === 'circle') {
            const radius = Math.sqrt(width * width + height * height);
            this.activeLayer.ctx.beginPath();
            this.activeLayer.ctx.arc(this.shapeStartX, this.shapeStartY, radius, 0, 2 * Math.PI);
            this.activeLayer.ctx.stroke();
        }
        
        this.isDrawing = false;
        this.redrawCanvas();
        this.saveState();
    }

    // Selection and crop tools (simplified implementation)
    startSelection(e) {
        // Implementation for selection tool
    }

    updateSelection(e) {
        // Implementation for selection tool
    }

    endSelection(e) {
        // Implementation for selection tool
    }

    startCrop(e) {
        // Implementation for crop tool
    }

    updateCrop(e) {
        // Implementation for crop tool
    }

    endCrop(e) {
        // Implementation for crop tool
    }

    // Zoom and pan
    zoomIn() {
        this.zoom = Math.min(this.zoom * 1.2, 5);
        this.updateCanvasTransform();
        this.updateZoomDisplay();
    }

    zoomOut() {
        this.zoom = Math.max(this.zoom / 1.2, 0.1);
        this.updateCanvasTransform();
        this.updateZoomDisplay();
    }

    updateCanvasTransform() {
        if (this.canvas) {
            this.canvas.style.transform = `scale(${this.zoom}) translate(${this.panX}px, ${this.panY}px)`;
        }
    }

    updateZoomDisplay() {
        const zoomLevel = document.querySelector('.zoom-level');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.zoom * 100)}%`;
        }
    }

    // Image adjustments
    applyAdjustment(type, value) {
        if (!this.activeLayer) return;
        
        const adjustment = parseInt(value);
        
        // Get image data
        const imageData = this.activeLayer.ctx.getImageData(0, 0, this.activeLayer.canvas.width, this.activeLayer.canvas.height);
        const data = imageData.data;
        
        // Apply adjustment
        for (let i = 0; i < data.length; i += 4) {
            switch (type) {
                case 'brightness':
                    data[i] = Math.max(0, Math.min(255, data[i] + adjustment));     // Red
                    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + adjustment)); // Green
                    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + adjustment)); // Blue
                    break;
                case 'contrast':
                    const factor = (259 * (adjustment + 255)) / (255 * (259 - adjustment));
                    data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
                    data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
                    data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
                    break;
                case 'saturation':
                    // Simplified saturation adjustment
                    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
                    const satFactor = adjustment / 100;
                    data[i] = Math.max(0, Math.min(255, gray + satFactor * (data[i] - gray)));
                    data[i + 1] = Math.max(0, Math.min(255, gray + satFactor * (data[i + 1] - gray)));
                    data[i + 2] = Math.max(0, Math.min(255, gray + satFactor * (data[i + 2] - gray)));
                    break;
            }
        }
        
        // Put image data back
        this.activeLayer.ctx.putImageData(imageData, 0, 0);
        this.redrawCanvas();
    }

    // History management
    saveState() {
        const state = {
            layers: this.layers.map(layer => ({
                id: layer.id,
                name: layer.name,
                visible: layer.visible,
                opacity: layer.opacity,
                blendMode: layer.blendMode,
                imageData: layer.ctx.getImageData(0, 0, layer.canvas.width, layer.canvas.height)
            })),
            activeLayerId: this.activeLayer?.id,
            timestamp: Date.now()
        };

        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(state);
        this.historyIndex = this.history.length - 1;

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
        // Restore layers
        this.layers = state.layers.map(layerState => {
            const layer = this.createLayer(layerState.name);
            layer.id = layerState.id;
            layer.visible = layerState.visible;
            layer.opacity = layerState.opacity;
            layer.blendMode = layerState.blendMode;
            layer.ctx.putImageData(layerState.imageData, 0, 0);
            return layer;
        });

        // Restore active layer
        this.activeLayer = this.layers.find(layer => layer.id === state.activeLayerId);
        
        this.redrawCanvas();
        this.updateLayersPanel();
    }

    async saveImage() {
        try {
            const blob = await this.utils.canvasToBlob(this.canvas);
            
            if ('showSaveFilePicker' in window) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'edited-image.png',
                    types: [{
                        description: 'PNG files',
                        accept: { 'image/png': ['.png'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(blob);
                await writable.close();
                
                this.app.showNotification('Image saved successfully!', 'success');
            } else {
                // Fallback to download
                this.utils.downloadBlob(blob, 'edited-image.png');
                this.app.showNotification('Image downloaded', 'success');
            }
        } catch (error) {
            console.error('Failed to save image:', error);
            this.app.showNotification('Failed to save image', 'error');
        }
    }

    // Studio lifecycle methods
    onActivate() {
        this.updateCanvasTransform();
    }

    onPause() {
        // Auto-save current work
    }

    onResume() {
        this.redrawCanvas();
    }

    handleKeyboard(e) {
        if ((e.ctrlKey || e.metaKey)) {
            switch (e.key) {
                case 'z':
                    e.preventDefault();
                    if (e.shiftKey) {
                        this.redo();
                    } else {
                        this.undo();
                    }
                    break;
                case 's':
                    e.preventDefault();
                    this.saveImage();
                    break;
                case 'o':
                    e.preventDefault();
                    this.openImage();
                    break;
            }
        }

        // Tool shortcuts
        const toolShortcuts = {
            'v': 'select',
            'b': 'brush',
            'e': 'eraser',
            't': 'text',
            'r': 'rectangle',
            'c': 'circle'
        };

        if (toolShortcuts[e.key]) {
            this.selectTool(toolShortcuts[e.key]);
        }
    }
}