import { Dispatch } from "@reduxjs/toolkit";
import { addMessage, Message } from "../messages/model/messagesSlice";
import { setConnectionStatus, setError } from "../websocket/websocketSlice";
import { updateChatLastMessage } from "@/src/feature/chat/model/ChatSlise";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://redchat.space";
const WS_URL = API_BASE_URL.replace(/^http/, "ws"); // https:// -> wss://, http:// -> ws://

type MessageHandler = (message: Message) => void;

class WebSocketService {
  private socket: WebSocket | null = null;
  private dispatch: Dispatch | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 3000;
  private messageHandlers: MessageHandler[] = [];
  private activeChat: number | null = null;

  connect(dispatch: Dispatch) {
    // метод запоминает курьера
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
      const message = JSON.parse(event.data) as Message;
      this.messageHandlers.forEach((handler) => handler(message));

      if (this.dispatch) {
        this.dispatch(addMessage(message));

        this.dispatch(updateChatLastMessage({
          chatId: 1,// ID текущего чата (нужно получать из состояния)
          message: message.content,
          time: message.createdAd,
        }))
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
      console.log(
        `Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
      );

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
    if (this.socket && this.socket.readyState == WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ content }));
      return true;
    } else {
      console.error("WebSocket is not connected");
      return false;
    }
  }
  addMessageHandler(handler: MessageHandler) {
    this.messageHandlers.push(handler);
  }

  removeMessageHandler(handler: MessageHandler) {
    this.messageHandlers = this.messageHandlers.filter((h) => h !== handler);
  }
  setActiveChat(chatId: number){
    this.activeChat = chatId;
  }
  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.messageHandlers = [];
  }
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }
}
export const websocketService = new WebSocketService();
