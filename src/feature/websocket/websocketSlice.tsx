import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export type ConnectetionStatus =
  | "connected"
  | "disconnected"
  | "connecting"
  | "error";

interface WebSocketState {
  status: ConnectetionStatus;
  error: string | null;
}

const initialState: WebSocketState = {
  status: "disconnected",
  error: null,
};

const websocketSlise = createSlice({
  name: "websocket",
  initialState,
  reducers: {
    setConnectionStatus(state, action: PayloadAction<ConnectetionStatus>) {
      state.status = action.payload;
      if (action.payload !== "error") {
        state.error = null;
      }
    },
    setError(state, action: PayloadAction<string>) {
      state.status = "error";
      state.error = action.payload;
    },
  },
});
export const { setConnectionStatus, setError } = websocketSlise.actions;

export default websocketSlise.reducer;
