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
    const companies = $(elem).find("li h3.bam-block-2x4-title");
    const dates = $(elem).find("li p.bam-block-2x4-date");
    const info = $(elem).find("li div.bam-block-2x4-hover-body");
    const links = $(elem).find("div a.btn");
    const images = $(elem).find("div.bam-block-2x4-top img");
    results.push({ companies, dates, info, links, images });
  });

  return results;
}

scrapeBam()
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
      if (result[0]["info"][`${i}`]["children"][0]["data"]) {
        infoArray.push(result[0]["info"][`${i}`]["children"][0]["data"]);
      } else {
        infoArray.push(
          result[0]["info"][`${i}`]["children"][0]["children"][0][
            "children"
          ][0]["data"]
        );
      }
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

    for (let i = 0; i < result[0]["links"].length; i++) {
      linksArray.push(
        `https://www.bam.org${result[0]["links"][`${i}`].attribs.href}`
      );
    }

    for (let i = 0; i < result[0]["images"].length; i++) {
      imagesArray.push(
        `https://www.bam.org${result[0]["images"][`${i}`].attribs.src}`
      );
    }

    // CREATE RECORD FUNCTION

    for (let i = 0; i < result[0]["companies"].length; i++) {
      const record = {
        "Show Title": companiesArray[i],
        "Full Show Description": finalInfoArray[i],
        Venue: "BAM (Brooklyn Academy of Music)",
        Borough: "Brooklyn",
        Neighborhood: "Fort Greene",
        Price: 35,
        Date: startDatesArray[i],
        Link: linksArray[i],
        Image: [{ url: imagesArray[i] }],
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
