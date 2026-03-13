import { Dispatch } from "@reduxjs/toolkit";
import { addMessage } from "../messages/model/messagesSlice";
import { setConnectionStatus, setError } from "./websocketSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_URL = API_BASE_URL.replace(/^http(s?):\/\//, (_, protocol) => {
  return protocol ? 'wss://' : 'ws://';
});

export interface WSMessage {
  id: number;
  senderId: number;
  username: string;
  content: string;
  createdAt: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private dispatch: Dispatch | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private isConnecting = false;

  connect(dispatch: Dispatch) {
    // Предотвращаем множественные подключения
    if (this.isConnecting) {
      console.log("WebSocket connection already in progress");
      return;
    }

    // Если уже есть активное соединение, не создаем новое
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log("WebSocket already connected");
      return;
    }

    // Если есть соединение в процессе закрытия, ждем
    if (this.socket?.readyState === WebSocket.CONNECTING) {
      console.log("WebSocket is connecting...");
      return;
    }

    this.isConnecting = true;
    this.dispatch = dispatch;
    
    // Закрываем существующее соединение, если оно есть в состоянии CLOSING
    if (this.socket && this.socket.readyState === WebSocket.CLOSING) {
      this.socket = null;
    }
    
    try {
      console.log("Creating new WebSocket connection...");
      this.socket = new WebSocket(`${WS_URL}/ws`);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      this.isConnecting = false;
      dispatch(setError("Ошибка подключения к WebSocket"));
      this.handleReconnect();
    }
  }

  private handleOpen() {
    console.log("WebSocket connected successfully");
    this.isConnecting = false;
    this.reconnectAttempts = 0;
    
    if (this.dispatch) {
      this.dispatch(setConnectionStatus("connected"));
    }
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data) as WSMessage;
      
      if (this.dispatch) {
        this.dispatch(addMessage({
          id: message.id,
          senderId: Number(message.senderId),
          username: message.username,
          content: message.content,
          createdAd: message.createdAt,
        }));
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }

  private handleClose() {
    console.log("WebSocket disconnected");
    this.isConnecting = false;
    this.socket = null;
    
    if (this.dispatch) {
      this.dispatch(setConnectionStatus("disconnected"));
    }
    this.handleReconnect();
  }

  private handleError(error: Event) {
    console.error("WebSocket error:", error);
    this.isConnecting = false;
    
    if (this.dispatch) {
      this.dispatch(setError("Ошибка WebSocket соединения"));
    }
  }

  private handleReconnect() {
    // Очищаем предыдущий таймер реконнекта
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectTimeout * this.reconnectAttempts;
      
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts} in ${delay}ms`);

      this.reconnectTimer = setTimeout(() => {
        if (this.dispatch && !this.isConnecting) {
          console.log(`Attempting reconnect #${this.reconnectAttempts}`);
          this.connect(this.dispatch);
        }
      }, delay);
    } else {
      console.error("Max reconnection attempts reached");
      if (this.dispatch) {
        this.dispatch(setError("Не удалось подключиться к чату"));
      }
    }
  }

  sendMessage(content: string): boolean {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ content }));
      return true;
    } else {
      console.error("Cannot send message - WebSocket not connected", {
        readyState: this.socket?.readyState,
        exists: !!this.socket
      });
      return false;
    }
  }

  disconnect() {
    console.log("Manually disconnecting WebSocket");
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      // Убираем обработчики, чтобы избежать лишних вызовов
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onclose = null;
      this.socket.onerror = null;
      
      if (this.socket.readyState === WebSocket.OPEN) {
        this.socket.close();
      }
      this.socket = null;
    }
    
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  getConnectionState(): string {
    if (!this.socket) return "CLOSED";
    switch (this.socket.readyState) {
      case WebSocket.CONNECTING: return "CONNECTING";
      case WebSocket.OPEN: return "OPEN";
      case WebSocket.CLOSING: return "CLOSING";
      case WebSocket.CLOSED: return "CLOSED";
      default: return "UNKNOWN";
    }
  }
}

export const websocketService = new WebSocketService();