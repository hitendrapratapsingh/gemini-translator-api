const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(express.json()); // for parsing JSON requests

// 🌐 Reusable translation function
async function translateText(apiKey, text, sourceLang, targetLang) {
  try {
    const ai = new GoogleGenerativeAI(apiKey);
    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `
You are an expert multilingual translator capable of accurately translating any given text from the specified source language to the specified target language.

Translate the following text according to the instructions below:

Text: "${text}"
Source language: ${sourceLang}
Target language: ${targetLang}

Output format (strictly follow this):
"${text.toLowerCase()}": "<translated text>"
`;

    const result = await model.generateContent(prompt);
    let output = result.response.text();

    // 🧹 Clean the output
    output = output.replace(/["{}\n]/g, "").trim();

    // Example: 'fruit: फल' → split into key/value
    let source = text.toLowerCase();
    let translated = output;

    if (output.includes(":")) {
      const parts = output.split(":");
      source = parts[0].trim();
      translated = parts[1].trim();
    }

    return { source, translated };
  } catch (error) {
    console.error("Translation Error:", error);
    throw new Error("Failed to translate text.");
  }
}

// 🌍 POST endpoint for translation
app.post("/translate", async (req, res) => {
  const { apiKey, text, sourceLang, targetLang } = req.body;

  if (!apiKey || !text || !sourceLang || !targetLang) {
    return res.status(400).json({
      success: false,
      message: "Missing required fields: apiKey, text, sourceLang, targetLang",
    });
  }

  try {
    const { source, translated } = await translateText(
      apiKey,
      text,
      sourceLang,
      targetLang
    );
    res.json({ success: true, source, translated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 🚀 Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
