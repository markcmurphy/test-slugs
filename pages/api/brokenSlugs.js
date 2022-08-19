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
            if (k == 'id' && obj[k].match(/\b[bc]/g) == null) {
              // if (k == 'id') {
              // if (obj[k].match(/\b[bc]/g) == null) {
              // console.log(obj[k]);
              newArr.push(obj[k]);
              // }
            }
          }
        }
        return newArr;
      }

      let resolve = copy(toc);
      let resItems = await printAllVals(resolve);
      return resItems;
    }

    function filterReq(toc, str) {
      function copy(o) {
        return Object.assign({}, o);
      }

      function recursiveRemove(list, id) {
        return list
          .map((item) => {
            return { ...item };
          })
          .filter((item) => {
            if ('items' in item) {
              item.items = recursiveRemove(item.items, id);
            }
            return item.title !== id;
          });
      }

      let filtered = () => {
        let copied = copy(toc);
        copied.items = recursiveRemove(toc.items, str);
        return copied;
      };

      return filtered();
    }

    const filterSchemas = async (toc) => {
      const terms = ['Schemas', 'Models', 'model', 'Webhooks'];
      let filteredToc = toc;
      terms.forEach((term) => {
        filteredToc = filterReq(filteredToc, term);
      });

      const filtered = await filteredToc.items.flat(Infinity);
      return filtered;

      // const filtered = filterReq(toc, 'Schemas');
      // const refiltered = filterReq(filtered, 'Models');
      // const rerefiltered = filterReq(refiltered, 'model');
      // const rererefiltered = filterReq(rerefiltered, 'Webhooks');
    };

    // console.log(JSON.stringify(filterSchemas()));

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

      const response = await fetch(
        `https://stoplight.io/api/v1/projects/${projId}/table-of-contents?branch=${branchId}`
      );
      const tocOk = await manageErrors(response);
      const toc = await tocOk.json();
      const filteredSchemas = await filterSchemas(toc);
      const slugs = await printSlugs(filteredSchemas);
      return slugs;

      // return (
      //   fetch(
      //     `https://stoplight.io/api/v1/projects/${projId}/table-of-contents?branch=${branchId}`
      //   )
      //     .then((response) => response.json())

      //     .then((data) => printSlugs(data))
      //     // .then((data) => printSlugs(filterSchemas(data)))
      //     .catch((error) => console.log(error))
      // );
    }

    // * check multiple table of contents against a master/main branch to detect changes in IDs
    async function checkTocSlugs(projectId, branchId) {
      const redirectLineArr = [];

      //   * loop over project IDs
      // for (let i = 0; i < projectIdArr.length; i++) {
      const element = projectId;
      // const element = projectIdArr[i];

      const idArray = await getToc(element, branchId);
      const masterArray = await getToc(element, 'master');

      // const masterArray = filterSchemas(masterArr);
      // const idArray = filterSchemas(idArr);

      // * considered error if slug in branch is not included in master branch
      let errors = await idArray.filter(
        (slug) => masterArray.includes(slug) !== true
      );

      let oldSlugs = await masterArray.filter(
        (slug) => idArray.includes(slug) !== true
      );

      var myRegex = redirects.replace(/^#.*$/gm, '');
      let regex = /^\s*$(?:\r\n?|\n)/gm;
      let result = myRegex.replace(regex, '');

      const csvArray = csvToArray(result);

      const resultCSV = (search) => {
        let searchSlug = search.slug?.split('-').slice(1).join('-');

        const searchArray = csvArray.filter(
          (obj) => {
            // Object.values(obj).forEach((each) => {
            Object.values(obj).some((val) =>
              // val.includes(searchSlug));
              typeof val !== 'string' ? false : val.includes(searchSlug)
            );
            // console.log(typeof val)
            // );

            // : false;
          }
          //     // : false
        );

        // console.log(
        //   '🚀 ~ file: brokenSlugs.js ~ line 167 ~ resultCSV ~ Object.values(obj)',
        //   Object.values(obj)
        // )
        // );

        // if (search == 'to') {
        //   return;
        // } else {
        return searchArray;
      };

      // return search == 'to' ? searchArray : null;
      // };

      // console.log(errors);

      function manageErrors(response) {
        if (!response.ok) {
          if (response.status == 404) {
            throw Error(response.statusText);
          }
          return; // will print '200 - ok'
        }
        return response;
      }

      console.log(errors);

      redirectLineArr.push(errors);

      // errors?.forEach((slug) => {
      //   fetch(
      //     `https://stoplight.io/api/v1/projects/${element}/nodes/${slug}?branch=${branchId}`
      //   )
      //     .then((response) => manageErrors(response).json())
      //     .then(
      //       (result) =>
      //         // console.log("🚀 ~ file: brokenSlugs.js ~ line 185 ~ errors?.forEach ~ result", result)
      //         // redirectLineArr.push(resultCSV(result))
      //         // prettier-ignore
      //       redirectLineArr.push(result),
      //       console.log(redirectLineArr)

      //       // resultCSV(result)[0] !== undefined ? (resultCSV(result)[0].to ? redirectLineArr.push(`${resultCSV(result)[0].to} /${resultCSV(result)[0].to.split('/')[1]}/${result.slug} 302`) : null) : null
      //       // resultCSV(result)[0].to ? resultCSV(result)[0].to : null

      //       // console.log(resultCSV(result))
      //       // resultCSV(result)[0] !== undefined ? (resultCSV(result)[0].to ? redirectLineArr.push(`${resultCSV(result)[0].to} /${resultCSV(result)[0].to.split('/')[1]}/${result.slug} 302`) : null) : null
      //       // resultCSV(result)[0].to
      //       // console.log("🚀 ~ file: brokenSlugs.js ~ line 241 ~ errors?.forEach ~ resultCSV(result)[0].to", resultCSV(result)[0] !== undefined ? 'null' : resultCSV(result)[0])
      //       //  ? redirectLineArr.push(`${resultCSV(result)[0].to} /${resultCSV(result)[0].to.split('/')[1]}/${result.slug} 302`) : null
      //     )
      //     .catch((error) => console.log(error));
      // });

      // console.log(redirectLineArr);
      // * end project ID loop
      // return redirectLineArr;
      return errors;
    }

    let apiRef = 'cHJqOjIwNjAz';
    // let devDocs = 'cHJqOjI4MDIz';

    // let projectIdArr = ['cHJqOjIwNjAz'];

    const toSend = await checkTocSlugs(apiRef, branchId);

    res.send(toSend);
  }
}
