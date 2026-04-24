app.get("/api/spots", async (req, res) => {
  try {
    const base = "https://retrieve.pskreporter.info/query?flowStartSeconds=-3600";

    // 🔄 fetch BOTH directions
    const [txRes, rxRes] = await Promise.all([
      fetch(`${base}&senderCallsign=M6MXG`),
      fetch(`${base}&receiverCallsign=M6MXG`)
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

    // 🔥 combine both
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
