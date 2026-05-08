// data.js – Statische Kontakt- und Seitendaten für 1aWG.de
// Zimmerdaten kommen live aus Google Sheets (sheets.js).

const siteData = {
  global: {
    seitenname: "1aWG.de",
    lauftext: "Es werden laufend Zimmer frei – bei Interesse einfach eine kurze E-Mail mit Einzugswunsch, Dauer und Kontaktdaten senden!"
  },
  kontakt: {
    name: "Alexander Goerke",
    strasse: "Hangstr. 14",
    plz: "70327",
    ort: "Stuttgart",
    telefon: "0179-8755863",
    mobil: "0179-8755863",
    email: "Alex.Goerke@gmx.de"
  },
  startseite: {
    begruessung: "Willkommen auf meiner Webseite.\nSchauen Sie sich unter den Menüpunkten »WG's« und »Apartments« meine Angebote in Stuttgart an.\nBei Interesse schreiben Sie bitte eine kurze E-Mail mit Einzugswunsch, Dauer und Kontaktdaten.",
    slides: [
      { bild: "bilder/slide1.jpg", ueberschrift: "Herzlich Willkommen!" },
      { bild: "bilder/slide2.jpg", ueberschrift: "Apartments in Fellbach" },
      { bild: "bilder/slide3.jpg", ueberschrift: "Zimmer in Fellbach" },
      { bild: "bilder/slide4.jpg", ueberschrift: "Zimmer in Untertürkheim" }
    ]
  }
};
