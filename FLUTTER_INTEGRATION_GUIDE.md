# Flutter Integration Guide: FCM & Socket.io

This guide provides instructions for Flutter developers to integrate with the backend's real-time features: **Push Notifications (FCM)** and **WebSockets (Socket.io)**.

---

## 1. Firebase Cloud Messaging (FCM)

The backend use Firebase Admin SDK to send push notifications. To receive them, the Flutter app must register its device token.

### A. Register/Update FCM Token
Whenever the app starts or a new FCM token is generated (on token refresh), call this endpoint:

- **Endpoint**: `PATCH /api/v1/user/fcm-token`
- **Headers**: `Authorization: Bearer <ACCESS_TOKEN>`
- **Body**: 
  ```json
  {
    "fcmToken": "YOUR_DEVICE_FCM_TOKEN"
  }
  ```

### B. Notification Payload Structure
When the backend sends a notification, the Flutter app will receive a remote message. The payload structure is:

- **Title**: `data.title` or `notification.title`
- **Body**: `data.description` or `notification.body`
- **Custom Data**: Potential extra fields like `type` (e.g., `MISSION`, `WORD_REVIEW`, `SYSTEM`).

---

## 2. Socket.io Integration

The backend uses Socket.io for real-time in-app updates.

### A. Connection
Use the `socket_io_client` package in Flutter.

- **URL**: `http://<your-backend-domain>` (e.g., `http://10.0.2.2:5000` for Android emulator)
- **Query Parameter**: You **MUST** pass `userId` in the query to join your personal notification room.

```dart
IO.Socket socket = IO.io('http://<domain>', 
  IO.OptionBuilder()
    .setTransports(['websocket']) // for Flutter, websocket is recommended
    .setQuery({'userId': 'USER_MONGO_ID'}) 
    .build()
);
```

### B. Listening for Events

The backend emits several events to the user's specific room:

#### 1. New Notification
Generic event for any new database notification. Use this to update an unread counter or show an in-app snackbar.
- **Event**: `notification:new`
- **Payload**: 
  ```json
  {
    "_id": "...",
    "title": "New Mission",
    "description": "Your daily mission is ready",
    "type": "mission",
    "status": "unread"
  }
  ```

#### 2. Quiz Updated
Emitted when a new weekly quiz is available.
- **Event**: `quiz:updated`
- **Payload**: 
  ```json
  {
    "message": "New Quiz Available",
    "description": "..."
  }
  ```

#### 3. AI Mission Arrived
Specific event for chatbot-related missions.
- **Event**: `ai_mission:arrived`
- **Payload**: 
  ```json
  {
    "message": "AI chat mission arrived",
    "description": "..."
  }
  ```

### C. Joining Rooms (Optional)
If you build a real-time chat feature, you can join specific rooms:

- **Emit**: `joinChat` with `{ "chatId": "..." }`
- **Emit**: `leaveChat` with `{ "chatId": "..." }`

---

## 3. Best Practices for Flutter

1.  **Authorization**: Always ensure the `fcmToken` is updated after the user logs in.
2.  **Lifecycle**: Connect the socket when the user logs in/app opens, and disconnect when the user logs out.
3.  **Background Messaging**: For FCM, use `FirebaseMessaging.onBackgroundMessage` to handle notifications when the app is closed.
4.  **Foreground Socket**: Use Socket.io for UI updates while the app is open to avoid unnecessary push notification overhead.
