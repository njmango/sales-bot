// import all the requirements at the top for readability
const { Client, Collection, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
const fetch = import('node-fetch');
const sqlite3 = require('sqlite3');
const dotenv = require('dotenv').config()
const fs = require('fs');
const { AsciiTable3, AlignmentEnum } = require('ascii-table3'); 
const { logToFileAndConsole } = require('./utilities.js');


const path = require('node:path');
const variables = require('./vars.json');
const commandsHelp = variables.commands;

// get the token from dotenv
const token = process.env.TOKEN;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.commands = new Collection();

const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
	const commandsPath = path.join(foldersPath, folder);
	const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const filePath = path.join(commandsPath, file);
		const command = require(filePath);
		// Set a new item in the Collection with the key as the command name and the value as the exported module
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
		} else {
			console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
		}
	}
}

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

client.on('ready', () => {
    logToFileAndConsole(`Logged in as ${client.user.tag}!`);
});

function initDatabase() {

    const db = new sqlite3.Database('./testsalesData.db', (err) => {
        if (err) {
            logToFileAndConsole('Error opening database ' + err.message);
            return;
        }
    });
    

    db.run(`CREATE TABLE IF NOT EXISTS sales_list (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        orderNumber INTEGER,
        channel_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        quality INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        action_type TEXT NOT NULL,
        price REAL,
        price_modifier TEXT,
        is_fixed_price INTEGER
    )`, (err) => {
        if (err) {
            logToFileAndConsole("Create table error: " + err.message);
            return;
        }
        logToFileAndConsole("Table 'sales_list' ensured.");
    });

    // CREATE A USERS TABLE
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT,
        username TEXT,
        cached_time INTEGER
    )`, (err) => {
        if (err) {
            logToFileAndConsole("Create table error: " + err.message);
            return;
        }
        logToFileAndConsole("Table 'users' ensured.");
    });

    // create a channels table
    db.run(`CREATE TABLE IF NOT EXISTS channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        discord_id TEXT
    )`, (err) => {
        if (err) {
            logToFileAndConsole("Create table error: " + err.message);
            return;
        }
        logToFileAndConsole("Table 'channels' ensured.");
    });

    // and an items table
    db.run(`CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        type INTEGER,
        cached_time INTEGER
    )`, (err) => {
        if (err) {
            logToFileAndConsole("Create table error: " + err.message);
            return;
        }
        logToFileAndConsole("Table 'items' ensured.");
    });

    // create a prices table
    db.run(`CREATE TABLE IF NOT EXISTS prices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER,
        quality INTEGER,
        price REAL,
        cached_time INTEGER
    )`, (err) => {
        if (err) {
            logToFileAndConsole("Create table error: " + err.message);
            return;
        }
        logToFileAndConsole("Table 'prices' ensured.");
    });

    // create a table for market orders



    db.close((err) => {
        if (err) {
            logToFileAndConsole('Error closing database ' + err.message);
            return;
        }
    });

}

client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    const content = msg.content.toLowerCase();

    const oldCommands = [
        '!showlistbig', 
        '!showbig', 
        '!listbig', 
        '!biglist', 
        '!helpc', 
        '!help', 
        '!edit', 
        '!sell', 
        '!buy', 
        '!showlist', 
        '!show', 
        '!list', 
        '!delete', 
        '!clear', 
        '!insert', 
        '!price', 
        '!sell.fixed', 
        '!buy.fixed', 
        '!filter'
    ]

    oldCommands.forEach(command => {
        if (content.startsWith(command)) {
            msg.channel.send(`The command ${command} is deprecated. If you type in /, you can see the available commands.`);
        }
    });
    

});

initDatabase();
client.login(token);