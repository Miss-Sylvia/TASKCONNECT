// utils/openChatForTask.js
import axios from 'axios';
const API_BASE = 'http://192.168.59.131:5000/api';

export async function openChatForTask(navigation, { taskId, currentUser }) {
  const { data } = await axios.get(`${API_BASE}/chat/thread/by-task/${taskId}`);
  const threadId = data?.thread?.id;

  // Since Chat is a Tab with a nested Stack:
  navigation.navigate('Chat', {
    screen: 'Chat',
    params: {
      taskId,
      threadId,
      user: { id: currentUser.id, name: currentUser.name },
    },
  });
}
