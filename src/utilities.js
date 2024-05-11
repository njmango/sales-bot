const fs = require('fs');
const sqlite3 = require('sqlite3');
const variables = require('./vars.json');
const stringSimilarity = require("string-similarity");

const admins = variables.admins;
const logStream = fs.createWriteStream('./test-bot-log.txt', { flags: 'a' });

module.exports = {
    sendChunkedMessages,
    updateListPrices,
    logToFileAndConsole,
    openDB,
    getItems,
    updateItemPrices,
    checkAdmin,
    searchItem,
};

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

function getItems() {
    return items;
}

function updateItemPrices(itemKey, quality, pricesR1, pricesR2) {
    items[itemKey].pricesR1[quality] = pricesR1;
    items[itemKey].pricesR2[quality] = pricesR2;
}

function openDB() {
    const db = new sqlite3.Database('./testsalesData.db', (err) => {
        if (err) {
            logToFileAndConsole('Error opening database ' + err.message);
            return;
        }
    });
    return db;
}

function sendChunkedMessages(interaction, message, dontReply = false) {

    // Split message into chunks and send each chunk to avoid message size limits
    const maxMessageSize = 2000 - 6; // Adjusting for the extra characters from the code block markdown
    let start = 0;
    let replied = false;
    while (start < message.length) {
        let end = start + maxMessageSize;
        if (end < message.length && message[end] !== '\n') {
            // Ensure we end at the beginning of a new line if not at the end of the message
            let newlineIndex = message.lastIndexOf('\n', end);
            end = newlineIndex === -1 ? end : newlineIndex + 1;
        }
        const chunk = message.substring(start, end);

        if (!replied && !dontReply) {
            interaction.reply(`\`\`\`\n${chunk}\n\`\`\``);
            replied = true;
        } else {
            interaction.channel.send(`\`\`\`\n${chunk}\n\`\`\``);
        }
        start = end;
    }

    return replied;
}

async function updateListPrices() {

    const db = openDB();

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
                    db.close();
                    return;
                }
                logToFileAndConsole(`updateListPrices: Successfully updated price for ${item_name} to $${newPrice.toFixed(4)}`);
            });
        }
        
        db.close();
    });

    
}

function logToFileAndConsole(message) {
    console.log(message);  // Log to console
    logStream.write(message + '\n');  // Write to file
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

function checkAdmin(id) {
    return admins.includes(String(id));
}

function searchItem(input) {
    /*
    Given a string input, search for an item. The input will typically be the name or ID of an item.
    */

    let refNumber = parseInt(input);
    let foundItem;

    if (!isNaN(refNumber)) {
        logToFileAndConsole(`Interpreted as reference number: ${refNumber}`);
        foundItem = items[refNumber];
        if (foundItem) {
            logToFileAndConsole(`Found item by reference number: ${foundItem.name}`);
            return {certain: true, name: foundItem.name};
        }

        logToFileAndConsole("Item not found.");
        return {certain: false, name: null};
    } 

    logToFileAndConsole(`Interpreted as item name: ${input}`);
    foundItem = Object.values(items).find(item => item.name.toLowerCase() === input.toLowerCase());
    if (foundItem) {
        logToFileAndConsole(`Found item by name: ${foundItem.name}`);
        return {certain: true, name: foundItem.name};
    }

    // if no items are found so far, loop through all the items and find the one with the highest similarity
    let highestSimilarity = 0;
    let bestMatch;

    for (const item of Object.values(items)) {
        const similarity = stringSimilarity.compareTwoStrings(item.name.toLowerCase(), input.toLowerCase());
        if (similarity > highestSimilarity) {
            highestSimilarity = similarity;
            bestMatch = item.name;
        }
    }

    if (highestSimilarity > 0.7) {
        logToFileAndConsole(`Best match found: ${bestMatch}`);
        return {certain: false, name: bestMatch};
    }    
}