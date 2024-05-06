// import all the requirements
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import { Client, GatewayIntentBits } from 'discord.js';
import fetch from 'node-fetch';

// get the environment variables from the .env file
dotenv.config();
const { token } = process.env;

const db = new sqlite3.Database('./testsalesData.db', (err) => {
    if (err) {
        console.error('Error opening database ' + err.message);
        return;
    }
});


// Ensure the table exists before starting the bot and handling messages
db.run(`CREATE TABLE IF NOT EXISTS sales_list (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    orderNumber INTEGER,
    channel_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    item_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    quality INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    action_type TEXT NOT NULL,
    price REAL,
    price_modifier TEXT
)`, (err) => {
    if (err) {
        console.error("Create table error: " + err.message);
        return;
    }
    console.log("Table 'sales_list' ensured.");

    // Start the bot only after ensuring the table is ready
    client.login(token);
});

/*
These shouldn't be necessary if the table already exists

// Add columns if they don't exist, inside the callback
const columnsToAdd = [
    { name: "username", type: "TEXT" },
    { name: "action_type", type: "TEXT" },
    { name: "orderNumber", type: "INTEGER" },
    { name: "price", type: "REAL" },
    { name: "price_modifier", type: "TEXT" }
];

columnsToAdd.forEach(column => {
    db.run(`ALTER TABLE sales_list ADD COLUMN ${column.name} ${column.type}`, (err) => {
        if (err) {
            if (!err.message.includes("duplicate column name")) {
                console.error(`Error adding column ${column.name}: ${err.message}`);
            }
        } else {
            console.log(`Column '${column.name}' added successfully.`);
        }
    });
});
*/


const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    updateItemPrices(); // Initial update on startup
    setInterval(updateItemPrices, 300000); // Subsequent updates every 5 minutes
});

