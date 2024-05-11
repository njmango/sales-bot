// import all the requirements at the top for readability
const { Client, Collection, Events, GatewayIntentBits, REST, Routes } = require('discord.js');
const fetch = import('node-fetch');
const sqlite3 = require('sqlite3');
const dotenv = require('dotenv').config()
const fs = require('fs');
const { AsciiTable3, AlignmentEnum } = require('ascii-table3'); 
const path = require('node:path');
const variables = require('./vars.json');
const commandsHelp = variables.commands;

// get the token from dotenv
const token = process.env.TOKEN;

const logStream = fs.createWriteStream('./test-bot-log.txt', { flags: 'a' });

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


function logToFileAndConsole(message) {
    console.log(message);  // Log to console
    logStream.write(message + '\n');  // Write to file
}

const db = new sqlite3.Database('./testsalesData.db', (err) => {
    if (err) {
        logToFileAndConsole('Error opening database ' + err.message);
        return;
    }
});

function initDatabase() {
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

}

client.on('ready', () => {
    logToFileAndConsole(`Logged in as ${client.user.tag}!`);
});

const items = {
    1: { name: "Power", pricesR1: {}, pricesR2: {} },
    2: { name: "Water", pricesR1: {}, pricesR2: {} },
    3: { name: "Apple", pricesR1: {}, pricesR2: {} },
    4: { name: "Orange", pricesR1: {}, pricesR2: {} },
    5: { name: "Grape", pricesR1: {}, pricesR2: {} },
    6: { name: "Grain", pricesR1: {}, pricesR2: {} },
    7: { name: "Steak", pricesR1: {}, pricesR2: {} },
    8: { name: "Sausage", pricesR1: {}, pricesR2: {} },
    9: { name: "Egg", pricesR1: {}, pricesR2: {} },
    10: { name: "Crude oil", pricesR1: {}, pricesR2: {} },
    11: { name: "Petrol", pricesR1: {}, pricesR2: {} },
    12: { name: "Diesel", pricesR1: {}, pricesR2: {} },
    13: { name: "Transport", pricesR1: {}, pricesR2: {} },
    14: { name: "Mineral", pricesR1: {}, pricesR2: {} },
    15: { name: "Bauxite", pricesR1: {}, pricesR2: {} },
    16: { name: "Silicon", pricesR1: {}, pricesR2: {} },
    17: { name: "Chemical", pricesR1: {}, pricesR2: {} },
    18: { name: "Aluminium", pricesR1: {}, pricesR2: {} },
    19: { name: "Plastic", pricesR1: {}, pricesR2: {} },
    20: { name: "Processor", pricesR1: {}, pricesR2: {} },
    21: { name: "Electronic component", pricesR1: {}, pricesR2: {} },
    22: { name: "Battery", pricesR1: {}, pricesR2: {} },
    23: { name: "Display", pricesR1: {}, pricesR2: {} },
    24: { name: "Smart phone", pricesR1: {}, pricesR2: {} },
    25: { name: "Tablet", pricesR1: {}, pricesR2: {} },
    26: { name: "Laptop", pricesR1: {}, pricesR2: {} },
    27: { name: "Monitor", pricesR1: {}, pricesR2: {} },
    28: { name: "Television", pricesR1: {}, pricesR2: {} },
    29: { name: "Plant research", pricesR1: {}, pricesR2: {} },
    30: { name: "Energy research", pricesR1: {}, pricesR2: {} },
    31: { name: "Mining research", pricesR1: {}, pricesR2: {} },
    32: { name: "Electronics research", pricesR1: {}, pricesR2: {} },
    33: { name: "Breeding research", pricesR1: {}, pricesR2: {} },
    34: { name: "Chemistry research", pricesR1: {}, pricesR2: {} },
    35: { name: "Software", pricesR1: {}, pricesR2: {} },
    40: { name: "Cotton", pricesR1: {}, pricesR2: {} },
    41: { name: "Fabric", pricesR1: {}, pricesR2: {} },
    42: { name: "Iron ore", pricesR1: {}, pricesR2: {} },
    43: { name: "Steel", pricesR1: {}, pricesR2: {} },
    44: { name: "Sand", pricesR1: {}, pricesR2: {} },
    45: { name: "Glass", pricesR1: {}, pricesR2: {} },
    46: { name: "Leather", pricesR1: {}, pricesR2: {} },
    47: { name: "On-board computer", pricesR1: {}, pricesR2: {} },
    48: { name: "Electric motor", pricesR1: {}, pricesR2: {} },
    49: { name: "Luxury car interior", pricesR1: {}, pricesR2: {} },
    50: { name: "Basic interior", pricesR1: {}, pricesR2: {} },
    51: { name: "Car body", pricesR1: {}, pricesR2: {} },
    52: { name: "Combustion engine", pricesR1: {}, pricesR2: {} },
    53: { name: "Economy e-car", pricesR1: {}, pricesR2: {} },
    54: { name: "Luxury e-car", pricesR1: {}, pricesR2: {} },
    55: { name: "Economy car", pricesR1: {}, pricesR2: {} },
    56: { name: "Luxury car", pricesR1: {}, pricesR2: {} },
    57: { name: "Truck", pricesR1: {}, pricesR2: {} },
    58: { name: "Automotive research", pricesR1: {}, pricesR2: {} },
    59: { name: "Fashion research", pricesR1: {}, pricesR2: {} },
    60: { name: "Underwear", pricesR1: {}, pricesR2: {} },
    61: { name: "Glove", pricesR1: {}, pricesR2: {} },
    62: { name: "Dress", pricesR1: {}, pricesR2: {} },
    63: { name: "Stiletto Heel", pricesR1: {}, pricesR2: {} },
    64: { name: "Handbag", pricesR1: {}, pricesR2: {} },
    65: { name: "Sneaker", pricesR1: {}, pricesR2: {} },
    66: { name: "Seed", pricesR1: {}, pricesR2: {} },
    67: { name: "Xmas cracker", pricesR1: {}, pricesR2: {} },
    68: { name: "Gold ore", pricesR1: {}, pricesR2: {} },
    69: { name: "Golden bar", pricesR1: {}, pricesR2: {} },
    70: { name: "Luxury watch", pricesR1: {}, pricesR2: {} },
    71: { name: "Necklace", pricesR1: {}, pricesR2: {} },
    72: { name: "Sugarcane", pricesR1: {}, pricesR2: {} },
    73: { name: "Ethanol", pricesR1: {}, pricesR2: {} },
    74: { name: "Methane", pricesR1: {}, pricesR2: {} },
    75: { name: "Carbon fiber", pricesR1: {}, pricesR2: {} },
    76: { name: "Carbon composite", pricesR1: {}, pricesR2: {} },
    77: { name: "Fuselage", pricesR1: {}, pricesR2: {} },
    78: { name: "Wing", pricesR1: {}, pricesR2: {} },
    79: { name: "High grade e-comp", pricesR1: {}, pricesR2: {} },
    80: { name: "Flight computer", pricesR1: {}, pricesR2: {} },
    81: { name: "Cockpit", pricesR1: {}, pricesR2: {} },
    82: { name: "Attitude control", pricesR1: {}, pricesR2: {} },
    83: { name: "Rocket fuel", pricesR1: {}, pricesR2: {} },
    84: { name: "Propellant tank", pricesR1: {}, pricesR2: {} },
    85: { name: "Solid fuel booster", pricesR1: {}, pricesR2: {} },
    86: { name: "Rocket engine", pricesR1: {}, pricesR2: {} },
    87: { name: "Heat shield", pricesR1: {}, pricesR2: {} },
    88: { name: "Ion drive", pricesR1: {}, pricesR2: {} },
    89: { name: "Jet engine", pricesR1: {}, pricesR2: {} },
    90: { name: "Sub-orbital 2nd stage", pricesR1: {}, pricesR2: {} },
    91: { name: "Sub-orbital rocket", pricesR1: {}, pricesR2: {} },
    92: { name: "Orbital booster", pricesR1: {}, pricesR2: {} },
    93: { name: "Starship", pricesR1: {}, pricesR2: {} },
    94: { name: "BFR", pricesR1: {}, pricesR2: {} },
    95: { name: "Jumbo jet", pricesR1: {}, pricesR2: {} },
    96: { name: "Luxury jet", pricesR1: {}, pricesR2: {} },
    97: { name: "Single engine plane", pricesR1: {}, pricesR2: {} },
    98: { name: "Quadcopter", pricesR1: {}, pricesR2: {} },
    99: { name: "Satellite", pricesR1: {}, pricesR2: {} },
    100: { name: "Aerospace research", pricesR1: {}, pricesR2: {} },
    101: { name: "Reinforced concrete", pricesR1: {}, pricesR2: {} },
    102: { name: "Brick", pricesR1: {}, pricesR2: {} },
    103: { name: "Cement", pricesR1: {}, pricesR2: {} },
    104: { name: "Clay", pricesR1: {}, pricesR2: {} },
    105: { name: "Limestone", pricesR1: {}, pricesR2: {} },
    106: { name: "Wood", pricesR1: {}, pricesR2: {} },
    107: { name: "Steel beam", pricesR1: {}, pricesR2: {} },
    108: { name: "Plank", pricesR1: {}, pricesR2: {} },
    109: { name: "Window", pricesR1: {}, pricesR2: {} },
    110: { name: "Tool", pricesR1: {}, pricesR2: {} },
    111: { name: "Construction unit", pricesR1: {}, pricesR2: {} },
    112: { name: "Bulldozer", pricesR1: {}, pricesR2: {} },
    113: { name: "Materials research", pricesR1: {}, pricesR2: {} },
    114: { name: "Robot", pricesR1: {}, pricesR2: {} },
    115: { name: "Cow", pricesR1: {}, pricesR2: {} },
    116: { name: "Pig", pricesR1: {}, pricesR2: {} },
    117: { name: "Milk", pricesR1: {}, pricesR2: {} },
    118: { name: "Coffee bean", pricesR1: {}, pricesR2: {} },
    119: { name: "Coffee powder", pricesR1: {}, pricesR2: {} },
    120: { name: "Vegetable", pricesR1: {}, pricesR2: {} },
    121: { name: "Bread", pricesR1: {}, pricesR2: {} },
    122: { name: "Cheese", pricesR1: {}, pricesR2: {} },
    123: { name: "Apple pie", pricesR1: {}, pricesR2: {} },
    124: { name: "Orange juice", pricesR1: {}, pricesR2: {} },
    125: { name: "Apple cider", pricesR1: {}, pricesR2: {} },
    126: { name: "Ginger beer", pricesR1: {}, pricesR2: {} },
    127: { name: "Frozen pizza", pricesR1: {}, pricesR2: {} },
    128: { name: "Pasta", pricesR1: {}, pricesR2: {} },
    129: { name: "Hamburger", pricesR1: {}, pricesR2: {} },
    130: { name: "Lasagna", pricesR1: {}, pricesR2: {} },
    131: { name: "Meat ball", pricesR1: {}, pricesR2: {} },
    132: { name: "Cocktail", pricesR1: {}, pricesR2: {} },
    133: { name: "Flour", pricesR1: {}, pricesR2: {} },
    134: { name: "Butter", pricesR1: {}, pricesR2: {} },
    135: { name: "Sugar", pricesR1: {}, pricesR2: {} },
    136: { name: "Cocoa", pricesR1: {}, pricesR2: {} },
    137: { name: "Dough", pricesR1: {}, pricesR2: {} },
    138: { name: "Sauce", pricesR1: {}, pricesR2: {} },
    139: { name: "Fodder", pricesR1: {}, pricesR2: {} },
    140: { name: "Chocolate", pricesR1: {}, pricesR2: {} },
    141: { name: "Vegetable oil", pricesR1: {}, pricesR2: {} },
    142: { name: "Salad", pricesR1: {}, pricesR2: {} },
    143: { name: "Samosa", pricesR1: {}, pricesR2: {} },
    145: { name: "Recipes", pricesR1: {}, pricesR2: {} }
};

