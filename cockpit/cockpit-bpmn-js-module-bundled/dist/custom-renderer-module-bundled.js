var DEFAULT_RENDER_PRIORITY = 1000;

/**
 * @typedef {import('../core/Types').ElementLike} Element
 * @typedef {import('../core/Types').ConnectionLike} Connection
 * @typedef {import('../core/Types').ShapeLike} Shape
 *
 * @typedef {import('../core/EventBus').default} EventBus
 */

/**
 * The base implementation of shape and connection renderers.
 *
 * @param {EventBus} eventBus
 * @param {number} [renderPriority=1000]
 */
function BaseRenderer(eventBus, renderPriority) {
  var self = this;

  renderPriority = renderPriority || DEFAULT_RENDER_PRIORITY;

  eventBus.on([ 'render.shape', 'render.connection' ], renderPriority, function(evt, context) {
    var type = evt.type,
        element = context.element,
        visuals = context.gfx,
        attrs = context.attrs;

    if (self.canRender(element)) {
      if (type === 'render.shape') {
        return self.drawShape(visuals, element, attrs);
      } else {
        return self.drawConnection(visuals, element, attrs);
      }
    }
  });

  eventBus.on([ 'render.getShapePath', 'render.getConnectionPath' ], renderPriority, function(evt, element) {
    if (self.canRender(element)) {
      if (evt.type === 'render.getShapePath') {
        return self.getShapePath(element);
      } else {
        return self.getConnectionPath(element);
      }
    }
  });
}

/**
 * Checks whether an element can be rendered.
 *
 * @param {Element} element The element to be rendered.
 *
 * @return {boolean} Whether the element can be rendered.
 */
BaseRenderer.prototype.canRender = function(element) {};

/**
 * Draws a shape.
 *
 * @param {SVGElement} visuals The SVG element to draw the shape into.
 * @param {Shape} shape The shape to be drawn.
 *
 * @return {SVGElement} The SVG element of the shape drawn.
 */
BaseRenderer.prototype.drawShape = function(visuals, shape) {};

/**
 * Draws a connection.
 *
 * @param {SVGElement} visuals The SVG element to draw the connection into.
 * @param {Connection} connection The connection to be drawn.
 *
 * @return {SVGElement} The SVG element of the connection drawn.
 */
BaseRenderer.prototype.drawConnection = function(visuals, connection) {};

/**
 * Gets the SVG path of the graphical representation of a shape.
 *
 * @param {Shape} shape The shape.
 *
 * @return {string} The SVG path of the shape.
 */
BaseRenderer.prototype.getShapePath = function(shape) {};

/**
 * Gets the SVG path of the graphical representation of a connection.
 *
 * @param {Connection} connection The connection.
 *
 * @return {string} The SVG path of the connection.
 */
BaseRenderer.prototype.getConnectionPath = function(connection) {};

function ensureImported(element, target) {

  if (element.ownerDocument !== target.ownerDocument) {
    try {

      // may fail on webkit
      return target.ownerDocument.importNode(element, true);
    } catch (e) {

      // ignore
    }
  }

  return element;
}

/**
 * appendTo utility
 */


/**
 * Append a node to a target element and return the appended node.
 *
 * @param  {SVGElement} element
 * @param  {SVGElement} target
 *
 * @return {SVGElement} the appended node
 */
function appendTo(element, target) {
  return target.appendChild(ensureImported(element, target));
}

/**
 * append utility
 */


/**
 * Append a node to an element
 *
 * @param  {SVGElement} element
 * @param  {SVGElement} node
 *
 * @return {SVGElement} the element
 */
function append(target, node) {
  appendTo(node, target);
  return target;
}

/**
 * attribute accessor utility
 */

var LENGTH_ATTR = 2;

