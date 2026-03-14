import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Разрешенные origin для CORS
// const allowedOrigins = [
//   'http://localhost:3000',
//   'https://red-chat-pink.vercel.app', // ваш Vercel URL
//   // Добавьте другие домены если нужно
// ];

// Middleware
app.use(cors({
  origin: true, // true разрешает текущий origin
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

// Путь к файлу с данными
const DATA_FILE = path.join(__dirname, 'data.json');

// Структура данных
let data = {
  users: [],
  messages: []
};

// Загрузка данных из файла
function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const fileData = fs.readFileSync(DATA_FILE, 'utf8');
      data = JSON.parse(fileData);
    } else {
      // Начальные данные
      data = {
        users: [
          { id: 1, username: 'Алиса', password: '123' },
          { id: 2, username: 'Боб', password: '123' },
          { id: 3, username: 'test', password: 'test' }
        ],
        messages: []
      };
      saveData();
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
  }
}

// Сохранение данных в файл
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
  }
}

// Загружаем данные при старте
loadData();

// Регистрация нового пользователя
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  if (data.users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Пользователь уже существует' });
  }
  
  // Генерируем новый ID
  const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
  
  const newUser = {
    id: newId,
    username,
    password
  };
  
  data.users.push(newUser);
  saveData();
  
  res.cookie('jwt', `fake-jwt-token-${newUser.id}`, {
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'lax'
  });
  
  res.status(201).json({
    message: 'token generated',
    username,
    id: newUser.id,
    token: `fake-jwt-token-${newUser.id}`
  });
});

// Вход в систему
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  const user = data.users.find(u => u.username === username && u.password === password);
  
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
  const user = data.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }
  
  res.json({
    id: user.id,
    username: user.username
  });
});

// Получение информации о пользователе (алиас для /api/me)
app.get('/api/user', (req, res) => {
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const userId = parseInt(req.cookies.jwt.split('-').pop() || '0');
  const user = data.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }
  
  res.json({
    id: user.id,
    username: user.username
  });
});

// Получение списка всех пользователей (без паролей)
app.get('/api/users', (req, res) => {
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const publicUsers = data.users.map(({ id, username }) => ({ id, username }));
  res.json(publicUsers);
});

// Получение сообщений
app.get('/api/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  const beforeId = req.query.before ? parseInt(req.query.before) : null;
  
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  let sortedMessages = [...data.messages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  if (beforeId) {
    const beforeIndex = sortedMessages.findIndex(m => m.id === beforeId);
    if (beforeIndex !== -1) {
      sortedMessages = sortedMessages.slice(0, beforeIndex);
    }
  }
  
  const limitedMessages = sortedMessages.slice(-limit);
  
  res.json(limitedMessages);
});

// Удаление сообщения
app.delete('/api/messages/:id', (req, res) => {
  const id = parseInt(req.params.id);
  
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const userId = parseInt(req.cookies.jwt.split('-').pop() || '0');
  
  const messageIndex = data.messages.findIndex(m => m.id === id);
  
  if (messageIndex === -1) {
    return res.status(404).json({ error: 'Сообщение не найдено' });
  }
  
  if (data.messages[messageIndex].senderId !== userId) {
    return res.status(403).json({ error: 'Нет прав на удаление этого сообщения' });
  }
  
  data.messages.splice(messageIndex, 1);
  saveData();
  res.status(204).send();
});

// Запуск HTTP сервера
const server = app.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
  console.log(`WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`Доступные пользователи: ${data.users.map(u => u.username).join(', ')}`);
});

// Создание WebSocket сервера
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
  // Проверка авторизации через cookie
  const cookies = req.headers.cookie;
  if (!cookies || !cookies.includes('jwt')) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  
  const jwtMatch = cookies.match(/jwt=fake-jwt-token-(\d+)/);
  const userId = jwtMatch ? parseInt(jwtMatch[1]) : null;
  
  if (!userId) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  
  const user = data.users.find(u => u.id === userId);
  
  if (!user) {
    ws.close(1008, 'Unauthorized');
    return;
  }
  
  const currentUser = user;
  
  ws.on('message', (messageData) => {
    try {
      const message = JSON.parse(messageData.toString());
      
      if (!message.content || message.content.trim() === '') {
        return;
      }
      
      const newMessage = {
        id: Date.now(),
        senderId: currentUser.id,
        username: currentUser.username,
        content: message.content,
        createdAt: new Date().toISOString()
      };
      
      data.messages.push(newMessage);
      saveData();
      
      // Рассылаем сообщение всем подключенным клиентам
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(newMessage));
        }
      });
      
    } catch (error) {
      console.error('Ошибка при обработке сообщения:', error);
    }
  });
});

// Обработка graceful shutdown
process.on('SIGINT', () => {
  saveData();
  wss.close();
  server.close(() => {
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  saveData();
  wss.close();
  server.close(() => {
    process.exit(0);
  });
});