function normalizeItemName(itemName) {
    itemName = itemName.toLowerCase();
    if (itemName.endsWith('s')) {
        itemName = itemName.slice(0, -1);
    }
    return itemName;
}

function handleMatches(channelId) {
    db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
            if (err) {
                logToFileAndConsole(`Error starting transaction: ${err.message}`);
                return;
            }

            // Adjusted SQL query to include price conditions
            let findMatchesSQL = `
                SELECT s1.id AS sell_id, s2.id AS buy_id, s1.quantity AS sell_quantity, s2.quantity AS buy_quantity, 
                       s1.item_name, s1.quality, s1.user_id AS seller_id, s2.user_id AS buyer_id, s1.price AS sell_price, s2.price AS buy_price
                FROM sales_list s1
                JOIN sales_list s2 ON s1.item_name = s2.item_name AND s1.quality = s2.quality AND s1.channel_id = s2.channel_id
                WHERE s1.channel_id = ? AND s2.channel_id = ?
                  AND ((s1.action_type = 'sell' AND s2.action_type = 'buy' AND s2.price >= s1.price)
                    OR (s1.action_type = 'buy' AND s2.action_type = 'sell' AND s1.price >= s2.price))
            `;

            db.all(findMatchesSQL, [channelId, channelId], (err, rows) => {
                if (err) {
                    logToFileAndConsole(`Error finding matches: ${err.message}`);
                    db.run("ROLLBACK");
                    return;
                }

                if (rows.length === 0) {
                    logToFileAndConsole("No matches found.");
                    db.run("COMMIT");
                    return;
                }

                logToFileAndConsole(`Found ${rows.length} matches, processing...`);

                // Process only the first match
                let row = rows[0];
                let minQuantity = Math.min(row.sell_quantity, row.buy_quantity);
                let finalPrice = row.sell_price === row.buy_price ? row.sell_price : (row.sell_id < row.buy_id ? row.sell_price : row.buy_price);

                db.run("UPDATE sales_list SET quantity = quantity - ? WHERE id IN (?, ?)", 
                    [minQuantity, row.sell_id, row.buy_id], function(err) {
                    if (err) {
                        logToFileAndConsole(`Error updating quantities: ${err.message}`);
                        db.run("ROLLBACK");
                        return;
                    }

                    // Send a notification message with price information
                    client.channels.fetch(channelId).then(channel => {
                        channel.send(`Match found! <@${row.seller_id}> please send ${minQuantity} units of ${row.item_name} Q:${row.quality} at $${finalPrice.toFixed(4)} to <@${row.buyer_id}>.`);
                    }).catch(console.error);

                    db.run("DELETE FROM sales_list WHERE quantity <= 0", (err) => {
                        if (err) {
                            logToFileAndConsole(`Error deleting zero quantity entries: ${err.message}`);
                            db.run("ROLLBACK");
                            return;
                        }
                        db.run("COMMIT", (err) => {
                            if (err) {
                                logToFileAndConsole(`Error committing transaction: ${err.message}`);
                                db.run("ROLLBACK");
                                return;
                            }
                            logToFileAndConsole("Transaction committed successfully, updating lists.");
                            publishLists(channelId); // Refresh the sales list after successful transaction
                        });
                    });
                });
            });
        });
    });
}

