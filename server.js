require("dotenv").config();

const express = require("express");
const cors = require("cors");
const axios = require("axios");
const multer = require("multer");

const app = express();

app.use(cors());

app.use(express.json());

const storage =
multer.memoryStorage();

const upload =
multer({ storage });

let batches = [];



app.get("/", (req, res) => {

  res.send(
    "StudyFlix Backend Running 🚀"
  );

});



app.post(

  "/api/create-batch",

  upload.single("txt"),

  async (req, res) => {

    try {

      const {
        batchName,
        thumbnail
      } = req.body;

      const text =
      req.file.buffer.toString();

      const lines =
      text.split("\n");

      const folders = {};

      lines.forEach((line) => {

        if (
          line.includes("http")
        ) {

          if (
            line.includes(".pdf")
          ) return;

          const parts =
          line.split(":");

          const title =
          parts[0]?.trim();

          const url =
          parts.slice(1).join(":").trim();

          const matches =
          [...title.matchAll(/\((.*?)\)/g)];

          const subject =
          matches[0]?.[1] || "Others";

          const chapter =
          matches[2]?.[1] || "Videos";

          if (!folders[subject]) {

            folders[subject] = {};

          }

          if (
            !folders[subject][chapter]
          ) {

            folders[subject][chapter] = [];

          }

          folders[subject][chapter]
          .push({

            id:
            Date.now() +
            Math.random(),

            title,

            url,

            thumbnail:
            "https://i.imgur.com/8Km9tLL.jpeg"

          });

        }

      });

      const batch = {

        id: Date.now(),

        batchName,

        thumbnail,

        folders

      };

      batches.push(batch);

      res.json({

        success:true,

        batch

      });

    } catch (error) {

      res.json({

        success:false,

        error:error.message

      });

    }

  }
);



app.get(
  "/api/batches",

  (req, res) => {

    res.json({

      success:true,

      batches

    });

  }
);



app.delete(

  "/api/delete-batch/:id",

  (req, res) => {

    const id =
    Number(req.params.id);

    batches =
    batches.filter(

      (batch) =>
      batch.id !== id

    );

    res.json({

      success:true

    });

  }
);



app.post(

  "/api/watch",

  async (req, res) => {

    try {

      const { id } = req.body;

      let realUrl = "";

      batches.forEach((batch) => {

        Object.keys(
          batch.folders
        ).forEach((subject) => {

          Object.keys(
            batch.folders[subject]
          ).forEach((chapter) => {

            batch
            .folders[subject][chapter]
            .forEach((lecture) => {

              if (
                lecture.id == id
              ) {

                realUrl =
                lecture.url;

              }

            });

          });

        });

      });

      if (!realUrl) {

        return res.json({

          success:false

        });

      }

      const response =
      await axios.get(realUrl);

      const data =
      response.data;

      const player =
      `${data.video_player_url}${data.video_player_token}`;

      res.json({

        success:true,

        player

      });

    } catch (error) {

      res.json({

        success:false

      });

    }

  }
);



const PORT =
process.env.PORT || 5000;

app.listen(PORT, () => {

  console.log(
    `Server running on ${PORT}`
  );

});
