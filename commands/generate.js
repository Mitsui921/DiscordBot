const {SlashCommandBuilder,AttachmentBuilder,ActionRowBuilder,ButtonBuilder,EmbedBuilder,Client,GatewayIntentBits,Events,ModalBuilder,TextInputBuilder,TextInputStyle} = require('discord.js');
const axios = require('axios');
const client = new Client({ intents: [GatewayIntentBits.Guilds] });

module.exports = {
    once: false,
    data: new SlashCommandBuilder()
        .setName('generate')
        .setDescription('generate qrcode')
        .addStringOption(option =>
            option
                .setName('prompt')
                .setDescription('prompt used to generate qrcode')
                .setRequired(true))
        .addStringOption(option =>
            option
                .setName('url')
                .setDescription('website url')
                .setRequired(true))
        .addNumberOption(option =>
            option
                .setName('weight')
                .setDescription('weight')
                .setRequired(true)),

    async execute(interaction) {
      
        const prompts = interaction.options.getString('prompt');
        const link_url = interaction.options.getString('url');
        const weight = interaction.options.getNumber('weight');

        const data = {
            prompt: prompts,
            qrcode_url: link_url,
            weight: weight
        };
        const url = "URL LINK TO ALGORITHM MODULE"
        try {
            // 告知Discord机器人正在处理交互
            await interaction.deferReply();
            // 设置活动状态为"Bot正在响应"
            await interaction.client.user.setPresence({
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
            await interaction.client.user.setPresence({
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
                { name: 'Prompt', value: `Prompt: ${prompts} | Weight: ${weight}` },
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
    },
    
};
