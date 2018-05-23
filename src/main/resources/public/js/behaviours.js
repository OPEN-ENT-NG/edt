/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	var edtBehaviours_1 = __webpack_require__(86);
	entcore_1.Behaviours.register('edt', edtBehaviours_1.edtBehaviours);


/***/ }),
/* 1 */
/***/ (function(module, exports) {

	module.exports = entcore;

/***/ }),
/* 2 */,
/* 3 */,
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	// @DEPRECATED Ne pas utiliser l'object Collection
	__export(__webpack_require__(5));
	__export(__webpack_require__(46));
	__export(__webpack_require__(73));
	__export(__webpack_require__(74));
	__export(__webpack_require__(75));
	__export(__webpack_require__(76));
	__export(__webpack_require__(77));
	__export(__webpack_require__(78));
	__export(__webpack_require__(79));
	__export(__webpack_require__(80));
	__export(__webpack_require__(81));
	__export(__webpack_require__(82));


/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	var index_1 = __webpack_require__(4);
	var entcore_toolkit_1 = __webpack_require__(6);
	var Structure = (function () {
	    /**
	     * Structure constructor. Can take an id and a name in parameter
	     * @param id structure id
	     * @param name structure name
	     */
	    function Structure(id, name) {
	        this.eventer = new entcore_toolkit_1.Eventer();
	        if (typeof id === 'string') {
	            this.id = id;
	        }
	        if (typeof name === 'string') {
	            this.name = name;
	        }
	        this.subjects = new index_1.Subjects();
	        this.groups = new index_1.Groups();
	        this.courses = new index_1.Courses();
	        this.teachers = new index_1.Teachers();
	        if (entcore_1.model.me.type === index_1.USER_TYPES.relative) {
	            this.students = new index_1.Students();
	        }
	    }
	    /**
	     * Synchronize structure information. Groups and Subjects need to be synchronized to start courses
	     * synchronization.
	     * @returns {Promise<T>|Promise}
	     */
	    Structure.prototype.sync = function () {
	        var _this = this;
	        return new Promise(function (resolve, reject) {
	            var syncedCollections = {
	                subjects: false,
	                groups: false,
	                teachers: false,
	                students: entcore_1.model.me.type !== index_1.USER_TYPES.relative
	            };
	            var endSync = function () {
	                var _b = syncedCollections.subjects
	                    && syncedCollections.groups
	                    && syncedCollections.teachers
	                    && syncedCollections.students;
	                if (_b) {
	                    resolve();
	                    _this.eventer.trigger('refresh');
	                }
	            };
	            _this.subjects.sync(_this.id).then(function () { syncedCollections.subjects = true; endSync(); });
	            _this.groups.sync(_this.id).then(function () { syncedCollections.groups = true; endSync(); });
	            _this.teachers.sync(_this).then(function () { syncedCollections.teachers = true; endSync(); });
	            if (entcore_1.model.me.type === index_1.USER_TYPES.relative) {
	                _this.students.sync().then(function () { syncedCollections.students = true; endSync(); });
	            }
	        });
	    };
	    return Structure;
	}());
	exports.Structure = Structure;
	var Structures = (function () {
	    function Structures(arr) {
	        this.all = [];
	        if (arr instanceof Structure) {
	            this.all = arr;
	        }
	    }
	    Structures.prototype.sync = function () {
	        for (var i = 0; i < entcore_1.model.me.structures.length; i++) {
	            this.all.push(new Structure(entcore_1.model.me.structures[i], entcore_1.model.me.structureNames[i]));
	        }
	        return;
	    };
	    /**
	     * Returns first structure occurrence in the class
	     * @returns {Structure} first structure contained in 'all' array
	     */
	    Structures.prototype.first = function () {
	        return this.all[0];
	    };
	    return Structures;
	}());
	exports.Structures = Structures;


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(7));

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(8));
	__export(__webpack_require__(9));
	__export(__webpack_require__(10));
	__export(__webpack_require__(11));
	__export(__webpack_require__(44));
	__export(__webpack_require__(45));


/***/ }),
/* 8 */
/***/ (function(module, exports) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	function mapToArray(map) {
	    var result = [];
	    map.forEach(function (item) {
	        result.push(item);
	    });
	    return result;
	}
	var Mix = (function () {
	    function Mix() {
	    }
	    Mix.extend = function (obj, mixin, casts) {
	        var _loop_1 = function () {
	            var value = mixin[property];
	            if (casts && casts[property] && value) {
	                var castItem = casts[property];
	                var cast_1;
	                if (castItem instanceof Function) {
	                    cast_1 = {
	                        type: castItem,
	                        deps: []
	                    };
	                }
	                else {
	                    cast_1 = {
	                        type: castItem.type,
	                        single: castItem.single,
	                        deps: castItem.deps ? castItem.deps : []
	                    };
	                }
	                var doCast_1 = function (v) {
	                    var instance = new ((_a = cast_1.type).bind.apply(_a, [void 0].concat(cast_1.deps)))();
	                    if (instance.mixin)
	                        instance.mixin(v);
	                    else
	                        Mix.extend(instance, v);
	                    return instance;
	                    var _a;
	                };
	                if (value instanceof Array && cast_1.single) {
	                    obj[property] = [];
	                    value.forEach(function (v) {
	                        obj[property].push(doCast_1(v));
	                    });
	                }
	                else {
	                    obj[property] = doCast_1(value);
	                }
	            }
	            else if (!value || typeof value !== 'object' || value instanceof Array) {
	                obj[property] = value;
	            }
	            else {
	                if (obj[property] instanceof TypedArray) {
	                    obj[property].load(value);
	                }
	                else {
	                    if (!obj[property]) {
	                        obj[property] = {};
	                    }
	                    this_1.extend(obj[property], value);
	                }
	            }
	        };
	        var this_1 = this;
	        for (var property in mixin) {
	            _loop_1();
	        }
	        if (obj && obj.fromJSON) {
	            obj.fromJSON(mixin);
	        }
	    };
	    Mix.castAs = function (className, obj, params) {
	        if (params === void 0) { params = {}; }
	        var newObj = new className(params);
	        this.extend(newObj, obj);
	        return newObj;
	    };
	    Mix.castArrayAs = function (className, arr, params) {
	        if (params === void 0) { params = {}; }
	        var newArr = [];
	        arr.forEach(function (item) {
	            newArr.push(Mix.castAs(className, item, params));
	        });
	        return newArr;
	    };
	    return Mix;
	}());
	exports.Mix = Mix;
	var TypedArray = (function (_super) {
	    __extends(TypedArray, _super);
	    function TypedArray(className, mixin) {
	        if (mixin === void 0) { mixin = {}; }
	        var _this = _super.call(this) || this;
	        _this.className = className;
	        _this.mixin = mixin;
	        return _this;
	    }
	    TypedArray.prototype.push = function () {
	        var _this = this;
	        var items = [];
	        for (var _i = 0; _i < arguments.length; _i++) {
	            items[_i - 0] = arguments[_i];
	        }
	        items.forEach(function (item) {
	            if (!(item instanceof _this.className)) {
	                item = Mix.castAs(_this.className, item);
	            }
	            for (var prop in _this.mixin) {
	                item[prop] = _this.mixin[prop];
	            }
	            Array.prototype.push.call(_this, item);
	        });
	        return this.length;
	    };
	    TypedArray.prototype.load = function (data) {
	        var _this = this;
	        data.forEach(function (item) {
	            _this.push(item);
	        });
	    };
	    TypedArray.prototype.asArray = function () {
	        return mapToArray(this);
	    };
	    TypedArray.prototype.toJSON = function () {
	        return mapToArray(this);
	    };
	    return TypedArray;
	}(Array));
	exports.TypedArray = TypedArray;


/***/ }),
/* 9 */
/***/ (function(module, exports) {

	"use strict";
	var Eventer = (function () {
	    function Eventer() {
	        this.events = new Map();
	    }
	    Eventer.prototype.trigger = function (eventName, data) {
	        if (this.events[eventName]) {
	            this.events[eventName].forEach(function (f) { return f(data); });
	        }
	    };
	    Eventer.prototype.on = function (eventName, cb) {
	        if (!this.events[eventName]) {
	            this.events[eventName] = [];
	        }
	        this.events[eventName].push(cb);
	    };
	    Eventer.prototype.off = function (eventName, cb) {
	        if (!this.events[eventName]) {
	            return;
	        }
	        if (cb === undefined) {
	            this.events[eventName] = [];
	            return;
	        }
	        var index = this.events[eventName].indexOf(cb);
	        if (index !== -1) {
	            this.events[eventName].splice(index, 1);
	        }
	    };
	    Eventer.prototype.once = function (eventName, cb) {
	        var _this = this;
	        var callback = function (data) {
	            cb(data);
	            _this.off(eventName, callback);
	        };
	        this.on(eventName, callback);
	    };
	    return Eventer;
	}());
	exports.Eventer = Eventer;


/***/ }),
/* 10 */
/***/ (function(module, exports) {

	"use strict";
	var Selection = (function () {
	    function Selection(arr) {
	        this.arr = arr;
	        this.selectedElements = [];
	    }
	    Object.defineProperty(Selection.prototype, "all", {
	        get: function () {
	            return this.arr;
	        },
	        set: function (all) {
	            this.arr = all;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Selection.prototype.filter = function (filter) {
	        return this.arr.filter(filter);
	    };
	    Selection.prototype.push = function (item) {
	        this.arr.push(item);
	    };
	    Selection.prototype.addRange = function (arr) {
	        for (var i = 0; i < arr.length; i++) {
	            this.all.push(arr[i]);
	        }
	    };
	    Object.defineProperty(Selection.prototype, "colLength", {
	        get: function () {
	            return this.arr.length;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Object.defineProperty(Selection.prototype, "length", {
	        get: function () {
	            return this.selected.length;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    Selection.prototype.forEach = function (func) {
	        this.arr.forEach(func);
	    };
	    Selection.prototype.selectAll = function () {
	        for (var i = 0; i < this.arr.length; i++) {
	            this.arr[i].selected = true;
	        }
	    };
	    Selection.prototype.select = function (filter) {
	        for (var i = 0; i < this.arr.length; i++) {
	            this.arr[i].selected = filter(this.arr[i]);
	        }
	    };
	    Selection.prototype.deselect = function (filter) {
	        for (var i = 0; i < this.arr.length; i++) {
	            this.arr[i].selected = !filter(this.arr[i]);
	        }
	    };
	    Selection.prototype.deselectAll = function () {
	        for (var i = 0; i < this.arr.length; i++) {
	            this.arr[i].selected = false;
	        }
	    };
	    Selection.prototype.removeSelection = function () {
	        var newArr = [];
	        for (var i = 0; i < this.arr.length; i++) {
	            if (!this.arr[i].selected) {
	                newArr.push(this.arr[i]);
	            }
	        }
	        this.arr.splice(0, this.arr.length);
	        for (var i = 0; i < newArr.length; i++) {
	            this.arr.push(newArr[i]);
	        }
	    };
	    Selection.prototype.updateSelected = function () {
	        for (var i = 0; i < this.arr.length; i++) {
	            var index = this.selectedElements.indexOf(this.arr[i]);
	            if (this.arr[i].selected && index === -1) {
	                this.selectedElements.push(this.arr[i]);
	            }
	            else if (!this.arr[i].selected && index !== -1) {
	                this.selectedElements.splice(index, 1);
	            }
	        }
	        for (var i = 0; i < this.selectedElements.length; i++) {
	            var index = this.arr.indexOf(this.selectedElements[i]);
	            if (index === -1) {
	                this.selectedElements.splice(index, 1);
	            }
	        }
	    };
	    Object.defineProperty(Selection.prototype, "selected", {
	        // a specific array is maintained to avoid references breaking all the time
	        get: function () {
	            this.updateSelected();
	            return this.selectedElements;
	        },
	        enumerable: true,
	        configurable: true
	    });
	    return Selection;
	}());
	exports.Selection = Selection;


/***/ }),
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	__export(__webpack_require__(12));
	__export(__webpack_require__(13));
	__export(__webpack_require__(40));
	__export(__webpack_require__(41));
	__export(__webpack_require__(42));
	__export(__webpack_require__(43));


/***/ }),
/* 12 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var minicast_1 = __webpack_require__(8);
	var AbstractCrud = (function () {
	    function AbstractCrud(api, model, initialCast, childrenCasts, customMixin) {
	        this.api = api;
	        this.model = model;
	        this.initialCast = initialCast;
	        this.childrenCasts = childrenCasts;
	        this.customMixin = customMixin;
	    }
	    AbstractCrud.prototype.parseApi = function (api, parameters) {
	        var _this = this;
	        if (typeof api === 'function') {
	            api = api();
	        }
	        return api.split(/(:[a-zA-Z0-9_.]+)/)
	            .map(function (fragment) {
	            return fragment.charAt(0) === ':' ?
	                parameters && parameters[fragment.substr(1)] ||
	                    _this.model[fragment.substr(1)] ||
	                    _this[fragment.substr(1)] ||
	                    fragment :
	                fragment;
	        }).join('');
	    };
	    AbstractCrud.prototype.defaultMixin = function (payload) {
	        var _this = this;
	        if (payload instanceof Array && this.model instanceof Array) {
	            this.model = [];
	            var model_1 = this.model; //fix type inference
	            payload.forEach(function (item) {
	                var instance = {};
	                if (_this.initialCast) {
	                    if (_this.initialCast instanceof Function) {
	                        instance = new _this.initialCast();
	                    }
	                    else {
	                        instance = new ((_a = _this.initialCast.type).bind.apply(_a, [void 0].concat(_this.initialCast.deps)))();
	                    }
	                }
	                minicast_1.Mix.extend(instance, item, _this.childrenCasts);
	                model_1.push(instance);
	                var _a;
	            });
	        }
	        else {
	            minicast_1.Mix.extend(this.model, payload, this.childrenCasts);
	        }
	    };
	    AbstractCrud.prototype.create = function (item, opts) {
	        var _this = this;
	        if (opts === void 0) { opts = {}; }
	        if (!this.api.create) {
	            throw '[Crud][Api] "create" route is undefined';
	        }
	        return this.http.post(this.parseApi(this.api.create, item), item || this.model, opts)
	            .then(function (response) {
	            if (_this.model instanceof Array) {
	                _this.model.push(item);
	            }
	            return response;
	        });
	    };
	    AbstractCrud.prototype.sync = function (opts) {
	        var _this = this;
	        if (opts === void 0) { opts = {}; }
	        if (!this.api.sync) {
	            throw '[Crud][Api] "sync" route is undefined';
	        }
	        return this.http.get(this.parseApi(this.api.sync), opts)
	            .then(function (response) {
	            (_this.customMixin || _this.defaultMixin).bind(_this)(response.data);
	            return response;
	        });
	    };
	    AbstractCrud.prototype.update = function (item, opts) {
	        if (opts === void 0) { opts = {}; }
	        if (!this.api.update) {
	            throw '[Crud][Api] "update" route is undefined';
	        }
	        return this.http.put(this.parseApi(this.api.update, item), item || this.model, opts);
	    };
	    AbstractCrud.prototype.delete = function (item, opts) {
	        var _this = this;
	        if (opts === void 0) { opts = {}; }
	        if (!this.api.delete) {
	            throw '[Crud][Api] "delete" route is undefined';
	        }
	        return this.http.delete(this.parseApi(this.api.delete, item), opts)
	            .then(function (response) {
	            if (_this.model instanceof Array) {
	                _this.model.splice(_this.model.indexOf(item), 1);
	            }
	            return response;
	        });
	    };
	    return AbstractCrud;
	}());
	exports.AbstractCrud = AbstractCrud;


/***/ }),
/* 13 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var axios_1 = __webpack_require__(14);
	var abstract_crud_1 = __webpack_require__(12);
	var Crud = (function (_super) {
	    __extends(Crud, _super);
	    function Crud() {
	        var _this = _super.apply(this, arguments) || this;
	        _this.http = axios_1.default;
	        return _this;
	    }
	    return Crud;
	}(abstract_crud_1.AbstractCrud));
	exports.Crud = Crud;


/***/ }),
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(15);

/***/ }),
/* 15 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(16);
	var bind = __webpack_require__(17);
	var Axios = __webpack_require__(18);
	var defaults = __webpack_require__(19);
	
	/**
	 * Create an instance of Axios
	 *
	 * @param {Object} defaultConfig The default config for the instance
	 * @return {Axios} A new instance of Axios
	 */
	function createInstance(defaultConfig) {
	  var context = new Axios(defaultConfig);
	  var instance = bind(Axios.prototype.request, context);
	
	  // Copy axios.prototype to instance
	  utils.extend(instance, Axios.prototype, context);
	
	  // Copy context to instance
	  utils.extend(instance, context);
	
	  return instance;
	}
	
	// Create the default instance to be exported
	var axios = createInstance(defaults);
	
	// Expose Axios class to allow class inheritance
	axios.Axios = Axios;
	
	// Factory for creating new instances
	axios.create = function create(instanceConfig) {
	  return createInstance(utils.merge(defaults, instanceConfig));
	};
	
	// Expose Cancel & CancelToken
	axios.Cancel = __webpack_require__(37);
	axios.CancelToken = __webpack_require__(38);
	axios.isCancel = __webpack_require__(34);
	
	// Expose all/spread
	axios.all = function all(promises) {
	  return Promise.all(promises);
	};
	axios.spread = __webpack_require__(39);
	
	module.exports = axios;
	
	// Allow use of default import syntax in TypeScript
	module.exports.default = axios;


/***/ }),
/* 16 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var bind = __webpack_require__(17);
	
	/*global toString:true*/
	
	// utils is a library of generic helper functions non-specific to axios
	
	var toString = Object.prototype.toString;
	
	/**
	 * Determine if a value is an Array
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Array, otherwise false
	 */
	function isArray(val) {
	  return toString.call(val) === '[object Array]';
	}
	
	/**
	 * Determine if a value is an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
	 */
	function isArrayBuffer(val) {
	  return toString.call(val) === '[object ArrayBuffer]';
	}
	
	/**
	 * Determine if a value is a FormData
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an FormData, otherwise false
	 */
	function isFormData(val) {
	  return (typeof FormData !== 'undefined') && (val instanceof FormData);
	}
	
	/**
	 * Determine if a value is a view on an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	 */
	function isArrayBufferView(val) {
	  var result;
	  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
	    result = ArrayBuffer.isView(val);
	  } else {
	    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
	  }
	  return result;
	}
	
	/**
	 * Determine if a value is a String
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a String, otherwise false
	 */
	function isString(val) {
	  return typeof val === 'string';
	}
	
	/**
	 * Determine if a value is a Number
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Number, otherwise false
	 */
	function isNumber(val) {
	  return typeof val === 'number';
	}
	
	/**
	 * Determine if a value is undefined
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if the value is undefined, otherwise false
	 */
	function isUndefined(val) {
	  return typeof val === 'undefined';
	}
	
	/**
	 * Determine if a value is an Object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Object, otherwise false
	 */
	function isObject(val) {
	  return val !== null && typeof val === 'object';
	}
	
	/**
	 * Determine if a value is a Date
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Date, otherwise false
	 */
	function isDate(val) {
	  return toString.call(val) === '[object Date]';
	}
	
	/**
	 * Determine if a value is a File
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a File, otherwise false
	 */
	function isFile(val) {
	  return toString.call(val) === '[object File]';
	}
	
	/**
	 * Determine if a value is a Blob
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Blob, otherwise false
	 */
	function isBlob(val) {
	  return toString.call(val) === '[object Blob]';
	}
	
	/**
	 * Determine if a value is a Function
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Function, otherwise false
	 */
	function isFunction(val) {
	  return toString.call(val) === '[object Function]';
	}
	
	/**
	 * Determine if a value is a Stream
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Stream, otherwise false
	 */
	function isStream(val) {
	  return isObject(val) && isFunction(val.pipe);
	}
	
	/**
	 * Determine if a value is a URLSearchParams object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
	 */
	function isURLSearchParams(val) {
	  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
	}
	
	/**
	 * Trim excess whitespace off the beginning and end of a string
	 *
	 * @param {String} str The String to trim
	 * @returns {String} The String freed of excess whitespace
	 */
	function trim(str) {
	  return str.replace(/^\s*/, '').replace(/\s*$/, '');
	}
	
	/**
	 * Determine if we're running in a standard browser environment
	 *
	 * This allows axios to run in a web worker, and react-native.
	 * Both environments support XMLHttpRequest, but not fully standard globals.
	 *
	 * web workers:
	 *  typeof window -> undefined
	 *  typeof document -> undefined
	 *
	 * react-native:
	 *  typeof document.createElement -> undefined
	 */
	function isStandardBrowserEnv() {
	  return (
	    typeof window !== 'undefined' &&
	    typeof document !== 'undefined' &&
	    typeof document.createElement === 'function'
	  );
	}
	
	/**
	 * Iterate over an Array or an Object invoking a function for each item.
	 *
	 * If `obj` is an Array callback will be called passing
	 * the value, index, and complete array for each item.
	 *
	 * If 'obj' is an Object callback will be called passing
	 * the value, key, and complete object for each property.
	 *
	 * @param {Object|Array} obj The object to iterate
	 * @param {Function} fn The callback to invoke for each item
	 */
	function forEach(obj, fn) {
	  // Don't bother if no value provided
	  if (obj === null || typeof obj === 'undefined') {
	    return;
	  }
	
	  // Force an array if not already something iterable
	  if (typeof obj !== 'object' && !isArray(obj)) {
	    /*eslint no-param-reassign:0*/
	    obj = [obj];
	  }
	
	  if (isArray(obj)) {
	    // Iterate over array values
	    for (var i = 0, l = obj.length; i < l; i++) {
	      fn.call(null, obj[i], i, obj);
	    }
	  } else {
	    // Iterate over object keys
	    for (var key in obj) {
	      if (Object.prototype.hasOwnProperty.call(obj, key)) {
	        fn.call(null, obj[key], key, obj);
	      }
	    }
	  }
	}
	
	/**
	 * Accepts varargs expecting each argument to be an object, then
	 * immutably merges the properties of each object and returns result.
	 *
	 * When multiple objects contain the same key the later object in
	 * the arguments list will take precedence.
	 *
	 * Example:
	 *
	 * ```js
	 * var result = merge({foo: 123}, {foo: 456});
	 * console.log(result.foo); // outputs 456
	 * ```
	 *
	 * @param {Object} obj1 Object to merge
	 * @returns {Object} Result of all merge properties
	 */
	function merge(/* obj1, obj2, obj3, ... */) {
	  var result = {};
	  function assignValue(val, key) {
	    if (typeof result[key] === 'object' && typeof val === 'object') {
	      result[key] = merge(result[key], val);
	    } else {
	      result[key] = val;
	    }
	  }
	
	  for (var i = 0, l = arguments.length; i < l; i++) {
	    forEach(arguments[i], assignValue);
	  }
	  return result;
	}
	
	/**
	 * Extends object a by mutably adding to it the properties of object b.
	 *
	 * @param {Object} a The object to be extended
	 * @param {Object} b The object to copy properties from
	 * @param {Object} thisArg The object to bind function to
	 * @return {Object} The resulting value of object a
	 */
	function extend(a, b, thisArg) {
	  forEach(b, function assignValue(val, key) {
	    if (thisArg && typeof val === 'function') {
	      a[key] = bind(val, thisArg);
	    } else {
	      a[key] = val;
	    }
	  });
	  return a;
	}
	
	module.exports = {
	  isArray: isArray,
	  isArrayBuffer: isArrayBuffer,
	  isFormData: isFormData,
	  isArrayBufferView: isArrayBufferView,
	  isString: isString,
	  isNumber: isNumber,
	  isObject: isObject,
	  isUndefined: isUndefined,
	  isDate: isDate,
	  isFile: isFile,
	  isBlob: isBlob,
	  isFunction: isFunction,
	  isStream: isStream,
	  isURLSearchParams: isURLSearchParams,
	  isStandardBrowserEnv: isStandardBrowserEnv,
	  forEach: forEach,
	  merge: merge,
	  extend: extend,
	  trim: trim
	};


