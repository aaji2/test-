// Nexus Canvas - Service Worker
// Provides offline functionality and caching for PWA

const CACHE_NAME = 'nexus-canvas-v1.0.0';
const STATIC_CACHE_NAME = 'nexus-canvas-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'nexus-canvas-dynamic-v1.0.0';

// Files to cache for offline functionality
const STATIC_FILES = [
    '/',
    '/index.html',
    '/manifest.json',
    '/styles/main.css',
    '/styles/components.css',
    '/styles/studios.css',
    '/scripts/core/app.js',
    '/scripts/core/storage.js',
    '/scripts/core/utils.js',
    '/scripts/studios/web-creator.js',
    '/scripts/studios/code-editor.js',
    '/scripts/studios/image-editor.js',
    '/scripts/studios/video-editor.js',
    '/scripts/studios/screen-recorder.js',
    '/scripts/studios/productivity.js',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
    console.log('Service Worker: Installing...');
    
    event.waitUntil(
        caches.open(STATIC_CACHE_NAME)
            .then((cache) => {
                console.log('Service Worker: Caching static files');
                return cache.addAll(STATIC_FILES);
            })
            .then(() => {
                console.log('Service Worker: Static files cached successfully');
                return self.skipWaiting();
            })
            .catch((error) => {
                console.error('Service Worker: Failed to cache static files', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('Service Worker: Activating...');
    
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName !== STATIC_CACHE_NAME && 
                            cacheName !== DYNAMIC_CACHE_NAME &&
                            cacheName.startsWith('nexus-canvas-')) {
                            console.log('Service Worker: Deleting old cache', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('Service Worker: Activated successfully');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve cached files or fetch from network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!url.protocol.startsWith('http')) {
        return;
    }
    
    event.respondWith(
        caches.match(request)
            .then((cachedResponse) => {
                // Return cached version if available
                if (cachedResponse) {
                    console.log('Service Worker: Serving from cache', request.url);
                    return cachedResponse;
                }
                
                // Fetch from network
                return fetch(request)
                    .then((networkResponse) => {
                        // Don't cache if not a valid response
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                            return networkResponse;
                        }
                        
                        // Clone the response
                        const responseToCache = networkResponse.clone();
                        
                        // Cache dynamic content
                        if (shouldCacheDynamically(request)) {
                            caches.open(DYNAMIC_CACHE_NAME)
                                .then((cache) => {
                                    console.log('Service Worker: Caching dynamic content', request.url);
                                    cache.put(request, responseToCache);
                                });
                        }
                        
                        return networkResponse;
                    })
                    .catch((error) => {
                        console.log('Service Worker: Network fetch failed', request.url, error);
                        
                        // Return offline fallback for navigation requests
                        if (request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                        
                        // Return a generic offline response for other requests
                        return new Response('Offline - Content not available', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
    );
});

// Helper function to determine if content should be cached dynamically
function shouldCacheDynamically(request) {
    const url = new URL(request.url);
    
    // Cache images, fonts, and other assets
    if (request.destination === 'image' || 
        request.destination === 'font' ||
        request.destination === 'style' ||
        request.destination === 'script') {
        return true;
    }
    
    // Cache Google Fonts
    if (url.hostname === 'fonts.googleapis.com' || 
        url.hostname === 'fonts.gstatic.com') {
        return true;
    }
    
    // Don't cache API calls or dynamic content
    if (url.pathname.startsWith('/api/') || 
        url.search.includes('dynamic=true')) {
        return false;
    }
    
    return false;
}

// Background sync for saving projects when online
self.addEventListener('sync', (event) => {
    console.log('Service Worker: Background sync triggered', event.tag);
    
    if (event.tag === 'save-project') {
        event.waitUntil(syncProjects());
    }
});

// Sync projects with server (if implemented)
async function syncProjects() {
    try {
        // This would sync local projects with a server
        // For now, we just log the sync attempt
        console.log('Service Worker: Syncing projects...');
        
        // In a real implementation, you would:
        // 1. Get pending projects from IndexedDB
        // 2. Send them to the server
        // 3. Update local storage with server response
        
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Project sync failed', error);
        throw error;
    }
}

// Push notifications (for future features)
self.addEventListener('push', (event) => {
    console.log('Service Worker: Push notification received', event);
    
    const options = {
        body: event.data ? event.data.text() : 'New update available',
        icon: '/assets/icon-192.png',
        badge: '/assets/icon-72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'explore',
                title: 'Open Nexus Canvas',
                icon: '/assets/icon-192.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/assets/icon-192.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Nexus Canvas', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('Service Worker: Notification clicked', event);
    
    event.notification.close();
    
    if (event.action === 'explore') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle messages from the main app
self.addEventListener('message', (event) => {
    console.log('Service Worker: Message received', event.data);
    
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_NAME });
    }
    
    if (event.data && event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE_NAME)
                .then((cache) => {
                    return cache.addAll(event.data.urls);
                })
        );
    }
});

// Periodic background sync (for future features)
self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered', event.tag);
    
    if (event.tag === 'backup-projects') {
        event.waitUntil(backupProjects());
    }
});

// Backup projects periodically
async function backupProjects() {
    try {
        console.log('Service Worker: Backing up projects...');
        
        // This would backup projects to cloud storage
        // For now, we just log the backup attempt
        
        return Promise.resolve();
    } catch (error) {
        console.error('Service Worker: Project backup failed', error);
        throw error;
    }
}

// Handle app updates
self.addEventListener('appinstalled', (event) => {
    console.log('Service Worker: App installed', event);
    
    // Track app installation
    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
        navigator.serviceWorker.ready.then((registration) => {
            return registration.sync.register('app-installed');
        });
    }
});

// Handle app uninstall
self.addEventListener('beforeinstallprompt', (event) => {
    console.log('Service Worker: Before install prompt', event);
    
    // This event is fired on the main thread, not in the service worker
    // But we can listen for messages about it
});

// Error handling
self.addEventListener('error', (event) => {
    console.error('Service Worker: Error occurred', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
    console.error('Service Worker: Unhandled promise rejection', event.reason);
});

// Cleanup on service worker termination
self.addEventListener('beforeunload', () => {
    console.log('Service Worker: Terminating...');
});

console.log('Service Worker: Script loaded successfully');