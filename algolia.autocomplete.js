(function() {
    var _ = function(elem, options) {
        var me = this;
        // MERGE OPTIONS WITH DEFAULT SETTINGS
        this._settings = merge({
            api: {},
            defaultFilter: 'Popular',
            defaultValue: 'true',
            highlightColor: 'yellow',
            modalWidth: 635,
            hits: 5,
            defaultHeader: '',
            resultsHeader: '',
            onSubmit: function() {}
        }, options);
        // GLOBAL DYNAMIC VARIABLES
        this.defaultResults = false;
        this.results = [];
        this.error = false;
        this.index = -1;
        this.modal = false;
        this.open = false;
        this.link = '';
        this.previousIndex = -1;
        // GLOBAL UNCHANGING VARIABLES
        this._input = $(elem);
        this.findForm(elem);
        this._clear = $('.btn-clear', elem.parentNode);
        this._ul = $('ul', elem.parentNode);
        this._closeContainer = $('.close', elem.parentNode);
        this._close = $('.btn-close', elem.parentNode);
        this._resultsHeader = $('.group', elem.parentNode);
        this._ddResults = $('.dropdown', elem.parentNode);
        this._more = $('.more', elem.parentNode);
        this._mResults = $('.modal', elem.parentNode);
        this._suggestions = $('.list', elem.parentNode);
        this._submit = $('.modal .button', elem.parentNode);
        this._ddError = $('.error.message', elem.parentNode);
        this._mError = $('.error.warning', elem.parentNode);
        this._shadow = document.createElement('div');
        this._shadow.className = 'shadow';
        this._api = this._settings.api();
        this._screen = screenInfo();

        // CLEAR SEARCH BAR ON PAGE LOAD
        this._input.value = '';
        //this.setDefault = this._settings.defaultFilter;
        // OBJECT TO HOLD ALL USER EVENT FUNCTIONS
        this._events = {
            input: {
                // HANDLES UP/DOWN/ENTER/TAB/ESC
                "keydown": function(e) {
                    var key = e.keyCode;
                    // CHECK IF DROPDOWN IS VISIBLE
                    if (me.open) {
                        if (key === 38 || key === 40) {
                            // DOWN/UP
                            e.preventDefault();
                            me.move(key === 38 ? "previous" : "next");
                        } else if (key === 13 || key === 9) {
                            // ENTER/TAB
                            e.preventDefault();
                            // CHECK IF A SUGGESTIONS IS HIGHLIGHTED
                            if (me.index > -1) {
                                var li = $$('li', me._ddResults);
                                me.link = li[me.index].getAttribute('data-href');
                                // IF SUGGESTION IS CHOSEN INSERT INTO INPUT AND CLOSE DROPDOWN
                                if (me.link) {
                                    me.close();
                                } else {
                                    // IF MORE IS CHOSEN OPEN MODAL WITH FULL LIST OF SUGGESTIONS
                                    me.showModal();
                                }
                            // IF NO SUGGESTION IS HIGHLIGHTED
                            } else if (me.hasResults) {
                                // IF THERE'S ONLY 1 SUGGESTION INSERT IT AND CLOSE DROPDOWN
                                me.showModal();
                            } else if (me.open) {
                                me.error = true;
                                me.showModal();
                            }
                        } else if (key === 27) {
                            // ESC
                            me.close();
                        }
                    // IF DROPDOWN IS CLOSED
                    } else if (key === 13) {
                        // ENTER
                        e.preventDefault();
                        me.submitForm(me.link);
                    }
                },
                // HANDLES INPUT
                "input": function() {
                    if (me.query !== '') {
                        //me.defaultResults = false;
                        show(me._clear);
                        addClass(me._ul, 'dropdown');
                        me.search();
                    } else if (!me.modal) {
                        //me.defaultResults = true;
                        clearStyle(me._clear);
                        me._ul.className = '';
                        me.close();
                    }
                },
                // HANDLES USER FOCUS ON AUTOCOMPLETE INPUT
                "focus": function(e) {
                    var tgt = e.target;
                    // SHOW CLEAR BUTTON
                    if (tgt.value !== '') show(me._clear);
                    // SHOW DEFAULT RESULTS IF NOTHING IS ENTERED
                    if (tgt.value === '') {
                        //if (tgt.value === '' && me._default.length > 0) {
                        //me.defaultResults = true;
                        //me.showResults(me._default);
                        me.error = false;
                        me.close();
                    } else if (me.hasResults) {
                        me.showResults(me.results);
                    }
                }
            },
            form: {
                // HANDLES FORM SUBMISSION
                "submit": function(e) {
                    console.log("submit");
                    e.preventDefault();
                    // CHECK IF VALID
                    if (me.valid) {
                        // SUBMIT FORM
                        me.submitForm(me.link);
                    // IF THERE ARE NON DEFAULT RESULTS
                    } else if (me.hasResults && !me.defaultResults) {
                        // IF ONLY 1 RESULT
                        if (me.results.length === 1) {
                            // CLOSE DROPDOWN AND INSERT SELECTION
                            me.inputValue(me.results[0].Service);
                            me.link = me.results[0].URL;
                            me.close();
                        } else {
                            // IF HAS MORE THAN 1 RESULT AND DROPDOWN OPEN
                            if (me.open) {
                                // SHOW RESULTS MODAL
                                me.showModal();
                            } else {
                                // SHOW RESULTS DROPDOWN
                                me.showResults(me.results);
                            }
                        }
                    } else {
                        // SHOW DROPDOWN WITH ERROR MESSAGE
                        if (me.open && !me.defaultResults) {
                            me.error = true;
                        }
                        me.noResults();
                    }
                }
            },
            ul: {
                // HANDLES MAKING SELECTION OF SEARCH RESULTS
                "click": function(e) {
                    var tgt = e.target,
                        cls = tgt.className,
                        parent = tgt.parentNode;

                    if (cls.indexOf('browse') === -1) e.stopPropagation();
                    // LEFT CLICK OR TOUCH
                    if (e.which === 1) {
                        // USER CLICKED A SUGGESTION
                        if (cls.indexOf('suggestion') !== -1 || parent.className.indexOf('suggestion') !== -1) {
                            me.link = tgt.getAttribute('data-href') || parent.getAttribute('data-href') || '';
                            var li = cls.indexOf('suggestion') !== -1 ? tgt : parent;
                            // IF MODAL IS OPEN
                            if (me.modal) {
                                // REMOVE PREVIOUSLY SELECTED LI IF PRESENT
                                var selected = $('.suggestion.selected');
                                if (selected) selected.className = "suggestion";
                                // ADD SELECTION CLASS TO CHOSEN LI
                                li.className = 'suggestion selected';
                                // REMOVE ANY VALIDATION ERROR
                                me.validationError(false);
                            // IF MODAL IS CLOSED
                            } else {
                                // IF LINK IS CHOSEN
                                if (me.valid) {
                                    // SET INPUT VALUE
                                    me.inputValue(li.innerText);
                                    // CLOSE MODAL
                                    me.close();
                                    // FOCUS ON INPUT
                                    setTimeout(function() {
                                        me._input.focus();
                                        me.submitForm(me.link);
                                    });
                                // IF NO LINK IS CHOSEN
                                } else {
                                    // SHOW ERROR MODAL
                                    me.showModal();
                                }
                            }
                        // USER CLICKS SEARCH AGAIN OR BROWSE LINK IN ERROR MODAL
                        } else if (cls.indexOf('close-modal') !== -1 || cls.indexOf('browse') !== -1) {
                            me.close();
                            me.closeModal();
                            me.open = false;
                            me.error = false;
                            if (cls.indexOf('close-modal') !== -1) {
                                me._input.focus();
                            }
                        } else if (!me.modal) {
                            me.showModal();
                        }
                    }
                },
                // FIX MOBILE USER SCROLLING THE PAGE ON THE UL
                "touchmove": function(e) {
                    me._input.blur();
                }
            },
            clear: {
                // HANDLES CLEAR INPUT BUTTON
                "click": function(e) {
                    e.stopPropagation();
                    clearStyle(me._clear);
                    me.inputValue('');
                    me.link = '';
                    me.results = [];
                    me._input.select();
                }
            },
            close: {
                // HANDLES MODAL CLOSE BUTTON
                "click": function(e) {
                    e.stopPropagation();
                    me.closeModal();
                    me.open = false;
                }
            },
            body: {
                // DELEGATE UNFOCUS EVENT TO BODY CLICKING/TOUCHING FOR MORE CONTROL
                "click touchstart": function(e) {
                    if (e.target !== me._input && e.target.type !== "submit") {
                        if (!me.error && !isDescendant(me._form, e.target) && !me.modal) {
                            if (me.open) me.close();
                            clearStyle(me._clear);
                            me._input.blur();
                        }
                    }
                }
            },
            modal: {
                // MODAL SUBMIT BUTTON
                "click": function(e) {
                    e.stopPropagation();
                    e.preventDefault();
                    var selected = $('.suggestion.selected');
                    if (selected && me.link) me.submitForm(me.link);
                    else me.validationError(true);
                }
            }
        };

        // BIND ALL EVENTS TO THEIR RESPECTIVE ELEMENTS
        bind(this._input, this._events.input);
        bind(this._ul, this._events.ul);
        bind(this._form, this._events.form);
        bind(this._clear, this._events.clear);
        bind(this._close, this._events.close);
        bind(this._submit, this._events.modal);
        bind(window, this._events.window);
        bind(document.body, this._events.body);
        bind(this._shadow, this._events.close);
    };

    _.prototype = {
        // ARE THERE RESULTS AVAILABLE
        get hasResults() {
            return this.results.length ? true : false;
        },
        // IS THERE A LINK TO SEND THE USER TO
        get valid() {
            return this.link !== '';
        },
        // IS THERE ANY TEXT IN THE INPUT
        get query() {
            return this._input.value;
        },
        // SET DEFAULT RESULTS FOR AN EMPTY SEARCH INPUT
        set setDefault(query) {
            this._api.search('', query + ':' + this._settings.defaultValue)
                .then(function(content) {
                    this._default = content.hits;
                }.bind(this))
                .catch(function(err) {
                    console.log(err);
                });
        },
        // CLOSE DROPDOWN
        close: function() {
            // Fixed form submit when default results are showing KEEP FOR REFERENCE
            // this.defaultResults = false;
            this.index = -1;
            this.open = false;
            this._ddResults.innerHTML = '<ul></ul>';
            clearStyle(this._ul);
            this._ul.className = '';
        },
        // CLOSE MODAL
        closeModal: function () {
            // ADD NOSCROLL CLASS TO BODY
            var body = document.body;
            body.className = body.className.replace(/\bnoScroll\b/, '');
            // SET ALL NECESSARY VARIABLES
            this.error = false;
            this.link = '';
            this.modal = false;
            // HIDE ALL OF THE NECESSARY ELEMENTS
            this._form.removeChild(this._shadow);
            // REMOVE MODAL VALIDATION ERROR
            removeClass($('.btnContainer'), 'invalid');
            // HIDE UL
            this._ul.className = '';
            clearStyle(this._ul);
            this._input.focus();
        },
        // LOCATE FORM
        findForm: function(elem) {
            var parent = elem.parentNode,
                tag = parent.tagName;

            if (parent) {
                if (tag === 'FORM') {
                    this._form = parent;
                } else {
                    this.findForm(parent);
                }
            } else {
                console.log("Error: you need a form element.");
            }
        },
        // HIGHLIGHT SUGGESTION IN DROPDOWN
        highlight: function(index, color) {
            var children = this._ddResults.querySelector('ul').children;
            color = color ? color : '';

            if (index > -1 && children.length > 0)
                children[index].style.backgroundColor = color;
        },
        // SET INPUT VALUE TO GIVEN VALUE
        inputValue: function(text) {
            this._input.value = text;
        },
        // MOVE HIGHLIGHT IN DROPDOWN LIST USING ARROWS
        move: function (direction) {
            var children = this._ddResults.querySelector('ul').children;
            this.setIndex(direction);
            if (this.previousIndex > -1) this.highlight(this.previousIndex);
            this.highlight(this.index, this._settings.highlightColor);
            if (children[this.index].getAttribute('data-href')) {
                this.inputValue(children[this.index].textContent);
                show(this._clear);
            } else {
                this.inputValue('');
                clearStyle(this._clear);
            }
        },
        // SHOW NO RESULTS DROPDOWN
        noResults: function() {
            if (this.error) {
                this.showModal();
            } else {
                this.link = '';
                this.results = [];
                this.defaultResults = false;
                this.open = true;
                removeClass(this._ul, 'success');
                addClass(this._ul, 'dropdown');
                addClass(this._ul, 'error');
                hide(this._resultsHeader);
            }
        },
        // SEARCH INDEX WITH INPUT QUERY WITH FILTER
        search: function() {
            var query = this.query,
                settings = this._settings;

            if (!this.defaultResults) {
                this.index = -1;
                this._api.search(query, 'NOT ' + settings.defaultFilter + ':' + settings.defaultValue)
                    .then(function(results) {
                        if (results.hits.length) {
                            this.showResults(results.hits);
                        } else {
					        this.noResults();
					    }
					}.bind(this))
					.catch(function(err) {
					    console.log(err);
					});
            } else {
                this.showResults(this._default);
            }
        },
        // DETERMINE SUGGESTION INDEX IN DROPDOWN TO
        // INCREMENT/DECREMENT CORRECTLY WHEN USING ARROWS
        setIndex: function(direction) {
            var i = this.index,
				count = this._ddResults.querySelector('ul').children.length;

            if (direction === 'next') {
                this.index = (i === count - 1) ? 0 : i + 1;
            } else {
                this.index = (i === -1 || i === 0) ? count - 1 : i - 1;
            }
            this.previousIndex = i;
        },
        // SHOW NECESSARY RESULTS HEADER
        showHeader: function () {
            var header = this.defaultResults ? 'default' : 'results';
            if (this._settings[header + 'Header'] !== '') {
                this._resultsHeader.innerHTML = this._settings[header + 'Header'];
                show(this._resultsHeader);
            } else {
                hide(this._resultsHeader);
            }
        },
        // SHOW ERROR/SUGGESTIONS MODAL
        showModal: function() {
            document.body.className += ' noScroll';
            this.modal = true;
            this._input.blur();
            var ul = this._ul,
                elem = getElementInfo(ul),
                difference = (this._screen.width / 2) - (this._settings.modalWidth / 2),
                left = difference > 0 ? difference : 0,
                mobileWidth = difference > 0 ? '' : 'width: 100%;';
            // CHANGE UL TO FIXED POSITIONING TO TRANSITION INTO MODAL SMOOTHLY
            ul.className = 'fixed';
            ul.setAttribute('style', 'left: ' + elem.left + 'px; top: ' + elem.top + 'px; width: ' + elem.width + 'px; height: ' + elem.height + 'px;');
            // SHOW SHADOW
            this._form.appendChild(this._shadow);
            setTimeout(function() {
                // REPOSITION UL 
                ul.setAttribute('style', 'left: ' + left + 'px;' + mobileWidth);
                ul.className = 'fixed transition';
                // IF THERE'S AN ERROR SHOW ERROR MODAL
                if (this.error) {
                    ul.className = 'fixed transition error';
                } else {
                    // SHOW RESULTS MODAL
                    this._suggestions.innerHTML = this.suggestions(this.results);
                    ul.className = 'fixed transition success';
                    // SIMULATE LOADING
                    setTimeout(function() {
                        ul.className = 'fixed transition success loaded';
                    }, 500);
                }
            }.bind(this), 100);
        },
        // SHOW DROPDOWN RESULTS
        showResults: function (results) {
            this.showHeader();
            this._ddResults.innerHTML = this.suggestions(results, this._settings.hits);
            addClass(this._ul, 'dropdown');
            addClass(this._ul, 'success');
            removeClass(this._ul, 'error');
        },
        // SEND USER TO CORRECT PAGE
        submitForm: function(url) {
            var value = this.query,
                l = window.location;

            if (value && url) {
                this._settings.onSubmit();
                l.href = url;
            } else {
                this.noResults();
            }
        },
        // GENERATE SUGGESTIONS LIST HTML
        suggestions: function(content, limit) {
            var html = '<ul>';
            content = content ? content : [];
            limit = limit || 0;
            limit = (limit > 0 && limit < content.length) ? limit : content.length;
            this.results = content;
            this.open = content.length ? true : false;

            if (Array.isArray(content) && content.length > 0) {
                this.error = false;
                for (var i = 0; i < limit; i++) {
                    var r = content[i];
                    var service = this.defaultResults ? r.Service : r._highlightResult.Service.value;
                    html += '<li class="suggestion" data-href="' + r.URL + '">' + service + '</li>';
                }
                if (content.length > limit) html += '<li class="more">View More</li>';
            }

            html += '</ul>';
            return html;
        },
        // SHOW/REMOVE MODAL VALIDATION ERROR
        validationError: function(error) {
            var container = $('.btnContainer');
            if (error) {
                addClass(container, 'invalid');
            } else {
                removeClass(container, 'invalid');
            }
        }
    };

    // UTILITY FUNCTIONS
    //-----------------------------------------------------------------------------------------------------------------------------------
    // RETURN SINGLE ELEMENT
    function $(expr, container) {
        return typeof expr === "string" ? (container || document).querySelector(expr) : expr || null;
    }
    // RETURN LIST OF ELEMENTS
    function $$(expr, container) {
        var slice = Array.prototype.slice;
        return slice.call((container || document).querySelectorAll(expr));
    }
    // BIND ELEMENTS TO EVENT LISTENERS
    function bind(element, events) {
        if (element) {
            for (var event in events) {
                var callback = events[event];

                event.split(/\s+/).forEach(function(event) {
                    element.addEventListener(event, callback);
                });
            }
        }
    }
    // ADD CLASS TO ELEMENT
    function addClass(elem, cls) {
        var classes = elem.className,
            present = elem.className.indexOf(cls) !== -1 ? true : false;

        if (!present) {
            if (classes === '') {
                elem.className = cls;
            } else {
                elem.className = classes + ' ' + cls;
            }
        }
    }
    // REMOVE CLASS FROM ELEMENT
    function removeClass(elem, cls) {
        var classes = elem.className,
            present = elem.className.indexOf(cls) !== -1 ? true : false;
        if (present) {
            if (classes === cls) elem.className = '';
            else elem.className = elem.className.replace(' ' + cls, '');
        }
    }
    // EMPTY STYLE ATTRIBUTE FOR ELEMENT
    function clearStyle(elem) {
        elem.setAttribute('style', '');
    }
    // SET ELEMENT STYLE ATTRIBUTE TO DISPLAY NONE
    function hide(elem) {
        elem.setAttribute('style', 'display: none;')
    }
    // SET ELEMENT STYLE ATTRIBUTE TO DISPLAY BLOCK
    function show(elem) {
        elem.setAttribute('style', 'display: block;');
    }
    // GET ELEMENT SIZE AND POSITION INFORMATION
    function getElementInfo(elem) {
        var rect = elem.getBoundingClientRect(),
            left = rect.left,
            top = rect.top,
            height = rect.height,
            width = rect.width;

        return { height: height, left: left, top: top, width: width };
    }
    // GET SCREEN SIZE
    function screenInfo() {
        var w = window,
            d = document,
            e = d.documentElement,
            g = d.getElementsByTagName('body')[0],
            x = w.innerWidth || e.clientWidth || g.clientWidth,
            y = w.innerHeight || e.clientHeight || g.clientHeight;

        return { height: y, width: x };
    }
    // CHECK IF PARENT CONTAINS CHILD
    function isDescendant(parent, child) {
        var node = child.parentNode;
        while (node != null) {
            if (node == parent) {
                return true;
            }
            node = node.parentNode;
        }
        return false;
    }
    // MERGE SETTINGS AND OPTIONS OBJECTS
    function merge(original, options) {
        if (original !== options) {
            var merged = {};

            for (i in original) {
                if (options.hasOwnProperty(i) && original[i] !== options[i]) {
                    merged[i] = options[i];
                } else {
                    merged[i] = original[i];
                }
            }
            return merged;
        } else {
            return original;
        }
    }
    // INIT FUNCTION TO BE PASSED TO WINDOW
    _.init = function(elem, options) {
        var autocomplete = Object.create(_.prototype);
        _.call(autocomplete, elem, options);
    };

    if (typeof self !== "undefined") {
        self.autocomplete = _.init;
    }

    return _.init;
})();