/***/ }),
/* 17 */
/***/ (function(module, exports) {

	'use strict';
	
	module.exports = function bind(fn, thisArg) {
	  return function wrap() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    return fn.apply(thisArg, args);
	  };
	};


/***/ }),
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var defaults = __webpack_require__(19);
	var utils = __webpack_require__(16);
	var InterceptorManager = __webpack_require__(31);
	var dispatchRequest = __webpack_require__(32);
	var isAbsoluteURL = __webpack_require__(35);
	var combineURLs = __webpack_require__(36);
	
	/**
	 * Create a new instance of Axios
	 *
	 * @param {Object} instanceConfig The default config for the instance
	 */
	function Axios(instanceConfig) {
	  this.defaults = instanceConfig;
	  this.interceptors = {
	    request: new InterceptorManager(),
	    response: new InterceptorManager()
	  };
	}
	
	/**
	 * Dispatch a request
	 *
	 * @param {Object} config The config specific for this request (merged with this.defaults)
	 */
	Axios.prototype.request = function request(config) {
	  /*eslint no-param-reassign:0*/
	  // Allow for axios('example/url'[, config]) a la fetch API
	  if (typeof config === 'string') {
	    config = utils.merge({
	      url: arguments[0]
	    }, arguments[1]);
	  }
	
	  config = utils.merge(defaults, this.defaults, { method: 'get' }, config);
	
	  // Support baseURL config
	  if (config.baseURL && !isAbsoluteURL(config.url)) {
	    config.url = combineURLs(config.baseURL, config.url);
	  }
	
	  // Hook up interceptors middleware
	  var chain = [dispatchRequest, undefined];
	  var promise = Promise.resolve(config);
	
	  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
	    chain.unshift(interceptor.fulfilled, interceptor.rejected);
	  });
	
	  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
	    chain.push(interceptor.fulfilled, interceptor.rejected);
	  });
	
	  while (chain.length) {
	    promise = promise.then(chain.shift(), chain.shift());
	  }
	
	  return promise;
	};
	
	// Provide aliases for supported request methods
	utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url
	    }));
	  };
	});
	
	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, data, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url,
	      data: data
	    }));
	  };
	});
	
	module.exports = Axios;


/***/ }),
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	var utils = __webpack_require__(16);
	var normalizeHeaderName = __webpack_require__(21);
	
	var PROTECTION_PREFIX = /^\)\]\}',?\n/;
	var DEFAULT_CONTENT_TYPE = {
	  'Content-Type': 'application/x-www-form-urlencoded'
	};
	
	function setContentTypeIfUnset(headers, value) {
	  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
	    headers['Content-Type'] = value;
	  }
	}
	
	function getDefaultAdapter() {
	  var adapter;
	  if (typeof XMLHttpRequest !== 'undefined') {
	    // For browsers use XHR adapter
	    adapter = __webpack_require__(22);
	  } else if (typeof process !== 'undefined') {
	    // For node use HTTP adapter
	    adapter = __webpack_require__(22);
	  }
	  return adapter;
	}
	
	var defaults = {
	  adapter: getDefaultAdapter(),
	
	  transformRequest: [function transformRequest(data, headers) {
	    normalizeHeaderName(headers, 'Content-Type');
	    if (utils.isFormData(data) ||
	      utils.isArrayBuffer(data) ||
	      utils.isStream(data) ||
	      utils.isFile(data) ||
	      utils.isBlob(data)
	    ) {
	      return data;
	    }
	    if (utils.isArrayBufferView(data)) {
	      return data.buffer;
	    }
	    if (utils.isURLSearchParams(data)) {
	      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
	      return data.toString();
	    }
	    if (utils.isObject(data)) {
	      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
	      return JSON.stringify(data);
	    }
	    return data;
	  }],
	
	  transformResponse: [function transformResponse(data) {
	    /*eslint no-param-reassign:0*/
	    if (typeof data === 'string') {
	      data = data.replace(PROTECTION_PREFIX, '');
	      try {
	        data = JSON.parse(data);
	      } catch (e) { /* Ignore */ }
	    }
	    return data;
	  }],
	
	  timeout: 0,
	
	  xsrfCookieName: 'XSRF-TOKEN',
	  xsrfHeaderName: 'X-XSRF-TOKEN',
	
	  maxContentLength: -1,
	
	  validateStatus: function validateStatus(status) {
	    return status >= 200 && status < 300;
	  }
	};
	
	defaults.headers = {
	  common: {
	    'Accept': 'application/json, text/plain, */*'
	  }
	};
	
	utils.forEach(['delete', 'get', 'head'], function forEachMehtodNoData(method) {
	  defaults.headers[method] = {};
	});
	
	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
	});
	
	module.exports = defaults;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(20)))

/***/ }),
/* 20 */
/***/ (function(module, exports) {

	// shim for using process in browser
	var process = module.exports = {};
	
	// cached from whatever global is present so that test runners that stub it
	// don't break things.  But we need to wrap it in a try catch in case it is
	// wrapped in strict mode code which doesn't define any globals.  It's inside a
	// function because try/catches deoptimize in certain engines.
	
	var cachedSetTimeout;
	var cachedClearTimeout;
	
	function defaultSetTimout() {
	    throw new Error('setTimeout has not been defined');
	}
	function defaultClearTimeout () {
	    throw new Error('clearTimeout has not been defined');
	}
	(function () {
	    try {
	        if (typeof setTimeout === 'function') {
	            cachedSetTimeout = setTimeout;
	        } else {
	            cachedSetTimeout = defaultSetTimout;
	        }
	    } catch (e) {
	        cachedSetTimeout = defaultSetTimout;
	    }
	    try {
	        if (typeof clearTimeout === 'function') {
	            cachedClearTimeout = clearTimeout;
	        } else {
	            cachedClearTimeout = defaultClearTimeout;
	        }
	    } catch (e) {
	        cachedClearTimeout = defaultClearTimeout;
	    }
	} ())
	function runTimeout(fun) {
	    if (cachedSetTimeout === setTimeout) {
	        //normal enviroments in sane situations
	        return setTimeout(fun, 0);
	    }
	    // if setTimeout wasn't available but was latter defined
	    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
	        cachedSetTimeout = setTimeout;
	        return setTimeout(fun, 0);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedSetTimeout(fun, 0);
	    } catch(e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
	            return cachedSetTimeout.call(null, fun, 0);
	        } catch(e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
	            return cachedSetTimeout.call(this, fun, 0);
	        }
	    }
	
	
	}
	function runClearTimeout(marker) {
	    if (cachedClearTimeout === clearTimeout) {
	        //normal enviroments in sane situations
	        return clearTimeout(marker);
	    }
	    // if clearTimeout wasn't available but was latter defined
	    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
	        cachedClearTimeout = clearTimeout;
	        return clearTimeout(marker);
	    }
	    try {
	        // when when somebody has screwed with setTimeout but no I.E. maddness
	        return cachedClearTimeout(marker);
	    } catch (e){
	        try {
	            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
	            return cachedClearTimeout.call(null, marker);
	        } catch (e){
	            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
	            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
	            return cachedClearTimeout.call(this, marker);
	        }
	    }
	
	
	
	}
	var queue = [];
	var draining = false;
	var currentQueue;
	var queueIndex = -1;
	
	function cleanUpNextTick() {
	    if (!draining || !currentQueue) {
	        return;
	    }
	    draining = false;
	    if (currentQueue.length) {
	        queue = currentQueue.concat(queue);
	    } else {
	        queueIndex = -1;
	    }
	    if (queue.length) {
	        drainQueue();
	    }
	}
	
	function drainQueue() {
	    if (draining) {
	        return;
	    }
	    var timeout = runTimeout(cleanUpNextTick);
	    draining = true;
	
	    var len = queue.length;
	    while(len) {
	        currentQueue = queue;
	        queue = [];
	        while (++queueIndex < len) {
	            if (currentQueue) {
	                currentQueue[queueIndex].run();
	            }
	        }
	        queueIndex = -1;
	        len = queue.length;
	    }
	    currentQueue = null;
	    draining = false;
	    runClearTimeout(timeout);
	}
	
	process.nextTick = function (fun) {
	    var args = new Array(arguments.length - 1);
	    if (arguments.length > 1) {
	        for (var i = 1; i < arguments.length; i++) {
	            args[i - 1] = arguments[i];
	        }
	    }
	    queue.push(new Item(fun, args));
	    if (queue.length === 1 && !draining) {
	        runTimeout(drainQueue);
	    }
	};
	
	// v8 likes predictible objects
	function Item(fun, array) {
	    this.fun = fun;
	    this.array = array;
	}
	Item.prototype.run = function () {
	    this.fun.apply(null, this.array);
	};
	process.title = 'browser';
	process.browser = true;
	process.env = {};
	process.argv = [];
	process.version = ''; // empty string to avoid regexp issues
	process.versions = {};
	
	function noop() {}
	
	process.on = noop;
	process.addListener = noop;
	process.once = noop;
	process.off = noop;
	process.removeListener = noop;
	process.removeAllListeners = noop;
	process.emit = noop;
	process.prependListener = noop;
	process.prependOnceListener = noop;
	
	process.listeners = function (name) { return [] }
	
	process.binding = function (name) {
	    throw new Error('process.binding is not supported');
	};
	
	process.cwd = function () { return '/' };
	process.chdir = function (dir) {
	    throw new Error('process.chdir is not supported');
	};
	process.umask = function() { return 0; };


