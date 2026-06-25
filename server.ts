import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to check if MailerLite is configured securely on the server
  app.get("/api/mailerlite-status", (req, res) => {
    res.json({
      configured: !!process.env.MAILERLITE_API_KEY,
      senderEmail: process.env.MAILERLITE_SENDER_EMAIL || null
    });
  });

  // API Route to handle secure MailerLite email dispatch
  app.post("/api/send-email", async (req, res) => {
    try {
      const { to, subject, html, text, fromName, fromEmail } = req.body;
      
      const apiKey = process.env.MAILERLITE_API_KEY;
      const senderEmail = process.env.MAILERLITE_SENDER_EMAIL;

      if (!apiKey) {
        return res.status(500).json({ 
          error: "Clé API MailerLite non configurée sur le serveur. Veuillez ajouter la variable d'environnement MAILERLITE_API_KEY." 
        });
      }

      // We use the configured sender email on MailerLite, or fallback to the requested one
      const finalFromEmail = senderEmail || fromEmail || "support@flashconnect.net";

      console.log(`Sending real email via MailerLite to: ${to} from: ${finalFromEmail}`);

      const response = await fetch("https://connect.mailerlite.com/api/emails/transactional", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          subject: subject,
          from: finalFromEmail,
          from_name: fromName || "Alerte Sécurisée",
          to: to,
          html: html,
          text: text
        })
      });

      const responseData = await response.json().catch(() => ({}));

      if (!response.ok) {
        console.error("Mailerlite API error status:", response.status, responseData);
        return res.status(response.status).json({
          error: responseData?.message || `Erreur MailerLite (${response.status})`,
          details: responseData
        });
      }

      return res.json({ success: true, data: responseData });
    } catch (error: any) {
      console.error("Server API MailerLite error:", error);
      return res.status(500).json({ error: error.message || "Erreur interne du serveur" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
