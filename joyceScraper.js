const axios = require("axios");
const cheerio = require("cheerio");

async function scrapeSite() {
  const url = `https://www.joyce.org/performances`;
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
    const starts = [];
    const ends = [];
    const datesArray = [];
    const infoArray = [];

    for (let i = 0; i < result[0]["companies"].length; i++) {
      companiesArray.push(
        result[0]["companies"][`${i}`]["children"][0]["data"]
      );
    }

    for (let i = 0; i < result[0]["startDates"].length; i++) {
      starts.push(
        result[0]["startDates"][`${i}`]["children"][0]["data"]
          .trimStart()
          .trimEnd()
      );
    }

    for (let i = 0; i < result[0]["endDates"].length; i++) {
      ends.push(
        result[0]["endDates"][`${i}`]["children"][0]["data"]
          .trimStart()
          .trimEnd()
      );
    }

    for (let i = 0; i < starts.length; i++) {
      datesArray.push(`${starts[i]} - ${ends[i]}`);
    }

    for (let i = 0; i < result[0]["info"].length; i++) {
      infoArray.push(result[0]["info"][`${i}`]["children"][0]["data"]);
    }

    console.log(companiesArray);
    console.log(datesArray);
    console.log(infoArray);
  })
  .catch((err) => console.log(err));