/***/ }),
/* 21 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(16);
	
	module.exports = function normalizeHeaderName(headers, normalizedName) {
	  utils.forEach(headers, function processHeader(value, name) {
	    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
	      headers[normalizedName] = value;
	      delete headers[name];
	    }
	  });
	};


/***/ }),
/* 22 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	var utils = __webpack_require__(16);
	var settle = __webpack_require__(23);
	var buildURL = __webpack_require__(26);
	var parseHeaders = __webpack_require__(27);
	var isURLSameOrigin = __webpack_require__(28);
	var createError = __webpack_require__(24);
	var btoa = (typeof window !== 'undefined' && window.btoa && window.btoa.bind(window)) || __webpack_require__(29);
	
	module.exports = function xhrAdapter(config) {
	  return new Promise(function dispatchXhrRequest(resolve, reject) {
	    var requestData = config.data;
	    var requestHeaders = config.headers;
	
	    if (utils.isFormData(requestData)) {
	      delete requestHeaders['Content-Type']; // Let the browser set it
	    }
	
	    var request = new XMLHttpRequest();
	    var loadEvent = 'onreadystatechange';
	    var xDomain = false;
	
	    // For IE 8/9 CORS support
	    // Only supports POST and GET calls and doesn't returns the response headers.
	    // DON'T do this for testing b/c XMLHttpRequest is mocked, not XDomainRequest.
	    if (process.env.NODE_ENV !== 'test' &&
	        typeof window !== 'undefined' &&
	        window.XDomainRequest && !('withCredentials' in request) &&
	        !isURLSameOrigin(config.url)) {
	      request = new window.XDomainRequest();
	      loadEvent = 'onload';
	      xDomain = true;
	      request.onprogress = function handleProgress() {};
	      request.ontimeout = function handleTimeout() {};
	    }
	
	    // HTTP basic authentication
	    if (config.auth) {
	      var username = config.auth.username || '';
	      var password = config.auth.password || '';
	      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
	    }
	
	    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);
	
	    // Set the request timeout in MS
	    request.timeout = config.timeout;
	
	    // Listen for ready state
	    request[loadEvent] = function handleLoad() {
	      if (!request || (request.readyState !== 4 && !xDomain)) {
	        return;
	      }
	
	      // The request errored out and we didn't get a response, this will be
	      // handled by onerror instead
	      // With one exception: request that using file: protocol, most browsers
	      // will return status as 0 even though it's a successful request
	      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
	        return;
	      }
	
	      // Prepare the response
	      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
	      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
	      var response = {
	        data: responseData,
	        // IE sends 1223 instead of 204 (https://github.com/mzabriskie/axios/issues/201)
	        status: request.status === 1223 ? 204 : request.status,
	        statusText: request.status === 1223 ? 'No Content' : request.statusText,
	        headers: responseHeaders,
	        config: config,
	        request: request
	      };
	
	      settle(resolve, reject, response);
	
	      // Clean up request
	      request = null;
	    };
	
	    // Handle low level network errors
	    request.onerror = function handleError() {
	      // Real errors are hidden from us by the browser
	      // onerror should only fire if it's a network error
	      reject(createError('Network Error', config));
	
	      // Clean up request
	      request = null;
	    };
	
	    // Handle timeout
	    request.ontimeout = function handleTimeout() {
	      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED'));
	
	      // Clean up request
	      request = null;
	    };
	
	    // Add xsrf header
	    // This is only done if running in a standard browser environment.
	    // Specifically not if we're in a web worker, or react-native.
	    if (utils.isStandardBrowserEnv()) {
	      var cookies = __webpack_require__(30);
	
	      // Add xsrf header
	      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
	          cookies.read(config.xsrfCookieName) :
	          undefined;
	
	      if (xsrfValue) {
	        requestHeaders[config.xsrfHeaderName] = xsrfValue;
	      }
	    }
	
	    // Add headers to the request
	    if ('setRequestHeader' in request) {
	      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
	        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
	          // Remove Content-Type if data is undefined
	          delete requestHeaders[key];
	        } else {
	          // Otherwise add header to the request
	          request.setRequestHeader(key, val);
	        }
	      });
	    }
	
	    // Add withCredentials to request if needed
	    if (config.withCredentials) {
	      request.withCredentials = true;
	    }
	
	    // Add responseType to request if needed
	    if (config.responseType) {
	      try {
	        request.responseType = config.responseType;
	      } catch (e) {
	        if (request.responseType !== 'json') {
	          throw e;
	        }
	      }
	    }
	
	    // Handle progress if needed
	    if (typeof config.onDownloadProgress === 'function') {
	      request.addEventListener('progress', config.onDownloadProgress);
	    }
	
	    // Not all browsers support upload events
	    if (typeof config.onUploadProgress === 'function' && request.upload) {
	      request.upload.addEventListener('progress', config.onUploadProgress);
	    }
	
	    if (config.cancelToken) {
	      // Handle cancellation
	      config.cancelToken.promise.then(function onCanceled(cancel) {
	        if (!request) {
	          return;
	        }
	
	        request.abort();
	        reject(cancel);
	        // Clean up request
	        request = null;
	      });
	    }
	
	    if (requestData === undefined) {
	      requestData = null;
	    }
	
	    // Send the request
	    request.send(requestData);
	  });
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(20)))

/***/ }),
/* 23 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var createError = __webpack_require__(24);
	
	/**
	 * Resolve or reject a Promise based on response status.
	 *
	 * @param {Function} resolve A function that resolves the promise.
	 * @param {Function} reject A function that rejects the promise.
	 * @param {object} response The response.
	 */
	module.exports = function settle(resolve, reject, response) {
	  var validateStatus = response.config.validateStatus;
	  // Note: status is not exposed by XDomainRequest
	  if (!response.status || !validateStatus || validateStatus(response.status)) {
	    resolve(response);
	  } else {
	    reject(createError(
	      'Request failed with status code ' + response.status,
	      response.config,
	      null,
	      response
	    ));
	  }
	};


/***/ }),
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var enhanceError = __webpack_require__(25);
	
	/**
	 * Create an Error with the specified message, config, error code, and response.
	 *
	 * @param {string} message The error message.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 @ @param {Object} [response] The response.
	 * @returns {Error} The created error.
	 */
	module.exports = function createError(message, config, code, response) {
	  var error = new Error(message);
	  return enhanceError(error, config, code, response);
	};


/***/ }),
/* 25 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Update an Error with the specified config, error code, and response.
	 *
	 * @param {Error} error The error to update.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 @ @param {Object} [response] The response.
	 * @returns {Error} The error.
	 */
	module.exports = function enhanceError(error, config, code, response) {
	  error.config = config;
	  if (code) {
	    error.code = code;
	  }
	  error.response = response;
	  return error;
	};


/***/ }),
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(16);
	
	function encode(val) {
	  return encodeURIComponent(val).
	    replace(/%40/gi, '@').
	    replace(/%3A/gi, ':').
	    replace(/%24/g, '$').
	    replace(/%2C/gi, ',').
	    replace(/%20/g, '+').
	    replace(/%5B/gi, '[').
	    replace(/%5D/gi, ']');
	}
	
	/**
	 * Build a URL by appending params to the end
	 *
	 * @param {string} url The base of the url (e.g., http://www.google.com)
	 * @param {object} [params] The params to be appended
	 * @returns {string} The formatted url
	 */
	module.exports = function buildURL(url, params, paramsSerializer) {
	  /*eslint no-param-reassign:0*/
	  if (!params) {
	    return url;
	  }
	
	  var serializedParams;
	  if (paramsSerializer) {
	    serializedParams = paramsSerializer(params);
	  } else if (utils.isURLSearchParams(params)) {
	    serializedParams = params.toString();
	  } else {
	    var parts = [];
	
	    utils.forEach(params, function serialize(val, key) {
	      if (val === null || typeof val === 'undefined') {
	        return;
	      }
	
	      if (utils.isArray(val)) {
	        key = key + '[]';
	      }
	
	      if (!utils.isArray(val)) {
	        val = [val];
	      }
	
	      utils.forEach(val, function parseValue(v) {
	        if (utils.isDate(v)) {
	          v = v.toISOString();
	        } else if (utils.isObject(v)) {
	          v = JSON.stringify(v);
	        }
	        parts.push(encode(key) + '=' + encode(v));
	      });
	    });
	
	    serializedParams = parts.join('&');
	  }
	
	  if (serializedParams) {
	    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
	  }
	
	  return url;
	};


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(16);
	
	/**
	 * Parse headers into an object
	 *
	 * ```
	 * Date: Wed, 27 Aug 2014 08:58:49 GMT
	 * Content-Type: application/json
	 * Connection: keep-alive
	 * Transfer-Encoding: chunked
	 * ```
	 *
	 * @param {String} headers Headers needing to be parsed
	 * @returns {Object} Headers parsed into an object
	 */
	module.exports = function parseHeaders(headers) {
	  var parsed = {};
	  var key;
	  var val;
	  var i;
	
	  if (!headers) { return parsed; }
	
	  utils.forEach(headers.split('\n'), function parser(line) {
	    i = line.indexOf(':');
	    key = utils.trim(line.substr(0, i)).toLowerCase();
	    val = utils.trim(line.substr(i + 1));
	
	    if (key) {
	      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
	    }
	  });
	
	  return parsed;
	};


/***/ }),
/* 28 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(16);
	
	module.exports = (
	  utils.isStandardBrowserEnv() ?
	
	  // Standard browser envs have full support of the APIs needed to test
	  // whether the request URL is of the same origin as current location.
	  (function standardBrowserEnv() {
	    var msie = /(msie|trident)/i.test(navigator.userAgent);
	    var urlParsingNode = document.createElement('a');
	    var originURL;
	
	    /**
	    * Parse a URL to discover it's components
	    *
	    * @param {String} url The URL to be parsed
	    * @returns {Object}
	    */
	    function resolveURL(url) {
	      var href = url;
	
	      if (msie) {
	        // IE needs attribute set twice to normalize properties
	        urlParsingNode.setAttribute('href', href);
	        href = urlParsingNode.href;
	      }
	
	      urlParsingNode.setAttribute('href', href);
	
	      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
	      return {
	        href: urlParsingNode.href,
	        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
	        host: urlParsingNode.host,
	        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
	        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
	        hostname: urlParsingNode.hostname,
	        port: urlParsingNode.port,
	        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
	                  urlParsingNode.pathname :
	                  '/' + urlParsingNode.pathname
	      };
	    }
	
	    originURL = resolveURL(window.location.href);
	
	    /**
	    * Determine if a URL shares the same origin as the current location
	    *
	    * @param {String} requestURL The URL to test
	    * @returns {boolean} True if URL shares the same origin, otherwise false
	    */
	    return function isURLSameOrigin(requestURL) {
	      var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
	      return (parsed.protocol === originURL.protocol &&
	            parsed.host === originURL.host);
	    };
	  })() :
	
	  // Non standard browser envs (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return function isURLSameOrigin() {
	      return true;
	    };
	  })()
	);


/***/ }),
/* 29 */
/***/ (function(module, exports) {

	'use strict';
	
	// btoa polyfill for IE<10 courtesy https://github.com/davidchambers/Base64.js
	
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	
	function E() {
	  this.message = 'String contains an invalid character';
	}
	E.prototype = new Error;
	E.prototype.code = 5;
	E.prototype.name = 'InvalidCharacterError';
	
	function btoa(input) {
	  var str = String(input);
	  var output = '';
	  for (
	    // initialize result and counter
	    var block, charCode, idx = 0, map = chars;
	    // if the next str index does not exist:
	    //   change the mapping table to "="
	    //   check if d has no fractional digits
	    str.charAt(idx | 0) || (map = '=', idx % 1);
	    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
	    output += map.charAt(63 & block >> 8 - idx % 1 * 8)
	  ) {
	    charCode = str.charCodeAt(idx += 3 / 4);
	    if (charCode > 0xFF) {
	      throw new E();
	    }
	    block = block << 8 | charCode;
	  }
	  return output;
	}
	
	module.exports = btoa;


/***/ }),
/* 30 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(16);
	
	module.exports = (
	  utils.isStandardBrowserEnv() ?
	
	  // Standard browser envs support document.cookie
	  (function standardBrowserEnv() {
	    return {
	      write: function write(name, value, expires, path, domain, secure) {
	        var cookie = [];
	        cookie.push(name + '=' + encodeURIComponent(value));
	
	        if (utils.isNumber(expires)) {
	          cookie.push('expires=' + new Date(expires).toGMTString());
	        }
	
	        if (utils.isString(path)) {
	          cookie.push('path=' + path);
	        }
	
	        if (utils.isString(domain)) {
	          cookie.push('domain=' + domain);
	        }
	
	        if (secure === true) {
	          cookie.push('secure');
	        }
	
	        document.cookie = cookie.join('; ');
	      },
	
	      read: function read(name) {
	        var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
	        return (match ? decodeURIComponent(match[3]) : null);
	      },
	
	      remove: function remove(name) {
	        this.write(name, '', Date.now() - 86400000);
	      }
	    };
	  })() :
	
	  // Non standard browser env (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return {
	      write: function write() {},
	      read: function read() { return null; },
	      remove: function remove() {}
	    };
	  })()
	);


/***/ }),
/* 31 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(16);
	
	function InterceptorManager() {
	  this.handlers = [];
	}
	
	/**
	 * Add a new interceptor to the stack
	 *
	 * @param {Function} fulfilled The function to handle `then` for a `Promise`
	 * @param {Function} rejected The function to handle `reject` for a `Promise`
	 *
	 * @return {Number} An ID used to remove interceptor later
	 */
	InterceptorManager.prototype.use = function use(fulfilled, rejected) {
	  this.handlers.push({
	    fulfilled: fulfilled,
	    rejected: rejected
	  });
	  return this.handlers.length - 1;
	};
	
	/**
	 * Remove an interceptor from the stack
	 *
	 * @param {Number} id The ID that was returned by `use`
	 */
	InterceptorManager.prototype.eject = function eject(id) {
	  if (this.handlers[id]) {
	    this.handlers[id] = null;
	  }
	};
	
	/**
	 * Iterate over all the registered interceptors
	 *
	 * This method is particularly useful for skipping over any
	 * interceptors that may have become `null` calling `eject`.
	 *
	 * @param {Function} fn The function to call for each interceptor
	 */
	InterceptorManager.prototype.forEach = function forEach(fn) {
	  utils.forEach(this.handlers, function forEachHandler(h) {
	    if (h !== null) {
	      fn(h);
	    }
	  });
	};
	
	module.exports = InterceptorManager;


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(16);
	var transformData = __webpack_require__(33);
	var isCancel = __webpack_require__(34);
	var defaults = __webpack_require__(19);
	
	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	function throwIfCancellationRequested(config) {
	  if (config.cancelToken) {
	    config.cancelToken.throwIfRequested();
	  }
	}
	
	/**
	 * Dispatch a request to the server using the configured adapter.
	 *
	 * @param {object} config The config that is to be used for the request
	 * @returns {Promise} The Promise to be fulfilled
	 */
	module.exports = function dispatchRequest(config) {
	  throwIfCancellationRequested(config);
	
	  // Ensure headers exist
	  config.headers = config.headers || {};
	
	  // Transform request data
	  config.data = transformData(
	    config.data,
	    config.headers,
	    config.transformRequest
	  );
	
	  // Flatten headers
	  config.headers = utils.merge(
	    config.headers.common || {},
	    config.headers[config.method] || {},
	    config.headers || {}
	  );
	
	  utils.forEach(
	    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
	    function cleanHeaderConfig(method) {
	      delete config.headers[method];
	    }
	  );
	
	  var adapter = config.adapter || defaults.adapter;
	
	  return adapter(config).then(function onAdapterResolution(response) {
	    throwIfCancellationRequested(config);
	
	    // Transform response data
	    response.data = transformData(
	      response.data,
	      response.headers,
	      config.transformResponse
	    );
	
	    return response;
	  }, function onAdapterRejection(reason) {
	    if (!isCancel(reason)) {
	      throwIfCancellationRequested(config);
	
	      // Transform response data
	      if (reason && reason.response) {
	        reason.response.data = transformData(
	          reason.response.data,
	          reason.response.headers,
	          config.transformResponse
	        );
	      }
	    }
	
	    return Promise.reject(reason);
	  });
	};


/***/ }),
/* 33 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(16);
	
	/**
	 * Transform the data for a request or a response
	 *
	 * @param {Object|String} data The data to be transformed
	 * @param {Array} headers The headers for the request or response
	 * @param {Array|Function} fns A single function or Array of functions
	 * @returns {*} The resulting transformed data
	 */
	module.exports = function transformData(data, headers, fns) {
	  /*eslint no-param-reassign:0*/
	  utils.forEach(fns, function transform(fn) {
	    data = fn(data, headers);
	  });
	
	  return data;
	};


/***/ }),
/* 34 */
/***/ (function(module, exports) {

	'use strict';
	
	module.exports = function isCancel(value) {
	  return !!(value && value.__CANCEL__);
	};


/***/ }),
/* 35 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Determines whether the specified URL is absolute
	 *
	 * @param {string} url The URL to test
	 * @returns {boolean} True if the specified URL is absolute, otherwise false
	 */
	module.exports = function isAbsoluteURL(url) {
	  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
	  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
	  // by any combination of letters, digits, plus, period, or hyphen.
	  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
	};


