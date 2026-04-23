import express from "express";
import cors from "cors";
import fetch from "node-fetch";
import xml2js from "xml2js";

const app = express();
app.use(cors());

const CALLSIGN = "M6MXG";

app.get("/api/spots", async (req, res) => {
  try {
    const url = `https://retrieve.pskreporter.info/query?senderCallsign=${CALLSIGN}&flowStartSeconds=-3600`;

    const response = await fetch(url);
    const xml = await response.text();

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const reports = result.receptionReport?.receptionReport || [];

    const spots = reports.map(r => ({
      lat: parseFloat(r.$.receiverLocatorLat || 0),
      lon: parseFloat(r.$.receiverLocatorLon || 0),
      callsign: r.$.receiverCallsign,
      mode: r.$.mode
    }));

    res.json(spots);

  } catch (err) {
    console.log(err);
    res.json([]);
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Server running on port " + PORT);
});