var algoliaSearch = function algoliaSearchModule() {
    var _client = algoliasearch("APP_ID_GOES_HERE", "API_KEY_GOES_HERE"),
        _index = _client.initIndex('INDEX_NAME_GOES_HERE');

    var search = function (query, filters) {
        filters = filters ?? '';

        return _index.search({
            query: query,
            filters: filters
        });
    };

    var algoliaAPI = {
        search: search
    };

    return algoliaAPI;
};
