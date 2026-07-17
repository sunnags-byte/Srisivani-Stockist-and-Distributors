import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Initialize the GoogleGenAI client lazily if the key exists
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Endpoint: Check backend health and see if Gemini is available
  app.get("/api/health", (req, res) => {
    const hasKey = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY";
    res.json({
      status: "ok",
      geminiAvailable: hasKey
    });
  });

  // API Endpoint: Generate customized polite WhatsApp messages using Gemini
  app.post("/api/generate-message", async (req, res) => {
    try {
      const { storeName, address, vibe, extraNotes } = req.body;
      
      const client = getGeminiClient();
      if (!client) {
        return res.status(400).json({ 
          error: "Gemini API key is not configured in your Secrets panel.",
          fallback: true 
        });
      }

      // Construct a highly detailed context-aware prompt
      let vibePrompt = "";
      switch (vibe) {
        case "warm_friendly":
          vibePrompt = "Vibe: Warm, super friendly, and personal. Start with a warm greeting. Express appreciation for their medical store's service to the community. Gently present the deal as an exclusive helper opportunity.";
          break;
        case "professional":
          vibePrompt = "Vibe: Professional B2B sales pitch. High clarity, respectful, and transparent. Mention the pharmaceutical standards (Dr. Reddy's) and present the clear financial margins and long shelf life.";
          break;
        case "value_focused":
          vibePrompt = "Vibe: Highly value-oriented and budget-conscious. Emphasize that the regular MRP is Rs. 194.25, but they can buy it for only Rs. 98. Highlight the high consumer saving potential or pharmacy margins.";
          break;
        case "concise":
          vibePrompt = "Vibe: Extremely concise and direct. Ideal for busy pharmacists. Give a polite 1-sentence greeting, followed by quick, readable bullet points of the product offer, and a kind sign-off.";
          break;
        case "malayalam_english":
          vibePrompt = "Vibe: A warm, authentic mix of colloquial Malayalam written in English alphabets (Manglish) combined with professional English. Use words like 'Namaskaram', 'Sir', 'Chettan', or 'Suhruthu' in a respectful Kerala context. Keep it highly polite, neighborly, and absolutely zero pressure.";
          break;
        default:
          vibePrompt = "Vibe: Kind, respectful, and persuasive but completely pressure-free.";
      }

      const prompt = `
        You are a highly professional, polite, and respectful pharmaceutical distributor assistant in Kerala, India.
        Your task is to draft a personalized WhatsApp outreach message to a medical store owner/pharmacist.
        The message must be polite, non-pushy ("kind and seller way but not forcing it down their throat"), and professional.

        Recipient Store Details:
        - Name: ${storeName || "Medical Store Owner"}
        - Location: ${address || "Kerala"}

        Product Offer Details:
        - Brand: Glimy M2 Forte (Metformin Hydrochloride Prolonged Release 1000 mg and Glimepiride 2 mg Tablets IP)
        - Manufacturer: Dr. Reddy's Laboratories Ltd (A gold-standard, trusted Indian manufacturer)
        - Our special wholesale/deal price: Rs. 98 per strip
        - Original MRP: Rs. 194.25 (This is a massive savings / huge margin of nearly 50%)
        - Stock available: Only 600 strips left (mention this gently as limited stock, no false high-pressure panic)
        - Expiry Date: June 2027 (Long expiry date, highly safe for pharmacy shelf)

        Additional Custom Notes from Seller:
        ${extraNotes || "None"}

        Style Guidance:
        - ${vibePrompt}
        - IMPORTANT: Never sound pushy, aggressive, or desperate.
        - Do not use exclamation marks excessively.
        - Frame the offer as a mutually beneficial partnership or service update.
        - Keep the output clean, ready to be sent on WhatsApp, with clean line breaks and optionally appropriate professional emojis (like 💊, 📦, 🤝).
        - Include a polite sentence at the end inviting them to reply with the quantity they need or if they have any questions.

        Generate ONLY the WhatsApp message text, with no wrappers, markdown headers, or explanations.
      `;

      const response = await client.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      const messageText = response.text || "";
      res.json({ message: messageText.trim() });

    } catch (error: any) {
      console.error("Gemini Generation Error:", error);
      res.status(500).json({ 
        error: error.message || "Internal Server Error during message generation.",
        fallback: true
      });
    }
  });

  // Vite middleware setup for Development vs. Production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
