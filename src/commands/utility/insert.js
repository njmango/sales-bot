const { SlashCommandBuilder } = require('discord.js');
const { checkAdmin, logToFileAndConsole, searchItem, addEntry, validatePriceModifier, calculateFinalPrice, findLowestPriceForItem } = require("../../utilities.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('insert')
		.setDescription('[Admin] Add an entry to the sales list for another user')
        .addUserOption(
            option => option.setName('user').setDescription('The user to add the entry for').setRequired(true)
        )
        .addStringOption(
            option => option.setName('item').setDescription('The item to add').setRequired(true)
        )
        .addIntegerOption(
            option => option.setName('quality').setDescription('The quality of the item').setRequired(true).setMaxValue(12).setMinValue(0)
        )
        .addIntegerOption(
            option => option.setName('quantity').setDescription('The quantity of the item').setRequired(true).setMinValue(1)
        )
        .addStringOption(
            option => option.setName('price').setDescription('The price').setRequired(true)
        )
        .addStringOption(
            option => option.setName('price_type').setDescription('The type of price you have entered').setRequired(true)
            .addChoices([
                {name: 'Fixed', value: 'fixed'},
                {name: 'modifier', value: 'modifier'}
            ])
        )
        .addStringOption(
            option => option.setName('buy_or_sell').setDescription('Is it a buy order or a sell order').setRequired(true)
            .addChoices([
                {name: 'Buy', value: 'buy'},
                {name: 'Sell', value: 'sell'}
            ])
        ),
	async execute(interaction) {
		handleInsertCommand(interaction);
	},
};


async function handleInsertCommand(interaction) {

    if (!checkAdmin(interaction.user.id)) {
        interaction.reply({content: "You do not have permission to use this command.", ephemeral: true});
        return;
    }

    const user = interaction.options.getUser('user');
    const userId = user.id;
    const itemIn = interaction.options.getString('item');
    const quality = interaction.options.getInteger('quality');
    const quantity = interaction.options.getInteger('quantity');
    let priceModifier = interaction.options.getString('price');
    const isFixedPrice = interaction.options.getString('price_type') === 'fixed' ? true : false;
    const buyOrSell = interaction.options.getString('buy_or_sell');
    let buy = true;
    let finalPrice = -1;

    if (buyOrSell != 'buy') {
        buy = false;
    }
        

    // search the item
    const resolvedItem = await searchItem(itemIn);

    if (resolvedItem.name == null) {
        interaction.reply({content: "Item not found.", ephemeral: true});
        return;
    } 

    if (resolvedItem.certain == false && resolvedItem.name != null && resolvedItem.similarity < 0.7) {
        interaction.reply({content: `Item not found, did you mean ${resolvedItem.name}?`, ephemeral: true});
        return;
    }

    const priceInfo = await findLowestPriceForItem(0, resolvedItem.id, quality);

    if (!isFixedPrice) {
        // Calculate final price based on market price and modifier
        finalPrice = calculateFinalPrice(priceInfo.price, priceModifier);

        if (validatePriceModifier(priceModifier, finalPrice) == false) {
            interaction.reply({content: "Invalid price modifier or final price.", ephemeral: true});
            return;
        }
    } else {
        finalPrice = priceModifier;

        if (validatePriceModifier(priceModifier, finalPrice) == false) {
            interaction.reply({content: "Invalid Price.", ephemeral: true});
            return;
        }

        priceModifier = 'fixed';
    }

    const itemName = resolvedItem.name;

    logToFileAndConsole(`Inserting entry on behalf of user ${userId}: ${itemName}, Quality=${quality}, Quantity=${quantity}, Price=${finalPrice.toFixed(4)}`);

    await addEntry(interaction.channel.id, userId, user.username, resolvedItem.tableid, quality, quantity, buy, finalPrice, priceModifier, isFixedPrice);
    interaction.reply({content:`Entry added for ${itemName}, Quality=${quality}, Quantity=${quantity}, Price=${finalPrice.toFixed(4)}`, ephemeral: true});
}