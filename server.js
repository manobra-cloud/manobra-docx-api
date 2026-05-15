import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use("/files", express.static(process.cwd()));

app.get("/", (req, res) => {
  res.send("API DOCX attiva");
});

app.post("/generate-docx", async (req, res) => {
  try {
    const { templatePath, data } = req.body;

    const content = fs.readFileSync(templatePath, "binary");
    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    doc.render(data);

    const buf = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE"
    });

    const fileName = `documento-${Date.now()}.docx`;
    fs.writeFileSync(fileName, buf);

    const baseUrl = `${req.protocol}://${req.get("host")}`;

    res.json({
      success: true,
      fileUrl: `${baseUrl}/files/${fileName}`,
      fileName: fileName
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

const PORT = process.env.PORT || 10000;

app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
