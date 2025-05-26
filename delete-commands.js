const { REST, Routes } = require('discord.js');
const fs = require('fs');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const DISCORD_TOKEN = config.token;
const CLIENT_ID = config.clientId; // Your bot's client ID
const GUILD_ID = config.guildId; // Your server's guild ID

const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

const deleteAllCommands = async () => {
    try {
        console.log('Started deleting all application (/) commands.');

        // Fetch all commands for the bot in the guild
        const commands = await rest.get(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID));

        // Loop through all commands and delete them
        for (const command of commands) {
            await rest.delete(Routes.applicationGuildCommand(CLIENT_ID, GUILD_ID, command.id));
            console.log(`Deleted command: ${command.name}`);
        }

        console.log('Successfully deleted all application (/) commands.');
    } catch (error) {
        console.error('Error deleting commands:', error);
    }
};

deleteAllCommands();
