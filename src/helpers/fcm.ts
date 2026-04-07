import * as admin from "firebase-admin";
import config from "../config";

if (config.firebase.projectId && config.firebase.clientEmail && config.firebase.privateKey) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: config.firebase.projectId,
        clientEmail: config.firebase.clientEmail,
        privateKey: config.firebase.privateKey,
      }),
    });
    console.log("Firebase Admin initialized successfully");
  } catch (error) {
    console.error("Firebase initialization error:", error);
  }
} else {
  console.warn("Firebase credentials missing. Push notifications will be disabled.");
}

/**
 * Sends a push notification to a specific device.
 * @param token FCM device token
 * @param title Notification title
 * @param body Notification body
 * @param data Optional data payload
 */
export const sendPushNotification = async (
  token: string,
  title: string,
  body: string,
  data?: any,
) => {
  if (!token) return;

  const message = {
    notification: {
      title,
      body,
    },
    data: data || {},
    token: token,
  };

  try {
    const response = await admin.messaging().send(message);
    console.log("Successfully sent message:", response);
    return response;
  } catch (error) {
    console.error("Error sending push notification:", error);
    // If token is invalid or expired, we might want to handle it (e.g., remove from user)
  }
};
