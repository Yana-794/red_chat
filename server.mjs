import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { WebSocketServer, WebSocket } from 'ws';
import { fileURLToPath } from 'url';
import { dirname,  } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 8080;

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());




// Данные пользователей
let users = [
  { id: 1, username: 'Алиса', password: '123' },
  { id: 2, username: 'Боб', password: '123' },
  { id: 3, username: 'test', password: 'test' }
];

// Регистрация нового пользователя
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  if (users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Пользователь уже существует' });
  }
  
  const newUser = {
    id: users.length + 1,
    username,
    password
  };
  
  users.push(newUser);
  
  res.cookie('jwt', `fake-jwt-token-${newUser.id}`, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });
  
  res.status(201).json({
    message: 'token generated',
    username,
    token: `fake-jwt-token-${newUser.id}`
  });
});

// Вход в систему
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  console.log('Login attempt:', { username, password });
  console.log('Available users:', users);
  
  const user = users.find(u => u.username === username && u.password === password);
  
  if (!user) {
    return res.status(401).json({ error: 'Неверные учетные данные' });
  }
  
  res.cookie('jwt', `fake-jwt-token-${user.id}`, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });
  
  res.json({
    message: 'token generated',
    username,
      id: user.id,  
    token: `fake-jwt-token-${user.id}`
  });
});

// Выход из системы
app.post('/api/logout', (req, res) => {
  res.clearCookie('jwt');
  res.status(204).send();
});

// Получение информации о текущем пользователе
app.get('/api/me', (req, res) => {
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const userId = parseInt(req.cookies.jwt.split('-').pop() || '0');
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }
  
  res.json({
    id: user.id,
    username: user.username
  });
});

// Получение информации о пользователе (для getUserInfoThunk)
app.get('/api/user', (req, res) => {
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const userId = parseInt(req.cookies.jwt.split('-').pop() || '0');
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }
  
  res.json({
    id: user.id,
    username: user.username
  });
});

// Получение сообщений
app.get('/api/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const beforeId = req.query.before ? parseInt(req.query.before) : null;
  
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  let sortedMessages = [...messages].sort((a, b) => 
    new Date(a.CreatedAt).getTime() - new Date(b.CreatedAt).getTime()
  );
  
  // Если указан beforeId, берем сообщения до этого ID
  if (beforeId) {
    const beforeIndex = sortedMessages.findIndex(m => m.Id === beforeId);
    if (beforeIndex !== -1) {
      sortedMessages = sortedMessages.slice(0, beforeIndex);
    }
  }
  
  const limitedMessages = sortedMessages.slice(-limit);
  
  console.log(`Sending ${limitedMessages.length} messages`);
  res.json(limitedMessages);
});

// Удаление сообщения
app.delete('/api/messages/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const userId = parseInt(req.cookies.jwt.split('-').pop() || '0');
  
  const messageIndex = messages.findIndex(m => m.Id === id);
  
  if (messageIndex === -1) {
    return res.status(404).json({ error: 'Сообщение не найдено' });
  }
  
  if (messages[messageIndex].SenderId !== userId) {
    return res.status(403).json({ error: 'Нет прав на удаление этого сообщения' });
  }
  
  messages.splice(messageIndex, 1);
  res.status(204).send();
});

// Запуск HTTP сервера
const server = app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log('Доступные пользователи:', users.map(u => ({ username: u.username, password: u.password })));
});

// Создание WebSocket сервера
const wss = new WebSocketServer({ server, path: '/ws' });

// Обработка WebSocket соединений
wss.on('connection', (ws, req) => {
  console.log('WebSocket подключен');
  
  // Проверка авторизации через cookie
  const cookies = req.headers.cookie;
  if (!cookies || !cookies.includes('jwt')) {
    console.log('WebSocket не авторизован - нет JWT cookie');
    ws.close(1008, 'Unauthorized');
    return;
  }
  
  // Извлечение ID пользователя из cookie
  const jwtMatch = cookies.match(/jwt=fake-jwt-token-(\d+)/);
  const userId = jwtMatch ? parseInt(jwtMatch[1]) : null;
  
  if (!userId) {
    console.log('WebSocket не авторизован - неверный токен');
    ws.close(1008, 'Unauthorized');
    return;
  }
  
  // Поиск пользователя по ID
  const user = users.find(u => u.id === userId);
  
  if (!user) {
    console.log('WebSocket не авторизован - пользователь не найден');
    ws.close(1008, 'Unauthorized');
    return;
  }
  
  console.log(`WebSocket авторизован как пользователь: ${user.username} (ID: ${user.id})`);
  
  // Сохраняем информацию о пользователе для этого соединения
  const currentUser = user;
  
  // Обработка входящих сообщений
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('Получено сообщение от пользователя:', currentUser.username);
      
      // Проверка на пустое сообщение
      if (!message.content || message.content.trim() === '') {
        return;
      }
      
      // Создание нового сообщения
      const newMessage = {
        id: Date.now(),
        senderId: currentUser.id,
        username: currentUser.username,
        content: message.content,
        createdAt: new Date().toISOString()
      };
      
      // Добавление в массив сообщений
      messages.push(newMessage);
      console.log('Создано новое сообщение:', newMessage);
      
      // Рассылка всем подключенным клиентам
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(newMessage));
        }
      });
      
    } catch (error) {
      console.error('Ошибка при обработке сообщения:', error);
    }
  });
  
  // Обработка закрытия соединения
  ws.on('close', () => {
    console.log('WebSocket отключен');
  });
  
  // Обработка ошибок
  ws.on('error', (error) => {
    console.error('Ошибка WebSocket:', error);
  });
});

console.log(`WebSocket сервер запущен на ws://localhost:${PORT}/ws`);