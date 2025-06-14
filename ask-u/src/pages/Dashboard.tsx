import { useEffect, useState } from "react";
import axios from "axios";

const Dashboard = () => {
  const [roomCode, setRoomCode] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    const url = new URL(window.location.href);
    const _token = url.searchParams.get("token");
    if (_token) {
      localStorage.setItem("token", _token);
      setToken(_token);
    } else {
      setToken(localStorage.getItem("token") || "");
    }
  }, []);

  const createRoom = async () => {
    try {
      const res = await axios.post(
        "http://localhost:4000/api/room/create",
        { title: "My Room" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(`Room created: ${res.data.code}`);
    } catch (err) {
      console.error("Room creation error", err);
      alert("Failed to create room. Are you logged in?");
    }
  };

  const joinRoom = async () => {
    const username = prompt("Enter your name:");
    if (!username || !roomCode) return alert("Name and Room Code required");

    try {
      // Validate room from backend
      await axios.post(
        `http://localhost:4000/api/room/${roomCode}/join`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Store user info locally
      localStorage.setItem("username", username);
      window.location.href = `/room/${roomCode}`;
    } catch (err: any) {
      if (err.response?.status === 404) {
        alert("Room not found. Please check the code.");
      } else if (err.response?.status === 403) {
        alert("Room is locked.");
      } else {
        alert("Failed to join room.");
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mt-16">
      <h2 className="text-2xl font-semibold mb-6">Welcome to Ask U Like</h2>

      <button
        onClick={createRoom}
        className="px-4 py-2 bg-blue-600 text-white rounded mb-6"
      >
        Create Room
      </button>

      <input
        className="border px-3 py-2 rounded mb-2"
        placeholder="Enter Room Code"
        value={roomCode}
        onChange={(e) => setRoomCode(e.target.value)}
      />
      <button
        onClick={joinRoom}
        className="px-4 py-2 bg-green-600 text-white rounded"
      >
        Join Room
      </button>
    </div>
  );
};

export default Dashboard;
