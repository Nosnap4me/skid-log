// server.js

const express = require('express');
const { createCanvas, loadImage } = require('canvas');
const fetch = require('node-fetch');  // node-fetch v2 supports require()

const FormData = require('form-data');

const app = express();
app.use(express.json());

const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1400508227099037767/TUgL-ZtWCMKZX98uKrYP4D-FmYRRh1qQLnsRXiiO1M8_9X3shrTG40eyc6tEQzzfF_on";

app.post('/api/generate', async (req, res) => {
  try {
    const { donatorUsername, donatorImage, raiserUsername, raiserImage, amount } = req.body;

    // Create canvas
    const width = 750;
    const height = 200;
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');

    // Background
    ctx.fillStyle = '#222';
    ctx.fillRect(0, 0, width, height);

    // Load images
    const donatorImg = await loadImage(donatorImage);
    const raiserImg = await loadImage(raiserImage);

    // Draw avatars as circles
    function drawCircularImage(img, x, y, r) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, x - r, y - r, r * 2, r * 2);
      ctx.restore();
      ctx.strokeStyle = 'white';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    drawCircularImage(donatorImg, 150, 100, 55);
    drawCircularImage(raiserImg, 600, 100, 55);

    // Text
    ctx.fillStyle = 'white';
    ctx.font = '30px Montserrat';
    ctx.textAlign = 'center';
    ctx.fillText(`@${donatorUsername} donated`, 375, 50);
    ctx.fillText(`@${raiserUsername}`, 375, 150);
    ctx.fillText(`💰 ${Number(amount).toLocaleString()}`, 375, 120);

    // Export image buffer
    const buffer = canvas.toBuffer('image/png');

    // Prepare form data for Discord webhook
    const formData = new FormData();
    formData.append('file', buffer, 'donation.png');

    const payload = {
      content: `${donatorUsername} donated **${Number(amount).toLocaleString()}** Robux to ${raiserUsername}`,
      embeds: [
        {
          color: 0xff0000,
          image: { url: 'attachment://donation.png' },
          footer: { text: 'Donation Image' },
          timestamp: new Date().toISOString()
        }
      ]
    };

    formData.append('payload_json', JSON.stringify(payload));

    // Send to Discord webhook
    const response = await fetch(DISCORD_WEBHOOK_URL, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error(`Discord webhook error: ${response.statusText}`);
    }

    res.status(200).json({ success: true, message: 'Donation image sent!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Backend API running on port ${PORT}`);
});