/***/ }),
/* 36 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Creates a new URL by combining the specified URLs
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} relativeURL The relative URL
	 * @returns {string} The combined URL
	 */
	module.exports = function combineURLs(baseURL, relativeURL) {
	  return baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '');
	};


/***/ }),
/* 37 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * A `Cancel` is an object that is thrown when an operation is canceled.
	 *
	 * @class
	 * @param {string=} message The message.
	 */
	function Cancel(message) {
	  this.message = message;
	}
	
	Cancel.prototype.toString = function toString() {
	  return 'Cancel' + (this.message ? ': ' + this.message : '');
	};
	
	Cancel.prototype.__CANCEL__ = true;
	
	module.exports = Cancel;


/***/ }),
/* 38 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var Cancel = __webpack_require__(37);
	
	/**
	 * A `CancelToken` is an object that can be used to request cancellation of an operation.
	 *
	 * @class
	 * @param {Function} executor The executor function.
	 */
	function CancelToken(executor) {
	  if (typeof executor !== 'function') {
	    throw new TypeError('executor must be a function.');
	  }
	
	  var resolvePromise;
	  this.promise = new Promise(function promiseExecutor(resolve) {
	    resolvePromise = resolve;
	  });
	
	  var token = this;
	  executor(function cancel(message) {
	    if (token.reason) {
	      // Cancellation has already been requested
	      return;
	    }
	
	    token.reason = new Cancel(message);
	    resolvePromise(token.reason);
	  });
	}
	
	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	CancelToken.prototype.throwIfRequested = function throwIfRequested() {
	  if (this.reason) {
	    throw this.reason;
	  }
	};
	
	/**
	 * Returns an object that contains a new `CancelToken` and a function that, when called,
	 * cancels the `CancelToken`.
	 */
	CancelToken.source = function source() {
	  var cancel;
	  var token = new CancelToken(function executor(c) {
	    cancel = c;
	  });
	  return {
	    token: token,
	    cancel: cancel
	  };
	};
	
	module.exports = CancelToken;


/***/ }),
/* 39 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Syntactic sugar for invoking a function and expanding an array for arguments.
	 *
	 * Common use case would be to use `Function.prototype.apply`.
	 *
	 *  ```js
	 *  function f(x, y, z) {}
	 *  var args = [1, 2, 3];
	 *  f.apply(null, args);
	 *  ```
	 *
	 * With `spread` this example can be re-written.
	 *
	 *  ```js
	 *  spread(function(x, y, z) {})([1, 2, 3]);
	 *  ```
	 *
	 * @param {Function} callback
	 * @returns {Function}
	 */
	module.exports = function spread(callback) {
	  return function wrap(arr) {
	    return callback.apply(null, arr);
	  };
	};


/***/ }),
/* 40 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var abstract_crud_1 = __webpack_require__(12);
	var minicast_1 = __webpack_require__(8);
	var AbstractCollection = (function (_super) {
	    __extends(AbstractCollection, _super);
	    function AbstractCollection(api, initialCast, childrenCasts) {
	        var _this = _super.call(this, api, null, initialCast, childrenCasts) || this;
	        _this.data = [];
	        _this.model = _this.data;
	        _this.customMixin = _this.mixin;
	        return _this;
	    }
	    AbstractCollection.prototype.mixin = function (data) {
	        var _this = this;
	        if (!data || !(data instanceof Array)) {
	            throw "[Crud][Collection] An Array payload is expected.";
	        }
	        this.data = [];
	        data.forEach(function (item) {
	            var instance = {};
	            if (_this.initialCast) {
	                if (_this.initialCast instanceof Function) {
	                    instance = new _this.initialCast();
	                }
	                else {
	                    instance = new ((_a = _this.initialCast.type).bind.apply(_a, [void 0].concat(_this.initialCast.deps)))();
	                }
	            }
	            minicast_1.Mix.extend(instance, item, _this.childrenCasts);
	            _this.data.push(instance);
	            var _a;
	        });
	    };
	    return AbstractCollection;
	}(abstract_crud_1.AbstractCrud));
	exports.AbstractCollection = AbstractCollection;


/***/ }),
/* 41 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var axios_1 = __webpack_require__(14);
	var abstract_collection_1 = __webpack_require__(40);
	var Collection = (function (_super) {
	    __extends(Collection, _super);
	    function Collection(api, initialCast, childrenCasts) {
	        var _this = _super.call(this, api, initialCast, childrenCasts) || this;
	        _this.http = axios_1.default;
	        return _this;
	    }
	    return Collection;
	}(abstract_collection_1.AbstractCollection));
	exports.Collection = Collection;


/***/ }),
/* 42 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var abstract_crud_1 = __webpack_require__(12);
	var minicast_1 = __webpack_require__(8);
	var AbstractModel = (function (_super) {
	    __extends(AbstractModel, _super);
	    function AbstractModel(api, childrenCasts) {
	        var _this = _super.call(this, api, null, null, childrenCasts) || this;
	        _this.model = _this;
	        _this.customMixin = _this.mixin;
	        return _this;
	    }
	    AbstractModel.prototype.mixin = function (data) {
	        if (!data || !(data instanceof Object)) {
	            throw "[Crud][Collection] An Object payload is expected.";
	        }
	        minicast_1.Mix.extend(this, data, this.childrenCasts);
	    };
	    return AbstractModel;
	}(abstract_crud_1.AbstractCrud));
	exports.AbstractModel = AbstractModel;


/***/ }),
/* 43 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __extends = (this && this.__extends) || function (d, b) {
	    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
	    function __() { this.constructor = d; }
	    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
	};
	var axios_1 = __webpack_require__(14);
	var abstract_model_1 = __webpack_require__(42);
	var Model = (function (_super) {
	    __extends(Model, _super);
	    function Model(api, childrenCasts) {
	        var _this = _super.call(this, api, childrenCasts) || this;
	        _this.http = axios_1.default;
	        return _this;
	    }
	    return Model;
	}(abstract_model_1.AbstractModel));
	exports.Model = Model;


/***/ }),
/* 44 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments)).next());
	    });
	};
	var __generator = (this && this.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t;
	    return { next: verb(0), "throw": verb(1), "return": verb(2) };
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	var eventer_1 = __webpack_require__(9);
	var minicast_1 = __webpack_require__(8);
	var axios_1 = __webpack_require__(14);
	/*
	 * Tool to manage a single list provider used by multiple objects (to avoid multiple call to a same path)
	 * Usage :
	 * let provider = new Provider<T>(path, MyClass);
	 * function a(){
	 *    //get data from provider
	 *    let data = await provider.data();
	 * }
	 *
	 * function b(){
	 *    let data = await provider.data();
	 *    //get data when a refresh happens
	 *    provider.on('refresh', (newData) => data = newData));
	 * }
	 *
	 * //force provider refresh (after data invalidation)
	 * setTimeout(() => provider.refresh(), 50000);
	 *
	 * a();
	 * b();
	*/
	var Provider = (function () {
	    function Provider(path, className) {
	        this.path = path;
	        this.className = className;
	        this._data = [];
	        this.eventer = new eventer_1.Eventer();
	    }
	    Provider.prototype.data = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (!(!this.isSynced && !this.syncing))
	                            return [3 /*break*/, 2];
	                        return [4 /*yield*/, this.sync()];
	                    case 1:
	                        _a.sent();
	                        _a.label = 2;
	                    case 2:
	                        if (!this.syncing)
	                            return [3 /*break*/, 4];
	                        return [4 /*yield*/, this.syncDone()];
	                    case 3:
	                        _a.sent();
	                        _a.label = 4;
	                    case 4: return [2 /*return*/, this._data];
	                }
	            });
	        });
	    };
	    Provider.prototype.syncDone = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            var _this = this;
	            return __generator(this, function (_a) {
	                return [2 /*return*/, new Promise(function (resolve, reject) {
	                        _this.eventer.once('sync', function () { return resolve(); });
	                    })];
	            });
	        });
	    };
	    Provider.prototype.sync = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            var response;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        this.syncing = true;
	                        return [4 /*yield*/, axios_1.default.get(this.path)];
	                    case 1:
	                        response = _a.sent();
	                        this._data = minicast_1.Mix.castArrayAs(this.className, response.data);
	                        this.isSynced = true;
	                        this.eventer.trigger('sync');
	                        this.syncing = false;
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Provider.prototype.refresh = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        this.isSynced = false;
	                        return [4 /*yield*/, this.sync()];
	                    case 1:
	                        _a.sent();
	                        this.eventer.trigger('refresh');
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Provider.prototype.push = function (data) {
	        this._data.push(data);
	    };
	    Provider.prototype.remove = function (data) {
	        var index = this._data.indexOf(data);
	        this._data.splice(index, 1);
	    };
	    return Provider;
	}());
	exports.Provider = Provider;


