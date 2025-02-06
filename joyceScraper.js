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

async function scrapeSite() {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const results = [];
  $("div.listWrapper").each((i, elem) => {
    const companies = $(elem).find("h2.title");
    const startDates = $(elem).find("span.start");
    const endDates = $(elem).find("span.end");
    const info = $(elem).find("a div.tagline");
    results.push({ companies, startDates, endDates, info });
  });

  return results;
}

scrapeSite()
  .then((result) => {
    const companiesArray = [];
    const startDatesArray = [];
    const endDatesArray = [];
    const datesArray = [];
    const infoArray = [];

    const d = new Date();
    // let year = d.getFullYear();
    const year = 2002;

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

    for (let i = 0; i < startDatesArray.length; i++) {
      datesArray.push(`${startDatesArray[i]} - ${endDatesArray[i]}`);
    }

    for (let i = 0; i < result[0]["info"].length; i++) {
      infoArray.push(result[0]["info"][`${i}`]["children"][0]["data"]);
    }

    // CREATE RECORD FUNCTION

    for (let i = 0; i < result[0]["companies"].length; i++) {
      const record = {
        "Show Title": companiesArray[i],
        "Full Show Description": infoArray[i],
        // Date: startDatesArray[i],
        // "End Date": endDatesArray[i],
      };
      // base(tableName).create(record, function (err, record) {
      //   if (err) {
      //     console.error("Error inserting into Airtable:", err);
      //     return;
      //   }
      //   console.log("Inserted into Airtable:", record.getId());
      // });
      console.log(record);
    }
  })
  .catch((err) => console.log(err));
