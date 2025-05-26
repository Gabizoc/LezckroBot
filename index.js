const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ActivityType } = require('discord.js');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs');
const mongoose = require('mongoose');

// Load configuration from config.json
const config = JSON.parse(fs.readFileSync('config.json', 'utf8'));
const { token: DISCORD_TOKEN, dailyChannelId: DAILY_CHANNEL_ID, mongodbUri: MONGODB_URI, status } = config;
const AUTHORIZED_USER_ID = config.userIdcmd;
const ERROR_NOTIFICATION_USER_ID = config.errorNotifId;

// Connect to MongoDB
mongoose.connect(MONGODB_URI);

// Define schemas and models
const voteSchema = new mongoose.Schema({
    messageId: String,
    question: String,
    category: String,
    votes: {
        left: { type: Number, default: 0 },
        right: { type: Number, default: 0 }
    }
});
const Vote = mongoose.model('Vote', voteSchema);

const scheduleSchema = new mongoose.Schema({
    time: { type: String, default: '0 8 * * *' } // Default to 8 AM every day
});
const Schedule = mongoose.model('Schedule', scheduleSchema);

// Create a new Discord client instance
const bot = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ]
});

// Display logo function
const displayLogo = async () => {
    const chalk = (await import('chalk')).default;
    console.clear();
    console.log(chalk.hex('#FA7116')("_________________________________________________"));
    console.log(chalk.hex('#FA7116')("| _                           ______       _    |"));
    console.log(chalk.hex('#FA7116')("|| |                          | ___ \\     | |   |"));
    console.log(chalk.hex('#FA7116')("|| |     ___ _______ _ __ ___ | |_/ / ___ | |_  |"));
    console.log(chalk.hex('#FA7116')("|| |    / _ \\_  / __| '__/ _ \\| ___ \\/ _ \\| __| |"));
    console.log(chalk.hex('#FA7116')("|| |___|  __// / (__| | | (_) | |_/ / (_) | |_  |"));
    console.log(chalk.hex('#FA7116')("|\\_____/\\___/___\\___|_|  \\___/\\____/ \\___/ \\__| |"));
    console.log(chalk.hex('#FA7116')("|_______________________________________________|"));
    console.log(chalk.red('=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+='));
    console.log(chalk.hex("#FA7116")('Twitch -> https://twitch.tv/danleskro'));
    console.log(chalk.red('=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+=+='));
    console.log(chalk.hex("#FA7116")('Logs :'));
};

// Error handling function
const handleError = async (error) => {
    console.error(error);
    try {
        const user = await bot.users.fetch(ERROR_NOTIFICATION_USER_ID);
        if (user) {
            await user.send(`Une erreur s'est produite : ${error.message}`);
        }
    } catch (sendError) {
        console.error('Failed to send error message:', sendError);
    }
};

// Call displayLogo function
displayLogo().catch(handleError);

// List of URLs and their corresponding categories
const categories = [
    { url: 'https://www.jeu-tu-preferes.fr/lister/a-vie', category: 'À vie' },
    { url: 'https://www.jeu-tu-preferes.fr/lister/corps-humain', category: 'Corps humain' },
    { url: 'https://www.jeu-tu-preferes.fr/lister/situation', category: 'Situation' },
    { url: 'https://www.jeu-tu-preferes.fr/lister/actualite', category: 'Actualité' },
    { url: 'https://www.jeu-tu-preferes.fr/lister/sport', category: 'Sport' },
    { url: 'https://www.jeu-tu-preferes.fr/lister/marque', category: 'Marque' },
    { url: 'https://www.jeu-tu-preferes.fr/lister/personnage', category: 'Personnage' },
    { url: 'https://www.jeu-tu-preferes.fr/lister/serie-tv', category: 'Série TV' }
];

// Function to scrape questions from a URL
const scrapeQuestions = async (url, category) => {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);
        return $('section#content p a').map((_, el) => ({
            question: $(el).text(),
            category
        })).get();
    } catch (error) {
        handleError(error);
        return [];
    }
};