const items = {
    1: { name: "Power", priceR1: 0, priceR2: 0 },
    2: { name: "Water", priceR1: 0, priceR2: 0 },
    3: { name: "Apple", priceR1: 0, priceR2: 0 },
    4: { name: "Orange", priceR1: 0, priceR2: 0 },
    5: { name: "Grape", priceR1: 0, priceR2: 0 },
    6: { name: "Grain", priceR1: 0, priceR2: 0 },
    7: { name: "Steak", priceR1: 0, priceR2: 0 },
    8: { name: "Sausage", priceR1: 0, priceR2: 0 },
    9: { name: "Egg", priceR1: 0, priceR2: 0 },
    10: { name: "Crude oil", priceR1: 0, priceR2: 0 },
    11: { name: "Petrol", priceR1: 0, priceR2: 0 },
    12: { name: "Diesel", priceR1: 0, priceR2: 0 },
    13: { name: "Transport", priceR1: 0, priceR2: 0 },
    14: { name: "Mineral", priceR1: 0, priceR2: 0 },
    15: { name: "Bauxite", priceR1: 0, priceR2: 0 },
    16: { name: "Silicon", priceR1: 0, priceR2: 0 },
    17: { name: "Chemical", priceR1: 0, priceR2: 0 },
    18: { name: "Aluminium", priceR1: 0, priceR2: 0 },
    19: { name: "Plastic", priceR1: 0, priceR2: 0 },
    20: { name: "Processor", priceR1: 0, priceR2: 0 },
    21: { name: "Electronic component", priceR1: 0, priceR2: 0 },
    22: { name: "Battery", priceR1: 0, priceR2: 0 },
    23: { name: "Display", priceR1: 0, priceR2: 0 },
    24: { name: "Smart phone", priceR1: 0, priceR2: 0 },
    25: { name: "Tablet", priceR1: 0, priceR2: 0 },
    26: { name: "Laptop", priceR1: 0, priceR2: 0 },
    27: { name: "Monitor", priceR1: 0, priceR2: 0 },
    28: { name: "Television", priceR1: 0, priceR2: 0 },
    29: { name: "Plant research", priceR1: 0, priceR2: 0 },
    30: { name: "Energy research", priceR1: 0, priceR2: 0 },
    31: { name: "Mining research", priceR1: 0, priceR2: 0 },
    32: { name: "Electronics research", priceR1: 0, priceR2: 0 },
    33: { name: "Breeding research", priceR1: 0, priceR2: 0 },
    34: { name: "Chemistry research", priceR1: 0, priceR2: 0 },
    35: { name: "Software", priceR1: 0, priceR2: 0 },
    40: { name: "Cotton", priceR1: 0, priceR2: 0 },
    41: { name: "Fabric", priceR1: 0, priceR2: 0 },
    42: { name: "Iron ore", priceR1: 0, priceR2: 0 },
    43: { name: "Steel", priceR1: 0, priceR2: 0 },
    44: { name: "Sand", priceR1: 0, priceR2: 0 },
    45: { name: "Glass", priceR1: 0, priceR2: 0 },
    46: { name: "Leather", priceR1: 0, priceR2: 0 },
    47: { name: "On-board computer", priceR1: 0, priceR2: 0 },
    48: { name: "Electric motor", priceR1: 0, priceR2: 0 },
    49: { name: "Luxury car interior", priceR1: 0, priceR2: 0 },
    50: { name: "Basic interior", priceR1: 0, priceR2: 0 },
    51: { name: "Car body", priceR1: 0, priceR2: 0 },
    52: { name: "Combustion engine", priceR1: 0, priceR2: 0 },
    53: { name: "Economy e-car", priceR1: 0, priceR2: 0 },
    54: { name: "Luxury e-car", priceR1: 0, priceR2: 0 },
    55: { name: "Economy car", priceR1: 0, priceR2: 0 },
    56: { name: "Luxury car", priceR1: 0, priceR2: 0 },
    57: { name: "Truck", priceR1: 0, priceR2: 0 },
    58: { name: "Automotive research", priceR1: 0, priceR2: 0 },
    59: { name: "Fashion research", priceR1: 0, priceR2: 0 },
    60: { name: "Underwear", priceR1: 0, priceR2: 0 },
    61: { name: "Glove", priceR1: 0, priceR2: 0 },
    62: { name: "Dress", priceR1: 0, priceR2: 0 },
    63: { name: "Stiletto Heel", priceR1: 0, priceR2: 0 },
    64: { name: "Handbag", priceR1: 0, priceR2: 0 },
    65: { name: "Sneaker", priceR1: 0, priceR2: 0 },
    66: { name: "Seed", priceR1: 0, priceR2: 0 },
    67: { name: "Xmas cracker", priceR1: 0, priceR2: 0 },
    68: { name: "Gold ore", priceR1: 0, priceR2: 0 },
    69: { name: "Golden bar", priceR1: 0, priceR2: 0 },
    70: { name: "Luxury watch", priceR1: 0, priceR2: 0 },
    71: { name: "Necklace", priceR1: 0, priceR2: 0 },
    72: { name: "Sugarcane", priceR1: 0, priceR2: 0 },
    73: { name: "Ethanol", priceR1: 0, priceR2: 0 },
    74: { name: "Methane", priceR1: 0, priceR2: 0 },
    75: { name: "Carbon fiber", priceR1: 0, priceR2: 0 },
    76: { name: "Carbon composite", priceR1: 0, priceR2: 0 },
    77: { name: "Fuselage", priceR1: 0, priceR2: 0 },
    78: { name: "Wing", priceR1: 0, priceR2: 0 },
    79: { name: "High grade e-comp", priceR1: 0, priceR2: 0 },
    80: { name: "Flight computer", priceR1: 0, priceR2: 0 },
    81: { name: "Cockpit", priceR1: 0, priceR2: 0 },
    82: { name: "Attitude control", priceR1: 0, priceR2: 0 },
    83: { name: "Rocket fuel", priceR1: 0, priceR2: 0 },
    84: { name: "Propellant tank", priceR1: 0, priceR2: 0 },
    85: { name: "Solid fuel booster", priceR1: 0, priceR2: 0 },
    86: { name: "Rocket engine", priceR1: 0, priceR2: 0 },
    87: { name: "Heat shield", priceR1: 0, priceR2: 0 },
    88: { name: "Ion drive", priceR1: 0, priceR2: 0 },
    89: { name: "Jet engine", priceR1: 0, priceR2: 0 },
    90: { name: "Sub-orbital 2nd stage", priceR1: 0, priceR2: 0 },
    91: { name: "Sub-orbital rocket", priceR1: 0, priceR2: 0 },
    92: { name: "Orbital booster", priceR1: 0, priceR2: 0 },
    93: { name: "Starship", priceR1: 0, priceR2: 0 },
    94: { name: "BFR", priceR1: 0, priceR2: 0 },
    95: { name: "Jumbo jet", priceR1: 0, priceR2: 0 },
    96: { name: "Luxury jet", priceR1: 0, priceR2: 0 },
    97: { name: "Single engine plane", priceR1: 0, priceR2: 0 },
    98: { name: "Quadcopter", priceR1: 0, priceR2: 0 },
    99: { name: "Satellite", priceR1: 0, priceR2: 0 },
    100: { name: "Aerospace research", priceR1: 0, priceR2: 0 },
    101: { name: "Reinforced concrete", priceR1: 0, priceR2: 0 },
    102: { name: "Brick", priceR1: 0, priceR2: 0 },
    103: { name: "Cement", priceR1: 0, priceR2: 0 },
    104: { name: "Clay", priceR1: 0, priceR2: 0 },
    105: { name: "Limestone", priceR1: 0, priceR2: 0 },
    106: { name: "Wood", priceR1: 0, priceR2: 0 },
    107: { name: "Steel beam", priceR1: 0, priceR2: 0 },
    108: { name: "Plank", priceR1: 0, priceR2: 0 },
    109: { name: "Window", priceR1: 0, priceR2: 0 },
    110: { name: "Tool", priceR1: 0, priceR2: 0 },
    111: { name: "Construction unit", priceR1: 0, priceR2: 0 },
    112: { name: "Bulldozer", priceR1: 0, priceR2: 0 },
    113: { name: "Materials research", priceR1: 0, priceR2: 0 },
    114: { name: "Robot", priceR1: 0, priceR2: 0 },
    115: { name: "Cow", priceR1: 0, priceR2: 0 },
    116: { name: "Pig", priceR1: 0, priceR2: 0 },
    117: { name: "Milk", priceR1: 0, priceR2: 0 },
    118: { name: "Coffee bean", priceR1: 0, priceR2: 0 },
    119: { name: "Coffee powder", priceR1: 0, priceR2: 0 },
    120: { name: "Vegetable", priceR1: 0, priceR2: 0 },
    121: { name: "Bread", priceR1: 0, priceR2: 0 },
    122: { name: "Cheese", priceR1: 0, priceR2: 0 },
    123: { name: "Apple pie", priceR1: 0, priceR2: 0 },
    124: { name: "Orange juice", priceR1: 0, priceR2: 0 },
    125: { name: "Apple cider", priceR1: 0, priceR2: 0 },
    126: { name: "Ginger beer", priceR1: 0, priceR2: 0 },
    127: { name: "Frozen pizza", priceR1: 0, priceR2: 0 },
    128: { name: "Pasta", priceR1: 0, priceR2: 0 },
    129: { name: "Hamburger", priceR1: 0, priceR2: 0 },
    130: { name: "Lasagna", priceR1: 0, priceR2: 0 },
    131: { name: "Meat ball", priceR1: 0, priceR2: 0 },
    132: { name: "Cocktail", priceR1: 0, priceR2: 0 },
    133: { name: "Flour", priceR1: 0, priceR2: 0 },
    134: { name: "Butter", priceR1: 0, priceR2: 0 },
    135: { name: "Sugar", priceR1: 0, priceR2: 0 },
    136: { name: "Cocoa", priceR1: 0, priceR2: 0 },
    137: { name: "Dough", priceR1: 0, priceR2: 0 },
    138: { name: "Sauce", priceR1: 0, priceR2: 0 },
    139: { name: "Fodder", priceR1: 0, priceR2: 0 },
    140: { name: "Chocolate", priceR1: 0, priceR2: 0 },
    141: { name: "Vegetable oil", priceR1: 0, priceR2: 0 },
    142: { name: "Salad", priceR1: 0, priceR2: 0 },
    143: { name: "Samosa", priceR1: 0, priceR2: 0 },
    145: { name: "Recipes", priceR1: 0, priceR2: 0 }
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
                console.error(`Error starting transaction: ${err.message}`);
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
                    console.error(`Error finding matches: ${err.message}`);
                    db.run("ROLLBACK");
                    return;
                }

                if (rows.length === 0) {
                    console.log("No matches found.");
                    db.run("COMMIT");
                    return;
                }

                console.log(`Found ${rows.length} matches, processing...`);

                // Process only the first match
                let row = rows[0];
                let minQuantity = Math.min(row.sell_quantity, row.buy_quantity);
                let finalPrice = row.sell_price === row.buy_price ? row.sell_price : (row.sell_id < row.buy_id ? row.sell_price : row.buy_price);

                db.run("UPDATE sales_list SET quantity = quantity - ? WHERE id IN (?, ?)", 
                    [minQuantity, row.sell_id, row.buy_id], function(err) {
                    if (err) {
                        console.error(`Error updating quantities: ${err.message}`);
                        db.run("ROLLBACK");
                        return;
                    }

                    // Send a notification message with price information
                    client.channels.fetch(channelId).then(channel => {
                        channel.send(`Match found! <@${row.seller_id}> please send ${minQuantity} units of ${row.item_name} Q:${row.quality} at $${finalPrice.toFixed(4)} to <@${row.buyer_id}>.`);
                    }).catch(console.error);

                    db.run("DELETE FROM sales_list WHERE quantity <= 0", (err) => {
                        if (err) {
                            console.error(`Error deleting zero quantity entries: ${err.message}`);
                            db.run("ROLLBACK");
                            return;
                        }
                        db.run("COMMIT", (err) => {
                            if (err) {
                                console.error(`Error committing transaction: ${err.message}`);
                                db.run("ROLLBACK");
                                return;
                            }
                            console.log("Transaction committed successfully, updating lists.");
                            publishLists(channelId); // Refresh the sales list after successful transaction
                        });
                    });
                });
            });
        });
    });
}

