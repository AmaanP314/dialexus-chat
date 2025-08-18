import React from "react";
import { Check, CheckCheck } from "lucide-react";

interface MessageStatusProps {
  status: "sent" | "received" | "read";
}

/**
 * Renders the message status ticks (sent, received, read).
 */
const MessageStatus: React.FC<MessageStatusProps> = ({ status }) => {
  const iconSize = 16;
  const className = "inline-block ml-2";

  switch (status) {
    case "read":
      return (
        <CheckCheck
          size={iconSize}
          className={`${className} text-status-read`}
        />
      );
    case "received":
      return <CheckCheck size={iconSize} className={className} />;
    case "sent":
      return <Check size={iconSize} className={className} />;
    default:
      return null;
  }
};

export default MessageStatus;
