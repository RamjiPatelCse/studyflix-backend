const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("StudyFlix Backend Running 🚀");
});

app.get("/api/get-video", async (req, res) => {

  try {

    const url = req.query.url;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "URL required"
      });
    }

    // TXT link open
    const response = await axios.get(url);

    const data = response.data;

    // Player URL
    const playerUrl = data.video_player_url;

    // Dynamic token
    const token = data.video_player_token;

    // Final URL
    const finalPlayer = `${playerUrl}${token}`;

    res.json({
      success: true,
      player: finalPlayer,
      token: token
    });

  } catch (error) {

    res.status(500).json({
      success: false,
      error: error.message
    });

  }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