function addEntry(channelId, userId, userName, itemName, quality, quantity, buying, price, priceModifier) {
    const timestamp = new Date().toISOString();
    const actionType = buying ? 'buy' : 'sell';
    const formattedPrice = parseFloat(price).toFixed(4);

    console.log(`Adding entry: ${actionType} ${quantity} of ${itemName} at quality ${quality} for $${formattedPrice} by user ${userId}`);

    const insertSQL = `
    INSERT INTO sales_list (channel_id, user_id, username, item_name, quantity, quality, timestamp, action_type, price, price_modifier)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`;
    db.run(insertSQL, [channelId, userId, userName, itemName, quantity, quality, timestamp, actionType, price, priceModifier], function(err) {
        if (err) {
            console.error(`Error inserting into sales_list: ${err.message}`);
            return;
        }
        console.log(`A new row has been inserted with rowid ${this.lastID}, which should be the new orderNumber`);
        // Optionally update the orderNumber based on lastID if necessary
        db.run("UPDATE sales_list SET orderNumber = ? WHERE id = ?", [this.lastID, this.lastID], function(err) {
            if (err) {
                console.error(`Error updating orderNumber: ${err.message}`);
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
        console.error("Channel not found");
        return;
    }

    // Retrieve and display sales list
    db.all("SELECT orderNumber, item_name, quality, quantity, price, price_modifier, username, action_type FROM sales_list WHERE action_type = 'sell' ORDER BY orderNumber DESC", (err, sellRows) => {
        if (err) {
            console.error("Failed to retrieve sales list:", err);
            channel.send("Failed to retrieve the sales list.");
            return;
        }

        if (sellRows.length === 0) {
            channel.send("No sales entries found.");
        } else {
            const message = formatSalesList(sellRows, "For Sale");
            sendChunkedMessages(channel, message);
        }
    });

    // Retrieve and display buy list
    db.all("SELECT orderNumber, item_name, quality, quantity, price, price_modifier, username, action_type FROM sales_list WHERE action_type = 'buy' ORDER BY orderNumber DESC", (err, buyRows) => {
        if (err) {
            console.error("Failed to retrieve buy list:", err);
            channel.send("Failed to retrieve the buy list.");
            return;
        }

        if (buyRows.length === 0) {
            channel.send("No buy entries found.");
        } else {
            const message = formatSalesList(buyRows, "Want to Buy");
            sendChunkedMessages(channel, message);
        }
    });
}
function formatSalesList(rows, listType) {
    const maxOrderWidth = Math.max(...rows.map(row => row.orderNumber.toString().length), "Order".length) + 2;
    const maxItemWidth = Math.max(...rows.map(row => row.item_name.length), "Item".length) + 2;
    const maxQualityWidth = Math.max(...rows.map(row => row.quality.toString().length), "Quality".length) + 2;
    const maxQuantityWidth = Math.max(...rows.map(row => row.quantity.toString().length), "Quantity".length) + 2;
    const maxPriceWidth = Math.max(...rows.map(row => `$${parseFloat(row.price).toFixed(4)} (${row.price_modifier})`.length), "Price (MP +/-)".length) + 2;
    const maxSellerWidth = Math.max(...rows.map(row => row.username.length), "Seller".length) + 2;

    let message = `\`\`\`${listType}:\n`;
    message += "+-" + "-".repeat(maxOrderWidth) + "+-" + "-".repeat(maxItemWidth) + "+-" + "-".repeat(maxQualityWidth) + "+-" + "-".repeat(maxQuantityWidth) + "+-" + "-".repeat(maxPriceWidth) + "+-" + "-".repeat(maxSellerWidth) + "+\n";
    message += "| " + "Order".padEnd(maxOrderWidth) + "| " + "Item".padEnd(maxItemWidth) + "| " + "Quality".padEnd(maxQualityWidth) + "| " + "Quantity".padEnd(maxQuantityWidth) + "| " + "Price (MP +/-)".padEnd(maxPriceWidth) + "| " + "Seller".padEnd(maxSellerWidth) + "|\n";
    message += "+-" + "-".repeat(maxOrderWidth) + "+-" + "-".repeat(maxItemWidth) + "+-" + "-".repeat(maxQualityWidth) + "+-" + "-".repeat(maxQuantityWidth) + "+-" + "-".repeat(maxPriceWidth) + "+-" + "-".repeat(maxSellerWidth) + "+\n";

    rows.forEach(row => {
        const priceWithModifier = `$${parseFloat(row.price).toFixed(4)} (${row.price_modifier})`;
        message += "| " + row.orderNumber.toString().padEnd(maxOrderWidth) + "| " + row.item_name.padEnd(maxItemWidth) + "| " + row.quality.toString().padEnd(maxQualityWidth) + "| " + row.quantity.toString().padEnd(maxQuantityWidth) + "| " + priceWithModifier.padEnd(maxPriceWidth) + "| " + row.username.padEnd(maxSellerWidth) + "|\n";
    });

    message += "+-" + "-".repeat(maxOrderWidth) + "+-" + "-".repeat(maxItemWidth) + "+-" + "-".repeat(maxQualityWidth) + "+-" + "-".repeat(maxQuantityWidth) + "+-" + "-".repeat(maxPriceWidth) + "+-" + "-".repeat(maxSellerWidth) + "+\`\`\`";
    return message;
}
function sendChunkedMessages(channel, message) {
    // Split message into chunks of 2000 characters to comply with Discord's message length limit
    const maxMessageLength = 2000;
    for (let i = 0; i < message.length; i += maxMessageLength) {
        const toSend = message.substring(i, Math.min(message.length, i + maxMessageLength));
        channel.send(toSend);
    }
}
function parseItemDetails(args) {
    console.log("Parsing item details from args:", args);
    if (args.length < 3) {
        console.log("Insufficient arguments provided.");
        return { quality: null, quantity: null, itemName: null };
    }

    let quantity = parseInt(args[args.length - 2]);
    let priceModifier = args[args.length - 1];
    let quality = parseInt(args[args.length - 3].replace(/^q/, ''));
    let itemNameOrRef = args.slice(0, args.length - 3).join(' ');

    console.log(`Extracted - Quality: ${quality}, Quantity: ${quantity}, ItemNameOrRef: ${itemNameOrRef}, Price Modifier: ${priceModifier}`);

    if (isNaN(quality) || quality < 0 || quality > 12 || isNaN(quantity)) {
        console.log("Invalid quality or quantity.");
        return { quality: null, quantity: null, itemName: null, priceModifier: null };
    }

    let refNumber = parseInt(itemNameOrRef);
    let foundItem;

    if (!isNaN(refNumber)) {
        console.log(`Interpreted as reference number: ${refNumber}`);
        foundItem = items[refNumber];
        if (foundItem) {
            console.log(`Found item by reference number: ${foundItem.name}`);
            return { quality, quantity, itemName: foundItem.name, priceModifier };
        }
    } else {
        console.log(`Interpreted as item name: ${itemNameOrRef}`);
        foundItem = Object.values(items).find(item => normalizeItemName(item.name) === normalizeItemName(itemNameOrRef));
        if (foundItem) {
            console.log(`Found item by name: ${foundItem.name}`);
            return { quality, quantity, itemName: foundItem.name, priceModifier };
        }
    }

    console.log("Item not found.");
    return { quality: null, quantity: null, itemName: null, priceModifier: null };
}


client.on('messageCreate', async (msg) => {
    if (msg.author.bot) return;

    const content = msg.content.toLowerCase();
    console.log("Message received:", content);
    if (content.startsWith('!help')) {
        const helpMessage = `
\`\`\`**Help - Command Usage Guide**
!price.[item name/item reference number] - Fetch the current market price for an item.

!edit [orderNumber] [itemName] [itemQuality] [itemQuantity] [itemPrice] - Edit an existing order(Only by the user who created the order or Admin).

!sell [item name/item reference number] [quality] [quantity] [price modifier] - List an item for sale with a price relative to the market price this may be a % or a flat amount.

!buy [item name/item reference number] [quality] [quantity] [price modifier] - List a buy order for an item with a price relative to the market price this may be a % or a flat amount.

!showlist, !show, !list - Display all current buy and sell orders.

!delete [orderNumber] - Delete an order by its order number (Only by the user who created the order or Admin).
\`\`\`

        `;
        await msg.channel.send(helpMessage);
    } else if (content.startsWith('!edit')) {
        const args = msg.content.split(' ').slice(1);
        console.log("Edit command args:", args);
        if (args.length !== 5) {
            await msg.channel.send("Please use the format: !edit [orderNumber] [itemName] [itemQuality] [itemQuantity] [itemPrice]");
            return;
        }

        const [orderNumber, itemName, itemQuality, itemQuantity, itemPrice] = args.map(arg => arg.trim());
        console.log(`Parsed edit command - OrderNumber: ${orderNumber}, ItemName: ${itemName}, ItemQuality: ${itemQuality}, ItemQuantity: ${itemQuantity}, ItemPrice: ${itemPrice}`);
        const orderNum = parseInt(orderNumber);
        console.log(`Editing entry with orderNumber: ${orderNum}`);

        if (isNaN(orderNum)) {
            await msg.channel.send("Invalid order number.");
            return;
        }

        db.get("SELECT * FROM sales_list WHERE orderNumber = ?", [orderNum], async (err, row) => {
            if (err) {
                console.error(`Error retrieving entry: ${err.message}`);
                await msg.channel.send("Error retrieving the entry.");
                return;
            }

            console.log("Database query executed. Checking row existence...");
            if (!row) {
                await msg.channel.send(`No entry found with order number: ${orderNum}.`);
                return;
            }

            console.log(`Entry found: ${JSON.stringify(row)}`);
            if (row.user_id !== msg.author.id && msg.author.id !== '427318093069418496') {
                await msg.channel.send("You do not have permission to edit this listing.");
                return;
            }

            const updates = {};
            if (itemName.toLowerCase() !== 'x') updates.item_name = itemName;
            if (itemQuality.toLowerCase() !== 'x') updates.quality = parseInt(itemQuality);
            if (itemQuantity.toLowerCase() !== 'x') updates.quantity = parseInt(itemQuantity);
            if (itemPrice.toLowerCase() !== 'x') updates.price = parseFloat(itemPrice).toFixed(4);

            console.log(`Updates to be made: ${JSON.stringify(updates)}`);
            if (Object.keys(updates).length === 0) {
                await msg.channel.send("No updates specified.");
                return;
            }

            let updateQuery = "UPDATE sales_list SET ";
            let queryParams = [];
            Object.keys(updates).forEach((key, index) => {
                updateQuery += `${key} = ?`;
                queryParams.push(updates[key]);
                if (index < Object.keys(updates).length - 1) updateQuery += ", ";
            });
            updateQuery += " WHERE orderNumber = ?";
            queryParams.push(orderNum);

            console.log(`Final SQL Query: ${updateQuery}`);
            console.log(`Query Parameters: ${queryParams.join(", ")}`);

            db.run(updateQuery, queryParams, async (err) => {
                if (err) {
                    console.error(`Error updating entry: ${err.message}`);
                    await msg.channel.send("Failed to update the listing.");
                    return;
                }
                console.log("Entry updated successfully.");
                await msg.channel.send("Listing updated successfully.");
                publishLists(msg.channel.id); // Refresh and display the updated list
            });
        });
    } else if (content.startsWith('!sell') || content.startsWith('!buy')) {
        const buying = content.startsWith('!buy');
        const args = msg.content.split(' ').slice(1);

        if (args.length < 4) {
            await msg.channel.send(`Please use the format: !${buying ? 'buy' : 'sell'} [item name/item reference number] [quality] [quantity] [price modifier]`);
            return;
        }

        const { itemName, quality, quantity, priceModifier } = parseItemDetails(args);
        if (!itemName) {
            await msg.channel.send("Invalid item name or reference number.");
            return;
        }

        // Assuming `items` is an object where keys are item names or IDs
        const itemKey = Object.keys(items).find(key => items[key].name.toLowerCase() === itemName.toLowerCase());
        const item = items[itemKey];
        if (!item) {
            await msg.channel.send("Item not found.");
            return;
        }

        let finalPrice;
        if (priceModifier.includes('%')) {
            const percentage = parseFloat(priceModifier);
            finalPrice = item.priceR1 * (1 + percentage / 100);
        } else {
            const fixedChange = parseFloat(priceModifier);
            finalPrice = item.priceR1 + fixedChange;
        }

        console.log(`Item details parsed: Quality=${quality}, Quantity=${quantity}, Price=${finalPrice.toFixed(4)}, ItemName=${itemName}, Modifier=${priceModifier}`);

        addEntry(msg.channel.id, msg.author.id, msg.member ? msg.member.displayName : msg.author.username, itemName, quality, quantity, buying, finalPrice, priceModifier);
    } else if (['showlist', 'show', 'list'].includes(content.split(' ')[0].slice(1))) {
        await publishLists(msg.channel.id);
    } else if (content.startsWith('!clear')) {
        console.log("Clear command received");
        // Check if the user is authorized
        if (msg.author.id !== '427318093069418496') {
            console.log("Unauthorized user attempted to use !clear");
            await msg.channel.send("You do not have permission to use this command.");
            return;
        }

        // Perform the deletion of all entries for this channel
        const channelId = msg.channel.id;
        console.log(`Attempting to clear sales list for channel ID: ${channelId}`);
        db.run("DELETE FROM sales_list WHERE channel_id = ?", [channelId], function(err) {
            if (err) {
                console.error(`Error clearing sales list for channel: ${err.message}`);
                msg.channel.send("Failed to clear the sales list.");
                return;
            }
            console.log(`Sales list cleared for channel ID: ${channelId}`);
            msg.channel.send("Sales list has been cleared.");
        });
    } else  if (content.startsWith('!insert')) {
        console.log("Insert command triggered");
        if (msg.author.id !== '427318093069418496') {
            console.log("Unauthorized user attempted to use !insert");
            await msg.channel.send("You do not have permission to use this command.");
            return;
        }

        const args = msg.content.split(' ').slice(1);
        if (args.length !== 5) {
            console.log("Incorrect number of arguments for !insert");
            await msg.channel.send("Please use the format: !insert [userid] [referenceNumber] [itemQuality] [itemQuantity] [itemPrice]");
            return;
        }

        const [userId, referenceNumber, itemQuality, itemQuantity, itemPrice] = args.map(arg => arg.trim());
        console.log(`Parsed args for !insert: ${userId}, ${referenceNumber}, ${itemQuality}, ${itemQuantity}, ${itemPrice}`);

        const quality = parseInt(itemQuality);
        const quantity = parseInt(itemQuantity);
        const price = parseFloat(itemPrice);

        if (isNaN(quality) || isNaN(quantity) || isNaN(price)) {
            console.log("Invalid input types for !insert");
            await msg.channel.send("Invalid input. Please ensure quality, quantity, and price are numbers.");
            return;
        }

        // Convert reference number to item name
        const item = items[parseInt(referenceNumber)];
        if (!item) {
            console.log("Invalid reference number for item");
            await msg.channel.send("Invalid reference number for item.");
            return;
        }
        const itemName = item.name;

        console.log(`Inserting entry on behalf of user ${userId}: ${itemName}, Quality=${quality}, Quantity=${quantity}, Price=${price.toFixed(4)}`);
        client.users.fetch(userId).then(user => {
            addEntry(msg.channel.id, userId, user.username, itemName, quality, quantity, false, price);
        }).catch(error => {
            console.error("Failed to fetch user:", error);
            msg.channel.send("Failed to fetch user details.");
        });
    } else if (content.startsWith('!delete')) {
        console.log("Delete command triggered");
        const args = msg.content.split(' ').slice(1);
        if (args.length !== 1) {
            console.log("Incorrect number of arguments for !delete");
            await msg.channel.send("Please use the format: !delete [orderNumber]");
            return;
        }

        const orderNumber = parseInt(args[0]);
        if (isNaN(orderNumber)) {
            console.log("Invalid order number provided");
            await msg.channel.send("Invalid order number.");
            return;
        }

        console.log(`Attempting to fetch order with orderNumber: ${orderNumber}`);
        db.get("SELECT user_id FROM sales_list WHERE orderNumber = ?", [orderNumber], async (err, row) => {
            if (err) {
                console.error(`Error fetching order: ${err.message}`);
                await msg.channel.send("Failed to fetch the order.");
                return;
            }

            if (!row) {
                console.log("No order found with provided orderNumber");
                await msg.channel.send("Order not found.");
                return;
            }

            console.log(`Order found, checking permissions for user ${msg.author.id}`);
            if (msg.author.id === row.user_id || msg.author.id === '427318093069418496') {
                console.log(`Deleting order ${orderNumber}`);
                db.run("DELETE FROM sales_list WHERE orderNumber = ?", [orderNumber], async (err) => {
                    if (err) {
                        console.error(`Error deleting order: ${err.message}`);
                        await msg.channel.send("Failed to delete the order.");
                        return;
                    }
                    console.log(`Order ${orderNumber} deleted successfully.`);
                    await msg.channel.send(`Order ${orderNumber} has been deleted successfully.`);
                });
            } else {
                console.log("User does not have permission to delete this order");
                await msg.channel.send("You do not have permission to delete this order.");
            }
        });
    } else if (content.startsWith('!price.all')) {
        // Existing functionality for !price.all
        if (msg.author.id !== '427318093069418496') {
            console.log("Unauthorized user attempted to use !price.all");
            await msg.channel.send("You do not have permission to use this command.");
            return;
        }

        let message = "Current Market Prices:\n";
        Object.entries(items).forEach(([key, item]) => {
            message += `${item.name}: Price: $${item.priceR1.toFixed(4)}\n`;
        });
        const maxMessageLength = 2000;
        for (let i = 0; i < message.length; i += maxMessageLength) {
            const toSend = message.substring(i, Math.min(message.length, i + maxMessageLength));
            await msg.channel.send(toSend);
        }
    } else if (content.startsWith('!price.')) {
        // New functionality for specific item prices
        const itemNameOrNumber = content.split('!price.')[1];
        if (!itemNameOrNumber) {
            await msg.channel.send("Please specify an item name or number after '!price.'");
            return;
        }

        const itemKey = Object.keys(items).find(key => 
            items[key].name.toLowerCase() === itemNameOrNumber.toLowerCase() ||
            key === itemNameOrNumber
        );

        if (!itemKey) {
            await msg.channel.send("Item not found.");
            return;
        }

        const item = items[itemKey];
        await msg.channel.send(`${item.name}:Price: $${item.priceR1.toFixed(4)}`);
    }
}); // This is the closing bracket and parenthesis for the client.on('messageCreate', ...) handler

client.login(token);



async function updateItemPrices() {
    try {
        const response = await fetch('https://www.simcompanies.com/api/v2/market-ticker/0/2024-05-04T04:14:47.315Z/');
        const data = await response.json();
        data.forEach(item => {
            if (items[item.kind]) {
                items[item.kind].priceR1 = item.price;
                console.log(`Updated ${items[item.kind].name} with price: ${item.price}`);
            }
        });
    } catch (error) {
        console.error('Failed to fetch or update item prices:', error);
    }
}

setInterval(updateItemPrices, 300000); // 300000 milliseconds = 5 minutes