function addEntry(channelId, userId, userName, itemName, quality, quantity, buying, price, priceModifier, isFixedPrice) {
    const timestamp = new Date().toISOString();
    const actionType = buying ? 'buy' : 'sell';
    const formattedPrice = isFixedPrice ? price.toFixed(4) : parseFloat(price).toFixed(4);

    logToFileAndConsole(`Adding entry: ${actionType} ${quantity} of ${itemName} at quality ${quality} for $${formattedPrice} by user ${userId}`);

    const insertSQL = `
    INSERT INTO sales_list (channel_id, user_id, username, item_name, quantity, quality, timestamp, action_type, price, price_modifier, is_fixed_price)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
    db.run(insertSQL, [channelId, userId, userName, itemName, quantity, quality, timestamp, actionType, price, priceModifier, isFixedPrice ? 1 : 0], function(err) {
        if (err) {
            logToFileAndConsole(`Error inserting into sales_list: ${err.message}`);
            return;
        }
        logToFileAndConsole(`A new row has been inserted with rowid ${this.lastID}, which should be the new orderNumber`);
        // Optionally update the orderNumber based on lastID if necessary
        db.run("UPDATE sales_list SET orderNumber = ? WHERE id = ?", [this.lastID, this.lastID], function(err) {
            if (err) {
                logToFileAndConsole(`Error updating orderNumber: ${err.message}`);
            }
        });
    });
    handleMatches(channelId);
}

function sortEntries(list) {
    return list.sort((a, b) => {
        // Compare by item name
        const nameComparison = a.item_name.toLowerCase().localeCompare(b.item_name.toLowerCase());
        if (nameComparison !== 0) return nameComparison;

        // Compare by quality, highest to lowest
        const qualityComparison = b.quality - a.quality;
        if (qualityComparison !== 0) return qualityComparison;

        // Compare by price based on action type
        if (a.action_type === 'buy' && b.action_type === 'buy') {
            // Want to buy: higher prices first
            return b.price - a.price;
        } else if (a.action_type === 'sell' && b.action_type === 'sell') {
            // Want to sell: lower prices first
            return a.price - b.price;
        }

        // Compare by username
        return a.username.localeCompare(b.username);
    });
}

async function publishLists(channelId) {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
        logToFileAndConsole("Channel not found");
        return;
    }
    updateListPrices(channelId);

    // Retrieve and display sales list for both selling and buying
    const queries = {
        sell: "SELECT orderNumber, item_name, quality, quantity, price, price_modifier, username, action_type FROM sales_list WHERE action_type = 'sell' ORDER BY orderNumber DESC",
        buy: "SELECT orderNumber, item_name, quality, quantity, price, price_modifier, username, action_type FROM sales_list WHERE action_type = 'buy' ORDER BY orderNumber DESC"
    };

    for (const [listType, query] of Object.entries(queries)) {
        db.all(query, (err, rows) => {
            if (err) {
                logToFileAndConsole(`Failed to retrieve ${listType} list:`, err);
                channel.send(`Failed to retrieve the ${listType} list.`);
                return;
            }
            if (rows.length === 0) {
                channel.send(`No ${listType} entries found.`);
            } else {
                const formattedList = formatSalesList(rows, listType);
                sendChunkedMessages(channel, formattedList);
            }
        });
    }
}

function formatSalesList(rows, listType) {

    let table = new AsciiTable3(`${listType.toUpperCase()}ERS LIST`)

    // add header row
    table.setHeading('#:Item:Q' , 'Quantity', 'Price');

    rows.forEach(row => {
        const orderItemQuality = `${row.orderNumber}:${row.item_name.substring(0, 12)}:Q${row.quality}`;
        const quantityInThousands = row.quantity;
        const modifierDisplay = row.price_modifier === 0 ? 'MP' : (row.price_modifier > 0 ? `${row.price_modifier}` : `${row.price_modifier}`);
        let formattedPrice = row.price === -1 ? `MP (${modifierDisplay})` : `${row.price.toFixed(2)} (${modifierDisplay})`;

        table.addRow(orderItemQuality, quantityInThousands, formattedPrice)
    });
    
    let message = table.toString()

    return message;
}

function sendChunkedMessages(channel, message) {
    // Split message into chunks and send each chunk to avoid message size limits
    const maxMessageSize = 2000 - 6; // Adjusting for the extra characters from the code block markdown
    let start = 0;
    while (start < message.length) {
        let end = start + maxMessageSize;
        if (end < message.length && message[end] !== '\n') {
            // Ensure we end at the beginning of a new line if not at the end of the message
            let newlineIndex = message.lastIndexOf('\n', end);
            end = newlineIndex === -1 ? end : newlineIndex + 1;
        }
        const chunk = message.substring(start, end);
        channel.send(`\`\`\`${chunk}\`\`\``);
        start = end;
    }
}

