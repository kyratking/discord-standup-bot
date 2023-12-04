const { Client, Events, ChannelType } = require("discord.js");
const { greet, sendError } = require("./utils");
const {
  existsOrCreateSheet,
  appendStandup,
  markDeleted,
  updateContent,
} = require("./sheets");
require("dotenv").config();

const guildToTrack = process.env.GUILD_TO_TRACK;
const categoryToTrack = process.env.CATEGORY_TO_TRACK || "standups";

const client = new Client({
  intents: ["Guilds", "GuildMessages", "MessageContent"],
});

const allowedChannelIds = [];

client.on("ready", () => {
  greet();
  const category = client.channels.cache.find(
    (channel) =>
      channel.guildId === guildToTrack &&
      channel.type === ChannelType.GuildCategory &&
      channel.name.toLowerCase() === categoryToTrack.toLowerCase()
  );
  if (!category)
    throw new Error(
      `Category ${categoryToTrack} not found. Please either create the category or modify the environment variable CATEGORY_TO_TRACK to match the category name`
    );
  category.children.cache.forEach((channel) =>
    allowedChannelIds.push(channel.id)
  );
  console.log(
    "Allowing messages to be accepted from following channel IDs",
    allowedChannelIds
  );
});

client.addListener(Events.MessageCreate, async (message) => {
  const { author, content, channelId, nonce, createdTimestamp } = message;
  if (!allowedChannelIds.includes(channelId)) return;
  const { username, globalName } = author;
  await existsOrCreateSheet(username);
  await appendStandup(username, content, nonce, createdTimestamp);
  console.log(
    `Saved a standup by ${globalName}. Content ${content}, nonce ${nonce}`
  );
});

client.addListener(Events.MessageUpdate, async (oldMessage, newMessage) => {
  const { author, content, channelId, nonce } = newMessage;
  if (!allowedChannelIds.includes(channelId)) return;
  const { username } = author;
  await updateContent(username, content, nonce);
  console.log(`Updated a standup with nonce ${nonce} for ${username}`);
});

client.addListener(Events.MessageDelete, async (message) => {
  const { author, channelId, nonce } = message;
  if (!allowedChannelIds.includes(channelId)) return;
  const { username } = author;
  await markDeleted(username, nonce);
  console.log(`Deleted a standup with nonce ${nonce} for ${username}`);
});

client.on(Events.Error, (error) => {
  console.error(error);
  sendError("Error in Stand-Up Bot", error);
});

client.login(process.env.DISCORD_TOKEN);
