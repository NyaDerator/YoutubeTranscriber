const fs = require("fs");
const { YoutubeTranscript } = require("youtube-transcript");

const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

readline.question("video_id: ", async (videoId) => {
  console.log(videoId);
  try {
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    fs.writeFileSync(
      "transcript.json",
      JSON.stringify(transcript, null, 2),
      "utf-8"
    );

    const txt = transcript.map((part) => part.text).join(" ");
    fs.writeFileSync("transcript.txt", txt, "utf-8");

    const srt = transcript
      .map((part, index) => {
        const start = formatTime(part.offset / 1000);
        const end = formatTime((part.offset + part.duration) / 1000);
        return `${index + 1}\n${start} --> ${end}\n${part.text}\n`;
      })
      .join("\n");
    fs.writeFileSync("transcript.srt", srt, "utf-8");

    const vtt =
      "WEBVTT\n\n" +
      transcript
        .map((part) => {
          const start = formatTime(part.offset / 1000, true);
          const end = formatTime((part.offset + part.duration) / 1000, true);
          return `${start} --> ${end}\n${part.text}\n`;
        })
        .join("\n");
    fs.writeFileSync("transcript.vtt", vtt, "utf-8");

    console.log("Success save transcript.{json, txt, srt, vtt}");
  } catch (err) {
    console.error("Error:", err.message);
  } finally {
    readline.close();
  }
});

function formatTime(seconds, isVTT = false) {
  const date = new Date(0);
  date.setSeconds(seconds);
  const iso = date.toISOString();
  return isVTT
    ? iso.substr(11, 8) + "." + iso.substr(20, 3)
    : iso.substr(11, 8) + "," + iso.substr(20, 3);
}
