const express = require("express");
const bodyParser = require("body-parser");
const mqtt = require("mqtt");
const mysql = require("mysql2");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

// Kubernetes palvelujen DNS-nimet
const MQTT_HOST = process.env.MQTT_HOST || "mqtt";
const DB_HOST = process.env.DB_HOST || "chatdb";
const DB_USER = process.env.DB_USER || "chatuser";
const DB_PASSWORD = process.env.DB_PASSWORD || "chatpass";
const DB_NAME = process.env.DB_NAME || "chatdb";

// MQTT client
const client = mqtt.connect(`mqtt://${MQTT_HOST}:1883`);

// MariaDB pool
const db = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
});

let messages = [];

// MQTT subscribe
client.on("connect", () => {
  console.log("MQTT connected");
  client.subscribe("chat", () => console.log("Subscribed to chat topic"));
});

client.on("message", (topic, message) => {
  const msg = message.toString();
  messages.push(msg);
  if (messages.length > 10) messages.shift();

  db.query("INSERT INTO messages (text) VALUES (?)", [msg], (err) => {
    if (err) console.error("DB insert error:", err);
  });
});

// API endpoints
app.get("/messages", (req, res) => {
  db.query("SELECT text FROM messages ORDER BY id DESC LIMIT 10", (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send("DB error");
    }
    res.json(results.map(r => r.text).reverse());
  });
});

app.post("/send", (req, res) => {
  const text = req.body.text;
  if (!text) return res.status(400).send("No message");

  client.publish("chat", text);
  res.sendStatus(200);
});

// Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
