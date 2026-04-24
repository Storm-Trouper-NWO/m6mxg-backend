app.get("/api/onair", async (req, res) => {
  try {
    const url = `https://retrieve.pskreporter.info/query?senderCallsign=M6MXG&flowStartSeconds=-300`;

    const response = await fetch(url);
    const xml = await response.text();

    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(xml);

    const reports = result?.receptionReport?.receptionReport || [];

    // if activity in last 5 mins → ON AIR
    const onAir = reports.length > 0;

    res.json({
      onAir,
      lastActivity: reports.length
    });

  } catch (err) {
    console.log(err);
    res.json({ onAir: false });
  }
});
