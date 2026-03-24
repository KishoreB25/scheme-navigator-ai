import { useRef, useEffect } from 'react';

export default function MessageBubble({ message, isUser }) {
  const bubbleRef = useRef(null);

  useEffect(() => {
    bubbleRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (isUser) {
    return (
      <div ref={bubbleRef} className="flex justify-end mb-4">
        <div className="bg-saffron text-white rounded-lg rounded-tr-none px-4 py-2 max-w-xs lg:max-w-md">
          <p className="text-sm">{message.content}</p>
          <span className="text-xs opacity-70 mt-1 block">
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
    <div ref={bubbleRef} className="flex justify-start mb-4">
      <div className={`rounded-lg rounded-tl-none px-4 py-2 max-w-xs lg:max-w-md ${
        message.isError 
          ? 'bg-red-100 text-red-700 border border-red-300'
          : 'bg-gray-100 text-gray-800'
      }`}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <span className="text-xs opacity-70 mt-1 block">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </span>
      </div>
    </div>
  );
}
