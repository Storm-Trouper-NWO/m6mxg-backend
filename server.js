import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import xml2js from "xml2js";

const app = express();
app.use(cors());

const CALLSIGN = "M6MXG";

// ✅ health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    message: "M6MXG backend running",
    time: new Date().toISOString()
  });
});

// 🌍 MAIN API (FIXED VERSION)
app.get("/api/spots", async (req, res) => {
  try {
    const base = "https://retrieve.pskreporter.info/query?flowStartSeconds=-3600";

    const [txRes, rxRes] = await Promise.all([
      fetch(`${base}&senderCallsign=${CALLSIGN}`),
      fetch(`${base}&receiverCallsign=${CALLSIGN}`)
    ]);

    const [txXml, rxXml] = await Promise.all([
      txRes.text(),
      rxRes.text()
    ]);

    const parser = new xml2js.Parser();

    const txData = await parser.parseStringPromise(txXml);
    const rxData = await parser.parseStringPromise(rxXml);

    const txReports = txData?.receptionReport?.receptionReport || [];
    const rxReports = rxData?.receptionReport?.receptionReport || [];

    const combined = [...txReports, ...rxReports];

    const spots = combined.map(r => ({
      lat: parseFloat(r.$.senderLocatorLat || r.$.receiverLocatorLat || 0),
      lon: parseFloat(r.$.senderLocatorLon || r.$.receiverLocatorLon || 0),
      callsign: r.$.senderCallsign || r.$.receiverCallsign || "UNKNOWN",
      mode: r.$.mode || "unknown",
      snr: parseFloat(r.$.sNR || 0),
      txLat: 53.6,
      txLon: -2.2
    }));

    res.json(spots);

  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

// 🚀 start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});
