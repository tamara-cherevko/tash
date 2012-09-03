/**
 * @author Sergey Onenko
 * @version 0.0.1
 */
/**
 * @function
 * @namespace
 * @description onDocument Ready realization OR CSS selector
 */
window.S = function (what) {
//    'use strict';
    var cycle;
    /**
     * @function Launches cycle for retrying read scripts or not ready
     */
    function isScriptsLoaded() {
        if (!cycle) {
            cycle = setInterval(function () {
                if (S.resources_manager.loading.length === 0 && S.temp.win_loaded === 1) {
                    clearInterval(cycle);
                    setTimeout(function () {
                        what();
                    }, 0);
                }
            }, 1);
        }
    }
    if (!what) { // NO ARGUMENTS
        throw "no arguments?";
    } else if (typeof what === 'string') { // STRING ARGUMENT - GO SELECTOR
        return Array.prototype.slice.apply(document.querySelectorAll(what), [0]);
    } else { // FUNCTION - WINDOW.ONLOAD
        if (!S.temp.win_loaded) {
            window.addEventListener('load', function () {
                S.temp.win_loaded = 1;
                isScriptsLoaded();
            });
        } else {
            isScriptsLoaded();
        }
    }
    return false;
};
/**
 * @function
 * @namespace S.core.Object
 * @description creates new object from 2 ones.
 * @param {object} base parent object
 * @param {object} overrides child object
 * @param {boolean} create_new create new object or override current
 * @return new overridden object
 */
S.override = function (base, overrides, create_new) {
    var new_object = create_new === true ? {} : base,
        i = 0,
        keys =  Object.keys(base),
        overrides_keys = Object.keys(overrides),
        overrides_len = overrides_keys.length,
        len;
    for (; i < overrides_len; i++) {
        if (keys.indexOf(overrides_keys[i]) === -1) {
            keys.push(overrides_keys[i]);
        }
    }
    len = keys.length;
    for (i = 0; i < len; i++) {
        var key = keys[i];
        new_object[key] = overrides[key] || base[key];
    }
    return new_object;
}(S, {
    /**
     * @description library config
     */
    config: {
        /**
         * @property {boolean} cachable
         * @property {object} paths uses in library, it is using in namespace to way converting
         */
        cachable: 0,
        path: {
            /**
             * @property {string} S - library path
             */
            S: (function () {
                var scripts = document.getElementsByTagName("script"),
                    src = scripts[scripts.length - 1].src,
                    path = src.substr(0, src.lastIndexOf('/') + 1);
                return path + 'src/';
            }()),
            /**
             * @property {string} S - styles path
             */
            css: (function () {
                var scripts = document.getElementsByTagName("script"),
                    src = scripts[scripts.length - 1].src,
                    path = src.substr(0, src.lastIndexOf('/') + 1);
                return path + 'css/';
            }())

        }
    },
    /**
     * @property {object} temp local temp property for collecting temp variables
     */
    temp: {},
    /**
     * @function
     * @memberOf S
     * @description secured creating namespace
     * @param {string} name string for needed to create namespace (examples: 'S.component.Window' or 'component.Window')
     * @param {function} value - if value exists - namespace value applys.
     * @return namespace link
     */
    namespace: function (name, value) {
        var path = name.split('.'),
            len = path.length + 1;
        path.unshift(window);
        for (var i = 1; i < len; i++) {
            if (!path[i-1][path[i]]) {
                if (i === len - 1 && value && (typeof value === "function" || Array.isArray(value))) {
                     path[i-1][path[i]] = value;
                } else {
                    path[i-1][path[i]] = {};
                }
            }
            // create property if it not already exists
            path[i] = path[i-1][path[i]];
        }
        return path.pop();
    },
    /**
     * @function
     * @memberOf S
     * @description secured creating namespace
     * @param {string} name class namespace
     * @return {function} Class link
     */
    getClass: function (name) {
        var path = name.split('.'),
            len = path.length + 1,
            i;
        path.unshift(window);
        for (i = 1; i < len; i++) {
            if (!path[i-1][path[i]]) {
                return false;
            }
            path[i] = path[i-1][path[i]];
        }
        return path.pop();
    },
    /**
     * @namespace
     * @memberOf S
     * @description contains whole needed for adding scripts to index file
     */
    resources_manager: {
        /**
         * @property {Array} loading
         */
        loading: [],
        /*
         * @property {Array} loaded - loaded scripts array
         */
        loaded: [],
        /**
         * @function registerLoaded
         * @description registers script as loaded
         */
        registerLoaded: function (namespace) {
            S.resources_manager.loaded.push(namespace);
            S.resources_manager.loading.splice(S.resources_manager.loading.indexOf(namespace));
        },
        /**
         * @function registerLoading
         * @description registers script as loading
         */
        registerLoading: function (namespace) {
            S.resources_manager.loading.push(namespace);
        },
        /**
         * @memberOf S.resources_manager
         * @param {string} path to style
         * @description includes link to index.html head
         */
        includeStyle: function (path) {
            var el, addon;
            function checkIfStyleLoaded (path) {
                var styles = document.styleSheets,
                    i = 0,
                    to_return = false;
                for (; i < styles.length; i++) {
                    if (styles[i].href && styles[i].href.indexOf(path) !== -1) {
                        to_return = true;
                        break;
                    }
                }
                return to_return;
            }
            if (!checkIfStyleLoaded(path)) {
                el = document.createElement('link')
                addon = (S.config.cachable === 1) ? '' : S.resources_manager.catchAddon();
                // override
                S.addParams(el, {
                    rel: 'stylesheet',
                    href: path + addon
                });
                document.head.insertBefore(el, document.head.getElementsByTagName('script')[0]);
            }
            return this;
        },
        /**
         * @memberOf S.resources_manager
         * @param {string} way path to script for including
         * @description includes script to index.html head
         */
        include: function (way) {
            var dom = document.createElement('script');
            dom.src = way;
            if (S.config.cachable !== 1) {
                dom.src += this.catchAddon();
            }
            document.head.appendChild(dom);
        },
        /**
         * @memberOf S.resources_manager
         * @description checks script for existing in index.html head
         * @param {string} way path to file
         * @return {boolean} true - if script already included, false - if not yet
         */
        isIncluded: function (way) {
            var scripts = document.head.getElementsByTagName('script');
            for (var key in scripts) {
                if (scripts[key].src && scripts[key].src.indexOf(way) !== -1) {
                    return true;
                }
            }
            return false;
        },
        /**
         * @function isLoading
         * @description getter of current loading script status
         * @param {string} namespace - namespace for script
         * @return {boolean} true if loading false in no
         */
        isLoading: function (namespace) {
            return S.resources_manager.loading.indexOf(namespace) >= 0;
        },
        /**
         * @function isLoaded
         * @description getter of current loaded script status
         * @param {string} namespace - namespace for script
         * @return {boolean} true if loaded false in no
         */
        isLoaded: function (namespace) {
            return S.resources_manager.loaded.indexOf(namespace) >= 0;
        },
        /**
         * @memberOf S.resources_manager
         * @description includes script if it's not included yet
         * @param {string} way path to file for including
         */
        includeOnce: function (way, namespace) {
            if (!S.resources_manager.isIncluded(way) &&
                    !S.resources_manager.isLoading(namespace) &&
                    !S.resources_manager.isLoaded(namespace) &&
                    !S.resources_manager.isScriptInited(namespace)) {
                S.resources_manager.registerLoading(namespace);
                S.resources_manager.include(way);
            }
        },
        /**
         * @memberOf S.resources_manager
         * @description converts namespace to file
         * @param {string} namespace namespace string
         * @params {string} fileType (js / css)
         * @return {string} path to file where should creates class for namespace
         */
        namespaceToWay: function (namespace, type) {
            var path, way;
            type = type || 'js';
            if (!namespace) {
                return false;
            }
            path = S.config.path[namespace.split('.')[0]];
            way = (namespace.split('.').slice(1)).join('/') + '.' + type;
            return path + way;
        },
        /**
         * @memberOf S.resources_manager
         * @description requires array of files needed for application and includes them if they are not yet included
         * @param {Array} namespacesArray array of namespases needed for application
         */
        require: function (namespacesArray) {
            for (var key in namespacesArray) {
                var way = S.resources_manager.namespaceToWay(namespacesArray[key]);
                S.resources_manager.includeOnce(way, namespacesArray[key]);
            }
        },
        /**
         * @memberOf S.resources_manager
         * @description checks array of namespaces of single namespace, is it inited
         * @param {string / Array} namespacesArray string or array of namespaces needed to check
         * @return {boolean} false - in not inited, true - inied
         */
        isInited: function (namespacesArray) {
            var to_return = true;
            if (Array.isArray(namespacesArray) && namespacesArray.length > 0) {
                namespacesArray.forEach(function (ns) {
                    if (!S.getClass(ns)) {
                        to_return = false;
                    }
                });
                return to_return;
            } else {
                return !!S.getClass(namespacesArray);
            }
        },
        /**
         * @function isScriptInited
         * @description checks script initialization status
         * @param {string} namespace
         * @return {boolean} true - inited / false not yet
         */
        isScriptInited: function (namespace) {
            return !!S.getClass(namespace);
        },
        /**
         * @method catchAddon
         * @memberOf S.resources_manager
         * @description creates antiCatch prefix
         * @return {string} adding prefix string, while using this string scripts will not cache
         */
        catchAddon: function () {
            return '?nc=' + new Date().getTime().toString().slice(7);
        }
    },
    /**
     * @namespace
     * @description manager for executing tasks using window.location.hash
     * @example
     * <code>
     * S(function () {
     *    S.hashes_manager.addTask({
     *      'test': function (alert('test'))
     *    }).init();
     * });
     * </code>
     */
    hash_manager: {
        /**
         * @property {object} hashed_tasks
         * @description hashes tasks object for resource manager executing
         */
        hashed_tasks: {
            defaults: function () {
                console.log('Hash manager started default task');
            }
        },
        /**
         * @description adds task to resource manages and hash as key for it
         * @return {object} S.hash_manager
         * @example
         * <code>
         * S.hashes_manager.addTask({
         *    'test': function (alert('test')),
         *    ....
         * });
         * </code>
         */
        addTask: function (obj) {
            for (var hash in obj) {
                var task = obj[hash];
                hash = hash.replace('#', '');
                if (typeof task === "function") {
                    this.hashed_tasks[hash] = task;
                }
            }
            return this;
        },
        /**
         * @description removes task from 'hashed_tasks' using hash
         * @param {string / Array}
         */
        removeTask: function (hash) {
            if (!hash) {
                return false;
            }
            if (typeof hash === "string") {
                delete this.hashed_tasks[hash];
            } else if (Array.isArray(hash)) {
                var len = hash.length;
                for (var i = 0; i < len; i++) {
                    delete this.hashed_tasks[hash[i]];
                }
            }
            return this;
        },
        /**
         * @description executing task using hash
         */
        executeTask: function (hash) {
            hash = hash || window.location.hash;
            hash = hash.replace('#', '');
            if (!hash || !this.hashed_tasks[hash]) {
                this.hashed_tasks.defaults();
                return;
            }
            this.hashed_tasks[hash]();
        },
        /**
         * @description trying to execute task by hash
         */
        execute: function () {
            this.executeTask();
        }
    }
});
// SUGAR //
S.require = S.resources_manager.require;
S.includeStyle = S.resources_manager.includeStyle;
///////////// OOP /////////////////////
/**
 * @function extend
 * @namespace S
 * @description JScript prototype inheritance realisation
 * @param {function} Child child class
 * @param {function} Parent parent class
 */
S.extend = function (Child, Parent) {
    var Class = function () {};
    Class.prototype = Parent.prototype;
    Child.prototype = new Class();
    Child.prototype.constructor = Child;
    Child.superclass = Parent.prototype;
    Child.$super = Parent;
};
/**
 * @function
 * @namespace S
 * @param {object} class_properties object of params for new class
 * @param {string} class_name class_name to create
 * @description recursive loading requires if needed
 */
S.Class = function (class_name, class_properties) {
    if (!S.resources_manager.isLoading(class_name) && !S.resources_manager.isLoaded(class_name)) {
        S.resources_manager.registerLoading(class_name);
    }
    if (!class_properties.$requires && class_properties.$extends
                && class_properties.$extends.indexOf('function') === -1) {
        class_properties.$requires = [class_properties.$extends];
    }
    if (class_properties.$requires) {
        if (!Array.isArray(class_properties.$requires)) {
            class_properties.$requires = [class_properties.$requires];
        }
        if (class_properties.$extends
                && class_properties.$requires.indexOf(class_properties.$extends) === -1) {
            class_properties.$requires.push(class_properties.$extends);
        }
        if (!S.resources_manager.isInited(class_properties.$requires)) {
            S.require(class_properties.$requires);
        }
        var cycle = setInterval(function () {
            if (S.resources_manager.isInited(class_properties.$requires)) {
                clearInterval(cycle);
                S.Class.create(class_name, class_properties);
            } else {
            }
            // continue trying
        }, 1);
    } else {
        S.Class.create(class_name, class_properties);
    }
};
/**
 * @function create
 * @namespace S.Class
 * @param {object} class_properties object of params for new class
 * @param {string} class_name class_name to create
 * @description this is is fires on all re requires for this class loaded and we can create new class
 */
S.Class.create = function (class_name, class_properties) {
    var to_return = null;
    // creating new constructor and extending ...
    to_return = S.namespace(class_name, function (object_properties) {
        this.$namespace = class_name;
        for (var key in object_properties) {
            this[key] = object_properties[key];
        }
    });
    // extending prototype
    if (class_properties.$extends) {
        class_properties.$extends = S.getClass(class_properties.$extends) || function () {};
        S.extend(to_return, class_properties.$extends);
    }
    // apply class properties
    for (var key in class_properties) {
        to_return.prototype[key] = class_properties[key];
        // for OOP
        if (typeof class_properties[key] === 'function') {
            to_return.prototype[key].$name = key;
            to_return.prototype[key].$class = to_return;
            to_return.prototype[key].$super = class_properties.$extends;
            to_return.prototype[key].$callee = class_properties[key];   // now we can use strict mode
        }
    }
    // interface realization checking
    if (class_properties.$implements && Array.isArray(class_properties.$implements) && class_properties.$implements.length > 0) {
        class_properties.$implements.forEach(function (interface_namespace) {
            var Interface = S.getClass(interface_namespace);
            if (!Interface) return;
            Interface.forEach(function (foo) {
                if (!to_return.prototype[foo] || typeof to_return.prototype[foo] !== 'function') {
                    throw S.error('S.Class.create - interface method "' + foo +'" from interface "' + interface_namespace + '" was not overriden in class "' + class_name + '"');
                }
            });
        });
    }
    ///////////////////////////////////
    // "$"   C L A S S   M E T O D S //
    ///////////////////////////////////
    /**
     * @method
     * @memberOf S.Class
     * @description calls parent class method with same name, we should call this
     * if override some method in child class and need to call this method in parent
     * @param {object} args caller function arguments
     * @return Always false;
     */
    to_return.prototype.$callParentMethod = function (args) {
        var parentClass = arguments.callee.caller.$super,
            methodName = arguments.callee.caller.$name;
        parentClass.prototype[methodName].apply(this, args || []);
        return false;
    };
    to_return.prototype.$callParentMethod.$callee = to_return.prototype.$callParentMethod;
    S.resources_manager.registerLoaded(class_name);
    return to_return;
};
/**
 * @function
 * @namespace S
 * @description creates object from class
 * <code>
 * var win = S.createObj(S.component.Window,{
 *  width: 100,
 *  title: 'Hello S'
 * })
 * win.show();
 * </code>
 * @class_name {function} class_name constructor function (each on S.component - are constructors)
 * @params {object} params Params that override defaults
 */
S.New = function (class_name, params) {
    var tempClass, obj, a;
    // prechecking
    if (!S.getClass(class_name)) {
        throw "S:Error>>> Error while creating Object, no such Class exists. Error while creating object from class: " + class_name;
    }
    params = params || {};
    // creating object and init
    tempClass = S.getClass(class_name);
    obj = new tempClass(params);
    if (obj._construct) {
        a = obj._construct();
        if (a) {
            obj = a;
            obj._construct && obj._construct();
        }
    }
    obj.init && obj.init();
    return obj;
};
/**
 * @function Interface
 * @description creates interface
 * @param {string} namespace - namespace for created interface
 * @param {object} properties - properties in object format
 */
S.Interface = function (namespace, properties) {
    var cycle = null;
    // not loading and loaded - so we should set it as loading
    if (!S.resources_manager.isLoading(namespace) && !S.resources_manager.isLoaded(namespace)) {
        S.resources_manager.registerLoading(namespace);
    }
    // $requires??? load them first than can create Class
    if (properties.$requires && Array.isArray(properties.$requires) && properties.$requires.length >= 1) {
        if (!S.resources_manager.isInited(properties.$requires)) {
            S.require(properties.$requires);
        }
        cycle = setInterval(function () {
            if (S.resources_manager.isInited(properties.$requires)) {
                clearInterval(cycle);
                S.Interface.create(namespace, properties);
            }
        }, 1);
    } else {
        S.Interface.create(namespace, properties);
    }
};
/**
 * @function S.Interface.create
 * @description creates interface
 * @param {string} namespace - namespace for created interface
 * @param {object} properties - properties in object format
 * @return {Array} array of interface methods
 */
S.Interface.create = function (namespace, properties) {
    if (!namespace) {
        throw S.error("cant create interface, namespace is empty");
    }
    if (!properties) {
        throw S.error("S.Interface.create - interface " + namespace + " don't have properties??? interesting =)");
    }
    var to_return = [],
        props = properties.$methods || [];
    to_return = to_return.concat(props);
    if (properties.$extends && Array.isArray(properties.$extends) && properties.$extends.length > 0) {
        properties.$extends.forEach(function (ext) {
            var inter = S.getClass(ext);
            to_return = to_return.concat(inter);
        });
    }
    to_return = S.core.Array.unique(to_return);
    to_return = S.namespace(namespace, to_return);
    S.resources_manager.registerLoaded(namespace);
    return to_return;
};
/**
 * @namespace S.component_manager
 * @description component manager object contains all needed function for component managing
 */
S.component_manager = {
    /**
     * @public
     * @function registerComponent
     * @description registers component in component_manager
     */
    registerComponent: function (id, cmp) {
        if (!id || !cmp) {
            throw S.error("S.start - S.component_manager - registerComponent. NO id or cmp for registering")
        }
        S.component_manager.created_components[id] = cmp;
    },
    /**
     * @function removeComponent
     * @param {string} id component id
     * @description removes link for component example from S.resource_manager.created_components
     * @return {boolean} true - if component was founded and destroyed, false if wasn't
     */
    removeComponent: function (id) {
        if (S.component_manager.created_components[id]) {
            return delete S.component_manager.created_components[id];
        } else {
            return false;
        }
    },
    /**
    * @function
    * @namespace S
    * @param {string} id identifier for component
    * @return {object} Component object with same id
    */
    getComponent: function (id) {
        if (S.component_manager.created_components[id]) {
        return S.component_manager.created_components[id];
        } else {
            return false;
        }
    },
    /**
     * @function componentQuery
     * @namespace S
     * @description search array of components using searchString
     * @param {string} search_string component string
     * @return {Array} Array of components that
     */
    componentQuery: function componentQuery (search_string) {
        // TODO ye, this is bullshit. It must be finite-state machine for parsing search_string, and all this staff gos to hell with all hard-code todos
        // TODO /[<>\u06c1\u06c2]/ out of hard code
        search_string = replaceDoubleSymbolOperators (search_string);
        var search_elements = splitSearchString(search_string),
            search_operators = search_string.match(/[<>\u06c1\u06c2]/g) || [],
            filtered_components = S.component_manager.created_components;
        for (var i = 0; i < search_elements.length; i++) {
            filtered_components = filtered_components.filter(search_elements[i]);
            filtered_components = filtered_components.applySearchOperator(search_operators[i]);
        }
        return filtered_components;

        // TODO /[<>\u06c1\u06c2]/ out of hard code
        function splitSearchString (search_string) {
            var search_elements = search_string.split(/[<>\u06c1\u06c2]/);
            search_elements.forEach(function (x, i, a) {
                a[i] = new componentQuery.SearchElement(x)
            });
            return search_elements
        }

        // TODO /!</, /!>/, \u06c1 and \u06c1 out of hard code
        function replaceDoubleSymbolOperators (search_string) {
            if (search_string.match(/[\u06c1\u06c2]/)) throw new Error("You use '\u06c1' or '\u06c2' in componentQuery()?! Please, don't");
                search_string = search_string.replace(/!>/g, "\u06c1");
                search_string = search_string.replace(/!</g, "\u06c2");
            return search_string;
        }
    },
    // !!!===> do NOT add any numerable propertys! Only components must be numerable propertys in ComponentSet
    ComponentSet : function () {
        Object.defineProperties(this, {
            filter : {
                // TODO add RegExp support
                value : function (search_element) {
                    var filtered_components = new S.component_manager.ComponentSet();
                    component_loop: for (var component_name in this) {
                        if (!this.hasOwnProperty(component_name)) continue;
                        if (search_element.class_name !== "")
                            if (this[component_name].$namespace !== search_element.class_name) continue;
                        for (var attr_name in search_element.attributes) {
                            if (!search_element.attributes.hasOwnProperty(attr_name)) continue;
                            if ((!attr_name in this[component_name]) ||  this[component_name][attr_name] !== search_element.attributes[attr_name]) continue component_loop;
                        }
                        filtered_components[this[component_name].id] = this[component_name];
                    }
                    return filtered_components;
                }
            },
            gatParents : {
                value : function () {
                    var filtered_components = new S.component_manager.ComponentSet();
                    for (var component_name in this) {
                        if (!this.hasOwnProperty(component_name)) continue;
                        if (this[component_name].getParent())
                            filtered_components[this[component_name].getParent().id] = this[component_name].getParent();
                    }
                    return filtered_components;
                }
            },
            // there is getChildren() in Component API, so not every getChildren here is this getChildren
            getChildren : {
                value : function () {
                    var filtered_components = new S.component_manager.ComponentSet();
                    for (var component_name in this) {
                        if (!this.hasOwnProperty(component_name)) continue;
                        if (this[component_name].getChildren())
                            this[component_name].getChildren().forEach(function (x) {filtered_components[x.id] = x;});
                    }
                    return filtered_components;
                }
            },
            getHeirs : {
                value : function () {
                    var filtered_components = new S.component_manager.ComponentSet();
                    var children = this;
                    while (Object.keys(children.getChildren()).length) {
                        for (var component_name in children) {
                            if (!children.hasOwnProperty(component_name)) continue;
                            if (children[component_name].getChildren())
                                children[component_name].getChildren().forEach(function (x) {filtered_components[x.id] = x;});
                        }
                        children = children.getChildren();
                    }
                    return filtered_components;
                }
            },
            getAncestors : {
                value : function () {
                    var filtered_components = new S.component_manager.ComponentSet();
                    var parents = this;
                    while (Object.keys(parents.gatParents()).length) {
                        for (var component_name in parents) {
                            if (!parents.hasOwnProperty(component_name)) continue;
                            if (parents[component_name].getParent())
                                filtered_components[parents[component_name].getParent().id] = parents[component_name].getParent();
                        }
                        parents = parents.gatParents();
                    }
                    return filtered_components;
                }
            },
            applySearchOperator : {
                // TODO <, >, \u06c1, and \u06c2 out of hard code
                value : function (searchOperator) {
                    switch (searchOperator) {
                        case undefined:
                            return this;
                        case "<":
                            return this.gatParents();
                        case ">":
                            return this.getChildren();
                        case "\u06c1":
                            return this.getHeirs();
                        case "\u06c2":
                            return this.getAncestors();
                        default:
                            throw new Error("unsupported operator of search in componentQuery. Supported are '<', '>', '!>' and '!<' (this list can be outdated. If it dose - update it please)")
                    }
                }
            }
        })
    }
};
// add fields created from inner class ComponentSet
/**
 * @property {object} created_components - object of created components
 */
S.component_manager.created_components = new S.component_manager.ComponentSet();
// add inner class to componentQuery
/**
 * @description these are parsed string elements of query
 * @param {string} element should be "ClassName[attr1=val1,attr2=val2...]"
 *      ClassName and [...] are optional. vals could be in quotes: if they dose the quotes will be dropped
 *      Spaces are accept wherever you want
 * @property {string} class_name available just after creation
 * @property {object} attributes available just after creation. Has form of {attr1: 'val1', attr2: 'val2'...}
 */
S.component_manager.componentQuery.SearchElement = function (element) {
    this.class_name = (element.split("[")[0] && element.split("[")[0].trim()) || "";
    if (element.split(/[\[\]]/)[1] && element.split(/[\[\]]/)[1].trim()) {
        var string_of_attributes = element.split(/[\[\]]/)[1].trim();
        this.attributes = getAttributes (string_of_attributes);
    }

    function getAttributes (string_of_attributes) {
        // TODO /[=,]/ out of hard code. May be add some more separators?
        var attributes = {};
        var attributes_array = string_of_attributes.split(/[=,]/);
        attributes_array.forEach(function (x, i, a) {a[i] = a[i].trim()});
        for (var i = 1; i < attributes_array.length; i += 2) {
            attributes_array[i] = removeQuotes(attributes_array[i]);
            attributes[attributes_array[i-1]] = attributes_array[i];
        }
        return attributes;

        // TODO do we need this?
        function removeQuotes (str) {
            return str.replace(/^['"]/,"").replace(/['"]$/,"");
        }
    }
};
// SUGAR
S.getComponent = S.component_manager.getComponent;
S.componentQuery = S.component_manager.componentQuery;
S.up = S.component_manager.up;
S.down = S.component_manager.down;
/**
 * @function
 * @namespace S
 * @param {function} func function to override
 * @param {function} when (before / after) position when event should executes before or after hethod execution
 * @param {function} event function that adds to execution
 * @return {function} overrided function
 * @description (decorator) function for add onBeforeMethodName onAfterMethodName
 * usage
 * <code>
 * function onBeforePush () {console.log('onAfterPush has
 * been launched')};
 * function onAfterPush () {console.log('onAfterPush has been launched')};
 * S.registerListener(Array.prototype.push, 'before', onBeforePush);
 * </code>
 */
S.registerListener = function (func, when, event) {
    return function () {
        var args = Array.prototype.slice.call(arguments, 0);
        // onBefore
        if (typeof event === 'function' && when === 'before') {
            event.apply(this, args);
        }
        // call
        func.apply(this, args);
        // onAfter
        if (typeof event === 'function' && when === 'after') {
            event.apply(this, args);
        }
        // train
        return this;
    };
};
/**
 * @function
 * @namespace S
 * @description returns member nethod of event
 * @param {string} eventName event name string
 * @return {string} object poperty name
 */
S.getMethodNameByEventName = function (eventName) {
    //'use strict';
    var methodName = null;
    if (eventName.indexOf('onBefore') != -1) {
        methodName = eventName.substr('onBefore'.length);
        methodName = methodName.charAt(0).toLowerCase() + methodName.slice(1);
    }
    if (eventName.indexOf('onAfter') != -1) {
        methodName = eventName.substr('onAfter'.length);
        methodName = methodName.charAt(0).toLowerCase() + methodName.slice(1);
    }
    return methodName
};


/**
 * @function
 * @namespace S
 * @description generates id for components (this in NOT HTML id)
 * @return {string} id for component
 */
S.genId = function (suffix) {
    var return_id;
    if (S.genId.current === undefined) {
        S.genId.current = 0;
    }
    return_id = 'S_gen_' + (S.genId.current++);
    if (suffix) {
        return_id += '_' + suffix;
    }
    return return_id;
};

/**
 * @function
 * @description
 */
S.addParams = function (base, addon) {
    for (var key in addon) {
        base[key] = addon[key];

    }
};
/**
 *
 */
S.savePage = function () {
    var i;
    if (S.savePage.obj_array.length) {
        for (i = 0; i < S.savePage.obj_array.length; i++) {
            S.savePage.obj_array[i]._setStoreData();
        }
    }
};
S.savePage.obj_array = [];
/**
 * @function
 * @namespace S
 * @description registers path for application
 * @param {string} app_name application namespace
 * @param {string} path to application
 */
S.registerPath = function (app_name, path) {
    S.config.path[app_name] = path;
};

// FIX FOR LOADING
window.addEventListener('load', function () {
    S.temp.win_loaded = 1;
    S.includeStyle(S.config.path.css + 'styles.css');
    S.includeStyle(S.config.path.css + 'widget.css');
});
///////////// NAMESPACES //////////////
S.namespace('S.core');
S.namespace('S.plugins');
S.namespace('S.component');
S.namespace('S.component.form');
S.namespace('S.application');
S.namespace('S.data');
S.namespace('S.widget');
S.namespace('S.widget.interactive');
S.namespace('S.widget.gallery');
S.namespace('S.widget.quizzes');
S.namespace('S.widget.sync');
S.namespace('S.widget.review');
S.namespace('S.widget.review.question');
/**
 * THIS IS WIDGET BUILD AUTHOR SIDE
 * @s.onenko
 * BE CAREFUL. IF COMPRESS SCRIPT YOU SHOULD ADD SCRIPTS HERE IN STEP BY STEP ORDER like
 * 1. Grand parents
 * 2. Parents
 * 3. Kids
 *  - DO NOT ADD COMMENTS in S.require array argument
 *  - SO NO dynamically LOADED SCRIPTS WILL BE NEEDED
 *  - FOR errors debug - see try compressed js file. and inspect html head. there should NOT exists dynamically added scripts
 */
S.addParams(S.config, {
    author_mode: true
});
//(function () { // We need to delete this script from Document Head to prevent duplication of scripts included after reinit
//    var ss = document.getElementsByTagName('script'),
//        script_link = ss[ss.length - 1],
//        loc = script_link.src,
//        script_name = loc.substring(loc.lastIndexOf('/') + 1, loc.lastIndexOf('.'));
//    if (script_name === 'build-widget-author') {
//        document.head.removeChild(script_link);
//    }
//})();


/**
 * @author Sergey Onenko
 * @description handlers for C#
 */
S.core.c = {
    /**
     * @public
     * @function resize
     * @descriprion fires resize on specified DOM
     * @param id - DOM id needed to call resize
     */
    resize: function (id) {
        var el = document.getElementById(id);
        el.onResize && el.onResize();
    },
    /**
     * @public
     * @function toggleAuthorUser
     * @descriprion Toggle between Author and User version of Review
     */
    toggleAuthorUser: function(script_id){

        var scripts = document.querySelectorAll('script'),
            old_widget_js,
            new_widget_js = document.createElement('script'),
            js_backup = document.getElementById(script_id).innerHTML,
            new_js = document.createElement('script'),
            path;

        for(var i = 0; i< scripts.length; i++){

            if (scripts[i].src.indexOf('widget-author') !== -1){
                old_widget_js = scripts[i];
                path = old_widget_js.src.split("S-widget-author")[0];
                new_widget_js.src = path +  'S-widget-user.js';

            }

            if (scripts[i].src.indexOf('widget-user') !== -1){

                old_widget_js = scripts[i];
                path = old_widget_js.src.split("S-widget-user")[0];
                new_widget_js.src = path + 'S-widget-author.js';
                console.log(old_widget_js)
            }
        }

        document.head.removeChild(old_widget_js);
        delete S;
        delete q;
        document.head.appendChild(new_widget_js);
        document.getElementById('q$widget').parentNode.removeChild(document.getElementById('q$widget'));
        new_js.id = script_id;
        new_js.innerHTML = js_backup;
        setTimeout(function () {
            S.temp.win_loaded = 1;
            document.body.appendChild(new_js);
        }, 100);
    }
};
S.toggleAuthorUser =  S.core.c.toggleAuthorUser;
S.core.dndS = function (drag_els, drag_zone, drop_zones, transition, onDrop) {
    var i;
    if (!Array.isArray(drag_els)) {
        drag_els = [drag_els];
    }
    if (!Array.isArray(drop_zones)) {
        drop_zones = [{zone: drop_zones}];
    }
    for (i = 0; i < drag_els.length; i++) {
        S.device.addEventListener(drag_els[i], 'touchstart', touchStart, true);
    }
    // Touch start event
    function touchStart (e) {
        if (touchStart.available || touchStart.available === undefined) {
            var startPos = {
                drag_el_pos_left: 0,
                drag_el_pos_top: 0,
                pageX: 0,
                touchY: 0
            }, zone, zone1,
            prevent_simple_onclick = 0,
            drag_el = this,
            parent_el = drag_el.parentNode;
//            e.stopPropagation();
            if (e.button === 0) { // drag starts only if left mouse button is down (or touchstart)
                S.device.addEventListener(document.body, 'touchmove', touchMove);
                S.device.addEventListener(document.body, 'touchend', clearMouseMove);
                /**
                 * @function clearMouseMove
                 * @description Used to prevent simple onclick on dragged element
                 */
                function clearMouseMove () {
                    S.device.removeEventListener(document.body, 'touchmove', touchMove);
                    S.device.removeEventListener(document.body, 'touchend', clearMouseMove);
                }
                /**
                 * @function touchMove
                 * @description Function called on touch move event
                 * @param {object} e Window event handler
                 */
                function touchMove (e) {
                    e.stopPropagation();
                    if (prevent_simple_onclick < 2) {
                        prevent_simple_onclick++;
                    } else {
                        touchStart.available = false;
                        clearMouseMove();
                        checkZone();
                        appendToDragZone(drag_el);
                        S.device.addEventListener(document.body, 'touchmove', moving);
                        S.device.addEventListener(document.body, 'touchend', touchEnd);
                    }
                }
                /**
                 */
                function moving (e) {
                    e.stopPropagation();
                    drag_el.style.left = startPos.drag_el_pos_left + e.touchX - startPos.touchX + 'px';
                    drag_el.style.top = startPos.drag_el_pos_top + e.touchY - startPos.touchY + 'px';
                }
                /**
                 * @function touchEnd
                 * @description Function called on touch end event
                 */
                function touchEnd (e) {
                    S.device.removeEventListener(document.body, 'touchmove', moving);
                    S.device.removeEventListener(document.body, 'touchend', touchEnd);
                    checkDropArray(e);
                }
                /**
                 */
                function checkZone () {
                    var boundingClientRect;
                    for (i = 0; i < drop_zones.length; i++) {
                        boundingClientRect = drop_zones[i].zone.getBoundingClientRect();
                        if (boundingClientRect.top < e.touchY &&
                            boundingClientRect.left < e.touchX &&
                            boundingClientRect.top + drop_zones[i].zone.offsetHeight > e.touchY &&
                            boundingClientRect.left + drop_zones[i].zone.offsetWidth > e.touchX) {
                            zone1 = i;
                            break;
                        }
                    }
                }
                /**
                 */
                function checkDropArray(e) {
                    var i, drop_zone, brother_el, boundingClientRect;
                    for (i = 0; i < drop_zones.length; i++) {
                        boundingClientRect = drop_zones[i].zone.getBoundingClientRect();
                        if (boundingClientRect.top < e.touchY &&
                            boundingClientRect.left < e.touchX &&
                            boundingClientRect.top + drop_zones[i].zone.offsetHeight > e.touchY &&
                            boundingClientRect.left + drop_zones[i].zone.offsetWidth > e.touchX) {
                            drop_zone = drop_zones[i].target;
                            zone = i;
                            break;
                        }
                    }
                    if (drop_zone) {
                        appendToDropZone(drag_el, drop_zone);
                        onDrop(drag_els.indexOf(drag_el), zone);
                        if (drop_zone.children[0] && drop_zone !== drop_zones[0].target) {
                            brother_el = drop_zone.children[0];
                            onDrop(drag_els.indexOf(brother_el), zone1);
                            appendToDragZone(brother_el);
                            appendToDropZone(brother_el, parent_el);
                        }
                    } else {
                        appendToDropZone(drag_el, parent_el);
                    }
                }
                /**
                 */
                function appendToDragZone (append_element) {
                    startPos.drag_el_pos_left = append_element.getBoundingClientRect().left -
                        drag_zone.getBoundingClientRect().left;
                    startPos.drag_el_pos_top =  append_element.getBoundingClientRect().top -
                        drag_zone.getBoundingClientRect().top;
                    startPos.touchX = e.touchX;
                    startPos.touchY = e.touchY;
                    S.addParams(append_element.style, {
                        position: 'absolute',
                        zIndex: '51',
                        left: startPos.drag_el_pos_left + 'px',
                        top: startPos.drag_el_pos_top + 'px'
                    });
                    drag_zone.appendChild(append_element);
                }
                /**
                 */
                function appendToDropZone(element, append_zone) {
                    if (transition) {
                        element.style.WebkitTransition = "all 0.4s ease";
                        S.addParams(element.style, {
                            marginLeft: '0px',
                            marginTop: '0px'
                        });
                        element.style.top = element.offsetTop - element.getBoundingClientRect().top +
                            append_zone.getBoundingClientRect().top + 'px';
                        element.style.left = element.offsetLeft - element.getBoundingClientRect().left +
                            append_zone.getBoundingClientRect().left + 'px';
                        setTimeout(appending, 300);
                    } else {
                        appending();
                    }
                    function appending() {
                        element.style.WebkitTransition = '';
                        S.addParams(element.style, {
                            position: 'relative',
                            zIndex: '50',
                            left: '0px',
                            top: '0px',
                            marginLeft: '',
                            marginTop: ''
                        });
                        append_zone.insertBefore(element, append_zone.firstChild);
                        touchStart.available = true;
                    }

                }
            }
        }
    }
};
/**
 * @namespace
 * @description contains utils for work with Objects
 */
S.core.Object = {
    /**
     * @function
     * @namespace S.core.Object
     * @description gets object key by value
     * @param {object} obj haystack
     * @param {mixed} val value ov obj[key]
     * @param {biilean} search_in_prototype enable / disable to search in prototype (default false)
     */
    getKey: function(obj, val, search_in_prototype) {
        search_in_prototype = search_in_prototype || false;

        for (var key in obj) {
            if (search_in_prototype === true) {
                if (obj[key] && obj[key] === val) {
                    return key;
                }
            } else {
                if (obj[key] && obj.hasOwnProperty(key) && obj[key] === val) {
                    return key;
                }
            }
        }
        return null;
    },
    /**
     * @function
     * @namespace S.core.Object
     * @description adds params for any object in sugar syntax
     * @param {object} base base object
     * @param {object} addon addon object includes params that'll be added to base object
     * @return {object} base
     * @example
     * <code>
     * var el = document.getElementById('test');
     * S.addParams(el.style, {
     *  width: '200px',
     *  height: '200px',
     *  bakcgroundColor: 'red'
     * });
     * </code>
     */
    addParams: function (base, addon) {
        for (var key in addon) {
            base[key] = addon[key];
        }
        return base;
    },
    /**
     *
     */
    defineThroughProperties: function (_this, _that, properties_array) {
        var i = 0;
        if (!Array.isArray(properties_array)) {
            properties_array = [properties_array];
        }
        for (; i < properties_array.length; i++) {
            _this[properties_array[i]] = _that[properties_array[i]];
            (function (i) {
                Object.defineProperty(_that, properties_array[i], {
                    set: function (new_value) {
                        _this[properties_array[i]] = new_value;
                    },
                    get: function () {
                        return _this[properties_array[i]];
                    }
                });
            })(i);
        }
    }
};
// SH
S.addParams = S.core.Object.addParams;
S.core.String = {
    /**
     * @function
     * @namespace S.core.String
     * @description makes first chat UpperCase
     * @param {string} str input stinf
     * @return {string} string with first BIG char
     */
    firstToUpperCase: function (str) {
        var first = str.substr(0, 1).toUpperCase(),
            last = str.substr(1);
        return first + last;
    }
};
/**
 * @namespace S.core.Array
 * @description ARRAY ADDON METHODS
 */
S.core.Array = {
    /**
     * @function unique
     * @memberOf S.core.Array
     * @description returns new array with unique values
     * @param {array} arr - not unique array
     * @return {array} array with unique values
     * @example
     * <code>
     * var a = [1, 2, 3, 3, 3, 3, 3];
     * var b = S.core.Array.unique(a);  // [1, 2, 3];
     * </code>
     */
    unique: function (arr) {
        // "use strict";
        var a = [],
            l = arr.length,
            i = 0,
            j = 0;
        for (i = 0; i < l; i++) {
            for (j = i + 1; j < l; j++) {
                if (arr[i] === arr[j]) {
                    j = ++i;
                }
            }
            a.push(arr[i]);
        }
        return a;
    },
    /**
     * @fuction toArray
     * @memberOf S.core.Array
     * @description convrts object like array to array
     * @return {array} array from argument
     * @param {object} obj_like_array
     */
    toArray: function (obj_like_array) {
        return Array.prototype.slice.call(obj_like_array, 0);
    },
    /**
     * @description returns closest integer value from array
     * @param {array} array
     * @param {integer} target
     * @param {string} pos (low, center, high)
     * @return {integer} closest array value
     */
    closest: function(array, target, pos) {
        if (array.length < 2) {
            return 0;
        }
        var t = array.map(function(val) {
                return [val, Math.abs(val - target)];
            }),
            closest =  t.reduce(function(memo, val) {
                return (memo[1] < val[1]) ? memo : val;
            }, [-1, 999])[0];
        if (target !== closest && pos && pos !== 'center') {
            if (pos === 'low') {
                if (target < closest) {
                    return array[array.indexOf(closest) - 1];
                }
            } else if (pos === 'high'){
                if (target > closest) {
                    return array[array.indexOf(closest) + 1];
                }
            }
        }
        // default is center
        return closest
    }
};
// sh
S.toArray = S.core.Array.toArray;
S.namespace('S.core.template');
/**
 * @namespace S.core.template
 */
S.core.template = {
    /**
     * @function
     * @description compiling template function
     * <code>
     * // String Coma separated usage
     * var compiled = S.core.template.compile(<div class="{0}" >{1}</div>, 'className', 'Some body content here');
     * console.log(compiled);   // <div class="className">someInnerHTML</div>
     * // object usage
     * var b = S.core.Template.compile(
     *     '<div class="{class}">{body}</div>',
     *     {
     *         'class': 'someClassName',
     *         'body': 'Some inner html here'
     *     }
     * );
     * console.log(b)    // <div class="someClassName">Some inner html here</div>
     * </code>
     * @param {string} template haystack template like <div class="{0}" >{1}</div>
     * @param {object} obj Source to retrieve data from
     * @return compiled string
     */
    compile: function (template, obj) {
        var key, key1, tmp_val, tmp_arr, i,
            arr = template.match(/{[a-z.A-Z_0-9]+}/mgi),
            tpl_vars = {};
        for (key in arr) {
            key1 = arr[key].replace('{', '').replace('}', '');
            if (key1.indexOf('.') !== -1) {
                tmp_val = obj;
                tmp_arr = key1.split('.');
                for (i = 0; i < tmp_arr.length; i++) {
                    if (tmp_val[tmp_arr[i]]) {
                        tpl_vars[key1] = tmp_val = tmp_val[tmp_arr[i]];
                    } else {
                        tpl_vars[key1] = '';
                        break;
                    }
                }
            } else {
                tpl_vars[key1] = obj[key1];
            }
        }
        // compiling
        for (key in tpl_vars) {
            tmp_val = typeof tpl_vars[key] === 'string' && tpl_vars[key].match(/[a-z.A-Z_0-9]+}/) ?
                this.compile(tpl_vars[key], obj) : tpl_vars[key];
            tmp_val = String(tmp_val); // To prevent ignore from ZERO number
            if (template.indexOf('{' + key + '}') !== -1) {
                template = template.replace(new RegExp('{' + key + '}', 'mgi'), tmp_val || '');
            } else {
                template = template.replace(new RegExp('{' + key + '}', 'mgi'), '');
            }
        }
        return template;
    },
    /**
     * @function compileArray
     * @description compile alot of records using one template
     * <code>
     * // String Coma separated usage
     * var compiled = S.core.template.compile(<div class="{0}" >{1}</div>, 'className', 'Some body content here');
     * console.log(compiled);   // <div class="className">someInnerHTML</div>
     * // object usage
     * var b = S.core.Template.compileAttay(
     *     '<div class="{class}">{body}</div>',
     *     [{
     *         'class': 'someClassName1',
     *         'body': 'Some inner html here1'
     *     },{
     *         'class': 'someClassName2',
     *         'body': 'Some inner html here2'
     *     }]
     * );
     * console.log(b)    // <div class="someClassName">Some inner html here</div>
     * </code>
     * @param {string} template haystack template
     * @param {array} arr_of_objects
     * @param {boolean} to_string true - return string, false - array
     * @return compiled string / array
     */
    compileArray: function (template, arr_of_objects, to_string) {
        var to_return = [], prop;
        if (!Array.isArray(arr_of_objects)) {
            throw S.error("S.core.template.compileArray - second argument should be an array");
        }
        for (prop in arr_of_objects) {
            to_return.push(S.core.template.compile(template, arr_of_objects[prop]));
        }
        return (to_string === true) ? to_return.join('') : to_return;
    }
};
/**
 * @object
 * @description ready to use contains functions needed for applications debug
 */
S.core.debug = {
    /**
     */
    log: function () {
        var message = 'S_debug | ' + Array.prototype.slice.call(arguments).join(' ');
        console.log(message);
    },
    /**
     * @function error
     * @description library error generator
     * @example
     * <code>
     * throw S.error("...");    // S.error>>>: ...
     * </code>
     */
    error: function (message, fileName, lineNumber) {
        function E(message, fileName, lineNumber) {
            var err = new Error();
            if (err.stack) {
                this.stack = err.stack.replace(/\n[^\n]*/, '');
            }
            this.message    = (message    === undefined) ? err.message    : message;
            this.fileName   = (fileName   === undefined) ? err.fileName   : fileName;
            this.lineNumber = (lineNumber === undefined) ? err.lineNumber : lineNumber;
        }
        E.prototype = new Error();
        E.prototype.constructor = E;
        E.prototype.name = 'S.error>>>';
        return new E(message, fileName, lineNumber);
    }
};
// shorthands
S.log = S.core.debug.log;
S.error = S.core.debug.error;
/**
 * @namespace S.core.ajax
 * @function
 * @description Ajax for mobiles
 * <code>
 *  S.ajax({
 *      url: './json.json1',
 *      method: 'POST',
 *      data: {
 *          foo: 'bar'
 *      },
 *      callback: function (data, text) {
 *          console.log('callback');
 *      },
 *      success: function (data, text) {
 *          console.log('success')
 *      },
 *      
 *      failure: function () {
 *          console.log('failure')
 *      }
 *  });
 * </code>
 * @param {object} params params for ajax request
 */
S.core.ajax = function (params) {
    // checking
    if (!params) {
        params = {};
    } 
    // real params to send
    var o = {
            method: params.method || "POST",
            url: params.url,
            data: params.data || '',
            callback: params.callback || function () {},
            success: params.success || function () {},
            failure: params.failure || function () {},
            async: params.async || true,
            headers: params.headers || [
                ["Content-Type", "application/x-www-form-urlencoded; charset=UTF-8"]
            ]
        }
        ,req = new XMLHttpRequest();
        
    // P R O C E D U R E S //
    
    // rewrite data
    if (o.data && typeof o.data === "object") {
        var temp = ''
        for (var key in o.data) {
            var val = o.data[key];
            temp += (temp === '') ? key + '=' + val : '&' + key + '=' + val  ;
        }
        o.data = temp;
    }
    
    // open
    req.open(o.method, o.url, o.async);
    // headers
    for (var i = 0; i < o.headers.length; i++) {
        req.setRequestHeader(o.headers[i][0], o.headers[i][1]); 
    }

    // callback handlers
    req.onreadystatechange = function (data) {
        var readyState = data.currentTarget.readyState,
            text = data.currentTarget.responseText,
            status = data.currentTarget.status;
            
        if (readyState == 4) {
            o.callback(data, text);

            if (status === 200) {   // success
                o.success(data, text);
            } else {                // failure
                o.failure();
            }
        }
    };
    // sending
    req.send(o.data);
};

// shorthand
S.ajax = S.core.ajax;
S.temp.loading--;

S.core.animate = function(html_object, styles_object, time, callback){
    var avalible_animation = true; // fix mistake
    var old_style = html_object.style;
    var new_styles = styles_object; // what sense?
    var start_time = new Date();
    var current_css_value = {};
    var current_time = 0;
    var delay = 13; // magic number
    var count_step = {}; // step_value
    var supported = {
        opacity: '',
        top:'px',
        bottom:'px',
        left:'px',
        right:'px',
        width: 'px',
        height: 'px',
        fontSize: 'px',
        marginBottom: 'px',
        marginTop: 'px',
        marginLeft: 'px',
        marginRight: 'px',
        backgroundColor: 'rgba',
        color: 'rgba',
        backgroundImage: ''
    }
    
	for(var style in new_styles){  // move to a separate function       
        count_step[style] = {};    
        
		if(style.toLowerCase().indexOf("color") !== -1){
			
			current_css_value[style] = toRGBA(old_style[style]).color_object;
			var temp_color = toRGBA(new_styles[style]).color_object;
			count_step[style].red = (temp_color.red - current_css_value[style].red)/(time/delay);
			count_step[style].green = (temp_color.green - current_css_value[style].green)/(time/delay);
			count_step[style].blue = (temp_color.blue - current_css_value[style].blue)/(time/delay);
			count_step[style].alfa = (temp_color.alfa - current_css_value[style].alfa)/(time/delay);
 
		}else if(style.toLowerCase().indexOf("backgroundimage")!= -1){
			current_css_value[style] = optimizeGradient(old_style[style]);
			
			var newGradient = optimizeGradient(new_styles[style]);
			
			if(newGradient.gradientString != current_css_value[style].gradientString){
				throw  "Connot animate! Gradients are not identical";
			}
			count_step[style].ps = {};

			for(var i = 0; i < current_css_value[style].ps.length-1; i++){
				if(current_css_value[style].ps[i]!= newGradient.ps[i]){
				   count_step[style].ps[i] = (newGradient.ps[i] - current_css_value[style].ps[i])/(time/delay);
				}
			}
			
		}else {
			current_css_value[style] = old_style[style] ? parseFloat(old_style[style]) : 0;
			count_step[style] = (new_styles[style] - current_css_value[style])/(time/delay);
		}            
        
    }

    var start_inteval_time = new Date().getTime();
    if (avalible_animation){
        var interval = window.setInterval(function(){
        
			var real_interval_time = new Date().getTime() - start_inteval_time;
			start_inteval_time = new Date().getTime();
			
			for(var style in new_styles){ // move to a separate function 
					
				if(style.toLowerCase().indexOf("backgroundimage")!= -1){
					for(var i in count_step[style].ps){
						current_css_value[style].ps[i] += (count_step[style].ps[i] / delay) * real_interval_time;
					}
				html_object.style[style] = GradientToString(current_css_value[style].gradientString, current_css_value[style].ps);
				} else if(style.toLowerCase().indexOf("color") !== -1){
					
					for(var color in current_css_value[style]){
						current_css_value[style][color] += (count_step[style][color] / delay) * real_interval_time;
						html_object.style[style] = supported[style]+"("+parseInt(current_css_value[style].red)+", "+
							parseInt(current_css_value[style].green)+", "+parseInt(current_css_value[style].blue)+
							", "+parseFloat(current_css_value[style].alfa)+")";
						}
				} else{
					current_css_value[style] += (count_step[style] / delay) * real_interval_time;
					html_object.style[style] = current_css_value[style] + supported[style];
				}

			}
			
			current_time += real_interval_time;
			
			if(current_time >= time){
				window.clearInterval(interval);
			}
    }, delay);
}
    var errorInterval = new Date().getTime() - start_time.getTime();

    setTimeout(function () {
        if (avalible_animation){
            callback && callback();
			clearInterval(interval);

			for(var style in new_styles){
				if(style.toLowerCase().indexOf("color")!= -1){
					html_object.style[style] = supported[style]+"("+parseInt(toRGBA(new_styles[style]).color_object.red)+", "+
						parseInt(toRGBA(new_styles[style]).color_object.green)+", "+parseInt(toRGBA(new_styles[style]).color_object.blue)+
						", " + parseFloat(toRGBA(new_styles[style]).color_object.alfa)+")";

				} else{
					html_object.style[style] = new_styles[style] + supported[style];
				}
			}
        }
    }, time - errorInterval);

    function toRGBA(color){
        var color_object;
        var color_string;
        if(color.charAt(0) === "#") {
           color = color.substring(1);
           if(color.length === 3){
               color = color.charAt(0)+color.charAt(0)+color.charAt(1)+color.charAt(1)+color.charAt(2)+color.charAt(2)
           } 
           color_object = {
               "red" : parseInt(color.substring(0,2),16),
               "green" : parseInt(color.substring(2,4),16),
               "blue" : parseInt(color.substring(4,6),16),
               "alfa" : 1
           };
        } else if(color.toLowerCase().indexOf("rgb(")!=-1){
            color = color.replace(/[a-zA-Z]+/, '');
            color = color.replace(/ +/mgi, '');
            var colors = color.match(/(\d+),(\d+),(\d+)/);
			color_object = {red: colors[1], green: colors[2], blue: colors[3], alfa: 1}; 
			console.log(color_object);
			
        } else if(color.toLowerCase().indexOf("rgba(") != -1){
            color = color.replace(/[a-zA-Z]+/, '');
            color = color.replace(/ +/mgi, '');
            color_object = {
                "red" : parseInt(color.match(/(\d+),/)),
                "green" : parseInt(color.match(/\d+,(\d+),/)[1]),
                "blue" : parseInt(color.match(/\d+,\d+,(\d+),[\d.,]+/)[1]),
                "alfa" : parseFloat(color.match(/\d+,\d+,\d+,([\d.,]+)/)[1])
            };
       }
        colorString = "rgba(" +color_object.red+","+ color_object.green + "," +
                         color_object.blue + "," + color_object.alfa + ")";
        return {
            "colorString" : colorString,
            "color_object" : color_object
        }
    }
    
	function GradientToString(gradient_string, gradient_ps_array){
       for(var i = 0; i < gradient_ps_array.length; i++){
           gradient_string = gradient_string.replace("{p"+i+"}", parseInt(gradient_ps_array[i]))
       }
       return gradient_string
    }
    
	function optimizeGradient (gradient){
       var hexColor;
       var ps = [];
       gradient = gradient.replace(/ +/mgi, '');
       for(var i = 0; i < gradient.length; i++){
            if (gradient.indexOf("#") != -1){
                hexColor = gradient.match(/(#.+?)\),/)[1];
                gradient = gradient.replace(hexColor, toRGBA(hexColor).colorString);
            }
            if (gradient.indexOf("rgb(") != -1){
                hexColor = gradient.match(/(rgb\(.+?\))/)[1];
                gradient = gradient.replace(hexColor, toRGBA(hexColor).colorString);
            }
            if(gradient.match(/0\.\d+/)!= null){
                var tempPersent = gradient.match(/0\.\d{1,2}/);
                gradient =  gradient.replace(tempPersent, tempPersent*100+"%");
            }
            var tempRegExp = gradient.match(/[^{p](\d+)[%,)][^}]/);
            if(tempRegExp){
                ps[i] = parseInt(tempRegExp[1]);
                gradient = gradient.replace(tempRegExp[1], '{p}');
            }
        }
       
	    for (var j = 0; j < gradient.length-1; j++) {
            if (gradient.match(/{p}/) !== null){
                gradient = gradient.replace('{p}', '{p' + j + '}');

            }
        }
        
		return {
            "gradientString" : gradient,
            "ps" : ps
        }
    }
     
    this.stopAnimate = function () {
        clearInterval(interval);
        avalible_animation = !avalible_animation;
        if (avalible_animation) {
            animate (html_object, styles_object, time-current_time, callback);
        }
    }

}


 



/**
 * @author Sergey Onenko
 * @description Animate function. NON OOP. THIS FUNCTIONS GOOD FOR ANUMATING ALOT OF OBJECTS ON SCREEN
 * @param DOM
 * @param styles_object
 * @param callback
 */
S.core.animateDOM = function (DOM, styles_object, animation_time, animation_function, callback) {
    'use strict';
    animation_time = animation_time || 10000;
    animation_function = animation_function || 'linear';

    /////////////////////////
    // P R O P E R T I E S //
    /////////////////////////
    var animating = S.core.animateDOM.animating,
        start_time = (new Date()).getTime(),
        end_time = start_time + animation_time,
        TIME_STEP = 5,
        animating_object = null,
        supported = {
            opacity: '',
            top:'px',
            bottom:'px',
            left:'px',
            right:'px',
            width: 'px',
            height: 'px',
            fontSize: 'px',
            marginBottom: 'px',
            marginTop: 'px',
            marginLeft: 'px',
            marginRight: 'px',
            backgroundColor: 'rgba',
            color: 'rgba',
            backgroundImage: ''
        };

    ///////////////////////
    // F U N C T I O N S //
    ///////////////////////
    /**
     * @private
     * @function toRGBA
     * @param color
     */
    function toRGBA(color) {
        var color_object,
            color_string,
            colors = null,
            colorString = null;
        if (color.charAt(0) === "#") {
            color = color.substring(1);
            if(color.length === 3){
                color = color.charAt(0)+color.charAt(0)+color.charAt(1)+color.charAt(1)+color.charAt(2)+color.charAt(2);
            }
            color_object = {
                "red" : parseInt(color.substring(0,2),16),
                "green" : parseInt(color.substring(2,4),16),
                "blue" : parseInt(color.substring(4,6),16),
                "alpha" : 1
            };
        } else if (color.toLowerCase().indexOf("rgb(") !== -1) {
            color = color.replace(/[a-zA-Z]+/, '');
            color = color.replace(/ +/mgi, '');
            colors = color.match(/(\d+),(\d+),(\d+)/);
            color_object = {red: colors[1], green: colors[2], blue: colors[3], alpha: 1};

        } else if (color.toLowerCase().indexOf("rgba(") !== -1) {
            color = color.replace(/[a-zA-Z]+/, '');
            color = color.replace(/ +/mgi, '');
            color_object = {
                "red" : parseInt(color.match(/(\d+),/)),
                "green" : parseInt(color.match(/\d+,(\d+),/)[1]),
                "blue" : parseInt(color.match(/\d+,\d+,(\d+),[\d.,]+/)[1]),
                "alpha" : parseFloat(color.match(/\d+,\d+,\d+,([\d.,]+)/)[1])
            };
        }
        colorString = "rgba(" +color_object.red+","+ color_object.green + "," + color_object.blue + "," + color_object.alfa + ")";
        return  {
            colorString : colorString,
            color_object : color_object
        };
    }

    /**
     * @private
     * @function GradientToString
     * @param gradient_string
     * @param gradient_ps_array
     */
    function GradientToString(gradient_string, gradient_ps_array){
        var i = 0;
        for(; i < gradient_ps_array.length; i++) {
            gradient_string = gradient_string.replace("{p" + i + "}", parseInt(gradient_ps_array[i], 10));
        }
        return gradient_string;
    }

    /**
     * @function
     * @param DOM
     */
    function getAnimatingLink (DOM) {
        var i = 0,
            len = animating.length;
        for (i = 0; i < len; i++) {
            if (animating[i].DOM === DOM) {
                return animating[i];
            }
        }
        animating.push({
            DOM: DOM,
            styles: {}
        });
        return animating[len];
    }

    /**
     * @function updateObject
     * @param animating_object
     * @param styles_object
     * @description animating for animating object
     */
    function updateObject(animating_object, styles_object) {
        var key = null,
            start_value = null,
            end_value = null,
            step = null;
        for (key in styles_object) {
            start_value = parseFloat(animating_object.DOM.style[key]) || 0;
            end_value =  styles_object[key];
            step = (end_value - start_value) * TIME_STEP / animation_time;

            animating_object.styles[key] = {
                start_value: parseFloat(animating_object.DOM.style[key] || 0),
                end_value: styles_object[key],
                start_time: start_time,
                end_time: end_time,
                step: step,
                current: parseFloat(animating_object.DOM.style[key] || 0),
                animation_function: animation_function
            };
        }
    }

    /**
     * @private
     * @function animate
     * @description this function fires at every animation cycle
     */
    function animate () {
        if (animating.length === 0) {
            clearInterval(S.core.animateDOM.inter);
            return false;
        }
        var i, key,
            style = null,
            old_interval_time = animate.interval_time,
            time_error = null,
            style_error = null;
        animate.interval_time = (new Date()).getTime();
        time_error = (old_interval_time) ? animate.interval_time - old_interval_time - TIME_STEP : 0;
        // CYCLE
        for (i = 0; i < animating.length; i++) {
            for (key in animating[i].styles) {
                // CALCULATING
                style_error = (time_error) ? (animating[i].styles[key].step * time_error) / TIME_STEP : 0;
                animating[i].styles[key].current = animating[i].styles[key].current + animating[i].styles[key].step + style_error;
                style = animating[i].styles[key].current;
                animating[i].DOM.style[key] = style + 'px';
            }
        }
    }

    /**
     * @private
     * @function clearAnimated
     * @description
     */
    function clearAnimated () {

    }

    /**
     * @private
     * @function tryToStopAnimation
     */
    function tryToStopAnimation () {

    }

    /////////////////////////
    // P R O C E D U R E S //
    /////////////////////////

    animating_object = getAnimatingLink(DOM);       // creating animatin object or getting link if it already exists
    updateObject(animating_object, styles_object);  // animating object updating
    if (!S.core.animateDOM.inter) {                 // launch interval if already not launched
        console.log(1);
        S.core.animateDOM.inter = setInterval(animate, TIME_STEP);
        animate();
    }





    // Draft
    setTimeout (function () {
        clearInterval(S.core.animateDOM.inter);
    }, animation_time);

};
(function () {
    S.core.animateDOM.animating = [];
}());
/**
 * @class S.core.Device
 * @description Native javascript API, and pure device config
 */
S.Class('S.core.Device', {
    $extends: 'function () {};',
    /**
     * @private
     * @property {Number} _callbackExecuted
     */
    _callbackExecuted: 0,
    IS_ANDROID: (/android/gi).test(navigator.appVersion),
    IS_IDEVICE: (/iphone|ipad/gi).test(navigator.appVersion),
    IS_PLAYBOOK: (/playbook/gi).test(navigator.appVersion),
    IS_TOUCHPAD: (/hp-tablet/gi).test(navigator.appVersion),
    HAS_TOUCH: false,
    TOUCH_START_EVENT: this.HAS_TOUCH ? 'touchstart' : 'mousedown',
    TOUCH_END_EVENT: this.HAS_TOUCH ? 'touchend' : 'mouseup',
    TOUCH_MOVE_EVENT: this.HAS_TOUCH ? 'touchmove' : 'mousemove',
    touch_events: [],
    /**
     */
    init: function () {
        this._configure();
    },
    /**
     * @method logConfig
     * @memberOf S.core.Device
     * @description logs device config
     */
    logConfig: function () {
        for (var key in this) {
            var param = this[key];
            if (typeof param === "object" || typeof param === "function") {
                continue;
            }
            console.log('S.device.config: ' + '[' + key + '] => ' + param);
        }
    },
    /**
    /**
     * @description setups configuration
     */
    _configure: function() {
        this.HAS_TOUCH = window.ontouchstart && true;
        this.TOUCH_START_EVENT = this.HAS_TOUCH ? 'touchstart' : 'mousedown';
        this.TOUCH_MOVE_EVENT = this.HAS_TOUCH ? 'touchmove' : 'mousemove';
        this.TOUCH_END_EVENT = this.HAS_TOUCH ? 'touchend' : 'mouseup';
    },
    /**
     * @public
     * @param {String} type Type of event handling. Acceptable values: 'add', 'remove'.
     * @param {DOM object} DOM_obj
     * @param {String} event_type Event type without prefix 'on'. ('touchstart', 'touchend')
     * @param {Function} callBack
     * @param {Boolean} re_init If true - rewrites all listeners added before, if false - adds new listeners to previous added
     */
    eventHandler: function (type, DOM_obj, event_type, callBack, re_init) {
        var new_callBack;
        switch (event_type) {
            case 'mousedown':
            case 'touchstart':
                event_type = this.TOUCH_START_EVENT;
                break;
            case 'mousemove':
            case 'touchmove':
                event_type = this.TOUCH_MOVE_EVENT;
                break;
            case 'mouseup':
            case 'touchend':
                event_type = this.TOUCH_END_EVENT;
                break;
            default:
        }
//        console.log('DEVICE.JS POINT #1', DOM_obj, type, event_type, re_init);
        new_callBack = event_type.indexOf('touch') !== -1 ?
            function (e) {
                delete e.pageX;
                delete e.pageY;
                e.button = 0;
                e.touchX = e.pageX = e.changedTouches[0].pageX;
                e.touchY = e.pageY = e.changedTouches[0].pageY;
                callBack && callBack.call(this, e);
            } :
            function (e) {
                if (e) {
                    e.touchX = e.pageX;
                    e.touchY = e.pageY;
                }
                callBack && callBack.call(this, e);
            };
        if (re_init) {
            if (type === 'add') {
                DOM_obj['on' + event_type] = new_callBack;
            } else {
                delete DOM_obj['on' + event_type];
            }
        } else {
            if (type === 'add') {
                this.touch_events.push(new_callBack, callBack);
            } else {
                if (this.touch_events.indexOf(callBack) !== -1) { // Used to have ability to remove touch type EventListener
                    new_callBack = this.touch_events[this.touch_events.indexOf(callBack) - 1];
                    this.touch_events.splice(this.touch_events.indexOf(callBack) - 1, 2);
                }
            }
            DOM_obj[type + 'EventListener'](event_type, new_callBack);
        }
    },
    /**
     * @public
     * @param {DOM object} DOM_obj
     * @param {String} event_type Event type without prefix 'on'. ('touchstart', 'touchend')
     * @param {Function} callBack
     * @param {Boolean} re_init If true - rewrites all listeners added before, if false - adds new listeners to previous added
     */
    addEventListener: function (DOM_obj, event_type, callBack, re_init) {
        this.eventHandler.apply(this, ['add'].concat(Array.prototype.slice.call(arguments)));
    },
    /**
     * @public
     * @param {DOM object} DOM_obj
     * @param {String} event_type Event type without prefix 'on'. ('touchstart', 'touchend')
     * @param {Function} callBack
     * @param {Boolean} re_init If true - rewrites all listeners added before, if false - adds new listeners to previous added
     */
    removeEventListener: function (DOM_obj, event_type, callBack, re_init) {
        this.eventHandler.apply(this, ['remove'].concat(Array.prototype.slice.call(arguments)));
    }
});
// initing object
S.device = S.New('S.core.Device');
/**
 * @class (Singleton) S.core.ImageLoader
 * @description class is core method for organization images preload before applications start
 */
S.Class('S.core.ImageLoader', {
    /**
     * @property {HTMLObject} _parent parent node for images
     */
    _parent: null,
    /**
     * @property {string} path - path to whole the images
     */
    path: null,
    /**
     * @property {array} images - images array - Application will not run until it loaded
     */
    images: [],
    /**
     * @property {DOMHTMLElement} images render container
     */
    render_container: document.body,
    /**
     * @property {array} lazy_images - images that loads after callback function executed(on background)
     */
    lazy_images: [],
    /**
     * @property {function} callback - function excutes after images loaded
     */
    callback: function () {},
    /**
     * @property {array} array of object that contains sizes for each loaded image
     */
    sizes: [],
    /**
     * @protected
     * @method _loadImages
     * @memberOf S.core.ImageLoader
     * @description adds images to dom so they start loads
     */
    _loadImages: function () {
        var now_loading = 0,
            inter = null,
            _this = this,
            par = document.createElement('DIV');
        par.style.display = 'none';
        this.render_container.appendChild(par);
        this.par = par;
        this.images.forEach(function (src) {
            src = (_this.path) ? _this.path + src : src;
            if (!src) {
                return;
            }
            var el = document.createElement('IMG');
            el.src = src;
            el.onload = function () {
                _this.sizes.push({width: this.width, height: this.height, src: src});
                now_loading--;
            };
            now_loading++;
            par.appendChild(el);
        });
        inter = setInterval(function() {
            if (now_loading === 0) {
                clearInterval(inter);
                _this.callback();
                _this._loadLazyImages();
            }
        }, 10);
    },
    /**
     * @protected
     * @method _loadLazyImages
     * @memberOf S.core.ImageLoader
     * @description loads lazy images
     */
    _loadLazyImages: function () {
        var par = this.par,
            _this = this;
        this.lazy_images.forEach(function(src){
            src = (_this.path) ? _this.path + src : src;
            if(!src) {
                    return;
            }
            var el = document.createElement('IMG');
            el.src = src;
            par.appendChild(el);
        });
    },
    /**
     * @method init
     * @memberOf S.core.ImageLoader
     * @description First step for class example
     */
    init: function () {
        this._loadImages();
    }
});
S.Class('S.core.DragAndDrop', {
    /**
     * @public
     * @property drag_el Object which will be dragged
     * @property drag_zone Object on which drag is allowed
     * @property drop_zone Object on which need to drop drag element
     */
    drag_el: null,
    drag_zone: document.body,
    drop_zone: document.body,
    centering: null,
    area_check: false,
    /**
     * @protected
     * @method _initEvents
     * @description Initializes drag and drop events
     */
    _initEvents: function () {
        var _this = this;
        if (!Array.isArray(this.drop_zone)) {
            this.drop_zone = [{zone: this.drop_zone, onDrop: function () {}}];
        }
        // Touch start event
        this.drag_el.onmousedown = function touchStart (e) {
            e.stopPropagation();
            if (e.button === 0) { // drag starts only if left mouse button is down
                var start_cursor_pos = { // Start cursor position (in document.body)
                    x: e.pageX,
                    y: e.pageY
                },
                    start_el_offset = { // Start element offsets from parent node
                        x: _this.drag_el.offsetLeft,
                        y: _this.drag_el.offsetTop
                    },
                    start_el_cursor_offset = { // Start element cursor offsets
                        x: e.offsetX,
                        y: e.offsetY
                    },
                    max_zone_pos = { // Maximum position of dragged element
                        x: _this.drag_zone.offsetWidth - _this.drag_el.offsetWidth,
                        y: _this.drag_zone.offsetHeight - _this.drag_el.offsetHeight
                    }, prop, prevent_simple_onclick = 0;
                setElementPosition(start_el_offset);
                this.style.zIndex = '100';
                this.style.right = this.style.bottom = 'auto';
                if (start_el_offset.x < 0) {
                    max_zone_pos.x += _this.drag_el.offsetWidth;
                }
                for (prop in max_zone_pos) {
                    if (max_zone_pos[prop] < 0) {
                        max_zone_pos[prop] = 0;
                    }
                }
                if (_this.centering) {
                    if (_this.centering.indexOf('x') !== -1) {
                        _this.drag_el.style.left = Math.abs(start_el_offset.x) + start_el_cursor_offset.x - _this.drag_el.offsetWidth / 2 + 'px';
                        start_el_cursor_offset.x = _this.drag_el.offsetWidth / 2;
                        start_el_offset.x = _this.drag_el.offsetLeft;
                    }
                    if (_this.centering.indexOf('y') !== -1) {
                        _this.drag_el.style.top = start_el_offset.y + start_el_cursor_offset.y - _this.drag_el.offsetHeight / 2 + 'px';
                        start_el_cursor_offset.y = _this.drag_el.offsetHeight / 2;
                        start_el_offset.y = _this.drag_el.offsetTop;
                    }
                }
                /**
                 * @function setElementPosition
                 * @description Sets dragged element position to desired
                 * @param {object} pos Desired position of dragged element (e.g.: {x: 100, y: 50})
                 */
                function setElementPosition (pos) {
                    _this.drag_el.style.left = pos.x + 'px';
                    _this.drag_el.style.top = pos.y + 'px';
                }
                /**
                 * @function clearMouseMove
                 * @description Used to prevent simple onclick on dragged element
                 */
                function clearMouseMove () {
                    document.body.removeEventListener('mousemove', touchMove);
                    document.body.removeEventListener('mouseup', clearMouseMove);
                }
                /**
                 * @function touchMove
                 * @description Function called on touch move event
                 * @param {object} e Window event handler
                 */
                function touchMove (e) {
                    if (prevent_simple_onclick < 2) {
                        prevent_simple_onclick++;
                    } else {
                        var current_cursor_pos = { // Current cursor position
                            x: e.pageX,
                            y: e.pageY
                        },
                            current_el_pos = { // Current element position
                                x: current_cursor_pos.x - start_cursor_pos.x + start_el_offset.x,
                                y: current_cursor_pos.y - start_cursor_pos.y + start_el_offset.y
                            };
                        // Prevent drag out drag zone
                        if (current_el_pos.x < 0 || current_el_pos.y < 0 || current_el_pos.x > max_zone_pos.x || current_el_pos.y > max_zone_pos.y) {
                            if (current_el_pos.x < 0) {
                                current_el_pos.x = 0;
                            } else if (current_el_pos.x > max_zone_pos.x) {
                                current_el_pos.x = max_zone_pos.x;
                            }
                            if (current_el_pos.y < 0) {
                                current_el_pos.y = 0;
                            } else if (current_el_pos.y > max_zone_pos.y) {
                                current_el_pos.y = max_zone_pos.y;
                            }
                        }
                        setElementPosition(current_el_pos);
                        document.body.removeEventListener('mouseup', clearMouseMove);
                        document.body.addEventListener('mouseup', touchEnd);
                    }
                }
                /**
                 * @function touchEnd
                 * @description Function called on touch end event
                 */
                function touchEnd () {
                    var drop_zones_offsets = [], el_pos, i, area_cover = [];
                    /**
                     * @function getOffset
                     * @description Gets general element's offset
                     * @param {object} el Element to calculate
                     * @param {string} type Offset type ('Left'/'Top')
                     * @return {integer} General offset
                     */
                    function getOffset (el, type) {
                        var offsetType = 'offset' + type;
                        return el[offsetType] + (el.parentNode[offsetType] === undefined ? 0 : getOffset(el.parentNode, type));
                    }
                    for (i = 0; i < _this.drop_zone.length; i++) {
                        drop_zones_offsets.push({ // Drop zone offset
                            x: getOffset(_this.drop_zone[i].zone, 'Left'),
                            y: getOffset(_this.drop_zone[i].zone, 'Top')
                        });
                    }
                    el_pos = {
                        x: getOffset(_this.drag_el, 'Left'),
                        y: getOffset(_this.drag_el, 'Top')
                    };
                    // If dropped out of drop zone, then set dragged element position to start (or to nearest drop field)
                    for (i = 0; i < _this.drop_zone.length; i++) {
                        var cover = {
                            top: el_pos.y < drop_zones_offsets[i].y ? (el_pos.y + _this.drag_el.offsetHeight > drop_zones_offsets[i].y ? drop_zones_offsets[i].y : 0) : (el_pos.y < drop_zones_offsets[i].y + _this.drop_zone[i].zone.offsetHeight ? el_pos.y : 0),
                            bottom: el_pos.y + _this.drag_el.offsetHeight > drop_zones_offsets[i].y + _this.drop_zone[i].zone.offsetHeight ? (el_pos.y < drop_zones_offsets[i].y + _this.drop_zone[i].zone.offsetHeight ? drop_zones_offsets[i].y + _this.drop_zone[i].zone.offsetHeight : 0) : (el_pos.y + _this.drag_el.offsetHeight > drop_zones_offsets[i].y ? el_pos.y + _this.drag_el.offsetHeight : 0), // 370! }:E
                            left: el_pos.x < drop_zones_offsets[i].x ? (el_pos.x + _this.drag_el.offsetWidth > drop_zones_offsets[i].x ? drop_zones_offsets[i].x : 0) : (el_pos.x < drop_zones_offsets[i].x + _this.drop_zone[i].zone.offsetWidth ? el_pos.x : 0),
                            right: el_pos.x + _this.drag_el.offsetWidth > drop_zones_offsets[i].x + _this.drop_zone[i].zone.offsetWidth ? (el_pos.x < drop_zones_offsets[i].x + _this.drop_zone[i].zone.offsetWidth ? drop_zones_offsets[i].x + _this.drop_zone[i].zone.offsetWidth : 0) : (el_pos.x + _this.drag_el.offsetWidth > drop_zones_offsets[i].x ? el_pos.x + _this.drag_el.offsetWidth : 0)
                        },
                            area = (cover.right - cover.left) * (cover.bottom - cover.top);
                        area_cover.push(area);
                        if (el_pos.x >= drop_zones_offsets[i].x && el_pos.y >= drop_zones_offsets[i].y && el_pos.x + _this.drag_el.offsetWidth <= drop_zones_offsets[i].x + _this.drop_zone[i].zone.offsetWidth && el_pos.y + _this.drag_el.offsetHeight <= drop_zones_offsets[i].y + _this.drop_zone[i].zone.offsetHeight) {
                            _this.drop_zone[i].onDrop && _this.drop_zone[i].onDrop(i);
                            break;
                        }
                    }
                    if (i === _this.drop_zone.length) {
                        if (_this.area_check) {
                            var max_hit_id = 0;
                            for (i = 1; i < area_cover.length; i++) {
                                if (area_cover[i] > area_cover[max_hit_id]) {
                                    max_hit_id = i;
                                }
                            }
                            _this.drop_zone[max_hit_id].onDrop && _this.drop_zone[max_hit_id].onDrop(max_hit_id);
                        } else {
                            setElementPosition(start_el_offset);
                        }
                    }
                    _this.drag_el.style.zIndex = '10';
                    document.body.removeEventListener('mousemove', touchMove);
                    document.body.removeEventListener('mouseup', touchEnd);
                }
                document.body.addEventListener('mousemove', touchMove);
                document.body.addEventListener('mouseup', clearMouseMove);
            }
        };
    },
    /**
     * @public
     * @method init
     * @description Initialize drag and drop component
     */
    init: function () {
        this._initEvents();
    }
});
/**
 * @author S.onenko
 */
S.core.XML = {
    /**
     *
     */
    XMLtoJSON: function () {

    },
    /**
     * @public
     * @function JSONtoXML
     * @param {string} str JSON string
     * @param {string} root_name name for root element
     * @description converts JSON string to XML DOM object
     * @return {DOMHtmlObject}
     */
    JSONtoXML: function (str, root_name) {
        return S.core.XML.objectToXML(JSON.parse(str), root_name || 'root');
    },
    /**
     * @public
     * @function objectToXML
     * @param obj {object}
     * @param root_name {string}
     * @description converts JS native object to XML object
     * @return {DOMHtmlObject}
     * TODO - research for native methods
     */
    objectToXML: function (obj, root_name) {
        root_name = root_name || 'root';
        var root_el = document.createElement(root_name);
        if (typeof obj === 'string' || typeof obj === "boolean" || typeof obj === "number" ) {
            root_el.innerHTML = obj.toString();
        } else if (typeof obj === "function") {
            root_el.innerHTML = obj.toString();
        } else if (Array.isArray(obj)) {
            for (var i = 0; i < obj.length; i++) {
                root_el.appendChild(S.core.XML.objectToXML(obj[i], 'item'));
            }
        } else if (typeof obj === "object") {
            for (var key in obj) {
                if(obj.hasOwnProperty(key)) {
                    root_el.appendChild(S.core.XML.objectToXML(obj[key], key));
                }
            }
        }
        return root_el;
    }
};
/**
 * @author Sergey Onenko
 * @description namespace contains functions for dom manipulation
 */
S.core.DOM = {
    /**
     * @namespace S.core.DOM.Event
     * @description namespace for DOM events manipulation
     */
    Event: {
        /**
         * @function fireEvent
         * @description fires event on dom
         * @param {DOMHTMLObject} el - link to HTMLObject
         * @param {string} etype evant type
         */
        fireEvent: function (el, etype) {
            if (el.fireEvent) {
                (el.fireEvent('on' + etype));
            } else {
                var evObj = document.createEvent('Events');
                evObj.initEvent(etype, true, false);
                el.dispatchEvent(evObj);
            }
        },
        /**
         * @description временный костыль для contenteditable
         * TODO - снести эту гадость
         * @param DOM
         */
        makeContentEditable: function (DOM) {
            arguments.callee.now_editable = arguments.callee.now_editable || [];
            var now_editable = arguments.callee.now_editable;
            DOM.addEventListener('click', function () {
                var _this = this;
                this.setAttribute('contenteditable', 'true');
                now_editable.forEach(function (item) {
                    if (item !== _this) {
                        item.removeAttribute('contenteditable');
                    }
                });
                if (now_editable.indexOf(this) === -1) {
                    now_editable.push(this);
                }
                this.focus();
            });
        }
    },
    /**
     *
     */
    makeWholeNeededEditable: function () {
//        setTimeout(function () {
//            var whole1 = document.querySelectorAll('*[contenteditable="true"]'),
//                whole = S.core.Array.toArray(whole1);
//            whole.forEach (function (item) {
//                item.removeAttribute('contenteditable');
////            if (item.hasAttribute('now_editable')) {
////                //return false;
////            }
//                S.core.DOM.Event.makeContentEditable(item);
//                //item.setAttribute('now_editable', 'true');
//            });
//        },100);
    },
    /**
     * @public
     * @function move
     * @description moves elements in DOM
     * @param from
     * @param to
     */
    move: function (from, to) {
        var par_from = from.parentNode,
            par_to = to.parentNode,
            temp = document.createElement('div'),
            temp_from = par_from.replaceChild(temp, from),
            temp_to = par_to.replaceChild(temp_from, to);
        par_from.replaceChild(temp_to, temp);
    },
    /**
     * @public
     * @function removeAll
     * @description removes all the child nodes from DOM
     * @param {DOMHTMLObject} DOM
     * return {DOMHTMLObject} DOM =)
     */
    removeAll: function (DOM) {
        var len = DOM.childNodes.length;
        while (len) {
            DOM.removeChild(DOM.childNodes[len -1]);
            len--;
        }
        return DOM;
    },
    /**
     *
     * @param DOM
     * @param styles
     */
    massCSS: function (DOMs, styles) {
        var i = 0,
            len = DOMs.length;
        for (; i < len; i++) {
            S.addParams(DOMs[i].style, styles);
        }
    },
    /**
     * @description Reinits elements from _elements array using input object (saved LS data)
     */
    initElementsWithIds: function (_this, obj) {
        var prop_el;
        for (prop_el in obj) {
            _this[prop_el + '_id'] = obj[prop_el];
            _this[prop_el + '_el'] = document.getElementById(_this[prop_el + '_id']);
        }
    },
    /**
     * @description Returns elements ids from using _elements array
     * @param {Object} obj Instance of component with _elements array within
     */
    getElementsIds: function (obj) {
        var to_return = {},
            i;
        if (obj && obj._elements && obj._elements.length) {
            for (i = 0; i < obj._elements.length; i++) {
                to_return[obj._elements[i]] = obj[obj._elements[i] + '_id'];
            }
        }
        return to_return;
    },
    /**
     *
     */
    getFileLocation: function () {
        var loc = document.location.href,
            file_path = loc.substring(0, loc.lastIndexOf('/') + 1);
        return file_path;
    },
    /**
     *
     */
    getFileName: function () {
        var loc = document.location.href,
            file_name = loc.substring(loc.lastIndexOf('/') + 1, loc.lastIndexOf('.'));
        return file_name;
    }
};
S.getLastChild= S.core.DOM.getLastChild;
S.core.LS = {
    /**
     *
     */
    getFileLocation: function () {
        var loc = document.location.href,
            file_path = loc.substring(0, loc.lastIndexOf('/') + 1);
        return file_path;
    },
    /**
     *
     */
    getFileName: function () {
        var loc = document.location.href,
            file_name = loc.substring(loc.lastIndexOf('/') + 1, loc.lastIndexOf('.'));
        return file_name;
    },
    /**
     *
     * @param data
     */
    set: function (data, is_global, prefix_value) {
        var prefix = is_global ? 'Global' : this.getFileName();
        if (prefix_value && prefix_value.length) {
            prefix = prefix_value;
        }
        localStorage.setItem(prefix + '.storage', JSON.stringify(data));
        localStorage.setItem(prefix + '.exist', 'true');
    },
    /**
     *
     */
    reset: function (is_global) {
        var prefix = is_global ? 'Global' : this.getFileName();
        localStorage.removeItem(prefix + '.storage');
        localStorage.removeItem(prefix + '.exist');
    },
    /**
     *
     */
    clear: function () {
        localStorage.clear();
    },
    /**
     *
     */
    get: function (is_global, prefix_value) {
        var prefix = is_global ? 'Global' : this.getFileName();
        if (prefix_value && prefix_value.length) {
            prefix = prefix_value;
        }
        return JSON.parse(localStorage.getItem(prefix + '.storage'));
    },
    /**
     *
     */
    exist: function (is_global, prefix_value) {
        var prefix = is_global ? 'Global' : this.getFileName();
        if (prefix_value && prefix_value.length) {
            prefix = prefix_value;
        }
        return JSON.parse(localStorage.getItem(prefix + '.exist'));
    },
    /**
     *
     */
    build_UI: function () {
        var new_script = document.createElement('script');
        new_script.src = 'http://localhost/js_animator/S/incubator_UI/Reinit_via_LS/LS_UI/brain.js?rnd=' + parseInt(Math.random() * 10000);
        document.body.appendChild(new_script);
    }
};
S.core.inputFilter = function (dom_el, type, length) {
    var acceptable_values = [];
    /**
     *
     * @param bottom_border
     * @param top_border
     */
    function makeArrayWidthBorders (bottom_border, top_border) {
        var i = 0,
            length = top_border - bottom_border;
        for (; i <= length; i++) {
            acceptable_values.push(bottom_border + i);
        }
    }
    switch (type) {
        case 'number':
            makeArrayWidthBorders(48, 57);
//            if (add_type === 'float') {
//                acceptable_values.push(46);
//            }
            break;
        case 'symbol':
            switch  (add_type) {
                case 'latince':
                    makeArrayWidthBorders(97, 122);
                    break;
                case 'LATINCE':
                    makeArrayWidthBorders(65, 90);
                    break;
                case 'KIRILICA':
                    makeArrayWidthBorders(192, 223);
                    break;
            }
            break;
        default:
    }
    dom_el.addEventListener('keypress', function (e) {
        if (dom_el.innerHTML.length >= length || (acceptable_values.indexOf(e.keyCode) === -1 && e.keyCode !== 13)) {
            e.preventDefault();
        }
    });
};

/*
    TODO:
        different filters:
            number with add_type 'float'
            a-zA-Z type
            own type, like 'abcdfeiwj123152'
*/
if (window.testStorage) {
    S.core.storage = window.testStorage;
} else if (window.localStorage) { // LS methods realisation
    S.core.storage = {
        /**
         */
        setTestData: function (id, data) {
            localStorage.setItem(id + '-test', JSON.stringify(data));
        },
        /**
         */
        getTestData: function (id) {
            return JSON.parse(localStorage.getItem(id + '-test')) || { childs: [] };
        },
        /**
         */
        setReviewData: function (id, test_id, data) {
            if (test_id !== undefined) {
                test_id += '-test_';
            } else {
                test_id = '';
            }
            if (arguments.length < arguments.callee.length) {
                data = arguments[arguments.length - 1];
                arguments[arguments.length - 1] = null;
            }
            localStorage.setItem(test_id + id + '-review_data', JSON.stringify(data));
        },
        /**
         */
        getReviewData: function (id, test_id) {
            if (test_id !== undefined) {
                test_id += '-test_';
            } else {
                test_id = '';
            }
            return JSON.parse(localStorage.getItem(test_id + id + '-review_data'));
        },
        /**
         */
        setQuestionData: function (id, review_id, test_id, data) {
            if (test_id !== undefined) {
                test_id += '-test_';
            } else {
                test_id = '';
            }
            if (arguments.length < arguments.callee.length) {
                data = arguments[arguments.length - 1];
                arguments[arguments.length - 1] = null;
            }
            localStorage.setItem(test_id + review_id + '-review_' + id + '-question_data', JSON.stringify(data));
        },
        /**
         */
        getQuestionData: function (id, review_id, test_id) {
            if (test_id !== undefined) {
                test_id += '-test_';
            } else {
                test_id = '';
            }
            review_id === null && (review_id = 'X');
            return JSON.parse(localStorage.getItem(test_id + review_id + '-review_' + id + '-question_data'));
        },
        /**
         */
        setQuestionResult: function (id, review_id, test_id, score) {
            if (test_id !== undefined) {
                test_id += '-test_';
            } else {
                test_id = '';
            }
            review_id === null && (review_id = 'X');
            if (arguments.length < arguments.callee.length) {
                score = arguments[arguments.length - 1];
                arguments[arguments.length - 1] = null;
            }
            localStorage.setItem(test_id + review_id + '-review_' + id + '-question_score', JSON.stringify(score));
        },
        /**
         */
        getQuestionResult: function (id, review_id, test_id) {
            if (test_id !== undefined) {
                test_id += '-test_';
            } else {
                test_id = '';
            }
            review_id === null && (review_id = 'X');
            return JSON.parse(localStorage.getItem(test_id + review_id + '-review_' + id + '-question_score'));
        },
        /**
         * @description DEBUG API
         */
        build_UI: function () {
            var new_script = document.createElement('script');
            new_script.src = 'http://localhost/js_animator/S/incubator_UI/Reinit_via_LS/LS_UI/brain.js?rnd=' + parseInt(Math.random() * 10000);
            document.body.appendChild(new_script);
        },
        /**
         */
        setGalleryResult: function (id, data) {

            localStorage.setItem(id, JSON.stringify(data));
        },

        getGalleryResult: function(id){
            return JSON.parse(localStorage.getItem(id));
        }
    };
} else {
    S.core.storage = null;
}

/**
 * @class S.data.Store
 * @description provide storage and serverside connection 
 */
S.Class('S.data.Store',{
    
    
    /////////////////////////
    // P R O P E R T I E S //
    /////////////////////////
    
    
    /**
     * @property {string} extend string for extension
     */
    $extends: 'function () {};',
    
    
    /**
     * @property {string} url - url for request
     */
    url: '',
    
    
    /**
     * @property {string} cachabke if true - than no cache 
     */
    cachable: false,
    
    
    /**
     * @property {array} records - records in store
     */
    records: null, //[],
    
    
    /**
     * @property {integer} store records
     */
    total: 0,
    
    
    /**
     * @property {string} request_method - request method
     */
    request_method: 'POST',
    
    
    /**
     * @property {string} total_property - expected total property from server responce, defaults total
     */
    total_property: 'total',
    
    
    /**
     * @property {string} records_property - expected records property from server responce, defaults records
     */
    records_property: 'records',
    
    
    /**
     * @property {mixed} request_data data for request
     */
    request_data: null,
    
    
    /**
     * @property {boolean} auto_load if true - than store will loads just after it initialization
     */
    auto_load: false,
    
    
    
    ///////////////////
    // M E T H O D S //
    ///////////////////
    
    
    /**
     * @method load
     * @memberOf S.data.Store
     * @description starts connection with server and load data from server also launchs onAfterLoad event
     * @param {object} overrides - params that can override class params
     */
    load: function (overrides) {
        var _this = this;
        
        if (!overrides) {
           overrides = {};
        }
        
        // copy and rewrite this
        var overriden = S.override(_this, overrides);
        
        var dc = (_this.cachable === false) ? S.resources_manager.catchAddon() : '';
        
        S.ajax({
            url: overriden.url + dc,
            method: overriden.request_method,
            data: overriden.request_data,
            success: function (data, text) {
                var obj = JSON.parse(text);
                _this.total = obj[_this.total_property];
                _this.records = obj[_this.records_property];
                overriden.onLoad(data, text);
                _this.onAfterLoad(_this, data, text);
            }
        });
    },
    
    
    /**
     * @method init
     * @memberOf S.data.Store
     * @description initialization
     * @return current object
     */
    init: function () {
        this.id = this.id || S.genId();
        S.temp.createdComponents[this.id] = this;
        if (this.auto_load === true) {
            this.load();
        }
        return this;
    },
    
    
    /////////////////
    // E V E N T S //
    /////////////////
    
    
    /**
     * @event onLoad
     * @memberOf S.data.Store
     * @description executes just after store loaded
     * @param {object} data from server
     * @param {string} text server responce text 
     */
    onLoad: function (data, text) {},
    
    
    /**
     * @event onAfterLoad
     * @memberOf S.data.Store
     * @description executes just after store loaded, and after onLoad event
     * @param {object} current store object
     * @param {object} data from server
     * @param {string} text server responce text 
     */
    onAfterLoad: function (store, data, text) {}
});
/**
 * @class
 * @namespace S.component
 * @descriotion basic abstract class for Component Design creating
 */
S.Class('S.component.AbstractComponent', {
    
    /////////////////////////////
    //### PROTECTED PROPERTIES //
    /////////////////////////////
    
    
    $extends: 'function(){};'/*, // String for eval
    
    $requires: null,        // Array
    _tpl: null,             // Array 
    _tpl_compiled: null,    // String
    _elements: null,        // Array
    _items_compilled: null, // String
    
    
    //////////////////////////
    //### PUBLIC PROPERTIES //
    //////////////////////////
    
    
    auto_render: null,      // Boolean
    style: null,            // Object
    render_to: null,        // mixed
    tagName: null,          // String
    className: null,        // String
    id: null,               // String
    innerHTML: null,        // Strnig
    items: null,            // Array
    events: null,           // Array
    

    //////////////////////////
    //### PROTECTED METHODS //
    //////////////////////////
    
    
    _lazyItemsExtract: function(){},
    _compileItems: function(){},
    _compile: function(){},
    _compileStyles: function(){},
    _getDomTarget: function(){},
    _applyTemplate: function(){},
    _setupChildsElement: function(){},
    _decorateEvents: function(){},
    $callParentMethod: function(){},
    _setup_elements: function(){},
    _genIds: function(){},
    _registerComponent: function(){},
    
    ///////////////////////
    //### PUBLIC METHODS //
    ///////////////////////
    render: function(){},
    show: function(){},
    hide: function(){},
    destroy: function(){},
    addListener: function(){},
    get: function(){},
    set: function(){},
    init: function(){}
    
    
    ///////////////
    //### EVENTS //
    ///////////////
    
    */
});
/**
 * @class
 * @namespace S.component
 * @description basic abstract class for extending
 */
S.Class('S.component.Component', {
    /////////////////////////////
    //### PROTECTED PROPERTIES //
    /////////////////////////////
    /**
     * @property {object / null} extend class that extends for creating new class
     */
    $extends: 'S.component.AbstractComponent',
    /**
     * @property {array} _requres - resourses needed for creating current class
     **/
    $requires: ['S.component.AbstractComponent'],
    /**
     * @property {string} _tpl component template string
     */
    _tpl: [
        '<{tagName} id="{el_id}" class="{className}" style="{_styles_compiled}" >',
            '{innerHTML}{_items_compiled}',
        '</{tagName}>'
    ],
    /**
     * @property {string} _tpl_compiled component template string compiled - is using by Parent Components that includes this component as item
     */
    _tpl_compiled: '',
    /**
     * @property {string} _styles_compiled compiled to string styles
     */
    _styles_compiled: '',
    /**
     * @property {array} items array of _elements need to find in DOM, and generate for them ids, for shorthand
     */
    _elements: [
        'root'
    ],
    /**
     * @property {string} _items_compiled compiled items HTML string
     */
    _items_compiled: '',
    /**
     * @property {array} events
     */
    _events: [
        'onBeforeInit',
        'onAfterRendered'
    ],
    //////////////////////////
    //### PUBLIC PROPERTIES //
    //////////////////////////
    /**
     * @property {boolean} auto_render - if true than at init will creates DOMElement for current component(true only for such compoinent as Window)
     */
    auto_render: false,
    /**
     * @property {object} style overrides for root_el styles 
     */
    style: {},
    /**
     * @property {string / DOMHtmlElement / object} render_to copmonent.id, or DOMHtmlElement id, or DOMHtmlElement, or, component, target for component for render
     */
    render_to: document.body,
    /**
     * @property {string} tag_name - base container tagName
     */
    tagName: 'div',
    /**
     * @property {string} className - base container className
     * @property {String} className_plus Addition className
     */
    className: '',
    className_plus: null,
    /**
     * @property {string} id component id that adds to S.temp.created_components for using S.getComponent(id), by defaults generates by S.genId();
     */
    id: null,
    /**
     * @property {string} innerHTML component InnerHTML
     */
    innerHTML: '',
    /**
     * @property {array} items array of components that should be added to current component {body} - see template, if items length === 0, than uses this.html to override
     */
    items: null,
    store: null,
    _defaults: {
        items: []
    },
    /**
     */
    _initWithStore: function () {
        console.log('init with store, store: ', this.store)
        if (this.store) {
            this.store.self && S.addParams(this, this.store.self);
            this.store.elements && S.core.DOM.initElementsWithIds(this, this.store.elements);
            this.id = this.store.id || S.genId.current;
        }
    },
    //////////////////////////
    //### PROTECTED METHODS //
    //////////////////////////
    /**
     * @protected
     * @method _lazyItemsExtract
     * @description extracts component items if it created using lazy_type
     */
    _lazyItemsExtract: function () {
        var key, item, type;
        for (key in this.items) {
            item = this.items[key];
            // item is not lazy
            if (!item.lazy_type) {
                continue;
            }
            type = item.lazy_type;
            delete item.lazy_type;
            // So item is realy lazy =)
            this.items[key] = S.New(type, item);
        }
    },
    /**
     * @method
     * @description compiles items template and builds this._items_compiled
     */
    _compileItems: function () {
        var _this = this,
            key, item;
        for (key in _this.items) {
            item = this.items[key];
            _this._items_compiled += item._tpl_compiled;
        }
    },
    /**
     * @method
     * @description compiles component to this._tpl_compiled
     */
    _compile: function () {
        var tpl = this._tpl.join(''),
            className_count, i, index, tmp_tpl, new_tpl, cyfix;
        this._tpl_compiled = S.core.template.compile(tpl, this);
        if (this.className_plus) {
            className_count = this._tpl_compiled.match(new RegExp(this.className, 'gmi')).length;
            tmp_tpl = this._tpl_compiled.slice();
            new_tpl = '';
            for (i = 0; i < className_count; i++) {
                index = tmp_tpl.indexOf(this.className) + this.className.length;
                new_tpl += tmp_tpl.slice(0, index);
                tmp_tpl = tmp_tpl.slice(index);
                cyfix = tmp_tpl.slice(0, tmp_tpl.indexOf('"'));
                new_tpl += cyfix + ' ' + this.className_plus;
            }
            new_tpl += tmp_tpl;
            this._tpl_compiled = new_tpl;
        }
    },
    /**
     * @protected
     * @method _compileStyles
     * @description compiles styles line for current component
     */
    _compileStyles: function () {
        var key;
        for (key in this.style) {
            this._styles_compiled += " " + key + ":" + this.style[key] + ";";
        }
    },
    /**
     *
     */
    _initDefaults: function () {
        var prop,
            tmp = this;
        while (true) {
            tmp = tmp.__proto__;
            if (tmp.constructor.name !== 'Object') {
                if (tmp._defaults) {
                    for (prop in tmp._defaults) {
                        if (this._defaults[prop] === undefined) {
                            this._defaults[prop] = tmp._defaults[prop];
                        }
                    }
                }
            } else {
                break;
            }
        }
        for (prop in this._defaults) {
            if (this[prop] === null) {
                if (typeof this._defaults[prop] === 'object') {
                    this[prop] = JSON.parse(JSON.stringify(this._defaults[prop]));
                } else {
                    this[prop] = this._defaults[prop];
                }
            }
        }
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @description gets DOM target for current component render
     * @return {HTMLElement} target element
     */
    _getDomTarget : function () {
        // ID
        if (this.dom_id) {
            return this.render_to = document.getElementById(this.dom_id);
        }
        // string
        if (typeof this.render_to === 'string') {
            // componentID
            if (S.temp[this.render_to]) {
                return S.temp[this.render_to].itemsDom;
            // DOM id
            } else {
                return document.getElementById(this.render_to);
            }
        }
        // DOM
        if (this.render_to && this.render_to.tagName) {
            return this.render_to;
        }
        // element
        if (this.render_to && this.target.itemsDom) {
            return this.target.itemsDom;
        }
        // default
        return document.body;
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @description applies template to current component
     * @return {object} current object
     */
    _applyTemplate: function () {
        var tpl = this._tpl,
            key = null,
            pat = null,
            el = null;
        for (key in this.placeholders) {
            pat = this.placeholders[key];
            el = this.tplValues[key];
            if (el) {
                tpl = tpl.replace(pat, el);
            }
        }
        return this;
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @desxription looks at dom and setup element for current component
     */
    _setupChildsElement: function (recursive) {
        var i, item;
        for (i = 0; i < this.items.length; i++) {
            item = this.items[i];
            item._setupElements();
            if (recursive === true) {
                item._setupChildsElement(true);
            }
        }
    },
    /**
     * @protected
     * @method _callChildsRendered
     * @memberOf S.component.Component
     * @desxription calls rendered event in each child component
     */
    _callChildsRendered: function (recursive) {
        var i, item;
        for (i = 0; i < this.items.length; i++) {
            item = this.items[i];
            item.rendered();
            if (recursive === true) {
                item._callChildsRendered(true);
            }
        }
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @description adds every event from this._events array
     * @ FIX ME - NEED TO DO SOME LIKE FLASH LISTENERS
     */
    _decorateEvents: function () {
        var _this = this,
            events = this._events,
            key = null,
            eventName = null,
            methodName = null,
            when = null,
            emptyFunction = function () {return function () {}; };
        if (!events || !Array.isArray(events)) {
            return false;
        }
        for (key in events) {
            eventName = events[key];
            methodName = S.getMethodNameByEventName(eventName);
            when = (eventName.indexOf('onBefore') !== -1) ? 'before' : 'after';
            if (!this[eventName]) {
                this[eventName] = emptyFunction();
            }
            // decorate
            this[methodName] = function (func, when, that, eventName) {
                return function () {
                    var args = Array.prototype.splice.call(arguments, 0);
                    // onBefore
                    if (typeof that[eventName] === 'function' && when === 'before') {
                        that[eventName].apply(this, args || []);
                    }
                    // call
                    func.apply(this, args || []);
                    // onAfter
                    if (typeof that[eventName] === 'function' && when === 'after') {
                        that[eventName].apply(this, args || []);
                    }
                    // train
                    return this;
                };
            } (this[methodName], when, _this, eventName);
        }
        return this;
    },
    /**
     * @method
     * @description searchs _elements in dom by generated IDs and adds them to component properties
     */
    _setupElements: function () {
        var key = 0,
            el_name = null,
            el_id = null;
        for (; key < this._elements.length; key++) {
            el_name = this._elements[key];
            el_id = this[el_name + '_id'];
            this[el_name + '_el'] = document.getElementById(el_id);
        }
    },
    /**
     * @method
     * @memberOF S.component.Component
     * @description Generates random IDs for each component needed in DOM
     */
    _genIds: function (suffix) {
        var key = null,
            el_name = null;
        for (key in this._elements) {
            el_name = this._elements[key];
            this[el_name + '_id'] = this[el_name + '_id'] || S.genId(suffix);
        }
    },
    ///////////////////////
    //### PUBLIC METHODS //
    ///////////////////////
    /**
     * @method
     * @memberOF S.component.Component
     * @description addns component to DOM
     * @return {object} current object
     */
    render: function () {
        var target = this._getDomTarget(),
            temp1 = document.createElement('div'),
            el;
        temp1.innerHTML = this._tpl_compiled;
        el = temp1.children[0];
        if (!this.insert_before) {
            target.appendChild(el);
        } else if (this.insert_before.parentNode === target) {
            target.insertBefore(el, this.insert_before);
        }
        // Childs init
        this._setupElements();
//        this._setupChildsElement(true);
//        this._callChildsRendered(true);
        this.rendered();
        return this;
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @description shows created component dom (style.display = block)
     * @return {object} current object
     */
    show: function () {
        this.root_el.style.display = '-webkit-box';
        return this;
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @description hides created component dom (style.display = none)
     * @return {object} current object
     */
    hide: function () {
        this.root_el.style.display = 'none';
        return this;
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @description destroys component, and cut component link from S.temp.components
     */
    destroy: function () {
        var par = this.root_el.parentElement;
        if (par.childNodes.length > 0) {
            par.removeChild(this.root_el);
        }
        S.component_manager.removeComponent(this.id);
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @description adds Listener any method of created object
     * @param {string} methodName name of method for Listener adding
     * @param {string} when listener shod be called (before / after), defaults before
     * @param {function} func function that adds as listener
     * @return {object} current object
     * @FIXME
     */
    addListener: function (methodName, when, func) {
        if (!when) {
            when = 'before';
        }
        this[methodName] = S.registerListeners(this[methodName], when, func);
        return this;
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @description uses for getting component params, fist time searchs in component.el.styles, than  component.el and component.
     * example:
     * <code>
     * var a = S.New(S.component.Container,{width: 200})
     * console.log(a.get('width')); // 200
     * </code>
     * @param {string} what propery name that should gets
     * @return {mixed} founded result in component
     */
    get: function (what, el) {
        el = el || this.root_el;
        if (el.style[what]) {
            return el.style[what];
        } else if (el[what]) {
            return el[what];
        } else {
            return this[what];
        }
    },
    /**
     * @method
     * @memberOf S.component.Component
     * @description tryes to set CSS property if it suppoted
     * @param {object} obj object with params to set current component
     * @return {object} current component
     */
    set: function (obj, el) {
        el = el || this.root_el;
        var css = ['width', 'height', 'left', 'top', 'color', 'background-color'],
            key = null,
            val = null;
        for (key in obj) {
            val = obj[key];
            if (css.indexOf(key) !== -1) {
                this.root_el.style[key] = val;
                this[key] = val;
            }
        }
        return this;
    },
    /**
     * @description
     * @param props
     * @param render
     */
    add: function (props, render) {
        var lazy_type = props.lazy_type,
            cmp;
        if (lazy_type) {
            delete props.lazy_type;
            cmp = S.New(lazy_type, props);
        } else {
            cmp = props;
        }
        cmp.render_to = render || this.root_el;
        cmp.render();
        // innerHTML changed - so we must research elements by ID
        this.items.push(cmp);
    },
    /**
     * @method
     * @memberOF S.component.Component
     * @description initializes component
     * @return {object} current object
     */
    init: function () {

        if (!this.store) {
            this.id = this.id || S.genId();
            // if no id
            this._genIds();
            // if items is lazy - go extract them
            this._lazyItemsExtract();
            // compile template
            this._compileStyles();  // this.style to inline
            this._compileItems();   // compile items templates and add templates to this._items_compiled
            this._compile();        // compile template for current component
            // render
            if (this.auto_render === true) {
                this.render();
            }
        } else {
            this._initWithStore();
        }

        //this.$callParentMethod(arguments);     // You should call this if override prev method
        S.component_manager.registerComponent(this.id, this);
        if (this.store) {
            this.rendered();
        }
        return this;
    },
    /**
     *
     */
    _defineConstants: function () {
        var prop,
            _this = this;
        do {
            for (prop in _this) {
                if (typeof _this[prop] !== 'function' && _this.hasOwnProperty(prop) && prop.toUpperCase() === prop) {
                    Object.defineProperty(this, prop, {
                        value: _this[prop]
                      , writable: false
                    });
                }
            }
            _this = _this.__proto__;
        } while (_this !== null);
    },
    /**
     * @protected
     * @method _construct
     * @description class constructor
     */
    _construct: function () {
        this._initDefaults();
        this._decorateEvents();
        this._defineConstants();
    },
    /////////////////
    // E V E N T S //
    /////////////////
    /**
     * @public
     * @event rendered
     * @description is called after component rendered to page, aou can allways all listener to it using S.addListener method
     */
    rendered: function () {
        // here we can to setup domEvents
        if (this.context_menu) {
            this.root_el.oncontextmenu = function (e) {
                e.preventDefault();
                this.context_menu_el = S.New('S.component.ContextMenu', {
                    auto_render: true,
                    render_to: this.context_menu.render_to,
                    position: {
                        x: this.root_el.offsetLeft + this.root_el.offsetWidth,
                        y: this.root_el.offsetTop + this.root_el.offsetHeight
                    },
                    ondestroy: function () {
                        this.context_menu_el = null;
                    }.bind(this),
                    lines: this.context_menu.lines
                });
            }.bind(this)
        }
        return this;
    },
    /**
     * @public
     * @event onResize
     * @description fires on this.render_to fires resize event
     */
    onResize: function () { },
    /**
     * @method hasChild
     * @description check if argument is child of this
     * @return {boolean}
     */
    hasChild: function (component) {
        for (var child_name in this.getChildren())
            if (this.getChildren().hasOwnProperty(child_name) && this.getChildren()[child_name] === component)
                return true;
        return false
    },
    getParent : function () {
        for (var component_name in S.component_manager.created_components) {
            if (!S.component_manager.created_components.hasOwnProperty(component_name))
                continue;
            var component = S.component_manager.created_components[component_name];
            if (component.hasChild(this))
                return component
        }
    },
    getChildren : function () {
        if (this.items.length !== 0)
            return this.items;
    },
    getFirstChild : function () {
        if (this.getChildren())
            return this.getChildren()[0];
    },
    getLastChild : function () {
        if (this.getChildren())
            return this.getChildren()[this.getChildren().length - 1];
    },
    getNextSibling : function () {
        if (!this.getParent())
            return undefined;
        for (var i = 0; i < this.getParent().getChildren().length; i++) {
            if (this.getParent().getChildren()[i] === this)
                return this.getParent().getChildren()[i + 1];
        }
    },
    getPreviousSibling : function () {
        if (!this.getParent())
            return undefined;
        for (var i = 0; i < this.getParent().getChildren().length; i++) {
            if (this.getParent().getChildren()[i] === this)
                return this.getParent().getChildren()[i - 1];
        }
    }
});
/**
 * @class
 * @description container, basicaly from container can be extended any component
 */
S.Class('S.component.Container', {
    _events: [
        'onAfterRendered'
    ],
    $requires: ['S.component.Component'],
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    _tpl: [
        '<{tagName} class="{className}" id="{root_id}">',
            '{innerHTML}{_items_compiled}',
        '</{tagName}>'
    ],
    className: 'S-container',
    onAfterRendered: function () {}
});
S.Class('S.component.ContextMenu', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '{_innerHTML}',
        '</div>'
    ],
    _line_tpl: '<div class="{className}-Line"></div>',
    _defaults: {
        count: 0,
        lines: [],
        position: {
            x: 0,
            y: 0
        }
    },
    /**
     * @protected
     */
    _innerHTML: '',
    /**
     * @public
     */
    className: 'S-ContextMenu',
    count: null,
    lines: null,
    position: null,
    /**
     */
    init: function () {
        this.count = this.lines.length;
        this._compileLines();
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this._initConfig();
        this._initMenu();
        this.$callParentMethod(arguments);
        this._initDestroyEvent();
    },
    /**
     */
    _compileLines: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            this._innerHTML += this._line_tpl;
        }
    },
    /**
     */
    _initConfig: function () {
        this._lines = document.getElementsByClassName(this.className + '-Line');
    },
    /**
     */
    _initMenu: function () {
        this.root_el.style.left = this.position.x + 'px';
        this.root_el.style.top = this.position.y + 'px';
        this._initLines();
    },
    /**
     */
    _initLines: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            (function (i) {
                this._lines[i].innerHTML = this.lines[i].text;
                this._lines[i].addEventListener('mouseup', function (e) {
                    this.lines[i].onclick();
                }.bind(this));
            }.bind(this))(i);
        }
    },
    /**
     */
    _initDestroyEvent: function () {
        var _this = this;
        this.render_to.addEventListener('mouseup', destroyContextMenu);
        function destroyContextMenu() {
            _this.destroy();
            _this.render_to.removeEventListener('mouseup', destroyContextMenu);
        }
    },
    /**
     */
    destroy: function () {
        this.render_to.removeChild(this.root_el);
        this.ondestroy && this.ondestroy();
    }
});
S.Class('S.component.ActiveContainer', {
    $requires: ['S.component.Component'],
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'items'
    ],
    _tpl: [
        '<{tagName} class="{className}" id="{root_id}" style="{_styles_compiled}">',
            '<div class="{className}-items" id="{items_id}"></div>',
            '<div class="{className}-nav">',
                '<div class="{className}-nav-prev">prev</div>',
                '<div class="{className}-nav-cur">cur</div>',
                '<div class="{className}-nav-next">next</div>',
            '</div>',
        '</{tagName}>'
    ],
    className: 'S-ActiveContainer',

    /**
     * @description add to this components adds items to
     * @param {object} cmp - component to add
     * @param {object} render
     */
    addDOM: function (DOM) {
        this.items_el.appendChild(DOM);
    }
});

S.Class('S.component.Button', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    className: 'S-button',
    icon: '',
    _tpl: [
        '<div class="{className}" id="{root_id}" style="{_styles_compiled}" >',
            '{icon}{innerHTML}',
        '</div>'
    ],
    
    /**
     * @protected
     * @description registers onClick event
     */
    _registerClickEmulation: function () {
        var _this = this;
        this.root_el.addEventListener( 'click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            var domThis = this;
            this.className = 'S-button S-button-active';
            setTimeout(function () {
                _this.onClick.call(this, arguments || []);
                domThis.className = 'S-button';
            }, 700);
        });
    },
    
    registerDOevents: function () {
        for (var key in this.DOMevents) {
            
        }
    },
    
    
    rendered: function () {
        this._registerClickEmulation();
    },
    /////////////////
    // E V E N T S //
    /////////////////
    onClick: function () {}
});
S.Class('S.component.ButtonPC', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    _events: [
        'onAfterRendered'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '{icon}{innerHTML}',
        '</div>'
    ],
    /**
     *
     */
    root_container_el: null,
    className: 'S-button',
    icon: '',
    /**
     *
     */
    rendered: function () {
        S.device.addEventListener(this.root_el, 'mousedown', function () {
            this.onButtonPress();
        }.bind(this), true);
        S.device.addEventListener(this.root_el, 'click', function () {
            this.onClick();
        }.bind(this), true);
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        return {
            self: {
                id: this.id,
                className: this.className
            },
            elements: S.core.DOM.getElementsIds(this)
        };
    },
    /////////////////
    // E V E N T S //
    /////////////////
    /**
     *
     */
    onClick: function () {},
    /**
     *
     */
    onButtonPress: function () {
        this.root_el.setAttribute('state', 'pressed');
        S.device.addEventListener(window, 'mouseup', function () {
            window.setTimeout(function () {
                this.root_el.removeAttribute('state');
            }.bind(this), 100);
        }.bind(this), true);
    },
    /**
     *
     */
    onAfterRendered: function () {},
    /**
     *
     */
    show: function () {
        this.root_el.style.display = 'inline-block';
    }
});
/**
 * @class
 * @description container, basicaly from container can be extended any component
 */
S.Class('S.component.SlidePanel', {
    $requires: ['S.component.Component'],
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'but'
    ],
    _tpl: [
        '<{tagName} class="{className}-{position}">',
            '<{tagName} class = "{className}-{position}-panel-conteiner">',
                '{items}{innerHTML}',
            '</{tagName}>',
            '<{tagName} class="{className}-{position}-pull">',
                '<{tagName} class="{className}-{position}-pullPointer" id="{but_id}">',
                '</{tagName}>',
            '</{tagName}>',
        '</{tagName}>'
    ],
    className: 'S-sliderpanel',
    position: 'top',
    tagName: 'div',
    innerHTML: '',
    items: '',


    rendered: function () {
       var _this = this;
       this.but_el.onclick = function(){_this.onClick(_this.position)};
    },

    onClick: function (position){
        var panelTop = document.getElementsByClassName(this.className+"-"+position+"-panel-conteiner")[0];
        switch (position){
            case "top":
                panelTop.style.marginTop = panelTop.style.marginTop == "0px" ? "-150px" :"0px";
                break;
            case "bottom":
                panelTop.style.marginBottom = panelTop.style.marginBottom == "0px" ? "-150px" :"0px";
                break;
            case "left":
                panelTop.style.marginLeft = panelTop.style.marginLeft == "0px" ? "-150px" :"0px";
                break;
            case "right":
                panelTop.style.marginRight = panelTop.style.marginRight == "0px" ? "-150px" :"0px";
                break;

        }
        event.target.style.webkitTransform =
            event.target.style.webkitTransform == "rotateZ(180deg)"? "rotateZ(0deg)":"rotateZ(180deg)";
    }
});
/**
 * @class
 * @description container, basicaly from container can be extended any component
 */
S.Class('S.component.ScrollBar', {
    _events: [
        'onAfterRendered'
    ],
    $requires: ['S.component.Component'],
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'scroll_bar'
    ],
    _tpl: [
        '<{tagName} class="{className}" id="{root_id}" style="{_styles_compiled}">',
            '{innerHTML}{label}{_items_compiled}',
            '<input style="{scroll_style}" type="range" id="{scroll_bar_id}" min="{min}" max="{max}" step="{step}" value="{value}" />',
        '</{tagName}>'
    ],
    min: '0',
    max: '20',
    step: '1',
    value: '10',
    className: 'S-scrollBar',
    init: function () {
        this.$callParentMethod(arguments);
        console.log(this._tpl_compiled);
    },
    rendered: function () {
        console.log(this.render_to);
//        this.scroll_bar_el.onchange = this.onScrolling;
        this.$callParentMethod(arguments);
    },
    onAfterRendered: function () {},
    onScrolling: function() {}
});
/**
 * @class S.core.FormElements
 * @description realization rlrments of form
 */
S.Class('S.component.FormButton', {
    $requires: ['S.component.Component', 'S.core.Device'],
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    className: 'S-formButton',
    icon: '',
    _tpl: [
        '<div class="{className}" id="{root_id}" style="{_styles_compiled}" >',
            '{icon}{innerHTML}',
        '</div>'
    ],

    /**
     * @protected
     * @description registers onClick event
     */
    _registerClickEmulation: function () {
        var _this = this;
        this.root_el.addEventListener( 'click', function(event) {
            event.preventDefault();
            event.stopPropagation();
            var domThis = this;
            this.className = 'S-button S-formButton-active';
            setTimeout(function () {
                _this.onClick.call(this, arguments || []);
                domThis.className = 'S-button';
            }, 700);
        });
    },

    registerDOevents: function () {
        for (var key in this.DOMevents) {

        }
    },


    rendered: function () {
        this._registerClickEmulation();
    },
    /////////////////
    // E V E N T S //
    /////////////////
    onClick: function () {}
});
/**
 * @class S.component.CheckBox
 * @description implements a "form" element, CheckBox
 */
S.Class('S.component.form.CheckBox', {
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'number',
        'icon',
        'label',
        'image',
        'button'
    ],
    className: null,
    label: '',
    contenteditable: 'false',
    checked : false,
    isAvailable: true,
    confirmed: '',
    answer_type: null,
    /**
     */
    init: function(){
        this.className = this.className || 'S-checkBox';
        this._tpl = this._initTemplate();
        this.image = this.image || '';
        this.$callParentMethod(arguments);
    },
     /*
     **/
    rendered: function () {
        this._registerClickEmulation();
        this.$callParentMethod(arguments);
    },
    /**
     * @protected _initTemplate
     * @description generates a template of checkBox
     */
    _initTemplate: function(){
        if (this.image && this.label) {
            this.className = 'S-CheckBoxTextImage';
        } else if(this.image && !this.label){
            this.className = 'S-CheckBoxImage';
        }
        return [
            '<div class="{className}" id="{root_id}">',
                '<div class="{className}-number">{number}</div>',
                '<div class="S-checkBox-icon {className}-icon" id="{icon_id}" checked="{checked}"></div>',
                '<div id="{label_id}" class="{className}-label" contenteditable="{contenteditable}">{label}</div>',
                '<div id="{image_id}" class="{className}-image" style="background:url({image})"></div>',
            '</div>'
        ]
    },
    /**
     * @protected _registerClickEmulation
     * @description registers onClick event
     */
    _registerClickEmulation: function () {
        var _this = this,
            press = false;
        this.icon_el.addEventListener('mousedown', function (event) {
            press = true;
            if (_this.isAvailable) {
                _this.icon_el.setAttribute("pressed", true);
                window.addEventListener('mouseup', function () {
                    if (press && _this.isAvailable) {
                        _this.icon_el.setAttribute("pressed", false);
                        _this.setChecked(!_this.checked);
                        press = false;
                    }
                });
            }
        });
        this.image_el.addEventListener('click', function(){
            //console.log(_this)
            //_this.onImageClick();
        })
    },
    /**
     * @function
     * @description sets radio object and radio DOM to @cheked state
     * @param (boolean) checked Indicates state to which we need to change radio
     */
    setChecked: function (checked) {
        this.checked = checked;
        this.root_el.setAttribute("checked", checked);
        this.icon_el.setAttribute("checked", checked);

    },
    /**
     *
     * @param confirmed
     */
    setConfirm: function (confirmed) {
        this.confirmed = confirmed;
        this.icon_el.setAttribute("confirmed", confirmed);
    },
    /**
     *
     */
    deleteConfirm: function () {
        if (this.root_el.hasAttribute("confirmed")) {
            this.root_el.removeAttribute('confirmed');
        }
    },
    /**
     *
     * @param text
     */
    setLabel: function (text) {
        text = text || '';
        this.label_el.innerHTML = text;
    },
    /**
     *
     */
    getLabel: function () {
        return this.label;
    },
    /**
     */
    _setStoreData: function () {
        var data = {
            self: {
                id: this.id,
                className: this.className,
                label: this.label,
                checked : this.checked,
                confirmed: this.confirmed,
                isAvailable: this.isAvailable,
                number: this.number,
                answer_type: this.answer_type
            },
            elements: S.core.DOM.getElementsIds(this)
        }, prop;
        for (prop in data.self) {
            if (data.self[prop] === null) {
                delete data.self['prop'];
            }
        }
        return data;
    }
});
/**
 * @class S.component.CheckBoxGroup
 * @description realization group for checkBox elements. Need checkbox elements inside
 */
S.Class('S.component.form.CheckBoxGroup', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '{innerHTML}{_items_compiled}',
        '</div>'
    ],
    /**
     * @protected
     */
    _defaults: {
        items: [],
        contenteditable: 'false'
    },
    /**
     * @public
     */
    checkedItem : null,
    data: null,
    items: null,
    /**
     */
    rendered: function () {
        var i;
        if (this.data && this.data.length) {
            for (i = 0; i < this.data.length; i++) {
                if (this.store) {
                    this.data[i].store = this.store.items_data[i];
                }
                this.addButton(this.data[i]);
            }
        }
    },
    /**
     * @function
     * @description sets all items to unchecked state
     */
    reset: function () {
        var i;
        if (this.items && this.items.length) {
            for (i = 0; i < this.items.length; i++) {
                if (this.items[i].isAvailable) {
                    this.items[i].setChecked(false);
                    this.items[i].deleteConfirm();
                }

            }
        }
    },
     /**
     * @public
     * @description returns array of checked elements
     */
    getChecked: function () {
         var checkedElementsArray = [];
         if (this.items) {
             for (var key in this.items) {
                 if (this.items[key].checked) {
                     checkedElementsArray.push(parseInt(key));
                 }
             }
         }
         return checkedElementsArray;
    },
    /**
     * 
     * @param is
     */
    setAvailable: function (is) {
        if (this.items) {
            for (var key in this.items) {
                this.items[key].isAvailable = is;
                this.items[key].icon_el.setAttribute("enable", is);
            }
        }
    },
    /**
     * @public
     * @description adds item in array elements
     */
    addItem: function (item, index) {
        var old_node;
        if(index){
            this.items.splice(index, 0, item);
            old_node = this.root_el.children[index-1];
            old_node.insertBefore(item.root_el);
        } else{
            this.items.push(item);
        }

    },
    /**
     */
    addButton: function (properties) {
        var new_button;
        S.addParams(properties, {
            render_to: this.root_el,
            auto_render: true
        });
        new_button = S.New('S.component.form.CheckBox', properties);
        this.items.push(new_button);
    },
    /**
     */
    _setStoreData: function () {
        var data = {
            self: {
                id: this.id,
                className: this.className,
                checkedItem : this.checkedItem
            },
            elements: S.core.DOM.getElementsIds(this),
            items_data: []
        }, i;
        for (i = 0; i < this.items.length; i++) {
            data.items_data.push(this.items[i]._setStoreData());
        }
        return data;
    }
});
/**
 * @class S.component.RadioButton
 * @description realization of radioButton element
 */
S.Class('S.component.form.RadioButton', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
      , 'icon'
      , 'label'
      , 'number'
      , 'image'
      , 'button'
      , 'number'
    ],
    _defaults: {
        number: ''
    },
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} label Text of label
     * @property {Boolean} checked
     * @property {string} confirmed
     * @property {Boolean} isAvailable
     * @property {Integer} number
     */
    className: 'S-radioButton',
    label: null,
    checked : false,
    confirmed: null,
    isAvailable: true,
    contenteditable: 'false',
    number: null,
    /*
     */
    init: function () {
        this._genIds();
        this._tpl = this.initTemplate();
        this.$callParentMethod(arguments);
    },
    /*
     */
    rendered: function () {
        if (this.image) {
            if (this.image !== 'false') {
                this.image_el.style.backgroundImage = 'url(' + this.image + ')';
            } else if (this.image_className) {
                this.image_el.className += ' ' + this.image_className;
            }
        }
        this._registerClickEmulation();
        this._addEditListener();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        return {
            self: {
                id: this.id,
                className: this.className,
                label: this.label,
                checked : this.checked,
                confirmed: this.confirmed,
                isAvailable: this.isAvailable,
                number: this.number
            },
            elements: S.core.DOM.getElementsIds(this)
        };
    },
    /**
     * @function
     * @description sets radio object and radio DOM to checked state
     * @param {Boolean} checked Indicates state to which we need to change radio
     */
    setChecked: function(checked) {
        this.checked = checked;
        this.root_el.setAttribute("checked", checked);
        this.icon_el.setAttribute("checked", checked);
    },
    /**
     */
    setConfirm: function(confirmed) {
        this.confirmed = confirmed;
        this.icon_el.setAttribute("confirmed", confirmed);
    },
    /**
     *
     */
    deleteConfirm: function() {
        if (this.root_el.hasAttribute("confirmed")) {
            this.root_el.removeAttribute('confirmed');
        }
    },
    /**
     * @description registers onClick event
     */
    _registerClickEmulation: function () {
        var _this = this,
            press = false;
        this.icon_el.addEventListener('mousedown', function (e) {
            e.preventDefault();
            press = true;
            if (!this.checked && this.isAvailable) {
                this.icon_el.setAttribute('pressed', true);
                document.addEventListener('mouseup', function () {
                    if(press && _this.isAvailable){
                        _this.icon_el.setAttribute("pressed", false);
                        _this.setChecked(true);
                        press = false;
                    }
                });
            }
        }.bind(this));
    },
    /**
     */
    _addEditListener: function () {
        var _this = this;
        this.label && this.label_el.addEventListener('keyup', function () {
            _this.label = this.innerHTML;
            _this.onContentEditFromKeyboard();
        });
    },
    /**
     * @function
     * @description provide operations need after objects' DOM displayes on screen
     */
    onContentEditFromKeyboard: function () {},
    /**
     */
    setLabel: function (text) {
        text = text || '';
        this.label_el.innerHTML = text;
        this.label = text;
    },
    /**
     */
    getLabel: function () {
        return this.label;
    },
    /**
     */
    initTemplate: function () {
        if (this.label && this.image) {
            return [
                '<div class="{className}" id="{root_id}" checked="{checked}" style="{_styles_compiled}" >',
                    '<div id="{button_id}" class="{className}-button">',
                        '<div id="{number_id}" class="{className}-number">{number}</div>',
                        '<div id="{label_id}" class="{className}-label" contenteditable="{contenteditable}">{label}</div>',
                        '<div id="{icon_id}" class="{className}-icon"></div>',
                    '</div>',
                    '<div id="{image_id}" class="{className}-image" style="background-image:url({image})">',
                        '<span style="width:1px; display:inline-block;"></span>',
                    '</div>',
                '</div>'
            ];
        }
        if (this.image) {
            return [
                '<div class="{className}" id="{root_id}" checked="{checked}" style="{_styles_compiled}" >',
                    '<div id="{number_id}" class="{className}-number">{number}</div>',
                    '<div id="{image_id}" class="{className}-image">',
                        '<span style="width:1px; display:inline-block;"></span>',
                    '</div>',
                    '<div id="{button_id}" class="{className}-button">',
                        '<div id="{icon_id}" class="{className}-icon" checked="{checked}"><span style="width:1px; display:inline-block;"></span></div>',
                    '</div>',
                '</div>'];
        }
        if (this.label) {
            return [
                '<div class="{className}" id="{root_id}" checked="{checked}" style="{_styles_compiled}" >',
                    '<div id="{number_id}" class="{className}-number">{number}</div>',
                    '<div class="{className}-label" contenteditable="{contenteditable}" id="{label_id}">{label}</div>',
                    '<div class="{className}-icon" id="{icon_id}" checked="{checked}"><span style="width:1px; display:inline-block;"></span></div>',
                '</div>'];
        }
        throw 'question number ' + this.number + ' has no label and no image. No template for such kind of questions'
    }
});
/**
 * @class S.component.RadioButtonGroup
 * @description realization of radioButton element
 */
S.Class('S.component.form.RadioButtonGroup', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    /*
     * @protected
     * @templates
     * @property {Array} _tpl Main template
     */
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '{_items_compiled}',
        '</div>'
    ],
    /**
     * @protected
     */
    _defaults: {
        contenteditable: 'false'
    },
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} checkedItem
     * @property {string} contenteditable Permission to edit content
     * @property {string} data
     */
    className: 'S-radioButtonGroup',
    checkedItem : null,
    contenteditable: null,
    data: null,
    /**
     */
    rendered: function () {
        var i;
        if (this.data && this.data.length) {
            for (i = 0; i < this.data.length; i++) {
                if (this.store) {
                    this.data[i].store = this.store.items_data[i];
                }
                this.addButton(this.data[i]);
            }
        } else if (this.items.length) {
            for (i = 0; i < this.items.length; i++) {
                this._initButtonEvents(this.items[i]);
            }
        } else {
            this.root_el.innerHTML = '';
        }
        this.$callParentMethod(arguments);
    },
    /**
     * @function
     * @description sets all items to unchecked state
     */
    reset: function () {
        var i;
        if (this.items && this.items.length) {
            for (i = 0; i < this.items.length; i++) {
                if (this.items[i].isAvailable) {
                    this.items[i].setChecked(false);
                    this.items[i].deleteConfirm();
                }
            }
        }
        this.checkedItem = null;
    },
    /**
     * @function
     * @description defines currently checked item and
     * sets appropriate value to checkedItem property
     * @return (object) returns currently checked item
     */
    getChecked: function () {
        if (this.items) {
            for (var key in this.items) {
                if (this.items[key].checked) {
                    this.checkedItem = this.items[key];
                    return parseInt(key);
                }
            }
        }
        return null;
    },
    /**
     *
     * @param is
     */
    setAvailable: function (is) {
        if (this.items) {
            for (var key in this.items) {
                this.items[key].isAvailable = is;
                this.items[key].icon_el.setAttribute("enable", is);
            }
        }
    },
    /**
     *
     * @param item
     */
    _initButtonEvents: function (item) {
        var _this, press;
        if (item) {
            _this = this;
            press = false;
            item.icon_el.addEventListener('mousedown', function () {
//            if (!item.checked) {
                if (item.isAvailable) {
                    _this.reset();
                    press = true;
                    item.icon_el.setAttribute("pressed", true);
                    window.addEventListener('mouseup', function () {
                        if (press) {
                            item.icon_el.setAttribute("pressed", false);
                            item.setChecked(true);
                            _this.onCheck && _this.onCheck(_this.items.indexOf(item));
                            _this.checkedItem = _this.items.indexOf(item);
                            press = false;
                        }
                    });
                }
//            }
            })
        }
    },
    /**
     *
     * @param item
     */
    addItem: function (item, check) {
        this._initButtonEvents(item);
        if (!check) {
            this.items.push(item);
        }
    },
    /**
     */
    addButton: function (properties) {
        var new_button;
        S.addParams(properties, {
            render_to: this.root_el,
            auto_render: true
        });
        new_button = S.New('S.component.form.RadioButton', properties);
        this._initButtonEvents(new_button);
        this.items.push(new_button);
    },
    /**
     */
    _setStoreData: function () {
        var data = {
            self: {
                id: this.id,
                className: this.className,
                checkedItem : this.checkedItem
            },
            elements: S.core.DOM.getElementsIds(this),
            items_data: []
        }, i;
        for (i = 0; i < this.items.length; i++) {
            data.items_data.push(this.items[i]._setStoreData());
        }
        return data;
    }
});
S.Class('S.component.form.TextXInput', {
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'container',
        'text_input'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-Container" id="{container_id}" contenteditable="{editable}">',
                '{_input_tpl}',
            '</div>',
            '<p style="opacity: 0; width: 0;">.</p>',
        '</div>'
    ],
    _input_tpl: '<div class="{className}-Area" id="{text_input_id}" style="font-size: {font_size}px">{text}</div>',
    _defaults: {
        editable: 'false',
        text: '',
        fixed_size: true,
        font_size: 20
    },
    /**
     */
    className: 'S-TextXInput',
    editable: null,
    text: null,
    fixed_size: null,
    font_size: null,

    /**
     */
    rendered: function () {
        this._initConfig();
        this._initEvents();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        return {
            self: {
                id: this.id,
                text: this.text
            },
            elements: S.core.DOM.getElementsIds(this)
        };
    },
    /**
     */
    _initConfig: function () {
        setTimeout(function () {
            if (this.fixed_size) {
                this.root_el.style.width = this.root_el.offsetWidth + 'px';
                this.text_input_el.style.height = this.text_input_el.offsetHeight + 'px';
            }
            this._outerHTML_length = this.root_el.outerHTML.length - this.text.length;
        }.bind(this), 0);
    },
    /**
     */
    _initEvents: function () {
        var _this = this;
        this.root_el.addEventListener('keydown', function (e) {
            if (e.keyCode === 8) {
                if (_this.text_input_el.innerHTML.length <= 1 ||
                    getSelection().toString() === _this.text_input_el.innerHTML) {
                    e.preventDefault();
                    _this.text_input_el.innerHTML = '';
                }
            } else if (e.keyCode === 13) {
                e.preventDefault();
                _this.container_el.blur();
            } else if (!e.ctrlKey && _this.text_input_el.clientWidth >
                    _this.container_el.clientWidth - _this.font_size) {
                e.preventDefault();
            }
        });
        this.container_el.addEventListener('blur', function () {
            _this.onchange && _this.onchange(_this.text = _this.text_input_el.innerHTML);
        });
    },
    /**
     */
    setText: function (text) {
        this.text_input_el.innerHTML = this.text = text;
    }
});
/**
 * @class S.component.TextInput
 * @description realization element of form
 */
S.Class('S.component.form.TextInput', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
      , 'number'
      , 'text_input'
      , 'input_value'
      , 'input_red_line'
      , 'green_O'
      , 'red_X'
      , 'input_green_O'
      , 'input_red_X'
      , 'pre_text'
      , 'after_text'
    ],
    /*
     * @protected
     * @templates
     * @property {Array} _tpl Main template
     */
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-number" id="{number_id}">{number}</div>',
            '<div class="{className}-preTextBlock">',
                '<div class="{className}-green-O" id="{green_O_id}"></div>',
                '<div class="{className}-red-X" id="{red_X_id}"></div>',
                '<div id="{pre_text_id}" class="{className}-pre_text" contenteditable="{contenteditable}">{pre_text}</div>',
            '</div>',
            '<div class="{className}-Area" id="{text_input_id}">',
                '<div class="{className}-Input" id="{input_value_id}" contenteditable="true">{innerHTML}</div>',
                '<div class="{className}-Input-green-O" id="{input_green_O_id}"></div>',
                '<div class="{className}-Input-red-X" id="{input_red_X_id}"></div>',
                '<div class="{className}-Input-Red-Line" id="{input_red_line_id}"></div>',
            '</div>',        
            '<div id="{after_text_id}" class="{className}-after_text" contenteditable="{contenteditable}">{after_text}</div>',
        '</div>'
    ],
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} innerHTML
     * @property {boolean} contenteditable
     * @property {string} pre_text
     * @property {string} after_text
     * @property {string} label_styles
     * @property {string} answer_type
     */
    className: 'S-TextInput',
    innerHTML: '',
    contenteditable: false,
    number: 0,
    pre_text: null,
    after_text: null,
    correct_answer: null,
    _char_width: 12,
    /**
     */
    init: function(){
        this.pre_text = this.pre_text || "";
        this.after_text = this.after_text || "";
        this.$callParentMethod(arguments);
    },

    rendered: function () {
//        this.setAnswerSize();
    },
    /**
     * @protected
     * @description registers onClick event
     */
    setClickEmulation: function () {
        console.log("ddd")
        var _this = this;
        this.input_value_el.addEventListener("keydown", function(e){
            if(this.innerHTML.length > _this.correct_answer.length - 1 ){
                e.preventDefault();
            }
        });
        this.input_value_el.addEventListener('blur', function() {
            _this.innerHTML = _this.text_input_el.innerHTML;
            _this.innerHTML = _this.text_input_el.innerHTML;
        });
    },
    /**
     * @protected
     * @description registers onClick event
     */
    setAnswerSize: function (size) {
        if(size){
            this.input_value_el.style.minWidth = size * this._char_width + "px";
        } else if (this.correct_answer) {
            this.input_value_el.style.minWidth = this.correct_answer.length * this._char_width + "px";
        }


    },
    /**
    * @function
    * @description sets radio object and radio DOM to @cheked state
    * @param (boolean) checked Indicates state to which we need to change radio
    */
    reset: function() {
//        this.red_X_el.style.display = "none";
//        this.green_O_el.style.display = "none";
//        this.input_red_X_el.style.display = "none";
//        this.input_green_O_el.style.display = "none";
//        this.input_red_line_el.style.display = "none";
//        this.input_value_el.innerHTML = "";
    },
    /**
     * @param correct_answer
     */
    checkAnswer: function(correct_answer) {        
        if (this.getInputValue() === correct_answer){   
            (this.view === "10-1") ? (this.green_O_el.style.display = "inline-block") : (this.input_green_O_el.style.display = "inline-block");             
            return true;
        } else { 
            (this.view === "10-1") ? (this.red_X_el.style.display = "inline-block") : (this.input_red_X_el.style.display = "inline-block");
            this.input_red_line_el.style.display = "block";
            return false;
        }                
    },
    /**
     *
     * @param text
     */
    setPreText: function (text) {
        text = text || '';
        this.pre_text_el.innerHTML = text;
        this.pre_text = text;
    },
    /**
     *
     * @param text
     */
    setCorrectAnswer: function (text) {
        text = text || '';
        this.input_value_el.innerHTML = text;
        this.input_value = text;
    },
    /**
     *
     * @param text
     */
    setAfterText: function (text) {
        text = text || '';
        this.after_text_el.innerHTML = text;
        this.after_text = text;
    }
});
/**
 * @class S.component.TextInput
 * @description realization element of form
 */
S.Class('S.component.form.TextInput_10_3', {
    $requires: ['S.component.Component'],
    $extends: 'S.component.Component',
    _elements: [
        'root'
      , 'input_value_0'
      , 'input_value_1'
      , 'input_value_2'

    ],
    /*
     * @protected
     * @templates
     * @property {Array} _tpl Main template
     */
    _tpl: [
        '<div class="{className}" id="{root_id}" style="{_styles_compiled}" >',
        '<div class="{className}-Area" id="text_input_0">',
        '<div class="{className}-Input" id="input_value_0" contenteditable="true">{innerHTML}</div>',
        '<div class = "{className}-Separator">,</div>',
        '<div class = "{className}-Input-green-O" id="input_green_O_0" style=""></div>',
        '<div class = "{className}-Input-red-X" id="input_red_X_0" style=""></div>',
        '<div class="{className}-Input-Red-Line" id="input_red_line_0"></div>',
        '</div>',
        '<div class="{className}-Area" id="text_input_1">',
        '<div class="{className}-Input" id="input_value_1" contenteditable="true">{innerHTML}</div>',
        '<div class = "{className}-Separator">,</div>',
        '<div class = "{className}-Input-green-O" id="input_green_O_1" style=""></div>',
        '<div class = "{className}-Input-red-X" id="input_red_X_1" style=""></div>',
        '<div class="{className}-Input-Red-Line" id="input_red_line_1"></div>',
        '</div>',
        '<div class="{className}-Area" id="text_input_2">',
        '<div class="{className}-Input" id="input_value_2" contenteditable="true">{innerHTML}</div>',
        '<div class = "{className}-Input-green-O" id="input_green_O_2" style=""></div>',
        '<div class = "{className}-Input-red-X" id="input_red_X_2" style=""></div>',
        '<div class="{className}-Input-Red-Line" id="input_red_line_2"></div>',
        '</div>',
        '</div>'
    ],
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} innerHTML
     * @property {string} contenteditable Permission to edit content
     * @property {string} correctAnswers
     * @property {string} label_styles Styles of label
     */
    className: 'S-TextInput',
    innerHTML: '',
    contenteditable: false,
    correctAnswers: '',
    label_styles: '',
    /**
    * @function
    * @description sets all inputs to their default states    
    */
    reset: function() {
        var inputs = document.getElementsByClassName("S-TextInput-Input3");
        for (var i=0;i<inputs.length;i++) {
            var red_X = document.getElementById("input_red_X_"+i),
                green_O = document.getElementById("input_green_O_"+i),
                red_line = document.getElementById("input_red_line_"+i),
                input_value = document.getElementById("input_value_"+i);
            red_X.style.display = "none";
            green_O.style.display = "none";
            red_line.style.display = "none";
            input_value.innerHTML = "";
        }
    },
    checkAnswer: function(correct_answers) {
        var inputs = document.getElementsByClassName("S-TextInput-Input3"),
            all_correct = true;

        for (var i=0;i<inputs.length;i++) {
            console.log(inputs.length);
            if (inputs[i].innerHTML === correct_answers[i]) {
                var green_O = document.getElementById("input_green_O_"+i);
                green_O.style.display = "block";
            } else {
                all_correct = false;
                var red_X = document.getElementById("input_red_X_"+i),
                    red_line = document.getElementById("input_red_line_"+i);
                red_X.style.display = "block";
                red_line.style.display = "block";
            }
        }
        if (all_correct) {
            return true;
        } else {
            return false;
        }
    },
    init: function () {
        if (S.core.LS.exist()) { // LS already exist
            this._initLS();
            this.rendered();
        } else {
            this.$callParentMethod(arguments);
        }
    },
    _initLS: function () {
        var data = S.core.LS.get().questions[0].answers_group.items,
            i;
        for(i = 0; i < data.length; i++){
            for (var prop in data[i].elements) {
                this[prop + '_id'] = data[i].elements[prop];
                this[prop + '_el'] = document.getElementById(this[prop + '_id']);
            }
        }
    },
    getLSData: function (){
        var data = {
            elements :{
                root: this.root_id
              , input_value_0: this.input_value_0
              , input_value_1: this.input_value_1
              , input_value_2: this.input_value_2
            },
            className: this.className,
            innerHTML: this.innerHTML,
            correctAnswers: this.correctAnswers,
            label_styles: this.label_styles,
            contenteditable: this.contenteditable
        };
        return data;
    },
    rendered: function () {}
});
/**
 * @class S.component.RadioButtonGroup
 * @description realization of radioButton element
 */
S.Class('S.component.form.TextInputGroup', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    /*
     * @protected
     * @templates
     * @property {Array} _tpl Main template
     */
    _tpl: [
        '<div class="{className}" id="{root_id}">',
        '{_items_compiled}',
        '</div>'
    ],
    /**
     * @protected
     */
    _defaults: {
        items: [],
        contenteditable: 'false'

    },
    className: 'S-TextInputGroup',
    checkedItem : null,
    items: null,
    max_answer_length: null,


    _refreshMaxSize: function(){
        var i,
            size;
        for (i = 0; i < this.items.length; i++) {
            this.max_answer_length = this.items[i].correct_answer && this.items[i].correct_answer.length > this.max_answer_length ? this.items[i].correct_answer.length : this.max_answer_length ;
        }
        for (i = 0; i < this.items.length; i++) {
            if(!this.items[i].pre_text){
                this.items[i].setAnswerSize(this.max_answer_length)
            }
        }

    },
    /**
     * @function
     * @description sets all items to unchecked state
     */
    reset: function () {
        var i;
        if (this.items && this.items.length) {
            for (i = 0; i < this.items.length; i++) {
                if (this.items[i].isAvailable) {
                    this.items[i].setChecked(false);
                    this.items[i].deleteConfirm();
                }
            }
        }
        this.checkedItem = null;
    },
    /**
     *
     * @param item
     */
    addItem: function (item, check) {
        var answer;

        answer = S.New('S.component.form.TextInput', {
            number: "",
            pre_text: item.pre_text,
            after_text: item.after_text,
            correct_answer: item.correct_answer,
            render_to: this.root_el,
            auto_render: true,
            contenteditable: this.contenteditable
        });

        this.items.push(answer);
        answer.setAnswerSize();
        this._refreshMaxSize();
        this._refreshNumber();
        return answer
    },

    _refreshNumber: function(){
        var i;
        if(this.items.length > 1){
            for(i = 0; i < this.items.length; i++){
                this.items[i].root_el.className = 'S-TextInput';
                this.items[i].number_el.innerHTML = i + 1 + "."
            }
        }else{
            this.items[0].root_el.className = 'S-TextInput-Single';
        }
    },
    /**
     */
    _setStoreData: function () {
        var data = {
            self: {
                id: this.id,
                className: this.className,
                checkedItem : this.checkedItem
            },
            elements: S.core.DOM.getElementsIds(this),
            items_data: []
        }, i;
        for (i = 0; i < this.items.length; i++) {
            data.items_data.push(this.items[i]._setStoreData());
        }
        return data;
    },
    reset: function() {        
        if (this.items) {
            for (var key in this.items) {
                this.items[key].reset();                
            }
        }
    }
});
/**
 * @class S.component.TextInput
 * @description realization element of form
 */
S.Class('S.component.form.InputTextArea', {
    $requires: 'S.core.Device',
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'text_input'
    ],
    /*
     * @protected
     * @templates
     * @property {Array} _tpl Main template
     */
    _tpl: [
        '<div class="{className}" id="{root_id}" style="{_styles_compiled}" >',
            '<div class = "{className}-label" style="{label_styles}">{label}</div>',
            '<div class="{className}-Top-Area"></div>',
            '<div class="{className}-Area" contenteditable="true" id="{text_input_id}">{innerHTML}</div>',
            '<div class="{className}-Bottom-Area"></div>',
        '</div>'
    ],
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} innerHTML
     * @property {string} label Text of label
     * @property {string} label_styles Styles of label
     */
    guideText: '',
    className: 'S-InputTextArea',
    innerHTML: '',
    label: '',
    label_styles: '',
    /**
     */
    rendered: function () {
        /*this.text_input_el.innerHTML = '<div>' + this.guideText + this.innerHTML + '</div>';*/
        this.text_input_el.innerHTML = this.guideText + this.innerHTML;
        this._registerClickEmulation();
    },
    /**
     * @protected
     * @description registers onClick event
     */
    _registerClickEmulation: function () {
        var _this = this;
        this.text_input_el.addEventListener( 'focus', function(event) {
            /*if(_this.innerHTML.length == 0) {
                _this.text_input_el.innerHTML = '<div>' + '1' + '</div>';
            } else {*/
                _this.text_input_el.innerHTML = _this.innerHTML;
            /*}*/
        });
        this.text_input_el.addEventListener( 'blur', function(event) {
            _this.innerHTML = _this.text_input_el.innerHTML;
        });
        this.text_input_el.addEventListener( 'keypress', function(e) {
            if (e.keyCode == 13) {
                e.preventDefault();
            }
        });
    },
    setEditable: function (bool) {
//        this.text_input_el.setAttribute("contenteditable", (bool && bool === true) ? "true" : "false");
    }
});
/**
 * @class S.component.RadioButton
 * @description realization of radioButton element
 */
S.Class('S.component.form.RadioButton', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
      , 'icon'
      , 'label'
      , 'number'
      , 'image'
      , 'button'
      , 'number'
    ],
    _defaults: {
        number: ''
    },
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} label Text of label
     * @property {Boolean} checked
     * @property {string} confirmed
     * @property {Boolean} isAvailable
     * @property {Integer} number
     */
    className: 'S-radioButton',
    label: null,
    checked : false,
    confirmed: null,
    isAvailable: true,
    contenteditable: 'false',
    number: null,
    /*
     */
    init: function () {
        this._genIds();
        this._tpl = this.initTemplate();
        this.$callParentMethod(arguments);
    },
    /*
     */
    rendered: function () {
        if (this.image) {
            if (this.image !== 'false') {
                this.image_el.style.backgroundImage = 'url(' + this.image + ')';
            } else if (this.image_className) {
                this.image_el.className += ' ' + this.image_className;
            }
        }
        this._registerClickEmulation();
        this._addEditListener();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        return {
            self: {
                id: this.id,
                className: this.className,
                label: this.label,
                checked : this.checked,
                confirmed: this.confirmed,
                isAvailable: this.isAvailable,
                number: this.number
            },
            elements: S.core.DOM.getElementsIds(this)
        };
    },
    /**
     * @function
     * @description sets radio object and radio DOM to checked state
     * @param {Boolean} checked Indicates state to which we need to change radio
     */
    setChecked: function(checked) {
        this.checked = checked;
        this.root_el.setAttribute("checked", checked);
        this.icon_el.setAttribute("checked", checked);
    },
    /**
     */
    setConfirm: function(confirmed) {
        this.confirmed = confirmed;
        this.icon_el.setAttribute("confirmed", confirmed);
    },
    /**
     *
     */
    deleteConfirm: function() {
        if (this.root_el.hasAttribute("confirmed")) {
            this.root_el.removeAttribute('confirmed');
        }
    },
    /**
     * @description registers onClick event
     */
    _registerClickEmulation: function () {
        var _this = this,
            press = false;
        this.icon_el.addEventListener('mousedown', function (e) {
            e.preventDefault();
            press = true;
            if (!this.checked && this.isAvailable) {
                this.icon_el.setAttribute('pressed', true);
                document.addEventListener('mouseup', function () {
                    if(press && _this.isAvailable){
                        _this.icon_el.setAttribute("pressed", false);
                        _this.setChecked(true);
                        press = false;
                    }
                });
            }
        }.bind(this));
    },
    /**
     */
    _addEditListener: function () {
        var _this = this;
        this.label && this.label_el.addEventListener('keyup', function () {
            _this.label = this.innerHTML;
            _this.onContentEditFromKeyboard();
        });
    },
    /**
     * @function
     * @description provide operations need after objects' DOM displayes on screen
     */
    onContentEditFromKeyboard: function () {},
    /**
     */
    setLabel: function (text) {
        text = text || '';
        this.label_el.innerHTML = text;
        this.label = text;
    },
    /**
     */
    getLabel: function () {
        return this.label;
    },
    /**
     */
    initTemplate: function () {
        if (this.label && this.image) {
            return [
                '<div class="{className}" id="{root_id}" checked="{checked}" style="{_styles_compiled}" >',
                    '<div id="{button_id}" class="{className}-button">',
                        '<div id="{number_id}" class="{className}-number">{number}</div>',
                        '<div id="{label_id}" class="{className}-label" contenteditable="{contenteditable}">{label}</div>',
                        '<div id="{icon_id}" class="{className}-icon"></div>',
                    '</div>',
                    '<div id="{image_id}" class="{className}-image" style="background-image:url({image})">',
                        '<span style="width:1px; display:inline-block;"></span>',
                    '</div>',
                '</div>'
            ];
        }
        if (this.image) {
            return [
                '<div class="{className}" id="{root_id}" checked="{checked}" style="{_styles_compiled}" >',
                    '<div id="{number_id}" class="{className}-number">{number}</div>',
                    '<div id="{image_id}" class="{className}-image">',
                        '<span style="width:1px; display:inline-block;"></span>',
                    '</div>',
                    '<div id="{button_id}" class="{className}-button">',
                        '<div id="{icon_id}" class="{className}-icon" checked="{checked}"><span style="width:1px; display:inline-block;"></span></div>',
                    '</div>',
                '</div>'];
        }
        if (this.label) {
            return [
                '<div class="{className}" id="{root_id}" checked="{checked}" style="{_styles_compiled}" >',
                    '<div id="{number_id}" class="{className}-number">{number}</div>',
                    '<div class="{className}-label" contenteditable="{contenteditable}" id="{label_id}">{label}</div>',
                    '<div class="{className}-icon" id="{icon_id}" checked="{checked}"><span style="width:1px; display:inline-block;"></span></div>',
                '</div>'];
        }
        throw 'question number ' + this.number + ' has no label and no image. No template for such kind of questions'
    }
});
S.Class('S.component.Video', {
    $requires: ['S.component.Component'],
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'video',
        'currTime',
        'duration',
        'currTimeLine',
        'spotTimeLine',
        'totalTimeLine',
        'rewBtn',
        'playBtn',
        'fwdBtn',
        'spcBtn',
        'nav',
        'volumeControls',
        'timeControls',
        'currVolume',
        'spotVolume',
        'totalVolume',
        'syncButton'
    ],
    _events: [
        'onAfterPlay',
        'onAfterPause',
        'onAfterSetPosition',
        'onAfterGoPrev',
        'onAfterGoNext'
    ],
    className: 'S-Video',
    src: '',
    width: '',
    height: '',
    controls: '',
    _tpl: [
        '<div class="{className}" id="{root_id}" style="{_styles_compiled}">',
              '<video id="{video_id}" class="{className}-video" src="{src}" width="{width}" height="{height}">',
                  'Video tag is not supported in your browser.',
              '</video>',
              '<div class="{className}-Control-Panel" id="{nav_id}">',
                  '<div class="{className}-Volume-Controls" id="{volumeControls_id}">',
                    '<div id="{totalVolume_id}" class="{className}-Volume-Total">',
                        '<div id="{spotVolume_id}" class="{className}-Volume-Spot"></div>',
                        '<div id="{currVolume_id}" class="{className}-Volume-Current"></div>',
                    '</div>',
                  '</div>',
                  '<div class="{className}-Time-Controls" id="{timeControls_id}">',
                      '<div class="{className}-Timeline">',
                          '<div id="{totalTimeLine_id}" class="{className}-Timeline-Total">',
                              '<div id="{spotTimeLine_id}" class="{className}-Timeline-Spot"></div>',
                              '<div id="{currTimeLine_id}" class="{className}-Timeline-Current"></div>',
                          '</div>',
                      '</div>',
                      '<div class="{className}-Time">',
                          '<div id="{currTime_id}" class="{className}-Current-Time"></div>',
                          '<div class="{className}-Control-Buttons">',
                              '<div id="{rewBtn_id}" class="{className}-Nav-Button {className}-Rew-Button"></div>',
                              '<div id="{playBtn_id}" class="{className}-Nav-Button {className}-Play-Pause-Button"></div>',
                              '<div id="{fwdBtn_id}" class="{className}-Nav-Button {className}-Fwd-Button"></div>',
                              '<div id="{syncButton_id}" class="{className}-Sync"></div>',
                          '</div>',
                          '<div id="{duration_id}" class="{className}-Duration"></div>',
                      '</div>',
                  '</div>',
              '</div>',
        '</div>'
    ],
    auto_play: false,
    _data_loaded: false,
    _hide_timer: null,
    volume_on: false,
    sync_on: false,
    /**
     * @public
     * @method enableSync
     * @description Enables synchronization
     */
    enableSync: function () {
        this.syncButton_el.setAttribute('on', 'true');
        S.sync.on(this.video_el);
        this.sync_on = true;
    },
    /**
     * @public
     * @method disableSync
     * @description Disables synchronization
     */
    disableSync: function () {
        this.syncButton_el.setAttribute('on', 'false');
        S.sync.off(this.video_el);
        this.sync_on = false;
    },
    /**
     * @function
     * @description
     */
    play: function (time) {
        var _this = this;
        if (time) {
            this.setPositionSpotAt(time);
        }
        this.video_el.play();
        this._startTimer();
      // this.currTime_el.innerHTML = this._convertTime(Math.floor(this.video_el.currentTime));
        this.duration_el.innerHTML = this._convertTime(Math.round(this.video_el.duration));
        this.playBtn_el.onclick = function (e) {
            _this.pause();
        };
        this.nav_el.setAttribute('played', 'true');
        // tempFIX
        this.playBtn_el.setAttribute('played', 'true');
//        this._hide_timer = window.setTimeout(function () {
//            _this.nav_el.className = "S-Video-Control-Panel-Hide";
//            _this.volPanel_el.className = "S-Video-Control-Panel-Hide";
//        },3500);
        return this;
    },
    /**
     * @function
     * @description
     */
    pause: function () {
        var _this = this;
        this.video_el.pause();
        this._stopTimer();
        window.clearTimeout(_this._hide_timer);
        this.nav_el.setAttribute('played', 'false');
        this.playBtn_el.setAttribute('played', 'false');
        this.playBtn_el.onclick = function (e) {
            _this.play();
        }
    },
    /**
     * @function
     * @description
     */
    setPositionSpotAt: function (pos) {
        var time = pos * this.video_el.duration / this.totalTimeLine_el.offsetWidth;
        this.currTimeLine_el.style.width = pos + "px";
        this.spotTimeLine_el.style.left = pos + "px";
        if (this._data_loaded) {
            this.video_el.currentTime = time;
        } else {
            this.video_el.addEventListener("canplaythrough", function () {
                _this._data_loaded = true;
                _this.video_el.currentTime = time;
            });
        }
        this._checkTime();
        var _this = this;
    },
    /**
     * @function
     * @description
     */
    setPosition: function (time) {
        this.setPositionSpotAt(this.totalTimeLine_el.offsetWidth * time / this.video_el.duration);
    },
    getPosition: function () {
        return this.video_el.currentTime;
    },
    setVolumeSpotAt: function (pos) {
        if (this.volume_on == true && pos == 0) {
            this.volumeControls_el.setAttribute('on', 'false');
            this.volume_on = false;
        } else if (this.volume_on == false && pos > 0) {
            this.volumeControls_el.setAttribute('on', 'true');
            this.volume_on = true;
        }
        this.currVolume_el.style.width = pos + "px";
        this.spotVolume_el.style.left = pos + "px";
        this.video_el.volume = (pos / this.totalVolume_el.offsetWidth).toFixed(1);
    },
    /**
     * @function
     * @description
     */
    setVolume: function (volume) {
      //  this.setVolumeSpotAt(this.totalVolume_el.offsetWidth * volume);
    },
    /**
     * @function
     * @description
     */
    getVolume: function () {
        return this.video_el.volume;
    },
    /**
     * @function
     * @description
     */
    goPrev: function () {
        this.setPositionSpotAt("0");
    },
    /**
     * @function
     * @description
     */
    goNext: function () {
        var time = (this.video_el.currentTime + 0.2 * this.video_el.duration);
        time > this.video_el.duration && (time = this.video_el.duration);
        this.setPosition(time);
    },
    /**
     * @function
     * @description
     */
    _convertTime: function (time) {
        time < 0 && (time = 0);
        var min = Math.floor(time / 60) + '',
            sec = Math.floor(time - min * 60) + '';
        min.length < 2 && (min = '0' + min);
        sec.length < 2 && (sec = '0' + sec);
        return min + ':' + sec;
    },
    /**
     * @function
     * @description
     */
    _checkTime: function () {
        var _this = this;
//        var currTime = Math.round(this.video_el.currentTime);
//        _this.currTime_el.innerHTML = "";
//        _this.currTime_el.innerHTML = this._convertTime(currTime);
    },

    _player_timer: null,
    _timeline_timer: null,
    /**
     * @function
     * @description
     */
    _drawTimeline: function () {
        var _this = this;
        _this.video_el.addEventListener('timeupdate', function () {
            var currTime = _this.video_el.currentTime;
//            _this.currTimeLine_el.style.width = (currTime * _this.totalTimeLine_el.offsetWidth / _this.video_el.duration) + "px";
//            _this.spotTimeLine_el.style.left = (currTime * _this.totalTimeLine_el.offsetWidth / _this.video_el.duration) + "px";
            _this.onPlaying(currTime);
        });
    },
    onPlaying: function (curTime) {},
    /**
     * @function
     * @description
     */
    _startTimer: function () {
        var _this = this;
        this._drawTimeline();
        this.video_el.addEventListener("timeupdate", function () {
            _this._checkTime();
        });
    },
    /**
     * @function
     * @description
     */
    _stopTimer: function () {
        var _this = this;
//        window.clearInterval(_this._player_timer);
//        window.clearTimeout(_this._hide_timer);
        this.nav_el.setAttribute('played', 'false');
        this.playBtn_el.onclick = function (e){
            e.stopPropagation();
            e.preventDefault();
            _this.play();
        }
    },
    /**
     *
     */
    _refreshNavigationStyles: function () {
        this.nav_el.style.width = this.video_el.offsetWidth + 'px';
        this.nav_el.style.height = this.video_el.offsetHeight + 'px';
    },
    /**
     * @protected
     * @method _setDND
     * @description Sets drag and drop functionality on input object
     * @param {object} el Object to be dragged
     * @param {function} goFunction Function called in d&d process
     */
    _setDND: function (el, goFunction) {
        var _this = this;
        el.onmousedown = function (e) {

            /**
             * @function getOffset
             * @description Gets general element's offset
             * @param {object} el Element to calculate
             * @param {string} type Offset type ('Left'/'Top')
             * @return {integer} General offset
             */
            function getOffset (el, type) {
                var offsetType = 'offset' + type;
                return el[offsetType] + (el.parentNode[offsetType] === undefined ? 0 : getOffset(el.parentNode, type));
            };
            function touchMove (e) {
                var curr_cursor_pos = e.pageX,
                    dist = curr_cursor_pos - drop_zone_offset;
                if (dist > 0) {
                    if (curr_cursor_pos <= drop_zone_offset + el.offsetWidth) {
                        goFunction(dist);
                    } else {
                        goFunction(el.offsetWidth);
                    }
                } else {
                    goFunction(0);
                }
            };
            function touchEnd (e) {
                _this.root_el.removeEventListener(S.device.TOUCH_MOVE_EVENT, touchMove);
                _this.root_el.removeEventListener(S.device.TOUCH_END_EVENT, touchEnd);
            };
            var drop_zone_offset = getOffset(el, 'Left');
            if (e.button == 0) {
                goFunction(e.offsetX);
                _this.root_el.addEventListener(S.device.TOUCH_MOVE_EVENT, touchMove);
                _this.root_el.addEventListener(S.device.TOUCH_END_EVENT, touchEnd);
            }
        }
    },
    _onDataLoaded: function () {
        this._refreshNavigationStyles();
        this._data_loaded = true;
        (this.auto_play === true) ? this.play() : this.play().pause();
        this.setVolume(1); this.setVolume(1); // chrome render bug
        this.nav_el.setAttribute('show', 'true');
        this.video_el.removeAttribute("controls");
    },
    /**
     * @function
     * @description
     */
    _addListeners: function () {
        var _this = this;
        // Video onload
        this.video_el.addEventListener("canplaythrough", function () {
            _this._onDataLoaded();
        });
//        this.rewBtn_el.onclick = function (e) {
//            _this.goPrev();
//        };
//        this.fwdBtn_el.onclick = function (e) {
//            _this.goNext();
//        };
        this.nav_el.onclick = function (e) {
            e.stopPropagation();
            this.setAttribute('show', this.getAttribute('show') == 'true' ? 'false' : 'true');
        };
//        this.volumeControls_el.onclick = this.timeControls_el.onclick = function (e) {
//            e.stopPropagation();
//            _this.nav_el.setAttribute('show', 'true');
//        };
        this.syncButton_el.onclick = function () {
            if (_this.sync_on) {
                _this.sync_on = false;
                this.setAttribute('on', 'false');
                _this.disableSync();
            } else {
                _this.sync_on = true;
                this.setAttribute('on', 'true');
                _this.enableSync();
            }
        };
        this.video_el.addEventListener('ended', function () {
            _this.pause();
        });
        // Setting drag and drop functionality
//        this._setDND(this.totalVolume_el, function (pos) {
//            _this.setVolumeSpotAt(pos);
//        });
//        this._setDND(this.totalTimeLine_el, function (pos) {
//            _this.setPositionSpotAt(pos);
//        });
    },
    /**
     * @function
     * @description
     */
    rendered: function () {
        this._addListeners();
        if (this.enable_sync !== null) {
            if (this.video_el.getAttribute("enable_sync") === "true") {
                this.enableSync();
            } else {
                this.disableSync();
            }
        } else {
            this.syncButton_el.style.opacity = 0;
        }
        this.hideShowSyncButton();
    },
    hideShowSyncButton: function () {
        if (!window.Vsync_Obj) {
            this.syncButton_el.style.opacity = 0;
        } else {
            this.syncButton_el.style.opacity = 1;
        }
    }
});
S.Class('S.component.VideoHard', {
    $requires: ['S.component.Video'],
    $extends: 'S.component.Video',
    auto_render: true,
    _elements: [
        'root',
        'currTime',
        'duration',
        'currTimeLine',
        'spotTimeLine',
        'totalTimeLine',
        'rewBtn',
        'playBtn',
        'fwdBtn',
        'spcBtn',
        'nav',
        'volumeControls',
        'timeControls',
        'currVolume',
        'spotVolume',
        'totalVolume',
        'syncButton'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}" style="{_styles_compiled}">',
            '<div class="{className}-Control-Panel" id="{nav_id}">',
//                '<div class="{className}-Volume-Controls" id="{volumeControls_id}">',
////                    '<div id="{totalVolume_id}" class="{className}-Volume-Total">',
//                        '<div id="{spotVolume_id}" class="{className}-Volume-Spot"></div>',
//                        '<div id="{currVolume_id}" class="{className}-Volume-Current"></div>',
//                    '</div>',
//                '</div>',
//                '<div class="{className}-Time-Controls" id="{timeControls_id}">',
//                    '<div class="{className}-Timeline">',
//                        '<div id="{totalTimeLine_id}" class="{className}-Timeline-Total">',
//                            '<div id="{spotTimeLine_id}" class="{className}-Timeline-Spot"></div>',
//                            '<div id="{currTimeLine_id}" class="{className}-Timeline-Current"></div>',
//                        '</div>',
//                    '</div>',
//                    '<div class="{className}-Time">',
//                        '<div id="{currTime_id}" class="{className}-Current-Time"></div>',
                        '<div id="{duration_id}" class="{className}-Duration" style="display: none"> </div>',
//                    '</div>',
//                '</div>',
            '</div>',
        '<div class="{className}-Control-Buttons">',
//                            '<div id="{rewBtn_id}" class="{className}-Nav-Button {className}-Rew-Button"></div>',
        '<div id="{playBtn_id}" class="{className}-Nav-Button {className}-Play-Pause-Button"></div>',
//                            '<div id="{fwdBtn_id}" class="{className}-Nav-Button {className}-Fwd-Button"></div>',
        '<div id="{syncButton_id}" class="{className}-Sync"></div>',
        '</div>',
        '</div>'
    ],
    _addNavigation: function () {
        this.video_el.style.left = '0';
        this.video_el.style.top = '0';
        this.video_el.parentNode.insertBefore(this.root_el, this.video_el);
        this.root_el.insertBefore(this.video_el, this.root_el.firstChild);
        this._refreshNavigationStyles();
    },
    rendered: function () {
        this.$callParentMethod(arguments);
        if (this.synced === true) {
            this.enableSync();
        } else {
            this.sync_on = false;
            this.syncButton_el.setAttribute('on', 'false');
        }
        this.video_el.setAttribute('component_id', this.id);
    },
    init: function () {
        this._styles_compiled = this.video_el.style.cssText;
        if (this.video_el.width) {
            this._styles_compiled += 'width:' + this.video_el.width + 'px;';
        }
        this._styles_compiled += 'height:' + this.video_el.offsetHeight + 'px;';
        this.$callParentMethod(arguments);
        this._addNavigation();
        this._onDataLoaded();
    }
});
S.Class('S.component.PaginatePanel' , {
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'left',
        'center',
        'right',
        'dots',
        'numbers'
    ],
    _events: [
        'onAfterSetActive'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-left" id="{left_id}"><span style="display:inline-block; width:1px;"></span></div>',
            '<div class="{className}-center" id="{center_id}">' ,
                '<div class="{className}-Dots-Container" id="{dots_id}"></div>',
                '<div class="{className}-numbers" id="{numbers_id}" ></div>',
            '</div>',
            '<div class="{className}-right" id="{right_id}"><span style="display:inline-block; width:1px;"></span></div>',
        '</div>'
    ],
    /**
     * @protected
     */
    _defaults: {
        _dots: [],
        dots_count: 0,
        type: 'dots',
        active_dot_id: 0
    },
    /**
     * @public
     */
    className: 'S-PaginatePanel',
    dots_count: null,
    type: null, // dots, numbers
    active_dot: null,
    active_dot_id: null,
    /**
     */
    rendered: function () {
        this.setType(this.type);
        this._dotsInit();
        this._buttonsInit();
        this.setActive(this.active_dot_id, true);
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        return {
            self: {
                id: this.id,
                className: this.className
            },
            elements: S.core.DOM.getElementsIds(this)
        };
    },
    /**
     */
    _dotsInit: function () {
        var _this = this,
            i = 0,
            el = null,
            dots_array = document.getElementsByClassName(this.className + '-dot');
        this._dots = [];
        for (; i < this.dots_count; i++ ) {
            if (this.store) {
                el = dots_array[i];
            } else {
                el = document.createElement('div');
                el.className = this.className + '-dot';
                this.dots_el.appendChild(el);
            }
            this._dots.push(el);
            S.device.addEventListener(el, 'click', function () {
                _this.setActive(_this._dots.indexOf(this));
            });
            el = null;
        }
        this.numbers_el.innerHTML = "0 / " + this.dots_count;
    },
    /**
     */
    _removeDots: function () {
        this.dots_el.innerHTML = '';
    },
    /**
     */
    _buttonsInit: function () {
        var _this = this;
//        S.device.addEventListener(this.right_el, 'mousedown', function () {
//
//            var this_button = this;
//            if (_this.getActiveDotId() + 1 > _this._dots.length - 1){
//                return false;
//            }
//            this_button.setAttribute("pressed", "true");
//            S.device.addEventListener(this, 'mouseup', function () {
//                this_button.removeAttribute("pressed");
//                _this.next();
//                S.device.removeEventListener(this, 'mouseup');
//            });
//        });
        S.device.addEventListener(this.right_el, 'click', function () {      // FIX PRESS EVENTS

            var this_button = this;
            if (_this.getActiveDotId() + 1 > _this._dots.length - 1){
                return false;
            }
            _this.next();
        });
//        S.device.addEventListener(this.left_el, 'mousedown', function () {
//            var this_button = this;
//            if (_this.getActiveDotId() - 1 < 0){
//                return false;
//            }
//            this_button.setAttribute("pressed", "true");
//            S.device.addEventListener(this, 'mouseup', function () {
//                this_button.removeAttribute("pressed");
//                _this.prev();
//                S.device.addEventListener(this, 'mouseup', null);
//            });
//        });
        S.device.addEventListener(this.left_el, 'click', function () {      // FIX PRESS EVENTS
            var this_button = this;
            if (_this.getActiveDotId() - 1 < 0){
                return false;
            }
            _this.prev();
        });
    },
    /**
     *
     */
    getActiveDotId: function () {
        return this._dots.indexOf(this.active_dot);
    },
    /**
     *
     * @param id
     */
    setActive: function (id) {
        'use strict';
        var cur = (this._dots.length > 0) ? id + 1 : 0;
        if (this._dots.length < 1) {
            return false;
        }
        if (typeof id === 'undefined') {
            id = 0;
        } else if ( id < 0) {
            id = 0
        } else if (id >= this._dots.length) {
            id = this._dots.length - 1;
        }
        this.active_dot = this._dots[id];
        for (var i = 0; i < this._dots.length; i++) {
            this._dots[i].setAttribute('active', 'false');
        }
        this.active_dot.setAttribute('active', 'true');
        this.numbers_el.innerHTML = cur + ' / ' + this._dots.length;
        if (this.getActiveDotId() + 1 > this._dots.length - 1){
            this.right_el.style.opacity = "0.5";
        } else {
            this.right_el.style.opacity = "1";
        }
        if (this.getActiveDotId() - 1 < 0){
            this.left_el.style.opacity = "0.5";
        } else {
            this.left_el.style.opacity = "1";
        }
    },
    /**
     *
     */
    next: function () {
        var pos = this.getActiveDotId();
        pos++;
        if (pos > this._dots.length - 1) {
            return false;
        }
        this.setActive(pos);
    },
    /**
     *
     */
    prev: function () {
        var pos = this.getActiveDotId();
        pos--;
        if (pos < 0) {
            return false;
        }
        this.setActive(pos);
    },
    /**
     *
     * @param num
     * @param active_num
     */
    setDotsCount: function (num, active_num) {
        this.dots_count = num || 0;
        this._removeDots();
        this._dotsInit();
        this.setActive(active_num || 0);
    },
    /**
     *
     * @param type
     */
    setType: function (type) {
        switch (type) {
            case 'dots':
                this.dots_el.style.display = 'inline-block';
                this.numbers_el.style.display = 'none';
                this.type = 'dots';
                break;
            case 'numbers':
                this.dots_el.style.display = 'none';
                this.numbers_el.style.display = 'inline-block';
                this.type = 'numbers';
                break;
            default:    // dots
                this.dots_el.style.display = 'inline-block';
                this.numbers_el.style.display = 'none';
                break;
        }
    }
});
S.Class('S.component.Timer', {
    $requires: ['S.component.Component'],
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    _tpl: [
        '<div class="{className}-Container" id="{root_id}">',
            '{innerHTML}',
        '</div>'
    ],
    /**
     *
     */
    className: 'S-timer',
    time: null,
    /**
     *
     */
    convertTime: function(ms){
        var hours = parseInt(ms/3600000),
            minutes = parseInt((ms%3600000)/60000),
            seconds = parseInt((ms%60000)/1000),
            timeStr =  hours + ' : ' + minutes + ' : ' + seconds;
        //minutes = minutes > 0 ? minutes : '00';
        return timeStr;
    },

    setTimeForTest: function(timeForTest){
        var _this = this,
            timeWhenStarted = new Date().getTime() + timeForTest*1000,
            timer = setInterval(
                function() {
                    var d = new Date();
                    var n = d.getTime();
                    var remainingTime =timeWhenStarted - n;
                    if(remainingTime > 0) {
                        _this.root_el.innerHTML = _this.convertTime(remainingTime);
                    } else {
                        _this.root_el.innerHTML = '0 : 00 : 00';
                        clearInterval(timer);
                    }
                }, 1000);
    },


    init: function () {
        this.$callParentMethod(arguments);
        this.rendered();
    },
    /**
     *
     */
    rendered: function () {
        this.setTimeForTest(this.time);

    }
    /////////////////
    // E V E N T S //
    /////////////////
    /**
     *
     */
    //onClick: function () {},
    /**
     *
     */
    /*onButtonPress: function () {
        var _this = this;
        var classNameOld = this.className;
        this.className = this.className + " " + this.className + "-Pressed";

        window.onmouseup = function(){
            window.setTimeout(function(){
                _this.className = classNameOld;
            }, 100);
        }
    },    */
    /**
     *
     */
    //onAfterRendered: function () {},
    /**
     *
     */
    /*show: function () {
        this.root_el.style.display = 'inline-block';
    }  */
});
/**
 * @author Sergrey Onenko
 * @class
 * @description Class Provides Tooltip Window Aligned ti specific DOM (DRAFT VERSION) - TO DELETE IN FUTURE
 * TODO - THIS IS DRAFT FAST VERSION MADE IN NIGHT TIME FOR PRESENTATION. MAKE IDEAL FROM THIS!!!
 */
S.Class('S.component.Tooltip', {
    $extends: 'S.component.Component',
    $requires: ['S.component.Component'],
    className: 'S-tooltip',
    _elements: [
        'root',
        'td11',
        'td12',
        'td13',
        'td21',
        'td22',
        'td23',
        'td31',
        'td32',
        'td33',
        'top',
        'right',
        'left',
        'bottom',
        'text',
        'close',
        'title'

    ],
    _events: [
        'onBeforeDestroy'
    ],
    _positions: {
        start: '10%',
        center: '50%',
        end: '90%'
    },
    _tpl: [
        '<table id="{root_id}" class="{className}" cellpadding="0" cellspacing="0" border="0" style="{_styles_compiled}">',
//            '<tbody>',
                '<tr class="{className}-tr-top" >',
                    '<td class="{className}-1-1" id="{td11_id}" ></td>',
                    '<td class="{className}-1-2" id="{td12_id}"><div id="{top_id}" class="{className}-top"></div></td>',
                    '<td class="{className}-1-3" id="{td13_id}"></td>',
                '</tr>',
                '<tr class="{className}-tr-middle">',
                    '<td class="{className}-2-1" id="{td21_id}"><div id="{left_id}"  class="{className}-left"></div></td>',
                    '<td class="{className}-2-2" id="{td22_id}" >',
                            '<div class="{className}-navigation">',
                                '<div class="{className}-title" id="{title_id}" contenteditable="{editable}">{title}</div>',
                            '</div>',
                            '<div class="{className}-text" id="{text_id}" contenteditable="{editable}">{innerHTML}</div>',
                            '<div class="{className}-navigation-close-{close_type}" id="{close_id}"></div>',
                    '</td>',
                    '<td class="{className}-2-3" id="{td23_id}"><div id="{right_id}" class="{className}-right"></div></td>',
                '</tr>',
                '<tr class="{className}-tr-bottom">',
                    '<td class="{className}-3-1" id="{td31_id}"></td>',
                    '<td class="{className}-3-2" id="{td32_id}"><div id="{bottom_id}" class="{className}-bottom"></div></td>',
                    '<td class="{className}-3-3" id="{td33_id}"></td>',
                '</tr>',
//            '</tbody>',
        '</table>'
    ],
    /**
     *
     */
    _displayed_tail: null,
    _tails: null,
    /**
     *
     */
    bottom_align: null,
    auto_render: true,
    editable: false,
    tail_position: 'bottom', //  top, right, bottom, left
    tail_align: '47%',   // left, center, right
    align_area: null,
    align_button: null,
    close_type: "Button", // "Button" or "Cross"
    /**
     *
     */
    init: function () {
        this.editable = String(this.editable);
        this.$callParentMethod(arguments);
    },
    /**
     *
     */
    rendered: function () {
        if (this.close_type === "Button"){
            this.close_button = S.New('S.component.ButtonPC', {
                innerHTML: 'Ok',
                className: this.className +'-'+this.close_type,
                render_to: this.close_el,
                index_el: '0',
                purpose: 'close',
                auto_render: true
            });
        } else {
            this.close_button = S.New('S.component.ButtonPC', {
                className: this.className +'-'+this.close_type,
                render_to: this.close_el,
                index_el: '0',
                purpose: 'close',
                auto_render: true
            });
        }
        this._renderedSetup();
        this.alignToArea();
        this.bottomAlign();
        this._addListeners();
    },
    /**
     *
     */
    _addListeners: function () {
        var _this = this;
        this.close_el.addEventListener('click', function () {
            _this.destroy();
        });
        this.text_el.addEventListener('keydown', function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                this.blur();
                _this.onAfterChangeText(this.innerHTML);
            }
        });
        this.title_el.addEventListener('keydown', function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                this.blur();
                _this.onAfterChangeCaption(this.innerHTML);
            }
        });
    },
    /**
     *
     */
    _renderedSetup: function () {
        this._tails = [this.top_el, this.right_el, this.bottom_el, this.left_el];   // tails
        this._showTail(this.tail_position, this.tail_align);    // show tail
        this.refreshSizes();
        this.root_el.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
        });
    },
    /**
     *
     * @param pos
     * @param align
     */
    _showTail: function (pos, align) {
        var _this = this;
        function setupActiveTail(align) {
            for (var i = 0; i < _this._tails.length; i++) {
                _this._tails[i].setAttribute('active', false);
            }
            align = _this._positions[align] || align;
            _this._displayed_tail.setAttribute('active', 'true');
            if (_this._displayed_tail === _this.top_el || _this._displayed_tail === _this.bottom_el) {
                _this._displayed_tail.style.left = (_this.root_el.offsetWidth * parseFloat(align) / 100) + 'px';
            } else if (_this._displayed_tail === _this.left_el || _this._displayed_tail === _this.right_el) {
                _this._displayed_tail.style.top = (_this.root_el.offsetHeight * parseFloat(align) / 100) + 'px';
            }

        }
        // PROCEDURES
        pos = pos || this.tail_position;
        align = align || this.tail_align;
        switch (pos) {
            case 'top':
                this._displayed_tail = this.top_el;
                break;
            case 'right':
                this._displayed_tail = this.right_el;
                break;
            case 'bottom':
                this._displayed_tail = this.bottom_el;
                break;
            case 'left':
                this._displayed_tail = this.left_el;
                break;
            default:
                throw S.error("Tooltip error");
        }
        setupActiveTail(align);
    },
    /**
     *
     * @param HTMLObject
     */
    bottomAlign: function (HTMLObject) {
        HTMLObject = HTMLObject || this.bottom_align;
        if (!HTMLObject) {
            return this;
        }
        S.addParams(this.root_el.style, {
            width:  HTMLObject.offsetWidth + 'px',
            height: HTMLObject.offsetHeight + 'px',
            top: (HTMLObject.offsetTop + HTMLObject.offsetHeight) - this.root_el.offsetHeight - this.bottom_el.offsetHeight + 'px',
            left: HTMLObject.offsetLeft + 'px'
        });
    },
    /**
     *
     */
    alignToArea: function (HTMLObject) {
        HTMLObject = HTMLObject || this.align_area;
        if (!HTMLObject) {
            return this;
        }
        S.addParams(this.root_el.style, {
            width:  HTMLObject.offsetWidth + 'px',
            height: HTMLObject.offsetHeight + 'px',
            top: HTMLObject.offsetTop + 'px',
            left: HTMLObject.offsetLeft + 'px'
        });
    },
//    /**
//     * @description DIRECT ALIGN TO BUTTON ONLY HORIZONTAL SUPPORTED
//     * @param HTMLObject
//     * @param pos
//     * @param align
//     */
//    alignToButton: function (HTMLObject, pos, align) {
//        'use strict';
//        // easy mode =)
//        pos = ((pos === 'top') ? 'bottom' : undefined) || ((pos === 'bottom') ? 'top' : undefined) || ((pos === 'left') ? 'right' : undefined) || ((pos === 'right') ? 'left' : undefined);
//        pos = pos || 'top';
//        this._showTail(pos, align);
//        var h = this.root_el.offsetHeight,
//            w = this.root_el.offsetWidth,
//            // top
//            _top = HTMLObject.offsetTop - h,
//            _left = HTMLObject.offsetLeft + (HTMLObject.offsetWidth / 2) - (w * (parseFloat(align) / 100));
//        console.log(_left)
//        this.root_el.style.top = _top + 'px';
//        this.root_el.style.left = _left + 'px';
//    },
    /**
     * @description changes Tile position
     * @param el
     */
    alignTileToButton: function (el) {
        this.align_button = el || this.align_button;
        if (!el) {
            return false;
        }
        var min_left = this.root_el.offsetLeft + 10,
            max_left = min_left + this.root_el.offsetWidth - 20,
            button_center = el.offsetLeft + el.offsetWidth / 2;
        if (button_center > min_left && button_center < max_left) {
            this._displayed_tail.style.left = (button_center - this.root_el.offsetLeft) + 'px';
        } else if (button_center < min_left){
            this._displayed_tail.style.left = '10px';
        } else if (button_center > max_left) {
            this._displayed_tail.style.left = (this.root_el.offsetWidth - 20) + 'px';
        }
    },
    /**
     * @public
     * @method: refreshSizes
     * @description run this on resize
     */
    refreshSizes: function () {
        var HTMLObject = HTMLObject || this.bottom_align;
        if (!HTMLObject) {
            return this;
        }
        S.addParams(this.root_el.style, {
            width:  HTMLObject.offsetWidth + 'px',
            height: HTMLObject.offsetHeight + 'px',
            top: (HTMLObject.offsetTop + HTMLObject.offsetHeight) - this.root_el.offsetHeight - this.bottom_el.offsetHeight + 'px',
            left: HTMLObject.offsetLeft + 'px'
        });
        this.alignTileToButton(this.align_button);
        // ANOTHER REFRESH
        if (!this.align_area) {
            return false;
        }
        S.addParams(this.root_el.style, {
            width: this.align_area.style.width,
            height: this.align_area.style.height,
            top: this.align_area.style.top || this.align_area.style.offsetTop + 'px',
            left: this.align_area.style.left || this.align_area.style.offsetLeft + 'px'
        });
        this.alignTileToButton(this.align_button);
    },
    /**
     * @public
     * @method hide
     * @description sets opacity "0" to component DOM
     */
    hide: function (enable_animation) {
        var _this = this;
        if (enable_animation === true) {
            setTimeout(function () {
                if (_this && _this.root_el) {
                    _this.style.webkitTransition = 'opacity 0s linear';
                }
            }, 500);
            this.root_el.style.webkitTransition = 'opacity .3s linear';
        }
        this.root_el.style.opacity = 0;
    },
    /**
     * @public
     * @method hide
     * @description sets opacity "1" to component DOM
     */
    show: function (enable_animation) {
        var _this = this;
        if (enable_animation === true) {
            setTimeout(function () {
                if (_this && _this.root_el) {
                    _this.style.webkitTransition = 'opacity 0s linear';
                }
            }, 500);
            this.root_el.style.webkitTransition = 'opacity .3s linear';
        }
        this.root_el.style.opacity = 1;
    },
    /**
     * @description - can be used as C# handler, setups
     * @param text
     */
    setText: function (text) {
        this.td22_el.innerHTML = text || '';
    },
    /**
     *
     */
    onBeforeDestroy: function () {},
    /**
     *
     */
    onAfterChangeText: function () {},
    /**
     *
     */
    onAfterChangeCaption: function () {}
});
/**
 * @author Sergiy Murygin
 * @class S.component.ProgressBar
 * @description Progress bar component
 */
S.Class('S.component.ProgressBar',{
    $extends: 'S.component.Component',
    _elements: [
        'root'
      , 'bar'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}" style="background-color:{bg_color}; padding:{offset}px;">',
        '</div>'
    ],
    /**
     * @protected
     * @property {Object} _tpl_bar_types
     */
    _tpl_bar_types: {
        'meter': '<meter class="{className}-Container" id="{bar_id}" value="{value}" min="0" max="100"></meter>',
        'progress': '<progress class="{className}-Container" id="{bar_id}" value="{value}" max="100"></progress>',
        'own': [
            '<div class="{className}-Container">',
                '<div class="{className}-Bar" id="{bar_id}" style="background-color:{bar_color}; width:{value}%"></div>',
            '</div>'
        ]
    },
    _defaults: {
        bar_color: 'blue',
        bg_color: 'white',
        offset: 5,
        type: 'own',
        value: 0
    },
    /**
     * @public
     * @property {String} bar_color
     * @property {String} bg_color
     * @property {Number} offset Bar margin in px
     * @property {String} type Type of progress bar elements. Acceptable values: 'own', 'meter', 'progress'
     * @property {Number} value Current bar value. Acceptable values: 0 <= value <= 100
     */
    className: 'S-ProgressBar',
    bar_color: null,
    bg_color: null,
    offset: null,
    type: null,
    value: null,
    /**
     */
    init: function () {
        this._rebuildTemplate();
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this.changeBarColor();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        return {
            self: {
                id: this.id
            },
            elements: S.core.DOM.getElementsIds(this)
        };
    },
    /**
     * @protected
     * @description Rebuild _tpl template according to type property
     */
    _rebuildTemplate: function () {
        var template = this.type === 'own' ? this._tpl_bar_types[this.type].join('') : this._tpl_bar_types[this.type];
        this._tpl.splice(1, 0, template);
    },
    /**
     * @description Changes bar color
     * @param {String} color Desired color of bar HTML element
     */
    changeBarColor: function (color) {
        if (color && this.type !== 'meter') {
            this.bar_color = color;
        }
        if (this.type === 'progress') {
            if (!this.style_tag) {
                this.style_tag = document.createElement('style');
                this.root_el.appendChild(this.style_tag);
            }
            this.style_tag.innerHTML = 'progress::-webkit-progress-value {background-color:' + this.bar_color + ';}';
        } else if (this.type === 'own') {
            this.bar_el.style.backgroundColor = color;
        }
    },
    /**
     * @description Changes background element color
     * @param {String} color Desired color for background HTML element
     */
    changeBGColor: function (color) {
        if (color) {
            this.bg_color = color;
        }
        this.root_el.style.backgroundColor = this.bg_color;
    },
    /**
     * @description Sets bar value
     * @param {Number} value Desired bar value. Acceptable values: 0 <= value <= 100
     */
    setValue: function (value) {
        if (value > 100) {
            value = 100;
        } else if (value < 0) {
            value = 0;
        }
        this.value = value;
        if (this.type === 'own') {
            this.bar_el.style.width = this.value + '%';
        } else {
            this.bar_el.value = this.value;
        }
    }
});
S.Class('S.component.Mask', {
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'dragger',
        'dragger_parent'
    ],

    _tpl: [
        '<div id="{root_id}" class="{className}">',
            '<div class="{className}-text">{mask_text}</div>',
            '<div class="{className}-draggerContainer">',
                '<div class="{className}-leftBlock"></div>',
                '<div id="{dragger_parent_id}" class="{className}-centerBlock">',
                    '<div id="{dragger_id}" class="{className}-dragger"></div>',
                '</div>',
                '<div class="{className}-rightBlock"></div>',
            '</div>',
        '</div>'
    ],

    className: 'S-mask',
    mask_text: "Mask edit",
    min_size: 100,   //in percent
    max_size: 400,   //in percent
    max_margin: 0,
    margin: 0, // ? need to test (maybe its needed in items)
    items: [],
    active_image: null,
    item: null,

    rendered: function(){
        this.$callParentMethod(arguments);
        this.loadImages(this.items);
        this.setImage(this.item);
        this.drag();
    },

    _setStoreData: function(){
        return this.items;
        //return  JSON.stringify(this.items)
    },

    loadImages: function(images){
        this.items = [];
        for(var current in images){
            var el = {};
            el.value = images[current].value || 100;
            el.left = images[current].left || 0;
            el.top = images[current].top || 0;
            el.image = images[current].image;
            el.position_dragger = images[current].position_dragger || null;
            //el.margin = images[current].margin || 0;

            this.items.push(el)
            this.active_image = this.items.length - 1;
            this.imgDrag();
        }
        this.active_image = null;
    },

    //setImage set active image from items or add it in items
    setImage: function(img){
        var _this = this,
            index = -1,
            current;
        for(current in this.items){
            if(this.items[current].image === img.image){
                index = current;
            }
        }

        if(index === -1){
            var el = {};

            el.value = img.value || 100;
            el.left = img.left || 0;
            el.top = img.top || 0;
            el.image = img.image;
            el.position_dragger = img.position_dragger || null;
            //el.margin = img.margin || 0;

            this.items.push(el);
            this.active_image = this.items.length - 1;
            this.imgDrag();
        } else {
            this.active_image = index;
        }
        this.resize();
        this.redrawImage();
    },
    /**
     * @public
     * @method resize
     * @memberOf S.component.Mask
     * @description moves slider to calculated position on resize panel
     */
    resize: function(){
        this.max_margin = this.dragger_parent_el.offsetWidth - this.dragger_el.offsetWidth;
        //this.margin = (this.value - this.min_size) / (this.max_size - this. min_size) * this.max_margin;
        this.margin = (this.items[this.active_image].value - this.min_size) / (this.max_size - this. min_size) * this.max_margin;
        this.dragger_el.style.marginLeft = this.margin + 'px';
    },
    /**
     * @public
     * @method redrawImage
     * @memberOf S.component.Mask
     * @description moves imege to new coords
     */
    redrawImage: function(){
        var image = this.items[this.active_image];

        var val = 50 - image.value/2 ;                 //val <= 0
        image.image.style.width = image.value + '%';
        image.image.style.height = image.value + '%';

        //check if image fit the container after resizing (if not attaches it to container borders)
        if(val > image.left){
            image.left = val;
        }
        if(image.left > -val){
            image.left = -val;
        }
        if(val > image.top){
            image.top = val;
        }
        if(image.top > -val){
            image.top = -val;
        }

        image.image.style.left = val + image.left + '%';
        image.image.style.top = val + image.top + '%';
    },

    // add listeners to active image
    imgDrag: function(){
        var _this = this;

        function dragStart(e){
            e.stopPropagation();
            _this.position_x = e.x;
            _this.position_y = e.y;
            window.addEventListener('mousemove', drag)
            window.addEventListener('mouseup', dragEnd)
        }

        function dragEnd(){
            //console.log('end')
            window.removeEventListener('mousemove', drag)
            window.removeEventListener('mouseup', dragEnd)
        }

        function drag(e){
            var image = _this.items[_this.active_image],
                n_x,
                n_y;

            n_x = ((e.x - _this.position_x) / 5);
            _this.position_x = e.x;
            n_y = ((e.y - _this.position_y) / 5);
            _this.position_y = e.y;

            if((n_x > 50 - image.value / 2 - image.left) && (image.value/2 -50 - image.left > n_x)){
                image.left += n_x;
            }
            if((n_y > 50 - image.value / 2 - image.top) && (image.value/2 -50 - image.top > n_y)){
                image.top += n_y;
            }

            _this.redrawImage();
        }

        this.items[this.active_image].image.addEventListener('mousedown', dragStart);
    },

    // add event listeners to dragger (it have to be called only on create mask)
    drag: function(){
        var _this = this;

        _this.resize();
        _this.redrawImage();

        function start(e){
            e.stopPropagation();
            _this.dragger_el.setAttribute('state','pressed')
            //console.log('start')

            _this.items[_this.active_image].position_dragger = e.x - _this.margin;

            window.addEventListener('mousemove', move)
            window.addEventListener('mouseup', end)
        };

        function end(){
            _this.dragger_el.removeAttribute('state')
            //console.log('end')
            window.removeEventListener('mousemove', move)
            window.removeEventListener('mouseup', end)
        };

        function move(e){
            e.stopPropagation();

            _this.margin = e.x - _this.items[_this.active_image].position_dragger ;

            if((_this.margin >= 0) && (_this.margin <= _this.max_margin)) {
                _this.dragger_el.style.marginLeft = _this.margin + 'px';
                _this.items[_this.active_image].value = _this.min_size + _this.margin / _this.max_margin * ( _this.max_size - _this.min_size );
                _this.redrawImage();
            }
        }

        this.dragger_el.addEventListener('mousedown', start);
        this.root_el.addEventListener('mousedown', function(e){e.stopPropagation();})
    }
});
// TO DO
//  main image container should stay the same size   +
//  fix on resize     +
//  mask of shape -> add extra div


S.Class('S.widget.Widget', {
    $extends: 'S.component.Component',
    _defaults: {
        data: []
    },
    /**
     * @protected
     */
    _exchange_dom: null,
    _root_id_suffix: '$widget',
    _script_id_suffix: '$script',
    _exchange_id_suffix: '$exchange',
    _script_dom: null,
    _prev_styles: null,
    /**
     * @public
     */
    auto_render: true,
    refreshSizes: function () {},
    onResize: function () {
        this.refreshSizes();
    },
    /**
     * @protected
     * @method _construct
     * @description launchs BEFORE INIT
     */
    _construct: function () {
        var _this = this,
            props, key, Temp, obj;
        if (S.config.author_mode && !this.$namespace.match(/Author/)) {
            props = {};
            for (key in this) {
                if (this.hasOwnProperty(key) && (!key.match(/\$/))) {
                    props[key] = this[key];
                }
            }
            Temp = S.getClass(this.$namespace + 'Author');
            obj = new Temp(props);
            return obj;
        }
        this.render_to = document.getElementById(this.dom_id);
//        this.clearTrash();
        this._script_dom = document.getElementById(this.dom_id + this._script_id_suffix);
//        this._beforeInitHide();
//        this._addExchangeDom();
//        this.render_to.appendChild(this._exchange_dom);
//        this._restoreWidgetStyles();
        this.$callParentMethod(arguments);
        this.render_to.onResize = function () {
            _this.onResize.apply(_this, [this]);
        };
        this.root_id = this.dom_id + this._root_id_suffix;
    },
//    /**
//     */
//    rendered: function () {
//        this._afterInitShow();
//        this.$callParentMethod(arguments);
//    },
//    /**
//     * @description destroys
//     */
//    clearTrash: function () {
//        var ids = [
////                this.dom_id + this._root_id_suffix,
//                this.dom_id + this._exchange_id_suffix
//            ];
//        ids.forEach(function (id) {
//            var el = document.getElementById(id);
//            if (el) {
//                el.parentNode.removeChild(el);
//            }
//        });
//    },
//    /**
//     *
//     */
//    _addExchangeDom: function () {
//        this._exchange_dom = document.createElement('div');
//        this._exchange_dom.id = this.dom_id + '$exchange';
//        this._exchange_dom.style.display = 'none';
//    },
//    /**
//     * @protected
//     * @method _restoreWidgetStyles
//     * @description restores styles for current widget div
//     */
//    _restoreWidgetStyles: function () {
//        /*var styles =
//            '#' + this.dom_id + '*{' +
//            'background-color: transparent;' +
//            'border:0;' +
//            'width: auto;' +
//            'height: auto;' +
//            'margin: 0;' +
//            'padding: 0' +
//            '}',
//            style = document.createElement('style');
//        style.innerHTML = styles;
//        document.head.appendChild(style);*/
//    },
//    /**
//     * @protected
//     * @method _exchange
//     * @description allows communication with C#
//     */
//    _exchange: function (mess) {
//        this._exchange_dom.innerHTML = '';
//        while (this._exchange_dom.childNodes[0]) {
//            this._exchange_dom.removeChild(this._exchange_dom.childNodes[0]);
//        }
//        this._exchange_dom.style.display = 'block';
//        this._exchange_dom.style.display = 'none';
//        if (typeof mess !== 'object') {
//            this._exchange_dom.innerHTML = mess;
//        } else {
//            this._exchange_dom.appendChild(S.core.XML.objectToXML(mess));
//        }
//    },
//    /**
//     * @public
//     * @method destroy
//     * @description Overwrites S.component.Component destroy method, allows to destroy whole the widget
//     */
//    destroy: function () {
//        var to_remove = Array.prototype.slice.call(this.render_to.childNodes, 0),
//            i = to_remove.length;
//        while (i > 0) {
//            i--;
//            this.render_to.removeChild(to_remove[i]);
//        }
//        this.$callParentMethod(arguments);
//    },
//    /**
//     * @method
//     * @memberOF S.component.Component
//     * @description Generates random IDs for each component needed in DOM
//     */
    _genIds: function () {
        this.$callParentMethod([this.dom_id]);
    }
//    /**
//     * @description FIX for SYNC WIDGET
//     */
//    _beforeInitHide: function () {
//        this._prev_styles = {
////            display: this.render_to.style.display || 'auto',
////            opacity: this.render_to.style.opacity || '1'
//        };
//        S.addParams(this.render_to.style, {
////            display: 'block',
////            opacity: 0
//        });
//    },
//    /**
//     * @description FIX for SYNC WIDGET
//     */
//    _afterInitShow: function () {
//        S.addParams(this.render_to.style, this._prev_styles);
//    }
});
S(function () {
    var widgets;
    if (!S.config.author_mode) {
        widgets = S('div[widget_type]');
        widgets.forEach(function(item, i, ar){
            var widget_type = item.getAttribute("widget_type");
            switch (widget_type) {
                case 'Review':
                    var a = S.New('S.widget.review.ReviewDom', {
                        dom: item
                    });
                    break;
                case 'Gallery':
                    break;
                case 'Video':
                    break
            }

        })
    }
});

/**
 * @authors Ju-Ho Hyun, Sergey Onenko
 * @class S.widget.sync.Sync
 * @description class for sync realization
 */
(function () {
    /**
     * @private
     * @function parseStyles
     * @param {string} cssText
     * @return {object styles object}
     */
    function parseStyles(cssText) {
        cssText = (cssText || '').toLowerCase();
        var dirty_css_array = cssText.split(';'),
            css_array = dirty_css_array.filter(function (item, i, arr) {
                if (item.length > 3 && item.split(':').length === 2) {
                    return true;
                }
            }),
            css_obj = {},
            i = 0,
            parts = null;
        for (; i < css_array.length; i++) {
            parts = css_array[i].split(':');
            css_obj[parts[0]] = parts[1];
        }
        return css_obj;
    }
    /**
     * @private
     * @function
     * @param dom
     */
    function parseData() {
        var i, n,
            data = {},
            top = null, low = null,
            dom = null,
            non_parsed_data = window.Vsync_Obj.Vsync_Info[0].vsync_element;
        for (i = 0; i < non_parsed_data.length; i++) {
            top = non_parsed_data[i];
            dom = document.getElementById(top.ref_id);
            for (n = 0; n < non_parsed_data[i].vsync_attrs.length; n++) {
                low = non_parsed_data[i].vsync_attrs[n];
                // VIDEO
                data[low.video_id] = data[low.video_id] || {};
                // DOM
                data[low.video_id][top.ref_id] = data[low.video_id][top.ref_id] || {};
                // TIME
                data[low.video_id][top.ref_id][low.sync_time] = low;
                data[low.video_id][top.ref_id][low.sync_time].DOM = dom;
                data[low.video_id][top.ref_id][low.sync_time].style = parseStyles(low.display_style + ';' + low.etc_style + ';' + low.position_style);
            }
            // first timeFrame
            if (!data[low.video_id][top.ref_id][0]) {
                data[low.video_id][top.ref_id][0] = {
                    DOM: dom,
                    style: {
                        display: "none"
                    }
                };
            }
        }
        return data;
    }
    /**
     * @class S.widget.sync.Sync
     * @description class for sync realization
     * video_id -> dom_id -> time
     */
    S.Class('S.widget.sync.Sync', {
        _data: null,
        _videos: null,
        /**
         *
         * @param video
         */
        _hideAll: function (video) {
            var pseudo_video_id = video.id.substr(1);
            console.log(pseudo_video_id, video.id)
            for (var key in this._data[pseudo_video_id]) {
                this._data[pseudo_video_id][key][0].DOM.style.display = 'none';
                this._data[pseudo_video_id][key][0].DOM.setAttribute("current_time_frame", "100000000000000");
            }
        },
        /**
         * @protected
         * @method _addListeners
         * @description adds listeners to videos
         */
        _addListeners: function () {
            var _this = this,
                videos = document.getElementsByTagName('video');
            this._videos = S.core.Array.toArray(videos);
            if (!this._videos || !Array.isArray(this._videos) || this._videos.length === 0) {
                return false;
            }
            this._videos.forEach(function (video) {
                video.addEventListener("timeupdate", function () {_this._processor.apply(_this, [this]);});
            });
        },
        /**
         * @protected
         * @method _pocessor
         * @param {HTMLObject} video
         */
        _processor: function (video) {
            if (!video) {
                return false;
            }
            var _video = video.parentNode;
            if (!_video) {
                return false;
            }
            if (!video.getAttribute("enable_sync") || video.getAttribute("enable_sync") === "false") {
                return false;
            }
            var video_id = _video.parentNode.id,
                data = this._data,
                times = null,
                current_time = video.currentTime,
                frame_time = 0,
                ID_styles = null,
                key = null;
            if (!data || !data[video_id] || Object.keys(data[video_id]).length === 0) {
                return false;
            }
            // DOM
            for (key in data[video_id]) {
                ID_styles = data[video_id][key];
                times = Object.keys(ID_styles);
                frame_time = S.core.Array.closest(times, current_time, 'low') || 0;
                if (ID_styles[frame_time].DOM.getAttribute("current_time_frame") && ID_styles[frame_time].DOM.getAttribute("current_time_frame") === frame_time + '') {
                    continue;
                }
                if (Math.abs(current_time - frame_time) < 0.5 && ID_styles[frame_time].video_play_type === "pause") {
                    if (video.getAttribute('component_id') && S.getComponent(video.getAttribute('component_id'))) {
                        var video_cmp = S.getComponent(video.getAttribute('component_id'));
                        video_cmp.pause();
                    } else {
                        video.pause();
                    }
                }
                ID_styles[frame_time].DOM.setAttribute("current_time_frame", frame_time);
                S.addParams(ID_styles[frame_time].DOM.style, ID_styles[frame_time].style);
            }

        },
        /////////////////////
        // H A N D L E R S //
        /////////////////////
        /**
         * @public
         * @method init
         * @description Class initialization
         */
        init: function () {
            if (window.Vsync_Obj && S.config.author_mode === false) {
                //start();
                this._data = parseData();
                this._addListeners();
            }
        },
        /**
         * @public
         * @method on
         * @param {HTMLObject} video
         */
        on: function (video) {
            if (!window.Vsync_Obj) {
                return false;
            }
            video.setAttribute("enable_sync", "true");
            this._processor(video);
        },
        off: function (video) {
            if (!window.Vsync_Obj) {
                return false;
            }
            video.setAttribute("enable_sync", "false");
            this._hideAll(video);
        }
    });
}());

S(function () {
    S.sync = S.New('S.widget.sync.Sync', {});
});

/**
 * @method enableVideoSupport
 * @description enables video support
 */
S.enableVideoSupport = function () {
    var els = S('video'),
        el = null,
        i = 0,
        len = els.length,
        enable_sync = Boolean(window.Vsync_Obj),
        synced = null;
    // Go enable video support
    for (; i < len; i++) {
        el = els[i];
        synced = (el.parentNode.getAttribute('enable_sync') === "true") ? true : false;
        el.setAttribute('enable_sync', el.parentNode.getAttribute('enable_sync'));
        el.id = '_' + el.parentNode.id;
        if (el.className !== 'S-Video-video') {
            S.New('S.component.VideoHard', {
                video_el: el,
                video_id: el.getAttribute('id'),
                render_to: el.parentNode,
                enable_sync: enable_sync,   // Is Sync component
                synced: synced              // enable_sync = 'true'
            });
        }
    }
};

// JUST FOR USER SIDE
if (S.config.author_mode === false) {
    S(function () {
        S.enableVideoSupport();
    });
}
S.Class('S.widget.gallery.Gallery', {
    $extends: 'S.widget.Widget'
});
S.Class('S.widget.gallery.Base', {
    $requires: 'S.core.animate',
    $extends: 'S.widget.gallery.Gallery',
    _elements: [
        'root',
        'caption',
        'images',
        'nav',
        'left_arrow',
        'right_arrow',
        'images_inner',
        'playbutton',
        'savebutton',
        'closebutton',
        'single_image'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-gallery-caption-container">',
                '<div class="{className}-gallery-name">{name}.</div>',
                '<div class="{className}-gallery-caption" id="{caption_id}">{caption}</div>',
            '</div>',
            '<div class="{className}-images-container" id="{images_id}">',
                '<div class="{className}-images-inner-container" id="{images_inner_id}">',
                    '{_images_compiled_HTML}',
                '</div>',
            '</div>',
            '<div class="{className}-nav-container">',
                '<div class="{className}-nav" id="{nav_id}">',
                    '{_nav_compiled_HTML}',
                '</div>',
                '<div class="{className}-nav-left" id="{left_arrow_id}"></div>',
                '<div class="{className}-nav-right" id="{right_arrow_id}"></div>',
            '</div>',
        '</div>'
    ],
    _image_template: [
        '<div class="{className}-image-container">',
            '<div class="{className}-image-box-wrapper" >',
                '<div class="{className}-image-box" id="{single_image}" style="background-image: url({encode_src}); background-size:{images_size};"></div>',
            '</div>',
            '<div class="{className}-description">{desc}</div>',
        '</div>'
    ],
    _nav_template: '<div class="{className}-nav-el-container"><div class="{className}-nav-dot"></div></div>',
    _defaults: {
        _active_image_id: 0,
        name: 'Gallery',
        caption: 'Gallery caption',
        images_size: 'cover'
    },
    /**
     * @protected
     * @property {string} _images_compiled_HTML Images HTML layout, compiled using _image_template
     * @property {string} _nav_compiled_HTML Navigation HTML layout, compiled using _nav_template
     * @property {Array} _images images array contains links for DOM objects
     * @property {Array} _images_caption Images caption contains links for DOM objects
     * @property {Array} _images_box Images boxes; contains links for DOM elements
     * @property {object} _container_sizes Sizes of root element
     * @property {Array} _btn_containers Navigation buttons DOM links
     * @property {Integer} _active_image_id Current image id (starts from 0)
     * @property {boolean} _cancel_transition Means that animate effect is disabled while images changing
     * @property {boolean} _empty_gallery Means that no images were added
     * @property {boolean} _tap_allowed
     */
    _images_compiled_HTML: null,
    _nav_compiled_HTML: null,
    _images: null,
    _images_caption: null,
    _images_box: null,
    _btn_containers: null,
    _active_image_id: null,
    _cancel_transition: false,
    _empty_gallery: false,
    _tap_allowed: true,
    /**
     * @public
     * @description basic elements setup
     * @property {string} name
     * @property {string} caption Gallery caption, visible in all images
     * @property {string} images_size CSS style of images (contain\cover)
     * @property {Array} data Array of image objects ([{src:"url_path.ext", desc:"some text"}])
     * @property {string} className Root class name of all elements
     * @property {boolean} auto_render Allows automatic rendering of gallery
     */
    className: 'S-widget-gallery-Base',
    name: null,
    caption: null,
    images_size: null,
    data: null,
    mask: null,
    auto_render: true,
    /**
     */
    init: function () {
        if (document.getElementById(this.dom_id + '$widget')) {
            if (S.core.storage) {
                this.store = S.core.storage.getGalleryResult(this.dom_id);
            }
        }

        if(S.savePage.obj_array.indexOf(this) === -1){
            S.savePage.obj_array.push(this);
        }
        this._addDataToImages()._compileImages();
        this._compileNav();
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this._initConfig()._initNav()._initImages();
        this.$callParentMethod(arguments);
    },
    /**
     * @protected
     * @method _addDataToImages
     * @description Adds data to images Array
     */
    _addDataToImages: function () {
        var i;
        if (this.data.length === 0) {
            this._empty_gallery = true;
        } else {
            for (i = 0; i < this.data.length; i++) {
                this.data[i].encode_src = escape(this.data[i].src);
                this.data[i].className = this.className;
                this.data[i].num = i;
                this.data[i].images_size = this.images_size;
            }
        }
        return this;
    },
    /**
     * @protected
     * @method _compileImages
     * @description Compiles images using _image_template
     * @param {boolean} aside_compile Means that compile result won't be automatically added to _images_compiled, and will be returned to a caller
     * @param {object} data Object used by template compiler for replacing properties (use this with aside_compile)
     */
    _compileImages: function (aside_compile, data) {
        var tpl_str = this._image_template.join('');
        if (aside_compile) {
            return S.core.template.compileArray(tpl_str, data || this.data, true);
        } else {
            this._images_compiled_HTML = S.core.template.compileArray(tpl_str, this.data, true);
            return this._images_compiled_HTML;
        }
    },
    /**
     * @protected
     * @method _compileNav
     * @description Compiles navigation elements using _nav_template
     * @param {boolean} aside_compile Means that compile result won't be automatically added to _nav_compiled, and will be returned to a caller
     * @param {object} data Object used by template compiler for replacing properties (use this with aside_compile)
     */
    _compileNav: function (aside_compile, data) {
        var tpl_str = this._nav_template;
        if (aside_compile) {
            return S.core.template.compileArray(tpl_str, data || this.data, true);
        } else {
            this._nav_compiled_HTML = S.core.template.compileArray(tpl_str, this.data, true);
            return this;
        }
    },
    /**
     * @protected
     * @method _initConfig
     * @description Initialize start gallery configuration
     */
    _initConfig: function () {
        this._images = Array.prototype.slice.call(this.images_inner_el.childNodes, 0);
        this._images_caption = this.images_inner_el.getElementsByClassName(this.className + '-description');
        this._images_box = this.images_inner_el.getElementsByClassName(this.className + '-image-box');
        return this;
    },
    /**
     * @protected
     * @method _initImagesTap
     * @description Initializes images tap functionality
     */
    _initImagesTap: function () {
        var _this = this;
        S.device.addEventListener(this.images_inner_el, 'touchstart', touchStart);
        function touchStart (e) {
            e.stopPropagation();
            document.body.style.webkitUserSelect = 'none';
            if (e.button === 0 && _this._tap_allowed) {
                var drag_el = this,
                    i = 0,
                    start_pos = e.touchX,
                    prev_pos = [];
                S.device.addEventListener(drag_el, 'touchmove', touchMove);
                S.device.addEventListener(drag_el, 'touchend', touchEnd);
                S.device.addEventListener(drag_el, 'mouseout', touchEnd);
                for (; i < 2; i++) {
                    prev_pos.push(start_pos);
                }
                function setSelection () {
                    document.body.style.webkitUserSelect = "text";
                    S.device.removeEventListener(window, 'mouseup', setSelection);
                }
                function touchMove (e) {
                    var curr_pos = e.touchX;
                    _this.images_inner_el.style.marginLeft = parseFloat(_this.images_inner_el.style.marginLeft) +
                        (curr_pos - prev_pos[0]) + 'px';
                    prev_pos.unshift(curr_pos);
                    prev_pos.pop();
                }
                function touchEnd (e) {
                    var curr_pos = e.pageX,
                        distance = curr_pos - prev_pos[1],
                        pos = _this._active_image_id;
                    if (event.type === "mouseup") {
                        setSelection();
                    } else if (event.type === 'mouseout') {
                        S.device.addEventListener(window, 'mouseup', setSelection);
                    }
                    if (Math.abs(curr_pos - start_pos) !== 0) {
                        if (distance > 0) { // move left
                            pos--;
                        } else if (distance < 0) { // move right
                            pos++;
                        }
                        if (pos < 0) { // first image cant scroll left
                            _this.setActiveImage(0);
                        } else if (pos > _this._images.length - 1) { // last image can scroll right
                            _this.setActiveImage(_this._images.length - 1);
                        } else {
                            _this.setActiveImage(pos);
                        }
                        _this._tap_allowed = false;
                    }
                    S.device.removeEventListener(drag_el, 'touchmove', touchMove);
                    S.device.removeEventListener(drag_el, 'touchend', touchEnd);
                    S.device.removeEventListener(drag_el, 'mouseout', touchEnd);
                }
            }
        }
    },
    /**
     * @protected
     * @method _initImages
     * @description Initialize images events
     */
    _initImages: function () {
        if (this.mask) {
            this._setMask();
        }
        this._initImagesTap();
        this.refreshImagesSizes();
    },
    /**
     */
    _setMask: function () {
        var i;
        for (i = 0; i < this._images.length; i++) {
            this._images_box[i].parentNode.style['-webkit-mask-box-image'] = 'url(' + this.mask + ') 75';
        }
    },
    /**
     * @protected
     * @method _initNav
     * @description Initialize navigation panel
     * @param {Integer} image_id Id of image, that will be showed firstly after init complete
     */
    _initNav: function (image_id) {
        var _this = this;
        this._btn_containers = Array.prototype.slice.call(this.nav_el.childNodes, 0);
        /**
         * @description Resets all navigation buttons style to default (unclicked) and sets proper to 'clicked'
         */
        function checkCurrent(curr) {
            var i;
            for (i = 0; i < _this._btn_containers.length; i++) {
                _this._btn_containers[i].setAttribute('current', i === curr ? 'true' : 'false');
                _this._images[i].setAttribute('current', i === curr ? 'true' : 'false');
            }
        }
        // equal to cycle 'for in'
        this._btn_containers.forEach(function (button, i) {
//            function _updateAnimations () {
//                _this.images_inner_el.style.marginLeft = _this._container_width * (-1) * _this._active_image_id + 'px';
//            }
//            function allow_tap () {
//                _this.images_inner_el.removeEventListener('webkitTransitionEnd', allow_tap);
//                _this._tap_allowed = true;
//                _this.images_inner_el.setAttribute('animated', 'false');
//            }
            button.onclick = function () {
                _this.timeout_handler && clearTimeout(_this.timeout_handler); // FOR EBOOK
                _this.images_inner_el.setAttribute('animated', 'false'); // FOR EBOOK
                if (_this._cancel_transition) { //if transition isn't allowed then just change margin without animation
                    _this.images_inner_el.style.marginLeft = -_this._container_width * i + 'px';
                    _this._cancel_transition = false;
                } else {
                    _this.images_inner_el.setAttribute('animated', 'true'); // FOR EBOOK
                    _this.images_inner_el.style.marginLeft = -_this._container_width * i + 'px'; // FOR EBOOK
                    _this.timeout_handler = setTimeout(function () { // FOR EBOOK
                        _this.images_inner_el.setAttribute('animated', 'false'); // FOR EBOOK
                        _this._tap_allowed = true;
                    }, 500); // FOR EBOOK
//                    window.webkitRequestAnimationFrame(function () {
//                        _this.images_inner_el.setAttribute('animated', 'true');
//                        _updateAnimations();
//                    });
//                    _this.images_inner_el.addEventListener('webkitTransitionEnd', allow_tap);
//                    S.core.animate(_this.images_inner_el, { marginLeft: (-_this._container_width * i) }, 300, function () {
//                        _this._tap_allowed = true;
//                    });
                }
                checkCurrent(_this._active_image_id = i);
                //
                if(_this.transformMask){
                    console.log('aaaaa: ',_this._images_box[i])
                    _this.transformMask.setImage({image: _this._images_box[i]});
                }
            };
            S.device.addEventListener(button, 'mouseup', function () { button.onclick(); }); // FOR EBOOK
        });
        if (this._empty_gallery === false) {
            this.setActiveImage(this._active_image_id = image_id || 0, true);
        }
        // Init arrows
        S.device.addEventListener(this.right_arrow_el, 'mousedown', function (e) {
            var that = this;
            e.stopPropagation();
            _this.right_arrow_el.setAttribute('pressed', 'true');
            S.device.addEventListener(this, 'mouseup', touchEnd);
            S.device.addEventListener(this, 'mouseout', touchCancel);
            function touchEnd () {
                if (_this._active_image_id !== _this._images.length - 1) {
                    _this.setActiveImage(++_this._active_image_id);
                }
                touchCancel();
            }
            function touchCancel () {
                _this.right_arrow_el.setAttribute('pressed', 'false');
                S.device.removeEventListener(that, 'mouseup', touchEnd);
                S.device.removeEventListener(that, 'mouseout', touchCancel);
            }
        }, true);
        S.device.addEventListener(this.left_arrow_el, 'mousedown', function (e) {
            var that = this;
            e.stopPropagation();
            _this.left_arrow_el.setAttribute('pressed', 'true');
            S.device.addEventListener(this, 'mouseup', touchEnd);
            S.device.addEventListener(this, 'mouseout', touchCancel);
            function touchEnd () {
                if (_this._active_image_id !== 0) {
                    _this.setActiveImage(--_this._active_image_id);
                }
                touchCancel();
            }
            function touchCancel () {
                _this.left_arrow_el.setAttribute('pressed', 'false');
                S.device.removeEventListener(that, 'mouseup', touchEnd);
                S.device.removeEventListener(that, 'mouseout', touchCancel);
            }
        });
        return this;
    },
    /**
     * @public
     * @method setActive
     * @description sets specified image active in gallery, eqvivalent to click on button with specified number
     * @param {Integer} image_id Image number to set active (starts from 0)
     * @param {boolean} cancel_transition Disallows transition amination of next setting active image
     */
    setActiveImage: function (image_id, cancel_transition) {
        this._cancel_transition = cancel_transition;
        this._btn_containers[image_id].onclick();
    },
    /**
     * @public
     * @method refreshImagesSizes
     * @description Updates container sizes and _images Array
     */
    refreshImagesSizes: function () {
        var i;
        this._images = Array.prototype.slice.call(this.images_inner_el.childNodes, 0);
        this._container_width =  this.images_el.offsetWidth;
        for (i = 0; i < this._images.length; i++) {
            this._images[i].style.width = this._container_width + 'px';
        }
        this._btn_containers[this._active_image_id] && this.setActiveImage(this._active_image_id, true);

        if(typeof(this.transformMask) !== 'undefined'){
            this.transformMask.resize();
        }

        return this;
    },
    /**
     * @public
     * @method showTransformMask
     * @description show mask for specified image (or current)
     */
    showTransformMask: function(){
        var gallery_height = this.root_el.parentNode.offsetHeight,
            mask_height = 60;

        if(!this.transformMask){
            var current,
                id = this._active_image_id;

            if(this.mask){ //if mask recieved from storage
                var items = [];

                for(current in this.mask){
                    this.mask[current].image = this._images_box[this.mask[current].image]
                }
                items = this.mask;
            }

            this.root_el.parentNode.style.height = gallery_height + mask_height+ 'px';

            this.transformMask = S.New('S.component.Mask', {
                render_to: this.root_el,
                items: items,
                item: {
                    image:  this._images_box[id]
                },
                auto_render: true
            });
        } else {
            if(this.transformMask.root_el.getAttribute('visible') === 'hidden'){
                this.root_el.parentNode.style.height = gallery_height + mask_height + 'px';
                this.transformMask.root_el.removeAttribute('visible');
            }
        }
    },
    /**
     * @public
     * @method hideTransformationMask
     * @description hide mask for specified image (or current)
     */
    hideTransformationMask: function(){
        var visible = this.transformMask.root_el.getAttribute('visible');
        if((typeof(this.transformMask) !== 'undefined') && (visible !== 'hidden')){
            var gallery_height = document.getElementById(this.dom_id).style.height;
            this.transformMask.root_el.setAttribute('visible','hidden')
            document.getElementById(this.dom_id).style.height = (parseInt(gallery_height.slice(0,-2)) - 60 )+ 'px';
        }
    },
    _setStoreData: function(){
        this.hideTransformationMask();

        var mask = {},
            data = {
            self: {
                _active_image_id: this._active_image_id
            },
            elements: S.core.DOM.getElementsIds(this) ,
            id: this.id
        };

        if(this.transformMask){
            data.self.mask = this.transformMask._setStoreData()
        }
        mask = data.self.mask;

        for(var current in this._images_box){
            for(var i in mask){
                if(this._images_box[current] == mask[i]['image']){
                    mask[i]['image'] = current;
                }
            }
        }
        data.self.mask = mask;

        S.core.storage.setGalleryResult(this.dom_id, data)
    }
});

//TO DO: in showTransformMask:
//    - need optimization for height assign
//    - setStoreData result have to be correctly checked on accordance to images
//    (on delete image can be bug)

S.Class('S.widget.gallery.BaseAuthor', {
    $extends: 'S.widget.gallery.Base',
    /**
     * @protected
     * @method _resetImagesId
     * @description Resets images id (data.num)
     */
    _resetImagesId: function () {
        var i;
        for (i = 0; i < this.data.length; i++) {
            this.data[i].num = i + 1;
        }
    },
    /**
     * @public
     * @method getActiveImage
     * @description Gets active image id
     * @return {Number} current(now shows) image id
     */
    getActiveImage: function () {
        this._exchange(this._active_image_id);
        return this._active_image_id;
    },
    /**
     * @public
     * @method addImages
     * @description adds new images
     * @param {Array} new_images - array of objects contains images src, and description for each image
     */
    addImages: function (new_images) {
        var i;
        if (this._empty_gallery === true) {
            this._empty_gallery = false;
        }
        for (i = 0; i < new_images.length; i++) {
            var new_image_obj = {
                className: this.className,
                images_size: this.images_size,
                num: this.data.length + 1,
                src: new_images[i].src,
                encode_src: window.escape(new_images[i].src),
                desc: new_images[i].desc || '',
                desc_style: new_images[i].desc_style || ''
            },
            temp_image_el = document.createElement('div'),
            temp_nav_el = document.createElement('div');
            // Adding image to data
            this.data.push(new_image_obj);
            // Adding image to image container
            temp_image_el.innerHTML = this._compileImages(true, [new_image_obj]);
            this.images_inner_el.appendChild(temp_image_el.childNodes[0]);
            this._images.push(temp_image_el.childNodes[0]);
            this.refreshImagesSizes();
            // Adding navigation button
            temp_nav_el.innerHTML = this._compileNav(true, [new_image_obj]);
            this.nav_el.appendChild(temp_nav_el.childNodes[0]);
        }
        this._initNav(this.data.length - 1);
    },
    /**
     * @public
     * @method removeImage
     * @description Removes image from gallery
     * @param {Number} image_to_delete_id Id of image must be removed
     */
    removeImage: function (image_to_delete_id) {
        // Image data delete
        this.data.splice(image_to_delete_id, 1);
        this._resetImagesId();
        if (this.data.length === 0 && this._empty_gallery === false) {
            this._empty_gallery = true;
        }
        // Image delete
        this.images_inner_el.removeChild(this.images_inner_el.childNodes[image_to_delete_id]);
        this._images = Array.prototype.slice.call(this.images_inner_el.childNodes, 0);
        // Image navigation element delete
        this.nav_el.removeChild(this.nav_el.childNodes[image_to_delete_id]);
        this._initNav();
    },
    /**
     * @public
     * @method moveImage
     * @description Moves image from pos "from_pos" to "to_pos"
     * @param {Number} from_pos source image position
     * @param {Number} to_pos target image position
     */
    moveImage: function (from_pos, to_pos) {
        // Image navigation element move
        this.nav_el.insertBefore(this.nav_el.childNodes[from_pos], this.nav_el.childNodes[to_pos > from_pos ? to_pos + 1 : to_pos]);
        // Image data move
        this.data.splice(to_pos > from_pos ? to_pos + 1 : to_pos, 0, this.data[from_pos]);
        if (to_pos < from_pos) {
            from_pos++;
        }
        this.data.splice(from_pos, 1);
        // Image move
        this.images_inner_el.insertBefore(this.images_inner_el.childNodes[from_pos > to_pos ? from_pos - 1 : from_pos], this.images_inner_el.childNodes[to_pos > from_pos ? to_pos + 1 : to_pos]);
        this._resetImagesId();
        this._images = Array.prototype.slice.call(this.images_inner_el.childNodes, 0);
        this._initNav();
    },
    /**
     * @public
     * @method setImagesSize
     * @description Sets gallery images size. ('cover', 'contain')
     * @param {string} size - image size. Avaliable values ('cover', 'contain')
     */
    setImagesSize: function (size) {
        var available_sizes = ['cover', 'contain'],
            i;
        if (available_sizes.indexOf(size) === -1) {
            size = 'cover';
        }
        if (this.images_size !== size) {
            this.images_size = size;
            for (i = 0; i < this._images_box.length; i++) {
                this._images_box[i].style.WebkitBackgroundSize = size;
            }
        }
    },
    /**
     * @public
     * @method setGalleryCaption
     * @description Sets gallery caption text
     * @param {string} text Desired gallery caption
     */
    setGalleryCaption: function(text) {
        this.caption = text;
        this.caption_el.innerHTML = text;
    },
    /**
     * @public
     * @method setDescriptionText
     * @description Sets current description text
     * @param {string} text Desired description text of active image
     */
    setDescriptionText: function(text) {
        this.data[this._active_image_id].desc = text;
        this._images_caption[this._active_image_id].innerHTML = text;
    },
    /**
     * @public
     * @method getData
     * @description returns gallery caption
     */
    getGalleryCaption: function () {
        return this.caption;
    },
    /**
     */
    setMask: function (mask_url) {
        this.mask = mask_url;
        this._setMask();
    }
});
S.Class('S.widget.gallery.Panorama', {
    $requires: ['S.widget.gallery.Gallery', 'S.component.Component', 'S.widget.Widget', 'S.component.AbstractComponent'],
    $extends: 'S.widget.gallery.Gallery',
    _elements: [
        'root',
        'image_container',
        'image',
        'image_shadow',
        'image_thumbnail',
        'image_thumbnail_close',
        'nav_container',
        'nav',
        'nav_span',
        'nav_shadow1',
        'nav_shadow2',
        'closebutton'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-image-container" id="{image_container_id}">',
                '<div class="{className}-image" id="{image_id}" style="background-image:url({image_url})"></div>',
                '<div class="{className}-image-shadow" id="{image_shadow_id}">',
                    '<div class="{className}-thumbnail-container">',
                        '<div class="{className}-thumbnail" id="{image_thumbnail_id}"></div>',
                        '<div class="{className}-thumbnail-close" id="{image_thumbnail_close_id}"></div>',
                    '</div>',
                '</div>',
            '</div>',
            '<div class="{className}-top-panel">',
                '<div class="{className}-top-panel-close" id="{closebutton_id}"></div>',
            '</div>',
            '<div class="{className}-bottom-panel">',
                '<div class="{className}-nav-container" id="{nav_container_id}">',
                    '<div class="{className}-nav" id="{nav_id}" style="background-image:url({image_url})">',
                        '<div class="{className}-nav-shadow" type="left" id="{nav_shadow1_id}"></div>',
                        '<div class="{className}-nav-shadow" type="right" id="{nav_shadow2_id}"></div>',
                    '</div>',
                    '<div class="{className}-nav-span" id="{nav_span_id}"></div>',
                '</div>',
                '<div class="{className}-caption-container">',
                    '<div class="{className}-name">{panorama_name}.</div>',
                    '<div class="{className}-caption">{panorama_caption}',
                        '<div class="{className}-description">{panorama_description}</div>',
                    '</div>',
                '</div>',
            '</div>',
        '</div>'
    ],
    /**
     * @protected
     * @property _item_tpl
     * @property _item_tpl_compiled
     */
    _item_tpl: '<div class="{className}-item"></div>',
    _item_tpl_compiled: null,
    /**
     * @public
     * @property className
     * @property panorama_name
     * @property panorama_caption
     * @property panorama_description
     * @property span_pos Start span position
     * @property span_width Span width in percentage
     */
    className: 'S-widget-gallery-Panorama',
    panorama_name: 'Panorama 1',
    panorama_caption: 'Caption text',
    panorama_description: 'Description',
    auto_render: true,
    render_to: null,
    span_pos: 0,
    span_width: 25,
    /**
     *
     */
    _initThumbnails: function () {
        var i = 0,
            _this = this;
        this._item_tpl_compiled = S.core.template.compile(this._item_tpl, this, true);
        for (; i < this.data.length; i++) {
            var temp_el = document.createElement('div');
            temp_el.innerHTML = this._item_tpl_compiled;
            temp_el = temp_el.childNodes[0];
            temp_el.style.left = 100 * (this.data[i].x + 25) / this.image_el.offsetWidth + '%';
            temp_el.style.top = 100 * (this.data[i].y + 25) / this.image_el.offsetHeight + '%';
            temp_el.onmousedown = (function (el, i) {
                return function () {
                    el.setAttribute('pressed', 'true');
                    function touchEnd () {
                        _this.image_thumbnail_el.style.backgroundImage = 'url(' + _this.data[i].image_url + ')';
                        window.setTimeout(function () {
                            _this.image_shadow_el.setAttribute('showed', 'true');
                        }, 100);
                        touchCancel();
                    }
                    function touchCancel () {
                        el.setAttribute('pressed', 'false');
                        el.removeEventListener('mouseup', touchEnd);
                        el.removeEventListener('mouseout', touchCancel);
                    }
                    el.addEventListener('mouseup', touchEnd);
                    el.addEventListener('mouseout', touchCancel);
                }
            })(temp_el, i);
            this.image_el.appendChild(temp_el);
        }
        /**
         *
         */
        this.image_thumbnail_close_el.onmousedown = function (e) {
            var that = this;
            e.stopPropagation();
            this.setAttribute('pressed', 'true');
            function touchEnd () {
                _this.image_shadow_el.setAttribute('showed', 'false');
                _this.image_thumbnail_el.style.backgroundImage = '';
                touchCancel();
            }
            function touchCancel () {
                that.setAttribute('pressed', 'false');
                that.removeEventListener('mouseup', touchEnd);
                that.removeEventListener('mouseout', touchCancel);
            }
            this.addEventListener('mouseup', touchEnd);
            this.addEventListener('mouseout', touchCancel);
        };
        /**
         *
         */
        this.image_thumbnail_el.onclick = this.image_thumbnail_el.ondblclick = function (e) { e.stopPropagation(); }
    },
    /**
     *
     */
    _initImages: function () {
        var _this = this;
        this.image_el.style.width = this.image_container_el.offsetWidth * 100 / this.span_width + 'px';
        this._initThumbnails();
        /**
         * @description Hide shadow form
         */
        this.image_container_el.onclick = function () {
            _this.image_shadow_el.getAttribute('showed') === 'true' && _this.image_shadow_el.setAttribute('showed', 'false');
        };
        /**
         * @description Switches to fullscreen
         */
        this.image_container_el.ondblclick = function () {
            _this.toggleFullscreen();
        };
    },
    /**
     *
     */
    _initNav: function () {
        var _this = this;
        this._nav_border_right = this.nav_el.offsetLeft + this.nav_el.offsetWidth - this.nav_span_el.offsetWidth + 3;
        /**
         *
         */
        function getOffset (el, type) {
            var offsetType = 'offset' + type;
            return el[offsetType] + (el.parentNode[offsetType] === undefined ? 0 : getOffset(el.parentNode, type));
        }
        /**
         *
         */
        this.nav_container_el.onmousedown = function (e) {
            if (e.button === 0) {
                var start_el_offset,
                    start_x = e.pageX,
                    container_offset = getOffset(_this.nav_container_el, 'Left');
                _this._setSpanAt(e.pageX - container_offset);
                _this.nav_span_el.setAttribute('pressed', 'true');
                start_el_offset = (_this.span_pos / 100) * _this.nav_el.offsetWidth;
                /**
                 *
                 */
                function touchMove (e) {
                    var curr_x = e.pageX,
                        curr_el_offset = start_el_offset + curr_x - start_x;
                    _this._setSpanAt(curr_el_offset + _this.nav_span_el.offsetWidth / 2);
                }
                /**
                 *
                 */
                function touchEnd () {
                    _this.nav_span_el.setAttribute('pressed', 'false');
                    document.body.removeEventListener('mousemove', touchMove);
                    document.body.removeEventListener('mouseup', touchEnd);
                }
                document.body.addEventListener('mousemove', touchMove);
                document.body.addEventListener('mouseup', touchEnd);
            }
        };
        /**
         *
         */
        this.closebutton_el.onmousedown = function (e) {
            if (e.button === 0) {
                var that = this;
                e.stopPropagation();
                this.setAttribute('pressed', 'true');
                function touchEnd () {
                    var main_div = document.getElementById(_this.dom_id);
                    _this.root_el.setAttribute('fullscreen', 'false');
                    S.addParams(main_div.style, _this.main_div_prev_style);
                    _this.image_el.style.width = _this.image_container_el.offsetWidth * 100 / _this.span_width + 'px';
                    touchCancel();
                }
                function touchCancel () {
                    that.setAttribute('pressed', 'false');
                    that.removeEventListener('mouseup', touchEnd);
                    that.removeEventListener('mouseout', touchCancel);
                }
                this.addEventListener('mouseup', touchEnd);
                this.addEventListener('mouseout', touchCancel);
            }
        };
        this.toggleFullscreen = function () {
            var main_div = document.getElementById(_this.dom_id);
            if (_this.root_el.getAttribute('fullscreen') !== 'true') {
                _this.main_div_prev_style = {
                    'top':main_div.offsetTop + 'px',
                    'left':main_div.offsetLeft + 'px',
                    'width':main_div.offsetWidth + 'px',
                    'height':main_div.offsetHeight + 'px'
                };
                S.addParams(main_div.style, {
                    'top':'0',
                    'left':'0',
                    'width':'100%',
                    'height':'100%'
                });
                _this.root_el.setAttribute('fullscreen', 'true');
            } else {
                S.addParams(main_div.style, _this.main_div_prev_style);
                _this.root_el.setAttribute('fullscreen', 'false');
            }
            _this.image_el.style.width = _this.image_container_el.offsetWidth * 100 / _this.span_width + 'px';
        };
    },
    /**
     *
     */
    init: function () {
        this.$callParentMethod(arguments);
        this._initImages();
        this._initNav();
    },
    /**
     * @protected
     * @method _setSpanAt
     * @description Sets span at desired position
     * @param {Number} pos Desired position in 'px'
     */
    _setSpanAt: function (pos) {
        var _this = this,
            right_shadow_width;
        // Span centering
        pos -= _this.nav_span_el.offsetWidth / 2;
        if (pos < 0) {
            pos = 0
        } else if (pos > this._nav_border_right) {
            pos = this._nav_border_right;
        }
        // Span move
        this.nav_span_el.style.left = pos + 'px';
        this.span_pos = this.nav_span_el.offsetLeft / this.nav_el.offsetWidth * 100;
        right_shadow_width = 99 - this.span_pos - this.span_width;
        right_shadow_width < 0 && (right_shadow_width = 0);
        // Nav shadows move
        this.nav_shadow1_el.style.width = this.span_pos + '%';
        this.nav_shadow2_el.style.width = right_shadow_width + '%';
        // Main image move
        _this.image_el.style.marginLeft = -_this.span_pos * 100 / this.span_width + '%';
    }
});
S.Class('S.widget.gallery.PanoramaAuthor', {
    $requires: ['S.widget.gallery.Panorama'],
    $extends: 'S.widget.gallery.Panorama'
});
S.Class('S.widget.gallery.Fade', {
    $requires: ['S.widget.gallery.Gallery','S.component.Component', 'S.widget.Widget', 'S.component.AbstractComponent'],
    $extends: 'S.widget.gallery.Gallery',
    _elements: [
        'root',
        'caption',
        'images',
        'nav_container',
        'nav',
        'playbutton',
        'closebutton'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-images-container" id="{images_id}">',
                '{_images_compiled_HTML}',
            '</div>',
            '<div class="{className}-playbutton" id="{playbutton_id}"></div>',
            '<div class="{className}-top-panel">',
                '<div class="{className}-top-panel-close" id="{closebutton_id}"></div>',
            '</div>',
            '<div class="{className}-bottom-panel">',
                '<div class="{className}-nav-container" id="{nav_container_id}">',
                    '<div class="{className}-nav" id="{nav_id}">',
                        '{_nav_compiled_HTML}',
                    '</div>',
//                    '<div class="{className}-nav-fade"></div>',
                '</div>',
                '<div class="{className}-caption-container">',
                    '<div class="{className}-name">{fade_name}.</div>',
                    '<div class="{className}-caption">{fade_caption}',
                        '<div class="{className}-description">{fade_description}</div>',
                    '</div>',
                '</div>',
                '</div>',
            '</div>',
        '</div>'
    ],
    _image_tpl: '<div class="{className}-image" style="background-image:url({encode_src}); background-size:{images_size};"></div>',
    _thumb_tpl: '<div class="{className}-nav-thumbs" style="background-image:url({encode_src})"></div>',
    _image_tpl_compiled: null,
    _thumb_tpl_compiled: null,
    _images_compiled_HTML: null,
    _nav_compiled_HTML: null,
    _active_image_id:null,
    _play_time_handler: null,
    className: 'S-widget-gallery-Fade',
    fade_name: 'Panorama 1',
    fade_caption: 'Caption text',
    fade_description: 'Description',
    auto_render: true,
    render_to: null,
    data: null,
    /**
     *
     */
    _initConfig: function () {
        this._btn_containers = Array.prototype.slice.call(this.nav_container_el.childNodes[0].childNodes);
        this._images = Array.prototype.slice.call(this.images_el.childNodes);
    },
    /**
     *
     */
    _initImages: function () {
        var _this = this;
        /**
         * @description Switches to fullscreen
         */
        this.images_el.ondblclick = function () {
            var main_div = document.getElementById(_this.dom_id);
            if (_this.root_el.getAttribute('fullscreen') !== 'true') {
                _this.main_div_prev_style = {
                    'top':main_div.offsetTop + 'px',
                    'left':main_div.offsetLeft + 'px',
                    'width':main_div.offsetWidth + 'px',
                    'height':main_div.offsetHeight + 'px'
                };
                S.addParams(main_div.style, {
                    'top':'0',
                    'left':'0',
                    'width':'100%',
                    'height':'100%'
                });
                _this.root_el.setAttribute('fullscreen', 'true');
            } else {
                S.addParams(main_div.style, _this.main_div_prev_style);
                _this.root_el.setAttribute('fullscreen', 'false');
            }
            _this.setActiveImage(_this._active_image_id);
        };
    },
    /**
     *
     */
    _initNav: function () {
        this._initPlayButton();
        this.nav_el.style.width = this.data.length * 104 + 'px';
        this._initNavEvents();
        this.setActiveImage(0);
    },
    /**
     *
     */
    _compileImages: function () {
        this._images_compiled_HTML = S.core.template.compileArray(this._image_tpl, this.data, true);
    },
    /**
     *
     */
    _compileNav: function () {
        this._nav_compiled_HTML = S.core.template.compileArray(this._thumb_tpl, this.data, true);
    },
    /**
     *
     */
    _initNavEvents: function () {
        var _this = this,
            id_border = [0, 4];
        /**
         * @description Resets all navigation buttons style to default (unclicked) and sets proper to 'clicked'
         */
        function checkCurrent(curr) {
            for (var i = 0; i < _this._btn_containers.length; i++) {
                _this._btn_containers[i].setAttribute('current', i === curr ? 'true' : 'false');
            }
            window.setTimeout(function () {
                for (var i = 0; i < _this._btn_containers.length; i++) {
                    _this._images[i].setAttribute('current', i === curr ? 'true' : 'false');
                }
            }, 150);
        }
        /**
         * @description Moves navigation panel if needed
         */
        function renderNav(curr) {
            if (_this.root_el.getAttribute('fullscreen') !== 'true' && _this.data.length > 5) {
                if (curr === 0) {
                    id_border = [0, 4];
                    _this.nav_el.style.marginLeft = '0';
                } else if (curr === id_border[0] || curr === id_border[0] - 1) {
                    id_border[0] -= curr === id_border[0] - 1 ? 2 : 1;
                    id_border[1] -= curr === id_border[0] - 1 ? 2 : 1;
                    _this.nav_el.style.marginLeft = (curr !== 1) ? -id_border[0] * 104 + 21 + 'px' : '0';
                } else if (curr === _this.data.length - 1) {
                    id_border = [_this.data.length - 5, _this.data.length - 1];
                    _this.nav_el.style.marginLeft = -(_this.data.length - 6) * 104 - 62 + 'px';
                } else if (curr === id_border[1] || curr === id_border[1] + 1) {
                    id_border[0] += curr === id_border[1] + 1 ? 2 : 1;
                    id_border[1] += curr === id_border[1] + 1 ? 2 : 1;
                    if (curr !== _this.data.length - 2) {
                        _this.nav_el.style.marginLeft = -id_border[0] * 104 + 21 + 'px';
                    } else {
                        _this.nav_el.style.marginLeft = -(_this.data.length - 6) * 104 - 62 + 'px';
                    }
                }
            } else {
                _this.nav_el.style.marginLeft = 'auto';
            }
        }
        /**
         *
         */
        this._btn_containers.forEach(function (button, i) {
            button.onclick = function () {
                renderNav(i);
                checkCurrent(_this._active_image_id = i);
            };
        });
        /**
         *
         */
        this.closebutton_el.onmousedown = function (e) {
            if (e.button === 0) {
                var that = this;
                e.stopPropagation();
                this.setAttribute('pressed', 'true');
                function touchEnd () {
                    var main_div = document.getElementById(_this.dom_id);
                    _this.root_el.setAttribute('fullscreen', 'false');
                    S.addParams(main_div.style, _this.main_div_prev_style);
                    _this.image_el.style.width = _this.image_container_el.offsetWidth * 100 / _this.span_width + 'px';
                    touchCancel();
                }
                function touchCancel () {
                    that.setAttribute('pressed', 'false');
                    that.removeEventListener('mouseup', touchEnd);
                    that.removeEventListener('mouseout', touchCancel);
                }
                this.addEventListener('mouseup', touchEnd);
                this.addEventListener('mouseout', touchCancel);
            }
        };
    },
    /**
     *
     */
    _initPlayButton: function () {
        var _this = this;
        this.playbutton_el.onmousedown = function (e) {
            e.stopPropagation();
            if (e.button === 0) {
                var that = this,
                    start_val = _this.root_el.getAttribute('played') || 'false';
                this.setAttribute('pressed', 'true');
                function touchEnd () {
                    _this._play_time_handler && window.clearInterval(_this._play_time_handler);
                    if (start_val === 'true') {
                        _this.root_el.setAttribute('played', 'false');
                    } else if (_this._active_image_id !== _this._images.length - 1) {
                        _this.root_el.setAttribute('played', 'true');
                        function slideShow () {
                            if (_this._active_image_id >= _this._images.length - 2) {
                                _this.root_el.setAttribute('played', 'false');
                                window.clearInterval(_this._play_time_handler);
                            }
                            _this._active_image_id < _this._images.length - 1 && _this.setActiveImage(++_this._active_image_id);
                        }
                        slideShow();
                        _this._play_time_handler = window.setInterval(slideShow, 2000);
                    }
                    touchCancel();
                }
                function touchCancel () {
                    that.setAttribute('pressed', 'false');
                    that.removeEventListener('mouseup', touchEnd);
                    that.removeEventListener('mouseout', touchCancel);
                }
                this.addEventListener('mouseup', touchEnd);
                this.addEventListener('mouseout', touchCancel);
            }
        };
    },
    /**
     * @protected
     * @method _addDataToImages
     * @description Adds data to images Array
     */
    _addDataToImages: function () {
        var i;
        for (i = 0; i < this.data.length; i++) {
            this.data[i].encode_src = escape(this.data[i].src);
            this.data[i].num = i;
            this.data[i].className = this.className;
            this.data[i].images_size = this.images_size;

        }
    },
    /**
     *
     */
    rendered: function () {
        this._initConfig();
        this._initImages();
        this._initNav();
        this.$callParentMethod(arguments);
    },
    /**
     *
     */
    init: function () {
        this._addDataToImages();
        this._compileImages();
        this._compileNav();
        this.$callParentMethod(arguments);
    },
    /**
     * @public
     * @method setActive
     * @description sets specified image active in gallery, equivalent to click on button with specified number
     * @param {Integer} image_id Image number to set active (starts from 0)
     */
    setActiveImage: function (image_id) {
        this._btn_containers[image_id].click();
    }
});
S.Class('S.widget.gallery.FadeAuthor', {
    $requires: ['S.widget.gallery.Fade'],
    $extends: 'S.widget.gallery.Fade'
});
S.Class('S.widget.gallery.Layers', {
    $extends: 'S.widget.gallery.Gallery',
    _elements: [
        'root',
        'caption',
        'images',
        'next_button',
        'prev_button'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-images-container" id="{images_id}">',
                '{_images_compiled_HTML}',
            '</div>',
            '<div class="{className}-bottom-panel">',
                '<div class="{className}-nav-container">',
                    '<div class="{className}-next-button" id="{next_button_id}"></div>',
                    '<div class="{className}-prev-button" id="{prev_button_id}"></div>',
                '</div>',
                '<div class="{className}-caption-container">',
                    '<div class="{className}-name">{name}.</div>',
                    '<div class="{className}-caption">{caption}',
                        '<div class="{className}-description">{description}</div>',
                    '</div>',
                '</div>',
            '</div>',
    '</div>'
    ],
    _defaults: {
        name: 'Layers 1',
        caption: 'Caption text',
        description: 'Description'
    },
    _image_tpl: '<div class="{className}-image"></div>',
    _images_compiled_HTML: '',
    _active_image_id: null,
    className: 'S-widget-gallery-Layers',
    name: null,
    caption: null,
    description: null,
    count: null,
    data: null,
    /**
     */
    init: function () {
        this._addDataToImages();
        this._compileImages();
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this._initConfig();
        this._initImages();
        this._initNav();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _initConfig: function () {
        this._images = Array.prototype.slice.call(this.images_el.childNodes);
    },
    /**
     */
    _initImages: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            this._images[i].style.backgroundImage = 'url(' + this.data[i] + ')';
            this._images[i].style.WebkitBackgroundSize = this.images_size;
        }
    },
    /**
     */
    _initNav: function () {
        this._initNavEvents();
        this.setActiveImage(0);
    },
    /**
     */
    _compileImages: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            this._images_compiled_HTML += this._image_tpl;
        }
    },
    /**
     */
    _initNavEvents: function () {
        var _this = this;
        this.root_el.onmousedown = function (e) {
            if (e.button === 0) {
                var that = this;
                e.stopPropagation();
                _this._active_image_id !== _this.count - 1 && this.setAttribute('state', 'pressed');
                function touchEnd () {
                    if (_this._active_image_id !== _this.count - 1) {
                        _this.setActiveImage(++_this._active_image_id);
                    }
                    touchCancel();
                }
                function touchCancel () {
                    that.removeEventListener('mouseup', touchEnd);
                    that.removeEventListener('mouseout', touchCancel);
                }
                this.addEventListener('mouseup', touchEnd);
                this.addEventListener('mouseout', touchCancel);
            }
        };
//        this.root_el.onmousedown = function (e) {
//            if (e.button === 0) {
//                var that = this;
//                e.stopPropagation();
//                _this._active_image_id !== 0 && this.setAttribute('state', 'pressed');
//                function touchEnd () {
//                    if (_this._active_image_id !== 0) {
//                        _this.setActiveImage(--_this._active_image_id);
//                    }
//                    touchCancel();
//                }
//                function touchCancel () {
//                    that.removeEventListener('mouseup', touchEnd);
//                    that.removeEventListener('mouseout', touchCancel);
//                }
//                this.addEventListener('mouseup', touchEnd);
//                this.addEventListener('mouseout', touchCancel);
//            }
//        };
    },
    /**
     * @protected
     * @method _addDataToImages
     * @description Adds data to images Array
     */
    _addDataToImages: function () {
        var i;
        this.count = this.data.length;
        for (i = 0; i < this.count; i++) {
            this.data[i].encode_src = escape(this.data[i].src);
            this.data[i].num = i;
        }
    },
    /**
     * @public
     * @method setActive
     * @description sets specified image active in gallery, equivalent to click on button with specified number
     * @param {Integer} image_id Image number to set active (starts from 0)
     */
    setActiveImage: function (image_id) {
        var i;
        this._active_image_id = image_id;
        for (i = 0; i < this.count; i++) {
            this._images[i].setAttribute('current', i === image_id ? 'true' : 'false');
        }
        this.prev_button_el.setAttribute('state', image_id !== 0 ? 'default' : 'dim');
        this.next_button_el.setAttribute('state', image_id !== this.count - 1 ? 'default' : 'dim');
    }
});
S.Class('S.widget.gallery.LayersAuthor', {
    $extends: 'S.widget.gallery.Layers'
});
S.Class('S.widget.review.Review', {
    $extends: 'S.widget.Widget',
    _elements: [
        'root',
        'caption',
        'container',
        'outer_container',
        'inner_container',
        'buttons',
        'nav',
        'counts',
        'title'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-Caption" id="{caption_id}">',
                '<div class="{className}-Caption-Label" id="{counts_id}">{label_text}</div>',
                '<div class="{className}-Caption-Title" id="{title_id}">{title_text}</div>',
            '</div>',
            '<div class="{className}-Questions-Container" id="{container_id}">',
                '<div class="{className}-Questions-inner-container" id="{inner_container_id}" > </div>',
            '</div>',
            '<div class="{className}-Buttons-Panel" id="{buttons_id}"></div>',
            '<div class="{className}-Navigation-Panel" id="{nav_id}"></div>',
        '</div>'
    ],
    /**
     * @protected
     * @property {Integer} _current_margin - MarginLeft of quiz container
     * @property {Integer} _true_count - Number of correct answers
     * @property {Integer} _answered_count - Number of solved  questions
     * @property {Array} _hint_used - array, where for every used hit, appropriately to question number, element is true
     */
    _current_margin: 0,
    _true_count: 0,
    _answered_count: 0,
    _hint_used: [[]],
    _defaults: {
        data: [],
        questions: [],
        nav_type: 'dots',
        nav_show: true,
        active_question_id: 0,
        title_visibility: true,
        hint_text: '',
        view_text: ''
    },
    /**
     * @public
     * @description basic elements setup
     * @property {Integer} active_review - Index of active quiz in Quizzes Array
     * @property {string} review_caption - "Question 1 of 4"
     * @property {Array} quizzes - Array of Quizzes
     */
    data: null,
    lang: null,
    active_question_id: null,
    active_question: null,  // active question object
    dom_id: null,
    auto_render: true,
    className: 'S-Review',
    label_text: null,
    title_text: null,
    title_visibility: null,
    tooltip: null,
    nav_type: null,
    hint_text: null,
    hint_caption: null,
    questions: null,
    navigation: null,
    nav_show: null,
    ids: null,
    author_mode: false,
    type: null,
    number_type: '1',
    /**
     */
    init: function () {
        if (document.getElementById(this.dom_id + '$widget')) {
            if (S.core.storage) {
                this.store = S.core.storage.getReviewData(this.ids.review, this.ids.test);
            } else {
                // If DOM already exist and there is no store data, delete DOM
                this.render_to.removeChild(document.getElementById(this.dom_id + '$widget'));
            }
        }
        this.ids && this.ids.test && S.savePage.obj_array.push(this);
        this._setLocalization();
        this.$callParentMethod(arguments);
        this.ids = this.ids || { review: this.id };
    },
    /**
     */
    rendered: function () {
        var _this = this;
        this._addListeners();
        this._compileButtons();
        this._addData();
        this._addPaginationPanel();
        this._refreshCaption();
        this._buttonsRefresh();
        this.refreshSizes();
        window.addEventListener("resize", function(){
            _this.refreshSizes();
        });
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        var data = {
                self: {
                    id: this.id,
                    active_question_id: this.active_question_id
                },
                top_id: S.genId.current,
                elements: S.core.DOM.getElementsIds(this),
                buttons: {
                    hint: this.hint_button._setStoreData(),
                    check: this.check_button._setStoreData(),
                    view: this.view_button._setStoreData()
                },
                paginate: this.navigation._setStoreData(),
                questions_ids: []
            },
            i = 0,
            tmp;
        for (; i < this.questions.length; i++) {
            data.questions_ids.push(this.questions[i].question_id);
            this.questions[i]._setStoreData();
        }
        S.core.storage.setReviewData(this.ids.review, this.ids.test, data);
        if (this.ids.test !== undefined) {
            tmp = S.core.storage.getTestData(this.ids.test);
            if (tmp.childs.indexOf(this.ids.review) === -1) {
                tmp.childs.push(this.ids.review);
            }
            S.core.storage.setTestData(this.ids.test, tmp);
        }
    },
    /**
     *
     */
    _countUsedHints: function (test_id) {
        test_id = test_id || this.ids.test;
        if (!test_id) throw new Error ("function _countUsedHints with no args valid only when test is passing");
        return this._hint_used[test_id].reduce(function (r, v) { return v ? ++r : r }, 0)
    },
    /**
     *
     */
    _addPaginationPanel: function () {
        if (this.type === 'test_review') {
            this.nav_show = false;
        }
        this.navigation = S.New('S.component.PaginatePanel', {
            store: this.store && this.store.paginate,
            render_to: this.nav_el,
            auto_render: this.nav_show,
            type: this.questions.length > 7 ? 'numbers' : 'dots',
            dots_count: this.questions.length,
            onAfterSetActive: function (num, without_animate) {
                this._changeQuestion(num, without_animate);
                this._refreshCaption();
            }.bind(this)
        });
    },
    /**
     * @protected
     * @method _button_compile
     * @description
     */
    _compileButtons: function (prefix) {
        prefix = prefix || '';
        var _this = this;
        this.hint_button = S.New('S.component.ButtonPC' + prefix, {
            store: this.store && this.store.buttons.hint,
            innerHTML: this.lang.view_hint,
            className: this.className + '-Button',
            render_to: this.buttons_el,
            index_el: '0',
            purpose: 'hint',
            auto_render: true,
            onClick: function () {
                this.viewHint();
                if (this.ids !== null) {
                    this._hint_used[this.ids.test] = this._hint_used[this.ids.test] || [];
                    this._hint_used[this.ids.test][this.active_question_id] = true;
                }
            }.bind(this)
        });
        this.check_button = S.New('S.component.ButtonPC' + prefix, {
            store: this.store && this.store.buttons.check,
            innerHTML: this.lang.check_answer,
            className: this.className + '-Button',
            render_to: this.buttons_el,
            auto_render: true,
            index_el: '1',
            purpose: 'check',
            onClick: function () {
                _this.checkAnswer();
            }
        });
        this.view_button = S.New('S.component.ButtonPC' + prefix, {
            store: this.store && this.store.buttons.view,
            innerHTML: this.lang.view_answer,
            className: this.className + '-Button',
            render_to: this.buttons_el,
            index_el: '2',
            purpose: 'view',
            auto_render: true,
            onClick: function () {
                _this.viewAnswer();
            }
        });
    },
    /**
     * @protected
     * @method _showResult
     * @description shows the number of correct answers out of a possible, called when the user has answered all the questions
     */
    _showResult: function () {
        if (this._answered_count === this.questions.length) {
            console.log("You answered correctly  on " + this._true_count+ " of " + this.questions.length + " questions");
            //alert("You answered correctly  on " + this._true_count+ " of " + this.questions.length + " questions")
        }
    },
    /**
     *
     */
    _addListeners: function () {
        // Listener on Widget Body click
        S.device.addEventListener(this.root_el, 'click', function () {
            this.tooltip && this.tooltip.destroy();
            this.root_el.blur();
        }.bind(this));
    },
    /**
     * @protected
     * @method  _refreshCaption
     * @description shows the number of the current quiz out of a possible, called when the user has changed the quiz
     */
    _refreshCaption: function () {
        var caption = this.label_text,
            question_number = (this.questions.length > 0) ? this.active_question_id + 1 : 0;
        caption += " " + question_number + "-" + this.questions.length + ".";
        this.counts_el.innerHTML = caption;
    },
    /**
     * @protected
     * @method  _addData
     * @description add quizzes to an Quizzes Array if the given data parameters, called when the object is initialized
     */
    _addData: function () {
        var a = this.data,
            i;
        this.data = [];
        for (i = 0; i < a.length; i++) {
            this.addQuestion(a[i], i);
        }
        this.active_question = this.questions[0];
    },
    /**
     * @protected
     * @function _buttonsRefresh
     *
     *
     * @description shows hides "view hint" and "View Answer" buttons for active question
     */
    _buttonsRefresh: function () {
        if (!this.active_question) {
            return false;
        }
        // HINT
        if (this.active_question.enable_hint === true) {
            if (this.active_question.solved) {

            }
            this.hint_button.show();
        } else {
            this.hint_button.hide();
        }
        // VIEW
        if (this.active_question.enable_view === true) {
            this.view_button.show();
        } else {
            this.view_button.hide();
        }
        // Check
    },
    /**
     * @protected
     * @method _checkButtonRefresh
     * @param purpose
     */
    _checkButtonRefresh: function (purpose) {
        purpose = purpose || "check";
        if (purpose === "check") {
            this.check_button.purpose = 'check';
            this.check_button.root_el.innerHTML = this.lang.check_answer;//'Check Answer';
        } else if (purpose === "retry") {
            this.check_button.purpose = 'retry';
            this.check_button.root_el.innerHTML = this.lang.retry;//'Retry';
        } else{
            this.check_button.purpose = 'clear';
            this.check_button.root_el.innerHTML = this.lang.clear_answer;//'Clear Answer';
        }
    },
    /**
     *
     * @param question_data (object)
     */
    addQuestion: function (question_data, id) {
        var a, question, type, view_status;
        id = id || (this.questions ? this.questions.length : 0);

        //setNumberType(this.number_type, true)
        switch (this.number_type) {
            case 'Q1': question_data.question_caption = 'Q' + (id + 1);
                break;
            case 'Question1': question_data.question_caption = 'Question' + (id + 1);
                break;
            default: question_data.question_caption = id + 1;
                break;
        }
        if (typeof (question_data) === 'string') {
            this.addQuestion({type: question_data});
            return false;
        }
        if (!question_data) {
            this.addQuestion({type: 'BaseRadio'});
            return false;
        }
        S.addParams(question_data, {
            store: this.store && S.core.storage.getQuestionData(
                this.store.questions_ids[id], this.ids.review, this.ids.test),
            auto_render: true,
            render_to: this.inner_container_el,
            question_data: question_data,
            review: this,
            ids: this.ids
        });
        if (this.ids && this.ids.test) {
            view_status = S.core.storage.getTestData(this.ids.test).view_hint;
            if (view_status !== 'optional') {
                question_data.enable_hint = view_status === 'show' ? true : false;
            }
            view_status = S.core.storage.getTestData(this.ids.test).view_answer;
            if (view_status !== 'optional') {
                question_data.enable_view = view_status === 'show' ? true : false;
            }
        }

        type = (/Author/.test(this.$namespace)) ? 'S.widget.review.question.' + question_data.type + 'Author' : 'S.widget.review.question.' + question_data.type;
        question = S.New(type, question_data);
        a = {
            type: question.type,
            question_caption: question.question_caption,
            question_text: question.question_text,
            hint_text: question.hint_text,
            enable_hint: question.enable_hint,
            enable_view: question.enable_view
        };
        switch (question.type) {
            case 'DndX':
            case 'TextImageBindLine':
                a.options = question.options;
                a.responses = question.responses;
                a.correct_accordance = question.correct_accordance;
                break;
            default:
                a.answers = question.answers;
                a.correct_answers = question.correct_answers;
                break;
        }
        this.data.push(a);
        this.questions.push(question);
        if (!this.store) {
            // Add dot to navigation panel
            this._refreshNavigation();
            this._refreshCaption();
            this.refreshSizes();
            S.core.DOM.makeWholeNeededEditable();
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onQuestionAdd(question.type + ";" + question.question_id + ";" + question.answer_type) ;
    },
    /**
     * @public
     * @method viewHint
     * @description
     * @param button
     */
    viewHint: function (button) {
        var _this = this,
            tooltip = null;
        if (!this.tooltip) {
            tooltip = S.New('S.component.Tooltip', {
                innerHTML: (this.active_question) ? this.active_question.hint_text || '' : '',
                editable: this.author_mode,
                bottom_align: this.buttons_el,
                close_type: "Cross",
                title: this.active_question.hint_caption || 'Hint',
                render_to: this.render_to,
                align_button: button || this.hint_button.root_el,
                onAfterChangeText: function (new_text) {
                    _this.active_question.hint_text = new_text;
                },
                onAfterChangeCaption: function (new_text) {
                    _this.active_question.hint_caption = new_text;
                },
                onBeforeDestroy: function () {
                    _this.tooltip = null;
                }
            });
            setTimeout(function () {_this.tooltip = tooltip;},0);    // just after body click event
        }
    },
    /**
     * @public
     * @method viewAnswer
     * @description
     * @param button
     */
    viewAnswer: function (button) {
        var _this = this,
            tooltip = null;
        if (!this.tooltip) {
            tooltip = S.New('S.component.Tooltip', {
                innerHTML: (this.active_question) ? this.active_question.view_text || '' : '',
                bottom_align: this.buttons_el,
                index_el: '1',
                title: 'Answer',
                close_type: "Cross",
                render_to: this.render_to,
                align_button: button || this.view_button.root_el,
                onBeforeDestroy: function () {
                    _this.tooltip = null;
                }
            });
            setTimeout(function () {_this.tooltip = tooltip;},0);    // just after body click event
        }
    },
    /**
     *
     * @param tails_align_el
     * @param title
     * @param text
     */
    showTooltip: function (tails_align_el, title, text) {
        var _this = this,
            tooltip = null;
        if (!this.tooltip) {
            tooltip = S.New('S.component.Tooltip', {
                innerHTML: text,
                bottom_align: this.buttons_el,
                title: title,
                close_type: "Button",
                render_to: this.render_to,
                align_button: tails_align_el,
                onBeforeDestroy: function () {
                    _this.tooltip = null;
                }
            });
            setTimeout(function () {_this.tooltip = tooltip;},0);    // just after body click event
        }
    },
    /**
     * @public
     * @method checkAnswer
     * @description Checks user's answer in active question
     */
    checkAnswer: function () {
        if (this.active_question) { // Check if there is no questions in Review
            if (this.check_button.purpose == "check") {
                var return_status = this.active_question.onCheckAnswer(this);
                this._checkButtonRefresh(return_status);
            }
            else{
                this.active_question.reset();
                this._checkButtonRefresh("check");
            }
        }
    },
    /**
     *
     */
    destroyTooltip: function () {
        if (this.tooltip) {
            this.tooltip.destroy();
        }
    },
    /**
     */
    _refreshNavigation: function () {
        if (this.navigation) {
            this.navigation.setDotsCount(this.questions.length, this.active_question_id);
            if (this.questions.length > 7) {
                if (this.navigation.type !== 'numbers') {
                    this.navigation.setType('numbers');
                }
            } else if (this.navigation.type !== 'dots') {
                this.navigation.setType('dots');
            }
        }
    },
    /**
     * @protected
     * @method _changeQuestion
     * @description
     */
    _changeQuestion: function (num, without_animate) {
        if (!this.questions.length) return;

        if (typeof num === 'undefined') {
            return false;
        } else if (num >= this.questions.length) {
            num = this.questions.length - 1;
        } else if (num <= 0) {
            num = 0;
        }
        this._current_margin = -(num * this._question_width);
        this.active_question_id = num;
        S.core.animate(this.inner_container_el, {marginLeft : this._current_margin} , without_animate ? 0 : 300);
        this.active_question = this.questions[this.active_question_id];
        this. _checkButtonRefresh(this.active_question.status);
        this._buttonsRefresh();
    },
    /**
     *
     */
    _setLocalization: function () {
        if (window.lang) {
            this.lang = window.lang;
            delete window.lang;
        } else {
            this.lang = {
                label_text: 'Label text',
                title_text: 'Title text',
                view_hint: 'View hint',
                check_answer: 'Check answer',
                retry: 'Retry',
                clear_answer: 'Clear answer',
                view_answer: 'View answer',
                question_caption: 'Question caption',
                question_text: 'Question text',
                hint_text: 'Hint text',
                example: 'Example'
            };
        }
        this.label_text = this.label_text || this.lang.label_text;
        this.title_text = this.title_text || this.lang.title_text;
    },
    /**
     * @public
     * @method setActiveQuestion
     * @param {Integer} num
     */
    setActiveQuestion: function (num, without_animate) {
        this.navigation.setActive(num, without_animate);
    },
    /**
     * @public
     * @method refreshSizes
     * @description refreshes questions sizes. USE THIS ON RESIZE EVENT
     */
    refreshSizes: function () {
        var i;
        this._question_width = this.container_el.clientWidth;
//        this.inner_container_el.style.height = this.container_el.clientHeight + 'px';
        for (i = 0; i < this.questions.length; i++) {
            this.questions[i].root_el.style.width = this._question_width + 'px';
        }
        this._changeQuestion(this.active_question_id, true);
    }
});

S.Class('S.widget.review.ReviewAuthor', {
    $extends: 'S.widget.review.Review',
    /**
     * @public
     */
    author_mode: true,
    /**
     */
    init: function () {
        if (!S.review_test && this.ids && this.ids.test) {
            S.review_test = {
                /**
                 * @public
                 * @description
                 * @param {String} test_id
                 * @param {String} type Type of visibility. Acceptable values: show, hide, optional
                 */
                viewHintButton: function (test_id, type) {
                    var tmp = S.core.storage.getTestData(test_id);
                    tmp.view_hint = type;
                    S.core.storage.setTestData(test_id, tmp);
                },
                /**
                 * @public
                 * @description
                 * @param {String} test_id
                 * @param {String} type Type of visibility. Acceptable values: show, hide, optional
                 */
                viewAnswerButton: function (test_id, type) {
                    var tmp = S.core.storage.getTestData(test_id);
                    tmp.view_answer = type;
                    S.core.storage.setTestData(test_id, tmp);
                }
            };
        }
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this._addTitleListeners();
        this.$callParentMethod(arguments);
        S.core.DOM.makeWholeNeededEditable();
    },
    /**
     */
    _addTitleListeners: function () {
        var check = true;
        var new_title = document.createElement('div'),
            _this = this;
        new_title.setAttribute('class', this.className+'-newTitle' );
        new_title.setAttribute('contenteditable', 'true');
        this.title_el.addEventListener('click', function (e) {
            this.innerHTML = '';
            this.appendChild(new_title);
            new_title.focus();
            this.style.borderColor = '#FF8C00';
            new_title.addEventListener('blur', endEdit);
        });
        new_title.addEventListener('keydown', function (e) {
            if (e.keyCode == 13) {
                e.preventDefault();
                this.blur();
            }
            if (this.getBoundingClientRect().left + this.offsetWidth > _this.title_el.getBoundingClientRect().left + _this.title_el.offsetWidth -18 &&
                e.keyCode !== 8) {
                e.preventDefault();
            }
        });

        function endEdit () {
            new_title.removeEventListener('blur', endEdit);
            _this.title_el.style.border = '';
            if (this.innerHTML !== "") {
                _this.title_el.innerHTML = this.innerHTML;
                this.innerHTML = '';
                _this.title_text = _this.title_el.innerHTML;
            } else  {
                _this.title_el.innerHTML = _this.title_text;
            }
        }
    },
    /**
     *
     */
    _collectData: function () {
        var wrapped_data = [],
            i, question;
        for (i = 0; i < this.questions.length; i++) {
            question = this.questions[i];
            wrapped_data.push(question.getScriptData());
        }
        return {
            dom_id: this.dom_id,
            label_text: this.label_text,
            title_text: this.title_text,
            nav_type: this.nav_type,
            data: wrapped_data,
            ids: this.ids
        };
    },
    /**
    *
     * ########### C# HANDLERS #################
    *
    **/
    getCaptionText: function () {
//        this._exchange(this.active  _question.question_caption);
        /* callback fot AuthoringTool */
        window["callback_" + this.active_question.question_id] && window["callback_" + this.active_question.question_id].onCaptionTextGet(this.active_question.question_caption);
        return this.active_question.question_caption;
    },
    /**
     *
     **/
    setCaptionText: function (text) {
        text = text || '';
        this.active_question.question_caption = text;
        this.active_question.question_caption_el.innerHTML = text;
        return this;
    },
    /**
     *
     */
    getQuestionText: function () {
//        this._exchange(this.active_question.question_text);
        /* callback fot AuthoringTool */
        window["callback_" + this.active_question.question_id] && window["callback_" +this.active_question.question_id].onQuestionTextGet(this.active_question.question_text);
        return this.active_question.question_text;
    },
    /**
     *
     **/
    setQuestionText: function (text) {
        text = text || '';
        this.active_question.question_text = text;
        this.active_question.question_text_el.innerHTML = text;
        return this;
    },
    //////////////////////////////////////////////////////// HINT //////////////////////////////////////////////////////
    /**
     *
     */
    setHintButtonStatus: function (is_visible) {
        if (is_visible) {
            this.active_question.enable_hint = true;
            this.hint_button.root_el.style.display = 'inline-block';
        } else {
            this.active_question.enable_hint = false;
            this.hint_button.root_el.style.display = 'none';
        }
    },
    /**
     *
     */
    getHintButtonStatus: function () {
//        this._exchange(this.active_question.enable_hint.toString());
        /* callback fot AuthoringTool */
        console.log(this.question_id);
        window["callback_" + this.active_question.question_id] && window["callback_" + this.active_question.question_id].onHintButtonStatusGet(this.active_question.enable_hint);
        return this.active_question.enable_hint;
    },
    /**
     *
     */
    setHintText: function (text) {
        text = text || '';
        this.active_question.hint_text = text;
    },
    /**
     *
     */
    getHintText: function () {
//        this._exchange(this.active_question.hint_text || '');
        /* callback fot AuthoringTool */
        window["callback_" + this.active_question.question_id] && window["callback_" + this.active_question.question_id].onHintTextGet(this.active_question.hint_text);
        return this.active_question.hint_text;
    },
    ///////////////////////////////////////////////////// VIEW ANSWER //////////////////////////////////////////////////
    /**
     *
     */
    setViewButtonStatus: function (is_visible) {
        if (is_visible) {
            this.active_question.enable_view = true;
            this.view_button.root_el.style.display = 'inline-block';
        } else {
            this.active_question.enable_view = false;
            this.view_button.root_el.style.display = 'none';
        }
    },
    /**
     *
     */
    getViewButtonStatus: function () {
//        this._exchange(this.active_question.enable_view.toString());
        /* callback fot AuthoringTool */
        window["callback_" + this.active_question.question_id] && window["callback_" + this.active_question.question_id].onViewButtonStatusGet(this.active_question.enable_view);
        return this.active_question.enable_view;
    },
    /**
     *
     */
    setViewText: function (text) {
        text = text || '';
        this.active_question.view_text = text;
    },
    /**
     *
     */
    getViewText: function () {
//        this._exchange(this.active_question.view_text || '');
        /* callback fot AuthoringTool */
        window["callback_" + this.active_question.question_id] && window["callback_" + this.active_question.question_id].onViewTextGet(this.active_question.view_text);
        return this.active_question.view_text;
    },
    /**
     * @public
     * @method addQuestion
     * @description Adds new question element to Review
     */
    addQuestion: function (question_data) {
        this.$callParentMethod(arguments);
    },
     /**
      * @public
      * @method getActiveQuestionId
      * @description Returns active question id number
      */
    getActiveQuestionId: function () {
//        this._exchange(parseInt(this.active_question_id, 10));
         /* callback fot AuthoringTool */
         window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onActiveQuestionIdGet(this.active_question_id);
        return this.active_question_id;
    },
    ///////////////////////////////////////////////////// NAVIGATION //////////////////////////////////////////////////
    /**
     *
     */
    hideNavigationPanel: function(){
        document.getElementsByClassName('S-Review-Navigation-Panel')[0].setAttribute('display','none');
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onNavigationPanelHide(true);
    },
    /*
     *
     */
    showNavigationPanel: function(){
        document.getElementsByClassName('S-Review-Navigation-Panel')[0].removeAttribute('display');
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onNavigationPanelShow(true);
    },
    ///////////////////////////////////////////////////
    // S E P A R A T E D   ------------------------  //
    ///////////////////////////////////////////////////
    /**
     * @public
     * @method getData
     * @description
     * @param do_not_export_to_xml
     */
    getData: function (do_not_export_to_xml) {
          var  data = "",
               i;
        for(i = 0; i < this.questions.length; i++){
            data += "type:" + this.questions[i].type + " question_id:" + this.questions[i].question_id + ";";
        }

        /* callback fot AuthoringTool */
        console.log(data);
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onDataGet(data);
        return data;
    },
    /**
     * @public
     * @method setNavigationType
     * @description
     * @param type
     */
    setNavigationType: function (type) {
        this.nav_type = type;
        this.navigation.setType(type);
        return this;
    },
    /**
     * @public
     * @method getLabelText
     * @description
     */
    getLabelText: function(){
//        this._exchange(this.label_text);
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onLabelTextGet(this.label_text);
        return this.label_text;
    },
    /**
     * @public
     * @method setLabelText
     * @description
     * @param text
     */
    setLabelText: function(text){
        this.label_text = text;
        this._refreshCaption();
    },
    /**
     * @public
     * @method getTitleText
     * @description
     */
    getTitleText: function(){
//        this._exchange(this.title_text);
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onTitleTextGet(this.title_text);
        return this.title_text;
    },
    /**
     * @public
     * @method setTitleText
     * @description
     * @param text
     */
    setTitleText: function(text){
        this.title_text = text;
        this.title_el.innerHTML = text;
    },
    /**
     * @public
     * @method setTItleVIsibility
     * @description
     * @param visibility
     */
    setTitleVisibility: function(visibility){
        if(visibility){
            this.title_el.style.display = "inline-block";
            this.title_visibility = true;
        } else{
            this.title_el.style.display = "none";
            this.title_visibility = false;
        }
    },

    /**
     * @public
     * @method getNumberType
     * @description getNumberType
     */
   getNumberType: function(){
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onNumberTypeGet(this.number_type);
        return this.number_type
    },
    /**
     * @public
     * @method setNumberType
     * @description setNumberType
     * @param new_type ('1','Q1','Question1')
     */
    setNumberType: function(new_type, init){
        //if(this.author_mode === true){}
        var i=0,
            old_type = this.number_type;

        switch (new_type) {
            case 'Q1': this.number_type = 'Q1';
                break;
            case 'Question1': this.number_type = 'Question1';
                break;
            default: this.number_type = '1';
                break;
        }

        if (old_type != this.number_type) {
            for(i=0; i < this.questions.length; i++) {
                this.questions[i].question_caption = this.number_type.slice(0,-1) + (i+1);
                //if(!init){}
                this.questions[i].question_caption_el.innerHTML = this.number_type.slice(0,-1) + (i+1);
            }
        }
    },
    /**
     * @public
     * @method getTitleVisibility
     * @description
     */
    getTitleVisibility: function(){
//        this._exchange(this.title_visibility);
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onTitleVisibilityGet(this.title_visibility);
        return this.title_visibility;
    },
    /**
     * @public
     * @method removeQuestion
     * @description remove quiz from Quizzes
     * @param {Number} index_of_question - Index of questions which remove, start from 0
     * @param {Number} how_many - Number of questions which remove ( the default 1 )
     */
    removeQuestion: function(index_of_question, how_many){
        'use strict';
        var to_destroy = null,
            i = 0,
            k = 0,//index_of_question + how_many,
            new_caption = '',
            quantity = how_many || 1;
        if(typeof index_of_question === 'undefined'){
            index_of_question = this.getActiveQuestionId();
        }
        k = index_of_question + quantity;
        if(quantity > 0/* && (index_of_question >= 0) && (index_of_question < this.questions.length)*/) {
            for(;k < this.questions.length; k++) {
                new_caption = this.number_type.slice(0,this.number_type.length-1) + (k  - quantity + 1);
                this.questions[k].question_caption = new_caption;
                this.questions[k].question_caption_el.innerHTML = new_caption;
            }
        }
        to_destroy = this.questions.splice(index_of_question, quantity);//how_many);
        for (; i < to_destroy.length; i++) {
            to_destroy[i].destroy();
        }
        this._refreshCaption();
        this._refreshNavigation();
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onQuestionRemove(index_of_question, how_many);
    },
    /**
     */
    setTestId: function (new_id) {
        this.ids.test = new_id;
    },
    /**
     */
    getTestId: function () {
        return this.ids.test;
    },
    /**
     * @public
     * @method next
     * @description sets next question active
     */
    next: function(){
        this.navigation.next();
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onNext(q.navigation.getActiveDotId() + 1);
    },
    /**
     * @public
     * @method prev
     * @description sets prev question active
     */
    prev: function(){
        this.navigation.prev();
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onPrev(q.navigation.getActiveDotId() - 1);
    },
    /**
     * @public
     * @method move
     * @param {Number} from source question id
     * @param {Number} to target question id
     * @description @changes question position
     */
    move: function(from, to){
        var temp_cmp;
        // move DOM
        S.core.DOM.move(this.questions[from].root_el, this.questions[to].root_el);
        // move in object
        temp_cmp = this.questions[from];
        this.questions[from] = this.questions[to];
        this.questions[to] = temp_cmp;
        // move in data
        tmp = this.data[from];
        this.data[from] = this.data[to];
        this.data[to] = tmp;
        if (from === this.getActiveQuestionId()) {
            this.navigation.setActive(to);
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onMove(from, to);
    },
    /**
     * @public
     * @method save
     * @description Rewrites script, run this when need save widget
     */
    save: function () {
        var script_str = [
            'S(function(){',
                'window.' + this.dom_id + ' = S.New("' + this.$namespace.replace(/Author/, '') +'", ' +
                    JSON.stringify(this._collectData()) +
                 ");",
            '});'
        ].join('');
        this._script_dom.innerHTML = script_str;
    }
});

S.Class('S.widget.review.question.Question', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
      , 'question_caption'
      , 'question_text'
      , 'points'
      , 'answers'
      , 'edit_area'
      , 'test'
    ],
    _tpl: [
        '<div class="{q_className}-Container" id="{root_id}">',
            '<div class="{q_className}-Question-Container">',
                '<div class="{q_className}-Question-Caption" id="{question_caption_id}">{question_caption}</div>',
                '<div class="{q_className}-Question-EditArea" id="{edit_area_id}" >',
                    '<div class="{q_className}-Question-Text" id="{question_text_id}">{question_text}</div>',
                '</div>',
            '</div>',
            '<div class="{q_className}-Points-Container"><p class="{q_className}-Points"' +
                ' id="{points_id}">{points}</p> Point</div>',
            '<div class="{q_className}-QPanel" id="{answers_id}">',
            '</div>',
        '</div>'
    ],
    _defaults: {
        points: 20
    },
    _question_elements: [],
    _question_tpl: [],
    /**
     * @public
     * @property {Array} answers
     * @property {Array} answers_group
     * @property {Array} correct_answers
     * @property {String} editable
     * @property {boolean} enable_hint
     * @property {String} hint_text
     * @property {Number} points
     * @property {Object} question_data
     * @property {String} question_caption
     * @property {String} question_text
     * @property {Object} review Links to Review object
     */
    q_className: 'S-Review-QItem',
    answers: null,
    answers_group: null,
    answer_type: null,
    correct_answers: null,
    started: false,
    editable: null,
    enable_hint: true,
    enable_view: false,
    hint_text: null,
    view_text: null,
    points: null,
    question_data: null,
    question_caption: null,
    question_text: null,
    review: null,
    question_id: null,
    contenteditable: 'false',
    status: "check", // 'check', 'clear' or 'retry' - Need for button "Check answer" in Review


    /**
     */
    init: function () {
        var tmp_tpl = this._tpl.slice();
        this.editable = String(S.config.author_mode);
        this._elements = this._elements.concat(this._question_elements);
        tmp_tpl.splice(tmp_tpl.indexOf('<div class="{q_className}-QPanel" id="{answers_id}">') +
            1, 0, this._question_tpl.join(''));
        this._tpl = tmp_tpl;
        this._initLanguage();
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        var answerStarted = function () {
            this.started = true;
            this.answers_el.removeEventListener('mousedown', answerStarted);
        }.bind(this);
        this.answers_el.addEventListener('mousedown', answerStarted);
        this.$callParentMethod(arguments);
        if (S.config.author_mode) {
            this.review.check_button.hide();
            this._initContentEditable();
        }
    },
    /**
     */
    _setStoreData: function (obj) {
        S.addParams(obj.self, {
            id: this.id,
            points: this.points
        });
        if (!this.ids) {
            this.ids = { review: this.review.id };
        }
        obj.elements = S.core.DOM.getElementsIds(this);
        S.core.storage.setQuestionData(this.question_id, this.ids.review, this.ids.test, obj);
        S.core.storage.setQuestionResult(this.question_id, this.ids.review, this.ids.test,
            this.started ? Number(this.checkAnswer()) : -1);
    },
    /**
     * @description Localize texts
     */
    _initLanguage: function () {
        this.question_caption = this.question_caption || this.review.lang.question_caption;
        this.question_text = this.question_text || this.review.lang.question_text;
        this.hint_text = this.hint_text || this.review.lang.hint_text;
    },
    /**
     * @description Initializes content editable HTML elements
     */
    _initContentEditable: function () {
        var _this = this;
        //this.question_caption_el.setAttribute("contenteditable", false);//this.editable);
        this.question_text_el.setAttribute("contenteditable", this.editable);
        this.question_text_el.addEventListener('click', function () {
            this.innerHTML = '';
            _this.edit_area_el.style.borderColor = '#FF8C00';
        });
        this.points_el.setAttribute('contenteditable', this.editable);
        S.core.inputFilter(this.points_el, 'number', 4);
        this.points_el.addEventListener('keydown', function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                this.blur();
            }
        });
        this.points_el.addEventListener('blur', function () {
            _this.points = this.innerHTML;
        });
        this.question_caption_el.addEventListener('keydown', function (e) {
            if (e.keyCode === 13) {
                e.preventDefault();
                this.blur();
            }
        });
        this.question_caption_el.addEventListener('blur', function () {
            _this.question_caption = this.innerHTML;
        });
        this.question_text_el.addEventListener('blur', function () {
            _this.edit_area_el.style.borderColor = 'transparent';
            if (this.innerHTML !== "") {
                _this.question_text = this.innerHTML;
            }
            this.innerHTML = _this.question_text;
        });
    },
    /**
     * @description Return default (for all question types) script data
     */
    _getDataQ: function () {
        return {
            type: this.type,
            question_caption: this.question_caption,
            question_text: this.question_text,
            hint_text: this.hint_text,
            enable_hint: this.enable_hint,
            enable_view: this.enable_view
        };
    },
    /* Need to implement in each child */
    onViewHint: function () {},
    onViewAnswer: function () {},
    reset: function () {},
    getQuestionId: function () {
        if (this.question_id) {
            window["callback_" + this.question_id] && window["callback_" + this.question_id].onQuestionIdGet(this.question_id);
            return this.question_id;
        }
    },
    getAnswerType: function () {
        if (this.answer_type) {
            window["callback_" + this.question_id] && window["callback_" + this.question_id].onAnswerTypeGet(this.question_id);
            return this.answer_type;
        }
    }
});
/**
/**
 * @class BaseRadio
 * @description InteractiveObject (Question Type 6 Objective test Type)
 * Objective test type – select single answer
 */
S.Class('S.widget.review.question.BaseRadio', {
    $extends: 'S.widget.review.question.Question',
    _defaults: {
        answers: [],
        correct_answer: 0,
        contenteditable: 'false',
        status: 'check'
    },
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} contenteditable Permission to edit content
     * @property {string} question_caption Text of question
     * @property {string} data
     * @property {string} question_text Text of caption
     * @property {string} hint_text Text of hint
     * @property {string} collected_data
     * @property {Number} innerCounter
     * @property {Number} view
     * @property {string} status
     */
    className: 'S-Review-BaseRadio',
    innerCounter: 0,
    contenteditable: null,
    correct_answer: null,
    collected_data: null,
    data: null,
    status: null,
    /**
     * @method rendered
     * @memberOf S.widget.review.question.BaseRadio
     */
    rendered: function () {
        this._compileAnswers();
        this.$callParentMethod(arguments);
    },
    /**
     * @protected
     * @method _setStoreData
     * @memberOf S.widget.review.question.BaseRadio
     * @description set data to storage
     */
    _setStoreData: function () {
        var obj = {
            self: {
                correct_answer: this.correct_answer
            },
            answers_group: this.answers_group._setStoreData()
        };
        this.$callParentMethod([obj]);
    },
    /**
     * @protected
     * @method _compileAnswers
     * @memberOf S.widget.review.question.BaseRadio
     * @description Creating RadioButtonGroup (if it doesn't exist) and creating all answer from answer array
     */
    _compileAnswers: function () {
        var i, tmp_answers;

        if (this.answers.length ) {
            this.answers_group = S.New('S.component.form.RadioButtonGroup', {
                store: this.store && this.store.answers_group,
                render_to: this.answers_el,
                auto_render: true,
                contenteditable: this.contenteditable
            });
            tmp_answers = this.answers.slice();
            this.answers = [];
            for (i = 0; i < tmp_answers.length; i++) {
                this.addAnswer(tmp_answers[i]);
            }
        }
    },
    /**
     * @public
     * @method addAnswer
     * @memberOf S.widget.review.question.BaseRadio
     * @description Create RadioButton Element and push in answer_group
     */
    addAnswer: function (answer, index) {
        if (!this.answers_group) {
            this.answers_group = S.New('S.component.form.RadioButtonGroup', {
                store: this.store && this.store.answers_group,
                render_to: this.answers_el,
                auto_render: true,
                contenteditable: this.contenteditable
            });
            tmp_answers = this.answers.slice();
            this.answers = [];
            for (i = 0; i < tmp_answers.length; i++) {
                this.addAnswer(tmp_answers[i]);
            }
        }
        var button_data = {
                render_to: this.answers_group.root_el,
                auto_render: true,
                label: answer.label,
                image: answer.image,
                number: ++this.innerCounter + ". ",
                contenteditable: this.contenteditable
            },
            answer_item;
        if (index !== undefined) { // Used in author method
            button_data.insert_before = this.answers_group.root_el.children[index];
        }
        if (answer.image && !answer.label) {
            button_data.className = 'S-radioButtonImage';
        } else if (answer.image && answer.label) {
            button_data.className = 'S-radioButtonImage63';
        }
        answer_item = S.New('S.component.form.RadioButton', button_data);
        if (index !== undefined) { // Used in author method
            this.answers_group.splice(index, 0, answer_item);
            this.answers_group.addItem(answer_item, true);
            this.answers.splice(index, 0, {label: answer_item.label, image: answer_item.image});
        } else {
            this.answers_group.addItem(answer_item);
            this.answers.push({
                label: answer_item.label,
                image: answer_item.image
            });
        }
    },
    /**
     * @public
     * @method onCheckAnswer
     * @memberOf S.widget.review.question.BaseRadio
     * @description Checks answer
     * @return {string}
     */
    onCheckAnswer: function(){
        var is_correct = true;
        if (!this.answers_group || this.answers_group.getChecked() === null) {
            return false;
        }
        if (this.answers_group.getChecked() !== this.correct_answer){
            is_correct = false;
        }
        this.answers_group.checkedItem.setConfirm(is_correct);
        this.answers_group.setAvailable(false);
        return is_correct ? this.status = 'clear' : this.status = 'retry';
    },
    /**
     * @public
     * @method CheckAnswer
     * @memberOf S.widget.review.question.BaseRadio
     * @description Current answer analyzing
     * @return {boolean}
     */
    checkAnswer: function () {
        return !(!this.answers_group || this.answers_group.getChecked() === null ||
                this.answers_group.getChecked() !== this.correct_answer);
    },
    /**
     * @public
     * @method reset
     * @memberOf S.widget.review.question.BaseRadio
     * @description reset checked answers
     */
    reset: function () {
        this.answers_group.setAvailable(true);
        this.answers_group.reset();
        this.status = "check";
    }
});

/**
 * @class BaseRadioAuthor
 * @description InteractiveObject (Question Type 6 Objective test Type), Author side
 * Objective test type – select single answer, Author side
 */
S.Class('S.widget.review.question.BaseRadioAuthor', {
    $extends: 'S.widget.review.question.BaseRadio',
    /**
     * @public
     * @property {string} contenteditable Permission to edit content
     */
    contenteditable: 'true',
    /**
     * @method rendered
     * @memberOf S.widget.review.question.BaseRadioAuthor
     */
    rendered: function(){
        this.$callParentMethod(arguments);
        this._init();
    },
    /**
     * @private
     * @method _init
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description add events and check correct answer on load
     */
    _init: function(){
        this._addAnswersListeners();
        this._showCorrectAnswer();
    },
    /**
     * @private
     * @method _addAnswersListeners
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description add events processing to questions
     */
    _addAnswersListeners: function () {
        if (this.answers_group && this.answers_group.items[0].image) {
            this._addImageListener();
        }
        var _this = this,
            answers = (this.answers_group && this.answers_group.items) ? this.answers_group.items : null,
            data_answers = this.answers;
        if (!answers) {
            return false;
        }
        answers.forEach(function(answer, i){
            if (_this.answers_group.items[i].label_el) {
                _this.answers_group.items[i].label_el.addEventListener('keyup', function () {
                    _this.answers_group.items[i].label = this.innerHTML;
                    _this.answers[i].label = this.innerHTML;
                    _this.review.save();

                },false);
            }
        });
        answers.forEach(function(answer, i){
            _this.answers_group.items[i].icon_el.addEventListener('mouseup', function () {
                _this.correct_answer = i;
                _this.review.save();
            },false);
        });


    },
    /**
     * @private
     * @method _addImageListener
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @param {integer} index
     */
    _addImageListener: function (index) {
        var i = index || 0,
            _this = this,
            checkBox_dom_array,
            index_of_image;
        if (!index) {

            for (i = 0; i < this.answers_group.items.length ; i++) {

                this.answers_group.items[i].image_el.addEventListener('click', function () {
                    checkBox_dom_array = Array.prototype.slice.call(_this.answers_group.root_el.children);
                    index_of_image = checkBox_dom_array.indexOf(document.getElementById(this.parentNode.id));
                    window["callback_" + this.question_id] && window["callback_" + this.question_id].onImageClick(index_of_image);
                })
            }
        } else {
            this.answers_group.items[i].image_el.addEventListener('click', function () {
                console.log(i);
                window["callback_" + this.question_id] && window["callback_" + this.question_id].onImageClick(index);
            })
        }

    },
    /**
     *
     */
    /*_addListenerToSpecifiedAnswer: function (i) {
        if (typeof i === 'undefined' || !this.answers_group || !this.answers_group.items || this.answers_group.items.length === 0 || !this.answers_group.items[i] || !this.answers_group.items[i].label_el) {
            console.log('HERE CAN BE AN ERROR IN FUTURE, Please try to edit just added answer from screen and save it. than try to launch');
            return false;
        }
        var _this = this;
        this.answers_group.items[i].label_el.onkeyup = function () {
            _this.answers_group.items[i].label = this.innerHTML;
            _this.answers[i].label = this.innerHTML;
            _this.review.save();
        };
    },*/
    /**
     * @private
     * @method _showCorrectAnswer
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description check correct answer
     */
    _showCorrectAnswer: function () {
        if(!this.answers_group || !this.answers_group.items.length){
            return
        }
        this.answers_group.items[this.correct_answer].setChecked(true);
    },
    /**
     * @public
     * @method addAnswer
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description adds new answer
     * @param {object[string, string], integer} answer[label, image], index
     */
    addAnswer: function (answer, index) {
        this.$callParentMethod(arguments);
        if (index !== undefined) {
                if(this.answers_group.items[0].image) {
                    this._addImageListener(index);
                }
            this._addListenerToSpecifiedAnswer(index);
            this.review.save();
        }
        this._recount();
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onAnswerAdd(to_return);
    },
    /**
     *
     */
    /*setAnswerLabel: function (i, label) {
        if (!this.answers.length || !this.answers_group.items) {
            return
        }
        this.answers_group.items[i].setLabel(label);
        this.answers[i].label = label;
    },*/
    /**
     * @public
     * @method setAnswerImage
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description set image to specified answer
     * @param {integer, string} index, image
     */
    setAnswerImage: function (index, image) {
        if(typeof(this.answers_group.items[index].image)!=='undefined'){
            this.answers_group.items[index].image_el.style.backgroundImage = 'url(' + image +')';
            this.answers_group.items[index].image = image;
        }
    },
    /**
     *
     */
   /* getAnswerLabel: function (i) {
        if(this.answers){
            *//* callback fot AuthoringTool *//*
            window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerLabelGet(this.answers[i].label);
            return this.answers[i].label;
        }
        *//* callback fot AuthoringTool *//*
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerLabelGet(false);
        return false
    },*/
    /**
     *
     */
    /*getAnswerImage: function (index, answer_data) {
        //        TO DO: add getImage method in radioButton
    },*/
    /**
     * @public
     * @method removeAnswer
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description removes answer
     * @param {integer} index_of_answer
     */
    removeAnswer: function (index_of_answer){
        if(typeof index_of_answer === 'undefined'){
            return false;
        }
        this.answers_group.items[index_of_answer].destroy();
        this.answers_group.items.splice(index_of_answer, 1);
        this.answers.splice(index_of_answer, 1);
        /* callback fot AuthoringTool */
       this._recount();
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onAnswerRemove(index_of_answer);
    },
    /**
     * @public
     * @method getAnswerCount
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description getAnswerCount
     * @return {integer} answers_length
     */
    getAnswerCount: function(){
        console.log("callback_" + this.question_id)
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onAnswerCountGet(this.answers.length);
        return this.answers.length
    },
    /**
     * @public
     * @method setCorrectAnswer
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description sets correct answer
     * @param {integer} number
     */
    setCorrectAnswer: function(number){
        if(typeof number === 'undefined') return;
        this.correct_answer = number;
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onCorrectAnswerSet(this.correct_answer);
    },
    /**
     * @public
     * @method getCorrectAnswer
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description get correct answer number
     * @return {integer} numbers
     */
    getCorrectAnswer: function(numbers){
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onCorrectAnswerGet(this.correct_answer);
        return this.correct_answer;
    },
    /**
     * @public
     * @method getScriptData
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description Returns current script data
     */
    getScriptData: function () {
        var data = {
            answers: this.answers,
            //correct_answers: this.correct_answers
            correct_answers: this.correct_answer
        };
        S.addParams(data, this._getDataQ());
        return data;
    },
    /*setAnswer: function(index, answer_data) {
        if (this.answers_group.items[index - 1].label) {
            this.answers_group.items[index- 1].label = answer_data.label;
            this.answers_group.items[index - 1].label_el.innerHTML = answer_data.label;
            if (this.answers_group.items[index - 1].image) {
                this.answers_group.items[index - 1].image_el.style.backgroundImage = 'url(' + answer_data.image +')';
                this.answers_group.items[index - 1].image = answer_data.image;
            }
        } else {
            this.answers_group.items[index - 1].image_el.style.backgroundImage = 'url(' + answer_data.image +')';
            this.answers_group.items[index - 1].image = answer_data.image;
        }
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onSetAnswer();
        this._recount();
    },*/
    /**
     * @private
     * @method _recount
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description sets numbers to answers
     */
    _recount: function () {
        var i;
        for (i = 0; i < this.answers_group.items.length; i ++) {
            this.answers_group.items[i].number_el.innerHTML = 1 + i + ".";
            this.answers_group.items[i].number = 1 + i;
        }
    },
    /**
     * @public
     * @method getAnswer
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description Returns
     * @return {string} representation  of answer as JSON.stringify format
     */
    getAnswer: function (index) {
        if (this.answers_group.items[index]) {
            window["callback_" + this.question_id] && window["callback_" + this.question_id].onGetAnswers();
            return '{label: "' + this.answers_group.items[index].label + '", image: "' + this.answers_group.items[index].image + '"}';
        }
    },
    /**
     * @public
     * @method getData
     * @memberOf S.widget.review.question.BaseRadioAuthor
     * @description accessorial metod for getScriptData, collects data from answers
     * @return {string} representation  of answer as JSON.stringify format
     */
    getData: function () {
        var str = "", i;
        for(i=0; i < this.answers.length; i++) {
            str += 'index: ' + i + ', ';
            str += '{image: "' + this.answers[i].image + '",';
            str += 'label: "' + this.answers[i].label + '"}; '
        }
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onGetData();
        return str;
    }
});
/**
 * @class BaseRadio
 * @description InteractiveObject (Question Type 9 Objective test Type)
 * Objective test type – select single answer
 */
S.Class('S.widget.review.question.RadioOX', {
    $extends: 'S.widget.review.question.Question',
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} contenteditable Permission to edit content
     * @property {Boolean} enable_hint Permission to enable hint
     * @property {Boolean} enable_view Permission to enable view of answer
     * @property {string} question_caption Text of question
     * @property {string} question_text Text of caption
     * @property {string} hint_text Text of hint
     * @property {Array} answers
     * @property {string} correct_answers
     * @property {string} data
     * @property {string} collected_data
     */
    className: 'S-Review-RadioOX',
    contenteditable: 'false',
    enable_hint: false,
    enable_view: false,
    answers_group: null,
    question_caption: 'question caption',
    question_text: 'type question here...',
    hint_text: 'hint text',
    answers : [],
    correct_answers: 0,
    data: null,
    collected_data: null,
    /**
     */
    init: function () {
        this.answers = this.answers || [];
        this.correct_answers = this.correct_answers || [0];
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this.$callParentMethod(arguments);
        this._compileAnswers();
    },
    /**
     */
    _compileAnswers: function () {
        if (!this.answers_group) {
            this.answers_group = S.New('S.component.form.RadioButtonGroup', {
                store: this.store && this.store.answers_group,
                data: [
                    {
                        className: 'S-RadioOX',
                        image_className: 'S-RadioOX-O'
                        , image: 'false'
                    }, {
                        className: 'S-RadioOX',
                        image_className: 'S-RadioOX-X'
                        , image: 'false'
                    }
                ],
                className: 'S-RadioOX-Answers-Group',
                render_to: this.answers_el,
                auto_render: true
            });
        }
    },
    /**
     */
    onCheckAnswer: function () {
        if (!this.answers_group || this.answers_group.getChecked() === null) {
            return false;
        }
        if (this.answers_group.getChecked() === this.correct_answers[0]){
            this.answers_group.checkedItem.setConfirm(true);
            this.status = "clear";
        } else {
            if (this.answers_group && this.answers_group.checkedItem && this.answers_group.checkedItem.setConfirm) {
                this.answers_group.checkedItem.setConfirm(false);
                this.status = "retry";
            }
        }
        this.answers_group.setAvailable(false);
        return this.status;
    },
    /**
     */
    reset: function () {
        this.answers_group.setAvailable(true);
        this.answers_group.reset();
        this.status = "check";
    }
});





/**
 * @class BaseRadioAuthor
 * @description InteractiveObject (Question Type 9 Objective test Type), Author side
 * Objective test type – select single answer, Author side
 */
S.Class('S.widget.review.question.RadioOXAuthor', {
    $extends: 'S.widget.review.question.RadioOX',
    /**
     * @public
     * @property {string} contenteditable Permission to edit content
     */
    contenteditable: 'true',
    /**
     */
    rendered: function(){
        this.$callParentMethod(arguments);
        this._compileAnswers();
        this._init();
    },
    /**
     */
    _init: function(){
        this._addAnswersListeners();
        this._showActiveAnswer();
    },
    /**
     *
     */
    removeAnswer: function (index_of_answer){
        if(typeof index_of_answer === 'undefined'){
            return false;
        }
        this.answers_group.items[index_of_answer].destroy();
        this.answers_group.items.splice(index_of_answer, 1);
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerRemove(index_of_answer);
    },
    /**
     * @public
     * @method setCorrectAnswer
     * @description  remove one or more answer from quiz
     * @param {integer} numbers - Index of current answer or answers, start from 0
     */
    setCorrectAnswer: function(numbers){
        console.log(numbers)
        if(typeof numbers === 'undefined') return;
        this.correct_answers[0] = parseInt(numbers);
    },
    /**
     *
     */
    getCorrectAnswer: function(){
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onCorrectAnswerGet(this.correct_answers[0]);
        return this.correct_answers[0];
    },
    /**
     *
     */
    onCheckAnswer: function(){},
    /**
     *
     */
    _addAnswersListeners: function () {
        var _this = this,
            answers = (this.answers_group && this.answers_group.items) ? this.answers_group.items : null,
            data_answers = this.answers;
        if (!answers) {
            return false;
        }
        answers.forEach(function(answer, i){
            _this.answers_group.items[i].icon_el.addEventListener('mouseup', function () {
                _this.correct_answers = [i];
                _this.review.save();
            },false);
        });
    },
    /**
     *
     */
    _showActiveAnswer: function () {
        this.answers_group.items[this.correct_answers].setChecked(true);
    },
    /**
     * @public
     * @method getScriptData
     * @description Returns current script data
     */
    getScriptData: function () {
        var data = {
            correct_answer: this.correct_answer
        };
        S.addParams(data, this._getDataQ());
        return data;
    },
    /**
     * @public
     * @method getAnswerCount
     * @description getAnswerCount
     */
    getAnswerCount: function(){
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onAnswerCountGet(this.answers.length);
        return this.answers.length
    }
});
/**
 * @class BaseRadio
 * @description InteractiveObject (Question Type 7 Objective test Type)
 * Objective test type – select several answer
 */
S.Class('S.widget.review.question.BaseCheckBox', {
    $extends: 'S.widget.review.question.Question',
    _defaults: {
        answers: [],
        correct_answers: [],
        contenteditable: 'false'
    },
    /**    TO DO
     * @public
     * @property {string} className Main class name
     * @property {string} contenteditable Permission to edit content
     * @property {Boolean} enable_hint Permission to enable hint
     * @property {Boolean} enable_view Permission to enable view of answer
     * @property {string} question_text Text of caption
     * @property {string} hint_text Text of hint
     * @property {Array} answers_group
     * @property {Array} answers
     * @property {Array} correct_answers
     */
    className: 'S-Review-BaseCheckBox',
    contenteditable: null,
    answers_group: null,
    answers: null,
    correct_answers: null,
    /**
     * @method rendered
     * @memberOf S.widget.review.question.BaseCheckBox
     */
    rendered: function () {
        this._compileAnswers();
        this.$callParentMethod(arguments);

    },
    /**
     * @protected
     * @method _setStoreData
     * @memberOf S.widget.review.question.BaseCheckBox
     * @description set data to storage
     */
    _setStoreData: function () {
        var obj = {
            self: {
                correct_answers: this.correct_answers
            },
            answers_group: this.answers_group._setStoreData()
        };
        this.$callParentMethod([obj]);
    },
    /**
     * @protected
     * @method _compileAnswers
     * @memberOf S.widget.review.question.BaseCheckBox
     * @description Creating RadioButtonGroup (if it doesn't exist) and creating all answer from answer array
     */
    _compileAnswers: function () {
        this._addAnswerGroup();
        if (this.answers) {
            for(var answer in this.answers) {
                if (this.answers[answer].label)
                    this.answers[answer].label.contenteditable = this.contenteditable;
                this.addAnswer(this.answers[answer], true); // true - so answer wouldn't be added to this.answers
            }
        }
    },
    /**
     * @public
     * @method onCheckAnswer
     * @memberOf S.widget.review.question.BaseCheckBox
     * @description Checks answer
     * @return {string} status
     */
    onCheckAnswer: function () {
        var checked_answers = this.answers_group.getChecked();
        if (this.correct_answers.length === checked_answers.length) {
            var correct_answers = 0;
            for ( var i = 0; i < checked_answers.length; i++) {
                if (this.correct_answers.indexOf(checked_answers[i]) !== -1) {
                    this.answers_group.items[checked_answers[i]].setConfirm(true);
                    correct_answers++;
                } else {
                    this.answers_group.items[checked_answers[i]].setConfirm(false);
                }
            }
            if (checked_answers.length === correct_answers)
            {
                this.status = "clear";
            }
            else {
                this.status = "retry";
            }
            this.answers_group.setAvailable(false);
        } else {
            this.review.showTooltip(this.review.check_button.root_el, 'There are ' + this.correct_answers.length + ' correct answers. Tick only ' + this.correct_answers.length + ' answers');
        }
        return this.status;
    },
    /**
     * @private
     * @method _addAnswerGroup
     * @memberOf S.widget.review.question.BaseCheckBox
     * @description Create's checkBoxGroup
     */
    _addAnswerGroup: function(){
        this.answers_group = S.New('S.component.form.CheckBoxGroup', {
            store: this.store && this.store.answers_group,
            className: 'S-CheckBoxGroup',
            items: [],
            render_to: this.answers_el,
            auto_render: true,
            contenteditable: this.contenteditable
        });
    },
    /**
     * @public
     * @method addAnswer
     * @memberOf S.widget.review.question.BaseCheckBox
     * @description add checkbox to checkBoxGroup and adds it to this.answers array if not exists in it
     * @param {object} answer, {boolean} contains
     */
    addAnswer: function(answer, contains) {
        contains = contains || false; // check
        if(!contains) {
            this.answers.push(answer)
        }
        // locate in CheckBoxGroup
        answer = S.New('S.component.form.CheckBox', {
            number: this.answers_group.items.length + 1,
            image: answer.image,
            label: answer.label,
            render_to: this.answers_group.root_el,
            auto_render: true,
            contenteditable: this.contenteditable
        });
        this.answers_group.addItem(answer);
    },
    /**
     * @public
     * @method reset
     * @memberOf S.widget.review.question.BaseCheckBox
     * @description
     */
    reset: function () {
        this.answers_group.setAvailable(true);
        this.answers_group.reset();
        this.status = "check";
    }
});

/*   To DO
    relocate addAnswer in checkBoxGroup
    check styles: 'S-CheckBoxImageGroup62' and 'S-CheckBoxGroup'
 */







/**
 * @class BaseRadio
 * @description InteractiveObject (Question Type 7 Objective test Type), Author side
 * Objective test type – select several answer, Author side
 */
S.Class('S.widget.review.question.BaseCheckBoxAuthor', {
    $extends: 'S.widget.review.question.BaseCheckBox',
    contenteditable: 'true',
    /**
     * @method rendered
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     */
    rendered: function(){
        this.$callParentMethod(arguments);
        this._checkCorrectAnswersOnRender();
    },
    /**
     * @public
     * @method addAnswer
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description add events processing to questions
     */
    addAnswer: function(answer, contains) {
        this.$callParentMethod(arguments);
        this._addAnswersListeners();
        if(!contains){
            this.review.save();
        }
    },
    /**
     * @private
     * @method _addAnswersListeners
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description add events processing to questions
     */
    _addAnswersListeners: function () {
        var _this = this,
            i = this.answers_group.items.length-1,
            answer = (this.answers_group && this.answers_group.items) ? this.answers_group.items[i] : null,
            data_answers = this.answers;
        if (answer) {
            answer.icon_el.addEventListener('mouseup', function () {
                if (_this.correct_answers.indexOf(i) != -1) {
                    _this.correct_answers.splice(_this.correct_answers.indexOf(i), 1);
                } else {
                    _this.correct_answers.push(i);
                }
                _this.review.save();
            });
            answer.image_el.addEventListener('click', function () {
                window["callback_" + this.question_id] && window["callback_" + this.question_id].onImageClick()
                _this.review.save();
            });
            answer.label_el.addEventListener('keyup', function () {
                answer.label = this.innerHTML;
                this.answers[i].label = this.innerHTML;
                _this.review.save();
            });
        }
    },
    /**
     * @public
     * @method setAnswerImage
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description sets image to question
     * @param {integer} index, {string} image
     */
    setAnswerImage: function (index, image) {
        this.answers_group.items[index].image_el.style.backgroundImage = 'url(' + image +')';
        this.answers_group.items[index].image = image;
        this.review.save();
    },
    /**
    * @public
    * @method getAnswer
    * @memberOf S.widget.review.question.BaseCheckBoxAuthor
    * @description get specified answer
    * @param {integer} i
    * @return {object[string, string]}
    */
    getAnswer: function (i) {
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onAnswerGet({label: "label", image: "image"});
        return {'label': this.answers_group.items[i].label, 'image': this.answers_group.items[i].image};
    },
    /**
     * @public
     * @method removeAnswer
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description  remove one or more answer from question
     * @param {integer} index_of_answer - Index of answer which remove, start from 0
     */
    removeAnswer: function (index_of_answer){
        var index = -1;
        if(typeof index_of_answer !== 'undefined') {
            this.answers_group.items[index_of_answer].destroy();
            this.answers_group.items.splice(index_of_answer, 1);
            this.answers.splice(index_of_answer, 1);
            if((index = this.correct_answers.indexOf(index_of_answer)) > -1){
                this.correct_answers.splice(index, 1);
            }
            window["callback_" + this.question_id] && window["callback_" + this.question_id].onAnswerRemove(index_of_answer);
            this.review.save();
        }
    },
    /**
     * @public
     * @method setCorrectAnswer
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description  remove one or more answer from quiz
     * @param {integer} numbers - Index of current answer or answers, start from 0
     */
    setCorrectAnswers: function(numbers){
        if(typeof numbers !== 'undefined') {
            if (!Array.isArray(arguments[0])) {
                numbers = S.core.Array.toArray(arguments)
            }
            this.correct_answers = [];
            for(var i in numbers){
                this.correct_answers.push(numbers[i]);
            }
            this.review.save();
        }
    },
    /**
     * @public
     * @method setInсorrectAnswer
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description  remove one or more answer from questions
     * @param {Array[integer]} numbers - Index of current answer or answers, start from 0
     */
    setIncorrectAnswer: function(numbers){
        if(typeof numbers !== 'undefined') {
            if (!Array.isArray(arguments[0])) {
                numbers = S.core.Array.toArray(arguments)
            }
            for(var i in numbers){
               if(this.correct_answers.indexOf(numbers[i])!== -1){
                   this.correct_answers.splice(this.correct_answers.indexOf(numbers[i]), 1)
                } else {
                   return "This number is not correct!"
               }
            }
            this.review.save();
        }
    },
    /**
     * @public
     * @method getCorrectAnswer
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description description of method
     * @return {array}
     */
    getCorrectAnswer: function(){
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onCorrectAnswerGet(this.correct_answer);
        return this.correct_answers;
    },

    /**
     * @public
     * @method getScriptData
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description Returns current script data
     */
    getScriptData: function () {
        var data = {
            answers: this.answers,
            correct_answers: this.correct_answers
        };
        S.addParams(data, this._getDataQ());
        return data;
    },
    /**
     * @public
     * @method getAnswerCount
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description getAnswerCount
     * @return {integer}
     */
    getAnswerCount: function(){

        window["callback_" + this.question_id] && window["callback_" + this.question_id].onAnswerCountGet(this.answers_group.items.length);
        return this.answers_group.items.length
    },
    /**
     * @private
     * @method _checkCorrectAnswersOnRender
     * @memberOf S.widget.review.question.BaseCheckBoxAuthor
     * @description checks correct answers
     */
    _checkCorrectAnswersOnRender: function(){
        var current = 0;
        for(current in this.correct_answers){
            this.answers_group.items[this.correct_answers[current]].setChecked(true);
        }
    }
});


// TO DO
// add review.save to all changes
// onDeleteAnswer need to uncheck box

/**
 * @class BaseRadio
 * @description InteractiveObject (Question Type 5 Objective test Type)
 * Objective test type – enter text into textarea
 */
S.Class('S.widget.review.question.TextArea', {
    $extends: 'S.widget.review.question.Question',
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} contenteditable Permission to edit content
     * @property {string} textarea Text entered into teatarea
     * @property {Boolean} enable_hint Permission to enable hint
     * @property {Boolean} enable_view Permission to enable view of answer
     * @property {string} hint_text Text of hint
     * @property {string} correct_accordance
     */
    className: 'S-Review-QItem',
    contenteditable: 'false',
    textarea: null,
    enable_hint: false,
    enable_view: false,
    hint_text: 'hint text',
//    collected_data: null,
    correct_accordance: '',
    /**
     */
    init: function () {
        this.correct_accordance = this.correct_accordance || [];
        if (S.core.LS.exist()) {
            this.rendered();
        } else {
            this.$callParentMethod(arguments);
        }
    },
    /**
     */
    rendered: function(){
        this.$callParentMethod(arguments);
        this._addTextArea();
        this.root_el.setAttribute('position', 'absolute');
    },
    /**
     *
     */
    _addTextArea: function(){
        var _this = this;
        if (S.core.LS.exist()){
            this.textarea = S.New('S.component.form.InputTextArea');
        } else{
            this.textarea = S.New('S.component.form.InputTextArea', {
                className: 'S-InputTextArea1',//test
                guideText: 'Input the answer',
                innerHTML: '',
                render_to: this.answers_el,
                auto_render: true
            });
        }
    },
    /**
     * @public
     * @method onCheckAnswer
     * @description Checks answer
     */
    onCheckAnswer: function () {
        var mess;
        this.current_accordance = document.getElementById(this.textarea.text_input_id).innerHTML;
        if(this.correct_accordance === this.current_accordance){
            mess = "Correct";
            this.status = "clear";
        } else {
            mess = "Incorrect";
            this.status = "retry";
        }
        this.review.showTooltip(this.review.check_button.root_el, this.current_accordance ,mess);
        document.getElementsByClassName('S-tooltip-text')[0].className = 'S-tooltip-text-Answer';
        return this.status;
    },
    /**
     * @public
     * @method reset
     * @description reset answers
     */
    reset: function () {
        document.getElementById(this.textarea.text_input_id).innerHTML = '';
        this.current_accordance = '';
        this.status = "check";
    }
});

/**
 * @authors Alexandr Filippenko, Tamara Shcherbyna, Onenko Sergey
 * @class S.widget.review.question.TextAreaAuthor
 * @description Textarea Question realization (Author version)
 */
S.Class('S.widget.review.question.TextAreaAuthor', {
    $extends: 'S.widget.review.question.TextArea',
    /**
     */
    rendered: function () {
        this.$callParentMethod(arguments);
        this._makeContentEditable();
        this._addDOMListeners();
    },
    contenteditable: 'true',
    /**
     *
     */
    _makeContentEditable: function () {
        //this.question_caption_el.setAttribute("contenteditable", "true");
        this.question_text_el.setAttribute("contenteditable", "true");
        this.textarea.setEditable(false);
    },
    /**
     *
     */
    _addDOMListeners: function () {
        var _this = this;
        this.question_caption_el.addEventListener('keyup', function () {
            _this.question_caption = this.innerHTML;
        });
        this.question_text_el.addEventListener('keyup', function () {
            _this.question_text = this.innerHTML;
        });
        this.textarea.text_input_el.addEventListener('blur', function(event) {
            _this.correct_accordance = this.innerHTML
        });
    },
    /**
     *
     */
    setAnswerText: function (text) {
        if(typeof text === 'undefined'){
            return false;
        }
        this.answer_text = text;
    },
    /**
     *
     */
    getAnswerText: function () {
//        this.review._exchange(this.answer_text);
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerTextGet(this.answer_text);
        return this.answer_text;
    },
    /**
     * @public
     * @method getScriptData
     * @description Returns current script data
     */
    getScriptData: function () {
        var data = {
            correct_accordance: this.correct_accordance
        };
        S.addParams(data, this._getDataQ());
        return data;
    }
});

/**
 * @class TextInput
 * @description InteractiveObject (Question Type 10 Objective test Type)
 * Objective test type – input text into text input areas
 */
S.Class('S.widget.review.question.TextInput', {
    $extends: 'S.widget.review.question.Question',
    /**
     * @public
     * @property {string} className Main class name
     * @property {string} data ???
     * @property {string} collected_data ???
     * @property {string} answers_group ???
     * @property {string} correct_answers ???
     * @property {string} answers ???
     */

    className: 'S-Review-TextInput',
    data: null,
    collected_data: null,
    answers_group: null,
    answer_type: null,
    answers: [
        {
            pre_text:null,
            correct_answer:null,
            after_text:null
        }
    ],
    /**
     * Defaults value
     */
    _defaults: {
        answers: [],
        correct_answers: []
    },
    /**
     */
    rendered: function(){
        this.$callParentMethod(arguments);
        this._compileAnswers();
    },
    /**
     *
     */
    _compileAnswers: function(){
        if (!this.answers_group) {
            this.answers_group = S.New('S.component.form.TextInputGroup', {
                items: [],
                contenteditable: this.contenteditable,
                render_to: this.answers_el,
                auto_render: true
            });
        }

        if (this.answers) {
            for(var answer in this.answers){
                this.addAnswer(this.answers[answer]);
            }
        }
    },
    /**
     * @public
     * @method addAnswer
     * @memberOf S.widget.review.question.TextInput
     * @description add new answer in answers array and TextInputGroup
     * @param {object} {pre_text:"string", correct_answer:"string", after_text:"string"}
     */
    addAnswer: function(answer){
        if(answer){
            this.answers_group.addItem(answer).setClickEmulation();
            this.answers.push(answer);
        }
    },
    /**
     * @public
     * @method onCheckAnswer
     * @memberOf S.widget.review.question.TextInput
     * @description add new answer in answers array and TextInputGroup
     */
    onCheckAnswer: function(){
        if (!this.correct_answers || this.correct_answers.length === 0 ||!this.answers_group) {
            return false;
        }        
        var correct_answer, check_result = false, all_correct = true;
        if (this.view === "10-3") {            
            all_correct = this.answers_group.items[0].checkAnswer(this.correct_answers);           
        } else {
            for (var i = 0; i < this.correct_answers.length; i++) {
                correct_answer = this.correct_answers[i];
                check_result = this.answers_group.items[i].checkAnswer(correct_answer);            
                if (!check_result) {
                    all_correct = false;                    
                }
            }            
        }
        this.review._answered_count++;      
        if (all_correct) {
            this.review._true_count++;
            this.status = "clear";
        }
        else {
            this.status = "retry";
        }
        return this.status;
    },
    /**
    *
    */
    reset: function() {
       this.answers_group.setAvailable(true);
       this.answers_group.reset();
       this.status = "check";
    },
    /**
     *
     */
    _setStoreData: function () {
        return {
            self: {
                id: this.id,
                current_accordance: this.current_accordance
            },
            elements: S.core.DOM.getElementsIds(this)
        };
    }
});





/**
 * @class BaseRadioAuthor
 * @description InteractiveObject (Question Type 10 Objective test Type), Author side
 * Objective test type – input text into text input areas, Author side
 */
S.Class('S.widget.review.question.TextInputAuthor', {
    $extends: 'S.widget.review.question.TextInput',
    /**
     * @public
     * @property {string} contenteditable Permission to edit content
     */
    contenteditable: 'true',
    /**
     */
    rendered: function () {
        this.$callParentMethod(arguments);
        this._init();
    },
    /**
     */
    _init: function () {
        this._addAnswersListeners();
        this._showActiveAnswer();
    },
    addAnswer: function(answer){
        if(answer){
            this.answers_group.addItem(answer);
            this.answers.push(answer);
            this._showActiveAnswer();
            /* callback fot AuthoringTool */
            window["callback_" + this.question_id] && window["callback_" + this.dom_id].onAnswerAdd(answer);
        }
    },
    _registerClickEmulation: function(){

    },
    /**
     * @public
     * @method removeAnswer
     * @description  remove one or more answer from quiz
     * @param {integer} index_of_answer - Index of answer which remove, start from 0
     */
    removeAnswer: function (index) {
        if(index || index === 0) {
            this.answers_group.items[index].destroy();
            this.answers_group.items.splice(index, 1);
            this.answers_group._refreshNumber();
            /* callback fot AuthoringTool */
            window["callback_" + this.question_id] && window["callback_" + this.dom_id].onAnswerRemove(index);
        }
    },
    /**
     *
     */
    setAnswerPreText: function (i, label) {
        if (!this.answers.length || !this.answers_group.items) {
            return
        }
        this.answers_group.items[i].setPreText(label);
        this.answers[i].pre_text = label;
    },
    /**
     *
     */
    getAnswerPreText: function (i) {
        if(this.answers){
            /* callback fot AuthoringTool */
            window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerPreTextGet(this.answers[i].pre_text);
            return this.answers[i].pre_text;
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerPreTextGet(false);
        return false
    },
    /**
     *
     */
    setCorrectAnswer: function (i, label) {
        if (!this.answers.length || !this.answers_group.items) {
            return
        }
        this.answers_group.items[i].setCorrectAnswer(label);
        this.answers[i].input_value = label;
    },
    /**
     *
     */
    getCorrectAnswer: function (i) {
        if(this.answers){
            /* callback fot AuthoringTool */
            window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerInputValueGet(this.answers[i].input_value);
            return this.answers[i].input_value;
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerInputValueGet(false);
        return false
    },
    /**
     *
     */
    setAnswerAfterText: function (i, label) {
        if (!this.answers.length || !this.answers_group.items) {
            return
        }
        this.answers_group.items[i].setAfterText(label);
        this.answers[i].after_text = label;
    },
    /**
     *
     */
    getAnswerAfterText: function (i) {
        if(this.answers){
            /* callback fot AuthoringTool */
            window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerAfterTextGet(this.answers[i].after_text);
            return this.answers[i].after_text;
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onAnswerAfterTextGet(false);
        return false
    },
    /**
     *
     */
    _addAnswersListeners: function () {
        var _this = this,
            answers = (this.answers_group && this.answers_group.items) ? this.answers_group.items : null,
            data_answers = this.answers;
        if (!answers) {
            return false;
        }
        if (this.view !== "10-3") {
            answers.forEach(function(answer, i) {
                _this.answers_group.items[i].pre_text_el.onkeyup = function () {
                    _this.answers_group.items[i].pre_text = this.innerHTML;
                    data_answers[i].pre_text = this.innerHTML;
                    _this.review.save();
                };
            });
            answers.forEach(function(answer, i) {
                _this.answers_group.items[i].input_value_el.onkeyup = function () {
                    _this.answers_group.items[i].correct_answer = this.innerHTML;
                    data_answers[i].correct_answer = this.innerHTML;
                    _this.correct_answer = this.innerHTML;
                    _this.review.save();
                };
            });
            answers.forEach(function(answer, i) {
                _this.answers_group.items[i].after_text_el.onkeyup = function () {
                    _this.answers_group.items[i].after_text = this.innerHTML;
                    data_answers[i].after_text = this.innerHTML;
                    _this.review.save();
                };
            });
        }
    },
    /**
     *
     * @param i
     */
    _addListenerToSpecifiedAnswer: function (i) {
        if (typeof i === 'undefined' || !this.answers_group || !this.answers_group.items || this.answers_group.items.length === 0 || !this.answers_group.items[i] || !this.answers_group.items[i].label_el) {
            console.log('HERE CAN BE AN ERROR IN FUTURE, Please try to edit just added answer from screen and save it. than try to launch');
            return false;
        }
        var _this = this;
        this.answers_group.items[i].pre_text_el.onkeyup = function () {
            _this.answers_group.items[i].pre_text = this.innerHTML;
            _this.answers[i] = this.innerHTML;
            _this.review.save();
        };
    },
    /**
     *
     */
    _showActiveAnswer: function () {
        for (var i = 0; i < this.answers_group.items.length; i++) {
            if (this.answers_group.items[i].correct_answer) {
                this.answers_group.items[i].input_value_el.innerHTML = this.answers_group.items[i].correct_answer;

            }
        }
    },
    /**
     * @public
     * @method getScriptData
     * @description Returns current script data
     */
    getScriptData: function () {
        var data = {
            answers: this.answers
        };
        S.addParams(data, this._getDataQ());
        return data;
    }
});
S.Class('S.widget.review.question.TextImageBindLine', {
    $extends: 'S.widget.review.question.Question',
    _question_elements: [
        'answers_number',
        'answers_left',
        'answers_center',
        'answers_right'
    ],
    _question_tpl: [
        '<div class="{className}-Answers-Number" id="{answers_number_id}">{_answers_number_HTML}</div>',
        '<div class="{className}-Answers-Left" id="{answers_left_id}">{_answers_left_HTML}</div>',
        '<div class="{className}-Answers-Center" id="{answers_center_id}">{_answers_center_HTML}</div>',
        '<div class="{className}-Answers-Right" id="{answers_right_id}">{_answers_right_HTML}</div>'
    ],
    _text_container: [
        '<div class="{className}-Answer-Text" contenteditable="false" ></div>'
    ],
    _image_container: [
        '<div class="{className}-Answer-Image"></div>'
    ],
    _answers_number_item_container: [
        '<div class="{className}-Answer-Num"></div>'
    ],
    _answers_left_item_container: [],
    _answers_right_item_container: [],
    _answers_center_item_container: [
        '<div class="{className}-Answer-Dot-L"></div>',
        '<div class="{className}-Answer-Dot-R"></div>'
    ],
    /**
     * @protected
     */
    _answers_number_HTML: '',
    _answers_left_HTML: '',
    _answers_right_HTML: '',
    _answers_center_HTML:'',
    _state:{
        enable: false,
        adds: false,
        tap: false
    },
    _group:{
        element1: null,
        element2: null,
        center: null,
        line: null
    },
    _options: null,
    _responses: null,
    _defaults: {
        correct_accordance: []
    },
    /**
     * @public
     */
    className: 'S-Review-TextImageBindLine',
    answers_group: null,
    options: null,
    responses: null,
    correct_accordance: null,
    current_accordance: null,
    answer_type: null,
    /**
     */
    init: function () {
        this._restorePrototypes();
        this._compileAnswers();
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this.answer_type = this.answer_type || 'Text';
        this.answers_el.setAttribute('orient', 'horizontal');
        this._initConfig();
        this._initAnswers();
        this._initEventsMove();
        this._initContentEditable();
        this.$callParentMethod(arguments);
    },
    /**
     * @protected
     * @method _restorePrototypes
     */
    _restorePrototypes: function () {
        this.options = this.options || {type: 'text',data: []};
        this.responses = this.responses || {type: 'text',data: []};
        this.responses_count = this.options.data.length;
        if (this.responses_count !== 0 && !this.correct_accordance.length) {
            for (var i = 0; i < this.responses_count; i++) {
                this.correct_accordance[i] = i;
            }
        } else {
            this.current_accordance = [ null, null, null, null ];
        }
    },
    /*
     * @protected
     * @method _compileAnswers
     */
    _compileAnswers: function () {
        var number_str, left_str, center_str, right_str;
        if (this.responses.type === 'text') {
            this._answers_right_item_container = this._text_container;
        } else {
            this._answers_right_item_container = this._image_container;
        }
        if (this.options.type === 'text') {
            this._answers_left_item_container = this._text_container;
        } else {
            this._answers_left_item_container = this._image_container;
        }
        number_str = this._answers_number_item_container.join('');
        left_str = this._answers_left_item_container.join('');
        center_str = this._answers_center_item_container.join('');
        right_str = this._answers_right_item_container.join('');

        this._compiled_container_number_HTML = number_str = S.core.template.compile(number_str, this, true);
        this._compiled_container_left_HTML = left_str = S.core.template.compile(left_str, this, true);
        this._compiled_container_center_HTML = center_str = S.core.template.compile(center_str, this, true);
        this._compiled_container_right_HTML = right_str = S.core.template.compile(right_str, this, true);

        this._answers_number_HTML = S.core.template.compileArray(number_str, this.correct_accordance, true);
        this._answers_left_HTML = S.core.template.compileArray(left_str, this.correct_accordance, true);
        this._answers_center_HTML = S.core.template.compileArray(center_str, this.correct_accordance, true);
        this._answers_right_HTML = S.core.template.compileArray(right_str, this.correct_accordance, true);
    },
    /**
     * @protected
     * @method _initAnswers
     * @description Initializes base question and response elements
     */
    _initConfig: function () {
        var _this = this,
            num = 0,
            i;
        for(i = 0; i < _this.correct_accordance.length; i++) {
            this.answers_number_el.childNodes[i].id = 'num'+i;
            this.answers_number_el.childNodes[i].style.top = (i*20)+8+ '%';
            this.answers_left_el.childNodes[i].style.top = i*20+'%';
            this.answers_right_el.childNodes[i].style.top = i*20+'%';
            this.answers_center_el.childNodes[num].id = 'left'+i;
            this.answers_center_el.childNodes[num].style.top = (i*20)+13 + '%';
            this.answers_center_el.childNodes[num+1].id = 'right'+i;
            this.answers_center_el.childNodes[num+1].style.top = (i*20)+13 + '%';
            num+=2;
        }
        window.setTimeout(function () {
            this._options_numbers = this.root_el.getElementsByClassName('S-Review-TextImageBindLine-Answer-Num-Text');
        }.bind(this), 0);
    },
    /**
     * @protected
     * @method _initAnswers
     * @description Initializes base question and response elements
     */
    _initAnswers: function (count) {
        if (count === undefined) {
            for (var i = 0; i <  this.correct_accordance.length; i++) {
                this._addQuestionFromData(i);
            }
        } else {
            this._addQuestionFromData(count);
            this.current_accordance[count] = null;
        }
    },
    /**
     * @protected
     * @method _addAttributeToAnswer
     * @description Adds to option correct answer attribute
     * @param {Number} id Id number in data array to be added
     */
    _addAttributeToAnswer: function (id) {
        this.answers_left_el.childNodes[id].setAttribute('answer',this.correct_accordance[id]);
    },
    /**
     * @protected
     * @method _addQuestionFromData
     * @description Adds question and response from existing data
     * @param {Number} id Id number in data Array to be added
     */
    _addQuestionFromData: function (id) {
        var num;
        if (this.answers_number_el.childNodes[id].childNodes.length === 0) {
            num = document.createElement('div');
            num.className = this.className + '-Answer-Num-Text';
            num.innerHTML = id + 1 + '.';
            this.answers_number_el.childNodes[id].appendChild(num);
        }
        if (this.options.type === 'image') {
            this.answers_left_el.childNodes[id].style.backgroundImage = 'url('+this.options.data[id]+')';
        } else {
            this.answers_left_el.childNodes[id].innerHTML = this.options.data[id];
        }
        if (this.responses.type === 'image') {
            this.answers_right_el.childNodes[id].style.backgroundImage = 'url('+this.responses.data[id]+')';
        } else {
            this.answers_right_el.childNodes[id].innerHTML = this.responses.data[id];
        }
        this._addAttributeToAnswer(id);
    },
    /**
     * @protected
     * @method _addQuestion
     * @description Adds new option and proper response
     */
    _addQuestion: function (input_questions) {
        var i,left,right,
            start_amount = this.correct_accordance.length;
        for (i = 0; i < input_questions.length; i++) {
            var new_container_number = document.createElement('div'),
                new_container_left = document.createElement('div'),
                new_container_center = document.createElement('div'),
                new_container_right = document.createElement('div');

            new_container_number.innerHTML = this._compiled_container_number_HTML;
            new_container_left.innerHTML = this._compiled_container_left_HTML;
            new_container_center.innerHTML = this._compiled_container_center_HTML;
            new_container_right.innerHTML = this._compiled_container_right_HTML;

            this.answers_number_el.appendChild(new_container_number.childNodes[0]);
            this.answers_left_el.appendChild(new_container_left.childNodes[0]);
            this.answers_center_el.appendChild(new_container_center.childNodes[0]);
            this.answers_center_el.appendChild(new_container_center.childNodes[0]);
            this.answers_right_el.appendChild(new_container_right.childNodes[0]);

            this.options.data.push(input_questions[i].option);
            this.responses.data.push(input_questions[i].response);
            this.correct_accordance.push(this.correct_accordance.length);
        }
        this._initConfig();
        for (i = 0; i < input_questions.length; i++) {
            this._initAnswers(start_amount + i);
            left = 'left'+(start_amount+i);
            right = 'right'+(start_amount+i);
            this._addAction(document.getElementById(left));
            this._addAction(document.getElementById(right));
        }
    },
    /**
     * @protected
     * @method _initEventsMove
     * @description add to dots eventListeners of move
     */
    _initEventsMove: function () {
        var elem = null,
            i = 0;
        for(; i < this.answers_center_el.childNodes.length;i++) {
            elem = this.answers_center_el.childNodes[i];
            this._addAction(elem);
        }
    },
    /**
     * @function getOffset
     * @description Gets general element's offset
     * @param {object} el Element to calculate
     * @param {string} type Offset type ('Left'/'Top')
     * @return {Number} General offset
     */
    _getOffset: function (el, type) {
        var offsetType = 'offset' + type;
        return el[offsetType] + (el.parentNode[offsetType] === undefined ? 0 : this._getOffset(el.parentNode, type));
    },
    /**
     * @protected
     * @method _addAction
     * @description add action on event
     * @param {string} current element
     */
    _addAction: function (elem) {
        var _this = this;
        if (elem.hasAction) {
            return true;
        }
        function touchStart (e) {
            var start_pos = {
                x: e.pageX,
                y: e.pageY
            };
            if (_this._state.tap) {
                start_pos.x += -_this._getOffset(_this._group.element1.parentNode, 'Left');
                start_pos.y += -_this._getOffset(_this._group.element1.parentNode, 'Top');
                _this._state.tap = false;
                _this._group.element1.setAttribute('state', 'pressed');
                _this._group.element2.setAttribute('state', 'pressed');
                _this._move(start_pos);
            } else {
                _this._state.tap = true;
                _this._state.enable = false;
                _this._state.adds = false;
                for(var i in _this._group) {
                    _this._group[i] = null;
                }
                _this._initMove(e);
                _this._group.element2.setAttribute('state', 'pressed');
            }
            function touchMove (e) {
                var curr_pos = {
                    x: e.pageX - _this._getOffset(_this._group.element1.parentNode, 'Left'),
                    y: e.pageY - _this._getOffset(_this._group.element1.parentNode, 'Top')
                };
                _this._state.tap = false;
                if (_this._state.enable) {
                    _this._group.element1.setAttribute('state', 'pressed');
                    _this._move(curr_pos);
                }
            }
            function touchEnd () {
                if (_this._state.enable && !_this._state.tap) {
                    _this._endOfMove();
                    if (_this._state.adds) {
                        _this._addAction(_this._group.element1);
                        _this._addAction(_this._group.element2);
                        _this._group.element1.setAttribute('state', 'on');
                        _this._group.element2.setAttribute('state', 'on');
                    } else {
                        _this.answers_center_el.removeChild(_this._group.element1);
                        _this.answers_center_el.removeChild(_this._group.element2);
                        _this.answers_center_el.removeChild(_this._group.line);
                    }
                    _this._state.enable = false;
                    _this._state.adds = false;
                    for(var i in _this._group) {
                        _this._group[i] = null;
                    }
                } else if (_this._state.tap) {
                    _this._addAction(_this._group.element1);
                    _this._addAction(_this._group.element2);
                }
                document.body.removeEventListener('mousemove', touchMove);
                document.body.removeEventListener('mouseup', touchEnd);
            }
            document.body.addEventListener('mousemove', touchMove);
            document.body.addEventListener('mouseup', touchEnd);
        }
        elem.addEventListener('mousedown', touchStart);
        elem.hasAction = true;
    },
    /**
     * @protected
     * @method _initMove
     * @description initicialize object to move
     * @param {string} target element
     */
    _initMove: function (e) {
        var _this = this,
            elem1,elem2,line,
            num = e.target.id.replace(/[a-zA-Z]+/,'');
        line = document.getElementById('line'+num);
        //change line position
        if (e.target.id.indexOf('dndot')!==-1) {
            if (e.target.id.indexOf('L')!==-1) {
                elem2 = document.getElementById('dndotR'+num);
            } else {
                elem2 = document.getElementById('dndotL'+num);
            }
            line = document.getElementById('line'+num);
            _this._state.enable = true;
            _this._group.element1 = e.target;
            _this._group.element2 = elem2;
            _this._group.center = elem2;
            _this._group.line = line;
        } else {
            line = document.createElement('div');
            elem1 = document.createElement('div');
            elem2 = document.createElement('div');

            if (e.target.id.replace(/[0-9]+/,'')==='left') {
                line.className = _this.className+"-line";
                line.id = 'line'+num;
                line.style.height = "1px";
                line.style.webkitTransformOrigin = "center "+(1)+"px";
                line.style.left = (e.target.offsetLeft + e.target.offsetWidth/2)  + 'px';
                line.style.top = (e.target.offsetTop + e.target.offsetHeight/2)  + 'px';
                _this.answers_center_el.appendChild(line);

                elem1.className = e.target.className;
                elem1.id = 'dndotL'+num;
                elem1.style.top = e.target.offsetTop+'px';
                elem1.style.webkitTransformOrigin = "center";
                _this.answers_center_el.appendChild(elem1);

                for(var i = 0; i < _this.current_accordance.length; i++) {
                    if (_this.current_accordance[i] === num) {
                        elem2.setAttribute('state', 'on');
                    }
                }
                elem2.className = _this.className+'-Answer-Dot-R';
                elem2.id = 'dndotR'+num;
                elem2.style.top = e.target.offsetTop+'px';
                elem2.style.webkitTransformOrigin = "center";
                _this.answers_center_el.appendChild(elem2);
            } else {
                line.className = _this.className+"-line";
                line.id = 'line'+num;
                line.style.height = "1px";
                line.style.webkitTransformOrigin = "center "+(1)+"px";
                line.style.left = (e.target.offsetLeft + e.target.offsetWidth/2)  + 'px';
                line.style.top = (e.target.offsetTop + e.target.offsetHeight/2)  + 'px';
                _this.answers_center_el.appendChild(line);

                elem1.className = e.target.className;
                elem1.id = 'dndotR'+num;
                elem1.style.top = e.target.offsetTop+'px';
                elem1.style.webkitTransformOrigin = "center";
                _this.answers_center_el.appendChild(elem1);

                if (_this.current_accordance[num] !== null) {
                    elem2.setAttribute('state', 'on');
                }
                elem2.className = _this.className+'-Answer-Dot-L';
                elem2.id = 'dndotL'+num;
                elem2.style.top = e.target.offsetTop+'px';
                elem2.style.webkitTransformOrigin = "center";
                _this.answers_center_el.appendChild(elem2);
            }
            _this._state.enable = true;
            _this._group.element1 = elem2;
            _this._group.element2 = elem1;
            _this._group.center = e.target;
            _this._group.line = line;
        }
    },
    /**
     * @protected
     * @method _move
     * @description move line to current dot
     * @param {Number} pos new position Y
     */
    _move: function (pos) {
        var _this = this,
            angleR,angleG,cos,
            rotateX = parseFloat(_this._group.center.offsetLeft)+parseFloat(_this._group.center.offsetWidth)/2,
            rotateY = parseFloat(_this._group.center.offsetTop)+parseFloat(_this._group.center.offsetHeight)/2;
        _this._group.element1.style.left = pos.x-parseFloat(_this._group.element1.offsetWidth)/2+  "px";
        _this._group.element1.style.top = pos.y-parseFloat(_this._group.element1.offsetHeight)/2+ "px";
        _this._group.line.style.height = parseFloat(Math.sqrt(Math.pow(pos.x - rotateX,2)
            + Math.pow(pos.y - rotateY, 2))) + "px";
        cos = (pos.x - rotateX) / parseFloat(_this._group.line.style.height);
        console.log(cos);
        if (rotateX < pos.x && rotateY > pos.y) {
//            QUARTER = "1";
            angleR = cos < 0 ? Math.acos(cos) : Math.PI- Math.acos(cos);
            angleG = angleR*(180/Math.PI)+90;
            console.log('////////////quarter 1         ', angleG);
        } else if (rotateX > pos.x && rotateY > pos.y) {
//            QUARTER = "2";
            angleR = cos < 0 ? Math.acos(-cos) : Math.PI- Math.acos(cos);
            angleG = angleR*(180/Math.PI)+90;
            console.log('/////////////quarter 2         ', angleG);
        } else if (rotateX > pos.x && rotateY < pos.y) {
//            QUARTER = "3";
            angleR = cos < 0 ? Math.acos(cos) : Math.PI -Math.acos(cos);
            angleG = angleR*(180/Math.PI)-90;
            console.log('/////////////quarter 3         ', angleG);
        } else if (rotateX < pos.x && rotateY < pos.y) {
//            QUARTER = "4";
            angleR = cos < 0 ? Math.acos(cos) : Math.PI + Math.acos(cos);
            angleG = angleR*(180/Math.PI)+90;
            console.log('///////////////quarter 4         ', angleG);
        }
        if ((_this._group.line.offsetLeft + _this._group.center.offsetWidth/2) !== _this._group.center.offsetLeft && _this._group.line.offsetTop+_this._group.center.offsetHeight/2 !== _this._group.center.offsetTop) {
            _this._group.line.style.left = (_this._group.center.offsetLeft + _this._group.center.offsetWidth/2)  + 'px';
            _this._group.line.style.top = (_this._group.center.offsetTop + _this._group.center.offsetHeight/2)  + 'px';
            console.log('here', _this._group.center);
        }
        _this._group.line.style.webkitTransform = "rotate("+angleG+"deg)";
    },
    /**
     * @protected
     * @method _endOfMove
     * @description init finished position of current move
     */
    _endOfMove: function () {
        var _this = this,
            num = _this._group.element1.id.replace(/[a-zA-Z]+/,''),
            old = _this.current_accordance[num],
            cur_pos = {
                x:0,
                y:0
            },
            cur_posX = _this._group.element1.offsetLeft,
            cur_posY = _this._group.element1.offsetTop,
            cur_class = '',
            cur_name = '',
            avalide = [];

        if (_this._group.center.id.replace(/[0-9]+/,'').indexOf('dndot')!==-1) {
            _this.current_accordance[num]= null;
        }
        if (_this._group.element1.className.substr(_this._group.element1.className.length-1) === 'L') {
            cur_class = _this.className+'-Answer-Dot-L';
            cur_name = 'left';
        } else {
            cur_class = _this.className+'-Answer-Dot-R';
            cur_name = 'right';
        }
        avalide = document.getElementsByClassName(cur_class);
        for(var i = 0;i < avalide.length;i++) {
            if (avalide[i].id.replace(/[0-9]+/,'').indexOf(cur_name)!==-1) {
                if (cur_posX > avalide[i].offsetLeft - 20 && cur_posX < avalide[i].offsetLeft + 20 && cur_posY > avalide[i].offsetTop - 20 && cur_posY < avalide[i].offsetTop + 20) {
                    _this._state.adds = true;
                    if (cur_name === 'right') {
                        for(var cur in _this.current_accordance) {
                            if (_this.current_accordance[cur]===parseInt(avalide[i].id.replace(/[a-zA-Z]+/,''))) {
                                _this._state.adds = false;
                            }
                        }
                    } else {
                        if (_this.current_accordance[parseInt(avalide[i].id.replace(/[a-zA-Z]+/,''))]!==null) {
                            _this._state.adds = false;
                        }
                    }
                    if (_this._state.adds) {
                        cur_pos.x = avalide[i].offsetLeft+avalide[i].offsetWidth/2;
                        cur_pos.y = avalide[i].offsetTop+avalide[i].offsetHeight/2;
                        _this._move(cur_pos);

                        if (avalide[i].id.replace(/[0-9]+/,'') === 'left') {
                            _this._group.line.id = 'line' + avalide[i].id.replace(/[a-zA-Z]+/,'');
                            _this._group.element2.id = 'dndotR' + avalide[i].id.replace(/[a-zA-Z]+/,'');
                            _this._group.element1.id = 'dndotL' + avalide[i].id.replace(/[a-zA-Z]+/,'');
                            if (_this._group.center.id.replace(/[0-9]+/,'').indexOf('dndot') !== -1) {
                                _this.current_accordance[ parseInt(_this._group.element1.id.replace(/[a-zA-Z]+/,''))] = old;
                            } else {
                                _this.current_accordance[ parseInt(_this._group.element1.id.replace(/[a-zA-Z]+/,''))] = parseInt(_this._group.center.id.replace(/[a-zA-Z]+/,''));
                            }
                            if (parseInt(_this._group.element1.id.replace(/[a-zA-Z]+/,'')) === _this.current_accordance[ parseInt(_this._group.element1.id.replace(/[a-zA-Z]+/,''))]) {
                                this._group.line.style.webkitTransform = "rotate("+90+"deg)";
                            }
                        } else {
                            _this.current_accordance[ parseInt(_this._group.element1.id.replace(/[a-zA-Z]+/,''))] = parseInt(avalide[i].id.replace(/[a-zA-Z]+/,''));
                            if (avalide[i].id.replace(/[a-zA-Z]+/,'') === _this._group.center.id.replace(/[a-zA-Z]+/,'')) {
                                _this._group.line.style.webkitTransform = "rotate("+270+"deg)";
                            }
                        }
                        _this._state.adds = true;
                    }
                    break;
                }
            }
        }
    },
    /**
     * @public
     * @method reset
     * @description reset answers
     */
    reset: function () {
        var el1, el2, el3,
            i = 0;
        for(; i < this.current_accordance.length; i++) {
            this.answers_number_el.childNodes[i].style.backgroundImage  = '';
            if (this.current_accordance[i]!== null) {
                el1 = document.getElementById('line' + i);
                el2 = document.getElementById('dndotL' + i);
                el3 = document.getElementById('dndotR' + i);
                this.answers_center_el.removeChild(el1);
                this.answers_center_el.removeChild(el2);
                this.answers_center_el.removeChild(el3);
                this.current_accordance[i] = null;
            }
        }
        this.status = "check";
    },
    /*
     *
     */
    checkAnswer: function () {
        for (var i = 0; i < this.correct_accordance.length; i++) {
            if (this.correct_accordance[i] !== this.current_accordance[i]) {
                return false;
            }
        }
        return true;
    },
    /**
     * @public
     * @method onCheckAnswer
     * @description Checks answer
     */
    onCheckAnswer: function () {
        var _this = this;
        for (var j = 0; j < this.correct_accordance.length; j++) {
            if (this.correct_accordance[j] !== this.current_accordance[j]) {
                _this.answers_number_el.childNodes[j].style.backgroundImage = 'url("../../css/images/review_images/X_btn.png")';
            } else {
                _this.answers_number_el.childNodes[j].style.backgroundImage = 'url("../../css/images/review_images/o_btn.png")';
            }
        }
        for (var i = 0; i < this.correct_accordance.length; i++) {
            if (this.correct_accordance[i] !== this.current_accordance[i]) {
                break;
            }
        }
        return this.status = i === this.correct_accordance.length ? 'clear' : 'retry';
    }
});
S.Class('S.widget.review.question.TextImageBindLineAuthor', {
    $extends: 'S.widget.review.question.TextImageBindLine',
    /**
     */
    _addQuestionFromData: function (id) {
        this.$callParentMethod(arguments);
        if (this.options.type === 'image') {
            this.answers_left_el.childNodes[id].onclick = function () {
                window["callback_" + this.question_id] && window["callback_" +  this.question_id].onOptionImageSet(id);
            };
        }
        if (this.responses.type === 'image') {
            this.answers_right_el.childNodes[id].onclick = function () {
                window["callback_" + this.question_id] && window["callback_" +  this.question_id].onResponseImageSet(id);
            };
        }
    },
    /**
     * @protected
     * @method _restoreAnswerNumbers
     */
    _restoreAnswerNumbers: function () {
        var i = 0;
        this._options_numbers = this.root_el.getElementsByClassName('S-Review-TextImageBindLine-Answer-Num-Text');
        for (; i < this.correct_accordance.length; i++) {
            this._options_numbers[i].innerHTML = i + 1 + '.';
        }
    },
    /**
     * @protected
     * @method _endOfMove
     * @description init finished position of current move
     */
    _endOfMove: function () {
        this.$callParentMethod(arguments);
        this.correct_accordance = this.current_accordance.slice();
    },
    //////////////////////////////////////////////////////
    ///////////////// C #  H A N D L E R S ///////////////
    //////////////////////////////////////////////////////
    /**
     * @public
     * @method addQuestion
     * @description Adds questions
     * @param {Array} input_questions New question Array
     */
    addCouple: function (input_questions) {
        this._addQuestion(input_questions);
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onCoupleAdd();
    },
    /**
     * @public
     * @method removeQuestion
     * @description Removes option and proper response
     * @param {Number} id Id number of option to be removed (with proper response according to correct_accordance Array)
     */
    removeCouple: function (id) {
        this.reset();
        var proper_response_id = this.correct_accordance[id],
            i, el1, el2, el3;
        // Data removing
        this.options.data.splice(id, 1);
        this.responses.data.splice(this.correct_accordance[id], 1);
        this.correct_accordance.splice(id, 1);
        this.current_accordance.splice(id, 1);
        // Removing last element
        el1 = this.root_el.getElementsByClassName('S-Review-TextImageBindLine-line')[id];
        el2 = this.root_el.getElementsByClassName('S-Review-TextImageBindLine-Answer-Dot-L')[id];
        el3 = this.root_el.getElementsByClassName('S-Review-TextImageBindLine-Answer-Dot-R')[id];
        this.answers_number_el.removeChild(this.answers_number_el.childNodes[id]);
        this.answers_left_el.removeChild(this.answers_left_el.childNodes[id]);
        this.answers_right_el.removeChild(this.answers_right_el.childNodes[id]);
        if (el1 !== undefined) {
            this.answers_center_el.removeChild(el1);
        }
        this.answers_center_el.removeChild(el2);
        this.answers_center_el.removeChild(el3);
        for (i = proper_response_id; i < this.correct_accordance.length; i++) {
            this.correct_accordance[i]--;
        }
        this._initConfig();
        this._restoreAnswerNumbers();
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onCoupleRemove();
    },
    /**
     * @public
     * @method setOptionText
     * @description Sets option text to desired
     * @param {Number} id Option's id
     * @param {string} text Desired option's text
     */
    setOption: function (id, text) {
        this.options.data[id] = text;
        if (this.options.type === 'text') {
            this.answers_left_el.childNodes[id].innerHTML = text;
        } else {
            this.answers_left_el.childNodes[id].style.backgroundImage = 'url(' + text + ')';
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onOptionSet();
    },
    /**
     * @public
     * @method getOptionText
     * @description Returns option text
     * @param {Number} id Option's id
     */
    getOption: function (id) {
        return this.options.data[id];
    },
    /**
     * @public
     * @method setResponseText
     * @description Sets response text to desired
     * @param {Number} id Response's id
     * @param {string} text Desired response's text
     */
    setResponse: function (id, text) {
        this.responses.data[id] = text;
        if (this.responses.type === 'text') {
            this.answers_right_el.childNodes[id].innerHTML = text;
        } else {
            this.answers_right_el.childNodes[id].style.backgroundImage = 'url(' + text + ')';
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onResponseSet();
    },
    /**
     * @public
     * @method getResponseText
     * @description Returns response text
     * @param {Number} id Response's id
     */
    getResponse: function (id) {
        return this.responses.data[id];
    },
    /**
     * @public
     * @method setCorrectAccordance
     * @description Sets correct accordance between options -- responses
     * @param {Array} new_accordance Desired accordance
     */
    setCorrectAccordance: function (new_accordance) {
        for (var i = 0; i < this.options.data.length; i++) {
            this.correct_accordance[i] = new_accordance[i];
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onCorrectAccordanceSet();
    },
    /**
     * @public
     * @method getCorrectAccordance
     * @description Gets correct accordance between options -- responses
     */
    getCorrectAccordance: function () {
        return this.correct_accordance;
    },
    /**
     * @public
     * @method setOptionsType
     * @description Sets options type
     */
    setOptionsType: function (type) {
        this.options.type = type;
        this._compileAnswers();
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onOptionsTypeSet();
    },
    /**
     * @public
     * @method setResponsesType
     * @description Sets responses type
     */
    setResponsesType: function (type) {
        this.responses.type = type;
        this._compileAnswers();
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onResponsesTypeSet();
    },
    /**
     * @public
     * @method switchQuestions
     * @description Switches questions
     * @param {Number} from_pos Pos of first option to be switched
     * @param {Number} to_pos Pos of second option to be switched
     */
    switchOptions: function (from_pos, to_pos) {
        var buff;
        // Data switching
        buff = this.options.data[from_pos];
        this.options.data[from_pos] = this.options.data[to_pos];
        this.options.data[to_pos] = buff;
        buff = this.correct_accordance[from_pos];
        this.correct_accordance[from_pos] = this.correct_accordance[to_pos];
        this.correct_accordance[to_pos] = buff;
        this.rendered();
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onOptionsSwitch();
    },
    /**
     * @public
     * @method switchResponses
     * @description Switches responses
     * @param {Number} from_pos Pos of first response to be switched
     * @param {Number} to_pos Pos of second response to be switched
     */
    switchResponses: function (from_pos, to_pos) {
        var buff;
        // Data switching
        buff = this.responses.data[from_pos];
        this.responses.data[from_pos] = this.responses.data[to_pos];
        this.responses.data[to_pos] = buff;
        buff = this.correct_accordance[from_pos];
        this.correct_accordance[from_pos] = this.correct_accordance[to_pos];
        this.correct_accordance[to_pos] = buff;
        this.rendered();
        /* callback fot AuthoringTool */
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onResponsesSwitch();
    },
    /**
     * @public
     * @method getScriptData
     * @description Returns current script data
     */
    getScriptData: function () {
        var data = {
            options: this.options,
            responses: this.responses,
            correct_accordance: this.correct_accordance
        };
        S.addParams(data, this._getDataQ());
        return data;
    },
    /**
     * @public
     * @method getAnswerCount
     * @description getAnswerCount
     */
    getAnswerCount: function(){
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onAnswerCountGet(this.responses.data.length);
        return this.responses.data.length
    }
});
S.Class('S.widget.review.question.BindLine', {
    $extends: 'S.widget.review.question.Question',
    _question_elements: [
        'panel'
    ],
    _question_tpl: [
        '<div class="{className}" id="{panel_id}">',
        '{_elements_compiled}',
        '</div>'
    ],
    _defaults: {
    },
    /**
     * @protected
     */
    _element_tpl: [
        '<div class="{className}-Element-Container">',
             '<div class="{className}-Number"></div>',
             '<div class="{className}-DescL {className}-Desc"> </div>',
             '<div class="{className}-DotL {className}-Dot"></div>',
             '<div class="{className}-DotR {className}-Dot"></div>',
             '<div class="{className}-DescR {className}-Desc"></div>',
        '</div>'
    ],
    _elements_compiled: '',
    /**
     * @public
     */
    className: 'S-Review-BindLine',
    count: null,
    elements: null,
    accordance: [],
    answer_type: this.answer_type || 'TextImage',
    /**
     */
    init: function () {
        this._compileAnswers();
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this._initConfig();
        this._initAnswers();
        this._addFunctional();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _compileAnswers: function () {
        var i;
        this.count = Math.min(this.options.data.length, this.responses.data.length);
        for (i = 0; i < this.count; i++) {
            this._elements_compiled += this._element_tpl.join('');
        }
    },
    _initType: function () {
        switch (this.answer_type) {
            case 'TextImage':
                this.options.type = 'text';
                this.responses.type = 'image';
                break;
            case 'TextText':
                this.options.type = 'text';
                this.responses.type = 'text';
                break;
            case 'ImageText':
                this.options.type = 'image';
                this.responses.type = 'text';
                break;
            case 'ImageImage':
                this.options.type = 'image';
                this.responses.type = 'image';
                break;
            default:
        }
    },
    /**
     */
    _initConfig: function () {
        var i;
        this._initType();
        this.elements = {
            containers: [],
            numbers: [],
            left_descs: [],
            left_dots: [],
            right_dots: [],
            right_descs: []
        };
        this._containers = this.panel_el.getElementsByClassName(this.className + '-Element-Container');
        for (i = 0; i < this.count; i++) {
            this.elements.containers.push(this._containers[i]);
            this.elements.numbers.push(this._containers[i].children[0]);
            this.elements.left_descs.push(this._containers[i].children[1]);
            this.elements.left_dots.push(this._containers[i].children[2]);
            this.elements.right_dots.push(this._containers[i].children[3]);
            this.elements.right_descs.push(this._containers[i].children[4]);
        }
    },
    /**
     *                                                                     R E M A K E   E V E N T   L I S T E N E R S
     */
    _initAnswers: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            this.elements.numbers[i].innerHTML = i + 1 + '.';
            if (this.options.type === 'text') {
                this.elements.left_descs[i].innerHTML = this.options.data[i];
            } else {
                this.elements.left_descs[i].style.backgroundImage = 'url(' + this.options.data[i] + ')';
                this.elements.left_descs[i].setAttribute('image', true);
            }
            if (this.responses.type === 'text') {
                this.elements.right_descs[i].innerHTML = this.responses.data[i];
            } else {
                this.elements.right_descs[i].style.backgroundImage = 'url(' + this.responses.data[i] + ')';
                this.elements.right_descs[i].setAttribute('image', true);
            }
        }
    },
    _addFunctional: function id (id) {
        var i, _this = this, side, clk_el, line, moving_dot, startPos = {};
        if (!id) {
            mouseUp('add');
        } else {
            this.elements.left_dots[id].addEventListener('mousedown', touchStart);
            this.elements.right_dots[id].addEventListener('mousedown', touchStart);
        }
        function touchStart(event) {
            clk_el = this;
            clk_el.setAttribute('stage', 'off');
            clk_el.style.zIndex = 10;
            if (clk_el.getAttribute('answer')) {
                _this.removeLine (clk_el);
            }
            moving_dot = document.createElement('div');
            moving_dot.setAttribute('class', _this.className + '-Moving-dot');
            line = document.createElement('div');
            line.setAttribute('class', _this.className + '-Line');
            if (_this.elements.left_dots.indexOf(clk_el) !== - 1) {
                side = 'left';
            } else {
                side = 'right';
            }
            defineElPos();
            _this.panel_el.appendChild(moving_dot);
            _this.panel_el.appendChild(line);
            startPos.mouse_x = event.pageX;
            startPos.mouse_y = event.pageY;
            startPos.el_x = moving_dot.offsetLeft;
            startPos.el_y = moving_dot.offsetTop;
            mouseUp('remove');                     // this method remove all event listeners 'mousedown' on left and right dots
            document.body.addEventListener('mousemove', touchMove);
            document.body.addEventListener('mouseup', simpleClickEnd);
        }
        function touchMove(event) {
            touchMove.check = touchMove.check !== undefined ? touchMove.check : 0;
            if (touchMove.check == 5) {
                touchMove.check = 0;
                document.body.removeEventListener('mousemove', touchMove);
                document.body.removeEventListener('mouseup', simpleClickEnd);
                document.body.addEventListener('mousemove', move);
                document.body.addEventListener('mouseup', moveEnd);

            } else {
                touchMove.check++;
            }
        }
        function move(event) {
            var fakeEvent = {};
            console.log('moving');
            moving_dot.style.left = startPos.el_x + event.pageX - startPos.mouse_x + 'px';
            moving_dot.style.top = startPos.el_y + event.pageY - startPos.mouse_y + 'px';
            fakeEvent.pageX = moving_dot.getBoundingClientRect().left + parseInt(moving_dot.offsetWidth / 2);
            fakeEvent.pageY = moving_dot.getBoundingClientRect().top + parseInt(moving_dot.offsetHeight / 2);
            lineMove(fakeEvent);
        }
        function moveEnd(event) {
            var target;
            document.body.removeEventListener('mousemove', move);
            document.body.removeEventListener('mouseup', moveEnd);
            console.log('its move end');
            target = checkTarget();
            blinding(target);
        }
        function simpleClickEnd(event) {
            document.body.removeEventListener('mousemove', touchMove);
            document.body.removeEventListener('mouseup', simpleClickEnd);
            document.body.addEventListener('click', end);
        }
        function end(event) {
            var target;
            document.body.removeEventListener('click', end);
            target = checkTarget();
            blinding(target);
        }
        function blinding(target) {
            var fakeEvent = {}, i, answer;
            if (!target) {
                moving_dot.parentNode.removeChild(moving_dot);
                line.parentNode.removeChild(line);
                clk_el.style.zIndex = 10;
                clk_el.removeAttribute('stage'); // i mast see this row in future do not forget it !!!
            } else {
                moving_dot.style.top = target.getBoundingClientRect().top - _this.panel_el.getBoundingClientRect().top + 'px';
                if (side == 'right') {
                    moving_dot.style.left = target.getBoundingClientRect().left  - _this.panel_el.getBoundingClientRect().left + 'px';
                } else {
                    moving_dot.style.left = target.getBoundingClientRect().left  - _this.panel_el.getBoundingClientRect().left +
                        target.offsetWidth - 12 + 'px';
                }
                clk_el.setAttribute('stage', 'on');
                target.setAttribute('stage', 'on');
                i = _this.elements.left_dots.indexOf(clk_el) !== -1 ? _this.elements.left_dots.indexOf(clk_el) :
                    _this.elements.left_dots.indexOf(target);
                answer = _this.elements.right_dots.indexOf(clk_el) !== -1 ? _this.elements.right_dots.indexOf(clk_el) :
                    _this.elements.right_dots.indexOf(target);
                _this.accordance[i] = answer;
                clk_el.setAttribute('answer', answer);
                target.setAttribute('answer', answer);
                line.setAttribute('id', 'line' + answer);
                clk_el.style.zIndex = 13;
                target.style.zIndex = 13;
            }
            fakeEvent.pageX = moving_dot.getBoundingClientRect().left + parseInt(moving_dot.offsetWidth / 2);
            fakeEvent.pageY = moving_dot.getBoundingClientRect().top + parseInt(moving_dot.offsetHeight / 2);
            lineMove(fakeEvent);
            if (target) {
                moving_dot.parentNode.removeChild(moving_dot);
            }
            mouseUp('add');
        }
        function mouseUp(stage) {
            var i;
            if (stage == 'remove') {
                for (i = 0; i < _this.count; i ++) {
                    _this.elements.right_dots[i].removeEventListener('mousedown', touchStart);
                    _this.elements.left_dots[i].removeEventListener('mousedown', touchStart);
                }
            }
            if (stage == 'add') {
                for (i = 0; i < _this.count; i ++) {
                    _this.elements.right_dots[i].addEventListener('mousedown', touchStart);
                    _this.elements.left_dots[i].addEventListener('mousedown', touchStart);
                }
            }

        }
        function checkTarget () {
            var target;
            if (side == 'left' ) {
                for (i = 0; i < _this.count; i++) {
                    if (_this.elements.right_descs[i].getBoundingClientRect().top < event.pageY &&
                        _this.elements.right_descs[i].getBoundingClientRect().top + _this.elements.right_descs[i].offsetHeight > event.pageY &&
                        _this.elements.right_descs[i].getBoundingClientRect().left - 24 < event.pageX &&
                        _this.elements.right_descs[i].getBoundingClientRect().left + _this.elements.right_descs[i].offsetWidth > event.pageX){
                        target = _this.elements.right_dots[i];
                        if (target.getAttribute('answer')) {
                            _this.removeLine (target);
                        }
                    }
                }
            } else {
                for (i = 0; i < _this.count; i++) {
                    if (_this.elements.left_descs[i].getBoundingClientRect().top < event.pageY &&
                        _this.elements.left_descs[i].getBoundingClientRect().top + _this.elements.right_descs[i].offsetHeight > event.pageY &&
                        _this.elements.left_descs[i].getBoundingClientRect().left < event.pageX &&
                        _this.elements.left_descs[i].getBoundingClientRect().left + _this.elements.right_descs[i].offsetWidth + 54 > event.pageX){
                        target = _this.elements.left_dots[i];
                        if (target.getAttribute('answer')) {
                            _this.removeLine (target);
                        }
                    }
                }
            }
            console.log(target);
            return target;
        }
        function lineMove (event) {
            var angleR, angleG, cos,
                rotateX = parseFloat(clk_el.getBoundingClientRect().left + parseFloat(moving_dot.offsetWidth / 2)),
                rotateY = parseFloat(clk_el.getBoundingClientRect().top + parseFloat(moving_dot.offsetHeight / 2));
            if (side == 'right') {
                rotateX += clk_el.offsetWidth - parseFloat(moving_dot.offsetWidth);
                rotateY += clk_el.offsetHeight - parseFloat(moving_dot.offsetHeight);
            }
            line.style.height = parseFloat(Math.sqrt(Math.pow(event.pageX - rotateX, 2) + Math.pow(event.pageY - rotateY, 2))) + "px";
            cos = (event.pageX - rotateX)/parseFloat(line.style.height);
            if (rotateX <= event.pageX && rotateY >= event.pageY) {
                angleR = cos < 0 ? Math.acos(cos) : Math.PI- Math.acos(cos);
                angleG = angleR * (180 / Math.PI) + 90;
            } else if (rotateX >= event.pageX && rotateY >= event.pageY) {
                angleR = cos < 0 ? Math.acos(-cos) : Math.PI- Math.acos(cos);
                angleG = angleR * (180 / Math.PI) + 90;
            } else if (rotateX >= event.pageX && rotateY <= event.pageY) {
                angleR = cos < 0 ? Math.acos(cos) : Math.PI -Math.acos(cos);
                angleG = angleR * (180 / Math.PI) - 90;
            } else if (rotateX <= event.pageX && rotateY <= event.pageY) {
                angleR = cos < 0 ? Math.acos(cos) : Math.PI + Math.acos(cos);
                angleG = angleR * (180 / Math.PI) + 90;
            }
            line.style.webkitTransform = "rotate(" + angleG + "deg)";
        }
        function defineElPos() {
            moving_dot.style.top = clk_el.getBoundingClientRect().top - _this.panel_el.getBoundingClientRect().top + 'px';
            line.style.top = clk_el.getBoundingClientRect().top - _this.panel_el.getBoundingClientRect().top + 6 + 'px';
            if (side == 'left') {
                moving_dot.style.left = clk_el.getBoundingClientRect().left  - _this.panel_el.getBoundingClientRect().left + 'px';
                line.style.left = clk_el.getBoundingClientRect().left - _this.panel_el.getBoundingClientRect().left + 6 +'px';
            } else {
                moving_dot.style.left = clk_el.getBoundingClientRect().left  - _this.panel_el.getBoundingClientRect().left +
                    clk_el.offsetWidth - 12 + 'px';
                line.style.left = clk_el.getBoundingClientRect().left  - _this.panel_el.getBoundingClientRect().left +
                    clk_el.offsetWidth - 6 + 'px';
            }
        }
    },
    onCheckAnswer: function () {
        var i;
        for (i = 0; i < this.count; i ++) {
            if (this.correct_accordance[i] == this.accordance[i]) {
                this.elements.numbers[i].setAttribute('answer', 'right');
            } else {
                this.elements.numbers[i].setAttribute('answer', 'wrong');
            }
        }
    },
    /**
     *
     */
//    _addFunctional: function (id) {
//        var i, _this = this, first_el, stage, moving_dot, line,
//            startPos = {
//                mouse_x: 0,
//                mouse_y: 0,
//                el_x: 0,
//                el_y: 0
//            };
//        if (!id) {
//            for (i = 0; i < this.elements.left_dots.length; i ++) {
//                S.device.addEventListener(this.elements.left_dots[i], S.device.TOUCH_START_EVENT, touchStart);
//                S.device.addEventListener(this.elements.right_dots[i], 'touchstart', touchStart);
//            }
//        } else {
//            S.device.addEventListener(this.elements.left_dots[id], S.device.TOUCH_START_EVENT, touchStart);
//            S.device.addEventListener(this.elements.right_dots[id], 'touchstart', touchStart);
//        }
//        function touchStart (event) {
//            console.log(S.device.TOUCH_START_EVENT)
//            touchStart.count = touchStart.count || 1;
//            if (touchStart.count == 1) {
//                touchStart.count++;
//                if (event.target.getAttribute('answer')) {
//                    removeLine(event.target);
//                }
//                moving_dot = document.createElement('div');
//                moving_dot.setAttribute('class', _this.className + '-Moving-dot');
//                line = document.createElement('div');
//                line.setAttribute('class', _this.className + '-Line');
//                startPos.mouse_x = event.pageX;
//                startPos.mouse_y = event.pageY;
//                first_el = event.target;
//                first_el.setAttribute('stage', 'off');
//                S.device.addEventListener(document.body, 'touchmove', startMove);
//                S.device.addEventListener(document.body, 'touchend', touchEnd);
//            } else {
//                touchStart.count = 1;
//                if (event.target.getAttribute('answer')) {
//                    removeLine(event.target);
//                }
//            }
//        }
//        function defineElPos() {
//            if (getTargetInfo(first_el).side == 'right') {
//                moving_dot.style.top = first_el.getBoundingClientRect().top -  _this.panel_el.getBoundingClientRect().top + 'px';
//                moving_dot.style.left = first_el.getBoundingClientRect().left - _this.panel_el.getBoundingClientRect().left + 'px';
//                line.style.left = first_el.getBoundingClientRect().left - _this.panel_el.getBoundingClientRect().left + moving_dot.offsetWidth / 2 + 'px';
//                line.style.top = first_el.getBoundingClientRect().top - _this.panel_el.getBoundingClientRect().top + moving_dot.offsetHeight / 2 + 'px';
//            } else {
//                moving_dot.style.top = first_el.getBoundingClientRect().top -  _this.panel_el.getBoundingClientRect().top +
//                    first_el.offsetHeight - moving_dot.offsetHeight + 'px' ;
//                moving_dot.style.left = first_el.getBoundingClientRect().left - _this.panel_el.getBoundingClientRect().left +
//                    first_el.offsetWidth - moving_dot.offsetWidth + 'px';
//                line.style.top = first_el.getBoundingClientRect().top -  _this.panel_el.getBoundingClientRect().top +
//                    first_el.offsetHeight - moving_dot.offsetHeight / 2 + 'px' ;
//                line.style.left = first_el.getBoundingClientRect().left - _this.panel_el.getBoundingClientRect().left +
//                    first_el.offsetWidth - moving_dot.offsetWidth / 2 + 'px';
//            }
//        }
//        function startMove (event) {
//            event.preventDefault();
//            var fakeEvent = {};
//            startMove.preventSimpleClick = startMove.preventSimpleClick || 1;
//            if (startMove.preventSimpleClick < 7) {
//                startMove.preventSimpleClick++
//            } else {
//                if(stage !== 'moving') {
//                    _this.panel_el.appendChild(moving_dot);
//                    _this.panel_el.appendChild(line);
//                    defineElPos();
//                    startPos.el_x = moving_dot.offsetLeft;
//                    startPos.el_y = moving_dot.offsetTop;
//                }
//                stage = 'moving';
//                moving_dot.style.left = startPos.el_x + event.pageX - startPos.mouse_x + 'px';
//                moving_dot.style.top = startPos.el_y + event.pageY - startPos.mouse_y + 'px';
//                fakeEvent.pageX = moving_dot.getBoundingClientRect().left + parseInt(moving_dot.offsetWidth / 2);
//                fakeEvent.pageY = moving_dot.getBoundingClientRect().top + parseInt(moving_dot.offsetHeight / 2);
//                lineMove(fakeEvent);
//            }
//
//        }
//        function lineMove (event) {
//            var angleR, angleG, cos,
//                rotateX = parseFloat(first_el.getBoundingClientRect().left + parseFloat(moving_dot.offsetWidth / 2)),
//                rotateY = parseFloat(first_el.getBoundingClientRect().top + parseFloat(moving_dot.offsetHeight / 2));
//            if (getTargetInfo(first_el).side !== 'right') {
//                rotateX += first_el.offsetWidth - parseFloat(moving_dot.offsetWidth);
//                rotateY += first_el.offsetHeight - parseFloat(moving_dot.offsetHeight);
//            }
//            line.style.height = parseFloat(Math.sqrt(Math.pow(event.pageX - rotateX, 2) + Math.pow(event.pageY - rotateY, 2))) + "px";
//            cos = (event.pageX - rotateX)/parseFloat(line.style.height);
//            if (rotateX <= event.pageX && rotateY >= event.pageY) {
//                angleR = cos < 0 ? Math.acos(cos) : Math.PI- Math.acos(cos);
//                angleG = angleR * (180 / Math.PI) + 90;
//            } else if (rotateX >= event.pageX && rotateY >= event.pageY) {
//                angleR = cos < 0 ? Math.acos(-cos) : Math.PI- Math.acos(cos);
//                angleG = angleR * (180 / Math.PI) + 90;
//            } else if (rotateX >= event.pageX && rotateY <= event.pageY) {
//                angleR = cos < 0 ? Math.acos(cos) : Math.PI -Math.acos(cos);
//                angleG = angleR * (180 / Math.PI) - 90;
//            } else if (rotateX <= event.pageX && rotateY <= event.pageY) {
//                angleR = cos < 0 ? Math.acos(cos) : Math.PI + Math.acos(cos);
//                angleG = angleR * (180 / Math.PI) + 90;
//            }
//            line.style.webkitTransform = "rotate(" + angleG + "deg)";
//        }
//        function getTargetInfo (element) {
//            var rectangle = {}, i ;
//            if(_this.elements.left_dots.indexOf(element) !== -1) {
//                i = _this.elements.left_dots.indexOf(element);
//                rectangle.i = i;
//                rectangle.side = 'right';
//                rectangle.top = _this.elements.containers[i].getBoundingClientRect().top;
//                rectangle._top = rectangle.top + _this.elements.containers[i].offsetHeight;
//                rectangle.left = _this.elements.left_descs[i].getBoundingClientRect().left;
//                rectangle._left = rectangle.left + _this.elements.left_descs[i].offsetWidth + _this.elements.left_dots[i].offsetWidth;
//            } else {
//                i = _this.elements.right_dots.indexOf(element);
//                rectangle.i = i;
//                rectangle.side = 'left';
//                rectangle.top = _this.elements.containers[i].getBoundingClientRect().top;
//                rectangle._top = rectangle.top + _this.elements.containers[i].offsetHeight;
//                rectangle.left = _this.elements.right_dots[i].getBoundingClientRect().left;
//                rectangle._left = rectangle.left + _this.elements.right_dots[i].offsetWidth + _this.elements.right_descs[i].offsetWidth;
//            }
//            return rectangle;
//        }
//        function touchEnd (event) {
//            console.log('touch called');
//            event.stopPropagation();
//            var i, targets, inf, el;
//            stage = undefined;
//            S.device.removeEventListener(document.body, 'touchmove', startMove);
//            if (line.parentNode !== _this.panel_el && moving_dot.parentNode !== _this.panel_el) {
//                _this.panel_el.appendChild(moving_dot);
//                _this.panel_el.appendChild(line);
//                defineElPos();
//                startPos.el_x = moving_dot.offsetLeft;
//                startPos.el_y = moving_dot.offsetTop;
//            }
//            if(getTargetInfo(first_el).side == 'right') {
//                targets = _this.elements.right_dots;
//            } else {
//                targets =  _this.elements.left_dots;
//            }
//            for (i = 0; i < _this.count; i++) {
//                inf = getTargetInfo(targets[i]);
//                if (event.pageX > inf.left && event.pageX < inf._left &&
//                    event.pageY > inf.top && event.pageY < inf._top) {
//                    binding(targets[i]);
//                    if(line.parentNode == _this.panel_el) {
//                        el = targets[i];
//                        if (el.getAttribute('answer')) {
//                            removeLine(el);
//                        }
//                    }
//                    break;
//                }
//            }
//            if (!el && line && moving_dot) {
////                line.parentNode.removeChild(line);
////                moving_dot.parentNode.removeChild(moving_dot);
////                touchStart.count = 1;
////                first_el.removeAttribute('stage');
////
////                line = undefined;
////                first_el = undefined;
//            }
//        }
//        function binding (el) {
//            var id, fakeEvent = {
//                pageX: 0,
//                pageY: 0
//            };
//            moving_dot.style.WebkitTransition = "all 0.5s ease";
//            if (getTargetInfo(el).side == 'left') {
//                moving_dot.style.left = el.offsetLeft + el.offsetWidth - moving_dot.offsetWidth + 'px' ;
//                moving_dot.style.top = getTargetInfo(el).top - _this.panel_el.getBoundingClientRect().top + moving_dot.offsetHeight + 4 + 'px';
//            } else {
//                moving_dot.style.left = el.offsetLeft + 'px';
//                moving_dot.style.top =  moving_dot.style.top = getTargetInfo(el).top -
//                    _this.panel_el.getBoundingClientRect().top + moving_dot.offsetHeight + 4 + 'px';
//            }
//            id = setInterval(function () {
//                fakeEvent.pageX = moving_dot.getBoundingClientRect().left + parseInt(moving_dot.offsetWidth / 2);
//                fakeEvent.pageY = moving_dot.getBoundingClientRect().top + parseInt(moving_dot.offsetHeight / 2);
//                lineMove(fakeEvent);
//
//            }, 4);
//            setTimeout(function () {
//                var i, number;
//                moving_dot.style.WebkitTransition = '';
//                clearInterval(id);
//                S.device.removeEventListener(document.body, 'touchend', touchEnd);
//                line.style.zIndex = 9;
//                first_el.setAttribute('stage', 'on');
//                el.setAttribute('stage', 'on');
//                _this.panel_el.removeChild(moving_dot);
//                i = _this.elements.left_dots.indexOf(first_el) !== -1 ? _this.elements.left_dots.indexOf(first_el) :
//                    _this.elements.left_dots.indexOf(el);
//                number = _this.elements.right_dots.indexOf(first_el) !== -1 ? _this.elements.right_dots.indexOf(first_el) :
//                    _this.elements.right_dots.indexOf(el);
//                _this.accordance[i] = number;
//                first_el.setAttribute('answer', number);
//                el.setAttribute('answer', number);
//                line.setAttribute('id', 'line' + number);
//                touchStart.count = null;
//                startMove.preventSimpleClick = 1;
//            }, 400);
//        }
//        function removeLine (el) {
//            var num = el.getAttribute('answer'), i = _this.accordance.indexOf(parseInt(num)), line = document.getElementById('line'+num);
//            line.parentNode.removeChild(line);
//            _this.elements.right_dots[num].setAttribute('stage', '');
//            _this.elements.right_dots[num].removeAttribute('answer');
//            _this.elements.left_dots[i].setAttribute('stage', '');
//            _this.elements.left_dots[i].removeAttribute('answer');
//            _this.accordance[i] = undefined;
//            touchStart.count = 1;
//        }
//    },
    removeLine: function (el) {
        var num = el.getAttribute('answer'), i = this.accordance.indexOf(parseInt(num)), line = document.getElementById('line'+num);
        line.parentNode.removeChild(line);
        this.elements.right_dots[num].setAttribute('stage', '');
        this.elements.right_dots[num].removeAttribute('answer');
        this.elements.left_dots[i].setAttribute('stage', '');
        this.elements.left_dots[i].removeAttribute('answer');
        this.accordance[i] = undefined;
    }
});
S.Class('S.widget.review.question.BindLineAuthor', {
    $extends: 'S.widget.review.question.BindLine',
    rendered: function () {
        this.$callParentMethod(arguments);
        this.addEventListeners();
        this.addContentEditablle();
    },
    addContentEditablle: function () {
        var i, _this = this;
        if (this.options.type == 'text') {
            for (i = 0; i < this.count; i++) {
                this.elements.left_descs[i].setAttribute('contenteditable', true);
                this.elements.left_descs[i].addEventListener('blur', saveLeftContent);
                this.elements.left_descs[i].style.width = this.elements.left_descs[i].offsetWidth + 'px';
            }
        }
        if (this.responses.type == 'text') {
            for (i = 0; i < this.count; i ++) {
                this.elements.right_descs[i].style.width = this.elements.right_descs[i].offsetWidth + 'px';
                this.elements.right_descs[i].setAttribute('contenteditable', true);
                this.elements.left_descs[i].addEventListener('blur', saveRightContent);
            }
        }
        function saveLeftContent () {
            _this.options.data[parseInt(this.parentNode.children[0].innerHTML) - 1] = this.innerHTML;
        }
        function saveRightContent () {
            _this.responses.data[parseInt(this.parentNode.children[0].innerHTML) - 1] = this.innerHTML;
        }
    },
    addEventListeners: function () {
        var i;
        if (this.options.type == 'image') {
            for (i = 0; i < this.count; i++) {
                S.device.addEventListener(this.elements.left_descs[i], 'click', this._leftImageClicked);
            }
        }
        if (this.responses.type == 'image' ) {
            for (i = 0; i < this.count; i++) {
                S.device.addEventListener(this.elements.right_descs[i], 'click', this._rightImageClicked);
            }
        }
    },
    _leftImageClicked: function () {
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onClickOptionImage(parseInt(this.parentNode.children[0].innerHTML) - 1);
        console.log('callback, onClickOptionImage(', parseInt(this.parentNode.children[0].innerHTML) - 1, ')');
    },
    _rightImageClicked : function () {
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onClickResponseImage(parseInt(this.parentNode.children[0].innerHTML) - 1);
        console.log('callback, onClickResponseImage(', parseInt(this.parentNode.children[0].innerHTML) - 1, ')');
    },
    setOptionImage: function (i, image) {
        this.elements.left_descs[i].style.backgroundImage = 'url(' + image + ')';
        this.options.data[i] = image;
    },
    setResponseImage: function (i, image) {
        this.elements.right_descs[i].style.backgroundImage = 'url(' + image + ')';
        this.responses.data[i] = image;
    },
    getResponse: function (i) {
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onGetResponse();
        return this.responses.data[i];
    },
    getOption: function (i) {
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onGetOption();
        return this.data.options[i];
    },
    addCouple: function (obj) {
        var el, i, tmp = document.createElement('div');
        for (i = 0; i < this.count; i++) {
            if (this.elements.left_dots[i].getAttribute('answer')) {
                this.removeLine(this.elements.left_dots[i]);
            }
        }
        tmp.innerHTML = S.core.template.compile(this._element_tpl.join(""), {className: this.className});
        this.options.data.push(obj.option);
        this.responses.data.push(obj.response);
        this.count++;
        this.panel_el.appendChild(tmp.children[0]);
        el = this.panel_el.children[this.count - 1];
        el.children[0].innerHTML = this.count + '.';
        if (this.options.type == 'text') {
            el.children[1].innerHTML = obj.option;
        } else {
            el.children[1].style.backgroundImage = 'url(' + obj.option + ')';
            el.children[1].setAttribute('image', true);
        }
        if (this.responses.type == 'text') {
            el.children[4].innerHTML = obj.response
        } else {
            el.children[4].style.backgroundImage = 'url(' + obj.option + ')';
            el.children[4].setAttribute('image', true);
        }
        this.elements.containers.push(el);
        this.elements.left_descs.push(el.children[1]);
        this.elements.left_dots.push(el.children[2]);
        this.elements.right_dots.push(el.children[3]);
        this.elements.right_descs.push(el.children[4]);
        this._addFunctional(this.count - 1);
    },
    removeCouple: function (id) {
        var i;
        for (i = 0; i < this.count; i++) {
            if (this.elements.left_dots[i].getAttribute('answer')) {
                this.removeLine(this.elements.left_dots[i]);
            }
        }
        this.panel_el.removeChild(this.panel_el.children[id]);
        this.count-- ;
        this.elements.containers.splice(id, 1);
        this.elements.numbers.splice(id, 1);
        this.elements.left_descs.splice(id, 1);
        this.elements.left_dots.splice(id, 1);
        this.elements.right_dots.splice(id, 1);
        this.elements.right_descs.splice(id, 1);
        this.correct_accordance.splice(id, 1);
        this.accordance.splice(id, 1);
        for (i = 0; i < this.count; i ++) {
            this.elements.numbers[i].innerHTML = i + 1 + '.';
        }
    },
    getCorrectAccordance: function () {
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onGetCorrectAccordance();
        return this.correct_accordance;
    },
    getCurrentAccordance: function () {
        window["callback_" + this.question_id] && window["callback_" + this.question_id].onGetCurrentAccordanse();
        return this.accordance;
    }
});
S.Class('S.widget.review.question.DndX', {
    $requires: 'S.core.dndS',
    $extends: 'S.widget.review.question.Question',
    _question_elements: [
        'options'
      , 'example'
      , 'responses'
    ],
    _question_tpl: [
        '<div class="{className}-Options" id="{options_id}">',
            '{_options_HTML}',
        '</div>',
        '<div class="{className}-Example" id="{example_id}">',
            '<div class="{className}-Example-Text">',
                '[{review.lang.example}]',
            '</div>',
            '<div class="{className}-Responses" id="{responses_id}">',
                '{_responses_HTML}',
            '</div>',
        '</div>'
    ],
    /**
     * @protected
     */
    _option_container_tpl: [
        '<div class="{className}-Option-Container">',
            '<div class="{className}-Option-Desc"></div>',
            '<div class="{className}-Option-Field"></div>',
            '<div class="{className}-Option-Checker"></div>',
            '<div style="height: 0; opacity: 0; font-size: 0;">.</div>',
        '</div>'
    ],
    _response_tpl: '<div class="{className}-Response-Container">' +
        '<div class="{className}-Response-Desc"></div></div>',
    _option_number_tpl: '<p class="{className}-Option-Number"></p>',
    _option_separator_tpl: '<div class="{className}-Option-Separator"></div>',
    _options_HTML: '',
    _responses_HTML: '',
    _defaults: {
        correct_accordance: [],
        current_accordance: [],
        options: [],
        responses: [],
        answer_type: '4'
    },
    /**
     * @public
     */
    count: null,
    correct_accordance: null,
    current_accordance: null,
    options: null,
    responses: null,
    answer_type: null,
    option_type: null,
    response_type: null,
    points: null,
    className: 'S-Review-DndX',
    /**
     */
    init: function () {
        this._initProperties()._compileAnswers();
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this.count && this._initConfig()._initAnswers();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        var obj = {
            self: {
                correct_accordance: this.correct_accordance,
                current_accordance: this.current_accordance
            }
        };
        this.$callParentMethod([obj]);
    },
    /**
     */
    _initConfig: function () {
        var i, tmp,
            inc = 0;
        this.count = Math.max(this.responses.length, this.options.length);
        this._options = Array.prototype.slice.call(this.options_el.
            getElementsByClassName(this.className + '-Option-Container'));
        this._option_descs = Array.prototype.slice.call(this.options_el.
            getElementsByClassName(this.className + '-Option-Desc'));
        this._option_checkers = Array.prototype.slice.call(this.options_el.
            getElementsByClassName(this.className + '-Option-Checker'));
        this._option_numbers = Array.prototype.slice.call(this.options_el.
            getElementsByClassName(this.className + '-Option-Number'));
        this._option_separators = Array.prototype.slice.call(this.options_el.
            getElementsByClassName(this.className + '-Option-Separator'));
        this._option_fields = Array.prototype.slice.call(this.options_el.
            getElementsByClassName(this.className + '-Option-Field'));
        this._responses = Array.prototype.slice.call(this.answers_el.
            getElementsByClassName(this.className + '-Response-Container'));
        this._response_descs = Array.prototype.slice.call(this.answers_el.
            getElementsByClassName(this.className + '-Response-Desc'));
        if (!this.correct_accordance.length) {
            for (i = 0; i < this._options.length; i++) {
                this.correct_accordance.push(i);
            }
        }
        if (!this.store) {
            this.current_accordance = [];
            for (i = 0; i < this._options.length; i++) {
                this.current_accordance.push(null);
            }
        } else {
            tmp = this.current_accordance.filter(function (a) { return a !== null; });
            for (i = 0; i < tmp.length; i++) {
                this._responses.splice(tmp[i] + tmp.length, 0, this._responses[inc]);
                this._response_descs.splice(tmp[i] + tmp.length, 0, this._response_descs[inc]);
                inc++;
            }
            for (i = 0; i < tmp.length; i++) {
                this._responses = this._responses.slice(1, this._responses.length);
                this._response_descs = this._response_descs.slice(1, this._response_descs.length);
            }
        }
        return this;
    },
    /**
     */
    _initProperties: function () {
        this.count = Math.max(this.responses.length, this.options.length);
        this.count && this._initTypes();
        return this;
    },
    /**
     */
    _initTypes: function () {
        var type, subtype;
        // Init options & responses types
        type = parseInt(this.answer_type);
        subtype = this.answer_type.length !== 1 ? parseInt(this.answer_type[this.answer_type.length - 1]) : type;
        switch (type) {
            case 1:
                this.option_type = subtype > 2 ? 'text' : 'image';
                this.response_type = subtype % 2 !== 0 ? 'text' : 'image';
                break;
            case 2:
                this.option_type = subtype === 2 ? 'text' : 'image';
                this.response_type = subtype < 3 ? 'image' : 'text';
                break;
            case 3:
                this.option_type = 'image';
                this.response_type = 'text';
                break;
            case 4:
                this.option_type = 'text';
                this.response_type = 'image';
        }
    },
    /**
     */
    _initOptionContainerTpl: function () {
        var tmp;
        this._option_container_tpl = this._option_container_tpl.slice();
        if (this.answer_type === '4') {
            tmp = this._option_container_tpl.splice(2, 1);
            this._option_container_tpl.splice(1, 0, tmp[0]);
            this._option_container_tpl.splice(2, 0, this._option_number_tpl);
        } else if (parseInt(this.answer_type) === 1 || this.answer_type === '2.2') {
            this._option_container_tpl.splice(1, 0, this._option_number_tpl);
        }
        if (parseInt(this.answer_type) === 2) {
            this._option_container_tpl.splice(1, 0, this._option_separator_tpl);
            tmp = this._option_container_tpl.splice(2, this.answer_type === '2.2' ? 2 : 1);
            this._option_container_tpl.splice(3, 0, tmp.join(''));
            if (['2.2', '2.4', '2.6'].indexOf(this.answer_type) !== -1) {
                tmp = '<div' + (['2.4', '2.2'].indexOf(this.answer_type) === -1 ?
                    ' class="' + this.className + '-AField"' : '') + '>' +
                    this._option_container_tpl.splice(['2.4', '2.2'].indexOf(this.answer_type) !== -1 ?
                        2 : 1, 2).join('') +
                    '</div>';
                this._option_container_tpl.splice(2, 0, tmp);
            }
        }
        this._option_container_tpl = this._option_container_tpl.join('');
    },
    /**
     */
    _compileAnswers: function () {
        var i;
        if (this.count) {
            this._initOptionContainerTpl();
            for (i = 0; i < this.count; i++) {
                this._responses_HTML += this._response_tpl;
            }
            if (this.answer_type === '3') {
                this._options_HTML = this._option_container_tpl;
            } else {
                for (i = 0; i < this.count; i++) {
                    this._options_HTML += this._option_container_tpl;
                }
            }
        }
        return this;
    },
    /**
     */
    _initAnswers: function () {
        var i;
        if (!this.store) {
            this.answers_el.setAttribute('type', this.answer_type);
            this.answers_el.setAttribute('a_type', parseInt(this.answer_type));
            this.answers_el.setAttribute('r_type', this.response_type);
            for (i = 0; i < this.count; i++) {
                this._initAnswer(i);
            }
            window.setTimeout(function () {
                this.responses_el.style.height = this.responses_el.offsetHeight + 'px';
            }.bind(this), 150);
        }
        this._initAnswersEvents();
        return this;
    },
    /**
     */
    _initAnswer: function (id) {
        // Option init
        if (this.answer_type !== '3' || (this.answer_type === '3' && id < 1)) {
            this._initOptionNumber(id);
            if (this.option_type === 'text') {
                this._option_descs[id].innerHTML = this.options[id];
            } else if (this.options[id]) {
                this._option_descs[id].style.backgroundImage = 'url(' +
                    window.escape(this.options[id]) + ')';
            }
        }
        // Response init
        if (this.response_type === 'text') {
            this._response_descs[id].innerHTML = this.responses[id];
        } else {
            this._response_descs[id].style.backgroundImage = 'url(' +
                window.escape(this.responses[id]) + ')';
        }
        return this;
    },
    /**
     */
    _initOptionNumber: function (id) {
        if (this._option_numbers[id]) {
            this._option_numbers[id].innerHTML = id + 1 + '. ';
        }
    },
    /**
     */
    _initAnswersEvents: function () {
        this._setDND();
//        this.responses_el.onmousedown = function (e) {
//            e.preventDefault();
//        };
//        this.options_el.onmousedown = function (e) {
//            e.preventDefault();
//        };
        return this;
    },
    /**
     */
    _setDND: function () {
        var temp_array = [
            {
                zone: this.example_el
                , target: this.responses_el
            }
        ], i;
        for (i = 0; i < this._options.length; i++) {
            temp_array.push({
                zone: this._options[i]
                , target: this._option_fields[i]
            });
        }
        S.core.dndS(this._responses, this.answers_el, temp_array, true, function (el_id, zone_id) {
            zone_id -= 1;
            if (this.current_accordance.indexOf(el_id) !== -1) {
                this.current_accordance[this.current_accordance.indexOf(el_id)] = null;
            }
            if (zone_id !== -1) {
                this.current_accordance[zone_id] = el_id;
                if (S.config.author_mode) {
                    this.correct_accordance[this.correct_accordance.indexOf(el_id)] = this.correct_accordance[zone_id];
                    this.correct_accordance[zone_id] = el_id;
                }
            }
        }.bind(this));
    },
    /**
     */
    checkAnswer: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            if (this.correct_accordance[i] !== this.current_accordance[i]) {
                return false;
            }
        }
        return true;
    },
    /**
     */
    onCheckAnswer: function () {
        var i;
        for (i = 0; i < this._options.length; i++) {
            this._option_checkers[i].style.display = 'block';
            if (this.correct_accordance[i] === this.current_accordance[i]) {
                this._option_checkers[i].setAttribute('correct', 'true');
            }
        }
        return this.checkAnswer() ? 'clear' : 'retry';
    },
    /**
     */
    reset: function () {
        var i;
        this.current_accordance = [];
        for (i = 0; i < this._options.length; i++) {
            this.current_accordance.push(null);
            if (this._option_fields[i].children.length !== 0) {
                this.responses_el.appendChild(this._option_fields[i].children[0]);
            }
        }
        for (i = 0; i < this._options.length; i++) {
            this._option_checkers[i].style.display = 'none';
            this._option_checkers[i].setAttribute('correct', 'false');
        }
        return this;
    }
});
S.Class('S.widget.review.question.DndXAuthor', {
    $extends: 'S.widget.review.question.DndX',
    /**
     */
    _initAnswer: function (id) {
        var _this = this;
        // Option init
        if (this.answer_type !== '3' || (this.answer_type === '3' && id < 1)) {
            this._initOptionNumber(id);
            if (this.option_type === 'text') {
                this._option_descs[id].innerHTML = this.options[id];
                this._option_descs[id].setAttribute('contenteditable', 'true');
                this._option_descs[id].onkeypress = function (e) {
                    var element_id = _this._option_descs.indexOf(this);
                    if (e.keyCode === 13) {
                        e.preventDefault();
                        this.blur();
                        _this.options[element_id] = this.innerHTML;
                    } else if (this.getBoundingClientRect().right >=
                        _this._options[element_id].getBoundingClientRect().right - 10) {
                        e.preventDefault();
                    }
                };
            } else if (this.options[id]) {
                this._option_descs[id].style.backgroundImage = 'url(' +
                    window.escape(this.options[id]) + ')';
            }
        }
        // Response init
        if (this.response_type === 'text') {
            this._response_descs[id].innerHTML = this.responses[id];
            this._response_descs[id].setAttribute('contenteditable', 'true');
            this._response_descs[id].onkeypress = function (e) {
                var element_id = _this._response_descs.indexOf(this);
                if (e.keyCode === 13) {
                    e.preventDefault();
                    this.blur();
                    _this.responses[element_id] = this.innerHTML;
                }
            };
        } else {
            this._response_descs[id].style.backgroundImage = 'url(' +
                window.escape(this.responses[id]) + ')';
        }
        return this;
    },
    /* #################### A P I ###################### */
    /**
     */
    setType: function (type) {
        this.answer_type = type;
        this._initTypes();
        this.answers_el.setAttribute('type', this.answer_type);
        this.answers_el.setAttribute('a_type', parseInt(this.answer_type));
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onTypeSet();
    },
    /**
     */
    getType: function () {
        return this.answer_type;
    },
    /**
     * @public
     * @method addCouple
     * @description Adds new option and proper response
     */
    addCouple: function (input_questions) {
        var i, tmp, count = this.count ? this.count : 0;
        if (!this.count) {
            this._initOptionContainerTpl();
        }
        if (input_questions.length) {
            for (i = 0; i < input_questions.length; i++) {
                tmp = document.createElement('div');
                if (this.answer_type !== '3' || this.options.length === 0) {
                    this.options.push(input_questions[i].option);
                    tmp.innerHTML = S.core.template.compile(this._option_container_tpl, this);
                    this.options_el.appendChild(tmp.children[0]);
                }
                this.responses.push(input_questions[i].response);
                tmp.innerHTML = S.core.template.compile(this._response_tpl, this);
                this.responses_el.appendChild(tmp.children[0]);

            }
            if (!this.count) {
                this.responses_el.style.height = this.responses_el.offsetHeight + 'px';
            }
            this._initConfig();
            for (i = 0; i < input_questions.length; i++) {
                this._initAnswer(count + i);
            }
            this._initAnswersEvents();
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onCoupleAdd();
    },
    /**
     * @public
     * @method removeCouple
     * @description Removes option and proper response
     * @param {Integer} id Id number of option to be removed (with proper response according to correct_accordance Array)
     */
    removeCouple: function (id) {
        var i;
        this.responses.splice(id, 1);
        if (this.answer_type !== '3') {
            this.options.splice(id, 1);
            this.options_el.removeChild(this._options[id]);
        }
        this.responses_el.removeChild(this._responses[id]);
        this._initConfig();
        if (this.answer_type !== '3') {
            for (i = 0; i < this.count; i++) {
                this._initOptionNumber(i);
            }
            this.correct_accordance.splice(id, 1);
            for (i = id; i < this.count; i++) {
                this.correct_accordance[i]--;
            }
        }
        this._setDND();
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onCoupleRemove();
    },
    /**
     * @public
     * @method setOptionText
     * @description Sets option text to desired
     * @param {Integer} id Option's id
     * @param {string} text Desired option's text
     */
    setOption: function (id, text) {
        id = this.answer_type == '3' ? 0 : id;
        this.options[id] = text;
        if (this.option_type === 'text') {
            this._option_descs[id].innerHTML = text;
        } else {
            this._option_descs[id].style.backgroundImage = 'url(' + window.escape(text) + ')';
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onOptionSet();
    },
    /**
     * @public
     * @method getOptionText
     * @description Returns option text
     * @param {Integer} id Option's id
     */
    getOption: function (id) {
        id = this.answer_type == '3' ? 0 : id;
        return this.options[id];
    },
    /**
     * @public
     * @method setResponseText
     * @description Sets response text to desired
     * @param {Integer} id Response's id
     * @param {string} text Desired response's text
     */
    setResponse: function (id, text) {
        this.responses[id] = text;
        if (this.response_type === 'text') {
            this._response_descs[id].innerHTML = text;
        } else {
            this._response_descs[id].style.backgroundImage = 'url(' + text + ')';
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onResponseSet();
    },
    /**
     * @public
     * @method getResponseText
     * @description Returns response text
     * @param {Integer} id Response's id
     */
    getResponse: function (id) {
        return this.responses[id];
    },
    /**
     * @public
     * @method setCorrectAccordance
     * @description Sets correct accordance between options -- responses
     * @param {Array} new_accordance Desired accordance
     */
    setCorrectAccordance: function (new_accordance) {
        var count = this.answer_type === '3' ? 1 : this.count,
            i;
        for (i = 0; i < count; i++) {
            this.correct_accordance[i] = new_accordance[i];
        }
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onCorrectAccordanceSet();
    },
    /**
     * @public
     * @method getCorrectAccordance
     * @description Gets correct accordance between options -- responses
     */
    getCorrectAccordance: function () {
        return this.correct_accordance;
    },
    /**
     * @public
     * @method switchQuestions
     * @description Switches questions
     * @param {Integer} from_pos Pos of first option to be switched
     * @param {Integer} to_pos Pos of second option to be switched
     */
    switchOptions: function (from_pos, to_pos) {
        var from_el = this.options_el.childNodes[from_pos],
            to_el = this.options_el.childNodes[to_pos],
            buff, i;
        this.reset();
        // Data switching
        buff = this.options[from_pos];
        this.options[from_pos] = this.options[to_pos];
        this.options[to_pos] = buff;
        buff = this.correct_accordance[from_pos];
        this.correct_accordance[from_pos] = this.correct_accordance[to_pos];
        this.correct_accordance[to_pos] = buff;
        // DOM switching
        buff = this.options_el.childNodes[from_pos + 1];
        this.options_el.insertBefore(from_el, this.options_el.childNodes[to_pos + 1]);
        this.options_el.insertBefore(to_el, buff);
        this._initConfig();
        for (i = 0; i < this.count; i++) {
            this._initOptionNumber(i);
        }
        this._setDND();
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onOptionsSwitch();
    },
    /**
     * @public
     * @method switchResponses
     * @description Switches responses
     * @param {Integer} from_pos Pos of first response to be switched
     * @param {Integer} to_pos Pos of second response to be switched
     */
    switchResponses: function (from_pos, to_pos) {
        var buff;
        this.reset();
        // Data switching
        buff = this.responses[from_pos];
        this.responses[from_pos] = this.responses[to_pos];
        this.responses[to_pos] = buff;
        buff = this.correct_accordance[from_pos];
        if (this.answer_type !== '3') {
            this.correct_accordance[from_pos] = this.correct_accordance[to_pos];
            this.correct_accordance[to_pos] = buff;
        } else if (from_pos === this.correct_accordance[0]) {
            this.correct_accordance[0] = to_pos;
        } else if (to_pos === this.correct_accordance[0]) {
            this.correct_accordance[0] = from_pos;
        }
        this.setResponse(from_pos, this.responses[from_pos]);
        this.setResponse(to_pos, this.responses[to_pos]);
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onResponsesSwitch();
    },
    /**
     * @public
     * @method getScriptData
     * @description Returns current script data
     */
    getScriptData: function () {
        var data = {
            options: this.options,
            responses: this.responses,
            correct_accordance: this.correct_accordance
        };
        S.addParams(data, this._getDataQ());
        return data;
    }
});
S.Class('S.widget.review.question.TextX', {
    $extends: 'S.widget.review.question.Question',
    _question_elements: [
        'container'
    ],
    _question_tpl: [
        '<div class="{className}" id="{container_id}"></div>'
    ],
    /**
     * @protected
     */
    _defaults: {
        correct_accordance: [],
        current_accordance: [],
        inputs: [],
        points: 20
    },
    /**
     * @public
     */
    count: null,
    inputs: null,
    correct_accordance: null,
    current_accordance: null,
    points: null,
    className: 'S-Review-TextX',
    /**
     */
    rendered: function () {
        this._initConfig();
        this._initArea();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _initConfig: function () {
        this.count = this.data && this.data.length;
        return this;
    },
    /**
     */
    _initArea: function () {
        this.container_el.innerHTML = this.input_text;
        this._initData();
        return this;
    },
    /**
     */
    _initData: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            this._initInput(i);
        }
        return this;
    },
    /**
     */
    _initInput: function (id) {
        if (id === undefined) {
            id = this.data.length - 1;
        }
        var tmp_anchor = this.data[id].anchor,
            curr_input, i, tmp;
        for (i = 0; i < this.count; i++) {
            if (i !== id && this.inputs[i] && this.data[i].anchor < this.data[id].anchor) {
                tmp_anchor += this.inputs[i]._outerHTML_length +
                    (this.inputs[i].text.length - this.correct_accordance[i].length);
            }
        }
        this.correct_accordance[id] = this.input_text.substr(
            this.data[id].anchor, this.data[id].range);
        this.container_el.innerHTML = this.container_el.innerHTML.substr(0, tmp_anchor) +
            '<span></span>' + this.container_el.innerHTML.substring(tmp_anchor + this.data[id].range);
        this.container_el.innerHTML = this.container_el.innerHTML.
            replace(/ xmlns="http:\/\/www\.w3\.org\/1999\/xhtml"/gmi, '');
        tmp = this.container_el.getElementsByTagName('span')[0];
        curr_input = S.New('S.component.form.TextXInput', {
            auto_render: true,
            className_plus: this.className + 'Input',
            editable: true,
            text: this.correct_accordance[id],
            render_to: this.container_el,
            insert_before: tmp,
            onchange: function (data) {
                this.current_accordance[id] = data;
            }.bind(this),
            context_menu: S.config.author_mode ? {
                render_to: this.answers_el,
                lines: [
                    {
                        text: 'Delete input',
                        onclick: function () {
                            this.deleteInput(id);
                        }.bind(this)
                    }
                ]
            } : null
        });
        if (!S.config.author_mode) {
            setTimeout(function () {
                curr_input.text_input_el.innerHTML = '';
            }, 0);
        }
        this.inputs.push(curr_input);
        curr_input._outerHTML_length = curr_input.root_el.outerHTML.length -
            this.correct_accordance[id].length;
        this.container_el.removeChild(tmp);
        for (i = 0; i < this.inputs.length - 1; i++) {
            this.inputs[i]._setupElements();
            this.inputs[i].rendered();
        }
    },
    /**
     */
    _initProperties: function () {
        return this;
    },
    /**
     */
    _setStoreData: function () {
        return {
            self: {
                id: this.id,
                correct_accordance: this.correct_accordance,
                current_accordance: this.current_accordance
            },
            elements: S.core.DOM.getElementsIds(this)
        };
    },
    /**
     */
    checkAnswer: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            if (this.correct_accordance[i] !== this.current_accordance[i]) {
                return false;
            }
        }
        return true;
    },
    /**
     */
    onCheckAnswer: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            this.inputs[i].root_el.setAttribute('correct',
                this.correct_accordance[i] !== this.current_accordance[i] ?
                    'false' : 'true');
        }
        return this.checkAnswer() ? 'clear' : 'retry';
    },
    /**
     */
    reset: function () {
        var i;
        for (i = 0; i < this.count; i++) {
            this.inputs[i].root_el.removeAttribute('correct');
            this.inputs[i].setText('');
        }
        this.current_accordance = [];
        return this;
    }
});
S.Class('S.widget.review.question.TextXAuthor', {
    $extends: 'S.widget.review.question.TextX',
    /**
     */
    rendered: function () {
        this._addSelectEvents();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _addSelectEvents: function () {
        var _this = this;
        this.answers_el.addEventListener('selectstart', function (e) {
            if (e.target.parentNode === _this.container_el) {
                S.device.addEventListener(_this.answers_el, 'mouseup', selectEnd);
                function selectEnd (e) {
                    createContextMenu(window.getSelection(), e);
                    S.device.removeEventListener(_this.answers_el, 'mouseup', selectEnd);
                }
            }
        });
        function createContextMenu(selection, mouseEvent) {
            if (!selection.isCollapsed && selection.toString() !== ' ') {
                _this.context_menu = S.New('S.component.ContextMenu', {
                    auto_render: true,
                    render_to: _this.answers_el,
                    position: {
                        x: mouseEvent.offsetX,
                        y: mouseEvent.offsetY
                    },
                    ondestroy: function () {
                        _this.context_menu = null;
                    },
                    lines: [
                        {
                            text: 'Create input',
                            onclick: function () {
                                _this.addInput({
                                    anchor: _this.input_text.indexOf(selection.baseNode.data) +
                                        selection.anchorOffset,
                                    range: selection.toString().length
                                });
                            }
                        }
                    ]
                });
            }
        }
    },
    /**
     */
    addInput: function (new_data) {
        this.count++;
        this.data.push({
            anchor: new_data.anchor,
            range: new_data.range
        });
        this._initInput();
    },
    /**
     */
    deleteInput: function (id) {
        this.inputs[id].root_el.previousSibling.replaceWholeText(
            this.inputs[id].root_el.previousSibling.substringData(
                0, this.inputs[id].root_el.previousSibling.length) + this.inputs[id].text_input_el.innerHTML);
        this.container_el.removeChild(this.inputs[id].root_el);
        this.count--;
        this.inputs.splice(id, 1);
        this.data.splice(id, 1);
        this.correct_accordance.splice(id, 1);
    },
    /**
     */
    getScriptData: function () {
        var data = {
            input_text: this.input_text,
            data: this.data
        };
        S.addParams(data, this._getDataQ());
        return data;
    }
});
/**
 * @author Sergiy Murygin
 * @class S.widget.review.results.ExamResult
 * @description Examination results class (User version)
 */
S.Class('S.widget.review.results.TestResult', {
    $extends: 'S.widget.Widget',
    _elements: [
        'root'
      , 'top'
      , 'middle'
      , 'bottom'
      , 'progress'
      , 'points'
      , 'total_points'
      , 'percents'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-Top-Container" id="{top_id}"></div>',
            '<div class="{className}-Middle-Container" id="{middle_id}">',
                '<p class="{className}-Blue-Text">',
                    '<span id="{points_id}">{points}</span> Point',
                '</p> / Total ',
                '<span id="{total_points_id}">{total_points}</span> Point',
            '</div>',
            '<div class="{className}-Bottom-Container" id="{bottom_id}">',
                '<div class="{className}-Progress" id="{progress_id}"></div>',
                '<div class="{className}-Bottom-Text" id="{percents_id}">{percents}%</div>',
            '</div>',
        '</div>'
    ],
    _defaults: {
        show_points: true,
        show_graphic: true
    },
    /**
     * @public
     * @property {String} className
     * @property {String} caption_text
     * @property {String} editable Uses as a value for 'contenteditable' attribute of caption HTML element
     * @property {Number} test_id
     * @property {String} percents Right answers percent
     * @property {String} points Current points
     * @property {String} total_points Maximum points
     */
    caption_text: 'End of the Test',
    className: 'S-widget-TestResult',
    editable: String(S.config.author_mode),
    test_id: null,
    percents: null,
    points: null,
    total_points: null,
    show_points: null,
    show_graphic: null,
    /**
     */
    init: function () {
        this._initData();
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this._addTextXInput();
        this._addProgressBar();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        var obj = {
            self: {
                id: this.id,
                percents: this.percents,
                points: this.points,
                total_points: this.total_points
            },
            caption: this.caption._setStoreData(),
            progress_bar: this.progress_bar._setStoreData(),
            elements: S.core.DOM.getElementsIds(this)
        };
        S.addParams(obj, this.data);
        S.core.storage.setTestData(this.test_id, obj);
    },
    /* ###### P R O T E C T E D ### M E T H O D S ###### */
    /**
     */
    _initData: function () {
        this.points = this.total_points = this.percents = '0';
        if (this.test_id && S.core.storage) {
            this.data = S.core.storage.getTestData(this.test_id);
            if (this.data.self && document.getElementById(this.root_id)) {
                this.store = this.data;
            }
            if (this.data.childs.length) {
                this._extractResults();
            }
        }
    },
    /**
     */
    _extractResults: function () {
        var reviews = [],
            i, j, tmp, current_question_id;
        this.points = this.total_points = 0;
        for (i = 0; i < this.data.childs.length; i++) {
            reviews.push(S.core.storage.getReviewData(this.data.childs[i], this.test_id));
            for (j = 0; j < reviews[reviews.length - 1].questions_ids.length; j++) {
                current_question_id = reviews[reviews.length - 1].questions_ids[j];
                tmp = S.core.storage.getQuestionData(current_question_id, this.data.childs[i],
                    this.test_id);
                this.total_points += tmp.self.points;
                if (S.core.storage.getQuestionResult(current_question_id, this.data.childs[i],
                    this.test_id) === 1) {
                    this.points += tmp.self.points;
                }
            }
        }
        this.percents = parseInt(100 * this.points / this.total_points) + '';
    },
    /**
     */
    _addTextXInput: function () {
        this.caption = S.New('S.component.form.TextXInput', {
            store: this.store && this.store.caption,
            auto_render: true,
            render_to: this.top_el,
            className_plus: this.className + '-Top-Text',
            text: this.caption_text,
            editable: String(S.config.author_mode),
            font_size: 58,
            onchange: function (text) {
                this.caption_text = text;
            }.bind(this)
        });
    },
    /**
     */
    _addProgressBar: function () {
        this.progress_bar = S.New('S.component.ProgressBar', {
            render_to: this.progress_el,
            store: this.store && this.store.progress_bar,
            auto_render: true,
            value: this.percents,
            bar_color: '#1fb4e5',
            bg_color: '#c7c2bb'
        });
    }
});





/**
 * @author Sergiy Murygin
 * @class S.widget.review.results.ExamResult
 * @description Examination results class (Author version)
 */
S.Class('S.widget.review.results.TestResultAuthor', {
    $extends: 'S.widget.review.results.TestResult',
    /**
     * @description Set caption HTML element text
     * @param {String} text Desired caption text
     */
    setCaption: function (text) {
        this.caption_text = text;
        this.caption.setText(text);
        this.save();
    },
    /**
     * @description Get caption HTML element text
     */
    getCaption: function () {
        return this.caption_text;
    },
    /**
     */
    setTestId: function (new_id) {
        this.test_id = new_id;
        this._initData();
        this.points_el.innerHTML = this.points;
        this.total_points_el.innerHTML = this.total_points;
        this.percents_el.innerHTML = this.percents + '%';
        this.progress_bar.setValue(this.percents);
        this.save();
    },
    /**
     */
    getTestId: function () {
        return this.test_id;
    },
    /**
     */
    showPoints: function () {
        this.middle_el.style.visibility = 'visible';
        this.show_points = true;
        this.save();
    },
    /**
     */
    hidePoints: function () {
        this.middle_el.style.visibility = 'hidden';
        this.show_points = false;
        this.save();
    },
    /**
     */
    showGraphic: function () {
        this.bottom_el.style.visibility = 'visible';
        this.show_graphic = true;
        this.save();
    },
    /**
     */
    hideGraphic: function () {
        this.bottom_el.style.visibility = 'hidden';
        this.show_graphic = false;
        this.save();
    },
    /**
     */
    save: function () {
        this._script_dom.innerHTML = [
            'S(function () {',
            'window.' + this.dom_id + ' = S.New("' + this.$namespace.replace(/Author/, '') +'", ' +
                JSON.stringify({
                    dom_id: this.dom_id,
                    test_id: this.test_id,
                    caption_text: this.caption_text,
                    show_points: this.show_points,
                    show_graphic: this.show_graphic
                }) +
                ");",
            '});'
        ].join('');
    }
});





S.Class('S.widget.addon.Addon', {
    $extends: 'S.widget.Widget',
    _elements: [
        'root'
      , 'input'
      , 'popup_line'
      , 'popup'
      , 'pointer'
      , 'question'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}">',
            '<div class="{className}-Input" id="{input_id}"><br /></div>',
            '<div class="{className}-Popup-Line" id="{popup_line_id}">',
                '<div class="{className}-Popup" id="{popup_id}">',
                    '<div class="{className}-Popup-Pointer-Container">',
                        '<div class="{className}-Popup-Pointer" id="{pointer_id}"></div>',
                    '</div>',
                    '<div class="{className}-Popup-Question" id="{question_id}"></div>',
                '</div>',
            '</div>',
        '</div>'
    ],
    /**
     * @protected
     */
    _defaults: {
        type: 'Input'
      , direction: 'bottom',
        ids: {
            t: 0,
            r: 0,
            q: 0
        }
    },
    /**
     * @public
     */
    className: 'S-Addon',
    type: null,
    direction: null,
    question: null,
    correct_answer: null,
    ids: null,
    /**
     */
    init: function () {
        if (S.core.storage && this.ids && document.getElementById(this.dom_id + '$widget')) {
            this.store = S.core.storage.getQuestionData(this.ids.q, this.ids.r, this.ids.t);
        }
        S.savePage.obj_array.push(this);
        this.$callParentMethod(arguments);
    },
    /**
     */
    rendered: function () {
        this.showPopup(false);
        this._refreshDirection();
        this._initEvents();
        this._initQuestion();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        var data = {
            self: {
                id: this.id
            },
            top_id: S.genId.current,
            elements: S.core.DOM.getElementsIds(this)
        };
        if (this.type !== 'Input') {
            data.question = this.question._setStoreData();
        }
        S.core.storage.setQuestionData(this.ids.q, this.ids.r, this.ids.t, data);
    },
    /**
     */
    _initEvents: function () {
        var _this = this;
        this.input_el.addEventListener('click', function () {
            var toggle_next = _this.popup_line_el.getAttribute('show') === 'true' ? false : true;
            if (_this.type !== 'Input') {
                _this.showPopup(toggle_next);
            }
            if (toggle_next) {
                _this.input_el.setAttribute('correct', 'none');
            } else if (this.innerHTML.indexOf('<br ') === -1) {
                _this.onCheckAnswer(this.innerHTML);
            }
        });
        if (this.type === 'Input') {
            this.input_el.setAttribute('contenteditable', 'true');
            this.input_el.addEventListener('keypress', function (e) {
                _this.input_el.removeAttribute('correct');
                if (e.keyCode === 13) {
                    e.preventDefault();
                    this.blur();
                    if (this.innerHTML.indexOf('<br ') === -1) { // If innerHTML is empty ('<br xhtml=.... />')
                        _this.onCheckAnswer(this.innerHTML);
                    } else {
                        _this.input_el.removeAttribute('correct');
                    }
                }
            });
        }
    },
    /**
     */
    _initQuestion: function () {
        var question_class, question_data;
        if (this.type !== 'Input') {
            question_class = ('S.widget.addon.question.' + this.type + (S.config.author_mode ? 'Author' : ''));
            question_data = {
                render_to: this.question_el,
                auto_render: true,
                store: this.store && this.store.question,
                onCheckAnswer:function (data) {
                    this.showPopup(false);
                    this.input_el.innerHTML = Array.isArray(data) ? data.join(', ') : data;
                    this.onCheckAnswer(data);
                }.bind(this)
            };
            if (this.type !== 'XO') {
                S.addParams(question_data, {
                    count: this.count,
                    label_type: this.label_type
                });
            }
            this.question = S.New(question_class, question_data);
            if (this.type !== 'XO') {
                S.core.Object.defineThroughProperties(this, this.question, ['count', 'label_type']);
            }
        }
    },
    /**
     */
    onCheckAnswer: function (data) {
        var is_correct = Array.isArray(data) ?
            this.correct_answer.join() === data.join() : this.correct_answer === data;
        this.input_el.setAttribute('correct', String(is_correct));
    },
    /**
     */
    _refreshDirection: function () {
        this.popup_line_el.setAttribute('direction', this.direction);
    },
    /**
     */
    showPopup: function (is_show) {
        this.popup_line_el.setAttribute('show', String(is_show));
    }
});
S.Class('S.widget.addon.AddonAuthor', {
    $extends: 'S.widget.addon.Addon',
    /*
     */
    rendered: function () {
        this.$callParentMethod(arguments);
        this._addAPI();
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onRendered();
    },
    /**
     *
     */
    _addAPI: function () {
        var prop, API;
        if (this.type !== 'Input' && this.type !== 'XO') {
            API = this.question.__proto__.API;
            for (prop in API) {
                this[prop] = API[prop].bind(this.question);
            }
        }
    },
    /**
     *
     */
    changeDirection: function (direction) {
        this.direction = direction;
        this._refreshDirection();
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onDirectionChange();
    },
    /**
     *
     */
    getDirection: function () {
        return this.direction;
    },
    /**
     *
     */
    changeCorrectAnswer: function (data) {
        this.correct_answer = data;
        /* callback fot AuthoringTool */
        window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onCorrectAnswerChange();
    },
    /**
     *
     */
    getCorrectAnswer: function () {
        return this.correct_answer;
    }
});
S.Class('S.widget.addon.question.XO', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}"></div>'
    ],
    /**
     * @public
     */
    className: 'S-Addon-XO',
    answers_group: null,
    /**
     */
    rendered: function () {
        this._addButtons();
        this.$callParentMethod(arguments);
    },
    /**
     */
    _setStoreData: function () {
        var data = {
            self: {
                id: this.id
            },
            elements: S.core.DOM.getElementsIds(this)
        };
        data.answers_group = this.answers_group._setStoreData();
        return data;
    },
    /**
     */
    _addButtons: function () {
        this.answers_group = S.New('S.component.form.RadioButtonGroup', {
            store: this.store && this.store.answers_group,
            data: [
                {
                    className: 'S-RadioButton-Addon'
                    , image: '../../css/images/review_images/o_icon.png'
                }, {
                    className: 'S-RadioButton-Addon'
                    , image: '../../css/images/review_images/x_icon.png'
                }
            ],
            className: 'S-RadioButtonGroup-Addon',
            render_to: this.root_el,
            auto_render: true
          , onCheck: function (id) {
                this.onCheckAnswer && this.onCheckAnswer(id === 0 ? 'true' : 'false');
            }.bind(this)
        });
    }
});
S.Class('S.widget.addon.question.XOAuthor', {
    $extends: 'S.widget.addon.question.XO'
});
S.Class('S.widget.addon.question.Radio', {
    $extends: 'S.component.Component',
    _elements: [
        'root'
    ],
    _tpl: [
        '<div class="{className}-Container" id="{root_id}"></div>'
    ],
    /**
     * @public
     */
    className: 'S-Addon-RadioButtons',
    count: this.count,
    items: [],
    label_type: this.label_type, // 'number' or 'char'
    answers_group: null,
    /*
     */
    rendered: function () {
        this.createRadioGroup();
        this.$callParentMethod(arguments);
    },
    /**
     * @description
     */
    createRadioGroup: function () {
        var items = [], i;
        switch (this.label_type) {
            case 'number':
                for (i = 1; i <= this.count; i++) {
                    items.push({
                        className: 'S-RadioButton-Addon',
                        label: String(i)
                    });
                }
                break;
            case 'char':
                var a_CHAR_CODE = 96;
                for (i = 1; i <= this.count; i++) {
                    items.push({
                        className: 'S-RadioButton-Addon',
                        label: String.fromCharCode(a_CHAR_CODE + i)
                    });
                }
                break;
            default:
        }
        this.answers_group = S.New('S.component.form.RadioButtonGroup', {
            store: this.store && this.store.answers_group,
            className: 'S-RadioButtonGroup-Addon',
            data: items,
            render_to: this.root_el,
            auto_render: true,
            onCheck: function (id) {
                this.onCheckAnswer && this.onCheckAnswer(this.answers_group.items[id].label);
            }.bind(this)
        });
    },
    /**
     *
     */
    _setStoreData: function () {
        var data = {
            self: {
                id: this.id
            },
            elements: S.core.DOM.getElementsIds(this)
        };
        data.answers_group = this.answers_group._setStoreData();
        return data;
    }
});
S.Class('S.widget.addon.question.RadioAuthor', {
    $extends: 'S.widget.addon.question.Radio',
    API: {
        setCount: function (new_value) {
            var difference, i, a_CHAR_CODE = 97, buffer;
            if (new_value && new_value !== 0 && new_value !== this.count) {
                difference = new_value - this.count ;
                if (difference < 0) {
                    for (i = new_value; i < this.count; i++) {
                        this.group.root_el.removeChild(this.group.items[i].root_el);
                    }
                    this.group.items.splice(new_value, this.count -1);
                    this.count = new_value;
                    this.items = this.group.items;
                } else if (difference > 0) {
                    for (i = this.count; i < new_value; i++) {
                        switch(this.label_type) {
                            case 'number':
                                buffer = S.New('S.component.form.RadioButton', {
                                    className: 'S-RadioButton-Addon',
                                    label: String(i),
                                    render_to: this.group.root_el,
                                    auto_render: true
                                });
                                this.group.addItem(buffer);
                                this.count = new_value;
                                this.items = this.group.items;
                                break;
                            case 'char':
                                buffer = S.New('S.component.form.RadioButton', {
                                    className: 'S-RadioButton-Addon',
                                    label: String.fromCharCode(a_CHAR_CODE + i),
                                    render_to: this.group.root_el,
                                    auto_render: true
                                });
                                this.group.addItem(buffer);
                                this.count = new_value;
                                this.items = this.group.items;
                                break;
                            default:
                        }
                    }
                }
            }
            /* callback fot AuthoringTool */
            window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onCountSet();
        },
        /**
         *
         * @param new_value of label_type
         */
        setLabelType: function (new_value) {
            var i, a_CHAR_CODE = 97;
            switch (new_value) {
                case 'number' :
                    for (i = 0; i < this.group.items.length; i++) {
                        this.group.items[i].label_el.innerHTML = String((i+1));
                    }
                    this.label_type = 'number';
                    this.items = this.group.items;
                    break;
                case 'char' :
                    for (i = 0; i < this.group.items.length; i ++) {
                        this.group.items[i].label_el.innerHTML = String.fromCharCode(a_CHAR_CODE + i);
                    }
                    this.label_type = 'char';
                    this.items = this.group.items;
                    break;
                default:
            }
            /* callback fot AuthoringTool */
            window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onLabelTypeSet();
        },
        /**
         *
         */
        getLabelType: function () {
            return this.label_type;
        },
        /**
         *
         */
        getCount: function () {
            return this.count;
        }
    }
});

S.Class('S.widget.addon.question.Check', {
    $extends: 'S.component.Component',
    _elements: [
        'root',
        'answers'
    ],
    _tpl: [
        '<div class="{className}-Container" id="{root_id}"></div>'
    ],
    /**
     * @public
     */
    className: 'S-CheckBox',
    label_type: 'number',  //numbers or char
    count: 1,
    submit_button: null,
    /**
     */
    rendered: function () {
        this._makeSelfContent();
        this.$callParentMethod(arguments);
    },
    /**
     * @description 
     */
    _makeSelfContent: function () {
        var _this = this,
            items = [],
            a_CHAR_CODE, i;
        this.labels = [];
        if (this.label_type === 'char') {
            a_CHAR_CODE = 96;
            for (i = 1; i <= this.count; i++) {
                this.labels.push(String.fromCharCode(a_CHAR_CODE + i));
            }
        } else {
            for (i = 1; i <= this.count; i++) {
                this.labels.push(i + '');
            }
        }
        for (i = 0; i < this.count; i++) {
            items.push({
                label: this.labels[i],
                className: "S-checkBoxAddon"
            });
        }
        this.submit_button = S.New('S.component.ButtonPC', {
            store: this.store && this.store.button,
            render_to: this.root_el,
            auto_render: true,
            className: "S-CheckBoxGroupButtonAddon",
            innerHTML: 'OK',
            onClick: function () {
                var toSend, checked, current;
                if (_this.onCheckAnswer) {
                    toSend = [];
                    checked = _this.answers_group.getChecked();
                    for (current in checked) {
                        toSend.push(_this.labels[checked[current]]);
                    }
                    _this.onCheckAnswer(toSend);
                } else {
                    console.log('onCheckAnswer not defined in parent class')
                }
            }
        });
        this.answers_group = S.New('S.component.form.CheckBoxGroup', {
            store: this.store && this.store.answers_group,
            render_to: this.root_el,
            auto_render: true,
            className: "S-CheckBoxGroupAddon",
            data: items
        });
    },
    /**
     *
     */
    _setStoreData: function () {
        var data = {
            self: {
                id: this.id
            },
            elements: S.core.DOM.getElementsIds(this)
        };
        data.answers_group = this.answers_group._setStoreData();
        data.button = this.submit_button._setStoreData();
        return data;
    }
});







S.Class('S.widget.addon.question.CheckAuthor', {
    $extends: 'S.widget.addon.question.Check' ,
    API: {
        /**
         * @description
         * @param {String} label_type .Acceptable values: 'char' / 'number'
         */
        setLabelType: function (label_type) {
            if (typeof label_type !== 'undefined') {
                var i, a_CHAR_CODE;
                this.label_type = label_type;
                this.labels = [];
                if (label_type === 'char') {
                    a_CHAR_CODE = 96;
                    for (i = 1; i <= this.count; i++) {
                        this.labels.push(String.fromCharCode(a_CHAR_CODE + i));
                    }
                } else {
                    for (i = 1; i <= this.count; i++) {
                        this.labels.push(i+'');
                    }
                }
                for (i = 0; i < this.count; i++) {
                    this.answers_group.items[i].label = this.labels[i];
                    this.answers_group.items[i].label_el.innerHTML = this.labels[i];
                }
            }
            /* callback fot AuthoringTool */
            window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onLabelTypeSet();
        },
        /**
         * @description
         * @param new_count
         */
        setCount: function (new_count) {
            var old_count, i, a_CHAR_CODE;
            if (typeof(new_count) === 'number') {
                old_count = this.count;
                if (old_count > new_count) {
                    // delete from DOM
                    for (i = old_count-1; i >= new_count; i--) {
                        this.answers_group.root_el.removeChild(this.answers_group.items[i].root_el);
                    }
                    // delete links
                    this.answers_group.items = this.answers_group.items.slice(0, new_count);
                    // set new count and labels
                    this.labels = this.labels.slice(0, new_count);
                    this.count = new_count;

                } else {
                    //add new elements to labels
                    if (this.label_type === 'char') {
                        a_CHAR_CODE = 96;
                        for (i = old_count + 1; i <= new_count; i++) {
                            this.labels.push(String.fromCharCode(a_CHAR_CODE + i));
                        }
                    } else {
                        for (i = old_count + 1; i <= new_count; i++)
                            this.labels.push(i+'');
                    }
                    //making new elements
                    for (i = old_count + 1; i <= new_count; i++) {
                        var el = S.New('S.component.form.CheckBox', {
                            label: this.labels[i-1],
                            className: "S-checkBoxAddon",
                            render_to: this.answers_group.root_el,
                            auto_render: true
                        });
                        this.answers_group.items.push(el);
                        this.answers_group.root_el.appendChild(el.root_el);
                    }
                    //set new count
                    this.count = new_count;
                }
            }
            /* callback fot AuthoringTool */
            window["callback_" + this.dom_id] && window["callback_" + this.dom_id].onCountSet();
        },
        /**
         * @description
         */
        getLabelType: function () {
            return this.label_type;
        },
        /**
         * @description
         */
        getCount: function () {
            return this.count;
        }
    }
});
/**
 * @author Oleg Litosh
 * @class 'S.widget.interactive.Interactive'
 * @description interactive class for extension
 */
S.Class('S.widget.interactive.Interactive', {
    $requires: ['S.widget.Widget'],
    $extends: 'S.widget.Widget',
    /**
     * @protected
     * @property {array} _tpl - widget template
     */
    _tpl: []
});
S.Class('S.widget.interactive.BaseAuthor', {
    $requires: ['S.widget.interactive.Interactive'],
    $extends: 'S.widget.interactive.Interactive',
    _elements: [
        'root',
        'container',
        'image'
    ],
    _tpl: [
        '<div class="{className}" id="{root_id}" style="display:none">',
            '<div class="{className}-image-container" id="{container_id}">',
                '<div class="{className}-image-box" id="{image_id}" style="background-image: url({src}); background-size:{image_size};">',
                '</div>',
            '</div>',
        '</div>'
    ],
//    /* @protected
//     * @description object with original_image
//     */
    _image: null,
    _tooltips: [],
    _count: 0,
    _empty_inter: true,
    _coof:  null,
    _aviliable_move: false,
    _move_element: null,
    _move_center: null,
    _move_line: null,
//    
//    image_size: null,
      logo: null, // Logo path
      data: [],
      className: 'S-widget-interactive-Base',
      DOM: null,
      auto_render: true,
      render_to: null,
    
    
    /**
     * @protected
     * @method _initImage
     * @description initicialize object _image
     * @param {string} src of image
     */
    _initImage: function(src){
        var _this= this;
        _this._image= new Image();
        _this._image.src= src;
        _this.data.way= src;
    },
    
    /**
     * @protected
     * @method _resizeImage
     * @description set size of image 
     */
    _resizeImage: function(){
        var _this= this,
        width= _this._image.width,
        height= _this._image.height;
        if(width!=this.image_el.offsetWidth){
                _this._coof =this.image_el.offsetWidth/width;
                width =parseInt(width*_this._coof);
                height =parseInt(height*_this._coof);
        }
        _this.data.sizeW=width;
        _this.data.sizeH=height;
        _this.data.coof=_this._coof;
        _this.image_el.style.backgroundSize =""+width+"px "+height+"px";
    },
    
    /**
     * @protected
     * @method _addTooltip
     * @description adds tooltip and eventlistener to image
     */
    _addTooltip: function(){
        var _this= this,
        rotate,left,top,name,
        dot= document.createElement('div'),
        line= document.createElement('div'),
        tooltip= document.createElement('div');
        _this._count++;
        //create dot
        dot.className= _this.className+"-points";
        dot.id= 'point'+(_this._count); 
        dot.style.left= Math.round(this.image_el.offsetWidth/2)+"px";
        dot.style.top= Math.round(this.image_el.offsetHeight/2)+"px";
        dot.style.width= "6px";
        dot.style.height= "6px";
        //create line from dot to tooltip
        line.className= _this.className+"-points-line";
        line.id= 'line'+(_this._count);
        line.style.height= "100px";
        line.style.webkitTransformOrigin= "center "+(2)+"px";
        line.style.left= (parseInt(dot.style.left)+2)+"px";
        line.style.top= (parseInt(dot.style.top)+2)+"px";
        //create tooltip
        tooltip.className= _this.className+"-tooltips";
        tooltip.id= 'tooltip'+(_this._count);       
        tooltip.style.width= "80px";
        tooltip.style.height= "20px";
        tooltip.innerHTML= 'tooltip'+(_this._count);
        //drop to DOM
        _this.image_el.appendChild(line);
        _this.image_el.appendChild(tooltip);
        _this.image_el.appendChild(dot);
        
        if(_this._tooltips.length%4 == 3){
            rotate = 315;
            left = parseInt(dot.style.left) +71-40;
            top =  parseInt(dot.style.top)+71-10;
        } else  if(_this._tooltips.length%4 == 0){
            rotate = 45;
            left = parseInt(dot.style.left) -71-40;
            top =  parseInt(dot.style.top)+71-10;
        } else  if(_this._tooltips.length%4 == 2){
            rotate = 225;
            left = parseInt(dot.style.left) +71-40;
            top =  parseInt(dot.style.top)-71-10;
        } else  if(_this._tooltips.length%4 == 1){
            rotate = 135;
            left = parseInt(dot.style.left) -71-40;
            top =  parseInt(dot.style.top)-71-10;
        }

        line.style.webkitTransform = "rotate("+rotate+"deg)";
        tooltip.style.left = left + "px";
        tooltip.style.top = top + "px";
        _this._tooltips.push(tooltip);
        
        name= _this._count+'';
        _this.data.length+= 1;
        _this.data.points[name]=new Array(8);
        _this.data.points[name][0]= parseInt(dot.style.left);
        _this.data.points[name][1]= parseInt(dot.style.top);
        _this.data.points[name][2]= parseInt(line.style.height);
        _this.data.points[name][3]= rotate;
        _this.data.points[name][4]= left;
        _this.data.points[name][5]= top;
        _this.data.points[name][6]= tooltip.innerHTML;
        _this.data.points[name][7]= '';

        dot.addEventListener('mousedown', function(event){
            var_this= this,
            _this._initMove(event);
        }, false);
        
        tooltip.addEventListener('mousedown', function(event){
            var_this= this,
            _this._initMove(event);
        }, false);
        
        _this.image_el.onmouseup= function(event){
            event.stopPropagation();
            event.preventDefault();
            if(_this._aviliable_move){
                _this._aviliable_move= false;
                _this._move_element= null;
                _this._move_center= null;
                _this._move_line= null;
                
            }
        };
        _this.image_el.onmousemove= function(event){
            var left,top;
          if(_this._aviliable_move){
             left= event.target.offsetLeft+ event.offsetX;
             top= event.target.offsetTop+ event.offsetY;
             _this._move(left,top);
          }  
        };
        return tooltip.id;
    },
    
    /**
     * @protected
     * @method _removeTooltip
     * @description remove tooltip from image
     * @param {string} current id
     */
    _removeTooltip: function(id){
        var _this= this;
        num= id.replace(/[a-zA-Z]+/,''),
        line= 'line'+num;
        point= 'point'+num;
        for(var idx= 0;idx<_this._tooltips.length;idx++){
            if(_this._tooltips[idx].id == id){
                _this._tooltips.splice(idx,1);
                _this.image_el.removeChild(document.getElementById(id));
                _this.image_el.removeChild(document.getElementById(line));
                _this.image_el.removeChild(document.getElementById(point));
                _this.data.length-= 1;
                delete _this.data.points[num];
                return true;
            }
        }
        return false;
    },
    
    /**
     * @protected
     * @method _removeAll
     * @description remove All elements form image and remove image
     */
    _removeAll: function(){
        var _this= this;
        for(var idx= 0;idx<_this._tooltips.length;idx++){
                num= _this._tooltips[idx].id.replace(/[a-zA-Z]+/,'');
                line= 'line'+num;
                point= 'point'+num;
                _this.image_el.removeChild(document.getElementById(_this._tooltips[idx].id));
                _this.image_el.removeChild(document.getElementById(line));
                _this.image_el.removeChild(document.getElementById(point));
            }
        _this._tooltips= [];
        if (_this._empty_inter == false) {
            _this.image_el.style.backgroundImage= 'none';
            delete _this.data;
            _this._empty_inter = true;
        };
        if(_this._empty_inter){
            return true;
        }else{
            return false;
        };
    },
    /**
     * @protected
     * @method _initMove
     * @description initicialize object to move
     * @param {string} target element
     */
    _initMove: function(e){
        var _this= this,
        elem,
        num= e.target.id.replace(/[a-zA-Z]+/,''),
        line='line'+num;
        event.stopPropagation();
        event.preventDefault();
        if(e.target.id.indexOf('point')!=-1){
            elem= 'tooltip'+num;
        }else{
            elem= 'point'+num;
        }
        _this._aviliable_move = true;
        _this._move_element= e.target;
        _this._move_center= document.getElementById(elem);
        _this._move_line= document.getElementById(line);
    },
    
    /**
     * @protected
     * @method _move
     * @description move tooltip or point 
     * @param {int} new position X
     * @param {int} new position Y
     */
    _move: function(x,y){
        var _this= this,
        num,angleR,angleG,cos,
        rotateX= parseFloat(_this._move_center.style.left)+parseFloat(_this._move_center.style.width)/2,
        rotateY= parseFloat(_this._move_center.style.top)+parseFloat(_this._move_center.style.height)/2;
        
        _this._move_element.style.left = x-parseFloat(_this._move_element.style.width)/2 +1+ "px";
        _this._move_element.style.top = y-parseFloat(_this._move_element.style.height)/2 +2+ "px";
        _this._move_line.style.height = parseFloat(Math.sqrt(Math.pow(x - rotateX,2)
                                        + Math.pow(y - rotateY, 2))) + "px";
                                    
        cos= (x - rotateX)/ parseFloat(_this._move_line.style.height);
        if (rotateX < x && rotateY > y){
            QUARTER = "1";
            angleR = cos < 0 ? Math.acos(cos) : Math.PI- Math.acos(cos);
            angleG = angleR*(180/Math.PI)+90;

        } else if(rotateX > x && rotateY > y){
            QUARTER = "2";
            angleR = cos < 0 ? Math.acos(-cos) : Math.PI- Math.acos(cos);
            angleG = angleR*(180/Math.PI)+90;

        } else if (rotateX > x && rotateY < y){
            QUARTER = "3";
            angleR = cos < 0 ? Math.acos(cos) : Math.PI -Math.acos(cos);
            angleG = angleR*(180/Math.PI)-90;

        } else if (rotateX < x && rotateY < y){
            QUARTER = "4";
            angleR = cos < 0 ? Math.acos(cos) : Math.PI + Math.acos(cos);
            angleG = angleR*(180/Math.PI)+90;
        }
        if(_this._move_element.id.indexOf('point')!=-1){
            _this._move_line.style.left= x + "px";
            _this._move_line.style.top= y + "px";
            angleG+=180; 
            _this._move_line.style.webkitTransform = "rotate("+angleG+"deg)";
            num= _this._move_element.id.replace(/[a-zA-Z]+/,'');
            _this.data.points[num][0]= parseFloat(_this._move_element.style.left);
            _this.data.points[num][1]= parseFloat(_this._move_element.style.top);
            _this.data.points[num][2]= parseFloat(_this._move_line.style.height);
            _this.data.points[num][3]= (angleG);
        }else{
            _this._move_line.style.webkitTransform = "rotate("+angleG+"deg)";
            num= _this._move_element.id.replace(/[a-zA-Z]+/,'');
            _this.data.points[num][2]= parseFloat(_this._move_line.style.height);
            _this.data.points[num][3]= angleG;
            _this.data.points[num][4]= parseFloat(_this._move_element.style.left);
            _this.data.points[num][5]= parseFloat(_this._move_element.style.top);
        }
        
    },
    
    /**
    * @event
    * @description rendered event
    */
    rendered: function () {
//        this._showInteractiveImage();
//        this._addImage();
//        this._initTooltips();
    },

    showLogo: function(){
        if (this.root_el){
            this.root_el.style.display = 'none';
        }
        this.render_to.style.backgroundSize = 'auto auto';
        this.render_to.style.backgroundPosition = 'center';
        this.render_to.style.backgroundRepeat = 'no-repeat';
        this.render_to.style.backgroundImage = 'url(' + this.logo + ')';
        return this;
    },
    
    init: function () {
        this.root_id = this.dom_id + this._root_id_suffix;
        this.showLogo();
        this.$callParentMethod(arguments);
    },
    
    ///////////////////////////////////
    // H A N D L E R S   F O R   C # //
    ///////////////////////////////////
    
    /**
     * @public
     * @method addImage
     * @description add image to edit container
     * @param {string} src of image
     */
    addImage: function(src){
        var _this = this;
        if (_this._empty_inter == true) {
            _this.image_el.style.backgroundImage= 'none';
            this.render_to.style.backgroundImage= 'none';
            if (this.root_el) {
                this.root_el.style.display = 'block';
            }
            _this.data = new Object;
            _this.data.points = new Object;
            _this.data.length= 0;
            _this._empty_inter = false;
        }
        _this._initImage(src);
        _this.image_el.style.backgroundImage= 'url(' + src + ')';
        _this._resizeImage();
    },
    
    /**
     * @public
     * @method addTooltip
     * @description add tooltip to image
     */
    addTooltip: function(){
        var _this = this;
        return _this._addTooltip();
    },
    
    /**
     * @public
     * @method deleteTooltip
     * @description add tooltip to image
     */
    removeTooltip: function(id){
        var _this = this;
        return _this._removeTooltip(id);
    },
    
    /**
     * @public
     * @method deleteAll
     * @description clear widget
     */
    removeAll: function(){
        var _this = this;
        return _this._removeAll();
    },
    
    /**
     * @public
     * @method save
     * @description Rewrites script, run this when need save widget
     */
     save: function (){
        var _this= this;
        this._script_dom.innerHTML = [
            'S(function () {',
            'window.' + this.dom_id + ' = S.New("' + this.$namespace.slice(0, this.$namespace.indexOf('Author')) + '", {',
                'dom_id: "' + this.dom_id + '",',
                'interactive_caption: ' + JSON.stringify(this.interactive_caption) + ',',
                'data: ' + JSON.stringify(this.data) + ',',
                'logo: ' + JSON.stringify(this.logo) + ',',
               'launch_event: ' + JSON.stringify(this.launch_event) + '',
            '});',
            '});'
        ].join('');
    }
});
