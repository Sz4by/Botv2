// Betöltjük a titkos adatokat a .env fájlból
require('dotenv').config();

const { Client, GatewayIntentBits, EmbedBuilder, ActivityType } = require('discord.js');

// ==========================================
// ADATOK BETÖLTÉSE A .ENV FÁJLBÓL
// ==========================================

const TOKEN = process.env.DISCORD_TOKEN;
const TARGET_USER_ID = process.env.USER_ID;

// Biztonsági ellenőrzés: Szólunk, ha üres a .env fájl
if (!TOKEN || !TARGET_USER_ID) {
    console.error("❌ HIBA: Nem találom a Token-t vagy az ID-t!");
    console.error("Kérlek ellenőrizd, hogy létrehoztad-e a .env fájlt és kitöltötted-e az adatokkal.");
    process.exit(1); // Leállítjuk a programot
}

// ==========================================
// BOT KONFIGURÁCIÓ
// ==========================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences, // Státusz látásához kell
        GatewayIntentBits.GuildMembers,   // Tagok kereséséhez kell
        GatewayIntentBits.MessageContent, // Üzenet olvasáshoz kell
        GatewayIntentBits.GuildMessages
    ]
});

client.once('ready', () => {
    console.log(`✅ A bot sikeresen bejelentkezett: ${client.user.tag}`);
    console.log(`🔒 Biztonságos mód aktív (.env fájl használata)`);
    console.log(`👀 Figyelt felhasználó ID: ${TARGET_USER_ID}`);
});

client.on('messageCreate', async (message) => {
    // Csak a !status parancsra figyel
    if (message.content !== '!status') return;

    const guild = message.guild;
    if (!guild) return;

    try {
        // Lekérjük a .env-ben megadott felhasználót
        const member = await guild.members.fetch({ user: TARGET_USER_ID, force: true });
        const presence = member.presence;

        if (!presence) {
            return message.reply('A felhasználó jelenleg Offline, vagy a botnak nincs joga látni a státuszt. 😴');
        }

        // Színek beállítása
        const statusColors = {
            online: '#3ba55c',
            idle: '#faa61a',
            dnd: '#ed4245',
            offline: '#747f8d'
        };
        
        const statusNames = {
            online: 'Elérhető',
            idle: 'Tétlen',
            dnd: 'Ne zavarjanak',
            offline: 'Offline'
        };

        // Leírás összeállítása
        let description = `**Jelenlegi státusz:** ${statusNames[presence.status] || presence.status}\n\n`;
        
        // 1. Custom Status
        const custom = presence.activities.find(a => a.type === ActivityType.Custom);
        if (custom) {
            const emoji = custom.emoji ? (custom.emoji.id ? `<:${custom.emoji.name}:${custom.emoji.id}>` : custom.emoji.name) : '💬';
            description += `**Üzenet:** ${emoji} ${custom.state || ''}\n`;
        }

        // 2. Spotify
        const spotify = presence.activities.find(a => a.name === 'Spotify');
        if (spotify) {
            description += `\n<:spotify:1136683096725794877> **Zene:** ${spotify.details}\n`;
            description += `👤 **Előadó:** ${spotify.state}\n`;
            description += `💿 **Album:** ${spotify.assets.largeText}\n`;
        }

        // 3. Játék (ami nem Custom és nem Spotify)
        const game = presence.activities.find(a => a.type === ActivityType.Playing);
        if (game) {
            description += `\n🎮 **Játék:** ${game.name}\n`;
            if (game.details) description += `📝 ${game.details}\n`;
            if (game.state) description += `📍 ${game.state}\n`;
        }

        // 4. VS Code (Programozás)
        const vscode = presence.activities.find(a => a.name === 'Visual Studio Code');
        if (vscode) {
            description += `\n💻 **Programozás:** VS Code\n`;
            if (vscode.details) description += `📂 ${vscode.details}\n`;
            if (vscode.state) description += `📄 ${vscode.state}\n`;
        }

        // Embed kártya
        const embed = new EmbedBuilder()
            .setAuthor({ name: member.user.username, iconURL: member.user.displayAvatarURL() })
            .setTitle('🎄 Karácsonyi Profil Státusz')
            .setDescription(description)
            .setColor(statusColors[presence.status] || '#000000')
            .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 512 }))
            .setFooter({ text: 'Secure Bot • Powered by .env' })
            .setTimestamp();

        await message.channel.send({ embeds: [embed] });

    } catch (error) {
        console.error(error);
        message.reply('Hiba történt. Ellenőrizd a konzolt a részletekért!');
    }
});

// Bejelentkezés a token használatával
client.login(TOKEN);