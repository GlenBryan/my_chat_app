const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const clients = new Map(); // username => ws

app.use(express.static(path.join(__dirname, "public")));

wss.on("connection", (ws) => {
  let username = "";

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "register") {
      username = data.username;
      clients.set(username, ws);
      broadcast("group", `${username} joined the chat.`);
    }

    if (data.type === "private") {
      const target = clients.get(data.to);
      if (target) {
        target.send(JSON.stringify({ from: username, message: data.message, private: true }));
      }
    }

    if (data.type === "group") {
      broadcast("group", `${username}: ${data.message}`);
    }
  });

  ws.on("close", () => {
    clients.delete(username);
    broadcast("group", `${username} left the chat.`);
  });

  function broadcast(type, msg) {
    for (let [, client] of clients) {
      client.send(JSON.stringify({ from: username, message: msg, private: false, type }));
    }
  }
});

server.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
