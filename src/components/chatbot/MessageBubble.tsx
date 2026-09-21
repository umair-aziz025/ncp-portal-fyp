import { Bot, User } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} items-start space-x-2`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
          <Bot className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        </div>
      )}
      <div
        className={`max-w-[70%] px-4 py-2 rounded-2xl ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-sm'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-sm'
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        <p
          className={`text-xs mt-1 ${
            isUser ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
      )}
    </div>
  );
};