var CSS_PROPERTIES = {
  'alignment-baseline': 1,
  'baseline-shift': 1,
  'clip': 1,
  'clip-path': 1,
  'clip-rule': 1,
  'color': 1,
  'color-interpolation': 1,
  'color-interpolation-filters': 1,
  'color-profile': 1,
  'color-rendering': 1,
  'cursor': 1,
  'direction': 1,
  'display': 1,
  'dominant-baseline': 1,
  'enable-background': 1,
  'fill': 1,
  'fill-opacity': 1,
  'fill-rule': 1,
  'filter': 1,
  'flood-color': 1,
  'flood-opacity': 1,
  'font': 1,
  'font-family': 1,
  'font-size': LENGTH_ATTR,
  'font-size-adjust': 1,
  'font-stretch': 1,
  'font-style': 1,
  'font-variant': 1,
  'font-weight': 1,
  'glyph-orientation-horizontal': 1,
  'glyph-orientation-vertical': 1,
  'image-rendering': 1,
  'kerning': 1,
  'letter-spacing': 1,
  'lighting-color': 1,
  'marker': 1,
  'marker-end': 1,
  'marker-mid': 1,
  'marker-start': 1,
  'mask': 1,
  'opacity': 1,
  'overflow': 1,
  'pointer-events': 1,
  'shape-rendering': 1,
  'stop-color': 1,
  'stop-opacity': 1,
  'stroke': 1,
  'stroke-dasharray': 1,
  'stroke-dashoffset': 1,
  'stroke-linecap': 1,
  'stroke-linejoin': 1,
  'stroke-miterlimit': 1,
  'stroke-opacity': 1,
  'stroke-width': LENGTH_ATTR,
  'text-anchor': 1,
  'text-decoration': 1,
  'text-rendering': 1,
  'unicode-bidi': 1,
  'visibility': 1,
  'word-spacing': 1,
  'writing-mode': 1
};


function getAttribute(node, name) {
  if (CSS_PROPERTIES[name]) {
    return node.style[name];
  } else {
    return node.getAttributeNS(null, name);
  }
}

function setAttribute(node, name, value) {
  var hyphenated = name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();

  var type = CSS_PROPERTIES[hyphenated];

  if (type) {

    // append pixel unit, unless present
    if (type === LENGTH_ATTR && typeof value === 'number') {
      value = String(value) + 'px';
    }

    node.style[hyphenated] = value;
  } else {
    node.setAttributeNS(null, name, value);
  }
}

function setAttributes(node, attrs) {

  var names = Object.keys(attrs), i, name;

  for (i = 0, name; (name = names[i]); i++) {
    setAttribute(node, name, attrs[name]);
  }
}

/**
 * Gets or sets raw attributes on a node.
 *
 * @param  {SVGElement} node
 * @param  {Object} [attrs]
 * @param  {String} [name]
 * @param  {String} [value]
 *
 * @return {String}
 */
function attr(node, name, value) {
  if (typeof name === 'string') {
    {
      return getAttribute(node, name);
    }
  } else {
    setAttributes(node, name);
  }

  return node;
}

var ns = {
  svg: 'http://www.w3.org/2000/svg'
};

/**
 * DOM parsing utility
 */


var SVG_START = '<svg xmlns="' + ns.svg + '"';

function parse(svg) {

  var unwrap = false;

  // ensure we import a valid svg document
  if (svg.substring(0, 4) === '<svg') {
    if (svg.indexOf(ns.svg) === -1) {
      svg = SVG_START + svg.substring(4);
    }
  } else {

    // namespace svg
    svg = SVG_START + '>' + svg + '</svg>';
    unwrap = true;
  }

  var parsed = parseDocument(svg);

  if (!unwrap) {
    return parsed;
  }

  var fragment = document.createDocumentFragment();

  var parent = parsed.firstChild;

  while (parent.firstChild) {
    fragment.appendChild(parent.firstChild);
  }

  return fragment;
}

function parseDocument(svg) {

  var parser;

  // parse
  parser = new DOMParser();
  parser.async = false;

  return parser.parseFromString(svg, 'text/xml');
}

/**
 * Create utility for SVG elements
 */



/**
 * Create a specific type from name or SVG markup.
 *
 * @param {String} name the name or markup of the element
 * @param {Object} [attrs] attributes to set on the element
 *
 * @returns {SVGElement}
 */
function create(name, attrs) {
  var element;

  name = name.trim();

  if (name.charAt(0) === '<') {
    element = parse(name).firstChild;
    element = document.importNode(element, true);
  } else {
    element = document.createElementNS(ns.svg, name);
  }

  return element;
}

function remove(element) {
  var parent = element.parentNode;

  if (parent) {
    parent.removeChild(element);
  }

  return element;
}

/**
 * Flatten array, one level deep.
 *
 * @template T
 *
 * @param {T[][] | T[] | null} [arr]
 *
 * @return {T[]}
 */