/***/ }),
/* 45 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var axios_1 = __webpack_require__(14);
	var autosaved = [];
	var loopStarted = false;
	var token;
	var loop = function () {
	    autosaved.forEach(function (item) {
	        if (item._backup !== JSON.stringify(item.model)) {
	            if (item.fn) {
	                item.fn();
	            }
	            else {
	                axios_1.default[item.method](item.path, item.model);
	            }
	            item._backup = JSON.stringify(item.model);
	        }
	    });
	    loopStarted = true;
	    token = setTimeout(loop, 500);
	};
	var Autosave = (function () {
	    function Autosave() {
	    }
	    Autosave.watch = function (path, model, method) {
	        if (method === void 0) { method = 'put'; }
	        if (autosaved.findIndex(function (e) { return e.model === model && e.path === path; }) !== -1) {
	            return;
	        }
	        var autosave;
	        if (typeof path === 'string') {
	            autosave = {
	                model: model,
	                path: path,
	                method: method
	            };
	        }
	        else {
	            autosave = {
	                model: model,
	                fn: path,
	                method: method
	            };
	        }
	        autosaved.push(autosave);
	        if (!loopStarted) {
	            loop();
	        }
	    };
	    Autosave.unwatch = function (model) {
	        var index = autosaved.findIndex(function (e) { return e.model === model; });
	        autosaved.splice(index, 1);
	        if (autosaved.length === 0) {
	            this.unwatchAll();
	        }
	    };
	    Autosave.unwatchAll = function () {
	        autosaved = [];
	        clearTimeout(token);
	        loopStarted = false;
	    };
	    return Autosave;
	}());
	exports.Autosave = Autosave;


/***/ }),
/* 46 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (this && this.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	var axios_1 = __webpack_require__(47);
	var entcore_toolkit_1 = __webpack_require__(6);
	var index_1 = __webpack_require__(4);
	var colors = ['cyan', 'green', 'orange', 'pink', 'yellow', 'purple', 'grey'];
	var Course = (function () {
	    function Course(obj, startDate, endDate) {
	        if (obj instanceof Object) {
	            for (var key in obj) {
	                this[key] = obj[key];
	            }
	        }
	        this.color = colors[Math.floor(Math.random() * colors.length)];
	        this.is_periodic = false;
	        this.everyTwoWeek = false;
	        if (startDate) {
	            this.startMoment = entcore_1.moment(startDate);
	            this.startCalendarHour = this.startMoment.seconds(0).millisecond(0).toDate();
	            this.startMomentDate = this.startMoment.format('DD/MM/YYYY');
	            this.startMomentTime = this.startMoment.format('hh:mm');
	        }
	        if (endDate) {
	            this.endMoment = entcore_1.moment(endDate);
	            this.endCalendarHour = this.endMoment.seconds(0).millisecond(0).toDate();
	            this.endMomentDate = this.endMoment.format('DD/MM/YYYY');
	            this.endMomentTime = this.endMoment.format('hh:mm');
	        }
	    }
	    Course.prototype.save = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, this.create()];
	                    case 1:
	                        _a.sent();
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Course.prototype.create = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            var arr, e_1;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        arr = [];
	                        this.teacherIds = index_1.Utils.getValues(this.teachers, 'id');
	                        this.startDate = entcore_1.moment(this.startMoment).format('YYYY-MM-DDTHH:mm:ss');
	                        this.endDate = entcore_1.moment(this.endMoment).format('YYYY-MM-DDTHH:mm:ss');
	                        this.classes = index_1.Utils.getValues(entcore_1._.where(this.groups, { type_groupe: index_1.Utils.getClassGroupTypeMap()['CLASS'] }), 'name');
	                        this.groups = index_1.Utils.getValues(entcore_1._.where(this.groups, { type_groupe: index_1.Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP'] }), 'name');
	                        this.startDate = index_1.Utils.mapStartMomentWithDayOfWeek(this.startDate, this.dayOfWeek);
	                        arr.push(this.toJSON());
	                        return [4 /*yield*/, axios_1.default.post('/edt/course', arr)];
	                    case 1:
	                        _a.sent();
	                        return [2 /*return*/];
	                    case 2:
	                        e_1 = _a.sent();
	                        entcore_1.notify.error('edt.notify.create.err');
	                        console.error(e_1);
	                        throw e_1;
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Course.prototype.delete = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            var e_2;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        return [4 /*yield*/, axios_1.default.delete("/edt/course/" + this._id)];
	                    case 1:
	                        _a.sent();
	                        return [3 /*break*/, 3];
	                    case 2:
	                        e_2 = _a.sent();
	                        entcore_1.notify.error('edt.notify.delete.err');
	                        return [3 /*break*/, 3];
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Course.prototype.toJSON = function () {
	        var o = {
	            structureId: this.structureId,
	            subjectId: this.subjectId,
	            teacherIds: this.teacherIds,
	            classes: this.classes,
	            groups: this.groups,
	            endDate: this.endDate,
	            startDate: this.startDate,
	            roomLabels: this.roomLabels,
	            dayOfWeek: this.dayOfWeek,
	            manual: true,
	            everyWeek: this.everyTwoWeek
	        };
	        if (this._id) {
	            o._id = this._id;
	        }
	        return o;
	    };
	    return Course;
	}());
	exports.Course = Course;
	var Courses = (function () {
	    function Courses() {
	        this.all = [];
	        this.origin = [];
	    }
	    /**
	     * Synchronize courses.
	     * @param structure structure
	     * @param teacher teacher. Can be null. If null, group need to be provide.
	     * @param group group. Can be null. If null, teacher needs to be provide.
	     * @returns {Promise<void>} Returns a promise.
	     */
	    Courses.prototype.sync = function (structure, teacher, group) {
	        return __awaiter(this, void 0, void 0, function () {
	            var firstDate, endDate, filter, uri, courses;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        firstDate = index_1.Utils.getFirstCalendarDay().hour(0).minute(0).format('YYYY-MM-DD');
	                        endDate = index_1.Utils.getLastCalendarDay().hour(0).minute(0).format('YYYY-MM-DD');
	                        if (!structure || !teacher && !group || !firstDate || !endDate)
	                            return [2 /*return*/];
	                        filter = '';
	                        if (!group)
	                            filter += "teacherId=" + (entcore_1.model.me.type === index_1.USER_TYPES.personnel ? teacher.id : entcore_1.model.me.userId);
	                        if (!teacher && !!group)
	                            filter += "group=" + group.name;
	                        uri = "/directory/timetable/courses/" + structure.id + "/" + firstDate + "/" + endDate + "?" + filter;
	                        return [4 /*yield*/, axios_1.default.get(uri)];
	                    case 1:
	                        courses = _a.sent();
	                        if (courses.data.length > 0) {
	                            this.all = index_1.Utils.formatCourses(courses.data, structure);
	                            this.origin = entcore_toolkit_1.Mix.castArrayAs(Course, courses.data);
	                        }
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    /**
	     * Create course with occurrences
	     * @param {Course} course course to Create
	     * @returns {Promise<void>}
	     */
	    Courses.prototype.create = function (course) {
	        return __awaiter(this, void 0, void 0, function () {
	            var courses, occurrence, i, e_3;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        courses = [], occurrence = void 0;
	                        for (i = 0; i < course.courseOccurrences.length; i++) {
	                            occurrence = course.courseOccurrences[i].toJSON();
	                            occurrence.structureId = course.structureId;
	                            occurrence.subjectId = course.subjectId;
	                            occurrence.teacherIds = index_1.Utils.getValues(course.teachers, 'id');
	                            occurrence.groups = course.groups;
	                            occurrence.startDate = index_1.Utils.getOccurrenceStartDate(course.startDate, course.courseOccurrences[i].startTime, occurrence.dayOfWeek);
	                            occurrence.endDate = index_1.Utils.getOccurrenceEndDate(course.endDate, course.courseOccurrences[i].endTime, occurrence.dayOfWeek);
	                            occurrence.manual = true;
	                            courses.push(index_1.Utils.cleanCourseForSave(occurrence));
	                        }
	                        return [4 /*yield*/, axios_1.default.post('/edt/course', courses)];
	                    case 1:
	                        _a.sent();
	                        return [2 /*return*/];
	                    case 2:
	                        e_3 = _a.sent();
	                        entcore_1.notify.error('edt.notify.create.err');
	                        console.error(e_3);
	                        throw e_3;
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Courses.prototype.update = function (courses) {
	        return __awaiter(this, void 0, void 0, function () {
	            var e_4;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        return [4 /*yield*/, axios_1.default.put('/edt/course', courses)];
	                    case 1:
	                        _a.sent();
	                        return [2 /*return*/];
	                    case 2:
	                        e_4 = _a.sent();
	                        entcore_1.notify.error('edt.notify.update.err');
	                        return [3 /*break*/, 3];
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    return Courses;
	}());
	exports.Courses = Courses;


/***/ }),
/* 47 */
/***/ (function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(48);

/***/ }),
/* 48 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(49);
	var bind = __webpack_require__(50);
	var Axios = __webpack_require__(52);
	var defaults = __webpack_require__(53);
	
	/**
	 * Create an instance of Axios
	 *
	 * @param {Object} defaultConfig The default config for the instance
	 * @return {Axios} A new instance of Axios
	 */
	function createInstance(defaultConfig) {
	  var context = new Axios(defaultConfig);
	  var instance = bind(Axios.prototype.request, context);
	
	  // Copy axios.prototype to instance
	  utils.extend(instance, Axios.prototype, context);
	
	  // Copy context to instance
	  utils.extend(instance, context);
	
	  return instance;
	}
	
	// Create the default instance to be exported
	var axios = createInstance(defaults);
	
	// Expose Axios class to allow class inheritance
	axios.Axios = Axios;
	
	// Factory for creating new instances
	axios.create = function create(instanceConfig) {
	  return createInstance(utils.merge(defaults, instanceConfig));
	};
	
	// Expose Cancel & CancelToken
	axios.Cancel = __webpack_require__(70);
	axios.CancelToken = __webpack_require__(71);
	axios.isCancel = __webpack_require__(67);
	
	// Expose all/spread
	axios.all = function all(promises) {
	  return Promise.all(promises);
	};
	axios.spread = __webpack_require__(72);
	
	module.exports = axios;
	
	// Allow use of default import syntax in TypeScript
	module.exports.default = axios;


/***/ }),
/* 49 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var bind = __webpack_require__(50);
	var isBuffer = __webpack_require__(51);
	
	/*global toString:true*/
	
	// utils is a library of generic helper functions non-specific to axios
	
	var toString = Object.prototype.toString;
	
	/**
	 * Determine if a value is an Array
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Array, otherwise false
	 */
	function isArray(val) {
	  return toString.call(val) === '[object Array]';
	}
	
	/**
	 * Determine if a value is an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an ArrayBuffer, otherwise false
	 */
	function isArrayBuffer(val) {
	  return toString.call(val) === '[object ArrayBuffer]';
	}
	
	/**
	 * Determine if a value is a FormData
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an FormData, otherwise false
	 */
	function isFormData(val) {
	  return (typeof FormData !== 'undefined') && (val instanceof FormData);
	}
	
	/**
	 * Determine if a value is a view on an ArrayBuffer
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a view on an ArrayBuffer, otherwise false
	 */
	function isArrayBufferView(val) {
	  var result;
	  if ((typeof ArrayBuffer !== 'undefined') && (ArrayBuffer.isView)) {
	    result = ArrayBuffer.isView(val);
	  } else {
	    result = (val) && (val.buffer) && (val.buffer instanceof ArrayBuffer);
	  }
	  return result;
	}
	
	/**
	 * Determine if a value is a String
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a String, otherwise false
	 */
	function isString(val) {
	  return typeof val === 'string';
	}
	
	/**
	 * Determine if a value is a Number
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Number, otherwise false
	 */
	function isNumber(val) {
	  return typeof val === 'number';
	}
	
	/**
	 * Determine if a value is undefined
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if the value is undefined, otherwise false
	 */
	function isUndefined(val) {
	  return typeof val === 'undefined';
	}
	
	/**
	 * Determine if a value is an Object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is an Object, otherwise false
	 */
	function isObject(val) {
	  return val !== null && typeof val === 'object';
	}
	
	/**
	 * Determine if a value is a Date
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Date, otherwise false
	 */
	function isDate(val) {
	  return toString.call(val) === '[object Date]';
	}
	
	/**
	 * Determine if a value is a File
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a File, otherwise false
	 */
	function isFile(val) {
	  return toString.call(val) === '[object File]';
	}
	
	/**
	 * Determine if a value is a Blob
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Blob, otherwise false
	 */
	function isBlob(val) {
	  return toString.call(val) === '[object Blob]';
	}
	
	/**
	 * Determine if a value is a Function
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Function, otherwise false
	 */
	function isFunction(val) {
	  return toString.call(val) === '[object Function]';
	}
	
	/**
	 * Determine if a value is a Stream
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a Stream, otherwise false
	 */
	function isStream(val) {
	  return isObject(val) && isFunction(val.pipe);
	}
	
	/**
	 * Determine if a value is a URLSearchParams object
	 *
	 * @param {Object} val The value to test
	 * @returns {boolean} True if value is a URLSearchParams object, otherwise false
	 */
	function isURLSearchParams(val) {
	  return typeof URLSearchParams !== 'undefined' && val instanceof URLSearchParams;
	}
	
	/**
	 * Trim excess whitespace off the beginning and end of a string
	 *
	 * @param {String} str The String to trim
	 * @returns {String} The String freed of excess whitespace
	 */
	function trim(str) {
	  return str.replace(/^\s*/, '').replace(/\s*$/, '');
	}
	
	/**
	 * Determine if we're running in a standard browser environment
	 *
	 * This allows axios to run in a web worker, and react-native.
	 * Both environments support XMLHttpRequest, but not fully standard globals.
	 *
	 * web workers:
	 *  typeof window -> undefined
	 *  typeof document -> undefined
	 *
	 * react-native:
	 *  navigator.product -> 'ReactNative'
	 */
	function isStandardBrowserEnv() {
	  if (typeof navigator !== 'undefined' && navigator.product === 'ReactNative') {
	    return false;
	  }
	  return (
	    typeof window !== 'undefined' &&
	    typeof document !== 'undefined'
	  );
	}
	
	/**
	 * Iterate over an Array or an Object invoking a function for each item.
	 *
	 * If `obj` is an Array callback will be called passing
	 * the value, index, and complete array for each item.
	 *
	 * If 'obj' is an Object callback will be called passing
	 * the value, key, and complete object for each property.
	 *
	 * @param {Object|Array} obj The object to iterate
	 * @param {Function} fn The callback to invoke for each item
	 */
	function forEach(obj, fn) {
	  // Don't bother if no value provided
	  if (obj === null || typeof obj === 'undefined') {
	    return;
	  }
	
	  // Force an array if not already something iterable
	  if (typeof obj !== 'object' && !isArray(obj)) {
	    /*eslint no-param-reassign:0*/
	    obj = [obj];
	  }
	
	  if (isArray(obj)) {
	    // Iterate over array values
	    for (var i = 0, l = obj.length; i < l; i++) {
	      fn.call(null, obj[i], i, obj);
	    }
	  } else {
	    // Iterate over object keys
	    for (var key in obj) {
	      if (Object.prototype.hasOwnProperty.call(obj, key)) {
	        fn.call(null, obj[key], key, obj);
	      }
	    }
	  }
	}
	
	/**
	 * Accepts varargs expecting each argument to be an object, then
	 * immutably merges the properties of each object and returns result.
	 *
	 * When multiple objects contain the same key the later object in
	 * the arguments list will take precedence.
	 *
	 * Example:
	 *
	 * ```js
	 * var result = merge({foo: 123}, {foo: 456});
	 * console.log(result.foo); // outputs 456
	 * ```
	 *
	 * @param {Object} obj1 Object to merge
	 * @returns {Object} Result of all merge properties
	 */
	function merge(/* obj1, obj2, obj3, ... */) {
	  var result = {};
	  function assignValue(val, key) {
	    if (typeof result[key] === 'object' && typeof val === 'object') {
	      result[key] = merge(result[key], val);
	    } else {
	      result[key] = val;
	    }
	  }
	
	  for (var i = 0, l = arguments.length; i < l; i++) {
	    forEach(arguments[i], assignValue);
	  }
	  return result;
	}
	
	/**
	 * Extends object a by mutably adding to it the properties of object b.
	 *
	 * @param {Object} a The object to be extended
	 * @param {Object} b The object to copy properties from
	 * @param {Object} thisArg The object to bind function to
	 * @return {Object} The resulting value of object a
	 */
	function extend(a, b, thisArg) {
	  forEach(b, function assignValue(val, key) {
	    if (thisArg && typeof val === 'function') {
	      a[key] = bind(val, thisArg);
	    } else {
	      a[key] = val;
	    }
	  });
	  return a;
	}
	
	module.exports = {
	  isArray: isArray,
	  isArrayBuffer: isArrayBuffer,
	  isBuffer: isBuffer,
	  isFormData: isFormData,
	  isArrayBufferView: isArrayBufferView,
	  isString: isString,
	  isNumber: isNumber,
	  isObject: isObject,
	  isUndefined: isUndefined,
	  isDate: isDate,
	  isFile: isFile,
	  isBlob: isBlob,
	  isFunction: isFunction,
	  isStream: isStream,
	  isURLSearchParams: isURLSearchParams,
	  isStandardBrowserEnv: isStandardBrowserEnv,
	  forEach: forEach,
	  merge: merge,
	  extend: extend,
	  trim: trim
	};


/***/ }),
/* 50 */
/***/ (function(module, exports) {

	'use strict';
	
	module.exports = function bind(fn, thisArg) {
	  return function wrap() {
	    var args = new Array(arguments.length);
	    for (var i = 0; i < args.length; i++) {
	      args[i] = arguments[i];
	    }
	    return fn.apply(thisArg, args);
	  };
	};


/***/ }),
/* 51 */
/***/ (function(module, exports) {

	/*!
	 * Determine if an object is a Buffer
	 *
	 * @author   Feross Aboukhadijeh <https://feross.org>
	 * @license  MIT
	 */
	
	// The _isBuffer check is for Safari 5-7 support, because it's missing
	// Object.prototype.constructor. Remove this eventually
	module.exports = function (obj) {
	  return obj != null && (isBuffer(obj) || isSlowBuffer(obj) || !!obj._isBuffer)
	}
	
	function isBuffer (obj) {
	  return !!obj.constructor && typeof obj.constructor.isBuffer === 'function' && obj.constructor.isBuffer(obj)
	}
	
	// For Node v0.10 support. Remove this eventually.
	function isSlowBuffer (obj) {
	  return typeof obj.readFloatLE === 'function' && typeof obj.slice === 'function' && isBuffer(obj.slice(0, 0))
	}


/***/ }),
/* 52 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var defaults = __webpack_require__(53);
	var utils = __webpack_require__(49);
	var InterceptorManager = __webpack_require__(64);
	var dispatchRequest = __webpack_require__(65);
	var isAbsoluteURL = __webpack_require__(68);
	var combineURLs = __webpack_require__(69);
	
	/**
	 * Create a new instance of Axios
	 *
	 * @param {Object} instanceConfig The default config for the instance
	 */
	function Axios(instanceConfig) {
	  this.defaults = instanceConfig;
	  this.interceptors = {
	    request: new InterceptorManager(),
	    response: new InterceptorManager()
	  };
	}
	
	/**
	 * Dispatch a request
	 *
	 * @param {Object} config The config specific for this request (merged with this.defaults)
	 */
	Axios.prototype.request = function request(config) {
	  /*eslint no-param-reassign:0*/
	  // Allow for axios('example/url'[, config]) a la fetch API
	  if (typeof config === 'string') {
	    config = utils.merge({
	      url: arguments[0]
	    }, arguments[1]);
	  }
	
	  config = utils.merge(defaults, this.defaults, { method: 'get' }, config);
	  config.method = config.method.toLowerCase();
	
	  // Support baseURL config
	  if (config.baseURL && !isAbsoluteURL(config.url)) {
	    config.url = combineURLs(config.baseURL, config.url);
	  }
	
	  // Hook up interceptors middleware
	  var chain = [dispatchRequest, undefined];
	  var promise = Promise.resolve(config);
	
	  this.interceptors.request.forEach(function unshiftRequestInterceptors(interceptor) {
	    chain.unshift(interceptor.fulfilled, interceptor.rejected);
	  });
	
	  this.interceptors.response.forEach(function pushResponseInterceptors(interceptor) {
	    chain.push(interceptor.fulfilled, interceptor.rejected);
	  });
	
	  while (chain.length) {
	    promise = promise.then(chain.shift(), chain.shift());
	  }
	
	  return promise;
	};
	
	// Provide aliases for supported request methods
	utils.forEach(['delete', 'get', 'head', 'options'], function forEachMethodNoData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url
	    }));
	  };
	});
	
	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  /*eslint func-names:0*/
	  Axios.prototype[method] = function(url, data, config) {
	    return this.request(utils.merge(config || {}, {
	      method: method,
	      url: url,
	      data: data
	    }));
	  };
	});
	
	module.exports = Axios;


/***/ }),
/* 53 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	var utils = __webpack_require__(49);
	var normalizeHeaderName = __webpack_require__(54);
	
	var DEFAULT_CONTENT_TYPE = {
	  'Content-Type': 'application/x-www-form-urlencoded'
	};
	
	function setContentTypeIfUnset(headers, value) {
	  if (!utils.isUndefined(headers) && utils.isUndefined(headers['Content-Type'])) {
	    headers['Content-Type'] = value;
	  }
	}
	
	function getDefaultAdapter() {
	  var adapter;
	  if (typeof XMLHttpRequest !== 'undefined') {
	    // For browsers use XHR adapter
	    adapter = __webpack_require__(55);
	  } else if (typeof process !== 'undefined') {
	    // For node use HTTP adapter
	    adapter = __webpack_require__(55);
	  }
	  return adapter;
	}
	
	var defaults = {
	  adapter: getDefaultAdapter(),
	
	  transformRequest: [function transformRequest(data, headers) {
	    normalizeHeaderName(headers, 'Content-Type');
	    if (utils.isFormData(data) ||
	      utils.isArrayBuffer(data) ||
	      utils.isBuffer(data) ||
	      utils.isStream(data) ||
	      utils.isFile(data) ||
	      utils.isBlob(data)
	    ) {
	      return data;
	    }
	    if (utils.isArrayBufferView(data)) {
	      return data.buffer;
	    }
	    if (utils.isURLSearchParams(data)) {
	      setContentTypeIfUnset(headers, 'application/x-www-form-urlencoded;charset=utf-8');
	      return data.toString();
	    }
	    if (utils.isObject(data)) {
	      setContentTypeIfUnset(headers, 'application/json;charset=utf-8');
	      return JSON.stringify(data);
	    }
	    return data;
	  }],
	
	  transformResponse: [function transformResponse(data) {
	    /*eslint no-param-reassign:0*/
	    if (typeof data === 'string') {
	      try {
	        data = JSON.parse(data);
	      } catch (e) { /* Ignore */ }
	    }
	    return data;
	  }],
	
	  timeout: 0,
	
	  xsrfCookieName: 'XSRF-TOKEN',
	  xsrfHeaderName: 'X-XSRF-TOKEN',
	
	  maxContentLength: -1,
	
	  validateStatus: function validateStatus(status) {
	    return status >= 200 && status < 300;
	  }
	};
	
	defaults.headers = {
	  common: {
	    'Accept': 'application/json, text/plain, */*'
	  }
	};
	
	utils.forEach(['delete', 'get', 'head'], function forEachMethodNoData(method) {
	  defaults.headers[method] = {};
	});
	
	utils.forEach(['post', 'put', 'patch'], function forEachMethodWithData(method) {
	  defaults.headers[method] = utils.merge(DEFAULT_CONTENT_TYPE);
	});
	
	module.exports = defaults;
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(20)))

