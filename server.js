const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();

const app = express();

app.use(cors());

app.use(express.json({
  limit: "50mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "50mb"
}));


// ============================
// MONGODB
// ============================

mongoose.connect(
  process.env.MONGODB_URI
)
.then(()=>{

  console.log(
    "MongoDB Connected"
  );

})
.catch((err)=>{

  console.log(err);

});


// ============================
// SCHEMA
// ============================

const BatchSchema =
new mongoose.Schema({

  title: String,

  thumbnail: String,

  videos: Array

});

const Batch =
mongoose.model(
  "Batch",
  BatchSchema
);


// ============================
// HOME
// ============================

app.get("/",(req,res)=>{

  res.send(
    "Server Running"
  );

});


// ============================
// UPLOAD
// ============================

app.post(
"/api/upload",
async(req,res)=>{

  try{

    const {
      title,
      thumbnail,
      content
    } = req.body;

    if(!content){

      return res.status(400).json({

        error:
        "TXT content missing"

      });

    }

    const lines =
      content.split("\n");

    let videos = [];

    lines.forEach((line)=>{

      if(
        !line.includes("https")
      ) return;

      // BRACKETS
      const brackets =
        line.match(/\((.*?)\)/g) || [];

      const clean =
        brackets.map((b)=>

          b.replace(/[()]/g,"").trim()

        );

      // URL
      const urlMatch =
        line.match(
          /https:\/\/[^\s]+/g
        );

      if(!urlMatch) return;

      const url =
        urlMatch[0];

      // TITLE
      const lectureTitle =
        line
        .split(":")[0]
        .trim();

      let subject = "";
      let type = "";
      let chapter = "";

      // ========================
      // AUTO DETECT
      // ========================

      if(clean.length >= 3){

        subject =
          clean[0];

        type =
          clean[1];

        chapter =
          clean[2];

      }

      else if(clean.length === 2){

        subject =
          clean[0];

        type =
          clean[1];

        chapter =
          "Videos";

      }

      else if(clean.length === 1){

        subject =
          clean[0];

        type =
          "Lectures";

        chapter =
          "Videos";

      }

      // PUSH
      videos.push({

        title:
          lectureTitle,

        subject,

        type,

        chapter,

        url,

        thumbnail:
        "https://i.imgur.com/8Km9tLL.png"

      });

    });

    // SAVE
    const batch =
      new Batch({

        title,

        thumbnail,

        videos

      });

    await batch.save();

    res.json({

      success: true,

      total:
        videos.length

    });

  }

  catch(err){

    console.log(err);

    res.status(500).json({

      error:
        err.message

    });

  }

});


// ============================
// GET BATCHES
// ============================

app.get(
"/api/batches",
async(req,res)=>{

  try{

    const batches =
      await Batch.find();

    res.json(batches);

  }

  catch(err){

    res.status(500).json({

      error:
        err.message

    });

  }

});


// ============================
// DELETE BATCH
// ============================

app.delete(
"/api/delete/:id",
async(req,res)=>{

  try{

    await Batch.findByIdAndDelete(
      req.params.id
    );

    res.json({

      success: true

    });

  }

  catch(err){

    res.status(500).json({

      error:
        err.message

    });

  }

});


// ============================
// PLAY VIDEO
// ============================

app.get(
"/api/play/:batch/:video",
async(req,res)=>{

  try{

    const batch =
      await Batch.findById(
        req.params.batch
      );

    if(!batch){

      return res.status(404).json({

        error:
        "Batch not found"

      });

    }

    const video =
      batch.videos.find(

        (v)=>

          v._id.toString() ===
          req.params.video

      );

    if(!video){

      return res.status(404).json({

        error:
        "Video not found"

      });

    }

    // FETCH PLAYER API
    const response =
      await axios({

        method: "GET",

        url: video.url,

        headers: {

          "User-Agent":
          "Mozilla/5.0"

        }

      });

    const data =
      response.data;

    const token =
      data.video_player_token;

    const player =
      data.video_player_url;

    if(!token || !player){

      return res.status(500).json({

        error:
        "Player URL Missing"

      });

    }

    // FINAL URL
    const finalUrl =
      `${player}${token}`;

    res.json({

      url: finalUrl

    });

  }

  catch(err){

    console.log(err);

    res.status(500).json({

      error:
      "Video API Failed"

    });

  }

});


// ============================
// PORT
// ============================

const PORT =
process.env.PORT || 5000;

app.listen(PORT,()=>{

  console.log(
    "Server Running"
  );

});
