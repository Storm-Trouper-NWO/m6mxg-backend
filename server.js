import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import xml2js from "xml2js";

const app = express();
app.use(cors());

const CALLSIGN = "M6MXG";

app.get("/", (req, res) => {
  res.send("M6MXG Backend Running");
});

app.get("/api/spots", async (req, res) => {
  try {
    // 🔥 Use BOTH sender + receiver queries fallback style
    const url = `https://retrieve.pskreporter.info/query?flowStartSeconds=-86400`;

    const response = await fetch(url);
    const xml = await response.text();

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const reports = result?.receptionReport?.receptionReport || [];

    // 🧠 Filter anything related to your callsign (safe client-side filter)
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

      // 📍 YOUR QTH (edit if needed)
      txLat: 53.6,
      txLon: -2.2
    }));

    // 🛑 NEVER return empty map — fallback marker so UI always shows something
    if (spots.length === 0) {
      return res.json([
        {
          lat: 0,
          lon: 0,
          callsign: "NO DATA (check WSJT-X / PSK Reporter)",
          mode: "N/A",
          snr: 0,
          txLat: 53.6,
          txLon: -2.2
        }
      ]);
    }

    res.json(spots);

  } catch (err) {
    console.log("ERROR:", err);
    res.json([]);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