const nativeToString = Object.prototype.toString;
const nativeHasOwnProperty = Object.prototype.hasOwnProperty;

function isUndefined(obj) {
  return obj === undefined;
}

function isNil(obj) {
  return obj == null;
}

function isArray(obj) {
  return nativeToString.call(obj) === '[object Array]';
}

/**
 * @param {any} obj
 *
 * @return {boolean}
 */
function isFunction(obj) {
  const tag = nativeToString.call(obj);

  return (
    tag === '[object Function]' ||
    tag === '[object AsyncFunction]' ||
    tag === '[object GeneratorFunction]' ||
    tag === '[object AsyncGeneratorFunction]' ||
    tag === '[object Proxy]'
  );
}

/**
 * Return true, if target owns a property with the given key.
 *
 * @param {Object} target
 * @param {String} key
 *
 * @return {Boolean}
 */
function has(target, key) {
  return !isNil(target) && nativeHasOwnProperty.call(target, key);
}

/**
 * @template T
 * @typedef { (
 *   ((e: T) => boolean) |
 *   ((e: T, idx: number) => boolean) |
 *   ((e: T, key: string) => boolean) |
 *   string |
 *   number
 * ) } Matcher
 */

/**
 * @template T
 * @template U
 *
 * @typedef { (
 *   ((e: T) => U) | string | number
 * ) } Extractor
 */


/**
 * @template T
 * @typedef { (val: T, key: any) => boolean } MatchFn
 */

/**
 * @template T
 * @typedef { T[] } ArrayCollection
 */

/**
 * @template T
 * @typedef { { [key: string]: T } } StringKeyValueCollection
 */

/**
 * @template T
 * @typedef { { [key: number]: T } } NumberKeyValueCollection
 */

/**
 * @template T
 * @typedef { StringKeyValueCollection<T> | NumberKeyValueCollection<T> } KeyValueCollection
 */

/**
 * @template T
 * @typedef { KeyValueCollection<T> | ArrayCollection<T> } Collection
 */

/**
 * Find element in collection.
 *
 * @template T
 * @param {Collection<T>} collection
 * @param {Matcher<T>} matcher
 *
 * @return {Object}
 */
function find(collection, matcher) {

  const matchFn = toMatcher(matcher);

  let match;

  forEach(collection, function(val, key) {
    if (matchFn(val, key)) {
      match = val;

      return false;
    }
  });

  return match;

}


/**
 * Iterate over collection; returning something
 * (non-undefined) will stop iteration.
 *
 * @template T
 * @param {Collection<T>} collection
 * @param { ((item: T, idx: number) => (boolean|void)) | ((item: T, key: string) => (boolean|void)) } iterator
 *
 * @return {T} return result that stopped the iteration
 */
function forEach(collection, iterator) {

  let val,
      result;

  if (isUndefined(collection)) {
    return;
  }

  const convertKey = isArray(collection) ? toNum : identity;

  for (let key in collection) {

    if (has(collection, key)) {
      val = collection[key];

      result = iterator(val, convertKey(key));

      if (result === false) {
        return val;
      }
    }
  }
}


/**
 * Return true if some elements in the collection
 * match the criteria.
 *
 * @param  {Object|Array} collection
 * @param  {Function} matcher
 *
 * @return {Boolean}
 */
function some(collection, matcher) {

  return !!find(collection, matcher);
}


/**
 * @template T
 * @param {Matcher<T>} matcher
 *
 * @return {MatchFn<T>}
 */
function toMatcher(matcher) {
  return isFunction(matcher) ? matcher : (e) => {
    return e === matcher;
  };
}


function identity(arg) {
  return arg;
}

function toNum(arg) {
  return Number(arg);
}

/**
 * @typedef { import('../model/Types').Element } Element
 * @typedef { import('../model/Types').ModdleElement } ModdleElement
 */

/**
 * Is an element of the given BPMN type?
 *
 * @param  {Element|ModdleElement} element
 * @param  {string} type
 *
 * @return {boolean}
 */
function is(element, type) {
  var bo = getBusinessObject(element);

  return bo && (typeof bo.$instanceOf === 'function') && bo.$instanceOf(type);
}


/**
 * Return true if element has any of the given types.
 *
 * @param {Element|ModdleElement} element
 * @param {string[]} types
 *
 * @return {boolean}
 */