function formatQuantity(quantity) {
    const quantityInThousands = quantity / 1000;
    return `${quantityInThousands.toFixed(1)}k`;
}

function formatPrice(price, modifier) {
    const priceInThousands = price / 1000;
    const formattedPrice = `${priceInThousands.toFixed(1)}k (${modifier})`;
    return formattedPrice;
}



function parseItemDetails(args) {
    logToFileAndConsole("Parsing item details from args:", args);
    if (args.length < 3) {
        logToFileAndConsole("Insufficient arguments provided.");
        return { quality: null, quantity: null, itemName: null };
    }

    let quantity = parseInt(args[args.length - 2]);
    let priceModifier = args[args.length - 1];
    let quality = parseInt(args[args.length - 3].replace(/^q/, ''));
    let itemNameOrRef = args.slice(0, args.length - 3).join(' ');

    logToFileAndConsole(`Extracted - Quality: ${quality}, Quantity: ${quantity}, ItemNameOrRef: ${itemNameOrRef}, Price Modifier: ${priceModifier}`);

    if (isNaN(quality) || quality < 0 || quality > 12 || isNaN(quantity)) {
        logToFileAndConsole("Invalid quality or quantity.");
        return { quality: null, quantity: null, itemName: null, priceModifier: null };
    }

    let refNumber = parseInt(itemNameOrRef);
    let foundItem;

    if (!isNaN(refNumber)) {
        logToFileAndConsole(`Interpreted as reference number: ${refNumber}`);
        foundItem = items[refNumber];
        if (foundItem) {
            logToFileAndConsole(`Found item by reference number: ${foundItem.name}`);
            return { quality, quantity, itemName: foundItem.name, priceModifier };
        }
    } else {
        logToFileAndConsole(`Interpreted as item name: ${itemNameOrRef}`);
        foundItem = Object.values(items).find(item => normalizeItemName(item.name) === normalizeItemName(itemNameOrRef));
        if (foundItem) {
            logToFileAndConsole(`Found item by name: ${foundItem.name}`);
            return { quality, quantity, itemName: foundItem.name, priceModifier };
        }
    }

    logToFileAndConsole("Item not found.");
    return { quality: null, quantity: null, itemName: null, priceModifier: null };
}


