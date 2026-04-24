app.get("/api/spots", async (req, res) => {
  try {
    const url = `https://retrieve.pskreporter.info/query?flowStartSeconds=-3600`;

    const response = await fetch(url);
    const xml = await response.text();

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const reports = result?.receptionReport?.receptionReport || [];

    // 🔥 TAKE FIRST 100 REAL SPOTS (NO STRICT FILTER)
    const spots = reports.slice(0, 100).map(r => ({
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
