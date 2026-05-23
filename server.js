const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());

app.use(express.json({
  limit: "50mb"
}));

app.use(express.urlencoded({
  extended: true,
  limit: "50mb"
}));

// TEST
app.get("/", (req, res) => {

  res.send("StudyFlix Backend Running 😄");

});

// UPLOAD API
app.post("/api/upload", async (req, res) => {

  try {

    const {
      batchName,
      thumbnail,
      text,
      price
    } = req.body;

    if (!batchName || !text) {

      return res.status(400).json({
        success: false,
        message: "Missing Data"
      });

    }

    const lines =
      text
      .split("\n")
      .filter(x => x.trim());

    const lectures = [];

    lines.forEach((line, index) => {

      const parts = line.split(": ");

      if (parts.length >= 2) {

        lectures.push({

          id: Date.now() + index,

          title: parts[0],

          videoUrl: parts.slice(1).join(": "),

          thumbnail

        });

      }

    });

    return res.json({

      success: true,

      batch: {

        id: Date.now(),

        title: batchName,

        thumbnail,

        price,

        lectures

      }

    });

  } catch (err) {

    console.log(err);

    return res.status(500).json({

      success: false,
      message: "Server Error 😄"

    });

  }

});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log("Server Running 😄");

});