// Function to load questions from all URLs
const loadQuestions = async () => {
    const questions = await Promise.all(categories.map(({ url, category }) => scrapeQuestions(url, category)));
    return questions.flat();
};

// Emoji mapping
const leftEmoji = '<:Orange:1270455759355908181>';
const rightEmoji = '<:Vert:1270405415871578198>';

// Function to get the gauge emoji representation
const getGauge = (leftVotes, rightVotes) => {
    const totalVotes = leftVotes + rightVotes;
    const maxEmojis = 10;
    const emojiPercentage = 100 / maxEmojis;

    if (totalVotes === 0) {
        return `${rightEmoji.repeat(5)}${leftEmoji.repeat(5)}`;
    }

    const leftPercentage = (leftVotes / totalVotes) * 100;
    const numLeftEmojis = Math.round(leftPercentage / emojiPercentage);
    const numRightEmojis = maxEmojis - numLeftEmojis;

    return `${rightEmoji.repeat(numRightEmojis)}${leftEmoji.repeat(numLeftEmojis)}`;
};

// Function to format percentages to a string
const formatPercentage = (percentage) => percentage.toFixed(1) + '%';

// Function to send a daily question with buttons
const sendDailyQuestion = async (channel) => {
    try {
        const questions = await loadQuestions();

        if (questions.length === 0) {
            console.error('Aucune question trouvée.');
            await channel.send('Aucune question trouvée.');
            return;
        }

        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        const embed = new EmbedBuilder()
            .setTitle('<:Coeur:1270419751184629823> Tu préfères ?')
            .setDescription(`<:Categorie:1270419194516602880> **Catégorie :** *${randomQuestion.category}*\n\n` +
                `<:Fleche:1270419451283509248> ${randomQuestion.question}`)
            .setThumbnail('https://i.postimg.cc/tTPsG6yT/appreciated.png')
            .setAuthor({ name: "Leskro Bot", iconURL: "https://media.discordapp.net/attachments/1270358797566873600/1270463169336311941/0e396f4f93ecf9ca54fcb048fee23361.png?ex=66b3ca87&is=66b27907&hm=8c0c63d568edb748d14613442b8a6d6014bacc1e55763d4f3f43d4e74f56833d&=&format=webp&quality=lossless&width=437&height=437" })
            .setFooter({ text: 'By Gabizoc', iconURL: "https://i.postimg.cc/1tFh2LpZ/Sans-titre.png" })
            .setColor('#D35400')
            .setTimestamp();

        const yesButton = new ButtonBuilder()
            .setCustomId('yes')
            .setEmoji('<:1_:1270458729871048848>')
            .setStyle(ButtonStyle.Success);

        const noButton = new ButtonBuilder()
            .setCustomId('no')
            .setEmoji('<:2_:1270459085300699206>')
            .setStyle(ButtonStyle.Danger);

        const row = new ActionRowBuilder().addComponents(yesButton, noButton);

        const message = await channel.send({ embeds: [embed], components: [row] });

        // Save the question and initial votes to MongoDB
        const voteDoc = new Vote({
            messageId: message.id,
            question: randomQuestion.question,
            category: randomQuestion.category
        });
        await voteDoc.save();

        // Create a collector for the interaction
        const filter = (interaction) => interaction.isButton() && interaction.message.id === message.id;
        const collector = message.createMessageComponentCollector({ filter, time: 86400000 });

        collector.on('collect', async (interaction) => {
            try {
                const vote = await Vote.findOne({ messageId: message.id });

                if (interaction.customId === 'yes') {
                    vote.votes.right += 1;
                } else if (interaction.customId === 'no') {
                    vote.votes.left += 1;
                }

                await vote.save();

                const totalVotes = vote.votes.left + vote.votes.right;
                const leftPercentage = totalVotes === 0 ? 0 : (vote.votes.left / totalVotes) * 100;
                const rightPercentage = totalVotes === 0 ? 0 : (vote.votes.right / totalVotes) * 100;

                const updatedEmbed = new EmbedBuilder()
                    .setTitle('<:Coeur:1270419751184629823> Tu préfères ?')
                    .setDescription(`<:Categorie:1270419194516602880> **Catégorie :** *${randomQuestion.category}*\n\n` +
                        `<:Fleche:1270419451283509248> ${randomQuestion.question}\n\n` +
                        `**<:Vote:1270419065219059792> Résultats :**\n` +
                        ` ${vote.votes.right} vote(s)*(${formatPercentage(rightPercentage)})* ` + getGauge(vote.votes.left, vote.votes.right) + ` ${vote.votes.left} vote(s)*(${formatPercentage(leftPercentage)})*`)
                    .setThumbnail('https://i.postimg.cc/tTPsG6yT/appreciated.png')
                    .setFooter({ text: 'By Gabizoc', iconURL: "https://i.postimg.cc/1tFh2LpZ/Sans-titre.png" })
                    .setAuthor({ name: "Leskro Bot", iconURL: "https://media.discordapp.net/attachments/1270358797566873600/1270463169336311941/0e396f4f93ecf9ca54fcb048fee23361.png?ex=66b3ca87&is=66b27907&hm=8c0c63d568edb748d14613442b8a6d6014bacc1e55763d4f3f43d4e74f56833d&=&format=webp&quality=lossless&width=437&height=437" })
                    .setColor('#D35400')
                    .setTimestamp();

                await interaction.update({ embeds: [updatedEmbed] });
            } catch (error) {
                handleError(error);
            }
        });

        collector.on('end', (collected) => {
            console.log(`Collected ${collected.size} interactions.`);
        });
    } catch (error) {
        handleError(error);
    }
};

