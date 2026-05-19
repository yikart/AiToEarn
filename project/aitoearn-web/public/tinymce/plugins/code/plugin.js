/**
 * TinyMCE version 8.4.0 (2026-03-31)
 */

(function () {
    'use strict';

    var global = tinymce.util.Tools.resolve('tinymce.PluginManager');

    const setContent = (editor, html) => {
        // We get a lovely "Wrong document" error in IE 11 if we
        // don't move the focus to the editor before creating an undo
        // transaction since it tries to make a bookmark for the current selection
        editor.focus();
        editor.undoManager.transact(() => {
            editor.setContent(html);
        });
        editor.selection.setCursorLocation();
        editor.nodeChanged();
    };
    const getContent = (editor) => {
        return editor.getContent({ source_view: true });
    };

    const open = (editor) => {
        const editorContent = getContent(editor);
        editor.windowManager.open({
            title: 'Source Code',
            size: 'large',
            body: {
                type: 'panel',
                items: [
                    {
                        type: 'textarea',
                        name: 'code',
                        spellcheck: false,
                    }
                ]
            },
            buttons: [
                {
                    type: 'cancel',
                    name: 'cancel',
                    text: 'Cancel'
                },
                {
                    type: 'submit',
                    name: 'save',
                    text: 'Save',
                    primary: true
                }
            ],
            initialData: {
                code: editorContent
            },
            onSubmit: (api) => {
                setContent(editor, api.getData().code);
                api.close();
            }
        });
    };

    const register$1 = (editor) => {
        editor.addCommand('mceCodeEditor', () => {
            open(editor);
        });
    };

    const register = (editor) => {
        const onAction = () => editor.execCommand('mceCodeEditor');
        editor.ui.registry.addButton('code', {
            icon: 'sourcecode',
            tooltip: 'Source code',
            onAction
        });
        editor.ui.registry.addMenuItem('code', {
            icon: 'sourcecode',
            text: 'Source code',
            onAction
        });
    };

    var Plugin = () => {
        global.add('code', (editor) => {
            register$1(editor);
            register(editor);
            return {};
        });
    };

    Plugin();
    /** *****
     * DO NOT EXPORT ANYTHING
     *
     * IF YOU DO ROLLUP WILL LEAVE A GLOBAL ON THE PAGE
     *******/

})();
