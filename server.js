const express = require("express");
const bodyParser = require("body-parser");
const mqtt = require("mqtt");
const mysql = require("mysql2");

const app = express();
app.use(bodyParser.json());
app.use(express.static("public"));

const client = mqtt.connect("mqtt://mqtt:1883");

const db = mysql.createPool({
  host: process.env.DB_HOST || "chatdb",
  user: process.env.DB_USER || "chatuser",
  password: process.env.DB_PASSWORD || "chatpass",
  database: process.env.DB_NAME || "chatdb"
});

let messages = [];

client.on("connect", () => {
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

app.get("/messages", (req, res) => {
  db.query("SELECT text FROM messages ORDER BY id DESC LIMIT 10", (err, results) => {
    if (err) return res.status(500).send(err);
    const msgs = results.map(r => r.text).reverse();
    res.json(msgs);
  });
});

app.post("/send", (req, res) => {
  const text = req.body.text;
  if (!text) return res.status(400).send("No message");

  // Lähetetään MQTT:lle
  client.publish("chat", text);

  // Tallenna myös suoraan tietokantaan
  db.query("INSERT INTO messages (text) VALUES (?)", [text], (err) => {
    if (err) {
      console.error("DB insert error:", err);
      return res.status(500).send("Database error");
    }
    // Lisää muistiin chat-listaan
    messages.push(text);
    if (messages.length > 10) messages.shift();
    res.sendStatus(200);
  });
});


const PORT = 3000;
app.listen(PORT, () => console.log(`Chat service running on port ${PORT}`));