client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    const content = msg.content.toLowerCase();
    const args = msg.content.split(' ').slice(1);

    if (content.startsWith('!showlistbig') || content.startsWith('!showbig') || content.startsWith('!listbig') || content.startsWith('!biglist')) {
        handleBigListCommand(msg);
    } else if (content.startsWith('!helpc')) {
        handleHelpCommandCompact(msg);
    } else if (content.startsWith('!help')) {
        handleHelpCommand(msg);
    } else if (content.startsWith('!edit')) {
        handleEditCommand(msg, args);
    } else if (content.startsWith('!sell') || content.startsWith('!buy')) {
        handleSellBuyCommand(msg, args);
    } else if (content.startsWith('!showlist') || content.startsWith('!show') || content.startsWith('!list')) {
        handleShowListCommand(msg);
    } else if (content.startsWith('!delete')) {
        handleDeleteCommand(msg, args);
    } else if (content.startsWith('!clear')) {
        handleClearCommand(msg);
    } else if (content.startsWith('!insert')) {
        handleInsertCommand(msg, args);
    } else if (content.startsWith('!price')) {
        handlePriceCommand(msg, args);
    } else if (content.startsWith('!sell.fixed') || content.startsWith('!buy.fixed')) {
        handleFixedPriceCommand(msg, args);
    }
});

async function handleFixedPriceCommand(msg, args) {
    const buying = msg.content.startsWith('!buy.fixed');
    if (args.length < 4) {
        msg.channel.send(`Please use the format: !${buying ? 'buy.fixed' : 'sell.fixed'} [item name/item reference number] [quality] [quantity] [fixed price]`);
        return;
    }
    const { itemName, quality, quantity } = parseItemDetails(args);
    if (!itemName) {
        msg.channel.send("Invalid item name or reference number.");
        return;
    }
    const fixedPrice = parseFloat(args[args.length - 1]);
    if (isNaN(fixedPrice)) {
        msg.channel.send("Invalid price format.");
        return;
    }
    addEntry(msg.channel.id, msg.author.id, msg.member ? msg.member.displayName : msg.author.username, itemName, quality, quantity, buying, fixedPrice, 'fixed', true);
}

function handleHelpCommand(msg) {

    let table = new AsciiTable3('COMMANDS')
    table.setHeading('Command', 'Description')

    commandsHelp.forEach(command => {
        table.addRow(command.command, command.description)
    });

    let helpMessage = table.toString()

    sendChunkedMessages(msg.channel, helpMessage);
}
function handleHelpCommandCompact(msg) {
        
    // create a table with two columns, the description column being a wrapped column with a max width of 21 characters
    const table = new AsciiTable3()
    table.setHeading('Command', 'Description')
    table.setAlignCenter(1)
    

    // set the width of the description column table.setWidth(2, 21); and wrap the text
    table.setWrapped(2, true);
    table.setWidth(2, 21);
   
    // left align the first column
    table.setAlignLeft(1);

    // add each command and description to the table
    commandsHelp.forEach(command => {
        table.addRow(command.command, command.description)

        // check if it isn't the last row and add a separator
        if (command !== commandsHelp[commandsHelp.length - 1]) {
            table.addRow('------------','-------------------')
        }        
    });

    // send the table as a message
    let message = `${table.toString()}`

    sendChunkedMessages(msg.channel, message);
}


function handleEditCommand(msg, args) {
    if (args.length < 5) {
        msg.channel.send("Please use the format: !edit [orderNumber] [itemName] [itemQuality] [itemQuantity] [itemPrice]");
        return;
    }

    const orderNumber = args[0];
    const itemQuality = args[args.length - 3];
    const itemQuantity = args[args.length - 2];
    const itemPrice = args[args.length - 1];
    const itemName = args.slice(1, args.length - 3).join(' ');

    const orderNum = parseInt(orderNumber);
    if (isNaN(orderNum)) {
        msg.channel.send("Invalid order number.");
        return;
    }

    db.get("SELECT * FROM sales_list WHERE orderNumber = ?", [orderNum], async (err, row) => {
        if (err) {
            logToFileAndConsole(`Error retrieving entry: ${err.message}`);
            msg.channel.send("Error retrieving the entry.");
            return;
        }

        if (!row) {
            msg.channel.send(`No entry found with order number: ${orderNum}.`);
            return;
        }

        if (row.user_id !== msg.author.id && msg.author.id !== '427318093069418496') {
            msg.channel.send("You do not have permission to edit this listing.");
            return;
        }

        const updates = {};
        if (itemName.toLowerCase() !== 'x') updates.item_name = itemName;
        if (itemQuality.toLowerCase() !== 'x') updates.quality = parseInt(itemQuality);
        if (itemQuantity.toLowerCase() !== 'x') updates.quantity = parseInt(itemQuantity);
        if (itemPrice.toLowerCase() !== 'x') updates.price = parseFloat(itemPrice).toFixed(4);

        let updateQuery = "UPDATE sales_list SET ";
        let queryParams = [];
        Object.keys(updates).forEach((key, index) => {
            updateQuery += `${key} = ?`;
            queryParams.push(updates[key]);
            if (index < Object.keys(updates).length - 1) updateQuery += ", ";
        });
        updateQuery += " WHERE orderNumber = ?";
        queryParams.push(orderNum);

        db.run(updateQuery, queryParams, async (err) => {
            if (err) {
                logToFileAndConsole(`Error updating entry: ${err.message}`);
                msg.channel.send("Failed to update the listing.");
                return;
            }
            logToFileAndConsole("Entry updated successfully.");
            msg.channel.send("Listing updated successfully.");
            publishLists(msg.channel.id); // Refresh and display the updated list
        });
    });
}