function isAny(element, types) {
  return some(types, function(t) {
    return is(element, t);
  });
}

/**
 * Return the business object for a given element.
 *
 * @param {Element|ModdleElement} element
 *
 * @return {ModdleElement}
 */
function getBusinessObject(element) {
  return (element && element.businessObject) || element;
}

/**
 * @typedef {(string|number)[]} Component
 *
 * @typedef {import('../util/Types').Point} Point
 */

/**
 * @param {Component[] | Component[][]} elements
 *
 * @return {string}
 */
function componentsToPath(elements) {
  return elements.flat().join(',').replace(/,?([A-Za-z]),?/g, '$1');
}

/**
 * @param {ShapeLike} shape
 * @param {number} [borderRadius]
 *
 * @return {string} path
 */
function getRoundRectPath(shape, borderRadius) {

  var x = shape.x,
      y = shape.y,
      width = shape.width,
      height = shape.height;

  var roundRectPath = [
    [ 'M', x + borderRadius, y ],
    [ 'l', width - borderRadius * 2, 0 ],
    [ 'a', borderRadius, borderRadius, 0, 0, 1, borderRadius, borderRadius ],
    [ 'l', 0, height - borderRadius * 2 ],
    [ 'a', borderRadius, borderRadius, 0, 0, 1, -2, borderRadius ],
    [ 'l', borderRadius * 2 - width, 0 ],
    [ 'a', borderRadius, borderRadius, 0, 0, 1, -2, -2 ],
    [ 'l', 0, borderRadius * 2 - height ],
    [ 'a', borderRadius, borderRadius, 0, 0, 1, borderRadius, -2 ],
    [ 'z' ]
  ];

  return componentsToPath(roundRectPath);
}

/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


const HIGH_PRIORITY = 1500,
      TASK_BORDER_RADIUS = 2;


class CustomRenderer extends BaseRenderer {
  constructor(eventBus, bpmnRenderer) {
    super(eventBus, HIGH_PRIORITY);

    this.bpmnRenderer = bpmnRenderer;
  }

  canRender(element) {

    // only render tasks and events (ignore labels)
    return isAny(element, [ 'bpmn:Task', 'bpmn:Event' ]) && !element.labelTarget;
  }

  drawShape(parentNode, element) {
    const shape = this.bpmnRenderer.drawShape(parentNode, element);

    if (is(element, 'bpmn:Task')) {
      const rect = drawRect(parentNode, 100, 80, TASK_BORDER_RADIUS, '#52B415');

      prependTo(rect, parentNode);

      remove(shape);

      return shape;
    }

    const rect = drawRect(parentNode, 30, 20, TASK_BORDER_RADIUS, '#cc0000');

    attr(rect, {
      transform: 'translate(-20, -10)'
    });

    return shape;
  }

  getShapePath(shape) {
    if (is(shape, 'bpmn:Task')) {
      return getRoundRectPath(shape, TASK_BORDER_RADIUS);
    }

    return this.bpmnRenderer.getShapePath(shape);
  }
}

CustomRenderer.$inject = [ 'eventBus', 'bpmnRenderer' ];

// helpers //////////

// copied from https://github.com/bpmn-io/bpmn-js/blob/master/lib/draw/BpmnRenderer.js
function drawRect(parentNode, width, height, borderRadius, strokeColor) {
  const rect = create('rect');

  attr(rect, {
    width: width,
    height: height,
    rx: borderRadius,
    ry: borderRadius,
    stroke: strokeColor || '#000',
    strokeWidth: 2,
    fill: '#fff'
  });

  append(parentNode, rect);

  return rect;
}

// copied from https://github.com/bpmn-io/diagram-js/blob/master/lib/core/GraphicsFactory.js
function prependTo(newNode, parentNode, siblingNode) {
  parentNode.insertBefore(newNode, parentNode.firstChild);
}

/*
 * Copyright Camunda Services GmbH and/or licensed to Camunda Services GmbH
 * under one or more contributor license agreements. See the NOTICE file
 * distributed with this work for additional information regarding copyright
 * ownership. Camunda licenses this file to you under the Apache License,
 * Version 2.0; you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var index = {
  __init__: [ 'customRenderer' ],
  customRenderer: [ 'type', CustomRenderer ]
};

export { index as default };
