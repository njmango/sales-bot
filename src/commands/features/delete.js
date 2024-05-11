const { SlashCommandBuilder } = require('discord.js');
const {logToFileAndConsole, openDB, checkAdmin} = require("../../utilities.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete')
		.setDescription('Delete a given order by order number.')
        .addIntegerOption(
            option => option.setName('order_number').setDescription('The order number to delete.').setRequired(true)
        ),
	async execute(interaction) {
        handleDeleteCommand(interaction)
    }
};


function handleDeleteCommand(interaction) {

    const orderNumber = interaction.options.getInteger('order_number');
    const isAdmin = checkAdmin(interaction.user.id);
    const db = openDB();
    
    db.get("SELECT user_id FROM sales_list WHERE orderNumber = ?", [orderNumber], async (err, row) => {
        if (err) {
            logToFileAndConsole(`Error fetching order: ${err.message}`);
            msg.channel.send("Failed to fetch the order.");

        }
        else if (!row) {
            msg.channel.send("Order not found.");
        }
        else if (interaction.user.id !== row.user_id && !isAdmin) {
            msg.channel.send("You do not have permission to delete this order.");
        } else {
            db.run("DELETE FROM sales_list WHERE orderNumber = ?", [orderNumber], async (err) => {
                if (err) {
                    logToFileAndConsole(`Error deleting order: ${err.message}`);
                    interaction.reply({content: `Failed to delete the order.`, ephemeral: true});
                }
                logToFileAndConsole(`Order ${orderNumber} deleted successfully.`);
                
                // send an ephemeral message to the user
                interaction.reply({content: `Order ${orderNumber} deleted successfully.`, ephemeral: true});
            });
        }
    });

    db.close();
}