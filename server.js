import express from "express";
import cors from "cors";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API DOCX attiva");
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
