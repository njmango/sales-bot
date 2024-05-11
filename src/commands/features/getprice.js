const { SlashCommandBuilder } = require('discord.js');
const { sendChunkedMessages, findLowestPriceForItem, logToFileAndConsole, getDB, searchItem   } = require("../../utilities.js");

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

function handlePriceCommand(interaction) {

    const quality = interaction.options.getInteger('quality');
    const itemNameOrNumber = interaction.options.getString('item_name');
    const realm = interaction.options.getString('realm');

    // if realm is not specified, default to 0
    const realmId = realm ? parseInt(realm) : 0;

    logToFileAndConsole(`Received item name or number: ${itemNameOrNumber}`);

    const item = searchItem(itemNameOrNumber);

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
            interaction.reply({content: `${item.name}: Lowest Price: $${priceInfo.price.toFixed(4)} at Quality ${priceInfo.quality}.`, ephemeral: true});
        }
    }).catch(err => {
        logToFileAndConsole(`Error fetching price for item: ${itemNameOrNumber} - ${err}`);
        interaction.reply({content: "Failed to fetch the latest market price. Please try again later.", ephemeral: true});
    });
}