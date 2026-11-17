package chat

import "time"

func timeNowPlusWriteTimeout() time.Time { return time.Now().Add(3 * time.Second) }
