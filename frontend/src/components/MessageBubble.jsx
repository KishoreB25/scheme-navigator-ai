import { useRef, useEffect } from 'react';

export default function MessageBubble({ message, isUser }) {
  const bubbleRef = useRef(null);

  useEffect(() => {
    bubbleRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (isUser) {
    return (
      <div ref={bubbleRef} className="flex justify-end mb-4 animate-fade-in">
        <div className="bg-blue-600 text-white rounded-lg rounded-tr-none px-4 py-3 max-w-xs lg:max-w-md shadow-sm">
          <p className="text-sm leading-relaxed">{message.content}</p>
          <span className="text-xs opacity-70 mt-2 block">
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div ref={bubbleRef} className="flex justify-start mb-4 animate-fade-in">
      <div className={`rounded-lg rounded-tl-none px-4 py-3 max-w-xs lg:max-w-md ${
        message.isError 
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
      }`}>
        <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.content}</p>
        <span className="text-xs opacity-70 mt-2 block text-gray-500">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
