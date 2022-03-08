import fetch from 'node-fetch';
import {
  convertToCsv,
  csvToArray,
  redirects,
} from './modules/redirectsToCsv.js';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    let projectId = JSON.parse(req.body).projectId;
    let branchId = JSON.parse(req.body).branch;

    // * given a table of contents, return an array of node IDs
    async function printSlugs(toc) {
      function copy(o) {
        return Object.assign({}, o);
      }

      let newArr = [];

      async function printAllVals(obj) {
        for (let k in obj) {
          if (typeof obj[k] === 'object') {
            await printAllVals(obj[k]);
          } else {
            if (k == 'id') {
              newArr.push(obj[k]);
            }
          }
        }
        return newArr;
      }

      let resolve = copy(toc);
      let resItems = await printAllVals(resolve);
      return resItems;
    }

    // fetch a TOC for a given project and branch, then run printSlugs to return array of IDs
    async function getToc(projId, branchId) {
      function manageErrors(response) {
        if (!response.ok) {
          if (response.status == 404) {
            throw Error(response.statusText);
          }
          return; // will print '200 - ok'
        }
        return response;
      }

      return fetch(
        `https://stoplight.io/api/v1/projects/${projId}/table-of-contents?branch=${branchId}`
      )
        .then((response) => response.json())
        .then((data) => printSlugs(data))
        .catch((error) => console.log(error));
    }

    // * check multiple table of contents against a master/main branch to detect changes in IDs
    async function checkTocSlugs(projectIdArr, branchId) {
      const redirectLineArr = [];

      //   * loop over project IDs
      for (let i = 0; i < projectIdArr.length; i++) {
        const element = projectIdArr[i];

        const idArray = await getToc(element, branchId);
        const masterArray = await getToc(element, 'master');

        // * considered error if slug in branch is not included in master branch
        let errors = idArray.filter(
          (slug) => masterArray.includes(slug) !== true
        );
        console.log(
          '🚀 ~ file: brokenSlugs.js ~ line 74 ~ checkTocSlugs ~ errors',
          errors
        );

        let oldSlugs = masterArray.filter(
          (slug) => idArray.includes(slug) !== true
        );

        const csvArray = csvToArray(redirects);

        const resultCSV = (search) => {
          let searchSlug = search.slug.split('-').slice(1).join('-');

          const searchArray = csvArray.filter((obj) =>
            Object.values(obj).some((val) => val.includes(searchSlug))
          );
          console.log(
            '🚀 ~ file: brokenSlugs.js ~ line 91 ~ resultCSV ~ searchArray',
            searchArray
          );

          return searchArray;
        };

        errors?.forEach((slug) => {
          fetch(
            `https://stoplight.io/api/v1/projects/${element}/nodes/${slug}?branch=${branchId}`
          )
            .then((response) => response.json())
            .then((result) =>
              // prettier-ignore
              redirectLineArr.push(`${resultCSV(result)[0].to} /${resultCSV(result)[0].to.split('/')[1]}/${result.slug} 302`)
            )
            .catch((error) => console.log(error));
        });

        // * end project ID loop
        console.log(
          '🚀 ~ file: brokenSlugs.js ~ line 114 ~ checkTocSlugs ~ redirectLineArr',
          redirectLineArr
        );
      }
      return redirectLineArr;
    }

    // let apiRef = 'cHJqOjIwNjAz';
    // let devDocs = 'cHJqOjI4MDIz';

    let projectIdArr = ['cHJqOjIwNjAz', 'cHJqOjI4MDIz'];

    const toSend = await checkTocSlugs(projectIdArr, branchId);

    res.send(toSend);
  }
}
