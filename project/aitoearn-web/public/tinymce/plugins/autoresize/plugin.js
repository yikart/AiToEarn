/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    const Cell = (initial) => {
        let value = initial;
        const get = () => {
            return value;
        };
        const set = (v) => {
            value = v;
        };
        return {
            get,
            set
        };
    };

    var global$1 = tinymce.util.Tools.resolve('tinymce.PluginManager');

    var global = tinymce.util.Tools.resolve('tinymce.Env');

    const fireResizeEditor = (editor) => editor.dispatch('ResizeEditor');

    const option = (name) => (editor) => editor.options.get(name);
    const register$1 = (editor) => {
        const registerOption = editor.options.register;
        registerOption('autoresize_overflow_padding', {
            processor: 'number',
            default: 1
        });
        registerOption('autoresize_bottom_margin', {
            processor: 'number',
            default: 50
        });
    };
    const getMinHeight = option('min_height');
    const getMaxHeight = option('max_height');
    const getAutoResizeOverflowPadding = option('autoresize_overflow_padding');
    const getAutoResizeBottomMargin = option('autoresize_bottom_margin');

    /**
     * This class contains all core logic for the autoresize plugin.
     *
     * @class tinymce.autoresize.Plugin
     * @private
     */
    const isFullscreen = (editor) => editor.plugins.fullscreen && editor.plugins.fullscreen.isFullscreen();
    const toggleScrolling = (editor, state) => {
        const body = editor.getBody();
        if (body) {
            body.style.overflowY = state ? '' : 'hidden';
            if (!state) {
                body.scrollTop = 0;
            }
        }
    };
    const parseCssValueToInt = (dom, elm, name, computed) => {
        const value = parseInt(dom.getStyle(elm, name, computed) ?? '', 10);
        // The value maybe be an empty string, so in that case treat it as being 0
        return isNaN(value) ? 0 : value;
    };
    const shouldScrollIntoView = (trigger) => {
        // Only scroll the selection into view when we're inserting content. Any other
        // triggers the selection should already be in view and resizing would only
        // extend the content area.
        if (trigger?.type.toLowerCase() === 'setcontent') {
            const setContentEvent = trigger;
            return setContentEvent.selection === true || setContentEvent.paste === true;
        }
        else {
            return false;
        }
    };
    /**
     * This method gets executed each time the editor needs to resize.
     */
    const resize = (editor, oldSize, trigger, getExtraMarginBottom) => {
        const dom = editor.dom;
        const doc = editor.getDoc();
        if (!doc) {
            return;
        }
        if (isFullscreen(editor)) {
            toggleScrolling(editor, true);
            return;
        }
        const docEle = doc.documentElement;
        const resizeBottomMargin = getExtraMarginBottom ? getExtraMarginBottom() : getAutoResizeOverflowPadding(editor);
        const minHeight = getMinHeight(editor) ?? editor.getElement().offsetHeight;
        let resizeHeight = minHeight;
        // Calculate outer height of the doc element using CSS styles
        const marginTop = parseCssValueToInt(dom, docEle, 'margin-top', true);
        const marginBottom = parseCssValueToInt(dom, docEle, 'margin-bottom', true);
        let contentHeight = docEle.offsetHeight + marginTop + marginBottom + resizeBottomMargin;
        // Make sure we have a valid height
        if (contentHeight < 0) {
            contentHeight = 0;
        }
        // Determine the size of the chroming (menubar, toolbar, etc...)
        const containerHeight = editor.getContainer().offsetHeight;
        const contentAreaHeight = editor.getContentAreaContainer().offsetHeight;
        const chromeHeight = containerHeight - contentAreaHeight;
        // Don't make it smaller than the minimum height
        if (contentHeight + chromeHeight > minHeight) {
            resizeHeight = contentHeight + chromeHeight;
        }
        // If a maximum height has been defined don't exceed this height
        const maxHeight = getMaxHeight(editor);
        if (maxHeight && resizeHeight > maxHeight) {
            resizeHeight = maxHeight;
            toggleScrolling(editor, true);
        }
        else {
            toggleScrolling(editor, false);
        }
        const old = oldSize.get();
        if (old.set) {
            editor.dom.setStyles(editor.getDoc().documentElement, { 'min-height': 0 });
            editor.dom.setStyles(editor.getBody(), { 'min-height': 'inherit' });
        }
        // Resize content element
        if (resizeHeight !== old.totalHeight && (contentHeight - resizeBottomMargin !== old.contentHeight || !old.set)) {
            const deltaSize = (resizeHeight - old.totalHeight);
            dom.setStyle(editor.getContainer(), 'height', resizeHeight + 'px');
            oldSize.set({
                totalHeight: resizeHeight,
                contentHeight,
                set: true,
            });
            fireResizeEditor(editor);
            // iPadOS has an issue where it won't rerender the body when the iframe is resized
            // however if we reset the scroll position then it re-renders correctly
            if (global.browser.isSafari() && (global.os.isMacOS() || global.os.isiOS())) {
                const win = editor.getWin();
                win.scrollTo(win.pageXOffset, win.pageYOffset);
            }
            // Ensure the selection is in view, as it's potentially out of view after inserting content into the editor
            if (editor.hasFocus() && shouldScrollIntoView(trigger)) {
                editor.selection.scrollIntoView();
            }
            // WebKit doesn't decrease the size of the body element until the iframe gets resized
            // So we need to continue to resize the iframe down until the size gets fixed
            if ((global.browser.isSafari() || global.browser.isChromium()) && deltaSize < 0) {
                resize(editor, oldSize, trigger, getExtraMarginBottom);
            }
        }
    };
    const setup = (editor, oldSize) => {
        const getExtraMarginBottom = () => getAutoResizeBottomMargin(editor);
        editor.on('init', (e) => {
            const overflowPadding = getAutoResizeOverflowPadding(editor);
            const dom = editor.dom;
            // Disable height 100% on the root document element otherwise we'll end up resizing indefinitely
            dom.setStyles(editor.getDoc().documentElement, {
                height: 'auto'
            });
            if (global.browser.isEdge() || global.browser.isIE()) {
                dom.setStyles(editor.getBody(), {
                    'paddingLeft': overflowPadding,
                    'paddingRight': overflowPadding,
                    // IE & Edge have a min height of 150px by default on the body, so override that
                    'min-height': 0
                });
            }
            else {
                dom.setStyles(editor.getBody(), {
                    paddingLeft: overflowPadding,
                    paddingRight: overflowPadding
                });
            }
            resize(editor, oldSize, e, getExtraMarginBottom);
        });
        editor.on('NodeChange SetContent keyup FullscreenStateChanged ResizeContent', (e) => {
            resize(editor, oldSize, e, getExtraMarginBottom);
        });
    };

    const register = (editor, oldSize) => {
        editor.addCommand('mceAutoResize', () => {
            resize(editor, oldSize);
        });
    };

    /**
     * This class contains all core logic for the autoresize plugin.
     *
     * @class tinymce.autoresize.Plugin
     * @private
     */
    var Plugin = () => {
        global$1.add('autoresize', (editor) => {
            register$1(editor);
            // If autoresize is enabled, disable resize if the user hasn't explicitly enabled it
            // TINY-8288: This currently does nothing because of a bug in the theme
            if (!editor.options.isSet('resize')) {
                editor.options.set('resize', false);
            }
            if (!editor.inline) {
                const oldSize = Cell({
                    totalHeight: 0,
                    contentHeight: 0,
                    set: false,
                });
                register(editor, oldSize);
                setup(editor, oldSize);
            }
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
