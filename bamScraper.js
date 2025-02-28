const axios = require("axios");
const cheerio = require("cheerio");
const dotenv = require("dotenv");
const Airtable = require("airtable");

dotenv.config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = "Shows";
const url = process.env.BAM_URL;

async function scrapeBam() {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const results = [];
  $("div #multiContainer_Dance ul").each((i, elem) => {
    const titles = $(elem).find("li h3.bam-block-2x4-title");
    const dates = $(elem).find("li p.bam-block-2x4-date");
    const info = $(elem).find("li div.bam-block-2x4-hover-body p span");
    results.push({ titles, dates, info });
  });

  return results;
}

scrapeBam()
  .then((result) => {
    const titlesArray = [];
    const startDatesArray = [];
    const endDatesArray = [];
    const infoArray = [];

    const d = new Date();
    let year = d.getFullYear();
    // For not interfering with current table:
    // const year = 2002;

    for (let i = 0; i < result[0]["titles"].length; i++) {
      titlesArray.push(result[0]["titles"][`${i}`]["children"][0]["data"]);
    }

    for (let i = 0; i < result[0]["dates"].length; i++) {
      const eachDate = result[0]["dates"][`${i}`]["children"][0]["data"];

      if (eachDate.includes("—")) {
        startDatesArray.push(eachDate.split("—")[0] + " " + year);
        endDatesArray.push(eachDate.split("—")[1]);
      } else {
        startDatesArray.push(eachDate);
        endDatesArray.push(eachDate);
      }
    }

    for (let i = 0; i < result[0]["info"].length; i++) {
      infoArray.push(result[0]["info"][`${i}`]["children"][0]["data"]);
    }

    const finalInfoArray = [];
    const shortList = [];
    let index = 0;

    while (index < infoArray.length) {
      const text = infoArray[index];

      if (
        !text.endsWith(".") &&
        !text.endsWith("!") &&
        !text.endsWith(". ") &&
        !text.endsWith("! ")
      ) {
        shortList.push(infoArray[index]);
      } else {
        shortList.push(infoArray[index]);
        finalInfoArray.push(shortList.join(""));
        shortList.length = 0;
      }
      index++;
    }

    // CREATE RECORD FUNCTION

    for (let i = 0; i < result[0]["titles"].length; i++) {
      const record = {
        "Show Title": titlesArray[i],
        "Full Show Description": finalInfoArray[i],
        Date: startDatesArray[i],
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

      // FOR TESTING:

      console.log(record);
    }
  })
  .catch((err) => console.log(err));
