// Nexus Canvas - Storage Manager
// Handles IndexedDB operations for local data persistence

export class StorageManager {
    constructor() {
        this.dbName = 'NexusCanvasDB';
        this.dbVersion = 1;
        this.db = null;
        this.stores = {
            projects: 'projects',
            files: 'files',
            settings: 'settings',
            media: 'media',
            recordings: 'recordings'
        };
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                reject(new Error('Failed to open IndexedDB'));
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                if (!db.objectStoreNames.contains(this.stores.projects)) {
                    const projectStore = db.createObjectStore(this.stores.projects, { keyPath: 'id' });
                    projectStore.createIndex('type', 'type', { unique: false });
                    projectStore.createIndex('created', 'created', { unique: false });
                    projectStore.createIndex('modified', 'modified', { unique: false });
                }

                if (!db.objectStoreNames.contains(this.stores.files)) {
                    const fileStore = db.createObjectStore(this.stores.files, { keyPath: 'id' });
                    fileStore.createIndex('projectId', 'projectId', { unique: false });
                    fileStore.createIndex('type', 'type', { unique: false });
                }

                if (!db.objectStoreNames.contains(this.stores.settings)) {
                    db.createObjectStore(this.stores.settings, { keyPath: 'key' });
                }

                if (!db.objectStoreNames.contains(this.stores.media)) {
                    const mediaStore = db.createObjectStore(this.stores.media, { keyPath: 'id' });
                    mediaStore.createIndex('type', 'type', { unique: false });
                    mediaStore.createIndex('size', 'size', { unique: false });
                }

                if (!db.objectStoreNames.contains(this.stores.recordings)) {
                    const recordingStore = db.createObjectStore(this.stores.recordings, { keyPath: 'id' });
                    recordingStore.createIndex('created', 'created', { unique: false });
                }
            };
        });
    }

    async setItem(key, value, store = this.stores.settings) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([store], 'readwrite');
            const objectStore = transaction.objectStore(store);
            
            const data = store === this.stores.settings ? { key, value } : value;
            const request = objectStore.put(data);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to store item'));
        });
    }

    async getItem(key, store = this.stores.settings) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([store], 'readonly');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.get(key);

            request.onsuccess = (event) => {
                const result = event.target.result;
                if (store === this.stores.settings) {
                    resolve(result ? result.value : null);
                } else {
                    resolve(result || null);
                }
            };
            request.onerror = () => reject(new Error('Failed to retrieve item'));
        });
    }

    async removeItem(key, store = this.stores.settings) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([store], 'readwrite');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.delete(key);

            request.onsuccess = () => resolve();
            request.onerror = () => reject(new Error('Failed to remove item'));
        });
    }

    async getAllItems(store) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([store], 'readonly');
            const objectStore = transaction.objectStore(store);
            const request = objectStore.getAll();

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = () => reject(new Error('Failed to retrieve items'));
        });
    }

    async getItemsByIndex(store, indexName, value) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([store], 'readonly');
            const objectStore = transaction.objectStore(store);
            const index = objectStore.index(indexName);
            const request = index.getAll(value);

            request.onsuccess = (event) => resolve(event.target.result);
            request.onerror = () => reject(new Error('Failed to retrieve items by index'));
        });
    }

    async clear(store = null) {
        if (store) {
            return new Promise((resolve, reject) => {
                const transaction = this.db.transaction([store], 'readwrite');
                const objectStore = transaction.objectStore(store);
                const request = objectStore.clear();

                request.onsuccess = () => resolve();
                request.onerror = () => reject(new Error('Failed to clear store'));
            });
        } else {
            // Clear all stores
            const promises = Object.values(this.stores).map(storeName => this.clear(storeName));
            return Promise.all(promises);
        }
    }

    // Project-specific methods
    async saveProject(project) {
        const projectData = {
            id: project.id || this.generateId(),
            type: project.type,
            name: project.name,
            data: project.data,
            created: project.created || Date.now(),
            modified: Date.now(),
            version: project.version || '1.0.0'
        };

        await this.setItem(projectData.id, projectData, this.stores.projects);
        return projectData.id;
    }

    async getProject(id) {
        return await this.getItem(id, this.stores.projects);
    }

    async getProjectsByType(type) {
        return await this.getItemsByIndex(this.stores.projects, 'type', type);
    }

    async getAllProjects() {
        return await this.getAllItems(this.stores.projects);
    }

    async deleteProject(id) {
        // Delete project and associated files
        const files = await this.getItemsByIndex(this.stores.files, 'projectId', id);
        for (const file of files) {
            await this.removeItem(file.id, this.stores.files);
        }
        
        return await this.removeItem(id, this.stores.projects);
    }

    // File-specific methods
    async saveFile(file) {
        const fileData = {
            id: file.id || this.generateId(),
            projectId: file.projectId,
            name: file.name,
            type: file.type,
            content: file.content,
            size: file.size || 0,
            created: file.created || Date.now(),
            modified: Date.now()
        };

        await this.setItem(fileData.id, fileData, this.stores.files);
        return fileData.id;
    }

    async getFile(id) {
        return await this.getItem(id, this.stores.files);
    }

    async getFilesByProject(projectId) {
        return await this.getItemsByIndex(this.stores.files, 'projectId', projectId);
    }

    async deleteFile(id) {
        return await this.removeItem(id, this.stores.files);
    }

    // Media-specific methods
    async saveMedia(media) {
        const mediaData = {
            id: media.id || this.generateId(),
            name: media.name,
            type: media.type,
            data: media.data, // Base64 or Blob
            size: media.size,
            width: media.width,
            height: media.height,
            duration: media.duration,
            created: Date.now()
        };

        await this.setItem(mediaData.id, mediaData, this.stores.media);
        return mediaData.id;
    }

    async getMedia(id) {
        return await this.getItem(id, this.stores.media);
    }

    async getAllMedia() {
        return await this.getAllItems(this.stores.media);
    }

    async getMediaByType(type) {
        return await this.getItemsByIndex(this.stores.media, 'type', type);
    }

    async deleteMedia(id) {
        return await this.removeItem(id, this.stores.media);
    }

    // Recording-specific methods
    async saveRecording(recording) {
        const recordingData = {
            id: recording.id || this.generateId(),
            name: recording.name,
            data: recording.data, // Blob
            size: recording.size,
            duration: recording.duration,
            format: recording.format,
            settings: recording.settings,
            created: Date.now()
        };

        await this.setItem(recordingData.id, recordingData, this.stores.recordings);
        return recordingData.id;
    }

    async getRecording(id) {
        return await this.getItem(id, this.stores.recordings);
    }

    async getAllRecordings() {
        return await this.getAllItems(this.stores.recordings);
    }

    async deleteRecording(id) {
        return await this.removeItem(id, this.stores.recordings);
    }

    // Utility methods
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    async getStorageUsage() {
        try {
            if ('storage' in navigator && 'estimate' in navigator.storage) {
                const estimate = await navigator.storage.estimate();
                return {
                    used: estimate.usage,
                    available: estimate.quota,
                    percentage: (estimate.usage / estimate.quota) * 100
                };
            }
        } catch (error) {
            console.warn('Could not get storage estimate:', error);
        }
        return null;
    }

    async exportData() {
        const data = {};
        
        for (const [key, storeName] of Object.entries(this.stores)) {
            data[key] = await this.getAllItems(storeName);
        }
        
        return {
            version: this.dbVersion,
            exported: Date.now(),
            data
        };
    }

    async importData(exportedData) {
        if (!exportedData.data) {
            throw new Error('Invalid export data format');
        }

        // Clear existing data
        await this.clear();

        // Import data
        for (const [storeName, items] of Object.entries(exportedData.data)) {
            if (this.stores[storeName] && Array.isArray(items)) {
                for (const item of items) {
                    await this.setItem(item.id || item.key, item, this.stores[storeName]);
                }
            }
        }
    }

    // File System Access API integration
    async exportToFile(data, filename, type = 'application/json') {
        try {
            if ('showSaveFilePicker' in window) {
                const fileHandle = await window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: 'JSON files',
                        accept: { [type]: ['.json'] }
                    }]
                });

                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(data, null, 2));
                await writable.close();
                
                return true;
            } else {
                // Fallback to download
                const blob = new Blob([JSON.stringify(data, null, 2)], { type });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                a.click();
                URL.revokeObjectURL(url);
                return true;
            }
        } catch (error) {
            console.error('Export failed:', error);
            return false;
        }
    }

    async importFromFile() {
        try {
            if ('showOpenFilePicker' in window) {
                const [fileHandle] = await window.showOpenFilePicker({
                    types: [{
                        description: 'JSON files',
                        accept: { 'application/json': ['.json'] }
                    }]
                });

                const file = await fileHandle.getFile();
                const text = await file.text();
                return JSON.parse(text);
            } else {
                // Fallback to file input
                return new Promise((resolve, reject) => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.accept = '.json';
                    input.onchange = async (e) => {
                        const file = e.target.files[0];
                        if (file) {
                            const text = await file.text();
                            resolve(JSON.parse(text));
                        } else {
                            reject(new Error('No file selected'));
                        }
                    };
                    input.click();
                });
            }
        } catch (error) {
            console.error('Import failed:', error);
            throw error;
        }
    }
}