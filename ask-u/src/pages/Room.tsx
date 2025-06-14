import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import io from "socket.io-client";

const socket = io("https://ask-u-like.onrender.com"); // Replace with your backend URL

const Room = () => {
  const { code } = useParams();
  const [room, setRoom] = useState<any>(null);
  const [messages, setMessages] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  const username = localStorage.getItem("username") || "Anonymous";
  const token = localStorage.getItem("token");
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await axios.post(
          `https://ask-u-like.onrender.com/api/room/${code}/join`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRoom(res.data);
        socket.emit("join-room", { roomCode: code, username });
      } catch (err: any) {
        alert(err.response?.data?.message || "Room join error");
      }
    };

    fetchRoom();
  }, [code]);

  useEffect(() => {
    socket.on("receive-message", (msg: string) => {
      setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!message.trim()) return;
    const fullMessage = `${username}: ${message}`;
    socket.emit("send-message", { roomCode: code, message: fullMessage });
    setMessages((prev) => [...prev, fullMessage]);
    setMessage("");
  };

  const lockRoom = async () => {
    try {
      await axios.post(
        `https://ask-u-like.onrender.com/api/room/${code}/lock`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Room Locked");
      setRoom({ ...room, isLocked: true });
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to lock room");
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="max-w-2xl mx-auto mt-8 p-4 border rounded shadow">
      <h2 className="text-xl font-bold mb-2">Room Code: {code}</h2>
      <p className="text-gray-600">Logged in as: {username}</p>
      {room?.isLocked && <p className="text-red-500 mt-2">🔒 This room is locked</p>}
      {!room?.isLocked && (
        <button
          onClick={lockRoom}
          className="bg-red-600 text-white px-3 py-1 rounded mt-3"
        >
          Lock Room
        </button>
      )}

      <div className="mt-6 h-64 overflow-y-auto border p-3 bg-gray-100 rounded">
        {messages.map((msg, idx) => (
          <div key={idx} className="mb-1">
            {msg}
          </div>
        ))}
        <div ref={chatEndRef}></div>
      </div>

      <div className="mt-4 flex">
        <input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="flex-1 px-3 py-2 border rounded-l"
          placeholder="Type your message..."
        />
        <button
          onClick={sendMessage}
          className="bg-blue-600 text-white px-4 py-2 rounded-r"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default Room;
