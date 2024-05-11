const { SlashCommandBuilder } = require('discord.js');
const { getDB, checkAdmin, logToFileAndConsole  } = require("../../utilities.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear')
		.setDescription('Drop the orders table'),
	async execute(interaction) {
		handleClearCommand(interaction);
	},
};

function handleClearCommand(interaction) {

    const admin = checkAdmin(interaction.user.id);
    const db = getDB();

    if (!admin) {
        logToFileAndConsole(`Unauthorized user (${interaction.user.id}) attempted to use !clear`);
        interaction.reply("You do not have permission to use this command.");
        return;
    }
    const channelId = interaction.channel.id;
    db.run("DELETE FROM sales_list WHERE channel_id = ?", [channelId], function(err) {
        if (err) {
            logToFileAndConsole(`Error clearing sales list for channel: ${err.message}`);
            interaction.reply("Failed to clear the sales list.");
            return;
        }
        logToFileAndConsole(`Sales list cleared for channel ID: ${channelId}`);
        interaction.reply("Sales list has been cleared.");
    });
}