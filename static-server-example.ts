import express from "express";
import path from "path";

const app = express();
const port = 3000;

// ✅ Serve frontend static files
app.use(express.static(path.join(__dirname, "public")));

// ✅ Serve index.html for any other route
app.get("*", (_, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
