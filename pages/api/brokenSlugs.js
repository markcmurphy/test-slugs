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

    // given a table of contents, return an array of node IDs
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
    async function getToc(projectId, branchId) {
      function manageErrors(response) {
        if (!response.ok) {
          if (response.status == 404) {
            throw Error(response.statusText);
          }
          return; // will print '200 - ok'
        }
        return response;
      }

      return (
        fetch(
          `https://stoplight.io/api/v1/projects/${projectId}/table-of-contents?branch=${branchId}`
        )
          // .then(manageErrors)
          .then((response) => response.json())
          .then((data) => printSlugs(data))
          .catch((error) => console.log(error))
      );
    }

    // * check multiple table of contents against a master/main branch to detect changes in IDs
    async function checkTocSlugs(projectId, branchId) {
      // * loop over project IDs

      let redirectLineArr = [];

      for (let i = 0; i < projectId.length; i++) {
        const element = projectId[i];

        const idArray = await getToc(element, branchId);
        const masterArray = await getToc(element, 'master');

        // * considered error if slug in branch is not included in master branch
        let errors = idArray.filter(
          (slug) => masterArray.includes(slug) !== true
        );

        let oldSlugs = masterArray.filter(
          (slug) => idArray.includes(slug) !== true
        );

        const csvArray = csvToArray(redirects);

        // * ID of slug that will be replaced
        const search = `b3A6MTI3MjY3MjE`;

        const resultCSV = csvArray.filter((obj) =>
          Object.values(obj).some((val) => val.includes(search))
        );

        // function redirectLine(result) {
        //   //   console.log(result.slug);
        //   redirectLineArr.push(
        //     `${resultCSV[0].to} /${resultCSV[0].to.split('/')[1]}/${
        //       result.slug
        //     } 302`
        //   );
        //   console.log(redirectLineArr);
        // }

        errors?.forEach((slug) => {
          fetch(
            `https://stoplight.io/api/v1/projects/${element}/nodes/${slug}?branch=${branchId}`
          )
            // .then(manageErrors)
            .then((response) => response.json())
            // .then((result) => result.slug)
            // .then((result) => redirectLine(result))
            .then((result) =>
              redirectLineArr.push(
                `${resultCSV[0].to} /${resultCSV[0].to.split('/')[1]}/${
                  result.slug
                } 302`
              )
            )
            // .then((result) => console.log(JSON.stringify(result)))
            // .then((result) => result)
            .catch((error) => console.log(error));
        });

        // return redirectLineArr.length >= 0 ? redirectLineArr : null;
        // * end project ID loop
      }
      return redirectLineArr;
    }

    let apiRef = 'cHJqOjIwNjAz';
    let devDocs = 'cHJqOjI4MDIz';
    let testBranch = 'filter-test-branch';

    let projectIdArr = [apiRef, devDocs];

    const toSend = await checkTocSlugs(projectIdArr, branchId);
    // console.log(toSend);

    // console.log(toSend);
    res.send(toSend);
  }
}