async function handleSellBuyCommand(msg, args) {
    const buying = msg.content.startsWith('!buy');
    if (args.length < 4) {
        msg.channel.send(`Please use the format: !${buying ? 'buy' : 'sell'} [item name/item reference number] [quality] [quantity] [price modifier]`);
        return;
    }
    const itemQuality = args[args.length - 3];
    const itemQuantity = args[args.length - 2];
    const priceModifier = args[args.length - 1];
    const itemName = args.slice(0, args.length - 3).join(' ');

    const { quality, quantity, itemName: resolvedItemName, priceModifier: resolvedPriceModifier } = parseItemDetails([...itemName.split(' '), itemQuality, itemQuantity, priceModifier]);
    if (!resolvedItemName) {
        msg.channel.send("Invalid item name or reference number.");
        return;
    }

    // Initialize finalPrice to handle cases where no market price is found
    let finalPrice = -1; // Default to -1, which will be interpreted as 'MP'

    // Fetch item details and market price
    const itemKey = Object.keys(items).find(key => items[key].name.toLowerCase() === resolvedItemName.toLowerCase());
    if (!itemKey) {
        msg.channel.send("Item not found.");
        return;
    }

    const priceInfo = await findLowestPriceForItem(0, itemKey, quality);
    if (!priceInfo.price) {
        msg.channel.send("Failed to fetch the latest market price. Adding to list with 'MP' as price.");
        return;
    }

    // Calculate final price based on market price and modifier
    finalPrice = calculateFinalPrice(priceInfo.price, resolvedPriceModifier);

    if (validatePriceModifier(priceModifier, finalPrice) == false) {
        msg.channel.send("Invalid price modifier or final price.");
        return;
    }

    // Construct the message to send to the channel
    const responseMessage = `${buying ? 'Buying' : 'Selling'} ${resolvedItemName} at Quality ${quality} for ${quantity} units at ${finalPrice.toFixed(2)}`;
    msg.channel.send(responseMessage);

    // Add entry to the sales list
    addEntry(msg.channel.id, msg.author.id, msg.member ? msg.member.displayName : msg.author.username, resolvedItemName, quality, quantity, buying, finalPrice, resolvedPriceModifier, false);
}
async function publishBigLists(channelId) {
    const channel = client.channels.cache.get(channelId);
    if (!channel) {
        logToFileAndConsole("Channel not found");
        return;
    }
    updateListPrices(channelId);

    // Retrieve and display sales list for both selling and buying with additional columns
    const queries = {
        sell: "SELECT orderNumber, item_name, quality, quantity, price, price_modifier, username, action_type FROM sales_list WHERE action_type = 'sell' ORDER BY orderNumber DESC",
        buy: "SELECT orderNumber, item_name, quality, quantity, price, price_modifier, username, action_type FROM sales_list WHERE action_type = 'buy' ORDER BY orderNumber DESC"
    };

    for (const [listType, query] of Object.entries(queries)) {
        db.all(query, (err, rows) => {
            if (err) {
                logToFileAndConsole(`Failed to retrieve ${listType} list:`, err);
                channel.send(`Failed to retrieve the ${listType} list.`);
                return;
            }
            if (rows.length === 0) {
                channel.send(`No ${listType} entries found.`);
            } else {
                const formattedList = formatBigSalesList(rows, listType);
                sendChunkedMessages(channel, formattedList);
            }
        });
    }
}

async function handleBigListCommand(msg) {
    publishBigLists(msg.channel.id);
}

// Function to format the big sales list
function formatBigSalesList(rows, listType) {

    const headers = ["Order", "Item", "Quality", "Quantity", "Price (MP +/-)"];

    if (listType === 'sell') {
        headers.push("Seller");
    } else {
        headers.push("Buyer");
    }

    let table = new AsciiTable3(`${listType.toUpperCase()} LIST`);

    // Add header row
    table.setHeading(...headers);


    rows.forEach(row => {
        const order = row.orderNumber.toString();
        const item = row.item_name;
        const quality = row.quality.toString();
        const quantity = row.quantity.toString();
        const modifierDisplay = row.price_modifier === 0 ? '' : (row.price_modifier > 0 ? `${row.price_modifier}` : `${row.price_modifier}`);
        const priceDisplay = `${row.price.toFixed(2)} ${modifierDisplay ? `(${modifierDisplay})` : '(MP)'}`;
        const price = `${row.price.toFixed(2)} (${modifierDisplay})`;
        const seller = row.username;

        table.addRow(order, item, quality, quantity, price, seller);

    });
    
    let message = table.toString()

    return message;
}
        

