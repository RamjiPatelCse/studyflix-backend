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

mongoose.connect(process.env.MONGODB_URI)
.then(() => {
  console.log("MongoDB Connected");
})
.catch((err) => {
  console.log(err);
});

const BatchSchema = new mongoose.Schema({

  title: String,

  thumbnail: String,

  videos: Array

});

const Batch =
mongoose.model("Batch", BatchSchema);

app.get("/", (req,res)=>{

  res.send("Server Running");

});


// ============================
// UPLOAD TXT
// ============================

app.post("/api/upload", async(req,res)=>{

  try{

    const {
      title,
      thumbnail,
      content
    } = req.body;

    if(!content){

      return res.status(400).json({
        error: "TXT content missing"
      });

    }

    const lines =
      content.split("\n");

    let videos = [];

    lines.forEach((line)=>{

      if(
        !line.includes("https")
      ) return;

      const brackets =
        line.match(/\((.*?)\)/g) || [];

      const cleanBrackets =
        brackets.map((b)=>
          b.replace(/[()]/g,"").trim()
        );

      const urlMatch =
        line.match(/https:\/\/[^\s]+/g);

      if(!urlMatch) return;

      const url =
        urlMatch[0];

      const lectureTitle =
        line.split(":")[0].trim();

      let subject = "";
      let type = "";
      let chapter = "";

      // ====================
      // 4 LEVEL
      // ====================

      if(cleanBrackets.length >= 3){

        subject =
          cleanBrackets[0];

        type =
          cleanBrackets[1];

        chapter =
          cleanBrackets[2];

      }

      // ====================
      // 3 LEVEL
      // ====================

      else if(
        cleanBrackets.length === 2
      ){

        subject =
          cleanBrackets[0];

        chapter =
          cleanBrackets[1];

        type =
          "Lectures";

      }

      // ====================
      // 2 LEVEL
      // ====================

      else if(
        cleanBrackets.length === 1
      ){

        subject =
          cleanBrackets[0];

        type =
          "Lectures";

        chapter =
          "Videos";

      }

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

    const batch =
      new Batch({

        title,

        thumbnail,

        videos

      });

    await batch.save();

    res.json({

      success: true,

      message:
        "Upload Successful"

    });

  }

  catch(err){

    console.log(err);

    res.status(500).json({

      error: err.message

    });

  }

});


// ============================
// GET BATCHES
// ============================

app.get("/api/batches",
async(req,res)=>{

  try{

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


// ============================
// DELETE BATCH
// ============================

app.delete("/api/delete/:id",
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
      error: err.message
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
        error: "Batch not found"
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
        error: "Video not found"
      });

    }

    const apiUrl =
      video.url;

    const response =
      await axios.get(apiUrl);

    const data =
      response.data;

    const token =
      data.video_player_token;

    const player =
      data.video_player_url;

    const finalUrl =
      `${player}${token}`;

    res.json({

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


// ============================
// PORT
// ============================

const PORT =
process.env.PORT || 5000;

app.listen(PORT, ()=>{

  console.log(
    `Server Running`
  );

});
