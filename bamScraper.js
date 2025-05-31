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
    const moreCompanies = $(elem).find("li h3.bam-block-2x2-title");

    const dates = $(elem).find("li p.bam-block-2x4-date");
    const moreDates = $(elem).find("li p.bam-block-2x2-date");

    const info = $(elem).find("li div.bam-block-2x4-hover-body");
    const moreInfo = $(elem).find("li div.bam-block-2x2-hover-content-body");

    const links = $(elem).find("div.bam-block-2x4-btm-btns a.btn");
    const moreLinks = $(elem).find("div.bam-block-2x2-btm-btns a.btn");

    const filteredLinks = links.filter(function () {
      return $(this).attr("class").trim() === "btn";
    });
    const moreFilteredLinks = moreLinks.filter(function () {
      return $(this).attr("class").trim() === "btn";
    });

    const images = $(elem).find("div.bam-block-2x4-top img");
    const moreImages = $(elem).find("div.bam-block-2x2-top img");

    results.push({
      companies,
      moreCompanies,
      dates,
      moreDates,
      info,
      moreInfo,
      filteredLinks,
      moreFilteredLinks,
      images,
      moreImages,
    });
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
    for (let i = 0; i < result[0]["moreCompanies"].length; i++) {
      companiesArray.push(
        result[0]["moreCompanies"][`${i}`]["children"][0]["data"]
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
    for (let i = 0; i < result[0]["moreDates"].length; i++) {
      const eachDate = result[0]["moreDates"][`${i}`]["children"][0]["data"];

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
    for (let i = 0; i < result[0]["moreInfo"].length; i++) {
      if (result[0]["moreInfo"][`${i}`]["children"][0]["data"]) {
        infoArray.push(result[0]["moreInfo"][`${i}`]["children"][0]["data"]);
      } else {
        infoArray.push(
          result[0]["moreInfo"][`${i}`]["children"][0]["children"][0][
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

    for (let i = 0; i < result[0]["filteredLinks"].length; i++) {
      linksArray.push(
        `https://www.bam.org${result[0]["filteredLinks"][`${i}`].attribs.href}`
      );
    }
    for (let i = 0; i < result[0]["moreFilteredLinks"].length; i++) {
      linksArray.push(
        `https://www.bam.org${
          result[0]["moreFilteredLinks"][`${i}`].attribs.href
        }`
      );
    }

    for (let i = 0; i < result[0]["images"].length; i++) {
      imagesArray.push(
        `https://www.bam.org${result[0]["images"][`${i}`].attribs.src}`
      );
    }
    for (let i = 0; i < result[0]["moreImages"].length; i++) {
      imagesArray.push(
        `https://www.bam.org${result[0]["moreImages"][`${i}`].attribs.src}`
      );
    }

    // CREATE RECORD FUNCTION

    for (let i = 0; i < companiesArray.length; i++) {
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
