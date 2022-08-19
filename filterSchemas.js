import toc from './toc.json' assert { type: 'json' };

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

// const flat = JSON.stringify(filterReq(toc, 'Schemas').items.flat(Infinity));

const terms = ['Schemas', 'Models', 'model', 'Webhooks'];

const filterSchemas = () => {
  let filteredToc = toc;
  terms.forEach((term) => {
    filteredToc = filterReq(filteredToc, term);
  });

  return filteredToc.items.flat(Infinity);

  // const filtered = filterReq(toc, 'Schemas');
  // const refiltered = filterReq(filtered, 'Models');
  // const rerefiltered = filterReq(refiltered, 'model');
  // const rererefiltered = filterReq(rerefiltered, 'Webhooks');
};

console.log(JSON.stringify(filterSchemas()));
// console.log(JSON.parse(filterSchemas()));
// console.log(JSON.stringify(filterReq(toc, 'Schemas').items.flat(Infinity)));