bot.once('ready', async () => {
    try {
        console.log(`Connécté à ${bot.user.tag}`);

        let scheduleDoc = await Schedule.findOne();
        if (!scheduleDoc) {
            scheduleDoc = new Schedule();
            await scheduleDoc.save();
        }

        const cronTime = scheduleDoc.time;
        if (!cronTime || !/^0 \d+ \* \* \*$/.test(cronTime)) {
            throw new Error('Invalid cron time format');
        }

        cron.schedule(cronTime, async () => {
            const channel = bot.channels.cache.get(DAILY_CHANNEL_ID);
            if (channel) sendDailyQuestion(channel).catch(handleError);
        }, {
            timezone: 'Europe/Paris'
        });

        bot.user.setPresence({
            activities: [{ name: status, type: ActivityType.Watching }],
            status: 'online',
        });
    } catch (error) {
        handleError(error);
    }
});

bot.on('messageCreate', async (message) => {
    try {
        if (message.author.id !== AUTHORIZED_USER_ID) return;

        // Supprime les mentions au début du message
        const content = message.content.replace(/<@!?[0-9]+>/, '').trim().toLowerCase();

        if (content === 'start') {
            const channel = message.channel;
            sendDailyQuestion(channel).catch(handleError);
            await message.delete().catch(handleError);
        } else if (content.startsWith('settime')) {
            const [command, newTime] = content.split(' ');
            const newCronTime = `0 ${newTime} * * *`;

            const errorTime = new EmbedBuilder()
                    .setTitle("<:Erreur:1270711305992409098> Erreur :")
                    .setDescription("<:chrono:1270692023078486109> Veuillez fournir une __heure valide__ pour la planification *(0-23)*." +
                        "\n\n**Usage :** `SetTime {heure}`" +
                        "\n*ex : `SetTime 8`*")
                        .setFooter({ text: 'By Gabizoc', iconURL: "https://i.postimg.cc/1tFh2LpZ/Sans-titre.png" })
                    .setThumbnail("https://i.postimg.cc/Ls8zPt2y/Design-sans-titre-6.png")
                    .setAuthor({ name: "Leskro Bot", iconURL: "https://media.discordapp.net/attachments/1270358797566873600/1270463169336311941/0e396f4f93ecf9ca54fcb048fee23361.png?ex=66b3ca87&is=66b27907&hm=8c0c63d568edb748d14613442b8a6d6014bacc1e55763d4f3f43d4e74f56833d&=&format=webp&quality=lossless&width=437&height=437" })
                    .setColor('#009278')
                    .setTimestamp();
            
            if (!newTime || isNaN(newTime) || newTime < 0 || newTime > 23) {
                await message.author.send({ embeds: [errorTime] }).catch(handleError);
                await message.delete().catch(handleError);
                return;
            }

            const scheduleDoc = await Schedule.findOne();
            if (scheduleDoc) {
                scheduleDoc.time = newCronTime;
                await scheduleDoc.save();

                const successTime = new EmbedBuilder()
                    .setTitle("<:valide:1270736407056617503> Validé :")
                    .setDescription(`<:chrono:1270692023078486109> L'heure de la question quotidienne a bien été mise à jour à : **${newTime}h**`)
                    .setFooter({ text: 'By Gabizoc', iconURL: "https://i.postimg.cc/1tFh2LpZ/Sans-titre.png" })
                    .setThumbnail("https://i.postimg.cc/D03ZwdBp/Design-sans-titre-7.png")
                    .setAuthor({ name: "Leskro Bot", iconURL: "https://media.discordapp.net/attachments/1270358797566873600/1270463169336311941/0e396f4f93ecf9ca54fcb048fee23361.png?ex=66b3ca87&is=66b27907&hm=8c0c63d568edb748d14613442b8a6d6014bacc1e55763d4f3f43d4e74f56833d&=&format=webp&quality=lossless&width=437&height=437" })
                    .setColor('#009278')
                    .setTimestamp();

                await message.author.send({ embeds: [successTime] }).catch(handleError);
            }

            await message.delete().catch(handleError);
        } else if (content.startsWith('help')) {

            const embedHelp = new EmbedBuilder()
                    .setTitle("<:list:1270739235867197511> Menu d'aide :")
                    .setDescription(`<:Fleche:1270419451283509248> Voici toutes les commandes disponibles de <@1270100934982242437> :\n<:transparent:1270744779776593945>`)
                    .addFields(
                        { name: 'Start', value: 'Envoi une question "tu préfères ?"', inline: true },
                        { name: 'Help', value: 'Envoie le menu d\'aide"', inline: true },
                        { name: 'SetTime', value: 'Permet de définir l\'heure ||Ne marche pas', inline: true },
                        { name: '<:info:1270742625569214547> Note :', value: '***Toutes** les commandes doivent commencer par <@1270100934982242437>*', inline: false }
                    )
                    .setFooter({ text: 'By Gabizoc', iconURL: "https://i.postimg.cc/1tFh2LpZ/Sans-titre.png" })
                    .setThumbnail("https://i.postimg.cc/hvxD8XCT/0e396f4f93ecf9ca54fcb048fee23361-1.png")
                    .setAuthor({ name: "Leskro Bot", iconURL: "https://media.discordapp.net/attachments/1270358797566873600/1270463169336311941/0e396f4f93ecf9ca54fcb048fee23361.png?ex=66b3ca87&is=66b27907&hm=8c0c63d568edb748d14613442b8a6d6014bacc1e55763d4f3f43d4e74f56833d&=&format=webp&quality=lossless&width=437&height=437" })
                    .setColor('#009278')
                    .setTimestamp();

            await message.author.send({ embeds: [embedHelp] }).catch(handleError);
            await message.delete().catch(handleError);
        
        }
    } catch (error) {
        handleError(error);
    }
});


bot.login(DISCORD_TOKEN).catch(handleError);
