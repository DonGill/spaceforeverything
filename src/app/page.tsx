'use client';

import { useEffect, useState } from 'react';
import Image from "next/image";

interface Message {
  id: number;
  message: string;
  created_at: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMessages() {
      try {
        const response = await fetch('/api/messages');
        const data = await response.json();
        
        if (data.success) {
          setMessages(data.messages);
        } else {
          setError(data.error || 'Failed to fetch messages');
        }
      } catch (err) {
        setError('Connection error');
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchMessages();
  }, []);

  return (
    <div className="font-sans grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        <Image
          className="dark:invert"
          src="/next.svg"
          alt="Next.js logo"
          width={180}
          height={38}
          priority
        />
        
        <div className="text-center sm:text-left">
          <h1 className="text-2xl font-bold mb-4">Azure SQL + Next.js Test</h1>
          
          {loading && (
            <p className="text-gray-600">Loading messages from Azure SQL...</p>
          )}
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              Error: {error}
            </div>
          )}
          
          {!loading && !error && messages.length > 0 && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              <h2 className="font-semibold mb-2">Messages from Azure SQL Database:</h2>
              <ul className="space-y-2">
                {messages.map((msg) => (
                  <li key={msg.id} className="bg-white p-2 rounded shadow">
                    {msg.message}
                    <div className="text-sm text-gray-500 mt-1">
                      {new Date(msg.created_at).toLocaleString()}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <ol className="font-mono list-inside list-decimal text-sm/6 text-center sm:text-left">
          <li className="mb-2 tracking-[-.01em]">
            Configure Azure SQL connection in{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              .env.local
            </code>
          </li>
          <li className="tracking-[-.01em]">
            Run the SQL script in{" "}
            <code className="bg-black/[.05] dark:bg-white/[.06] font-mono font-semibold px-1 py-0.5 rounded">
              database/init.sql
            </code>
          </li>
        </ol>
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
        <div className="text-sm text-gray-600">
          Next.js + Azure SQL Database Integration Test
        </div>
      </footer>
    </div>
  );
}
