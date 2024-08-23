// public/sw.js

self.addEventListener('push', function (event) {
    const options = {
        body: event.data.text(),
        icon: '/images/defaultProfileImage.png',
        vibrate: [200, 100, 200, 100, 200, 100, 200],
        tag: 'incoming-call',
    };

    event.waitUntil(
        self.registration.showNotification('Incoming Call', options)
    );
});
