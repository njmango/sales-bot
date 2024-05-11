const { SlashCommandBuilder } = require('discord.js');
const { AsciiTable3 } = require('ascii-table3'); 
const { sendChunkedMessages, updateListPrices, logToFileAndConsole, getDB   } = require("../../utilities.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('list')
		.setDescription('List current orders')
        .addBooleanOption(
            option => option.setName('compact').setDescription('Compact the list for mobile').setRequired(false)
        ),
	async execute(interaction) {
        publishLists(interaction);
    }
};

async function publishLists(interaction) {

    updateListPrices(interaction.channel);

    // Retrieve and display sales list for both selling and buying
    const queries = {
        sell: "SELECT orderNumber, item_name, quality, quantity, price, price_modifier, username, action_type FROM sales_list WHERE action_type = 'sell' ORDER BY orderNumber DESC",
        buy: "SELECT orderNumber, item_name, quality, quantity, price, price_modifier, username, action_type FROM sales_list WHERE action_type = 'buy' ORDER BY orderNumber DESC"
    };

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
        const orderItemQuality = `${row.orderNumber}:${row.item_name.substring(0, 12)}:Q${row.quality}`;
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
        const item = row.item_name;
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