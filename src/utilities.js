const fs = require('fs');
const sqlite3 = require('sqlite3');
const variables = require('./vars.json');
const stringSimilarity = require("string-similarity");
const { promisify } = require('util');
const { log } = require('console');

const admins = variables.admins;
const jsonItemTypes = variables.knownTypes;
const logStream = fs.createWriteStream('./test-bot-log.txt', { flags: 'a' });

module.exports = {
    sendChunkedMessages,
    logToFileAndConsole,
    getDB,
    updateItemPrices,
    checkAdmin,
    searchItem,
    validatePriceModifier,
    calculateFinalPrice,
    findLowestPriceForItem,
    addEntry,
    sortItems
};

const db = new sqlite3.Database('./testsalesData.db', (err) => {
    if (err) {
        logToFileAndConsole('Error opening database ' + err.message);
        return;
    }
});

function updateItemPrices(itemKey, quality, pricesR1, pricesR2) {
    items[itemKey].pricesR1[quality] = pricesR1;
    items[itemKey].pricesR2[quality] = pricesR2;
}

function getDB() {
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

            let items = await getAllDBItems();

            const itemKey = items.find(item => item.name === item_name)?.item_id;
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

function logToFileAndConsole(message) {
    console.log(message);  // Log to console
    logStream.write(message + '\n');  // Write to file
}

async function sortItems(){

    logToFileAndConsole("Sorting items...");

    // get items
    const items = await getAllItems();

    // loop through the dictionary of items
    for (const [key, value] of Object.entries(items)) {
        // check if the item is in the items table
        let searchResult = await searchItem(key);

        // if the item is not in the items table, add it
        if (searchResult.name === undefined || searchResult.name === null) {

            // get the item type getItemType
            const itemType = await getItemType(value, key);
            let itemTypeId = null;
            
            if (itemType != null || itemType != undefined) {
                itemTypeId = itemType.id;
            }

            // get the current time as epoch
            const currentTime = Math.floor(Date.now() / 1000);

            // add the item to the items table
            db.run("INSERT INTO items (item_id, name, type, cached_time) VALUES (?, ?, ?, ?)", [key, value, itemTypeId, currentTime], function(err) {
                if (err) {
                    logToFileAndConsole(`Error inserting into items table: ${err.message}`);
                    return;
                }
                logToFileAndConsole(`A new row has been inserted with rowid ${this.lastID}`);
            });
        }
    

    }
    


} 

async function getAllDBItems() {
    try {
        const db = getDB();
        const rows = await promisify(db.all).bind(db)("SELECT * FROM items");
        return rows;
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function getAllItems(){

    logToFileAndConsole("Fetching all items...");

    const url = `https://d1fxy698ilbz6u.cloudfront.net/static/js/lang6/en.json`;
    let items = {};

    try {
        const response = await fetch(url);

        if (response.status === 429) {
            logToFileAndConsole("Rate limit exceeded. Waiting 62 seconds and trying again...");
            // wait 62 seconds and try again
            await new Promise(resolve => setTimeout(resolve, 62000));
            return getAllItems();
        } else if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // loop through all the keys and their values in the dictionary
        for (const [key, value] of Object.entries(data)) {
            // check if the key matches the regex be-re-\d{1,3}
            const regex = /be-re-\d{1,3}/;

            if (regex.test(key)) {
                // split the key by "be-re-"
                const splitKey = key.split("be-re-");
                const itemID = parseInt(splitKey[1]);
                const item = value;

                // add the item to the items dictionary
                items[itemID] = item;
            }
        }

        return items;
    } catch (error) {
        console.error(`Failed to fetch items: ${error}`);
        return null;
    }

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

async function searchItem(input) {
    try {
        let refNumber = parseInt(input);
        let foundItem;
        const db = getDB();

        if (!isNaN(refNumber)) {
            logToFileAndConsole(`Interpreted as reference number: ${refNumber}`);
            foundItem = await promisify(db.get).bind(db)("SELECT * FROM items WHERE item_id = ?", [refNumber]);
        } else {
            logToFileAndConsole(`Interpreted as item name: ${input}`);
            foundItem = await promisify(db.get).bind(db)("SELECT * FROM items WHERE name = ?", [input]);
        }

        if (foundItem) {
            logToFileAndConsole(`Found item by ${isNaN(refNumber) ? 'name' : 'ID'}: ${foundItem.name}`);
            return { certain: true, name: foundItem.name, id: foundItem.item_id, similarity: 1.0 };
        }

        const rows = await promisify(db.all).bind(db)("SELECT name, item_id FROM items");
        let highestSimilarity = 0;
        let bestMatchName;
        let bestMatchId;

        for (const item of rows) {
            const similarity = stringSimilarity.compareTwoStrings(item.name.toLowerCase(), String(input).toLowerCase());
            if (similarity > highestSimilarity) {
                highestSimilarity = similarity;
                bestMatchName = item.name;
                bestMatchId = item.item_id;
            }
        }

        if (highestSimilarity >= 0.7) {
            logToFileAndConsole(`Best match found: ${bestMatchName}`);
            return { certain: false, name: bestMatchName, id: bestMatchId, similarity: highestSimilarity };
        }

        return { certain: false, name: bestMatchName, id: bestMatchId, similarity: highestSimilarity };
    } catch (error) {
        console.error(error);
        return { certain: false, name: null, id: null, similarity: 0.0 };
    }
}


function validatePriceModifier(priceModifier = null, finalPrice = null) {
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

    if (priceModifier === null && finalPrice === null) {
        // raise an error if both price modifier and final price are not provided
        throw new Error("Price modifier and final price cannot be null at the same time.");
    }

    if (priceModifier !== null) {
        // remove the % sign if present
        const priceModifierClean = priceModifier.replace('%', '');

        // ensure the price modifier is a number
        if (isNaN(priceModifierClean)) {
            return false;
        }
    }

    if (finalPrice !== null) {
        // ensure the final price is a number
        if (isNaN(finalPrice)) {
            return false;
        }

        if (finalPrice < 0) {
            return false;
        }
    }

    return true;
}

async function getItemType(itemName, itemID = null) {
    try {
        const db = getDB();

        // Define a function to query the items table by ID or name
        const queryItemsTable = async () => {
            if (itemID) {
                return await promisify(db.get).bind(db)("SELECT * FROM items WHERE item_id = ?", [itemID]);
            } else {
                return await promisify(db.get).bind(db)("SELECT * FROM items WHERE name = ?", [itemName]);
            }
        };

        let item = await queryItemsTable();

        if (item) {
            // If the item is found in the items table, query the item_types table for its type
            const itemType = await promisify(db.get).bind(db)("SELECT * FROM item_types WHERE id = ?", [item.type]);
            if (itemType) {
                return { id: itemType.id, name: itemType.name };
            }
        } 

        // If the item is not found in the items table, check if it matches any predefined types
        for (const type in jsonItemTypes) {
            for (listItem of jsonItemTypes[type]) {
                if (listItem.toLowerCase() === itemName.toLowerCase()) {
                    item = { id: null, name: type };
                }
            }
        }

        // check if the item type is already in the item_types table
        const itemType = await promisify(db.get).bind(db)("SELECT * FROM item_types WHERE name = ?", [item.name]);
        if (itemType) {
            return { id: itemType.id, name: itemType.name };
        }

        // If the item type is not found in the item_types table, add it
        const insertItemType = await promisify(db.run).bind(db)("INSERT INTO item_types (name) VALUES (?)", [item.name]);
        
        const itemTypeID = await promisify(db.get).bind(db)("SELECT last_insert_rowid() as id");
        return { id: itemTypeID.id, name: item.name };


    } catch (error) {
        console.error(error);
        return null;
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

async function getUser(userId, userName) {
    try {
        const db = getDB();
        const query = "SELECT * FROM users WHERE discord_id = ?";
        const currentTime = Math.floor(Date.now() / 1000);

        // Promisify the db.get function
        const dbGetAsync = promisify(db.get).bind(db);

        // Query the database for the user
        let row = await dbGetAsync(query, [userId]);

        if (!row) {
            // If user doesn't exist, insert a new user record
            const insertSQL = "INSERT INTO users (discord_id, username, cached_time) VALUES (?, ?, ?)";
            await promisify(db.run).bind(db)(insertSQL, [userId, userName, currentTime]);
            logToFileAndConsole(`A new user has been inserted with discord_id ${userId}`);
        } else {
            // If user exists, update if necessary
            if (row.username !== userName) {
                const updateSQL = "UPDATE users SET username = ?, cached_time = ? WHERE discord_id = ?";
                await promisify(db.run).bind(db)(updateSQL, [userName, currentTime, userId]);
                logToFileAndConsole(`User with discord_id ${userId} has been updated`);
            }
            console.log(`User found: ${row.id}`);
            return { id: row.id, discord_id: row.discord_id, username: row.username, cached_time: row.cached_time };
        }
    } catch (error) {
        console.error(error);
        return null;
    }
}

async function addEntry(channelId, userId, userName, itemName, quality, quantity, buying, price, priceModifier, isFixedPrice, interaction = null) {
    try {
        const timestamp = new Date().toISOString();
        const actionType = buying ? 'buy' : 'sell';

        console.log(price)
        const formattedPrice = parseFloat(price).toFixed(4);

        logToFileAndConsole(`Adding entry: ${actionType} ${quantity} of ${itemName} at quality ${quality} for $${formattedPrice} by user ${userId}`);

        // Wait for getUser to return before proceeding
        const user = await getUser(userId, userName);
        if (!user) {
            // Handle case where user is not found
            logToFileAndConsole(`User not found for userId: ${userId}`);
            return;
        }

        const insertSQL = `
            INSERT INTO sales_list (channel_id, user_id, item_name, quantity, quality, timestamp, action_type, price, price_modifier, is_fixed_price)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        db.run(insertSQL, [channelId, user.id, itemName, quantity, quality, timestamp, actionType, price, priceModifier, isFixedPrice ? 1 : 0], function(err) {
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
        handleMatches(channelId, interaction);
    } catch (error) {
        console.error(error);
    }
}


function handleMatches(channelId, interaction) {

    if (interaction === null) {
        return;
    }

    db.serialize(() => {
        db.run("BEGIN TRANSACTION", (err) => {
            if (err) {
                logToFileAndConsole(`Error starting transaction: ${err.message}`);
                return;
            }

            // Adjusted SQL query to include price conditions
            let query = `
            SELECT sl.id, sl.orderNumber, sl.channel_id, sl.item_name, u.username, u.discord_id, sl.quantity, sl.quality, 
            sl.timestamp, sl.action_type, sl.price, sl.price_modifier, sl.is_fixed_price FROM sales_list sl
            INNER JOIN users u on u.id = sl.user_id
            WHERE sl.channel_id = ?
            `;

            db.all(query, [channelId], (err, rows) => {
                if (err) {
                    logToFileAndConsole(`Error finding matches: ${err.message}`);
                    db.run("ROLLBACK");
                    return;
                }

                if (rows.length === 0) {
                    logToFileAndConsole("No data in table.");
                    db.run("COMMIT");
                    return;
                }

                logToFileAndConsole(`Found ${rows.length} rows, processing...`);

                // Process rows to find matches
                let matches = [];
                let buyOrders = [];
                let sellOrders = [];

                for (let i = 0; i < rows.length; i++) {
                    let row = rows[i];
                    if (row.action_type === 'buy') {
                        buyOrders.push(row);
                    } else {
                        sellOrders.push(row);
                    }
                }

                for (let i = 0; i < buyOrders.length; i++) {
                    let buyOrder = buyOrders[i];

                    // ensure the buy orders id is not in the matches list
                    if (matches.some(match => match.buyOrder.id === buyOrder.id || match.sellOrder.id === buyOrder.id)) {
                        continue;
                    }

                    for (let j = 0; j < sellOrders.length; j++) {
                        let sellOrder = sellOrders[j];

                        // ensure the sell orders id is not in the matches list
                        if (matches.some(match => match.sellOrder.id === sellOrder.id || match.buyOrder.id === sellOrder.id)) {
                            continue;
                        }
                        
                        let itemNamesMatch = buyOrder.item_name === sellOrder.item_name; // check if the item names match
                        let qualityMatch = sellOrder.quality >= buyOrder.quality; // check if the sell order quality is greater than or equal to the buy order quality
                        let priceMatch = sellOrder.price <= buyOrder.price; // check if the sell order price is less than or equal to the buy order price
                        let quantityMatch = sellOrder.quantity >= buyOrder.quantity; // check if the sell order quantity is greater than or equal to the buy order quantity

                        if (!itemNamesMatch || !qualityMatch || !priceMatch || !quantityMatch) {
                            continue;
                        }

                        // append the match to the matches list
                        matches.push({
                            buyOrder: buyOrder,
                            sellOrder: sellOrder
                        });
                    }
                }

                // loop through the matches list, send a message to the channel and remove the matched orders
                for (let i = 0; i < matches.length; i++) {
                    let match = matches[i];
                    let buyOrder = match.buyOrder;
                    let sellOrder = match.sellOrder;

                    let message = `<@!${buyOrder.discord_id}> Match found! <@!${sellOrder.discord_id}> is selling ${buyOrder.quantity} Q${buyOrder.quality} ${buyOrder.item_name} @$${buyOrder.price}.`;

                    // check if the buy order quantity is less than the sell order quantity
                    if (buyOrder.quantity < sellOrder.quantity) {
                        // update the sell order quantity
                        console.log(`Updating sell order quantity ${sellOrder.id}`)
                        db.run("UPDATE sales_list SET quantity = ? WHERE id = ?", [sellOrder.quantity - buyOrder.quantity, sellOrder.id], (err) => {
                            if (err) {
                                logToFileAndConsole(`Error updating sell order quantity: ${err.message}`);
                            } else {
                                logToFileAndConsole(`Updated sell order quantity ${sellOrder.id}`);
                            }
                        }); 

                        // delete the buy order
                        console.log(`Deleting buy order ${buyOrder.id}`)
                        db.run("DELETE FROM sales_list WHERE id = ?", [buyOrder.id], (err) => {
                            if (err) {
                                logToFileAndConsole(`Error deleting buy order: ${err.message}`);
                            } else {
                                logToFileAndConsole(`Deleted buy order ${buyOrder.id}`);
                            }
                        });

                        
                        
                        // commit the changes
                        db.run("COMMIT");

                        // append the new sell order quantity to the message
                        message += `\n The sell order has been updated to now have ${sellOrder.quantity - buyOrder.quantity} units remaining.`;

                        // send the message to the channel
                        logToFileAndConsole(message);
                        interaction.channel.send(message);
                        continue;
                    } 

                    console.log(`Deleting buy order ${buyOrder.id}`)
                    // send the message to the channel
                    db.run("DELETE FROM sales_list WHERE id = ?", [buyOrder.id], (err) => {
                        if (err) {
                            logToFileAndConsole(`Error deleting buy order: ${err.message}`);
                        } else {
                            logToFileAndConsole(`Deleted buy order ${buyOrder.id}`);
                        }
                    });

                    console.log(`Deleting sell order ${sellOrder.id}`)
                    db.run("DELETE FROM sales_list WHERE id = ?", [sellOrder.id], (err) => {
                        if (err) {
                            logToFileAndConsole(`Error deleting sell order: ${err.message}`);
                        } else {
                            logToFileAndConsole(`Deleted sell order ${sellOrder.id}`);
                        }
                    });

                    // commit the changes
                    db.run("COMMIT");

                    logToFileAndConsole(message);

                    // send the message to the channel
                    interaction.channel.send(message);
                }

            });
        });
    });
}