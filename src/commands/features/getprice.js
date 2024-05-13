const { SlashCommandBuilder } = require('discord.js');
const { findLowestPriceForItem, logToFileAndConsole, searchItem, getDB} = require("../../utilities.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('getprice')
		.setDescription('Get the current market price of an item')
        .addStringOption(
            option => option.setName('item_name').setDescription('The item to get the price of').setRequired(true)
        )
        .addIntegerOption(
            option => option.setName('quality').setDescription('The quality of the item').setRequired(true).setMaxValue(12).setMinValue(0)
        )
        .addStringOption(
            option => option.setName('realm').setDescription('The realm to get the price of').setRequired(false)
            .addChoices([
                {name: 'Magnates', value: "0"},
                {name: 'Entrepreneur', value: "1"}
            ])

        ),
	async execute(interaction) {
        handlePriceCommand(interaction);
    }
};

async function handlePriceCommand(interaction) {

    const quality = interaction.options.getInteger('quality');
    const itemNameOrNumber = interaction.options.getString('item_name');
    const realm = interaction.options.getString('realm');

    // if realm is not specified, default to 0
    const realmId = realm ? parseInt(realm) : 0;

    logToFileAndConsole(`Received item name or number: ${itemNameOrNumber}`);

    const item = await searchItem(itemNameOrNumber);

    if (item.certain == false && item.name != null && item.similarity < 0.7) {
        interaction.reply({content: `Item not found, did you mean ${item.name}?`, ephemeral: true});
        return;
    } else if (item.name == null) {
        interaction.reply({content: "Item not found.", ephemeral: true});
        return;
    }
        
    findLowestPriceForItem(realmId, item.id, quality).then(priceInfo => {
        if (!priceInfo.price) {
            interaction.reply({content: "No price found for the specified item quality or below.", ephemeral: true});
        } else {

            let message = `${item.name}: Lowest Price on the exchange: $${priceInfo.price.toFixed(4)} at Quality ${priceInfo.quality}.`

            getLowestPriceLocal(item.id, quality).then(priceInfolocal => {

                if (priceInfolocal !== null) {
                    
                    const localuser = priceInfolocal.discord_id;
                    const localorderNumber = priceInfolocal.orderNumber;
                    const localprice = priceInfolocal.price.toFixed(4);
                    const localquality = priceInfolocal.quality;
                    const localquantity = priceInfolocal.quantity;

                    message += `\n\n**Cheapest sale order for ${item.name} in this server**: \nOrder Number: ${localorderNumber} \n Price: $${localprice} \n Quality: ${localquality} \n Quantity: ${localquantity} \n Seller: <@${localuser}>`;
                }
                
                interaction.reply({content: message, ephemeral: true, allowedMentions: {parse: []}});
            });
        }
    }).catch(err => {
        logToFileAndConsole(`Error fetching price for item: ${itemNameOrNumber} - ${err}`);
        interaction.reply({content: "Failed to fetch the latest market price. Please try again later.", ephemeral: true});
    });
}

async function getLowestPriceLocal(itemID, quality) {

    const db = getDB();

    // create a promise to return the data
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT u.discord_id, quality, orderNumber, price, quantity FROM sales_list 
            INNER JOIN users u ON sales_list.user_id = u.id
            INNER JOIN items i ON sales_list.item = i.id
            WHERE i.id = ? AND quality >= ? AND action_type = ? ORDER BY price ASC LIMIT 1`, 
            [itemID, quality, "sell"], 
            (err, row) => {
                if (err) {
                    logToFileAndConsole(`Error retrieving entry: ${err.message}`);
                    reject(err);
                }
        
                if (!row) {
                    resolve(null);
                }
                
                resolve(row);
            });
    });
}