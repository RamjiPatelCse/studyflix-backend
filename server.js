require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const multer = require("multer");

const app = express();

app.use(cors());
app.use(express.json());



// MEMORY STORAGE

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage
});



// TEMP BATCH STORAGE

let batches = [];



// HOME

app.get("/", (req, res) => {

  res.send("StudyFlix Backend Running 🚀");

});



// LOGIN API

app.post("/api/login", (req, res) => {

  const { username, password } = req.body;

  if (
    username === process.env.ADMIN_USER &&
    password === process.env.ADMIN_PASS
  ) {

    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d"
      }
    );

    return res.json({
      success: true,
      token
    });

  }

  res.status(401).json({
    success: false,
    error: "Invalid Credentials"
  });

});



// CREATE BATCH

app.post(
  "/api/create-batch",
  upload.single("txt"),
  (req, res) => {

    try {

      const { batchName, thumbnail } = req.body;

      const txtData = req.file.buffer.toString();

      const lines = txtData
        .split("\n")
        .filter(line => line.trim() !== "");

      const lectures = [];

      for (let i = 0; i < lines.length; i += 2) {

        const title = lines[i];

        const url = lines[i + 1];

        if (title && url) {

          lectures.push({
            title,
            url
          });

        }

      }

      const batch = {
        id: Date.now(),
        batchName,
        thumbnail,
        lectures
      };

      batches.push(batch);

      res.json({
        success: true,
        batch
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      });

    }

  }
);



// GET ALL BATCHES

app.get("/api/batches", (req, res) => {

  res.json({
    success: true,
    batches
  });

});



// UPDATE BATCH

app.post(
  "/api/update-batch/:id",
  upload.single("txt"),
  (req, res) => {

    try {

      const id = Number(req.params.id);

      const batch = batches.find(
        b => b.id === id
      );

      if (!batch) {

        return res.status(404).json({
          success: false,
          error: "Batch not found"
        });

      }

      const txtData = req.file.buffer.toString();

      const lines = txtData
        .split("\n")
        .filter(line => line.trim() !== "");

      for (let i = 0; i < lines.length; i += 2) {

        const title = lines[i];

        const url = lines[i + 1];

        const exists = batch.lectures.find(
          l => l.title === title
        );

        if (!exists) {

          batch.lectures.push({
            title,
            url
          });

        }

      }

      res.json({
        success: true,
        batch
      });

    } catch (error) {

      res.status(500).json({
        success: false,
        error: error.message
      });

    }

  }
);



// VIDEO TOKEN API

app.get("/api/get-video", async (req, res) => {

  try {

    const url = req.query.url;

    if (!url) {

      return res.status(400).json({
        success: false,
        error: "URL required"
      });

    }

    const response = await axios.get(url);

    const data = response.data;

    const playerUrl = data.video_player_url;

    const token = data.video_player_token;

    const finalPlayer = `${playerUrl}${token}`;

    res.json({
      success: true,
      player: finalPlayer,
      token
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
