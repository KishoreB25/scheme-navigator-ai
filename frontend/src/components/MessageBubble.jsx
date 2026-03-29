import { useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';

export default function MessageBubble({ message, isUser }) {
  const bubbleRef = useRef(null);

  useEffect(() => {
    bubbleRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  if (isUser) {
    return (
      <div ref={bubbleRef} className="flex justify-end mb-4 animate-fade-in">
        <div className="bg-blue-600 text-white rounded-lg rounded-tr-none px-4 py-3 max-w-xs lg:max-w-md shadow-sm">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
      <div className={`rounded-lg rounded-tl-none px-4 py-3 max-w-2xl ${
        message.isError 
          ? 'bg-red-50 text-red-700 border border-red-200'
          : 'bg-white text-gray-800 border border-gray-200 shadow-sm'
      }`}>
        <div className="text-sm leading-relaxed space-y-2 text-gray-800 markdown-body">
          <ReactMarkdown
            components={{
              p: ({ node, ...props }) => <p className="mb-2" {...props} />,
              strong: ({ node, ...props }) => <strong className="font-semibold" {...props} />,
              ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-2" {...props} />,
              ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-2" {...props} />,
              li: ({ node, ...props }) => <li className="mb-1" {...props} />,
              h1: ({ node, ...props }) => <h1 className="text-xl font-bold mt-3 mb-2" {...props} />,
              h2: ({ node, ...props }) => <h2 className="text-lg font-bold mt-3 mb-2" {...props} />,
              h3: ({ node, ...props }) => <h3 className="text-base font-bold mt-2 mb-1" {...props} />,
              a: ({ node, ...props }) => <a className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer" {...props} />,
            }}
          >
            {message.content}
          </ReactMarkdown>
        </div>
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