function handleShowListCommand(msg) {
    // Assuming a function that fetches and formats the list of sales
    publishLists(msg.channel.id);
}

function handleDeleteCommand(msg, args) {
    if (args.length !== 1) {
        msg.channel.send("Please use the format: !delete [orderNumber]");
        return;
    }
    const orderNumber = parseInt(args[0]);
    if (isNaN(orderNumber)) {
        msg.channel.send("Invalid order number.");
        return;
    }
    db.get("SELECT user_id FROM sales_list WHERE orderNumber = ?", [orderNumber], async (err, row) => {
        if (err) {
            logToFileAndConsole(`Error fetching order: ${err.message}`);
            msg.channel.send("Failed to fetch the order.");
            return;
        }
        if (!row) {
            msg.channel.send("Order not found.");
            return;
        }
        if (msg.author.id !== row.user_id && msg.author.id !== '427318093069418496') {
            msg.channel.send("You do not have permission to delete this order.");
            return;
        }
        db.run("DELETE FROM sales_list WHERE orderNumber = ?", [orderNumber], async (err) => {
            if (err) {
                logToFileAndConsole(`Error deleting order: ${err.message}`);
                msg.channel.send("Failed to delete the order.");
                return;
            }
            logToFileAndConsole(`Order ${orderNumber} deleted successfully.`);
            msg.channel.send(`Order ${orderNumber} has been deleted successfully.`);
        });
    });
}

function handleClearCommand(msg) {
    if (msg.author.id !== '427318093069418496') {
        logToFileAndConsole("Unauthorized user attempted to use !clear");
        msg.channel.send("You do not have permission to use this command.");
        return;
    }
    const channelId = msg.channel.id;
    db.run("DELETE FROM sales_list WHERE channel_id = ?", [channelId], function(err) {
        if (err) {
            logToFileAndConsole(`Error clearing sales list for channel: ${err.message}`);
            msg.channel.send("Failed to clear the sales list.");
            return;
        }
        logToFileAndConsole(`Sales list cleared for channel ID: ${channelId}`);
        msg.channel.send("Sales list has been cleared.");
    });
}

function handleInsertCommand(msg, args) {
    if (msg.author.id !== '427318093069418496') {
        logToFileAndConsole("Unauthorized user attempted to use !insert");
        msg.channel.send("You do not have permission to use this command.");
        return;
    }
    if (args.length !== 5) {
        logToFileAndConsole("Incorrect number of arguments for !insert");
        msg.channel.send("Please use the format: !insert [userid] [referenceNumber] [itemQuality] [itemQuantity] [itemPrice]");
        return;
    }
    const [userId, referenceNumber, itemQuality, itemQuantity, itemPrice] = args.map(arg => arg.trim());
    const quality = parseInt(itemQuality);
    const quantity = parseInt(itemQuantity);
    const price = parseFloat(itemPrice);
    if (isNaN(quality) || isNaN(quantity) || isNaN(price)) {
        logToFileAndConsole("Invalid input types for !insert");
        msg.channel.send("Invalid input. Please ensure quality, quantity, and price are numbers.");
        return;
    }
    const item = items[parseInt(referenceNumber)];
    if (!item) {
        logToFileAndConsole("Invalid reference number for item");
        msg.channel.send("Invalid reference number for item.");
        return;
    }
    const itemName = item.name;
    logToFileAndConsole(`Inserting entry on behalf of user ${userId}: ${itemName}, Quality=${quality}, Quantity=${quantity}, Price=${price.toFixed(4)}`);
    client.users.fetch(userId).then(user => {
        addEntry(msg.channel.id, userId, user.username, itemName, quality, quantity, false, price);
        msg.channel.send(`Entry added for ${itemName}, Quality=${quality}, Quantity=${quantity}, Price=${price.toFixed(4)}`);
    }).catch(error => {
        console.error("Failed to fetch user:", error);
        msg.channel.send("Failed to fetch user details.");
    });
}

function handlePriceCommand(msg, args) {
    if (args.length < 2) {
        msg.channel.send("Please use the format: !price [ItemName/ItemReferenceNumber] [ItemQuality]");
        return;
    }

    // Attempt to parse the last argument as quality
    let quality = parseInt(args[args.length - 1].replace(/^q/i, ''));

    if (isNaN(quality) || quality < 0 || quality > 12) {
        msg.channel.send("Invalid input for quality. Quality should be between 0 and 12.");
        return;
    }

    // The remaining arguments are assumed to be part of the item name
    let itemNameOrNumber = args.slice(0, args.length - 1).join(' ');

    logToFileAndConsole(`Received item name or number: ${itemNameOrNumber}`);

    let itemId;
    if (!isNaN(parseInt(itemNameOrNumber))) {
        itemId = parseInt(itemNameOrNumber); // Directly use the number as an ID
    } else {
        const itemKey = Object.keys(items).find(key => items[key].name.toLowerCase() === itemNameOrNumber.toLowerCase());
        if (itemKey) {
            itemId = itemKey;  // Use the itemKey directly as the itemId
        }
    }

    if (!itemId) {
        msg.channel.send("Item ID is undefined. Cannot fetch prices.");
        return;
    }

    const realmId = 0; // Assuming realmId is always 0 as per current setup
    findLowestPriceForItem(realmId, itemId, quality).then(priceInfo => {
        if (!priceInfo.price) {
            msg.channel.send("No price found for the specified item quality or below.");
        } else {
            msg.channel.send(`${items[itemId].name}: Lowest Price: $${priceInfo.price.toFixed(4)} at Quality ${priceInfo.quality}.`);
        }
    }).catch(err => {
        msg.channel.send("Failed to fetch price information.");
    });
}

