import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { WebSocketServer } from 'ws';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import fs from 'fs';
import path from 'path';
import multer from 'multer';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

// Разрешенные origin для CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:8080'
];

// Middleware
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'CORS policy не разрешает этот origin';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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
      
      data.users = data.users.map(user => ({
        id: user.id,
        username: user.username,
        password: user.password,
        description: user.description || '',
        avatar: user.avatar || null
      }));
      
      console.log('Данные загружены из файла');
    } else {
      data = {
        users: [
          { id: 1, username: 'Алиса', password: '123', description: '', avatar: null },
          { id: 2, username: 'Боб', password: '123', description: '', avatar: null },
          { id: 3, username: 'test', password: 'test', description: '', avatar: null }
        ],
        messages: []
      };
      saveData();
      console.log('Созданы начальные данные');
    }
  } catch (error) {
    console.error('Ошибка загрузки данных:', error);
    data = {
      users: [
        { id: 1, username: 'Алиса', password: '123', description: '', avatar: null },
        { id: 2, username: 'Боб', password: '123', description: '', avatar: null },
        { id: 3, username: 'test', password: 'test', description: '', avatar: null }
      ],
      messages: []
    };
  }
}

// Сохранение данных в файл
function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    console.log('Данные сохранены в файл');
  } catch (error) {
    console.error('Ошибка сохранения данных:', error);
  }
}

// Загружаем данные при старте
loadData();

// ВАЖНО: Абсолютный путь к папке uploads
const uploadDir = path.join(__dirname, 'uploads', 'avatars');
console.log('Директория для загрузок:', uploadDir);

// Создаем директорию для загрузок, если её нет
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Создана директория для загрузок');
}

// Проверяем права на запись
try {
  fs.accessSync(uploadDir, fs.constants.W_OK);
  console.log('Директория доступна для записи');
} catch (error) {
  console.error('Ошибка доступа к директории:', error);
}

// Настройка multer для загрузки аватаров
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const filename = 'avatar-' + uniqueSuffix + path.extname(file.originalname);
    console.log('Сохраняем файл:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Только изображения разрешены'));
    }
  }
});

// ВАЖНО: Правильная настройка статической раздачи
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Добавляем middleware для логирования запросов к статике (для отладки)
app.use('/uploads', (req, res, next) => {
  console.log('Static request:', req.url);
  console.log('Full path:', path.join(__dirname, 'uploads', req.url));
  next();
});

// Регистрация нового пользователя
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }
  
  if (data.users.find(u => u.username === username)) {
    return res.status(409).json({ error: 'Пользователь уже существует' });
  }
  
  const newId = data.users.length > 0 ? Math.max(...data.users.map(u => u.id)) + 1 : 1;
  
  const newUser = {
    id: newId,
    username,
    password,
    description: '',
    avatar: null
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
  
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Получение информации о пользователе
app.get('/api/user', (req, res) => {
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const userId = parseInt(req.cookies.jwt.split('-').pop() || '0');
  const user = data.users.find(u => u.id === userId);
  
  if (!user) {
    return res.status(401).json({ error: 'Пользователь не найден' });
  }
  
  const { password, ...userWithoutPassword } = user;
  res.json(userWithoutPassword);
});

// Обновление профиля пользователя
app.put('/api/user/profile', (req, res, next) => {
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  next();
}, upload.single('avatar'), (req, res) => {
  try {
    console.log('Обновление профиля, файл:', req.file);
    
    const userId = parseInt(req.cookies.jwt.split('-').pop() || '0');
    const userIndex = data.users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    
    const { username, description } = req.body;
    
    if (username && username.trim() !== '') {
      const existingUser = data.users.find(u => u.username === username && u.id !== userId);
      if (existingUser) {
        return res.status(409).json({ error: 'Это имя пользователя уже занято' });
      }
      data.users[userIndex].username = username;
    }
    
    if (description !== undefined) {
      data.users[userIndex].description = description;
    }
    
    if (req.file) {
      const oldAvatar = data.users[userIndex].avatar;
      if (oldAvatar) {
        const oldAvatarPath = path.join(__dirname, oldAvatar);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
          console.log('Удален старый аватар:', oldAvatar);
        }
      }
      
      data.users[userIndex].avatar = `/uploads/avatars/${req.file.filename}`;
      console.log('Новый аватар сохранен:', data.users[userIndex].avatar);
      
      // Проверяем, что файл действительно существует
      const savedFilePath = path.join(__dirname, 'uploads', 'avatars', req.file.filename);
      if (fs.existsSync(savedFilePath)) {
        console.log('Файл успешно сохранен:', savedFilePath);
      } else {
        console.error('Файл не найден после сохранения:', savedFilePath);
      }
    }
    
    saveData();
    
    const { password, ...userWithoutPassword } = data.users[userIndex];
    res.json(userWithoutPassword);
    
  } catch (error) {
    console.error('Ошибка при обновлении профиля:', error);
    res.status(500).json({ error: 'Внутренняя ошибка сервера' });
  }
});

// Получение списка всех пользователей
app.get('/api/users', (req, res) => {
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const publicUsers = data.users.map(({ id, username, description, avatar }) => ({ 
    id, 
    username, 
    description, 
    avatar 
  }));
  res.json(publicUsers);
});

// Получение сообщений
app.get('/api/messages', (req, res) => {
  if (!req.cookies.jwt) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  
  const limit = parseInt(req.query.limit) || 50;
  const beforeId = req.query.before ? parseInt(req.query.before) : null;
  
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
  console.log(`Static files served from: ${path.join(__dirname, 'uploads')}`);
});

// Создание WebSocket сервера
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', (ws, req) => {
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