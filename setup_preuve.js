const {
  Client,
  GatewayIntentBits,
  Partials,
  Events,
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionsBitField,
  REST,
  Routes,
} = require('discord.js');

const TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = '1462506148954509396'; // À remplacer
const GUILD_ID = '1383425773263917056'; // À remplacer
const CATEGORY_ID = '1462510421020901376'; // Catégorie des tickets

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel],
});

client.once('ready', () => {
  console.log(`🤖 Bot connecté en tant que ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
    if (interaction.commandName === 'setup-preuve') {
      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('open_proof_ticket')
          .setLabel('📁 Déposer une preuve')
          .setStyle(ButtonStyle.Primary)
      );
      await interaction.reply({
        content: 'Cliquez sur le bouton ci-dessous pour déposer une preuve confidentielle.',
        components: [row],
      });
    }
  }

  if (interaction.isButton()) {
    if (interaction.customId === 'open_proof_ticket') {
      const channel = await interaction.guild.channels.create({
        name: `preuve-${interaction.user.username}`,
        type: ChannelType.GuildText,
        parent: CATEGORY_ID,
        permissionOverwrites: [
          {
            id: interaction.guild.roles.everyone,
            deny: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: interaction.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
          {
            id: client.user.id,
            allow: [PermissionsBitField.Flags.ViewChannel],
          },
          // Ajoute ici les rôles du staff
        ],
      });

      const modal = new ModalBuilder()
        .setCustomId('preuve_formulaire')
        .setTitle('📝 Dépôt de preuve');

      const question1 = new TextInputBuilder()
        .setCustomId('typePreuve')
        .setLabel('Type de preuve (citoyen, labo, etc.)')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const question2 = new TextInputBuilder()
        .setCustomId('details')
        .setLabel('Résumé de la situation')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      const row1 = new ActionRowBuilder().addComponents(question1);
      const row2 = new ActionRowBuilder().addComponents(question2);

      await interaction.reply({ content: `Salon créé : ${channel}`, ephemeral: true });
      await interaction.user.send({ content: `Merci de remplir le formulaire pour le salon ${channel}.` });
      await interaction.user.showModal(modal.addComponents(row1, row2));
    }
  }

  if (interaction.isModalSubmit()) {
    if (interaction.customId === 'preuve_formulaire') {
      const type = interaction.fields.getTextInputValue('typePreuve');
      const details = interaction.fields.getTextInputValue('details');

      const channel = interaction.guild.channels.cache.find(c =>
        c.name === `preuve-${interaction.user.username}`
      );

      if (channel) {
        await channel.send({
          content: `📥 **Nouveau dépôt de preuve par <@${interaction.user.id}>**

🗂 **Type** : ${type}
📝 **Détails** :
${details}`,
        });
      }

      await interaction.reply({ content: '✅ Preuve envoyée.', ephemeral: true });
    }
  }
});

// Enregistrement de la commande slash
const rest = new REST({ version: '10' }).setToken(TOKEN);

const commands = [new SlashCommandBuilder().setName('setup-preuve').setDescription('Affiche le bouton de dépôt de preuve.')];

(async () => {
  try {
    console.log('📦 Enregistrement de la commande...');
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands.map(command => command.toJSON()),
    });
    console.log('✅ Commande enregistrée.');
    client.login(TOKEN);
  } catch (err) {
    console.error(err);
  }
})();