/***/ }),
/* 54 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(49);
	
	module.exports = function normalizeHeaderName(headers, normalizedName) {
	  utils.forEach(headers, function processHeader(value, name) {
	    if (name !== normalizedName && name.toUpperCase() === normalizedName.toUpperCase()) {
	      headers[normalizedName] = value;
	      delete headers[name];
	    }
	  });
	};


/***/ }),
/* 55 */
/***/ (function(module, exports, __webpack_require__) {

	/* WEBPACK VAR INJECTION */(function(process) {'use strict';
	
	var utils = __webpack_require__(49);
	var settle = __webpack_require__(56);
	var buildURL = __webpack_require__(59);
	var parseHeaders = __webpack_require__(60);
	var isURLSameOrigin = __webpack_require__(61);
	var createError = __webpack_require__(57);
	var btoa = (typeof window !== 'undefined' && window.btoa && window.btoa.bind(window)) || __webpack_require__(62);
	
	module.exports = function xhrAdapter(config) {
	  return new Promise(function dispatchXhrRequest(resolve, reject) {
	    var requestData = config.data;
	    var requestHeaders = config.headers;
	
	    if (utils.isFormData(requestData)) {
	      delete requestHeaders['Content-Type']; // Let the browser set it
	    }
	
	    var request = new XMLHttpRequest();
	    var loadEvent = 'onreadystatechange';
	    var xDomain = false;
	
	    // For IE 8/9 CORS support
	    // Only supports POST and GET calls and doesn't returns the response headers.
	    // DON'T do this for testing b/c XMLHttpRequest is mocked, not XDomainRequest.
	    if (process.env.NODE_ENV !== 'test' &&
	        typeof window !== 'undefined' &&
	        window.XDomainRequest && !('withCredentials' in request) &&
	        !isURLSameOrigin(config.url)) {
	      request = new window.XDomainRequest();
	      loadEvent = 'onload';
	      xDomain = true;
	      request.onprogress = function handleProgress() {};
	      request.ontimeout = function handleTimeout() {};
	    }
	
	    // HTTP basic authentication
	    if (config.auth) {
	      var username = config.auth.username || '';
	      var password = config.auth.password || '';
	      requestHeaders.Authorization = 'Basic ' + btoa(username + ':' + password);
	    }
	
	    request.open(config.method.toUpperCase(), buildURL(config.url, config.params, config.paramsSerializer), true);
	
	    // Set the request timeout in MS
	    request.timeout = config.timeout;
	
	    // Listen for ready state
	    request[loadEvent] = function handleLoad() {
	      if (!request || (request.readyState !== 4 && !xDomain)) {
	        return;
	      }
	
	      // The request errored out and we didn't get a response, this will be
	      // handled by onerror instead
	      // With one exception: request that using file: protocol, most browsers
	      // will return status as 0 even though it's a successful request
	      if (request.status === 0 && !(request.responseURL && request.responseURL.indexOf('file:') === 0)) {
	        return;
	      }
	
	      // Prepare the response
	      var responseHeaders = 'getAllResponseHeaders' in request ? parseHeaders(request.getAllResponseHeaders()) : null;
	      var responseData = !config.responseType || config.responseType === 'text' ? request.responseText : request.response;
	      var response = {
	        data: responseData,
	        // IE sends 1223 instead of 204 (https://github.com/mzabriskie/axios/issues/201)
	        status: request.status === 1223 ? 204 : request.status,
	        statusText: request.status === 1223 ? 'No Content' : request.statusText,
	        headers: responseHeaders,
	        config: config,
	        request: request
	      };
	
	      settle(resolve, reject, response);
	
	      // Clean up request
	      request = null;
	    };
	
	    // Handle low level network errors
	    request.onerror = function handleError() {
	      // Real errors are hidden from us by the browser
	      // onerror should only fire if it's a network error
	      reject(createError('Network Error', config, null, request));
	
	      // Clean up request
	      request = null;
	    };
	
	    // Handle timeout
	    request.ontimeout = function handleTimeout() {
	      reject(createError('timeout of ' + config.timeout + 'ms exceeded', config, 'ECONNABORTED',
	        request));
	
	      // Clean up request
	      request = null;
	    };
	
	    // Add xsrf header
	    // This is only done if running in a standard browser environment.
	    // Specifically not if we're in a web worker, or react-native.
	    if (utils.isStandardBrowserEnv()) {
	      var cookies = __webpack_require__(63);
	
	      // Add xsrf header
	      var xsrfValue = (config.withCredentials || isURLSameOrigin(config.url)) && config.xsrfCookieName ?
	          cookies.read(config.xsrfCookieName) :
	          undefined;
	
	      if (xsrfValue) {
	        requestHeaders[config.xsrfHeaderName] = xsrfValue;
	      }
	    }
	
	    // Add headers to the request
	    if ('setRequestHeader' in request) {
	      utils.forEach(requestHeaders, function setRequestHeader(val, key) {
	        if (typeof requestData === 'undefined' && key.toLowerCase() === 'content-type') {
	          // Remove Content-Type if data is undefined
	          delete requestHeaders[key];
	        } else {
	          // Otherwise add header to the request
	          request.setRequestHeader(key, val);
	        }
	      });
	    }
	
	    // Add withCredentials to request if needed
	    if (config.withCredentials) {
	      request.withCredentials = true;
	    }
	
	    // Add responseType to request if needed
	    if (config.responseType) {
	      try {
	        request.responseType = config.responseType;
	      } catch (e) {
	        // Expected DOMException thrown by browsers not compatible XMLHttpRequest Level 2.
	        // But, this can be suppressed for 'json' type as it can be parsed by default 'transformResponse' function.
	        if (config.responseType !== 'json') {
	          throw e;
	        }
	      }
	    }
	
	    // Handle progress if needed
	    if (typeof config.onDownloadProgress === 'function') {
	      request.addEventListener('progress', config.onDownloadProgress);
	    }
	
	    // Not all browsers support upload events
	    if (typeof config.onUploadProgress === 'function' && request.upload) {
	      request.upload.addEventListener('progress', config.onUploadProgress);
	    }
	
	    if (config.cancelToken) {
	      // Handle cancellation
	      config.cancelToken.promise.then(function onCanceled(cancel) {
	        if (!request) {
	          return;
	        }
	
	        request.abort();
	        reject(cancel);
	        // Clean up request
	        request = null;
	      });
	    }
	
	    if (requestData === undefined) {
	      requestData = null;
	    }
	
	    // Send the request
	    request.send(requestData);
	  });
	};
	
	/* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(20)))

/***/ }),
/* 56 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var createError = __webpack_require__(57);
	
	/**
	 * Resolve or reject a Promise based on response status.
	 *
	 * @param {Function} resolve A function that resolves the promise.
	 * @param {Function} reject A function that rejects the promise.
	 * @param {object} response The response.
	 */
	module.exports = function settle(resolve, reject, response) {
	  var validateStatus = response.config.validateStatus;
	  // Note: status is not exposed by XDomainRequest
	  if (!response.status || !validateStatus || validateStatus(response.status)) {
	    resolve(response);
	  } else {
	    reject(createError(
	      'Request failed with status code ' + response.status,
	      response.config,
	      null,
	      response.request,
	      response
	    ));
	  }
	};


/***/ }),
/* 57 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var enhanceError = __webpack_require__(58);
	
	/**
	 * Create an Error with the specified message, config, error code, request and response.
	 *
	 * @param {string} message The error message.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The created error.
	 */
	module.exports = function createError(message, config, code, request, response) {
	  var error = new Error(message);
	  return enhanceError(error, config, code, request, response);
	};


/***/ }),
/* 58 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Update an Error with the specified config, error code, and response.
	 *
	 * @param {Error} error The error to update.
	 * @param {Object} config The config.
	 * @param {string} [code] The error code (for example, 'ECONNABORTED').
	 * @param {Object} [request] The request.
	 * @param {Object} [response] The response.
	 * @returns {Error} The error.
	 */
	module.exports = function enhanceError(error, config, code, request, response) {
	  error.config = config;
	  if (code) {
	    error.code = code;
	  }
	  error.request = request;
	  error.response = response;
	  return error;
	};


/***/ }),
/* 59 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(49);
	
	function encode(val) {
	  return encodeURIComponent(val).
	    replace(/%40/gi, '@').
	    replace(/%3A/gi, ':').
	    replace(/%24/g, '$').
	    replace(/%2C/gi, ',').
	    replace(/%20/g, '+').
	    replace(/%5B/gi, '[').
	    replace(/%5D/gi, ']');
	}
	
	/**
	 * Build a URL by appending params to the end
	 *
	 * @param {string} url The base of the url (e.g., http://www.google.com)
	 * @param {object} [params] The params to be appended
	 * @returns {string} The formatted url
	 */
	module.exports = function buildURL(url, params, paramsSerializer) {
	  /*eslint no-param-reassign:0*/
	  if (!params) {
	    return url;
	  }
	
	  var serializedParams;
	  if (paramsSerializer) {
	    serializedParams = paramsSerializer(params);
	  } else if (utils.isURLSearchParams(params)) {
	    serializedParams = params.toString();
	  } else {
	    var parts = [];
	
	    utils.forEach(params, function serialize(val, key) {
	      if (val === null || typeof val === 'undefined') {
	        return;
	      }
	
	      if (utils.isArray(val)) {
	        key = key + '[]';
	      }
	
	      if (!utils.isArray(val)) {
	        val = [val];
	      }
	
	      utils.forEach(val, function parseValue(v) {
	        if (utils.isDate(v)) {
	          v = v.toISOString();
	        } else if (utils.isObject(v)) {
	          v = JSON.stringify(v);
	        }
	        parts.push(encode(key) + '=' + encode(v));
	      });
	    });
	
	    serializedParams = parts.join('&');
	  }
	
	  if (serializedParams) {
	    url += (url.indexOf('?') === -1 ? '?' : '&') + serializedParams;
	  }
	
	  return url;
	};


/***/ }),
/* 60 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(49);
	
	/**
	 * Parse headers into an object
	 *
	 * ```
	 * Date: Wed, 27 Aug 2014 08:58:49 GMT
	 * Content-Type: application/json
	 * Connection: keep-alive
	 * Transfer-Encoding: chunked
	 * ```
	 *
	 * @param {String} headers Headers needing to be parsed
	 * @returns {Object} Headers parsed into an object
	 */
	module.exports = function parseHeaders(headers) {
	  var parsed = {};
	  var key;
	  var val;
	  var i;
	
	  if (!headers) { return parsed; }
	
	  utils.forEach(headers.split('\n'), function parser(line) {
	    i = line.indexOf(':');
	    key = utils.trim(line.substr(0, i)).toLowerCase();
	    val = utils.trim(line.substr(i + 1));
	
	    if (key) {
	      parsed[key] = parsed[key] ? parsed[key] + ', ' + val : val;
	    }
	  });
	
	  return parsed;
	};


/***/ }),
/* 61 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(49);
	
	module.exports = (
	  utils.isStandardBrowserEnv() ?
	
	  // Standard browser envs have full support of the APIs needed to test
	  // whether the request URL is of the same origin as current location.
	  (function standardBrowserEnv() {
	    var msie = /(msie|trident)/i.test(navigator.userAgent);
	    var urlParsingNode = document.createElement('a');
	    var originURL;
	
	    /**
	    * Parse a URL to discover it's components
	    *
	    * @param {String} url The URL to be parsed
	    * @returns {Object}
	    */
	    function resolveURL(url) {
	      var href = url;
	
	      if (msie) {
	        // IE needs attribute set twice to normalize properties
	        urlParsingNode.setAttribute('href', href);
	        href = urlParsingNode.href;
	      }
	
	      urlParsingNode.setAttribute('href', href);
	
	      // urlParsingNode provides the UrlUtils interface - http://url.spec.whatwg.org/#urlutils
	      return {
	        href: urlParsingNode.href,
	        protocol: urlParsingNode.protocol ? urlParsingNode.protocol.replace(/:$/, '') : '',
	        host: urlParsingNode.host,
	        search: urlParsingNode.search ? urlParsingNode.search.replace(/^\?/, '') : '',
	        hash: urlParsingNode.hash ? urlParsingNode.hash.replace(/^#/, '') : '',
	        hostname: urlParsingNode.hostname,
	        port: urlParsingNode.port,
	        pathname: (urlParsingNode.pathname.charAt(0) === '/') ?
	                  urlParsingNode.pathname :
	                  '/' + urlParsingNode.pathname
	      };
	    }
	
	    originURL = resolveURL(window.location.href);
	
	    /**
	    * Determine if a URL shares the same origin as the current location
	    *
	    * @param {String} requestURL The URL to test
	    * @returns {boolean} True if URL shares the same origin, otherwise false
	    */
	    return function isURLSameOrigin(requestURL) {
	      var parsed = (utils.isString(requestURL)) ? resolveURL(requestURL) : requestURL;
	      return (parsed.protocol === originURL.protocol &&
	            parsed.host === originURL.host);
	    };
	  })() :
	
	  // Non standard browser envs (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return function isURLSameOrigin() {
	      return true;
	    };
	  })()
	);


/***/ }),
/* 62 */
/***/ (function(module, exports) {

	'use strict';
	
	// btoa polyfill for IE<10 courtesy https://github.com/davidchambers/Base64.js
	
	var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
	
	function E() {
	  this.message = 'String contains an invalid character';
	}
	E.prototype = new Error;
	E.prototype.code = 5;
	E.prototype.name = 'InvalidCharacterError';
	
	function btoa(input) {
	  var str = String(input);
	  var output = '';
	  for (
	    // initialize result and counter
	    var block, charCode, idx = 0, map = chars;
	    // if the next str index does not exist:
	    //   change the mapping table to "="
	    //   check if d has no fractional digits
	    str.charAt(idx | 0) || (map = '=', idx % 1);
	    // "8 - idx % 1 * 8" generates the sequence 2, 4, 6, 8
	    output += map.charAt(63 & block >> 8 - idx % 1 * 8)
	  ) {
	    charCode = str.charCodeAt(idx += 3 / 4);
	    if (charCode > 0xFF) {
	      throw new E();
	    }
	    block = block << 8 | charCode;
	  }
	  return output;
	}
	
	module.exports = btoa;


/***/ }),
/* 63 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(49);
	
	module.exports = (
	  utils.isStandardBrowserEnv() ?
	
	  // Standard browser envs support document.cookie
	  (function standardBrowserEnv() {
	    return {
	      write: function write(name, value, expires, path, domain, secure) {
	        var cookie = [];
	        cookie.push(name + '=' + encodeURIComponent(value));
	
	        if (utils.isNumber(expires)) {
	          cookie.push('expires=' + new Date(expires).toGMTString());
	        }
	
	        if (utils.isString(path)) {
	          cookie.push('path=' + path);
	        }
	
	        if (utils.isString(domain)) {
	          cookie.push('domain=' + domain);
	        }
	
	        if (secure === true) {
	          cookie.push('secure');
	        }
	
	        document.cookie = cookie.join('; ');
	      },
	
	      read: function read(name) {
	        var match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
	        return (match ? decodeURIComponent(match[3]) : null);
	      },
	
	      remove: function remove(name) {
	        this.write(name, '', Date.now() - 86400000);
	      }
	    };
	  })() :
	
	  // Non standard browser env (web workers, react-native) lack needed support.
	  (function nonStandardBrowserEnv() {
	    return {
	      write: function write() {},
	      read: function read() { return null; },
	      remove: function remove() {}
	    };
	  })()
	);


/***/ }),
/* 64 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(49);
	
	function InterceptorManager() {
	  this.handlers = [];
	}
	
	/**
	 * Add a new interceptor to the stack
	 *
	 * @param {Function} fulfilled The function to handle `then` for a `Promise`
	 * @param {Function} rejected The function to handle `reject` for a `Promise`
	 *
	 * @return {Number} An ID used to remove interceptor later
	 */
	InterceptorManager.prototype.use = function use(fulfilled, rejected) {
	  this.handlers.push({
	    fulfilled: fulfilled,
	    rejected: rejected
	  });
	  return this.handlers.length - 1;
	};
	
	/**
	 * Remove an interceptor from the stack
	 *
	 * @param {Number} id The ID that was returned by `use`
	 */
	InterceptorManager.prototype.eject = function eject(id) {
	  if (this.handlers[id]) {
	    this.handlers[id] = null;
	  }
	};
	
	/**
	 * Iterate over all the registered interceptors
	 *
	 * This method is particularly useful for skipping over any
	 * interceptors that may have become `null` calling `eject`.
	 *
	 * @param {Function} fn The function to call for each interceptor
	 */
	InterceptorManager.prototype.forEach = function forEach(fn) {
	  utils.forEach(this.handlers, function forEachHandler(h) {
	    if (h !== null) {
	      fn(h);
	    }
	  });
	};
	
	module.exports = InterceptorManager;


/***/ }),
/* 65 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(49);
	var transformData = __webpack_require__(66);
	var isCancel = __webpack_require__(67);
	var defaults = __webpack_require__(53);
	
	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	function throwIfCancellationRequested(config) {
	  if (config.cancelToken) {
	    config.cancelToken.throwIfRequested();
	  }
	}
	
	/**
	 * Dispatch a request to the server using the configured adapter.
	 *
	 * @param {object} config The config that is to be used for the request
	 * @returns {Promise} The Promise to be fulfilled
	 */
	module.exports = function dispatchRequest(config) {
	  throwIfCancellationRequested(config);
	
	  // Ensure headers exist
	  config.headers = config.headers || {};
	
	  // Transform request data
	  config.data = transformData(
	    config.data,
	    config.headers,
	    config.transformRequest
	  );
	
	  // Flatten headers
	  config.headers = utils.merge(
	    config.headers.common || {},
	    config.headers[config.method] || {},
	    config.headers || {}
	  );
	
	  utils.forEach(
	    ['delete', 'get', 'head', 'post', 'put', 'patch', 'common'],
	    function cleanHeaderConfig(method) {
	      delete config.headers[method];
	    }
	  );
	
	  var adapter = config.adapter || defaults.adapter;
	
	  return adapter(config).then(function onAdapterResolution(response) {
	    throwIfCancellationRequested(config);
	
	    // Transform response data
	    response.data = transformData(
	      response.data,
	      response.headers,
	      config.transformResponse
	    );
	
	    return response;
	  }, function onAdapterRejection(reason) {
	    if (!isCancel(reason)) {
	      throwIfCancellationRequested(config);
	
	      // Transform response data
	      if (reason && reason.response) {
	        reason.response.data = transformData(
	          reason.response.data,
	          reason.response.headers,
	          config.transformResponse
	        );
	      }
	    }
	
	    return Promise.reject(reason);
	  });
	};


