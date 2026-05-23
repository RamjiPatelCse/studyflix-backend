const express = require("express");
const cors = require("cors");
const fs = require("fs");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json({ limit: "50mb" }));

const DATA_FILE = "./data.json";

function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]");
  }

  return JSON.parse(fs.readFileSync(DATA_FILE));
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get("/", (req, res) => {
  res.send("StudyFlix Backend Running 😄🔥");
});



// ================= PLAYER FETCH =================

app.get("/jay/*", async (req, res) => {

  try {

    const fullUrl = decodeURIComponent(
      req.params[0]
    );

    // thin wala id nikalna 😎
    const videoId = fullUrl
      .split("/play/")[1]
      ?.split("/main.m3u8")[0];

    if (!videoId) {

      return res.json({
        success: false,
        message: "Invalid URL 😅"
      });

    }

    // thin backend fetch 😎🔥
    const apiUrl =
      `https://thin-wynnie-appx-d3d205f7.koyeb.app/play/${videoId}`;

    const response = await axios.get(apiUrl);

    const data = response.data;

    const token =
      data.video_player_token;

    if (!token) {

      return res.json({
        success: false,
        message: "Token Not Found 😅"
      });

    }

    // FINAL PLAYER URL 😎🔥
    const finalPlayerUrl =
      `https://player.appx.co.in/secure-player?isMobile=true&token=${token}`;

    // direct redirect 😎🔥
    return res.redirect(finalPlayerUrl);

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error 😅"
    });

  }

});



// ================= CREATE BATCH =================

app.post("/create-batch", async (req, res) => {

  try {

    const { title, thumbnail, lectures } = req.body;

    const data = readData();

    const batch = {
      id: Date.now(),
      title,
      thumbnail,
      lectures
    };

    data.push(batch);

    saveData(data);

    res.json({
      success: true,
      message: "Batch Created 😄🔥"
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      success: false,
      message: "Server Error 😅"
    });

  }

});



// ================= GET BATCHES =================

app.get("/batches", (req, res) => {

  const data = readData();

  res.json(data);

});



// ================= GET SINGLE BATCH =================

app.get("/batch/:id", (req, res) => {

  const data = readData();

  const batch = data.find(
    item => item.id == req.params.id
  );

  res.json(batch);

});



// ================= DELETE =================

app.delete("/delete-batch/:id", (req, res) => {

  const data = readData();

  const newData = data.filter(
    item => item.id != req.params.id
  );

  saveData(newData);

  res.json({
    success: true
  });

});



const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log("Server Running 😄🔥");
});
