import { getTopTokenHolders } from './services/tokenHolders';

(async () => {
  try {
    await getTopTokenHolders();
  } catch (err) {
    console.error(err);
  }
})();
