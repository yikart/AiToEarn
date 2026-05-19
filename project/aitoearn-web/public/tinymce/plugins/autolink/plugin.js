/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global$1 = tinymce.util.Tools.resolve('tinymce.PluginManager');

    /* eslint-disable @typescript-eslint/no-wrapper-object-types */
    const hasProto = (v, constructor, predicate) => {
        if (predicate(v, constructor.prototype)) {
            return true;
        }
        else {
            // String-based fallback time
            return v.constructor?.name === constructor.name;
        }
    };
    const typeOf = (x) => {
        const t = typeof x;
        if (x === null) {
            return 'null';
        }
        else if (t === 'object' && Array.isArray(x)) {
            return 'array';
        }
        else if (t === 'object' && hasProto(x, String, (o, proto) => proto.isPrototypeOf(o))) {
            return 'string';
        }
        else {
            return t;
        }
    };
    const isType = (type) => (value) => typeOf(value) === type;
    const eq = (t) => (a) => t === a;
    const isString = isType('string');
    const isUndefined = eq(undefined);
    const isNullable = (a) => a === null || a === undefined;
    const isNonNullable = (a) => !isNullable(a);

    const not = (f) => (t) => !f(t);

    const hasOwnProperty = Object.hasOwnProperty;
    const has = (obj, key) => hasOwnProperty.call(obj, key);

    const checkRange = (str, substr, start) => substr === '' || str.length >= substr.length && str.substr(start, start + substr.length) === substr;
    const contains = (str, substr, start = 0, end) => {
        const idx = str.indexOf(substr, start);
        if (idx !== -1) {
            return isUndefined(end) ? true : idx + substr.length <= end;
        }
        else {
            return false;
        }
    };
    /** Does 'str' start with 'prefix'?
     *  Note: all strings start with the empty string.
     *        More formally, for all strings x, startsWith(x, "").
     *        This is so that for all strings x and y, startsWith(y + x, y)
     */
    const startsWith = (str, prefix) => {
        return checkRange(str, prefix, 0);
    };

    const zeroWidth = '\uFEFF';
    const isZwsp = (char) => char === zeroWidth;
    const removeZwsp = (s) => s.replace(/\uFEFF/g, '');

    /*
      The RegEx parses the following components (https://www.rfc-editor.org/rfc/rfc3986.txt):

        scheme:[//[user:password@]host[:port]][/]path[?query][#fragment]

              foo://example.com:8042/over/there?name=ferret#nose
              \_/   \______________/\_________/ \_________/ \__/
              |           |            |            |        |
            scheme     authority       path        query   fragment

      Originally from:
        http://blog.mattheworiordan.com/post/13174566389/url-regular-expression-for-links-with-or-without-the

      Modified to:
      - include port numbers
      - allow full stops in email addresses
      - allow [-.~*+=!&;:'%@?^${}(),\/\w] after the #
      - allow [-.~*+=!&;:'%@?^${}(),\/\w] after the ?
      - move allow -_.~*+=!&;:'%@?^${}() in email usernames to the first @ match (TBIO-4809)
      - enforce domains to be [A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)* so they can't end in a period (TBIO-4809)
      - removed a bunch of escaping, made every group non-capturing (during TBIO-4809)
      - colons are only valid when followed directly by // or some text and then @ (TBIO-4867)
      - only include the fragment '#' if it has 1 or more trailing matches
      - only include the query '?' if it has 1 or more trailing matches
      - allow commas in URL path
      - exclude trailing comma and period in URL path
      - allow up to 15 character schemes including all valid characters from the spec https://url.spec.whatwg.org/#url-scheme-string (TINY-5074)
      - changed instances of 0-9 to be \d (TINY-5074)
      - reduced duplication (TINY-5074)
      - allow [*!;:'@$] in the path segment as they are valid characters per the spec: https://url.spec.whatwg.org/#url-path-segment-string (TINY-8069)

    (?:
      (?:
        [A-Za-z][A-Za-z\d.+-]{0,14}:\/\/(?:[-.~*+=!&;:'%@?^${}(),\w]+@)?
        | www\.
        | [-;:&=+$,.\w]+@
      )
      [A-Za-z\d-]+
      (?:\.[A-Za-z\d-]+)*
    )
    (?::\d+)?
    (?:
      \/
      (?:
         [-.~*+=!;:'%@$(),\/\w]*[-~*+=%@$()\/\w]
       )?
    )?
    (?:
      \?
      (?:
        [-.~*+=!&;:'%@?^${}(),\/\w]+
      )
    )?
    (?:
      #
      (?:
        [-.~*+=!&;:'%@?^${}(),\/\w]+
      )
    )?
    */
    const link = () => 
    // eslint-disable-next-line max-len
    /(?:[A-Za-z][A-Za-z\d.+-]{0,14}:\/\/(?:[-.~*+=!&;:'%@?^${}(),\w]+@)?|www\.|[-;:&=+$,.\w]+@)[A-Za-z\d-]+(?:\.[A-Za-z\d-]+)*(?::\d+)?(?:\/(?:[-.~*+=!;:'%@$(),\/\w]*[-~*+=%@$()\/\w])?)?(?:\?(?:[-.~*+=!&;:'%@?^${}(),\/\w]+))?(?:#(?:[-.~*+=!&;:'%@?^${}(),\/\w]+))?/g;

    const option = (name) => (editor) => editor.options.get(name);
    const register = (editor) => {
        const registerOption = editor.options.register;
        registerOption('autolink_pattern', {
            processor: 'regexp',
            // Use the Polaris link detection, however for autolink we need to make it be an exact match
            default: new RegExp('^' + link().source + '$', 'i')
        });
        registerOption('link_default_target', {
            processor: 'string'
        });
        registerOption('link_default_protocol', {
            processor: 'string',
            default: 'https'
        });
    };
    const getAutoLinkPattern = option('autolink_pattern');
    const getDefaultLinkTarget = option('link_default_target');
    const getDefaultLinkProtocol = option('link_default_protocol');
    const allowUnsafeLinkTarget = option('allow_unsafe_link_target');

    var global = tinymce.util.Tools.resolve('tinymce.dom.TextSeeker');

    const isTextNode = (node) => node.nodeType === 3;
    const isElement = (node) => node.nodeType === 1;
    const isBracketOrSpace = (char) => /^[(\[{ \u00a0]$/.test(char);
    // Note: This is similar to the Polaris protocol detection, except it also handles `mailto` and any length scheme
    const hasProtocol = (url) => /^([A-Za-z][A-Za-z\d.+-]*:\/\/)|mailto:/.test(url);
    // A limited list of punctuation characters that might be used after a link
    const isPunctuation = (char) => /[?!,.;:]/.test(char);
    const findChar = (text, index, predicate) => {
        for (let i = index - 1; i >= 0; i--) {
            const char = text.charAt(i);
            if (!isZwsp(char) && predicate(char)) {
                return i;
            }
        }
        return -1;
    };
    const freefallRtl = (container, offset) => {
        let tempNode = container;
        let tempOffset = offset;
        while (isElement(tempNode) && tempNode.childNodes[tempOffset]) {
            tempNode = tempNode.childNodes[tempOffset];
            tempOffset = isTextNode(tempNode) ? tempNode.data.length : tempNode.childNodes.length;
        }
        return { container: tempNode, offset: tempOffset };
    };

    const parseCurrentLine = (editor, offset) => {
        const voidElements = editor.schema.getVoidElements();
        const autoLinkPattern = getAutoLinkPattern(editor);
        const { dom, selection } = editor;
        // Never create a link when we are inside a link
        if (dom.getParent(selection.getNode(), 'a[href]') !== null || editor.mode.isReadOnly()) {
            return null;
        }
        const rng = selection.getRng();
        const textSeeker = global(dom, (node) => {
            return dom.isBlock(node) || has(voidElements, node.nodeName.toLowerCase()) || dom.getContentEditable(node) === 'false' || dom.getParent(node, 'a[href]') !== null;
        });
        // Descend down the end container to find the text node
        const { container: endContainer, offset: endOffset } = freefallRtl(rng.endContainer, rng.endOffset);
        // Find the root container to use when walking
        const root = dom.getParent(endContainer, dom.isBlock) ?? dom.getRoot();
        // Move the selection backwards to the start of the potential URL to account for the pressed character
        // while also excluding the last full stop from a word like "www.site.com."
        const endSpot = textSeeker.backwards(endContainer, endOffset + offset, (node, offset) => {
            const text = node.data;
            const idx = findChar(text, offset, not(isBracketOrSpace));
            // Move forward one so the offset is after the found character unless the found char is a punctuation char
            return idx === -1 || isPunctuation(text[idx]) ? idx : idx + 1;
        }, root);
        if (!endSpot) {
            return null;
        }
        // Walk backwards until we find a boundary or a bracket/space
        let lastTextNode = endSpot.container;
        const startSpot = textSeeker.backwards(endSpot.container, endSpot.offset, (node, offset) => {
            lastTextNode = node;
            const idx = findChar(node.data, offset, isBracketOrSpace);
            // Move forward one so that the offset is after the bracket/space
            return idx === -1 ? idx : idx + 1;
        }, root);
        const newRng = dom.createRng();
        if (!startSpot) {
            newRng.setStart(lastTextNode, 0);
        }
        else {
            newRng.setStart(startSpot.container, startSpot.offset);
        }
        newRng.setEnd(endSpot.container, endSpot.offset);
        const rngText = removeZwsp(newRng.toString());
        const matches = rngText.match(autoLinkPattern);
        if (matches) {
            let url = matches[0];
            if (startsWith(url, 'www.')) {
                const protocol = getDefaultLinkProtocol(editor);
                url = protocol + '://' + url;
            }
            else if (contains(url, '@') && !hasProtocol(url)) {
                url = 'mailto:' + url;
            }
            return { rng: newRng, url };
        }
        else {
            return null;
        }
    };
    const convertToLink = (editor, result) => {
        const { dom, selection } = editor;
        const { rng, url } = result;
        const bookmark = selection.getBookmark();
        selection.setRng(rng);
        // Needs to be a native createlink command since this is executed in a keypress event handler
        // so the pending character that is to be inserted needs to be inserted after the link. That will not
        // happen if we use the formatter create link version. Since we're using the native command
        // then we also need to ensure the exec command events are fired for backwards compatibility.
        const command = 'createlink';
        const args = { command, ui: false, value: url };
        const beforeExecEvent = editor.dispatch('BeforeExecCommand', args);
        if (!beforeExecEvent.isDefaultPrevented()) {
            editor.getDoc().execCommand(command, false, url);
            editor.dispatch('ExecCommand', args);
            const defaultLinkTarget = getDefaultLinkTarget(editor);
            if (isString(defaultLinkTarget)) {
                const anchor = selection.getNode();
                dom.setAttrib(anchor, 'target', defaultLinkTarget);
                // Ensure noopener is added for blank targets to prevent window opener attacks
                if (defaultLinkTarget === '_blank' && !allowUnsafeLinkTarget(editor)) {
                    dom.setAttrib(anchor, 'rel', 'noopener');
                }
            }
        }
        selection.moveToBookmark(bookmark);
        editor.nodeChanged();
    };
    const handleSpacebar = (editor) => {
        const result = parseCurrentLine(editor, -1);
        if (isNonNullable(result)) {
            convertToLink(editor, result);
        }
    };
    const handleBracket = handleSpacebar;
    const handleEnter = (editor) => {
        const result = parseCurrentLine(editor, 0);
        if (isNonNullable(result)) {
            convertToLink(editor, result);
        }
    };
    const setup = (editor) => {
        editor.on('keydown', (e) => {
            if (e.keyCode === 13 && !e.isDefaultPrevented()) {
                handleEnter(editor);
            }
        });
        editor.on('keyup', (e) => {
            if (e.keyCode === 32) {
                handleSpacebar(editor);
                // One of the closing bracket keys: ), ] or }
            }
            else if (e.keyCode === 48 && e.shiftKey || e.keyCode === 221) {
                handleBracket(editor);
            }
        });
    };

    var Plugin = () => {
        global$1.add('autolink', (editor) => {
            register(editor);
            setup(editor);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
