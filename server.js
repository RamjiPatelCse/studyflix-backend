const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const axios = require("axios");
const CryptoJS = require("crypto-js");

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json({
  limit: "100mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "100mb"
}));

// ======================================
// MONGODB
// ======================================

mongoose.connect(process.env.MONGODB_URI)

.then(() => {

  console.log("MongoDB Connected 😄");

})

.catch((err) => {

  console.log(err);

});

// ======================================
// SCHEMA
// ======================================

const VideoSchema = new mongoose.Schema({

  title: String,

  subject: String,

  type: String,

  chapter: String,

  url: String

});

const BatchSchema = new mongoose.Schema({

  title: String,

  thumbnail: String,

  videos: [VideoSchema]

});

const Batch = mongoose.model(
  "Batch",
  BatchSchema
);

// ======================================
// ENCRYPT
// ======================================

function encrypt(text){

  return CryptoJS.AES.encrypt(

    text,

    process.env.SECRET_KEY

  ).toString();

}

// ======================================
// DECRYPT
// ======================================

function decrypt(text){

  const bytes = CryptoJS.AES.decrypt(

    text,

    process.env.SECRET_KEY

  );

  return bytes.toString(
    CryptoJS.enc.Utf8
  );

}

// ======================================
// HOME
// ======================================

app.get("/", (req, res) => {

  res.send(
    "StudyFlix Backend Running 😄"
  );

});

// ======================================
// UPLOAD TXT
// ======================================

app.post("/api/upload", async(req, res) => {

  try {

    const {
      title,
      thumbnail,
      text
    } = req.body;

    if(!text){

      return res.status(400).json({

        error: "TXT content missing"

      });

    }

    const lines = text.split("\n");

    let currentSubject = "";

    let currentType = "";

    let currentChapter = "";

    const videos = [];

    // ==================================
    // LOOP
    // ==================================

    for(let raw of lines){

      const line = raw.trim();

      if(!line) continue;

      const matches =

        [...line.matchAll(/\((.*?)\)/g)];

      // ==================================
      // SUBJECT
      // ==================================

      if(matches.length >= 1){

        currentSubject =

          matches[0][1]

          .replace("🔴","")

          .replace("✅","")

          .trim();

      }

      // ==================================
      // TWO FOLDER SUPPORT
      // ==================================

      if(matches.length === 2){

        // DEFAULT TYPE
        currentType = "Default";

        // CHAPTER
        currentChapter =

          matches[1][1]

          .replace("🔴","")

          .replace("✅","")

          .trim();

      }

      // ==================================
      // THREE FOLDER SUPPORT
      // ==================================

      if(matches.length >= 3){

        // TYPE
        currentType =

          matches[1][1]

          .replace("🔴","")

          .replace("✅","")

          .trim();

        // CHAPTER
        currentChapter =

          matches[matches.length - 1][1]

          .replace("🔴","")

          .replace("✅","")

          .trim();

      }

      // ==================================
      // VIDEO URL
      // ==================================

      const urlMatch =

        line.match(/https:\/\/\S+/);

      if(urlMatch){

        const url = urlMatch[0];

        // SKIP PDF
        if(
          url.includes(".pdf")
        ){

          continue;

        }

        let lectureTitle =

          line.split(":")[0]
          .trim();

        if(
          lectureTitle.includes("https")
        ){

          lectureTitle = "Lecture";

        }

        videos.push({

          title: lectureTitle,

          subject: currentSubject,

          type: currentType,

          chapter: currentChapter,

          url: encrypt(url)

        });

      }

    }

    // ==================================
    // SAVE
    // ==================================

    const batch = await Batch.create({

      title,

      thumbnail,

      videos

    });

    res.json({

      success: true,

      totalVideos: videos.length,

      batch

    });

  }

  catch(err){

    console.log(err);

    res.status(500).json({

      error: err.message

    });

  }

});

// ======================================
// GET BATCHES
// ======================================

app.get("/api/batches", async(req, res) => {

  try {

    const batches =
      await Batch.find();

    res.json(batches);

  }

  catch(err){

    res.status(500).json({

      error: err.message

    });

  }

});

// ======================================
// DELETE BATCH
// ======================================

app.delete("/api/batch/:id", async(req, res) => {

  try {

    await Batch.findByIdAndDelete(
      req.params.id
    );

    res.json({

      success: true

    });

  }

  catch(err){

    res.status(500).json({

      error: err.message

    });

  }

});

// ======================================
// PLAY VIDEO
// ======================================

app.get("/api/play/:batchId/:videoId", async(req, res) => {

  try {

    const {
      batchId,
      videoId
    } = req.params;

    const batch =
      await Batch.findById(batchId);

    if(!batch){

      return res.status(404).json({

        error: "Batch not found"

      });

    }

    const video =
      batch.videos.id(videoId);

    if(!video){

      return res.status(404).json({

        error: "Video not found"

      });

    }

    const realUrl =
      decrypt(video.url);

    // ==================================
    // FETCH PLAYER
    // ==================================

    const response =
      await axios.get(realUrl);

    const token =
      response.data.video_player_token;

    const player =
      response.data.video_player_url;

    if(
      !token ||
      !player
    ){

      return res.status(400).json({

        error: "Player token missing"

      });

    }

    const finalUrl =
      player + token;

    res.json({

      success: true,

      url: finalUrl

    });

  }

  catch(err){

    console.log(err);

    res.status(500).json({

      error: err.message

    });

  }

});

// ======================================
// PORT
// ======================================

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(

    `Server Running On Port ${PORT}`

  );

});