function validatePriceModifier(priceModifier, finalPrice = null) {
    /*
    This function validates the price modifier and final price.
    The price modifier should be a number with an optional % sign.
    The final price should be a positive number.

    Arguments:
        priceModifier -- the price modifier to validate
        finalPrice -- the final price to validate

    Returns:
        True if the price modifier and final price are valid, False otherwise
    */

    // remove the % sign if present
    const priceModifierClean = priceModifier.replace('%', '');

    // ensure the price modifier is a number
    if (isNaN(priceModifierClean)) {
        return false;
    }

    // ensure the final price is positive with a singular exception for -1, this has the potential to be a flaw
    // as such a different value should be used to represent the market price
    if (finalPrice < 0 && finalPrice != -1) {
        return false;
    }
}


function calculateFinalPrice(basePrice, modifier) {
    let finalPrice = basePrice;
    if (modifier.includes('%')) {
        // If the modifier includes a percentage, calculate the percentage increase or decrease
        const percentage = parseFloat(modifier.replace('%', ''));
        finalPrice = basePrice * (1 + percentage / 100);
    } else {
        // If the modifier is a direct number, add or subtract it from the base price
        finalPrice += parseFloat(modifier);
    }
    return finalPrice;
}

async function findLowestPriceForItem(realmId, itemId, quality) {
    if (itemId === undefined) {
        console.error("Item ID is undefined. Cannot fetch prices.");
        return { price: null, quality: null };
    }

    const url = `https://www.simcompanies.com/api/v3/market/all/${realmId}/${itemId}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Process data to find the lowest price at the requested quality, reducing quality level if necessary
        let currentQuality = quality;
        let lowestPriceEntry = null;

        while (currentQuality >= 0 && !lowestPriceEntry) {
            const pricesAtCurrentQuality = data.filter(item => item.quality === currentQuality);
            if (pricesAtCurrentQuality.length > 0) {
                lowestPriceEntry = pricesAtCurrentQuality.reduce((minEntry, item) => item.price < minEntry.price ? item : minEntry, pricesAtCurrentQuality[0]);
            }
            currentQuality--; // Reduce quality level if no price found at current level
        }

        if (!lowestPriceEntry) {
            return { price: null, quality: null };
        }
        return { price: lowestPriceEntry.price, quality: lowestPriceEntry.quality };
    } catch (error) {
        console.error(`Failed to fetch or find item prices: ${error}`);
        return { price: null, quality: null };
    }
}
async function updateListPrices() {
    logToFileAndConsole("updateListPrices: Starting to update list prices.");
    db.all("SELECT * FROM sales_list", async (err, rows) => {
        if (err) {
            logToFileAndConsole(`updateListPrices: Error fetching sales list: ${err.message}`);
            return;
        }

        logToFileAndConsole(`updateListPrices: Processing ${rows.length} rows from sales list.`);
        for (const row of rows) {
            const { item_name, quality, price_modifier, id, is_fixed_price } = row;
            logToFileAndConsole(`updateListPrices: Processing item ${item_name} with ID ${id}.`);
            const itemKey = Object.keys(items).find(key => items[key].name.toLowerCase() === item_name.toLowerCase());
            if (!itemKey) {
                logToFileAndConsole(`updateListPrices: Item not found in items list: ${item_name}`);
                continue;
            }

            logToFileAndConsole(`updateListPrices: Found item key ${itemKey} for item ${item_name}.`);
            const priceInfo = await findLowestPriceForItem(0, itemKey, quality);
            if (!priceInfo.price) {
                logToFileAndConsole(`updateListPrices: No market price found for ${item_name} at quality ${quality}. Retaining previous price.`);
                continue;
            }

            let newPrice;
            if (price_modifier.includes('%')) {
                const percentage = parseFloat(price_modifier);
                newPrice = priceInfo.price * (1 + percentage / 100);
                logToFileAndConsole(`updateListPrices: Calculated new price with percentage modifier: Original price ${priceInfo.price}, Modifier ${percentage}%, New price ${newPrice.toFixed(4)}`);
            } else {
                const fixedChange = parseFloat(price_modifier);
                newPrice = priceInfo.price + fixedChange;
                logToFileAndConsole(`updateListPrices: Calculated new price with fixed modifier: Original price ${priceInfo.price}, Modifier ${fixedChange}, New price ${newPrice.toFixed(4)}`);
            }

            db.run("UPDATE sales_list SET price = ? WHERE id = ?", [newPrice.toFixed(4), id], (err) => {
                if (err) {
                    logToFileAndConsole(`updateListPrices: Error updating price for ${item_name}: ${err.message}`);
                    return;
                }
                logToFileAndConsole(`updateListPrices: Successfully updated price for ${item_name} to $${newPrice.toFixed(4)}`);
            });
        }
    });
}


initDatabase();
client.login(token);