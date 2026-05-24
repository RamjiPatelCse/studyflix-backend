const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const axios = require("axios");
const CryptoJS = require("crypto-js");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
.then(()=>{
  console.log("MongoDB Connected");
})
.catch((err)=>{
  console.log(err);
});

const BatchSchema = new mongoose.Schema({
  title:String,
  thumbnail:String,
  videos:Array
});

const Batch = mongoose.model("Batch", BatchSchema);

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

  return bytes.toString(CryptoJS.enc.Utf8);
}

app.get("/",(req,res)=>{
  res.send("StudyFlix Backend Running");
});

app.post("/api/upload", async(req,res)=>{

  try{

    const {
      title,
      thumbnail,
      text
    } = req.body;

    const lines = text.split("\\n");

    let subject = "";
    let type = "";
    let chapter = "";

    const videos = [];

    for(let line of lines){

      if(line.startsWith("(")){

        const value =
          line.replace(/[()]/g,"").trim();

        if(!subject){
          subject = value;
        }
        else if(!type){
          type = value;
        }
        else{
          chapter = value;
        }

      }

      if(line.includes("https://")){

        if(line.includes(".pdf")) continue;

        videos.push({
          title:"Lecture",
          subject,
          type,
          chapter,
          url: encrypt(line.trim())
        });

      }

    }

    const batch = await Batch.create({
      title,
      thumbnail,
      videos
    });

    res.json(batch);

  }
  catch(err){

    res.status(500).json({
      error:err.message
    });

  }

});

app.get("/api/batches", async(req,res)=>{

  const batches = await Batch.find();

  res.json(batches);

});

app.delete("/api/batch/:id", async(req,res)=>{

  await Batch.findByIdAndDelete(req.params.id);

  res.json({
    success:true
  });

});

app.get("/api/play/:id", async(req,res)=>{

  try{

    const batch = await Batch.findOne();

    const video = batch.videos[0];

    const realUrl = decrypt(video.url);

    const response = await axios.get(realUrl);

    const token =
      response.data.video_player_token;

    const player =
      response.data.video_player_url;

    const finalUrl = player + token;

    res.json({
      url: finalUrl
    });

  }
  catch(err){

    res.status(500).json({
      error:err.message
    });

  }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT,()=>{
  console.log("Server Running");
});
