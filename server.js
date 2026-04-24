import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import xml2js from "xml2js";

const app = express();
app.use(cors());

const CALLSIGN = "M6MXG";

// 🟢 HEALTH CHECK ENDPOINT
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "M6MXG backend is running",
    time: new Date().toISOString()
  });
});

// 🧪 MAIN API
app.get("/api/spots", async (req, res) => {
  try {
    const url = `https://retrieve.pskreporter.info/query?flowStartSeconds=-86400`;

    const response = await fetch(url);
    const xml = await response.text();

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const reports = result?.receptionReport?.receptionReport || [];

    const filtered = reports.filter(r => {
      const sender = r?.$?.senderCallsign || "";
      const receiver = r?.$?.receiverCallsign || "";
      return sender.includes(CALLSIGN) || receiver.includes(CALLSIGN);
    });

    const spots = filtered.map(r => ({
      lat: parseFloat(r.$.senderLocatorLat || r.$.receiverLocatorLat || 0),
      lon: parseFloat(r.$.senderLocatorLon || r.$.receiverLocatorLon || 0),
      callsign: r.$.senderCallsign || r.$.receiverCallsign || "UNKNOWN",
      mode: r.$.mode || "unknown",
      snr: parseFloat(r.$.sNR || 0),

      txLat: 53.6,
      txLon: -2.2
    }));

    res.json(spots.length ? spots : []);

  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
