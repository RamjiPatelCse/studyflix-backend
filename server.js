const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();

app.use(cors());
app.use(express.json());

const PORT = 5000;

let database = {};

app.post("/api/upload", async (req, res) => {

  try {

    const { text } = req.body;

    const lines =
    text.split("\n");

    let folders = {};

    for (let line of lines) {

      if (!line.includes("http"))
      continue;

      const parts =
      line.split(": https");

      const title =
      parts[0]?.trim();

      const url =
      "https" +
      parts[1];

      const matches =
      [...title.matchAll(/\((.*?)\)/g)];

      const folder1 =
      matches[0]?.[1] ||
      "Others";

      const folder2 =
      matches[1]?.[1] ||
      "Videos";

      const folder3 =
      matches[2]?.[1] ||
      "Lectures";

      const cleanTitle =
      title
      .replace(/\(.*?\)/g, "")
      .replace(/:/g, "")
      .trim();

      if (!folders[folder1]) {

        folders[folder1] = {};

      }

      if (
        !folders[folder1][folder2]
      ) {

        folders[folder1][folder2] = {};

      }

      if (
        !folders[folder1][folder2][folder3]
      ) {

        folders[folder1][folder2][folder3] = [];

      }

      folders[
        folder1
      ][
        folder2
      ][
        folder3
      ].push({

        id:
        Date.now() +
        Math.random(),

        title:
        cleanTitle,

        url,

        thumbnail:
        "https://i.imgur.com/8Km9tLL.jpeg"

      });

    }

    database = folders;

    res.json({

      success: true,
      data: database

    });

  } catch (err) {

    res.json({

      success: false

    });

  }

});

app.get("/api/data",
(req, res) => {

  res.json(database);

});

app.post("/api/watch",
(req, res) => {

  const { id } =
  req.body;

  let found = null;

  Object.values(database)
  .forEach(level1 => {

    Object.values(level1)
    .forEach(level2 => {

      Object.values(level2)
      .forEach(lectures => {

        lectures.forEach(item => {

          if (
            String(item.id) ===
            String(id)
          ) {

            found = item;

          }

        });

      });

    });

  });

  if (!found) {

    return res.json({

      success:false

    });

  }

  res.json({

    success:true,

    player:
    found.url

  });

});

app.listen(PORT, () => {

  console.log(
    "Server Running 😄"
  );

});
