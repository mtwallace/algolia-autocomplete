var slice = Array.prototype.slice;
var inputs = slice.call(document.querySelectorAll('.autocomplete input'));

inputs.forEach(function (elem) {
    autocomplete(elem,
    {
        api: algoliaSearch,
        defaultFilter: 'Popular',
        defaultValue: 'true',
        highlightColor: '#efefef',
        defaultHeader: 'Popular Services:'
    });
});