/***/ }),
/* 66 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var utils = __webpack_require__(49);
	
	/**
	 * Transform the data for a request or a response
	 *
	 * @param {Object|String} data The data to be transformed
	 * @param {Array} headers The headers for the request or response
	 * @param {Array|Function} fns A single function or Array of functions
	 * @returns {*} The resulting transformed data
	 */
	module.exports = function transformData(data, headers, fns) {
	  /*eslint no-param-reassign:0*/
	  utils.forEach(fns, function transform(fn) {
	    data = fn(data, headers);
	  });
	
	  return data;
	};


/***/ }),
/* 67 */
/***/ (function(module, exports) {

	'use strict';
	
	module.exports = function isCancel(value) {
	  return !!(value && value.__CANCEL__);
	};


/***/ }),
/* 68 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Determines whether the specified URL is absolute
	 *
	 * @param {string} url The URL to test
	 * @returns {boolean} True if the specified URL is absolute, otherwise false
	 */
	module.exports = function isAbsoluteURL(url) {
	  // A URL is considered absolute if it begins with "<scheme>://" or "//" (protocol-relative URL).
	  // RFC 3986 defines scheme name as a sequence of characters beginning with a letter and followed
	  // by any combination of letters, digits, plus, period, or hyphen.
	  return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);
	};


/***/ }),
/* 69 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Creates a new URL by combining the specified URLs
	 *
	 * @param {string} baseURL The base URL
	 * @param {string} relativeURL The relative URL
	 * @returns {string} The combined URL
	 */
	module.exports = function combineURLs(baseURL, relativeURL) {
	  return relativeURL
	    ? baseURL.replace(/\/+$/, '') + '/' + relativeURL.replace(/^\/+/, '')
	    : baseURL;
	};


/***/ }),
/* 70 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * A `Cancel` is an object that is thrown when an operation is canceled.
	 *
	 * @class
	 * @param {string=} message The message.
	 */
	function Cancel(message) {
	  this.message = message;
	}
	
	Cancel.prototype.toString = function toString() {
	  return 'Cancel' + (this.message ? ': ' + this.message : '');
	};
	
	Cancel.prototype.__CANCEL__ = true;
	
	module.exports = Cancel;


/***/ }),
/* 71 */
/***/ (function(module, exports, __webpack_require__) {

	'use strict';
	
	var Cancel = __webpack_require__(70);
	
	/**
	 * A `CancelToken` is an object that can be used to request cancellation of an operation.
	 *
	 * @class
	 * @param {Function} executor The executor function.
	 */
	function CancelToken(executor) {
	  if (typeof executor !== 'function') {
	    throw new TypeError('executor must be a function.');
	  }
	
	  var resolvePromise;
	  this.promise = new Promise(function promiseExecutor(resolve) {
	    resolvePromise = resolve;
	  });
	
	  var token = this;
	  executor(function cancel(message) {
	    if (token.reason) {
	      // Cancellation has already been requested
	      return;
	    }
	
	    token.reason = new Cancel(message);
	    resolvePromise(token.reason);
	  });
	}
	
	/**
	 * Throws a `Cancel` if cancellation has been requested.
	 */
	CancelToken.prototype.throwIfRequested = function throwIfRequested() {
	  if (this.reason) {
	    throw this.reason;
	  }
	};
	
	/**
	 * Returns an object that contains a new `CancelToken` and a function that, when called,
	 * cancels the `CancelToken`.
	 */
	CancelToken.source = function source() {
	  var cancel;
	  var token = new CancelToken(function executor(c) {
	    cancel = c;
	  });
	  return {
	    token: token,
	    cancel: cancel
	  };
	};
	
	module.exports = CancelToken;


/***/ }),
/* 72 */
/***/ (function(module, exports) {

	'use strict';
	
	/**
	 * Syntactic sugar for invoking a function and expanding an array for arguments.
	 *
	 * Common use case would be to use `Function.prototype.apply`.
	 *
	 *  ```js
	 *  function f(x, y, z) {}
	 *  var args = [1, 2, 3];
	 *  f.apply(null, args);
	 *  ```
	 *
	 * With `spread` this example can be re-written.
	 *
	 *  ```js
	 *  spread(function(x, y, z) {})([1, 2, 3]);
	 *  ```
	 *
	 * @param {Function} callback
	 * @returns {Function}
	 */
	module.exports = function spread(callback) {
	  return function wrap(arr) {
	    return callback.apply(null, arr);
	  };
	};


/***/ }),
/* 73 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (this && this.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	var axios_1 = __webpack_require__(47);
	var Subject = (function () {
	    function Subject(subjectId, subjectLabel, subjectCode, teacherId) {
	        this.subjectId = subjectId;
	        this.subjectLabel = subjectLabel;
	        this.subjectCode = subjectCode;
	        this.teacherId = teacherId;
	    }
	    return Subject;
	}());
	exports.Subject = Subject;
	var Subjects = (function () {
	    function Subjects() {
	        this.all = [];
	        this.mapping = {};
	    }
	    /**
	     * Synchronize subjects provides by the structure
	     * @param structureId structure id
	     * @returns {Promise<void>}
	     */
	    Subjects.prototype.sync = function (structureId) {
	        return __awaiter(this, void 0, void 0, function () {
	            var _this = this;
	            var url, subjects, e_1;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (typeof structureId !== 'string') {
	                            return [2 /*return*/];
	                        }
	                        _a.label = 1;
	                    case 1:
	                        _a.trys.push([1, 3, , 4]);
	                        url = "/directory/timetable/subjects/" + structureId;
	                        return [4 /*yield*/, axios_1.default.get(url)];
	                    case 2:
	                        subjects = _a.sent();
	                        subjects.data.forEach(function (subject) {
	                            _this.all.push(new Subject(subject.subjectId, subject.subjectLabel, subject.subjectCode, subject.teacherId));
	                            _this.mapping[subject.subjectId] = subject.subjectLabel;
	                        });
	                        return [2 /*return*/];
	                    case 3:
	                        e_1 = _a.sent();
	                        entcore_1.notify.error('app.notify.e500');
	                        return [3 /*break*/, 4];
	                    case 4: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    return Subjects;
	}());
	exports.Subjects = Subjects;


/***/ }),
/* 74 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (this && this.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_toolkit_1 = __webpack_require__(6);
	var axios_1 = __webpack_require__(47);
	var Group = (function () {
	    function Group(id, name) {
	        this.id = id;
	        this.name = name;
	    }
	    Group.prototype.toString = function () {
	        return this.name;
	    };
	    return Group;
	}());
	exports.Group = Group;
	var Groups = (function () {
	    function Groups() {
	        this.all = [];
	    }
	    /**
	     * Synchronize groups belongs to the parameter structure
	     * @param structureId structure id
	     * @returns {Promise<void>}
	     */
	    Groups.prototype.sync = function (structureId) {
	        return __awaiter(this, void 0, void 0, function () {
	            var groups, e_1;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        return [4 /*yield*/, axios_1.default.get('/viescolaire/classes?idEtablissement=' + structureId)];
	                    case 1:
	                        groups = _a.sent();
	                        this.all = entcore_toolkit_1.Mix.castArrayAs(Group, groups.data);
	                        return [3 /*break*/, 3];
	                    case 2:
	                        e_1 = _a.sent();
	                        throw e_1;
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    return Groups;
	}());
	exports.Groups = Groups;


/***/ }),
/* 75 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (this && this.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_toolkit_1 = __webpack_require__(6);
	var axios_1 = __webpack_require__(47);
	var Teacher = (function () {
	    function Teacher(o) {
	        if (o && typeof o === 'object') {
	            for (var key in o) {
	                this[key] = o[key];
	            }
	        }
	    }
	    Teacher.prototype.toString = function () {
	        return this.displayName;
	    };
	    return Teacher;
	}());
	exports.Teacher = Teacher;
	var Teachers = (function () {
	    function Teachers() {
	        this.all = [];
	    }
	    /**
	     * Synchronize structure teachers
	     * @param structure structure
	     * @returns {Promise<void>}
	     */
	    Teachers.prototype.sync = function (structure) {
	        return __awaiter(this, void 0, void 0, function () {
	            var teachers, e_1;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        return [4 /*yield*/, axios_1.default.get('/viescolaire/user/list?profile=Teacher&structureId=' + structure.id)];
	                    case 1:
	                        teachers = _a.sent();
	                        this.all = entcore_toolkit_1.Mix.castArrayAs(Teacher, teachers.data);
	                        return [3 /*break*/, 3];
	                    case 2:
	                        e_1 = _a.sent();
	                        throw e_1;
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    return Teachers;
	}());
	exports.Teachers = Teachers;


/***/ }),
/* 76 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (this && this.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var axios_1 = __webpack_require__(47);
	var entcore_toolkit_1 = __webpack_require__(6);
	var Student = (function () {
	    function Student(obj) {
	        for (var key in obj) {
	            this[key] = obj[key];
	        }
	    }
	    return Student;
	}());
	exports.Student = Student;
	var Students = (function () {
	    function Students() {
	        this.all = [];
	    }
	    Students.prototype.sync = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            var children;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, axios_1.default.get('/edt/user/children')];
	                    case 1:
	                        children = _a.sent();
	                        this.all = entcore_toolkit_1.Mix.castArrayAs(Student, children.data);
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    return Students;
	}());
	exports.Students = Students;


/***/ }),
/* 77 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	var CourseOccurrence = (function () {
	    function CourseOccurrence(dayOfWeek, roomLabel, startTime, endTime) {
	        if (dayOfWeek === void 0) { dayOfWeek = 1; }
	        if (roomLabel === void 0) { roomLabel = ''; }
	        this.dayOfWeek = dayOfWeek;
	        this.roomLabels = [roomLabel];
	        var start = entcore_1.moment();
	        start = start.add((15 - (start.minute() % 15)), "minutes");
	        if (!startTime) {
	            var d = start.seconds(0).milliseconds(0).format('x');
	            this.startTime = new Date();
	            this.startTime.setTime(d);
	        }
	        else
	            this.startTime = startTime;
	        if (!endTime) {
	            var d = start.seconds(0).milliseconds(0).add(1, 'hours').format('x');
	            this.endTime = new Date();
	            this.endTime.setTime(d);
	        }
	        else
	            this.endTime = endTime;
	    }
	    /**
	     * Format time for user reading
	     * @param {Date} time time to format
	     * @returns {string} returns string time as 'HH:mm'
	     */
	    CourseOccurrence.getFormattedTime = function (time) {
	        return entcore_1.moment(time).format('HH:mm');
	    };
	    /**
	     * Format start time
	     * @returns {string} Returns start time string
	     */
	    CourseOccurrence.prototype.getFormattedStartTime = function () {
	        return CourseOccurrence.getFormattedTime(this.startTime);
	    };
	    /**
	     * Format end time
	     * @returns {string} Returns end time string
	     */
	    CourseOccurrence.prototype.getFormattedEndTime = function () {
	        return CourseOccurrence.getFormattedTime(this.endTime);
	    };
	    CourseOccurrence.prototype.toJSON = function () {
	        return {
	            dayOfWeek: parseInt(this.dayOfWeek),
	            roomLabels: this.roomLabels,
	        };
	    };
	    return CourseOccurrence;
	}());
	exports.CourseOccurrence = CourseOccurrence;


/***/ }),
/* 78 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (this && this.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	var axios_1 = __webpack_require__(47);
	var entcore_toolkit_1 = __webpack_require__(6);
	var Exclusion = (function () {
	    function Exclusion(id_structure) {
	        this.loading = false;
	        this.description = '';
	        if (id_structure)
	            this.id_structure = id_structure;
	    }
	    Exclusion.prototype.save = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        if (!this.id) return [3 /*break*/, 2];
	                        return [4 /*yield*/, this.update()];
	                    case 1:
	                        _a.sent();
	                        return [3 /*break*/, 4];
	                    case 2: return [4 /*yield*/, this.create()];
	                    case 3:
	                        _a.sent();
	                        _a.label = 4;
	                    case 4: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Exclusion.prototype.create = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            var e_1;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        return [4 /*yield*/, axios_1.default.post('/edt/settings/exclusion', this.toJSON())];
	                    case 1:
	                        _a.sent();
	                        return [3 /*break*/, 3];
	                    case 2:
	                        e_1 = _a.sent();
	                        entcore_1.notify.error("edt.notify.exclusion.create.err");
	                        return [3 /*break*/, 3];
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Exclusion.prototype.update = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            var e_2;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        return [4 /*yield*/, axios_1.default.put("/edt/settings/exclusion/" + this.id, this.toJSON())];
	                    case 1:
	                        _a.sent();
	                        return [3 /*break*/, 3];
	                    case 2:
	                        e_2 = _a.sent();
	                        entcore_1.notify.error("edt.notify.exclusion.update.err");
	                        return [3 /*break*/, 3];
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Exclusion.prototype.delete = function () {
	        return __awaiter(this, void 0, void 0, function () {
	            var e_3;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0:
	                        _a.trys.push([0, 2, , 3]);
	                        return [4 /*yield*/, axios_1.default.delete("/edt/settings/exclusion/" + this.id)];
	                    case 1:
	                        _a.sent();
	                        return [3 /*break*/, 3];
	                    case 2:
	                        e_3 = _a.sent();
	                        entcore_1.notify.error("edt.notify.exclusion.delete.err");
	                        return [3 /*break*/, 3];
	                    case 3: return [2 /*return*/];
	                }
	            });
	        });
	    };
	    Exclusion.prototype.isLoading = function () {
	        return this.loading || false;
	    };
	    Exclusion.prototype.toJSON = function () {
	        return {
	            description: this.description,
	            start_date: entcore_1.moment(this.start_date).format('YYYY-MM-DD 00:00:00'),
	            end_date: entcore_1.moment(this.end_date).format('YYYY-MM-DD 23:59:59'),
	            id_structure: this.id_structure
	        };
	    };
	    return Exclusion;
	}());
	exports.Exclusion = Exclusion;
	var Exclusions = (function () {
	    function Exclusions() {
	        this.all = [];
	    }
	    Exclusions.prototype.sync = function (structureId) {
	        return __awaiter(this, void 0, void 0, function () {
	            var exclusions;
	            return __generator(this, function (_a) {
	                switch (_a.label) {
	                    case 0: return [4 /*yield*/, axios_1.default.get("/edt/settings/exclusions?structureId=" + structureId)];
	                    case 1:
	                        exclusions = _a.sent();
	                        this.all = entcore_toolkit_1.Mix.castArrayAs(Exclusion, exclusions.data);
	                        return [2 /*return*/];
	                }
	            });
	        });
	    };
	    return Exclusions;
	}());
	exports.Exclusions = Exclusions;


