// Nexus Canvas - Productivity Studio
// Document, Spreadsheet, and Presentation tools

export class ProductivityStudio {
    constructor(app) {
        this.app = app;
        this.storage = app.getStorage();
        this.utils = app.getUtils();
        
        this.currentApp = 'document';
        this.documents = {
            document: null,
            spreadsheet: null,
            presentation: null
        };
        
        this.spreadsheetData = [];
        this.presentationSlides = [];
        this.currentSlide = 0;
    }

    async init() {
        try {
            this.setupElements();
            this.setupEventListeners();
            this.initializeApps();
            
            console.log('Productivity Studio initialized');
        } catch (error) {
            console.error('Failed to initialize Productivity Studio:', error);
            throw error;
        }
    }

    setupElements() {
        this.documentContent = document.getElementById('document-content');
        this.spreadsheetTable = document.getElementById('spreadsheet-table');
        this.slidesList = document.getElementById('slides-list');
        this.slideCanvas = document.getElementById('slide-canvas');
    }

    setupEventListeners() {
        // App switching
        const productivityTabs = document.querySelectorAll('.productivity-tab');
        productivityTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchApp(tab.dataset.app);
            });
        });

        // Document editor
        this.setupDocumentEditor();
        
        // Spreadsheet editor
        this.setupSpreadsheetEditor();
        
        // Presentation editor
        this.setupPresentationEditor();
    }

    setupDocumentEditor() {
        // Toolbar buttons
        const toolbarBtns = document.querySelectorAll('#document-app .toolbar-btn');
        toolbarBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.executeDocumentCommand(btn.dataset.action);
            });
        });

        // Font controls
        const fontFamily = document.getElementById('font-family');
        const fontSize = document.getElementById('font-size');
        
        if (fontFamily) {
            fontFamily.addEventListener('change', (e) => {
                document.execCommand('fontName', false, e.target.value);
            });
        }
        
        if (fontSize) {
            fontSize.addEventListener('change', (e) => {
                document.execCommand('fontSize', false, e.target.value);
            });
        }

        // Content changes
        if (this.documentContent) {
            this.documentContent.addEventListener('input', () => {
                this.saveDocumentState();
            });
        }
    }

    setupSpreadsheetEditor() {
        // Add row/column buttons
        const addRowBtn = document.getElementById('add-row');
        const addColumnBtn = document.getElementById('add-column');
        
        if (addRowBtn) {
            addRowBtn.addEventListener('click', () => this.addSpreadsheetRow());
        }
        
        if (addColumnBtn) {
            addColumnBtn.addEventListener('click', () => this.addSpreadsheetColumn());
        }

        // Formula bar
        const formulaBar = document.getElementById('formula-bar');
        if (formulaBar) {
            formulaBar.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.applyFormula(formulaBar.value);
                }
            });
        }
    }

    setupPresentationEditor() {
        // Add slide button
        const addSlideBtn = document.getElementById('add-slide');
        if (addSlideBtn) {
            addSlideBtn.addEventListener('click', () => this.addSlide());
        }

        // Element buttons
        const elementBtns = document.querySelectorAll('#presentation-app .toolbar-btn');
        elementBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.addSlideElement(btn.dataset.element);
            });
        });
    }

    initializeApps() {
        this.initializeDocument();
        this.initializeSpreadsheet();
        this.initializePresentation();
        this.switchApp('document');
    }

    switchApp(appName) {
        this.currentApp = appName;
        
        // Update tabs
        const tabs = document.querySelectorAll('.productivity-tab');
        tabs.forEach(tab => {
            if (tab.dataset.app === appName) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        // Update app visibility
        const apps = document.querySelectorAll('.productivity-app');
        apps.forEach(app => {
            if (app.id === `${appName}-app`) {
                app.classList.add('active');
            } else {
                app.classList.remove('active');
            }
        });
    }

    // Document Editor
    initializeDocument() {
        if (this.documentContent) {
            this.documentContent.innerHTML = `
                <h1>Document Title</h1>
                <p>Start typing your document here...</p>
            `;
        }
    }

    executeDocumentCommand(action) {
        if (!this.documentContent) return;

        this.documentContent.focus();
        
        switch (action) {
            case 'bold':
                document.execCommand('bold');
                break;
            case 'italic':
                document.execCommand('italic');
                break;
            case 'underline':
                document.execCommand('underline');
                break;
            case 'alignLeft':
                document.execCommand('justifyLeft');
                break;
            case 'alignCenter':
                document.execCommand('justifyCenter');
                break;
            case 'alignRight':
                document.execCommand('justifyRight');
                break;
            case 'insertOrderedList':
                document.execCommand('insertOrderedList');
                break;
            case 'insertUnorderedList':
                document.execCommand('insertUnorderedList');
                break;
        }

        this.updateToolbarState();
        this.saveDocumentState();
    }

    updateToolbarState() {
        const commands = ['bold', 'italic', 'underline'];
        
        commands.forEach(command => {
            const btn = document.querySelector(`[data-action="${command}"]`);
            if (btn) {
                if (document.queryCommandState(command)) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            }
        });
    }

    saveDocumentState() {
        if (this.documentContent) {
            this.documents.document = {
                content: this.documentContent.innerHTML,
                modified: Date.now()
            };
        }
    }

    async exportDocument() {
        if (!this.documents.document) return;

        const content = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Document</title>
                <style>
                    body {
                        font-family: 'Noto Sans JP', sans-serif;
                        max-width: 800px;
                        margin: 0 auto;
                        padding: 2rem;
                        line-height: 1.6;
                    }
                </style>
            </head>
            <body>
                ${this.documents.document.content}
            </body>
            </html>
        `;

        try {
            if ('showSaveFilePicker' in window) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'document.html',
                    types: [{
                        description: 'HTML files',
                        accept: { 'text/html': ['.html'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(content);
                await writable.close();
                
                this.app.showNotification('Document exported successfully!', 'success');
            } else {
                this.utils.downloadText(content, 'document.html', 'text/html');
                this.app.showNotification('Document downloaded', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.app.showNotification('Export failed', 'error');
        }
    }

    // Spreadsheet Editor
    initializeSpreadsheet() {
        this.spreadsheetData = [];
        
        // Create initial 10x10 grid
        for (let i = 0; i < 10; i++) {
            this.spreadsheetData[i] = [];
            for (let j = 0; j < 10; j++) {
                this.spreadsheetData[i][j] = '';
            }
        }
        
        this.renderSpreadsheet();
    }

    renderSpreadsheet() {
        if (!this.spreadsheetTable) return;

        let html = '<thead><tr><th></th>';
        
        // Column headers (A, B, C, ...)
        for (let col = 0; col < this.spreadsheetData[0]?.length || 10; col++) {
            html += `<th>${String.fromCharCode(65 + col)}</th>`;
        }
        html += '</tr></thead><tbody>';

        // Rows
        for (let row = 0; row < this.spreadsheetData.length; row++) {
            html += `<tr><th>${row + 1}</th>`;
            
            for (let col = 0; col < (this.spreadsheetData[row]?.length || 10); col++) {
                const cellId = `${String.fromCharCode(65 + col)}${row + 1}`;
                const value = this.spreadsheetData[row]?.[col] || '';
                
                html += `
                    <td contenteditable="true" 
                        data-row="${row}" 
                        data-col="${col}"
                        data-cell="${cellId}"
                        onblur="window.nexusCanvas.studios.productivity.updateCell(${row}, ${col}, this.textContent)"
                        onfocus="window.nexusCanvas.studios.productivity.selectCell('${cellId}')"
                        >${value}</td>
                `;
            }
            
            html += '</tr>';
        }
        
        html += '</tbody>';
        this.spreadsheetTable.innerHTML = html;
    }

    updateCell(row, col, value) {
        if (!this.spreadsheetData[row]) {
            this.spreadsheetData[row] = [];
        }
        
        this.spreadsheetData[row][col] = value;
        
        // Check if it's a formula
        if (value.startsWith('=')) {
            this.calculateFormula(row, col, value);
        }
        
        this.saveSpreadsheetState();
    }

    selectCell(cellId) {
        const formulaBar = document.getElementById('formula-bar');
        if (formulaBar) {
            const cell = document.querySelector(`[data-cell="${cellId}"]`);
            formulaBar.value = cell ? cell.textContent : '';
        }
    }

    calculateFormula(row, col, formula) {
        try {
            // Simple formula calculation (SUM, AVERAGE)
            const expression = formula.substring(1); // Remove '='
            
            if (expression.startsWith('SUM(')) {
                const range = expression.match(/SUM\(([A-Z]\d+):([A-Z]\d+)\)/);
                if (range) {
                    const sum = this.calculateSum(range[1], range[2]);
                    this.displayCellValue(row, col, sum);
                }
            } else if (expression.startsWith('AVERAGE(')) {
                const range = expression.match(/AVERAGE\(([A-Z]\d+):([A-Z]\d+)\)/);
                if (range) {
                    const avg = this.calculateAverage(range[1], range[2]);
                    this.displayCellValue(row, col, avg);
                }
            } else {
                // Simple arithmetic
                const result = this.evaluateExpression(expression);
                this.displayCellValue(row, col, result);
            }
        } catch (error) {
            this.displayCellValue(row, col, '#ERROR');
        }
    }

    calculateSum(startCell, endCell) {
        const start = this.parseCellReference(startCell);
        const end = this.parseCellReference(endCell);
        let sum = 0;
        
        for (let row = start.row; row <= end.row; row++) {
            for (let col = start.col; col <= end.col; col++) {
                const value = parseFloat(this.spreadsheetData[row]?.[col] || 0);
                if (!isNaN(value)) {
                    sum += value;
                }
            }
        }
        
        return sum;
    }

    calculateAverage(startCell, endCell) {
        const start = this.parseCellReference(startCell);
        const end = this.parseCellReference(endCell);
        let sum = 0;
        let count = 0;
        
        for (let row = start.row; row <= end.row; row++) {
            for (let col = start.col; col <= end.col; col++) {
                const value = parseFloat(this.spreadsheetData[row]?.[col] || 0);
                if (!isNaN(value)) {
                    sum += value;
                    count++;
                }
            }
        }
        
        return count > 0 ? sum / count : 0;
    }

    parseCellReference(cellRef) {
        const col = cellRef.charCodeAt(0) - 65;
        const row = parseInt(cellRef.substring(1)) - 1;
        return { row, col };
    }

    evaluateExpression(expression) {
        // Replace cell references with values
        const cellRefs = expression.match(/[A-Z]\d+/g);
        if (cellRefs) {
            cellRefs.forEach(ref => {
                const { row, col } = this.parseCellReference(ref);
                const value = this.spreadsheetData[row]?.[col] || 0;
                expression = expression.replace(ref, value);
            });
        }
        
        // Evaluate the expression (basic arithmetic only)
        return Function('"use strict"; return (' + expression + ')')();
    }

    displayCellValue(row, col, value) {
        const cell = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);
        if (cell) {
            cell.textContent = value;
        }
    }

    addSpreadsheetRow() {
        const newRow = [];
        const colCount = this.spreadsheetData[0]?.length || 10;
        
        for (let i = 0; i < colCount; i++) {
            newRow.push('');
        }
        
        this.spreadsheetData.push(newRow);
        this.renderSpreadsheet();
    }

    addSpreadsheetColumn() {
        this.spreadsheetData.forEach(row => {
            row.push('');
        });
        this.renderSpreadsheet();
    }

    saveSpreadsheetState() {
        this.documents.spreadsheet = {
            data: this.spreadsheetData,
            modified: Date.now()
        };
    }

    async exportSpreadsheet() {
        if (!this.documents.spreadsheet) return;

        // Convert to CSV
        let csv = '';
        this.spreadsheetData.forEach(row => {
            csv += row.map(cell => `"${cell}"`).join(',') + '\n';
        });

        try {
            if ('showSaveFilePicker' in window) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'spreadsheet.csv',
                    types: [{
                        description: 'CSV files',
                        accept: { 'text/csv': ['.csv'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(csv);
                await writable.close();
                
                this.app.showNotification('Spreadsheet exported successfully!', 'success');
            } else {
                this.utils.downloadText(csv, 'spreadsheet.csv', 'text/csv');
                this.app.showNotification('Spreadsheet downloaded', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.app.showNotification('Export failed', 'error');
        }
    }

    // Presentation Editor
    initializePresentation() {
        this.presentationSlides = [
            {
                id: this.utils.generateId('slide'),
                title: 'Title Slide',
                content: '<h1>Presentation Title</h1><p>Your subtitle here</p>',
                elements: []
            }
        ];
        
        this.currentSlide = 0;
        this.renderSlidesList();
        this.renderCurrentSlide();
    }

    renderSlidesList() {
        if (!this.slidesList) return;

        let html = '';
        
        this.presentationSlides.forEach((slide, index) => {
            const activeClass = index === this.currentSlide ? 'active' : '';
            
            html += `
                <div class="slide-thumbnail ${activeClass}" data-slide="${index}">
                    <div class="slide-number">${index + 1}</div>
                    <div class="slide-preview">${slide.title}</div>
                </div>
            `;
        });

        this.slidesList.innerHTML = html;

        // Add click listeners
        const thumbnails = this.slidesList.querySelectorAll('.slide-thumbnail');
        thumbnails.forEach(thumb => {
            thumb.addEventListener('click', () => {
                this.selectSlide(parseInt(thumb.dataset.slide));
            });
        });
    }

    renderCurrentSlide() {
        if (!this.slideCanvas || !this.presentationSlides[this.currentSlide]) return;

        const slide = this.presentationSlides[this.currentSlide];
        
        this.slideCanvas.innerHTML = `
            <div class="slide-content">
                <div class="slide-editor-content" contenteditable="true">
                    ${slide.content}
                </div>
            </div>
        `;

        // Add event listener for content changes
        const editorContent = this.slideCanvas.querySelector('.slide-editor-content');
        if (editorContent) {
            editorContent.addEventListener('input', () => {
                this.presentationSlides[this.currentSlide].content = editorContent.innerHTML;
                this.savePresentationState();
            });
        }
    }

    selectSlide(index) {
        if (index >= 0 && index < this.presentationSlides.length) {
            this.currentSlide = index;
            this.renderSlidesList();
            this.renderCurrentSlide();
        }
    }

    addSlide() {
        const newSlide = {
            id: this.utils.generateId('slide'),
            title: `Slide ${this.presentationSlides.length + 1}`,
            content: '<h2>New Slide</h2><p>Add your content here</p>',
            elements: []
        };

        this.presentationSlides.push(newSlide);
        this.currentSlide = this.presentationSlides.length - 1;
        
        this.renderSlidesList();
        this.renderCurrentSlide();
        
        this.app.showNotification('New slide added', 'success');
    }

    addSlideElement(elementType) {
        const slideContent = this.slideCanvas.querySelector('.slide-editor-content');
        if (!slideContent) return;

        let elementHTML = '';
        
        switch (elementType) {
            case 'text':
                elementHTML = '<p>New text element</p>';
                break;
            case 'image':
                elementHTML = '<img src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlPC90ZXh0Pjwvc3ZnPg==" alt="Image placeholder" style="width: 200px; height: 100px;">';
                break;
            case 'shape':
                elementHTML = '<div style="width: 100px; height: 100px; background: #007bff; border-radius: 8px; display: inline-block;"></div>';
                break;
        }

        slideContent.innerHTML += elementHTML;
        this.presentationSlides[this.currentSlide].content = slideContent.innerHTML;
        this.savePresentationState();
    }

    savePresentationState() {
        this.documents.presentation = {
            slides: this.presentationSlides,
            currentSlide: this.currentSlide,
            modified: Date.now()
        };
    }

    async exportPresentation() {
        if (!this.documents.presentation) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Presentation</title>
                <style>
                    body {
                        font-family: 'Noto Sans JP', sans-serif;
                        margin: 0;
                        padding: 0;
                        background: #000;
                        color: #fff;
                    }
                    .slide {
                        width: 100vw;
                        height: 100vh;
                        display: none;
                        align-items: center;
                        justify-content: center;
                        text-align: center;
                        padding: 2rem;
                        box-sizing: border-box;
                    }
                    .slide.active {
                        display: flex;
                        flex-direction: column;
                    }
                    .controls {
                        position: fixed;
                        bottom: 20px;
                        left: 50%;
                        transform: translateX(-50%);
                        z-index: 1000;
                    }
                    button {
                        padding: 10px 20px;
                        margin: 0 5px;
                        background: rgba(255,255,255,0.2);
                        color: white;
                        border: none;
                        border-radius: 5px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                ${this.presentationSlides.map((slide, index) => `
                    <div class="slide ${index === 0 ? 'active' : ''}" id="slide-${index}">
                        ${slide.content}
                    </div>
                `).join('')}
                
                <div class="controls">
                    <button onclick="previousSlide()">Previous</button>
                    <button onclick="nextSlide()">Next</button>
                </div>
                
                <script>
                    let currentSlide = 0;
                    const slides = document.querySelectorAll('.slide');
                    
                    function showSlide(index) {
                        slides.forEach(slide => slide.classList.remove('active'));
                        if (slides[index]) {
                            slides[index].classList.add('active');
                            currentSlide = index;
                        }
                    }
                    
                    function nextSlide() {
                        if (currentSlide < slides.length - 1) {
                            showSlide(currentSlide + 1);
                        }
                    }
                    
                    function previousSlide() {
                        if (currentSlide > 0) {
                            showSlide(currentSlide - 1);
                        }
                    }
                    
                    document.addEventListener('keydown', (e) => {
                        if (e.key === 'ArrowRight' || e.key === ' ') {
                            nextSlide();
                        } else if (e.key === 'ArrowLeft') {
                            previousSlide();
                        }
                    });
                </script>
            </body>
            </html>
        `;

        try {
            if ('showSaveFilePicker' in window) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: 'presentation.html',
                    types: [{
                        description: 'HTML files',
                        accept: { 'text/html': ['.html'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(html);
                await writable.close();
                
                this.app.showNotification('Presentation exported successfully!', 'success');
            } else {
                this.utils.downloadText(html, 'presentation.html', 'text/html');
                this.app.showNotification('Presentation downloaded', 'success');
            }
        } catch (error) {
            console.error('Export failed:', error);
            this.app.showNotification('Export failed', 'error');
        }
    }

    // Studio lifecycle methods
    onActivate() {
        // Refresh current app
        if (this.currentApp === 'spreadsheet') {
            this.renderSpreadsheet();
        } else if (this.currentApp === 'presentation') {
            this.renderSlidesList();
            this.renderCurrentSlide();
        }
    }

    onPause() {
        // Auto-save current work
        this.saveDocumentState();
        this.saveSpreadsheetState();
        this.savePresentationState();
    }

    onResume() {
        // Refresh displays
        this.onActivate();
    }

    handleKeyboard(e) {
        if ((e.ctrlKey || e.metaKey)) {
            switch (e.key) {
                case 's':
                    e.preventDefault();
                    if (this.currentApp === 'document') {
                        this.exportDocument();
                    } else if (this.currentApp === 'spreadsheet') {
                        this.exportSpreadsheet();
                    } else if (this.currentApp === 'presentation') {
                        this.exportPresentation();
                    }
                    break;
                case 'b':
                    if (this.currentApp === 'document') {
                        e.preventDefault();
                        this.executeDocumentCommand('bold');
                    }
                    break;
                case 'i':
                    if (this.currentApp === 'document') {
                        e.preventDefault();
                        this.executeDocumentCommand('italic');
                    }
                    break;
                case 'u':
                    if (this.currentApp === 'document') {
                        e.preventDefault();
                        this.executeDocumentCommand('underline');
                    }
                    break;
            }
        }

        // Presentation navigation
        if (this.currentApp === 'presentation') {
            if (e.key === 'ArrowLeft') {
                this.selectSlide(this.currentSlide - 1);
            } else if (e.key === 'ArrowRight') {
                this.selectSlide(this.currentSlide + 1);
            }
        }
    }
}