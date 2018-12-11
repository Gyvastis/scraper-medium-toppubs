const fetch = require('node-fetch');
const scrapeIt = require('scrape-it');
const u = require('url');
const fs = require('fs');

const topPubsUrl = 'https://toppubs.smedian.com/';

const fetchTopPubUrls = () => scrapeIt(topPubsUrl, {
    pubs: {
      listItem: '.card-content',
      data: {
        url: {
          selector: 'a:nth-child(2)',
          attr: 'ng-href',
        },
      },
    }
  })
  .then(({ data: { pubs } }) => pubs.map(pub => pub.url));

const fetchPubDomainUrl = pubUrl => fetch(pubUrl).then(({ url }) => {
  const parsedUrl = u.parse(url);

  return `${parsedUrl.protocol}//${parsedUrl.hostname}`;
}).catch(err => console.log(err));

const writeMediumUnlimitedManifestFile = pubDomainUrls => {
  const manifestOutput = {
    "content_scripts": {
      "matches": [
        ...pubDomainUrls.map(pubDomainUrl => `${pubDomainUrl}/*/*`),
        ...pubDomainUrls.map(pubDomainUrl => `${pubDomainUrl}/*/*/*`)
      ].sort()
    }
  };

  fs.writeFile('./manifest.json', JSON.stringify(manifestOutput, null, 4), err => {
    if(err) return console.log(err);

    console.log(`Results have been written to manifest.json!`);
  });
}

(async () => {
  const topPubUrls = await fetchTopPubUrls();
  console.log(`Parsed publication ${topPubUrls.length} urls.`);

  console.log(`Fetching real domains...`);
  const topPubDomainUrls = (await Promise.all(topPubUrls.map(pubUrl => fetchPubDomainUrl(pubUrl))))
      .filter(pubDomainUrl => !!pubDomainUrl)
      .filter(pubDomainUrl => pubDomainUrl !== 'https://medium.com')
      .sort();

  console.log(`Fetched ${topPubDomainUrls.length} real publication domains.`)

  writeMediumUnlimitedManifestFile(topPubDomainUrls);
  // console.log(manifestOutput);
})();
