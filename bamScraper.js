const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeSite() {
  const url = `https://www.bam.org`;
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

scrapeSite()
  .then((result) => {
    const titlesArray = [];
    const datesArray = [];
    const infoArray = [];

    for (let i = 0; i < result[0]["titles"].length; i++) {
      titlesArray.push(result[0]["titles"][`${i}`]["children"][0]["data"]);
    }

    for (let i = 0; i < result[0]["dates"].length; i++) {
      datesArray.push(result[0]["dates"][`${i}`]["children"][0]["data"]);
    }

    for (let i = 0; i < result[0]["info"].length; i++) {
      // WORKING ONE
      infoArray.push(result[0]["info"][`${i}`]["children"][0]["data"]);

      // TESTING
      // if (
      //   i === 0 ||
      //   result[0]["info"][i]["parent"] === result[0]["info"][i - 1]["parent"]
      // ) {
      //   shortList.push(result[0]["info"][i]["children"][0]["data"]);
      // }
    }
    console.log(infoArray);
    // OTHER TEST
    const finalArray = [];
    const shortList = [];
    for (const text of infoArray) {
      if (!text.endsWith(".") && !text.endsWith("!")) {
        shortList.push(infoArray.shift());
      }
      if (text.endsWith("." || text.endsWith("!"))) {
        shortList.push(infoArray.shift());
        finalArray.push(shortList.join(""));
        shortList.splice(0);
      }
    }

    console.log(titlesArray);
    console.log(datesArray);
    // console.log(finalArray);
  })
  .catch((err) => console.log(err));
