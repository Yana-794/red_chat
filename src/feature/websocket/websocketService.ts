import { Dispatch } from "@reduxjs/toolkit";
import { addMessage } from "../messages/model/messagesSlice";
import { setConnectionStatus, setError } from "./websocketSlice";
import ReconnectingWebSocket from "reconnecting-websocket";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_URL = API_BASE_URL.replace(/^http(s?):\/\//, (_, protocol) => {
  return protocol ? "wss://" : "ws://";
});

export interface WSMessage {
  id: number;
  senderId: number;
  username: string;
  content: string;
  createdAt: string;
}

class WebSocketService {
  private socket: ReconnectingWebSocket | null = null;
  private dispatch: Dispatch | null = null;

  private handleOpen = () => {
    if (this.dispatch) {
      this.dispatch(setConnectionStatus("connected"));
    }
  };

  private handleMessage = (event: MessageEvent) => {
    try {
      const message = JSON.parse(event.data) as WSMessage;
      if (this.dispatch) {
        this.dispatch(
          addMessage({
            id: message.id,
            senderId: message.senderId,
            username: message.username,
            content: message.content,
            createdAd: message.createdAt,
          }),
        );
      }
    } catch (error) {
      console.error("Ошибка парсинга сообщений", error);
    }
  };

  private handleClose = () => {
    if (this.dispatch) {
      this.dispatch(setConnectionStatus("disconnected"));
    }
  };

  private handleError = () => {
    if (this.dispatch) {
      this.dispatch(setConnectionStatus("error"));
      this.dispatch(setError("Ошибка WebSocket"));
    }
  };

  connect(dispatch: Dispatch) {
    this.dispatch = dispatch;

    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      console.log('"WebSocket уже подключен"');
      return;
    }

    try {
      this.socket = new ReconnectingWebSocket(`${WS_URL}/ws`, [], {
        maxRetries: 10,
        minReconnectionDelay: 1000,
        maxReconnectionDelay: 3000,
        maxEnqueuedMessages: 0,
        reconnectionDelayGrowFactor: 1.5,
        connectionTimeout: 4000,
        debug: process.env.NODE_ENV === "development",
      });

      this.socket.addEventListener("open", this.handleOpen);
      this.socket.addEventListener("message", this.handleMessage);
      this.socket.addEventListener("close", this.handleClose);
      this.socket.addEventListener("error", this.handleError);
    } catch (error) {
      console.error("Ошибка при создании WebSocket", error);
      if (this.dispatch) {
        this.dispatch(setError("Ошибка подключения WebSocket"));
      }
    }
  }

  /**
   * Отключение от WebSocket
   */
  disconnect() {
    if (this.socket) {
      // Удаляем обработчики
      this.socket.removeEventListener("open", this.handleOpen);
      this.socket.removeEventListener("message", this.handleMessage);
      this.socket.removeEventListener("close", this.handleClose);
      this.socket.removeEventListener("error", this.handleError);

      // Закрываем соединение
      this.socket.close();
      this.socket = null;
    }
    this.dispatch = null;
  }

  /**
   * Отправить сообщение
   * @param content - содержимое сообщения
   * @returns true, если сообщение успешно отправлено, иначе false
   */
  sendMessage(content: string): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      try {
        this.socket.send(JSON.stringify({ content }));
        return true;
      } catch (error) {
        console.error("Ошибка при отправке сообщения", error);
        return false;
      }
    }
    console.warn("WebSocket не подключен или закрыт");
    return false;
  }

  /**
   * Проверка, активно ли соединение
   */
  isConnection(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();
