// app/page.tsx
'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import styles from './ChatPage.module.css'; // Import CSS module

interface Message {
  id: string;
  text: string;
  timestamp: string;
  // sender?: string; // Future: for distinguishing users
}

// A type for the expected error structure from our API (for POST errors)
interface ApiErrorResponse {
  error: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const messageListRef = useRef<HTMLDivElement>(null);

  // Function to scroll to the bottom of the message list
  const scrollToBottom = () => {
    if (messageListRef.current) {
      messageListRef.current.scrollTop = messageListRef.current.scrollHeight;
    }
  };

  // Fetch messages on component mount
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/messages');
        if (!response.ok) {
          let errorMsg = `Failed to fetch messages: ${response.statusText}`;
          try {
            const errorData: ApiErrorResponse = await response.json();
            if (errorData && errorData.error) {
              errorMsg = errorData.error;
            }
          } catch { // <--- MODIFIED HERE: No variable binding
            // Intentionally ignore parsing error, errorMsg remains response.statusText
          }
          throw new Error(errorMsg);
        }
        const data: Message[] = await response.json();
        setMessages(data.reverse());
      } catch (err) { 
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred while fetching messages.');
        }
        console.error('Fetch messages error:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, []);

  // Scroll to bottom when messages change or after initial load
  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: newMessage }),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        throw new Error(errorData.error || `Failed to post message: ${response.statusText}`);
      }

      const postedMessage: Message = await response.json();
      setMessages(prevMessages => [...prevMessages, postedMessage]);
      setNewMessage('');
    } catch (err) { 
      if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('An unknown error occurred while posting.');
      }
      console.error('Submit message error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.chatPageContainer}>
      <header className={styles.chatHeader}>
        Redis Chat Room
      </header>

      <div className={styles.messageList} ref={messageListRef}>
        {isLoading && <p className={styles.loading}>Loading messages...</p>}
        {error && <p className={styles.error}>Error: {error}</p>}
        {!isLoading && !error && messages.length === 0 && (
          <p className={styles.noMessages}>No messages yet. Start the conversation!</p>
        )}
        {!isLoading && !error && messages.map((msg) => (
          <div key={msg.id} className={`${styles.messageItem} ${styles.receivedMessage}`}>
            <p>{msg.text}</p>
            <small>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className={styles.inputArea}>
        <input
          type="text"
          className={styles.inputField}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={isSubmitting}
          autoFocus
        />
        <button type="submit" className={styles.sendButton} disabled={isSubmitting || !newMessage.trim()}>
          {isSubmitting ? 'Sending...' : 'Send'}
        </button>
      </form>
      {submitError && <p style={{ color: 'red', textAlign: 'center', padding: '0.5rem' }}>Failed to send: {submitError}</p>}
    </div>
  );
}