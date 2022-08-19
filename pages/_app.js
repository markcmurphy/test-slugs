// import 'bootstrap/dist/css/bootstrap.css';
import '../styles/globals.css';
import '../styles/styles.css';
import '../styles/styles-custom.css';

import { useEffect } from 'react';

function MyApp({ Component, pageProps }) {
  useEffect(() => {
    // import('bootstrap/dist/js/bootstrap');
  }, []);

  return <Component {...pageProps} />;
}

export default MyApp;
