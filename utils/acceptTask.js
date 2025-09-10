// utils/acceptTask.js
import axios from 'axios';
const API_BASE = 'http://192.168.59.131:5000/api';

/**
 * Accept a task and open the chat.
 * @param {object} navigation - React Navigation object
 * @param {object} params - { taskId, clientId, taskerId, currentUser }
 */
export async function acceptTaskAndOpenChat(navigation, { taskId, clientId, taskerId, currentUser }) {
  const { data } = await axios.post(`${API_BASE}/tasks/${taskId}/accept`, {
    clientId,
    taskerId,
  });
  if (!data?.success) throw new Error('Accept failed');

  // Navigate into the Chat tab's inner screen with the new thread
  navigation.navigate('Chat', {
    screen: 'Chat',
    params: {
      taskId,
      threadId: data.threadId, // returned by the accept route
      user: { id: currentUser.id, name: currentUser.name },
    },
  });
}
