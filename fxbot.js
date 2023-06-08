require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const axios = require('axios');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const url = process.env.API_URL;
const channelId = process.env.CHANNEL_ID;
const updateEnabled = process.env.UPDATE_ENABLED === 'true';
const deleteOldMessages = process.env.DELETE_OLD_MESSAGES === 'true';

let isBotActive = false;
let updateMessage = null;

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
  if (message.content === '!open' && message.channel.id === channelId) {
    if (!isBotActive) {
      isBotActive = true;
      message.channel.send(' ```Bot has been activated. Sending automatic updates.``` ');
      startBot();
    } else {
      message.channel.send(' ```Bot is already active.``` ');
    }
  }

  if (message.content === '!stop' && message.channel.id === channelId) {
    if (isBotActive) {
      isBotActive = false;
      message.channel.send(' ```Bot has been deactivated. Automatic updates stopped.``` ');
    } else {
      message.channel.send(' ```Bot is already inactive.``` ');
    }
  }
});

async function startBot() {
    while (isBotActive) {
      try {
        const response = await axios.get(url);
        const data = response.data;
  
        const platform = 'MT5';
        const server = 'Live1';
        const spreadProfile = 'Prime';
  
        const spreadProfilePrices = data
          .filter(item => item.topo.platform === platform && item.topo.server === server)
          .flatMap(item => item.spreadProfilePrices.filter(price => price.spreadProfile === 'Prime'));
  
        if (spreadProfilePrices.length > 0) {
          const priceMessages = spreadProfilePrices.map(price => ` ▶ Bid: ${price.bid},\n ▶ Ask: ${price.ask}`).join('\n');
  
          if (updateEnabled) {
            if (updateMessage) {
              if (deleteOldMessages) {
                updateMessage.delete();
              } else {
                updateMessage.edit(`# Spread Profile Prices for ${platform} on server: ${server}\n # Account: ${spreadProfile}\n\`\`\`${priceMessages}\`\`\``);
              }
            } else {
              updateMessage = await client.channels.cache.get(channelId).send(`# Spread Profile Prices for ${platform} on server: ${server}\n # Account: ${spreadProfile}\n\`\`\`${priceMessages}\`\`\``);
            }
          } else {
            client.channels.cache.get(channelId).send(`# Spread Profile Prices for ${platform} on server: ${server}\n # Account: ${spreadProfile}\n\`\`\`${priceMessages}\`\`\``);
          }
        } else {
          client.channels.cache.get(channelId).send(`No data found for ${platform} on ${server} server.`);
        }
      } catch (error) {
        console.error('Error fetching Forex data:', error);
      }
  
      await wait(5000);
    }
  }  

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

client.login(process.env.TOKEN);
