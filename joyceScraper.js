const axios = require("axios");
const cheerio = require("cheerio");
const dotenv = require("dotenv");
const Airtable = require("airtable");

dotenv.config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = "Shows";
const url = process.env.JOYCE_URL;

async function scrapeJoyce() {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const results = [];
  $("div.listWrapper").each((i, elem) => {
    const companies = $(elem).find("h2.title");
    const startDates = $(elem).find("span.start");
    const endDates = $(elem).find("span.end");
    const info = $(elem).find("a div.tagline");
    const links = $(elem).find("a.desc");
    const images = $(elem).find("li.eventCard style");

    results.push({ companies, startDates, endDates, info, links, images });
  });

  return results;
}

scrapeJoyce()
  .then((result) => {
    const companiesArray = [];
    const startDatesArray = [];
    const endDatesArray = [];
    const infoArray = [];
    const linksArray = [];
    const imagesArray = [];

    const d = new Date();
    let year = d.getFullYear();
    // For not interfering with current table:
    // const year = 2002;

    for (let i = 0; i < result[0]["companies"].length; i++) {
      companiesArray.push(
        result[0]["companies"][`${i}`]["children"][0]["data"]
      );
    }

    for (let i = 0; i < result[0]["startDates"].length; i++) {
      startDatesArray.push(
        result[0]["startDates"][`${i}`]["children"][0]["data"]
          .trimStart()
          .trimEnd() +
          " " +
          year
      );
    }

    for (let i = 0; i < result[0]["endDates"].length; i++) {
      endDatesArray.push(
        result[0]["endDates"][`${i}`]["children"][0]["data"]
          .trimStart()
          .trimEnd() +
          " " +
          year
      );
    }

    for (let i = 0; i < result[0]["info"].length; i++) {
      infoArray.push(result[0]["info"][`${i}`]["children"][0]["data"]);
    }

    for (let i = 0; i < result[0]["links"].length; i++) {
      linksArray.push(result[0]["links"][`${i}`].attribs.href);
    }

    for (let i = 0; i < result[0]["images"].length; i++) {
      imagesArray.push(result[0]["images"][`${i}`].children[0].data);
    }

    console.log(result[0]["images"][0].children[0].data);

    // CREATE RECORD FUNCTION

    for (let i = 0; i < result[0]["companies"].length; i++) {
      const record = {
        "Show Title": companiesArray[i],
        "Full Show Description": infoArray[i],
        Venue: "The Joyce Theater",
        Borough: "Manhattan",
        Neighborhood: "Chelsea",
        Date: startDatesArray[i],
        Link: `https://www.joyce.org${linksArray[i]}`,
        Image: "IMAGE HERE",
        "End Date": endDatesArray[i],
      };

      // CREATES RECORDS IN AIRTABLE!!

      // base(tableName).create(record, function (err, record) {
      //   if (err) {
      //     console.error("Error inserting into Airtable:", err);
      //     return;
      //   }
      //   console.log("Inserted into Airtable:", record.getId());
      // });

      // console.log(record);
    }
  })
  .catch((err) => console.log(err));
