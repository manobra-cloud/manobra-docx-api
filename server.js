import express from "express";
import cors from "cors";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand
} from "@aws-sdk/client-s3";
import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const s3 = new S3Client({
  region: process.env.WASABI_REGION,
  endpoint: process.env.WASABI_ENDPOINT,
  credentials: {
    accessKeyId: process.env.WASABI_ACCESS_KEY,
    secretAccessKey: process.env.WASABI_SECRET_KEY
  }
});

app.get("/", (req, res) => {
  res.send("API DOCX attiva");
});

app.post("/generate-docx", async (req, res) => {
  try {
    const { templateKey, tenantId, praticaId, data } = req.body;

    const templateObject = await s3.send(new GetObjectCommand({
      Bucket: process.env.WASABI_BUCKET,
      Key: templateKey
    }));

    const chunks = [];

    for await (const chunk of templateObject.Body) {
      chunks.push(chunk);
    }

    const content = Buffer.concat(chunks);

    const zip = new PizZip(content);

    const doc = new Docxtemplater(zip, {
      paragraphLoop: true,
      linebreaks: true
    });

    doc.render(data);

    const buffer = doc.getZip().generate({
      type: "nodebuffer",
      compression: "DEFLATE"
    });

    const fileName = `documento-${Date.now()}.docx`;

    const safeTenantId = tenantId || "tenant-test";
    const safePraticaId = praticaId || "pratica-test";

    const wasabiKey = `${safeTenantId}/documenti-generati/${safePraticaId}/${fileName}`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.WASABI_BUCKET,
      Key: wasabiKey,
      Body: buffer,
      ContentType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    }));

    const fileUrl = `${process.env.WASABI_ENDPOINT}/${process.env.WASABI_BUCKET}/${wasabiKey}`;

    res.json({
      success: true,
      fileName,
      wasabiKey,
      fileUrl
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
