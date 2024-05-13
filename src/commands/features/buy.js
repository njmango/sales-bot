const { SlashCommandBuilder } = require('discord.js');
const { searchItem, validatePriceModifier, calculateFinalPrice, findLowestPriceForItem, addEntry  } = require("../../utilities.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('buy')
		.setDescription('Create a new buy order.')
        .addStringOption(
            option => option.setName('item_name').setDescription('The item to buy').setRequired(true)
        
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
        ),
	async execute(interaction) {
        handleSellCommand(interaction);
    }
};

async function handleSellCommand(interaction) {
    const quality = interaction.options.getInteger('quality');
    const quantity = interaction.options.getInteger('quantity');
    let priceModifier = interaction.options.getString('price');
    const itemName = interaction.options.getString('item_name');
    const isFixedPrice = interaction.options.getString('price_type') === 'fixed' ? true : false;

    // search the item
    const resolvedItem = await searchItem(itemName);
    const itemKey = resolvedItem.id;

    if (resolvedItem.name == null) {
        interaction.reply({content: "Item not found.", ephemeral: true});
        return;
    } 

    if (resolvedItem.certain == false && resolvedItem.name != null && resolvedItem.similarity < 0.7) {
        interaction.reply({content: `Item not found, did you mean ${resolvedItem.name}?`, ephemeral: true});
        return;
    }

    // Initialize finalPrice to handle cases where no market price is found
    let finalPrice = -1; // Default to -1, which will be interpreted as 'MP'

    const priceInfo = await findLowestPriceForItem(0, itemKey, quality);
    if (!priceInfo.price) {
        interaction.reply({content: "Failed to fetch the latest market price. Adding to list with 'MP' as price.", ephemeral: true});
        return;
    }

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

    // Construct the message to send to the channel
    const responseMessage = `Buying ${resolvedItem.name} at Quality ${quality} for ${quantity} units at ${finalPrice}`;
    interaction.reply({content: responseMessage, ephemeral: true});

    // Add entry to the sales list
    await addEntry(interaction.channel.id, interaction.user.id, interaction.member ? interaction.user.displayName : interaction.user.username, resolvedItem.tableid, quality, quantity, true, finalPrice, priceModifier, isFixedPrice, interaction);
}