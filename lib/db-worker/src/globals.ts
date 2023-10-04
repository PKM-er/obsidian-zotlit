import Connections from "./modules/connections";
import ItemFetcher from "./modules/item-fetcher";
import SearchIndex from "./modules/search-index";

export const conn = new Connections();
export const index = new SearchIndex();
export const itemFetcher = new ItemFetcher();
