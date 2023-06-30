// Require the necessary discord.js classes

const fs = require('node:fs');
const path = require('node:path');
const dataCommand = require('./commands/generate.js')
const {SlashCommandBuilder,AttachmentBuilder,ActionRowBuilder,ButtonBuilder,EmbedBuilder,Client,GatewayIntentBits,Events,ModalBuilder,TextInputBuilder,TextInputStyle,Collection} = require('discord.js');
const axios = require('axios');
const { token } = require('./config.json');

// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

// 初始参数值
const param = {
  prompt: '',
  qrcode_url: '',
  weight: 1
}

// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`Ready! Logged in as ${c.user.tag}`);
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

// 发出command
client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	const command = interaction.client.commands.get(interaction.commandName);

	if (!command) {
		console.error(`No command matching ${interaction.commandName} was found.`);
		return;
	}

	try {
		await command.execute(interaction);
    param.prompt = interaction.options.getString('prompt');
    param.qrcode_url = interaction.options.getString('url');
    param.weight = interaction.options.getNumber('weight');
	} catch (error) {
		console.error(error);
		if (interaction.replied || interaction.deferred) {
			await interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
		} else {
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	}
});

// 点击按钮弹出窗口
client.on(Events.InteractionCreate, async interaction => {
  if(interaction.isButton()){
    const modal = new ModalBuilder()
      .setCustomId('regenerate_modal')
      .setTitle('Regenerate');
    const promptInput = new TextInputBuilder()
      .setCustomId('promptInput')
      .setLabel("Input prompt")
      .setStyle(TextInputStyle.Paragraph)
      .setMaxLength(4000)
      .setMinLength(1)
      .setValue(param.prompt)
      .setRequired(true);
    const qrcodeInput = new TextInputBuilder()
      .setCustomId('qrcodeInput')
      .setLabel("Input QR code URL")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(4000)
      .setMinLength(0)
      .setValue(param.qrcode_url)
      .setRequired(true);
    const weightInput = new TextInputBuilder()
      .setCustomId('weightInput')
      .setLabel("Input weight")
      .setStyle(TextInputStyle.Short)
      .setMaxLength(4000)
      .setMinLength(0)
      .setValue(param.weight.toString())
      .setRequired(true);
    const firstActionRow = new ActionRowBuilder().addComponents(promptInput);
    const secondActionRow = new ActionRowBuilder().addComponents(qrcodeInput);
    const thirdActionRow = new ActionRowBuilder().addComponents(weightInput);
    modal.addComponents(firstActionRow, secondActionRow, thirdActionRow);
    await interaction.showModal(modal);  
  }
});

// 收集窗口所填写的信息并回传
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isModalSubmit()) return;

  // Get the data entered by the user
  const promptInput = interaction.fields.getTextInputValue('promptInput');
  const qrcodeInput = interaction.fields.getTextInputValue('qrcodeInput');
  const weightInput = interaction.fields.getTextInputValue('weightInput');
  const data = {
      prompt: promptInput,
      qrcode_url: qrcodeInput,
      weight: parseFloat(weightInput)
  };
  console.log(data)
  const url = "URL LINK TO ALGORITHM MODULE"
  try {
      // 告知Discord机器人正在处理交互
      await interaction.deferReply();
      // 设置活动状态为"Bot正在响应"
      interaction.client.user.setPresence({
        activities: [
          {
            name: 'Bot正在响应',
            type: 'PLAYING'
          }
        ],
        status: 'online'
      });
      const response = await axios.post(url, data)
      const path = response.data?.data?.img_path
      const file = new AttachmentBuilder(path)
    
      // 模拟等待
      await new Promise((resolve) => setTimeout(resolve, 1000)); 
      // 清除活动状态
      interaction.client.user.setPresence({
        activities: [],
        status: 'online'
      });

      // 构建要@的交互对象
      const mentionUser = `${interaction.user}`;
      // 构建附加的表单信息
      const username = interaction.user.username
      const embed = new EmbedBuilder()
        .setColor(0x0099FF)
        .setTitle('OpenQR Bot')
        .addFields(
          { name: 'Prompt', value: `Prompt: ${promptInput} | Weight: ${weightInput}` },
          { name: 'Improve your QR Art', value: 'Adjust the parameter Weight towards 1 for better readability. Try small increments like 0.05.' },
        )
        .setTimestamp()
        .setFooter({ text: `Designed by @${username}` });

      //构建Regenerate按钮
      const button = new ButtonBuilder()
        .setCustomId('regenerate')
        .setLabel('📌Regenerate')
        .setStyle('Success');
      const row = new ActionRowBuilder().addComponents(button);
      
      await interaction.editReply({ content: mentionUser, files: [file], components: [row], embeds: [embed]})
  } catch (e) {
      console.log(e)
      await interaction.editReply("Error:" + e.toString())
  }  
});

// Log in to Discord with your client's token
client.login(token);
