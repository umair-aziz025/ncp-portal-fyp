import { useState, useRef, useEffect } from 'react';
import { Send, Bot } from 'lucide-react';
import { MessageBubble } from './MessageBubble';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const ChatWindow = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        'Hello! I am your Academic Assistant. I can help you with academic questions, course information, study tips, and portal navigation. How can I assist you today?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isAcademicQuery = (query: string): boolean => {
    const nonAcademicKeywords = [
      'poem',
      'love',
      'romance',
      'joke',
      'story',
      'game',
      'movie',
      'song',
      'recipe',
      'weather',
      'news',
      'celebrity',
    ];

    const lowerQuery = query.toLowerCase();
    return !nonAcademicKeywords.some((keyword) => lowerQuery.includes(keyword));
  };

  const generateResponse = async (query: string): Promise<string> => {
    await new Promise((resolve) => setTimeout(resolve, 1000));

    if (!isAcademicQuery(query)) {
      return "I'm sorry, but I can only assist with academic-related questions, course information, study materials, and portal navigation. Please ask me something related to your studies or the university portal.";
    }

    const responses: Record<string, string> = {
      default:
        "I understand your question. For specific academic queries, please consult your course materials or contact your instructor. I'm here to help with general academic guidance and portal navigation.",
      portal:
        'The University NCP Portal has several sections:\n\n1. Dashboard - Your main overview\n2. Notifications - Important announcements\n3. Resources - Study materials and lectures\n4. Feedback - Submit queries and concerns\n\nYou can access these from the sidebar menu.',
      resources:
        'To access educational resources:\n1. Click on "Resources" in the sidebar\n2. Filter by your semester and subject\n3. Browse and download materials uploaded by faculty\n4. You can also use tags to find specific content',
      notification:
        'Notifications appear in the Notifications section. You can:\n- View all announcements from faculty and administration\n- Filter by type and department\n- Mark notifications as read\n- Check your profile dropdown for recent alerts',
      feedback:
        'To submit feedback:\n1. Go to the Feedback section\n2. Select a category (Academic, Technical, Administrative, or General)\n3. Describe your query or concern\n4. Track the status in "My Activity"',
      study:
        'Here are some effective study tips:\n- Review lecture notes within 24 hours\n- Create a study schedule and stick to it\n- Use active recall and spaced repetition\n- Form study groups with classmates\n- Take regular breaks (Pomodoro technique)\n- Access resources from the Resources section',
    };

    const lowerQuery = query.toLowerCase();

    if (lowerQuery.includes('portal') || lowerQuery.includes('navigate')) {
      return responses.portal;
    }
    if (lowerQuery.includes('resource') || lowerQuery.includes('material')) {
      return responses.resources;
    }
    if (lowerQuery.includes('notification') || lowerQuery.includes('announcement')) {
      return responses.notification;
    }
    if (lowerQuery.includes('feedback') || lowerQuery.includes('query')) {
      return responses.feedback;
    }
    if (lowerQuery.includes('study') || lowerQuery.includes('learn')) {
      return responses.study;
    }

    return responses.default;
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await generateResponse(input);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {loading && (
          <div className="flex items-center space-x-2 text-gray-500 dark:text-gray-400">
            <Bot className="h-5 w-5" />
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask an academic question..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            disabled={loading}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
};
