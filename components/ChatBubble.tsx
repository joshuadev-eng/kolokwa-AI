
import React from 'react';
import { Message, Role } from '../types';

interface ChatBubbleProps {
  message: Message;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === Role.USER;

  return (
    <div className={`flex w-full mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end`}>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${isUser ? 'ml-2 bg-blue-600' : 'mr-2 bg-red-600'}`}>
          {isUser ? <i className="fas fa-user"></i> : <i className="fas fa-robot"></i>}
        </div>
        <div className={`px-4 py-3 rounded-2xl shadow-sm ${
          isUser 
            ? 'bg-blue-600 text-white rounded-br-none' 
            : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none'
        }`}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
          <p className={`text-[10px] mt-1 ${isUser ? 'text-blue-100' : 'text-gray-400'}`}>
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatBubble;
