import { MessageCircle, Send } from 'lucide-react';

export default function WhatsAppDemo() {
  const demoConversation = [
    { text: 'Hello, I need help finding government schemes', sender: 'user' },
    {
      text: 'I am a 30-year-old farmer from Maharashtra with an annual income of 2.5 lakhs',
      sender: 'user',
    },
    {
      text: 'You are eligible for:\n• PMAY (PM-Awas Yojana)\n• KCC (Kisan Credit Card)\n• PMKSY (Pradhan Mantri Krishi Sinchayee Yojana)',
      sender: 'bot',
    },
    { text: 'Can you show me the application steps?', sender: 'user' },
    {
      text: 'Sure! For KCC:\n1. Visit your nearest bank\n2. Fill Form KCC-A\n3. Submit documents\n4. Get approval',
      sender: 'bot',
    },
  ];

  return (
    <div className="bg-white rounded-lg shadow-lg max-w-md mx-auto overflow-hidden">
      {/* WhatsApp Header */}
      <div className="bg-gradient-to-r from-green-400 to-bharat-green text-white p-4">
        <div className="flex items-center space-x-2">
          <MessageCircle size={20} />
          <div>
            <h3 className="font-bold">PolicyGPT Bharat</h3>
            <p className="text-xs opacity-90">Always online</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="h-96 overflow-y-auto bg-gray-100 p-4 space-y-3">
        {demoConversation.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg text-sm whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-green-500 text-white rounded-br-none'
                  : 'bg-white text-gray-800 rounded-bl-none shadow'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="bg-white border-t p-3 flex items-center space-x-2">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm"
          disabled
        />
        <button className="bg-green-500 text-white p-2 rounded-full hover:bg-green-600 transition">
          <Send size={18} />
        </button>
      </div>

      {/* Footer Info */}
      <div className="text-xs text-center text-gray-500 p-2">
        Messages are end-to-end encrypted
      </div>
    </div>
  );
}
