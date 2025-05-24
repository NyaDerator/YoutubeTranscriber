const express = require("express");
const path = require("path");
const { YoutubeTranscript } = require("youtube-transcript");
const he = require("he");

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.get("/", (req, res) => {
  res.render("index", { error: null });
});

app.post("/transcript", async (req, res) => {
  const videoUrl = req.body.url;

  const videoIdMatch = videoUrl.match(
    /(?:youtube\.com\/.*[?&]v=|youtu\.be\/|youtube\.com\/(?:embed|shorts)\/)([a-zA-Z0-9_-]{11})/
  );

  if (!videoIdMatch || !videoIdMatch[1]) {
    return res.render("index", { error: "Invalid YouTube URL." });
  }

  const videoId = videoIdMatch[1];

  try {
    let transcript = await YoutubeTranscript.fetchTranscript(videoId);

    transcript = transcript
      .map((part) => ({
        ...part,
        text: he.decode(part.text).replace(/^\s+/, ""),
      }))
      .filter((part) => part.text.length > 0);

    const joinedText = transcript.map((part) => part.text).join("\n");

    res.render("transcript", { joinedText, videoId });
  } catch (err) {
    console.error(err);
    res.render("index", { error: "Could not fetch transcript." });
  }
});

app.listen(PORT, () => {
  console.log(`App listening on port ${PORT}`);
});
