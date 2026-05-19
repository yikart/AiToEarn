/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global$4 = tinymce.util.Tools.resolve('tinymce.PluginManager');

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

    var global$3 = tinymce.util.Tools.resolve('tinymce.util.Delay');

    var global$2 = tinymce.util.Tools.resolve('tinymce.util.LocalStorage');

    var global$1 = tinymce.util.Tools.resolve('tinymce.util.Tools');

    const fireRestoreDraft = (editor) => editor.dispatch('RestoreDraft');
    const fireStoreDraft = (editor) => editor.dispatch('StoreDraft');
    const fireRemoveDraft = (editor) => editor.dispatch('RemoveDraft');

    const parse = (timeString) => {
        const multiples = {
            s: 1000,
            m: 60000
        };
        const parsedTime = /^(\d+)([ms]?)$/.exec(timeString);
        return (parsedTime && parsedTime[2] ? multiples[parsedTime[2]] : 1) * parseInt(timeString, 10);
    };

    const option = (name) => (editor) => editor.options.get(name);
    const register$1 = (editor) => {
        const registerOption = editor.options.register;
        const timeProcessor = (value) => {
            const valid = isString(value);
            if (valid) {
                return { value: parse(value), valid };
            }
            else {
                return { valid: false, message: 'Must be a string.' };
            }
        };
        registerOption('autosave_ask_before_unload', {
            processor: 'boolean',
            default: true
        });
        registerOption('autosave_prefix', {
            processor: 'string',
            default: 'tinymce-autosave-{path}{query}{hash}-{id}-'
        });
        registerOption('autosave_restore_when_empty', {
            processor: 'boolean',
            default: false
        });
        registerOption('autosave_interval', {
            processor: timeProcessor,
            default: '30s'
        });
        registerOption('autosave_retention', {
            processor: timeProcessor,
            default: '20m'
        });
    };
    const shouldAskBeforeUnload = option('autosave_ask_before_unload');
    const shouldRestoreWhenEmpty = option('autosave_restore_when_empty');
    const getAutoSaveInterval = option('autosave_interval');
    const getAutoSaveRetention = option('autosave_retention');
    const getAutoSavePrefix = (editor) => {
        const location = document.location;
        return editor.options.get('autosave_prefix').replace(/{path}/g, location.pathname)
            .replace(/{query}/g, location.search)
            .replace(/{hash}/g, location.hash)
            .replace(/{id}/g, editor.id);
    };

    const isEmpty = (editor, html) => {
        if (isUndefined(html)) {
            return editor.dom.isEmpty(editor.getBody());
        }
        else {
            const trimmedHtml = global$1.trim(html);
            if (trimmedHtml === '') {
                return true;
            }
            else {
                const fragment = new DOMParser().parseFromString(trimmedHtml, 'text/html');
                return editor.dom.isEmpty(fragment);
            }
        }
    };
    const hasDraft = (editor) => {
        const time = parseInt(global$2.getItem(getAutoSavePrefix(editor) + 'time') ?? '0', 10) || 0;
        if (new Date().getTime() - time > getAutoSaveRetention(editor)) {
            removeDraft(editor, false);
            return false;
        }
        return true;
    };
    const removeDraft = (editor, fire) => {
        const prefix = getAutoSavePrefix(editor);
        global$2.removeItem(prefix + 'draft');
        global$2.removeItem(prefix + 'time');
        if (fire !== false) {
            fireRemoveDraft(editor);
        }
    };
    const storeDraft = (editor) => {
        const prefix = getAutoSavePrefix(editor);
        if (!isEmpty(editor) && editor.isDirty()) {
            global$2.setItem(prefix + 'draft', editor.getContent({ format: 'raw', no_events: true }));
            global$2.setItem(prefix + 'time', new Date().getTime().toString());
            fireStoreDraft(editor);
        }
    };
    const restoreDraft = (editor) => {
        const prefix = getAutoSavePrefix(editor);
        if (hasDraft(editor)) {
            editor.setContent(global$2.getItem(prefix + 'draft') ?? '', { format: 'raw' });
            fireRestoreDraft(editor);
        }
    };
    const startStoreDraft = (editor) => {
        const interval = getAutoSaveInterval(editor);
        global$3.setEditorInterval(editor, () => {
            storeDraft(editor);
        }, interval);
    };
    const restoreLastDraft = (editor) => {
        editor.undoManager.transact(() => {
            restoreDraft(editor);
            removeDraft(editor);
        });
        editor.focus();
    };

    const get = (editor) => ({
        hasDraft: () => hasDraft(editor),
        storeDraft: () => storeDraft(editor),
        restoreDraft: () => restoreDraft(editor),
        removeDraft: (fire) => removeDraft(editor, fire),
        isEmpty: (html) => isEmpty(editor, html)
    });

    var global = tinymce.util.Tools.resolve('tinymce.EditorManager');

    const setup = (editor) => {
        editor.editorManager.on('BeforeUnload', (e) => {
            let msg;
            global$1.each(global.get(), (editor) => {
                // Store a draft for each editor instance
                if (editor.plugins.autosave) {
                    editor.plugins.autosave.storeDraft();
                }
                // Setup a return message if the editor is dirty
                if (!msg && editor.isDirty() && shouldAskBeforeUnload(editor)) {
                    msg = editor.translate('You have unsaved changes are you sure you want to navigate away?');
                }
            });
            if (msg) {
                e.preventDefault();
                e.returnValue = msg;
            }
        });
    };

    const makeSetupHandler = (editor) => (api) => {
        const shouldEnable = () => hasDraft(editor) && !editor.mode.isReadOnly();
        api.setEnabled(shouldEnable());
        const editorEventCallback = () => api.setEnabled(shouldEnable());
        editor.on('StoreDraft RestoreDraft RemoveDraft', editorEventCallback);
        return () => editor.off('StoreDraft RestoreDraft RemoveDraft', editorEventCallback);
    };
    const register = (editor) => {
        // TODO: This was moved from makeSetupHandler as it would only be called when the menu item was rendered?
        //       Is it safe to start this process when the plugin is registered?
        startStoreDraft(editor);
        const onAction = () => {
            restoreLastDraft(editor);
        };
        editor.ui.registry.addButton('restoredraft', {
            tooltip: 'Restore last draft',
            icon: 'restore-draft',
            onAction,
            onSetup: makeSetupHandler(editor)
        });
        editor.ui.registry.addMenuItem('restoredraft', {
            text: 'Restore last draft',
            icon: 'restore-draft',
            onAction,
            onSetup: makeSetupHandler(editor)
        });
    };

    /**
     * This class contains all core logic for the autosave plugin.
     *
     * @class tinymce.autosave.Plugin
     * @private
     */
    var Plugin = () => {
        global$4.add('autosave', (editor) => {
            register$1(editor);
            setup(editor);
            register(editor);
            editor.on('init', () => {
                if (shouldRestoreWhenEmpty(editor) && editor.dom.isEmpty(editor.getBody())) {
                    restoreDraft(editor);
                }
            });
            return get(editor);
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
