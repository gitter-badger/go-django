/*
 Copyright 2014 Google Inc. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

!function (e) {
    if ("object" == typeof exports && "undefined" != typeof module)module.exports = e(); else if ("function" == typeof define && define.amd)define([], e); else {
        var o;
        "undefined" != typeof window ? o = window : "undefined" != typeof global ? o = global : "undefined" != typeof self && (o = self), o.toolbox = e()
    }
}(function () {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a)return a(o, !0);
                    if (i)return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {exports: {}};
                t[o][0].call(l.exports, function (e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }

        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++)s(r[o]);
        return s
    })({
        1: [function (require, module, exports) {
            "use strict";
            function cache(e, t) {
                return helpers.openCache(t).then(function (t) {
                    return t.add(e)
                })
            }

            function uncache(e, t) {
                return helpers.openCache(t).then(function (t) {
                    return t["delete"](e)
                })
            }

            function precache(e) {
                Array.isArray(e) || (e = [e]), options.preCacheItems = options.preCacheItems.concat(e)
            }

            require("serviceworker-cache-polyfill");
            var options = require("./options"), router = require("./router"), helpers = require("./helpers"), strategies = require("./strategies");
            helpers.debug("Service Worker Toolbox is loading");
            var flatten = function (e) {
                return e.reduce(function (e, t) {
                    return e.concat(t)
                }, [])
            };
            self.addEventListener("install", function (e) {
                var t = options.cacheName + "$$$inactive$$$";
                helpers.debug("install event fired"), helpers.debug("creating cache [" + t + "]"), e.waitUntil(helpers.openCache({cacheName: t}).then(function (e) {
                    return Promise.all(options.preCacheItems).then(flatten).then(function (t) {
                        return helpers.debug("preCache list: " + (t.join(", ") || "(none)")), e.addAll(t)
                    })
                }))
            }), self.addEventListener("activate", function (e) {
                helpers.debug("activate event fired");
                var t = options.cacheName + "$$$inactive$$$";
                e.waitUntil(helpers.renameCache(t, options.cacheName))
            }), self.addEventListener("fetch", function (e) {
                var t = router.match(e.request);
                t ? e.respondWith(t(e.request)) : router["default"] && e.respondWith(router["default"](e.request))
            }), module.exports = {
                networkOnly: strategies.networkOnly,
                networkFirst: strategies.networkFirst,
                cacheOnly: strategies.cacheOnly,
                cacheFirst: strategies.cacheFirst,
                fastest: strategies.fastest,
                router: router,
                options: options,
                cache: cache,
                uncache: uncache,
                precache: precache
            };
        }, {"./helpers": 2, "./options": 3, "./router": 5, "./strategies": 9, "serviceworker-cache-polyfill": 14}],
        2: [function (require, module, exports) {
            "use strict";
            function debug(e, n) {
                n = n || {};
                var c = n.debug || globalOptions.debug;
                c && console.log("[sw-toolbox] " + e)
            }

            function openCache(e) {
                e = e || {};
                var n = e.cacheName || globalOptions.cacheName;
                return debug('Opening cache "' + n + '"', e), caches.open(n)
            }

            function fetchAndCache(e, n) {
                n = n || {};
                var c = n.successResponses || globalOptions.successResponses;
                return fetch(e.clone()).then(function (t) {
                    return "GET" === e.method && c.test(t.status) && openCache(n).then(function (n) {
                        n.put(e, t)
                    }), t.clone()
                })
            }

            function renameCache(e, n, c) {
                return debug("Renaming cache: [" + e + "] to [" + n + "]", c), caches["delete"](n).then(function () {
                    return Promise.all([caches.open(e), caches.open(n)]).then(function (n) {
                        var c = n[0], t = n[1];
                        return c.keys().then(function (e) {
                            return Promise.all(e.map(function (e) {
                                return c.match(e).then(function (n) {
                                    return t.put(e, n)
                                })
                            }))
                        }).then(function () {
                            return caches["delete"](e)
                        })
                    })
                })
            }

            var globalOptions = require("./options");
            module.exports = {
                debug: debug,
                fetchAndCache: fetchAndCache,
                openCache: openCache,
                renameCache: renameCache
            };
        }, {"./options": 3}],
        3: [function (require, module, exports) {
            "use strict";
            var scope;
            scope = self.registration ? self.registration.scope : self.scope || new URL("./", self.location).href, module.exports = {
                cacheName: "$$$toolbox-cache$$$" + scope + "$$$",
                debug: !1,
                networkTimeoutSeconds: null,
                preCacheItems: [],
                successResponses: /^0|([123]\d\d)|(40[14567])|410$/
            };
        }, {}],
        4: [function (require, module, exports) {
            "use strict";
            var url = new URL("./", self.location), basePath = url.pathname, pathRegexp = require("path-to-regexp"), Route = function (e, t, i, s) {
                0 !== t.indexOf("/") && (t = basePath + t), this.method = e, this.keys = [], this.regexp = pathRegexp(t, this.keys), this.options = s, this.handler = i
            };
            Route.prototype.makeHandler = function (e) {
                var t = this.regexp.exec(e), i = {};
                return this.keys.forEach(function (e, s) {
                    i[e.name] = t[s + 1]
                }), function (e) {
                    return this.handler(e, i, this.options)
                }.bind(this)
            }, module.exports = Route;
        }, {"path-to-regexp": 12}],
        5: [function (require, module, exports) {
            "use strict";
            function regexEscape(e) {
                return e.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")
            }

            var Route = require("./route"), keyMatch = function (e, t) {
                for (var r = e.entries(), o = r.next(); !o.done;) {
                    var n = new RegExp(o.value[0]);
                    if (n.test(t))return o.value[1];
                    o = r.next()
                }
                return null
            }, Router = function () {
                this.routes = new Map, this["default"] = null
            };
            ["get", "post", "put", "delete", "head", "any"].forEach(function (e) {
                Router.prototype[e] = function (t, r, o) {
                    return this.add(e, t, r, o)
                }
            }), Router.prototype.add = function (e, t, r, o) {
                o = o || {};
                var n = o.origin || self.location.origin;
                n = n instanceof RegExp ? n.source : regexEscape(n), e = e.toLowerCase();
                var u = new Route(e, t, r, o);
                this.routes.has(n) || this.routes.set(n, new Map);
                var a = this.routes.get(n);
                a.has(e) || a.set(e, new Map);
                var s = a.get(e);
                s.set(u.regexp.source, u)
            }, Router.prototype.matchMethod = function (e, t) {
                t = new URL(t);
                var r = t.origin, o = t.pathname;
                e = e.toLowerCase();
                var n = keyMatch(this.routes, r);
                if (!n)return null;
                var u = n.get(e);
                if (!u)return null;
                var a = keyMatch(u, o);
                return a ? a.makeHandler(o) : null
            }, Router.prototype.match = function (e) {
                return this.matchMethod(e.method, e.url) || this.matchMethod("any", e.url)
            }, module.exports = new Router;
        }, {"./route": 4}],
        6: [function (require, module, exports) {
            "use strict";
            function cacheFirst(e, r, t) {
                return helpers.debug("Strategy: cache first [" + e.url + "]", t), helpers.openCache(t).then(function (r) {
                    return r.match(e).then(function (r) {
                        return r ? r : helpers.fetchAndCache(e, t)
                    })
                })
            }

            var helpers = require("../helpers");
            module.exports = cacheFirst;
        }, {"../helpers": 2}],
        7: [function (require, module, exports) {
            "use strict";
            function cacheOnly(e, r, c) {
                return helpers.debug("Strategy: cache only [" + e.url + "]", c), helpers.openCache(c).then(function (r) {
                    return r.match(e)
                })
            }

            var helpers = require("../helpers");
            module.exports = cacheOnly;
        }, {"../helpers": 2}],
        8: [function (require, module, exports) {
            "use strict";
            function fastest(e, n, t) {
                return helpers.debug("Strategy: fastest [" + e.url + "]", t), new Promise(function (n, r) {
                    var s = !1, c = [], o = function (e) {
                        c.push(e.toString()), s ? r(new Error('Both cache and network failed: "' + c.join('", "') + '"')) : s = !0
                    }, a = function (e) {
                        e instanceof Response ? n(e) : o("No result returned")
                    };
                    helpers.fetchAndCache(e.clone(), t).then(a, o), cacheOnly(e, t).then(a, o)
                })
            }

            var helpers = require("../helpers"), cacheOnly = require("./cacheOnly");
            module.exports = fastest;
        }, {"../helpers": 2, "./cacheOnly": 7}],
        9: [function (require, module, exports) {
            module.exports = {
                networkOnly: require("./networkOnly"),
                networkFirst: require("./networkFirst"),
                cacheOnly: require("./cacheOnly"),
                cacheFirst: require("./cacheFirst"),
                fastest: require("./fastest")
            };
        }, {"./cacheFirst": 6, "./cacheOnly": 7, "./fastest": 8, "./networkFirst": 10, "./networkOnly": 11}],
        10: [function (require, module, exports) {
            "use strict";
            function networkFirst(e, r, t) {
                t = t || {};
                var s = t.successResponses || globalOptions.successResponses, o = t.networkTimeoutSeconds || globalOptions.networkTimeoutSeconds;
                return helpers.debug("Strategy: network first [" + e.url + "]", t), helpers.openCache(t).then(function (r) {
                    var n, u = [];
                    if (o) {
                        var c = new Promise(function (t) {
                            n = setTimeout(function () {
                                r.match(e).then(function (e) {
                                    e && t(e)
                                })
                            }, 1e3 * o)
                        });
                        u.push(c)
                    }
                    var i = helpers.fetchAndCache(e, t).then(function (e) {
                        if (n && clearTimeout(n), s.test(e.status))return e;
                        throw helpers.debug("Response was an HTTP error: " + e.statusText, t), new Error("Bad response")
                    })["catch"](function () {
                        return helpers.debug("Network or response error, fallback to cache [" + e.url + "]", t), r.match(e)
                    });
                    return u.push(i), Promise.race(u)
                })
            }

            var globalOptions = require("../options"), helpers = require("../helpers");
            module.exports = networkFirst;
        }, {"../helpers": 2, "../options": 3}],
        11: [function (require, module, exports) {
            "use strict";
            function networkOnly(e, r, t) {
                return helpers.debug("Strategy: network only [" + e.url + "]", t), fetch(e)
            }

            var helpers = require("../helpers");
            module.exports = networkOnly;
        }, {"../helpers": 2}],
        12: [function (require, module, exports) {
            function parse(e) {
                for (var t, r = [], n = 0, o = 0, p = ""; null != (t = PATH_REGEXP.exec(e));) {
                    var a = t[0], i = t[1], s = t.index;
                    if (p += e.slice(o, s), o = s + a.length, i)p += i[1]; else {
                        p && (r.push(p), p = "");
                        var u = t[2], c = t[3], l = t[4], f = t[5], g = t[6], x = t[7], h = "+" === g || "*" === g, m = "?" === g || "*" === g, y = u || "/", T = l || f || (x ? ".*" : "[^" + y + "]+?");
                        r.push({
                            name: c || n++,
                            prefix: u || "",
                            delimiter: y,
                            optional: m,
                            repeat: h,
                            pattern: escapeGroup(T)
                        })
                    }
                }
                return o < e.length && (p += e.substr(o)), p && r.push(p), r
            }

            function compile(e) {
                return tokensToFunction(parse(e))
            }

            function tokensToFunction(e) {
                for (var t = new Array(e.length), r = 0; r < e.length; r++)"object" == typeof e[r] && (t[r] = new RegExp("^" + e[r].pattern + "$"));
                return function (r) {
                    for (var n = "", o = r || {}, p = 0; p < e.length; p++) {
                        var a = e[p];
                        if ("string" != typeof a) {
                            var i, s = o[a.name];
                            if (null == s) {
                                if (a.optional)continue;
                                throw new TypeError('Expected "' + a.name + '" to be defined')
                            }
                            if (isarray(s)) {
                                if (!a.repeat)throw new TypeError('Expected "' + a.name + '" to not repeat, but received "' + s + '"');
                                if (0 === s.length) {
                                    if (a.optional)continue;
                                    throw new TypeError('Expected "' + a.name + '" to not be empty')
                                }
                                for (var u = 0; u < s.length; u++) {
                                    if (i = encodeURIComponent(s[u]), !t[p].test(i))throw new TypeError('Expected all "' + a.name + '" to match "' + a.pattern + '", but received "' + i + '"');
                                    n += (0 === u ? a.prefix : a.delimiter) + i
                                }
                            } else {
                                if (i = encodeURIComponent(s), !t[p].test(i))throw new TypeError('Expected "' + a.name + '" to match "' + a.pattern + '", but received "' + i + '"');
                                n += a.prefix + i
                            }
                        } else n += a
                    }
                    return n
                }
            }

            function escapeString(e) {
                return e.replace(/([.+*?=^!:${}()[\]|\/])/g, "\\$1")
            }

            function escapeGroup(e) {
                return e.replace(/([=!:$\/()])/g, "\\$1")
            }

            function attachKeys(e, t) {
                return e.keys = t, e
            }

            function flags(e) {
                return e.sensitive ? "" : "i"
            }

            function regexpToRegexp(e, t) {
                var r = e.source.match(/\((?!\?)/g);
                if (r)for (var n = 0; n < r.length; n++)t.push({
                    name: n,
                    prefix: null,
                    delimiter: null,
                    optional: !1,
                    repeat: !1,
                    pattern: null
                });
                return attachKeys(e, t)
            }

            function arrayToRegexp(e, t, r) {
                for (var n = [], o = 0; o < e.length; o++)n.push(pathToRegexp(e[o], t, r).source);
                var p = new RegExp("(?:" + n.join("|") + ")", flags(r));
                return attachKeys(p, t)
            }

            function stringToRegexp(e, t, r) {
                for (var n = parse(e), o = tokensToRegExp(n, r), p = 0; p < n.length; p++)"string" != typeof n[p] && t.push(n[p]);
                return attachKeys(o, t)
            }

            function tokensToRegExp(e, t) {
                t = t || {};
                for (var r = t.strict, n = t.end !== !1, o = "", p = e[e.length - 1], a = "string" == typeof p && /\/$/.test(p), i = 0; i < e.length; i++) {
                    var s = e[i];
                    if ("string" == typeof s)o += escapeString(s); else {
                        var u = escapeString(s.prefix), c = s.pattern;
                        s.repeat && (c += "(?:" + u + c + ")*"), c = s.optional ? u ? "(?:" + u + "(" + c + "))?" : "(" + c + ")?" : u + "(" + c + ")", o += c
                    }
                }
                return r || (o = (a ? o.slice(0, -2) : o) + "(?:\\/(?=$))?"), o += n ? "$" : r && a ? "" : "(?=\\/|$)", new RegExp("^" + o, flags(t))
            }

            function pathToRegexp(e, t, r) {
                return t = t || [], isarray(t) ? r || (r = {}) : (r = t, t = []), e instanceof RegExp ? regexpToRegexp(e, t, r) : isarray(e) ? arrayToRegexp(e, t, r) : stringToRegexp(e, t, r)
            }

            var isarray = require("isarray");
            module.exports = pathToRegexp, module.exports.parse = parse, module.exports.compile = compile, module.exports.tokensToFunction = tokensToFunction, module.exports.tokensToRegExp = tokensToRegExp;
            var PATH_REGEXP = new RegExp(["(\\\\.)", "([\\/.])?(?:(?:\\:(\\w+)(?:\\(((?:\\\\.|[^()])+)\\))?|\\(((?:\\\\.|[^()])+)\\))([+*?])?|(\\*))"].join("|"), "g");
        }, {"isarray": 13}],
        13: [function (require, module, exports) {
            module.exports = Array.isArray || function (r) {
                    return "[object Array]" == Object.prototype.toString.call(r)
                };
        }, {}],
        14: [function (require, module, exports) {
            Cache.prototype.addAll || (Cache.prototype.addAll = function (t) {
                function e(t) {
                    this.name = "NetworkError", this.code = 19, this.message = t
                }

                var r = this;
                return e.prototype = Object.create(Error.prototype), Promise.resolve().then(function () {
                    if (arguments.length < 1)throw new TypeError;
                    return t = t.map(function (t) {
                        return t instanceof Request ? t : String(t)
                    }), Promise.all(t.map(function (t) {
                        "string" == typeof t && (t = new Request(t));
                        var r = new URL(t.url).protocol;
                        if ("http:" !== r && "https:" !== r)throw new e("Invalid scheme");
                        return fetch(t.clone())
                    }))
                }).then(function (e) {
                    return Promise.all(e.map(function (e, n) {
                        return r.put(t[n], e)
                    }))
                }).then(function () {
                    return void 0
                })
            });
        }, {}]
    }, {}, [1])(1)
});


//# sourceMappingURL=sw-toolbox.map.json