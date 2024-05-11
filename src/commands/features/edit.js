const { SlashCommandBuilder } = require('discord.js');
const {logToFileAndConsole, openDB, checkAdmin} = require("../../utilities.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edit')
		.setDescription('Edit a given order by order number.')
        .addIntegerOption(
            option => option.setName('order_number').setDescription('The order number to delete.').setRequired(true)
        )
        .addStringOption(
            option => option.setName('new_item_name').setDescription('The corrected item').setRequired(false)
        )
        .addIntegerOption(
            option => option.setName('new_quality').setDescription('The corrected quality').setRequired(false)
        )
        .addIntegerOption(
            option => option.setName('new_quantity').setDescription('The corrected quantity').setRequired(false)
        )
        .addStringOption(
            option => option.setName('new_price').setDescription('The corrected price').setRequired(false)
        ),

	async execute(interaction) {
        handleEditCommand(interaction)
    }
};

function handleEditCommand(interaction) {

    const orderNum = interaction.options.getInteger('order_number');
    const itemQuality = interaction.options.getString('new_quality');
    const itemQuantity = interaction.options.getInteger('new_quantity');
    const itemPrice = interaction.options.getString('new_price');
    const itemName = interaction.options.getString('new_item_name');

    const isAdmin = checkAdmin(interaction.user.id);
    const db = openDB();

    db.get("SELECT * FROM sales_list WHERE orderNumber = ?", [orderNum], async (err, row) => {
        if (err) {
            logToFileAndConsole(`Error retrieving entry: ${err.message}`);
            interaction.reply({content: "Failed to retrieve the entry.", ephemeral: true});
            db.close();
            return;
        }

        if (!row) {
            interaction.reply({content: `No entry found with order number: ${orderNum}.`, ephemeral: true});
            db.close();
            return;
        }

        if (row.user_id !== interaction.user.id && !isAdmin) {
            interaction.reply({content: "You do not have permission to edit this entry.", ephemeral: true});
            db.close();
            return;
        }

        const updates = {};
        if (itemName.toLowerCase() !== null) updates.item_name = itemName;
        if (itemQuality !== null) updates.quality = parseInt(itemQuality);
        if (itemQuantity !== null) updates.quantity = parseInt(itemQuantity);
        if (itemPrice !== null) updates.price = parseFloat(itemPrice).toFixed(4);

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
                interaction.reply({content: "Failed to update the entry.", ephemeral: true});
                db.close();
                return;
            }
            logToFileAndConsole("Entry updated successfully.");
            interaction.reply({content: "Entry updated successfully.", ephemeral: true});
        });
    });
    db.close();
}