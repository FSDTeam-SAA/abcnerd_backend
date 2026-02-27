import { io as socketIoClient, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:5000';
const USER_ID = '69680f25fda92b3c5a16e4ca';

const socket: Socket = socketIoClient(SERVER_URL, {
  query: { userId: USER_ID },
});

socket.on('connect', () => {
  console.log('✅ Connected to server:', socket.id);
});

socket.on('disconnect', () => {
  console.log('❌ Disconnected from server');
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection error:', error);
});

socket.on('newBooking', (data) => {
  console.log('🆕 NEW BOOKING RECEIVED!');
  console.log({
    type: data.type,
    bookingId: data.bookingId,
    customer: data.customer.name,
    service: data.service.title,
    date: data.booking.date,
    time: data.booking.startTime,
    amount: data.booking.amount,
  });

  const message = `🎉 Congratulations! ${data.customer.name} booked your "${data.service.title}" service on ${data.booking.date} at ${data.booking.startTime}.`;
  console.log(message);
});

socket.on('bookingAccepted', (data) => {
  console.log('✅ BOOKING ACCEPTED!');
  console.log({
    type: data.type,
    requestId: data.requestId,
    bookingId: data.bookingId,
    professional: data.professional.name,
    service: data.service.title,
    date: data.booking.date,
    time: data.booking.startTime,
    status: data.status,
  });

  const message = `✅ Great news! ${data.professional.name} accepted your "${data.service.title}" booking on ${data.booking.date} at ${data.booking.startTime}.`;
  console.log(message);
});

// TODO: check if this works

socket.on('bookingRejected', (data) => {
  console.log('❌ BOOKING REJECTED');
  console.log({
    type: data.type,
    requestId: data.requestId,
    bookingId: data.bookingId,
    professional: data.professional.name,
    service: data.service.title,
    date: data.booking.date,
    time: data.booking.startTime,
    status: data.status,
  });

  const message = `😔 ${data.professional.name} couldn't accept your "${data.service.title}" booking. You can try booking another professional.`;
  console.log(message);
});

socket.on('bookingCancelled', (data) => {
  console.log('🚫 BOOKING CANCELLED');
  console.log({
    type: data.type,
    bookingId: data.bookingId,
    customer: data.customer.name,
    service: data.service.title,
    date: data.booking.date,
    cancelledBy: data.cancelledBy,
    status: data.status,
  });

  const message = `🚫 ${data.customer.name} cancelled their "${data.service.title}" booking on ${data.booking.date}.`;
  console.log(message);
});

socket.on('bookingCompleted', (data) => {
  console.log('✅ BOOKING COMPLETED!');
  console.log({
    type: data.type,
    requestId: data.requestId,
    bookingId: data.bookingId,
    professional: data.professional.name,
    service: data.service.title,
    date: data.booking.date,
    amount: data.booking.amount,
    status: data.status,
  });

  const message = `✅ ${data.professional.name} completed your "${data.service.title}" service. ${data.message}`;
  console.log(message);
});
socket.on('userBlocked', (data) => {
  console.log('✅ User Blocked');

  const message = `✅ ${data.type} successful`;
  console.log(message);
});
socket.on('userUnblocked', (data) => {
  console.log('✅ User unblocked');

  const message = `✅ ${data.type} successful`;
  console.log(message);
});

socket.on('typing', ({ userId }) => {
  console.log(`👀 ${userId} is typing...`);
});

socket.on('stopTyping', ({ userId }) => {
  console.log(`✋ ${userId} stopped typing`);
});

socket.on('newMessage', (data) => {
  console.log(
    `📩 New message from ${data?.sender?.name || 'Sender'}: ${data?.content}`,
  );
});

socket.on('deleteMessage', (data) => {
  console.log(`🗑️ Message deleted by ${data?.sender?.name}: ${data?.content}`);
});

socket.on('newComment', (data) => {
  const message = `💬 You received a new review for "${data.serviceId.title}" from ${data.userId.name}.`;
  console.log(message);
});

export const switchUserRole = (role: 'customer' | 'professional') => {
  const userIds = {
    customer: '69680f25fda92b3c5a16e4ca',
    professional: '69680f25fda92b3c5a16e4cb',
  };

  console.log(`🔄 Switching to ${role} mode...`);
  console.log(`Use this user ID in Postman: ${userIds[role]}`);
};

export const checkConnection = () => {
  console.log('🔍 Connection Status:');
  console.log('- Connected:', socket.connected);
  console.log('- Socket ID:', socket.id);
  console.log('- User ID:', USER_ID);
};
