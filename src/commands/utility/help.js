const { SlashCommandBuilder } = require('discord.js');
const { AsciiTable3 } = require('ascii-table3'); 

/* Example:
[
    { "command": "!showlistbig", "description": "Display a detailed list of all current buy and sell orders in desktop format, has all info" },
]
*/

const variables = require('../../vars.json');
const commandsHelp = variables.commands;

module.exports = {
	data: new SlashCommandBuilder()
		.setName('help')
		.setDescription('Sends a help message with all commands and their descriptions.')
        .addBooleanOption(
            option => option.setName('compact').setDescription('Compact the list for mobile').setRequired(false)
        ),
	async execute(interaction) {

        let message = '';
        let table = new AsciiTable3('COMMANDS')

        let compacted = interaction.options.getBoolean('compact');

        if (compacted == null) {
            compacted = false;
        }

        console.log(compacted)

        if (compacted == false) {
            table.setHeading('Command', 'Description')
        
            commandsHelp.forEach(command => {
                table.addRow(command.command, command.description)
            });
        
            message = table.toString()
        } else {
            // create a table with two columns, the description column being a wrapped column with a max width of 21 characters
            table.setAlignCenter(1)
            
        
            // set the width of the description column table.setWidth(2, 21); and wrap the text
            table.setWrapped(2, true);
            table.setWidth(2, 21);
            
            // left align the first column
            table.setAlignLeft(1);
        
            // print the length of commandsHelp
            console.log(commandsHelp.length)

            // add each command and description to the table
            commandsHelp.forEach(command => {
                table.addRow(command.command, command.description)
        
                // check if it isn't the last row and add a separator
                if (command !== commandsHelp[commandsHelp.length - 1]) {
                    table.addRow('------------','-------------------')
                }        
            });
        
            // send the table as a message
            message = `${table.toString()}`
        }

        sendChunkedMessages(interaction, message);
	},
};

function sendChunkedMessages(interaction, message) {
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

        if (!replied) {
            interaction.reply(`\`\`\`\n${chunk}\n\`\`\``);
            replied = true;
        } else {
            interaction.channel.send(`\`\`\`\n${chunk}\n\`\`\``);
        }
        start = end;
    }
}