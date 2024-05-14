const { SlashCommandBuilder } = require('discord.js');
const { AsciiTable3 } = require('ascii-table3'); 
const { sendChunkedMessages, updateListPrices, logToFileAndConsole, getDB, searchItem, searchType } = require("../../utilities.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('List current orders')
        .addBooleanOption(
            option => option.setName('compact').setDescription('Compact the list for mobile').setRequired(false)
        )
        .addStringOption(
            option => option.setName('item').setDescription('Filter for a specific item').setRequired(false)
        )
        .addIntegerOption(
            option => option.setName('quality').setDescription('Filter for a specific quality').setRequired(false).setMinValue(0).setMaxValue(12)
        )
        .addStringOption(
            option => option.setName('type').setDescription('Filter for a specific type of product').setRequired(false)
            .addChoices([
                {name: 'Agriculture', value: 'Agriculture'},
                {name: 'Food', value: 'Food'},
                {name: 'Construction', value: 'Construction'},
                {name: 'Fashion', value: 'Fashion'},
                {name: 'Energy', value: 'Energy'},
                {name: 'Electronics', value: 'Electronics'},
                {name: 'Automotive', value: 'Automotive'},
                {name: 'Aerospace', value: 'Aerospace'},
                {name: 'Resources', value: 'Resources'},
                {name: 'Research', value: 'Research'}
            ])
        )
        .addUserOption(
            option => option.setName('user').setDescription('Filter for a specific user').setRequired(false)
        ),
	async execute(interaction) {
        publishLists(interaction);
    }
};

async function publishLists(interaction) {

    //updateListPrices(interaction.channel);

    const item = interaction.options.getString('item');
    const quality = interaction.options.getInteger('quality');
    const type = interaction.options.getString('type');
    const user = interaction.options.getUser('user');


    let base_query = `SELECT orderNumber, i.name , quality, quantity, price, price_modifier, users.username, action_type FROM sales_list
    INNER JOIN users ON sales_list.user_id = users.id
    INNER JOIN items i ON sales_list.item = i.id WHERE`
    
    if (item) {

        // search the item
        const resolvedItem = await searchItem(item);
        const tableID = resolvedItem.tableid;

        if (resolvedItem.name == null) {
            interaction.reply({content: "Item not found.", ephemeral: true});
            return;
        } 

        if (resolvedItem.certain == false && resolvedItem.name != null && resolvedItem.similarity < 0.7) {
            interaction.reply({content: `Item not found, did you mean ${resolvedItem.name}?`, ephemeral: true});
            return;
        }

        base_query += ` i.id = '${tableID}' AND`;
    }

    if (quality) {
        base_query += ` quality >= ${quality} AND`;
    }

    if (type) {

        const resolvedType = await searchType(type);

        if (resolvedType.name == null) {
            logToFileAndConsole(`[List: publishLists] Type not found: ${type}`);
            interaction.reply({content: "Type not found - Please make an admin aware of this error [List: publishLists]", ephemeral: true});
            return;
        } 

        if (resolvedType.name != null && resolvedType.similarity < 0.7) {
            interaction.reply({content: `Type not found, did you mean ${resolvedItem.name}? - Please make an admin aware of this error [List: publishLists]`, ephemeral: true});
            return;
        }

        base_query += ` i.type = '${resolvedType.id}' AND`;
    }

    if (user) {
        base_query += ` users.discord_id = '${user.id}' AND`;
    }

    // Retrieve and display sales list for both selling and buying
    const queries = {
        sell: `${base_query} action_type = 'sell' ORDER BY orderNumber DESC`,
        buy: `${base_query} action_type = 'buy' ORDER BY orderNumber DESC`
    }

    const db = getDB();
    channelId = interaction.channel.id;

    let first = true;

    for (const [listType, query] of Object.entries(queries)) {
        console.log(`Querying ${listType} list...`);

        db.all(query, (err, rows) => {
            if (err) {
                logToFileAndConsole(`Failed to retrieve ${listType} list:`, err);

                if (!first) {
                    interaction.channel.send(`Failed to retrieve the ${listType} list.`)
                } else {
                    interaction.reply({content: `Failed to retrieve the ${listType} list.`});
                    first = false;
                }

                
            } else if (rows.length === 0) {
                if (!first) {
                    interaction.channel.send(`No ${listType} entries found.`);
                } else {
                    interaction.reply({content: `No ${listType} entries found.`});
                    first = false;
                }
            } else {
                let formattedList = '';
                if (interaction.options.getBoolean('compact')) {
                    formattedList = formatSalesList(rows, listType);
                } else {
                    formattedList = formatBigSalesList(rows, listType);
                }
                console.log(`Sending ${listType} list...`);
                sendChunkedMessages(
                    interaction,
                    formattedList,
                    !first
                );
                first = false;
            }
        });
    }
}

function formatSalesList(rows, listType) {

    let table = new AsciiTable3(`${listType.toUpperCase()} LIST`)

    // add header row
    table.setHeading('#:Item:Q' , 'Quantity', 'Price');

    rows.forEach(row => {
        const orderItemQuality = `${row.orderNumber}:${row.name.substring(0, 12)}:Q${row.quality}`;
        const quantityInThousands = row.quantity;
        const modifierDisplay = row.price_modifier === 0 ? 'MP' : (row.price_modifier > 0 ? `${row.price_modifier}` : `${row.price_modifier}`);
        let formattedPrice = row.price === -1 ? `MP (${modifierDisplay})` : `${row.price.toFixed(2)} (${modifierDisplay})`;

        table.addRow(orderItemQuality, quantityInThousands, formattedPrice)
    });
    
    let message = table.toString()

    return message;
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
        const item = row.name;
        const quality = row.quality.toString();
        const quantity = row.quantity.toString();
        const modifierDisplay = row.price_modifier === 0 ? '' : (row.price_modifier > 0 ? `${row.price_modifier}` : `${row.price_modifier}`);
        const price = `${row.price.toFixed(2)} (${modifierDisplay})`;
        const seller = row.username;

        table.addRow(order, item, quality, quantity, price, seller);

    });
    
    let message = table.toString()

    return message;
}