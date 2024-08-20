importScripts("https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js");
importScripts(
  "https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js"
);

// Replace these with your own Firebase config keys...
const firebaseConfig = {
  apiKey: "AIzaSyCf3hnF_XK4kUMnT49NaSBJiIurLQd1Hx8",
  authDomain: "flashcallchat.firebaseapp.com",
  projectId: "flashcallchat",
  storageBucket: "flashcallchat.appspot.com",
  messagingSenderId: "789413051138",
  appId: "1:789413051138:web:6f9c2dbc4b48a5f1d4e01b",
  measurementId: "G-KE1QPLVC2Z"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Received background message", payload);

  const notificationTitle = payload.notification?.title || 'Default Title';
  const notificationOptions = {
    body: payload.notification?.body || 'You have a new message.',
    icon: payload.notification?.icon || './logo.png', // Ensure this path is correct
    data: { url: payload.fcmOptions?.link || payload.data?.link || '/' }, // Ensure there is a fallback URL
  };

  console.log("About to show notification:", notificationTitle, notificationOptions);
  self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => console.log("Notification displayed successfully"))
    .catch((error) => console.error("Error displaying notification:", error));});


self.addEventListener("notificationclick", function (event) {
  console.log("[firebase-messaging-sw.js] Notification click received.");

  event.notification.close();

  // This checks if the client is already open and if it is, it focuses on the tab. If it is not open, it opens a new tab with the URL passed in the notification payload
  event.waitUntil(
    clients
      // https://developer.mozilla.org/en-US/docs/Web/API/Clients/matchAll
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(function (clientList) {
        const url = event.notification.data.url;

        if (!url) return;

        // If relative URL is passed in firebase console or API route handler, it may open a new window as the client.url is the full URL i.e. https://example.com/ and the url is /about whereas if we passed in the full URL, it will focus on the existing tab i.e. https://example.com/about
        for (const client of clientList) {
          if (client.url === url && "focus" in client) {
            return client.focus();
          }
        }

        if (clients.openWindow) {
          console.log("OPENWINDOW ON CLIENT");
          return clients.openWindow(url);
        }
      })
  );
});
