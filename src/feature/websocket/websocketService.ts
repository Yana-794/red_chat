import { Dispatch } from "@reduxjs/toolkit";
import { addMessage } from "../messages/model/messagesSlice";
import { setConnectionStatus, setError } from "./websocketSlice";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const WS_URL = API_BASE_URL.replace(/^http/, "ws");

export interface WSMessage {
  Id: number;
  SenderId: number;
  Username: string;
  Content: string;
  CreatedAt: string;
}

class WebSocketService {
  private socket: WebSocket | null = null;
  private dispatch: Dispatch | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000;

  connect(dispatch: Dispatch) {
    this.dispatch = dispatch;
    
    try {
      this.socket = new WebSocket(`${WS_URL}/ws`);
      
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error("WebSocket connection error:", error);
      dispatch(setError("Ошибка подключения к WebSocket"));
      this.handleReconnect();
    }
  }

  private handleOpen() {
    console.log("WebSocket connected");
    if (this.dispatch) {
      this.dispatch(setConnectionStatus("connected"));
    }
    this.reconnectAttempts = 0;
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message = JSON.parse(event.data) as WSMessage;
      
      if (this.dispatch) {
        this.dispatch(addMessage({
          id: message.Id,
          secondId: message.SenderId,
          username: message.Username,
          content: message.Content,
          createdAd: message.CreatedAt,
        }));
      }
    } catch (error) {
      console.error("Error parsing message:", error);
    }
  }

  private handleClose() {
    console.log("WebSocket disconnected");
    if (this.dispatch) {
      this.dispatch(setConnectionStatus("disconnected"));
    }
    this.handleReconnect();
  }

  private handleError(error: Event) {
    console.error("WebSocket error:", error);
    if (this.dispatch) {
      this.dispatch(setError("Ошибка WebSocket соединения"));
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);

      setTimeout(() => {
        if (this.dispatch) {
          this.connect(this.dispatch);
        }
      }, this.reconnectTimeout * this.reconnectAttempts);
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
    }
    return false;
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}

export const websocketService = new WebSocketService();