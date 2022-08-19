import * as OpenApiValidator from 'express-openapi-validator';

// Helper method to wait for a middleware to execute before continuing
// And to throw an error when an error happens in a middleware

function initMiddleware(middleware) {
  return (req, res) =>
    new Promise((resolve, reject) => {
      middleware(req, res, (result) => {
        if (result instanceof Error) {
          return reject(result);
        }
        return resolve(result);
      });
    });
}

const OAS = initMiddleware(
  OpenApiValidator.middleware({
    apiSpec: './pages.v3.yml',
    validateRequests: false, // (default)
    validateResponses: true, // false by default
  })
);

async function handler(req, res) {
  // Run the middleware

  await OAS(req, res);
  // Rest of the API logic
  const raw = '';

  const requestOptions = {
    method: 'GET',
    headers: {
      'X-Auth-Token': 'r7752l82dg66kadytd52p2t06rd42k5',
      Accept: 'application/json',
    },
    body: raw,
    redirect: 'follow',
  };

  fetch(
    'https://api.bigcommerce.com/stores/29iql3rwa6/v3/catalog/categories/tree',
    requestOptions
  )
    .then((response) => response.json())
    .then((result) => res.send(result))
    .catch((error) => console.log('error', error));
}

export default handler;
