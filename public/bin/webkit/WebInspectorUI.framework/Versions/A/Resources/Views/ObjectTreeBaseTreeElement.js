/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 * 1. Redistributions of source code must retain the above copyright
 *    notice, this list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright
 *    notice, this list of conditions and the following disclaimer in the
 *    documentation and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. AND ITS CONTRIBUTORS ``AS IS''
 * AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO,
 * THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL APPLE INC. OR ITS CONTRIBUTORS
 * BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
 * CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
 * SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
 * INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
 * ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF
 * THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.ObjectTreeBaseTreeElement = class ObjectTreeBaseTreeElement extends WI.GeneralTreeElement
{
    constructor(representedObject, propertyPath, property)
    {
        console.assert(representedObject);
        console.assert(propertyPath instanceof WI.PropertyPath);
        console.assert(!property || property instanceof WI.PropertyDescriptor);

        const classNames = null;
        const title = null;
        const subtitle = null;
        super(classNames, title, subtitle, representedObject);

        this._property = property;
        this._propertyPath = propertyPath;

        this.toggleOnClick = true;
        this.selectable = false;
        this.tooltipHandledSeparately = true;
    }

    // Public

    get property()
    {
        return this._property;
    }

    get propertyPath()
    {
        return this._propertyPath;
    }

    // Protected

    resolvedValue()
    {
        console.assert(this._property);
        if (this._getterValue)
            return this._getterValue;
        if (this._property.hasValue())
            return this._property.value;
        return null;
    }

    resolvedValuePropertyPath()
    {
        console.assert(this._property);
        if (this._getterValue)
            return this._propertyPath.appendPropertyDescriptor(this._getterValue, this._property, WI.PropertyPath.Type.Value);
        if (this._property.hasValue())
            return this._propertyPath.appendPropertyDescriptor(this._property.value, this._property, WI.PropertyPath.Type.Value);
        return null;
    }

    thisPropertyPath()
    {
        console.assert(this._property);
        return this._propertyPath.appendPropertyDescriptor(null, this._property, this.propertyPathType());
    }

    hadError()
    {
        console.assert(this._property);
        return this._property.wasThrown || this._getterHadError;
    }

    propertyPathType()
    {
        console.assert(this._property);
        if (this._getterValue || this._property.hasValue())
            return WI.PropertyPath.Type.Value;
        if (this._property.hasGetter())
            return WI.PropertyPath.Type.Getter;
        if (this._property.hasSetter())
            return WI.PropertyPath.Type.Setter;
        return WI.PropertyPath.Type.Value;
    }

    propertyPathString(propertyPath)
    {
        if (propertyPath.isFullPathImpossible())
            return WI.UIString("Unable to determine path to property from root");

        return propertyPath.displayPath(this.propertyPathType());
    }

    createGetterElement(interactive)
    {
        var getterElement = document.createElement("img");
        getterElement.className = "getter";

        if (!interactive) {
            getterElement.classList.add("disabled");
            getterElement.title = WI.UIString("Getter");
            return getterElement;
        }

        getterElement.title = WI.UIString("Invoke getter");
        getterElement.addEventListener("click", (event) => {
            event.stopPropagation();
            var lastNonPrototypeObject = this._propertyPath.lastNonPrototypeObject;
            var getterObject = this._property.get;
            lastNonPrototypeObject.invokeGetter(getterObject, (error, result, wasThrown) => {
                this._getterHadError = !!(error || wasThrown);
                this._getterValue = result;
                if (this.invokedGetter && typeof this.invokedGetter === "function")
                    this.invokedGetter();
            });
        });

        return getterElement;
    }

    createSetterElement(interactive)
    {
        var setterElement = document.createElement("img");
        setterElement.className = "setter";
        setterElement.title = WI.UIString("Setter");

        if (!interactive)
            setterElement.classList.add("disabled");

        return setterElement;
    }

    populateContextMenu(contextMenu, event)
    {
        if (event.__addedObjectPreviewContextMenuItems)
            return;
        if (event.__addedObjectTreeContextMenuItems)
            return;

        event.__addedObjectTreeContextMenuItems = true;

        if (typeof this.treeOutline.objectTreeElementAddContextMenuItems === "function") {
            this.treeOutline.objectTreeElementAddContextMenuItems(this, contextMenu);
            if (!contextMenu.isEmpty())
                contextMenu.appendSeparator();
        }

        let resolvedValue = this.resolvedValue();
        if (!resolvedValue)
            return;

        if (this._property && this._property.symbol)
            contextMenu.appendItem(WI.UIString("Log Symbol"), this._logSymbolProperty.bind(this));

        contextMenu.appendItem(WI.UIString("Log Value"), this._logValue.bind(this));

        let propertyPath = this.resolvedValuePropertyPath();
        if (propertyPath && !propertyPath.isFullPathImpossible()) {
            contextMenu.appendItem(WI.UIString("Copy Path to Property"), () => {
                InspectorFrontendHost.copyText(propertyPath.displayPath(WI.PropertyPath.Type.Value));
            });
        }

        contextMenu.appendSeparator();

        this._appendMenusItemsForObject(contextMenu, resolvedValue);

        super.populateContextMenu(contextMenu, event);
    }

    // Private

    _logSymbolProperty()
    {
        var symbol = this._property.symbol;
        if (!symbol)
            return;

        var text = WI.UIString("Selected Symbol");
        WI.consoleLogViewController.appendImmediateExecutionWithResult(text, symbol, {addSpecialUserLogClass: true, shouldRevealConsole: true});
    }

    _logValue(value)
    {
        var resolvedValue = value || this.resolvedValue();
        if (!resolvedValue)
            return;

        var propertyPath = this.resolvedValuePropertyPath();
        var isImpossible = propertyPath.isFullPathImpossible();
        var text = isImpossible ? WI.UIString("Selected Value") : propertyPath.displayPath(this.propertyPathType());

        if (!isImpossible)
            WI.quickConsole.prompt.pushHistoryItem(text);

        WI.consoleLogViewController.appendImmediateExecutionWithResult(text, resolvedValue, {addSpecialUserLogClass: isImpossible, shouldRevealConsole: true});
    }

    _appendMenusItemsForObject(contextMenu, resolvedValue)
    {
        if (resolvedValue.type === "function") {
            // FIXME: We should better handle bound functions.
            if (!isFunctionStringNativeCode(resolvedValue.description)) {
                contextMenu.appendItem(WI.UIString("Jump to Definition"), function() {
                    resolvedValue.target.DebuggerAgent.getFunctionDetails(resolvedValue.objectId, function(error, response) {
                        if (error)
                            return;

                        let location = response.location;
                        let sourceCode = WI.debuggerManager.scriptForIdentifier(location.scriptId, resolvedValue.target);
                        if (!sourceCode)
                            return;

                        let sourceCodeLocation = sourceCode.createSourceCodeLocation(location.lineNumber, location.columnNumber || 0);

                        const options = {
                            ignoreNetworkTab: true,
                            ignoreSearchTab: true,
                        };
                        WI.showSourceCodeLocation(sourceCodeLocation, options);
                    });
                });
            }
            return;
        }
    }
};
