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

mongoose.connect(process.env.MONGODB_URI)
.then(() => {

  console.log("MongoDB Connected 😄");

})
.catch((err) => {

  console.log(err);

});

const VideoSchema = new mongoose.Schema({

  title: String,

  folders: [String],

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

function encrypt(text){

  return CryptoJS.AES.encrypt(
    text,
    process.env.SECRET_KEY
  ).toString();

}

function decrypt(text){

  const bytes = CryptoJS.AES.decrypt(
    text,
    process.env.SECRET_KEY
  );

  return bytes.toString(
    CryptoJS.enc.Utf8
  );

}

app.get("/", (req, res) => {

  res.send(
    "StudyFlix Backend Running 😄"
  );

});

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

    const videos = [];

    let folders = [];

    for(let raw of lines){

      const line = raw.trim();

      if(!line) continue;

      const bracketMatches =
        [...line.matchAll(/\((.*?)\)/g)];

      if(
        bracketMatches.length > 0 &&
        !line.includes("https://")
      ){

        folders =
          bracketMatches.map(
            (m)=>

              m[1]
              .replace("🔴","")
              .replace("✅","")
              .trim()

          );

        continue;

      }

      const urlMatch =
        line.match(/https:\/\/\S+/);

      if(urlMatch){

        const url = urlMatch[0];

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

          lectureTitle =
            "Lecture";

        }

        videos.push({

          title: lectureTitle,

          folders,

          url: encrypt(url)

        });

      }

    }

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

const PORT =
  process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `Server Running On Port ${PORT}`
  );

});