/***/ }),
/* 79 */
/***/ (function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	/**
	 * Contains each user types
	 * @type {{student: string; personnel: string; relative: string; teacher: string}}
	 */
	exports.USER_TYPES = {
	    student: 'ELEVE',
	    personnel: 'PERSEDUCNAT',
	    relative: 'PERSRELELEVE',
	    teacher: 'ENSEIGNANT'
	};


/***/ }),
/* 80 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	exports.DAYS_OF_WEEK = {
	    days: {
	        1: 'edt.utils.day.1',
	        2: 'edt.utils.day.2',
	        3: 'edt.utils.day.3',
	        4: 'edt.utils.day.4',
	        5: 'edt.utils.day.5',
	        6: 'edt.utils.day.6',
	        7: 'edt.utils.day.7',
	    },
	    get: function (dayNumber) {
	        return entcore_1.idiom.translate(this.days[parseInt(dayNumber)]);
	    }
	};


/***/ }),
/* 81 */
/***/ (function(module, exports) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	exports.COMBO_LABELS = {
	    deselectAll: "Tout déselectionner",
	    options: "Options",
	    searchPlaceholder: "Chercher",
	    selectAll: "Tout sélectionner"
	};


/***/ }),
/* 82 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	var index_1 = __webpack_require__(4);
	var Utils = (function () {
	    function Utils() {
	    }
	    /**
	     * Returns values based on value in parameter.
	     * @param {any[]} values values values containing objects
	     * @param {string} valueName valueName
	     * @returns {string[]} tring array containg names
	     */
	    Utils.getValues = function (values, valueName) {
	        var list = [];
	        for (var i = 0; i < values.length; i++) {
	            list.push(values[i][valueName]);
	        }
	        return list;
	    };
	    /**
	     * Returns a map containing class and functional groups type ids
	     * @returns {Object} map
	     */
	    Utils.getClassGroupTypeMap = function () {
	        return {
	            CLASS: 0,
	            FUNCTIONAL_GROUP: 1,
	        };
	    };
	    /**
	     * Get format occurrence date based on a date, a time and a day of week
	     * @param {string | Date} date date
	     * @param {Date} time time
	     * @param {number} dayOfWeek day of week
	     * @returns {any} a moment object
	     */
	    Utils.getOccurrenceDate = function (date, time, dayOfWeek) {
	        var occurrenceDate = entcore_1.moment(date), occurrenceDay = parseInt(occurrenceDate.day());
	        if (occurrenceDay !== dayOfWeek) {
	            var nextDay = occurrenceDay > dayOfWeek ?
	                dayOfWeek + 7 - occurrenceDay :
	                dayOfWeek - occurrenceDay;
	            occurrenceDate.add('days', nextDay);
	        }
	        occurrenceDate.set('hours', time.getHours());
	        occurrenceDate.set('minutes', time.getMinutes());
	        return occurrenceDate;
	    };
	    Utils.getOccurrenceStartDate = function (date, time, dayOfWeek) {
	        return this.getOccurrenceDate(date, time, dayOfWeek).format('YYYY-MM-DDTHH:mm:ss');
	    };
	    Utils.getOccurrenceEndDate = function (date, time, dayOfWeek) {
	        var occurrenceEndDate = this.getOccurrenceDate(date, time, dayOfWeek);
	        /*if (moment(date).diff(occurrenceEndDate) < 0) {
	            occurrenceEndDate.add('days', -7);
	        }*/
	        return occurrenceEndDate.format('YYYY-MM-DDTHH:mm:ss');
	    };
	    Utils.getOccurrenceDateForOverview = function (date, time, dayOfWeek) {
	        var overviewDate = this.getOccurrenceDate(date, time, dayOfWeek);
	        if (dayOfWeek < entcore_1.moment().day()) {
	            overviewDate.add('days', -7);
	        }
	        return overviewDate.format('YYYY-MM-DDTHH:mm:ss');
	    };
	    Utils.mapStartMomentWithDayOfWeek = function (startMoment, dayOfWeek) {
	        var diff = dayOfWeek - startMoment.day();
	        return startMoment.add('days', diff);
	    };
	    /**
	     * Format courses to display them in the calendar directive
	     * @param courses courses
	     * @param structure structure
	     * @returns {Array} Returns an array containing Course object.
	     */
	    Utils.formatCourses = function (courses, structure) {
	        var _this = this;
	        var arr = [];
	        var edtRights = entcore_1.Behaviours.applicationsBehaviours.edt.rights;
	        courses.forEach(function (course) {
	            course.startDate = _this.mapStartMomentWithDayOfWeek(entcore_1.moment(course.startDate), course.dayOfWeek);
	            var numberWeek = Math.floor(entcore_1.moment(course.endDate).diff(course.startDate, 'days') / 7);
	            if (!entcore_1.model.me.hasWorkflow(edtRights.workflow.create))
	                course.locked = true;
	            if (numberWeek > 0) {
	                var startMoment = entcore_1.moment(course.startDate);
	                // let endMoment = moment(course.endDate).add(moment(course.startDate).diff(course.endDate, 'days'), 'days');
	                var endMoment = entcore_1.moment(course.startDate);
	                endMoment.hour(entcore_1.moment(course.endDate).hour()).minute(entcore_1.moment(course.endDate).minute());
	                for (var i = 0; i < numberWeek; i++) {
	                    var c = new index_1.Course(course, startMoment.format(), endMoment.format());
	                    c.subjectLabel = structure.subjects.mapping[course.subjectId];
	                    arr.push(c);
	                    startMoment = startMoment.add('days', 7);
	                    endMoment = endMoment.add('days', 7);
	                }
	            }
	            else {
	                var c = new index_1.Course(course, entcore_1.moment(course.startDate).format(), entcore_1.moment(course.endDate).format());
	                c.subjectLabel = structure.subjects.mapping[course.subjectId];
	                arr.push(c);
	            }
	        });
	        return arr;
	    };
	    /**
	     * Return if start date is less greater than end date.
	     * @param startDate start date
	     * @param endDate end date
	     * @returns {boolean}
	     */
	    Utils.isLessGreaterThan = function (startDate, endDate) {
	        return entcore_1.moment(endDate).diff(entcore_1.moment(startDate)) > 0;
	    };
	    /**
	     * Return if start date is much greater then end date
	     * @param startDate start date
	     * @param endDate end date
	     * @returns {boolean}
	     */
	    Utils.isMuchGreaterThan = function (startDate, endDate) {
	        return entcore_1.moment(endDate).diff(entcore_1.moment(startDate)) < 0;
	    };
	    /**
	     * Returns if the specified day is in the period provide in parameter
	     * @param {number} dayOfWeek day of week
	     * @param startPeriod period start date
	     * @param endPeriod period end date
	     * @returns {boolean}
	     */
	    Utils.hasOneOrMoreOccurrenceDayInPeriod = function (dayOfWeek, startPeriod, endPeriod) {
	        var bool = true;
	        var periodDayNumber = Math.abs(entcore_1.moment(endPeriod).diff(entcore_1.moment(startPeriod), 'days'));
	        var numberOfWeek = periodDayNumber % 7;
	        if (numberOfWeek === 0) {
	            bool = dayOfWeek >= entcore_1.moment(startPeriod).day()
	                && dayOfWeek <= entcore_1.moment(endPeriod).day();
	        }
	        return bool;
	    };
	    Utils.cleanCourseForSave = function (course) {
	        var _c = index_1.Course.prototype.toJSON.call(course);
	        _c.classes = Utils.getValues(entcore_1._.where(course.groups, { type_groupe: Utils.getClassGroupTypeMap()['CLASS'] }), 'name');
	        _c.groups = Utils.getValues(entcore_1._.where(course.groups, { type_groupe: Utils.getClassGroupTypeMap()['FUNCTIONAL_GROUP'] }), 'name');
	        _c.dayOfWeek = course.dayOfWeek;
	        _c.startDate = course.startMoment ? course.startMoment.format('YYYY-MM-DDTHH:mm:ss') : course.startDate;
	        _c.endDate = course.endMoment ? course.endMoment.format('YYYY-MM-DDTHH:mm:ss') : course.endDate;
	        delete _c['$$haskey'];
	        return _c;
	    };
	    Utils.cleanCourseValuesWithFirstOccurence = function (course) {
	        if (!course || !course.courseOccurrences || !course.courseOccurrences.length)
	            return course;
	        var occ = course.courseOccurrences[0];
	        course.dayOfWeek = occ.dayOfWeek;
	        course.roomLabels = occ.roomLabels;
	        course.startMoment = course.startDate = entcore_1.moment(occ.startTime);
	        course.endMoment = course.endDate = entcore_1.moment(occ.endTime);
	        return course;
	    };
	    /**
	     * Return date based on previous date and previous date day of week and also greater than middleDate
	     * @param previousDate previous date
	     * @returns {any} next date
	     */
	    Utils.getNextCourseDay = function (previousDate, multiplier) {
	        if (multiplier === void 0) { multiplier = 1; }
	        previousDate.add(7 * multiplier, 'days');
	        return previousDate;
	    };
	    Utils.equalsDate = function (firstDate, secondDate) {
	        return entcore_1.moment(firstDate).diff(entcore_1.moment(secondDate), 'minutes') === 0;
	    };
	    /**
	     * Split original course in multiple courses to update new occurrence.
	     * @param {Course} originalCourse Original course
	     * @param {Course} newOccurrence New occurrence
	     * @returns {Course[]} New courses array to update
	     */
	    Utils.splitCourseForUpdate = function (newOccurrence, originalCourse) {
	        var courseToSave = [];
	        if (this.equalsDate(newOccurrence.originalStartMoment, originalCourse.startMoment)) {
	            courseToSave.push(this.cleanCourseForSave(newOccurrence));
	            var _c = new index_1.Course(originalCourse, this.getNextCourseDay(originalCourse.startMoment), originalCourse.endMoment);
	            courseToSave.push(this.cleanCourseForSave(_c));
	        }
	        else if (this.equalsDate(newOccurrence.originalEndMoment, originalCourse.endMoment)) {
	            var _c = new index_1.Course(originalCourse, originalCourse.startMoment, this.getNextCourseDay(originalCourse.endMoment, -1));
	            courseToSave.push(this.cleanCourseForSave(_c));
	            courseToSave.push(this.cleanCourseForSave(newOccurrence));
	        }
	        else {
	            var _start = new index_1.Course(originalCourse, originalCourse.startMoment, this.getNextCourseDay(newOccurrence.originalEndMoment, -1));
	            courseToSave.push(this.cleanCourseForSave(_start));
	            courseToSave.push(this.cleanCourseForSave(newOccurrence));
	            var _end = new index_1.Course(originalCourse, this.getNextCourseDay(newOccurrence.originalStartMoment), originalCourse.endMoment);
	            delete _end._id;
	            courseToSave.push(this.cleanCourseForSave(_end));
	        }
	        return courseToSave;
	    };
	    Utils.getFirstCalendarDay = function () {
	        return entcore_1.model.calendar.firstDay;
	    };
	    Utils.getLastCalendarDay = function () {
	        return entcore_1.moment(entcore_1.model.calendar.firstDay).add(1, entcore_1.model.calendar.increment + 's');
	    };
	    return Utils;
	}());
	exports.Utils = Utils;


/***/ }),
/* 83 */,
/* 84 */,
/* 85 */,
/* 86 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	var axios_1 = __webpack_require__(47);
	var snipplets_1 = __webpack_require__(87);
	var model_1 = __webpack_require__(4);
	exports.edtBehaviours = {
	    rights: {
	        workflow: {
	            view: 'fr.cgi.edt.controllers.EdtController|view',
	            create: 'fr.cgi.edt.controllers.EdtController|create',
	            manage: 'fr.cgi.edt.controllers.EdtController|createExclusion'
	        },
	        resource: {
	            read: {
	                right: "fr-cgi-edt-controllers-EdtController|getEdt"
	            },
	            contrib: {
	                right: "fr-cgi-edt-controllers-EdtController|updateEdt"
	            },
	            manager: {
	                right: "fr-cgi-edt-controllers-EdtController|addRights"
	            }
	        }
	    },
	    loadResources: function (callback) {
	        axios_1.default.get('/edt/list').then(function (edt) {
	            this.resources = entcore_1._.map(entcore_1._.where(edt, { trashed: 0 }), function (edt) {
	                edt.icon = edt.icon || '/img/illustrations/edt-default.png';
	                return {
	                    title: edt.title,
	                    owner: edt.owner,
	                    icon: edt.icon,
	                    path: '/edt#/view-edt/' + edt._id,
	                    _id: edt._id
	                };
	            });
	            callback(this.resources);
	        }.bind(this));
	    },
	    model: {
	        Exclusion: model_1.Exclusion,
	        Exclusions: model_1.Exclusions
	    },
	    sniplets: {
	        settings: snipplets_1.SETTINGS_SNIPPLET
	    }
	};


/***/ }),
/* 87 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	function __export(m) {
	    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
	}
	Object.defineProperty(exports, "__esModule", { value: true });
	__export(__webpack_require__(88));


/***/ }),
/* 88 */
/***/ (function(module, exports, __webpack_require__) {

	"use strict";
	var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
	    return new (P || (P = Promise))(function (resolve, reject) {
	        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
	        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
	        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
	        step((generator = generator.apply(thisArg, _arguments || [])).next());
	    });
	};
	var __generator = (this && this.__generator) || function (thisArg, body) {
	    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
	    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
	    function verb(n) { return function (v) { return step([n, v]); }; }
	    function step(op) {
	        if (f) throw new TypeError("Generator is already executing.");
	        while (_) try {
	            if (f = 1, y && (t = y[op[0] & 2 ? "return" : op[0] ? "throw" : "next"]) && !(t = t.call(y, op[1])).done) return t;
	            if (y = 0, t) op = [0, t.value];
	            switch (op[0]) {
	                case 0: case 1: t = op; break;
	                case 4: _.label++; return { value: op[1], done: false };
	                case 5: _.label++; y = op[1]; op = [0]; continue;
	                case 7: op = _.ops.pop(); _.trys.pop(); continue;
	                default:
	                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
	                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
	                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
	                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
	                    if (t[2]) _.ops.pop();
	                    _.trys.pop(); continue;
	            }
	            op = body.call(thisArg, _);
	        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
	        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
	    }
	};
	Object.defineProperty(exports, "__esModule", { value: true });
	var entcore_1 = __webpack_require__(1);
	var entcore_toolkit_1 = __webpack_require__(6);
	var model_1 = __webpack_require__(4);
	exports.SETTINGS_SNIPPLET = {
	    hidden: true,
	    controller: {
	        init: function () {
	            return __awaiter(this, void 0, void 0, function () {
	                var _this = this;
	                return __generator(this, function (_a) {
	                    this.display = {
	                        exclusionForm: false,
	                        DropLightbox: false
	                    };
	                    this.current = { exclusion: null };
	                    this.sort = {
	                        type: 'start_date',
	                        reverse: false
	                    };
	                    this.exclusions = new entcore_1.Behaviours.applicationsBehaviours.edt.model.Exclusions();
	                    this.$watch(function () { return _this.structure; }, function () { return __awaiter(_this, void 0, void 0, function () {
	                        return __generator(this, function (_a) {
	                            switch (_a.label) {
	                                case 0:
	                                    if (!(this.structure !== undefined)) return [3 /*break*/, 2];
	                                    return [4 /*yield*/, this.exclusions.sync(this.structure.id)];
	                                case 1:
	                                    _a.sent();
	                                    this.$apply();
	                                    _a.label = 2;
	                                case 2: return [2 /*return*/];
	                            }
	                        });
	                    }); });
	                    return [2 /*return*/];
	                });
	            });
	        },
	        addExclusion: function () {
	            this.openExclusionForm(new entcore_1.Behaviours.applicationsBehaviours.edt.model.Exclusion(this.structure.id));
	        },
	        openExclusionForm: function (exclusion) {
	            console.log('opening');
	            this.current.exclusion = exclusion;
	            if (exclusion.id) {
	                this.current.tmpExclusion = new model_1.Exclusion();
	                this.current.tmpExclusion = entcore_toolkit_1.Mix.castAs(model_1.Exclusion, exclusion);
	            }
	            this.display.exclusionForm = true;
	        },
	        cancelExclusionForm: function () {
	            if (this.current.tmpExclusion) {
	                for (var key in this.current.tmpExclusion) {
	                    this.current.exclusion[key] = this.current.tmpExclusion[key];
	                }
	                delete this.current.tmpExclusion;
	            }
	            this.display.exclusionForm = false;
	        },
	        createExclusion: function () {
	            return __awaiter(this, void 0, void 0, function () {
	                return __generator(this, function (_a) {
	                    switch (_a.label) {
	                        case 0:
	                            this.current.exclusion.loading = true;
	                            return [4 /*yield*/, this.current.exclusion.save()];
	                        case 1:
	                            _a.sent();
	                            this.display.exclusionForm = false;
	                            this.current.exclusion.loading = false;
	                            return [4 /*yield*/, this.exclusions.sync(this.structure.id)];
	                        case 2:
	                            _a.sent();
	                            this.$apply();
	                            return [2 /*return*/];
	                    }
	                });
	            });
	        },
	        validDeletion: function (ex) {
	            return __awaiter(this, void 0, void 0, function () {
	                return __generator(this, function (_a) {
	                    switch (_a.label) {
	                        case 0: return [4 /*yield*/, ex.delete()];
	                        case 1:
	                            _a.sent();
	                            this.display.DropLightbox = false;
	                            return [4 /*yield*/, this.exclusions.sync(this.structure.id)];
	                        case 2:
	                            _a.sent();
	                            this.$apply();
	                            return [2 /*return*/];
	                    }
	                });
	            });
	        },
	        cancelDeletion: function () {
	            this.display.DropLightbox = false;
	            delete this.current.exclusion;
	        },
	        dropExclusion: function (ex) {
	            this.current.exclusion = ex;
	            this.display.DropLightbox = true;
	        },
	        formatDate: function (date) {
	            return entcore_1.moment(date).format('DD/MM/YYYY');
	        },
	        currentExclusionValidation: function () {
	            if (this.current.exclusion) {
	                return this.current.exclusion.description.trim() !== ''
	                    && entcore_1.moment(this.current.exclusion.end_date)
	                        .diff(entcore_1.moment(this.current.exclusion.start_date)) >= 0;
	            }
	        },
	        updateExclusion: function (exclusion) {
	            var _this = this;
	            exclusion.save().then(function () {
	                exclusion.loading = false;
	                _this.$apply();
	            });
	            exclusion.loading = true;
	            this.$apply();
	        }
	    }
	};


/***/ })
/******/ ]);
//# sourceMappingURL=behaviours.js.map