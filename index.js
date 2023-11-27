const { Client, GatewayIntentBits, Events } = require("discord.js");
const { google } = require("googleapis");
require("dotenv").config();

const client = new Client({
  intents: ["Guilds", "GuildMessages", "MessageContent"],
});

client.on("ready", () => {
  console.log("Successfully connected to Discord");
});

client.addListener(Events.MessageCreate, (message) => {
  const { author, content } = message;
  const { username, globalName } = author;
  console.log(`Standup by ${globalName}. Content ${content}`);
});

client.addListener(Events.MessageDelete, (message) => {
  console.log("Message", message);
});

client.login(process.env.DISCORD_TOKEN);
