require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const app = express();
const port = process.env.PORT || 3000;

// KÖTELEZŐ: Engedélyezzük, hogy a weboldalad elérje a botot
app.use(cors());

const TOKEN = process.env.DISCORD_TOKEN;
const TARGET_USER_ID = process.env.USER_ID;

// Ellenőrzés
if (!TOKEN || !TARGET_USER_ID) {
    console.error("❌ HIBA: Nincs beállítva a TOKEN vagy a USER_ID a .env fájlban (vagy Render Environment-ben)!");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ]
});

// ==========================================
// A SAJÁT API VÉGPONTOD
// ==========================================
app.get('/api/status', async (req, res) => {
    try {
        // 1. Megkeressük azt a szervert, ahol a bot és te is ott vagytok
        // (A legegyszerűbb, ha a bot a saját szervereden van)
        const guild = client.guilds.cache.find(g => g.members.cache.has(TARGET_USER_ID));
        
        if (!guild) {
            return res.json({ 
                success: false, 
                error: "A bot nem talál téged egyik közös szerveren sem. Győződj meg róla, hogy egy szerveren vagytok!" 
            });
        }

        // 2. Lekérjük a friss adatokat rólad
        const member = await guild.members.fetch({ user: TARGET_USER_ID, force: true });
        const presence = member.presence;

        // 3. Ha offline vagy (nincs presence adat)
        if (!presence) {
            return res.json({
                success: true,
                status: 'offline',
                username: member.user.username,
                avatar: member.user.displayAvatarURL(),
                activities: []
            });
        }

        // 4. Ha online vagy, visszaadjuk az adatokat JSON-ben
        res.json({
            success: true,
            username: member.user.username,
            avatar: member.user.displayAvatarURL(),
            status: presence.status, // online, idle, dnd
            activities: presence.activities, // Játékok, Spotify lista
            // Külön kigyűjtjük a Spotify-t a könnyebb kezelésért
            spotify: presence.activities.find(a => a.name === 'Spotify')
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Szerver hiba történt az adatok lekérésekor." });
    }
});

// Keep-Alive üzenet a főoldalra
app.get('/', (req, res) => {
    res.send('🟢 A Saját API Botod fut! Használd a /api/status végpontot az adatokért.');
});

app.listen(port, () => {
    console.log(`🌐 API szerver fut a ${port}-es porton.`);
});

client.once('ready', () => {
    console.log(`✅ Bot bejelentkezve: ${client.user.tag}`);
    console.log(`👀 Ezt az ID-t figyelem: ${TARGET_USER_ID}`);
});

client.login(TOKEN);


