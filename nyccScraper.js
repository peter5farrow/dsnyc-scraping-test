const axios = require("axios");
const cheerio = require("cheerio");
const dotenv = require("dotenv");
const Airtable = require("airtable");

dotenv.config();

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(
  process.env.AIRTABLE_BASE_ID
);
const tableName = "Shows";
const url = process.env.NYCC_URL;

async function scrapeNycc() {
  const { data } = await axios.get(url);
  const $ = cheerio.load(data);

  const results = [];
  $("div#TabPanel_2 ul.splide__list").each((i, elem) => {
    const companies = $(elem).find("a.whats-on-carousel-title");
    const dates = $(elem).find("li div.rich-text");
    const pictures = $(elem).find("div.whats-on-carousel-image img");
    results.push({ companies, dates, pictures });

    // console.log(dates[1]["children"][5]["children"]["data"]);
  });

  return results;
}

scrapeNycc()
  .then((result) => {
    const companiesArray = [];
    const startDatesArray = [];
    const endDatesArray = [];
    const infoArray = [];

    const d = new Date();
    let year = d.getFullYear();
    // For not interfering with current table:
    // const year = 2002;

    for (let i = 0; i < result[0]["companies"].length; i++) {
      companiesArray.push(
        result[0]["companies"][`${i}`]["children"][0]["data"]
      );
    }

    // console.log(Object.keys(result[0]["dates"][2]["children"]));

    // Long one
    for (let i = 0; i < result[0]["dates"].length; i++) {
      if (Object.keys(result[0]["dates"][`${i}`]["children"]).length === 7) {
        const eachDate =
          result[0]["dates"][`${i}`]["children"][5]["children"][0]["data"];
        const month = eachDate.split(" ")[0];

        if (eachDate.includes("–")) {
          startDatesArray.push(eachDate.split("–")[0] + year);
          endDatesArray.push(month + eachDate.split("–")[1].trimEnd());
        } else {
          startDatesArray.push(eachDate);
          endDatesArray.push(eachDate);
        }

        // Regular one
      } else if (
        Object.keys(result[0]["dates"][`${i}`]["children"]).length === 5
      ) {
        const eachDate =
          result[0]["dates"][`${i}`]["children"][3]["children"][0]["data"];
        const month = eachDate.split(" ")[0];

        if (eachDate.includes("–")) {
          startDatesArray.push(eachDate.split("–")[0] + year);
          endDatesArray.push(month + eachDate.split("–")[1].trimEnd());
        } else {
          startDatesArray.push(eachDate);
          endDatesArray.push(eachDate);
        }

        // No date
      } else {
        startDatesArray.push("NONE");
        endDatesArray.push("NONE");
      }
    }

    // for (let i = 0; i < startDatesArray.length; i++) {
    //   datesArray.push(`${startDatesArray[i]} - ${endDatesArray[i]}`);
    // }

    // for (let i = 0; i < result[0]["info"].length; i++) {
    //   infoArray.push(result[0]["info"][`${i}`]["children"][0]["data"]);
    // }

    // CREATE RECORD FUNCTION

    for (let i = 0; i < result[0]["companies"].length; i++) {
      const record = {
        "Show Title": companiesArray[i],
        // "Full Show Description": infoArray[i],
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
      console.log(record);
    }
  })
  .catch((err) => console.log(err));
