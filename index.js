require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const app = express();
const port = process.env.PORT || 3000;

// Engedélyezzük a weboldalnak a kommunikációt
app.use(cors());

const TOKEN = process.env.DISCORD_TOKEN;
const TARGET_USER_ID = process.env.USER_ID;

if (!TOKEN || !TARGET_USER_ID) {
    console.error("HIBA: Nincs DISCORD_TOKEN vagy USER_ID beállítva!");
    process.exit(1);
}

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildPresences,
        GatewayIntentBits.GuildMembers
    ]
});

// ==================================================================
// EZ AZ API, AMIT A WEBOLDALAD HÍV MEG
// Ugyanazokat az adatokat adja vissza, mint a Lanyard
// ==================================================================
app.get('/api/status', async (req, res) => {
    try {
        // Megkeressük a közös szervert
        const guild = client.guilds.cache.find(g => g.members.cache.has(TARGET_USER_ID));
        
        if (!guild) {
            return res.json({ success: false, error: "Nem talállak egy szerveren sem." });
        }

        const member = await guild.members.fetch({ user: TARGET_USER_ID, force: true });
        const presence = member.presence;

        if (!presence) {
            return res.json({
                success: true,
                status: 'offline',
                username: member.user.username,
                avatar: member.user.displayAvatarURL(),
                activities: []
            });
        }

        // Visszaküldjük az adatokat a weboldalnak
        res.json({
            success: true,
            username: member.user.username,
            avatar: member.user.displayAvatarURL(),
            status: presence.status,
            activities: presence.activities,
            spotify: presence.activities.find(a => a.name === 'Spotify')
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, error: "Hiba történt." });
    }
});

// Keep-Alive
app.get('/', (req, res) => res.send('🟢 A Bot API fut!'));

app.listen(port, () => console.log(`🌐 API fut a ${port} porton.`));
if(TOKEN) client.login(TOKEN);


