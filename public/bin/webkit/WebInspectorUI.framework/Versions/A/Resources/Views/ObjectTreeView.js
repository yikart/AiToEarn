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

WI.ObjectTreeView = class ObjectTreeView extends WI.Object
{
    constructor(object, mode, propertyPath, forceExpanding)
    {
        super();

        console.assert(object instanceof WI.RemoteObject);
        console.assert(!propertyPath || propertyPath instanceof WI.PropertyPath);

        var providedPropertyPath = propertyPath instanceof WI.PropertyPath;

        this._object = object;
        this._mode = mode || WI.ObjectTreeView.defaultModeForObject(object);
        this._propertyPath = propertyPath || new WI.PropertyPath(this._object, "this");
        this._expanded = false;
        this._hasLosslessPreview = false;
        this._includeProtoProperty = true;

        // If ObjectTree is used outside of the console, we do not know when to release
        // WeakMap entries. Currently collapse would work. For the console, we can just
        // listen for console clear events. Currently all ObjectTrees are in the console.
        this._inConsole = true;

        this._fetchStart = 0;
        this._fetchEnd = ObjectTreeView.showMoreFetchCount;
        this._fetchEndIndex = 0;

        // Always force expanding for classes.
        if (this._object.isClass())
            forceExpanding = true;

        this._element = document.createElement("div");
        this._element.__objectTree = this;
        this._element.className = "object-tree";

        if (this._object.preview) {
            this._previewView = new WI.ObjectPreviewView(this._object, this._object.preview);
            this._previewView.setOriginatingObjectInfo(this._object, providedPropertyPath ? propertyPath : null);
            this._previewView.element.addEventListener("click", this._handlePreviewOrTitleElementClick.bind(this));
            this._element.appendChild(this._previewView.element);

            if (this._previewView.lossless && !this._propertyPath.parent && !forceExpanding) {
                this._hasLosslessPreview = true;
                this.element.classList.add("lossless-preview");
            }
        } else {
            this._titleElement = document.createElement("span");
            this._titleElement.className = "title";
            this._titleElement.appendChild(WI.FormattedValue.createElementForRemoteObject(this._object));
            this._titleElement.addEventListener("click", this._handlePreviewOrTitleElementClick.bind(this));
            this._element.appendChild(this._titleElement);
        }

        this._outline = new WI.TreeOutline;
        this._outline.compact = true;
        this._outline.customIndent = true;
        this._outline.element.classList.add("object");
        this._element.appendChild(this._outline.element);

        // FIXME: Support editable ObjectTrees.
    }

    // Static

    static defaultModeForObject(object)
    {
        if (object.subtype === "class")
            return WI.ObjectTreeView.Mode.ClassAPI;

        return WI.ObjectTreeView.Mode.Properties;
    }

    static createEmptyMessageElement(message)
    {
        var emptyMessageElement = document.createElement("div");
        emptyMessageElement.className = "empty-message";
        emptyMessageElement.textContent = message;
        return emptyMessageElement;
    }

    static get showMoreFetchCount() { return 100; }

    static addShowMoreIfNeeded({resolvedValue, representation, parentTreeElement, handleShowMoreClicked, handleShowAllClicked})
    {
        console.assert(resolvedValue instanceof WI.RemoteObject, resolvedValue);
        console.assert(resolvedValue.isArray() || resolvedValue.isCollectionType());
        console.assert(typeof resolvedValue.size === "number" && resolvedValue.size > 0, resolvedValue);
        console.assert("_fetchStart" in representation, representation);
        console.assert("_fetchEnd" in representation, representation);
        console.assert("_fetchEndIndex" in representation, representation);
        console.assert(typeof handleShowMoreClicked === "function", handleShowMoreClicked);
        console.assert(typeof handleShowAllClicked === "function", handleShowAllClicked);

        // COMPATIBILITY (iOS 13): Runtime.getProperties/Runtime.getDisplayableProperties didn't support `fetchStart`/`fetchCount` yet.
        if (!InspectorBackend.hasCommand("Runtime.getProperties", "fetchStart"))
            return;

        let remaining = resolvedValue.size - representation._fetchEnd;
        if (remaining <= 0)
            return;

        let treeElement = new WI.TreeElement(document.createElement("span"));
        treeElement.selectable = false;
        parentTreeElement.insertChild(treeElement, representation._fetchEndIndex);

        // FIXME: <https://webkit.org/b/201965> Web Inspector: allow examining items in the middle of an array/collection without having to show all items before

        let buttons = [];
        let createButton = (textContent, handleClick) => {
            let button = treeElement.title.appendChild(document.createElement("button"));
            button.textContent = textContent;
            button.addEventListener("click", (event) => {
                event.stop();

                representation.singleFireEventListener(ObjectTreeView.Event.Updated, function(event) {
                    // The `treeElement` may have already been removed by some other means (e.g. `removeChildren`).
                    if (treeElement.parent === parentTreeElement)
                        parentTreeElement.removeChild(treeElement);
                }, button);

                for (let other of buttons)
                    other.disabled = true;

                let spinner = new WI.IndeterminateProgressSpinner;
                buttons.lastValue.insertAdjacentElement("afterend", spinner.element);

                handleClick();
            });
            buttons.push(button);
        };

        if (!resolvedValue.isWeakCollection() && remaining > ObjectTreeView.showMoreFetchCount) {
            createButton(WI.UIString("Show %d More").format(ObjectTreeView.showMoreFetchCount), () => {
                representation._fetchStart = representation._fetchEnd;
                representation._fetchEnd = representation._fetchStart + ObjectTreeView.showMoreFetchCount;
                handleShowMoreClicked();
            });
        }

        createButton(WI.UIString("Show All (%d More)").format(remaining), () => {
            representation._fetchStart = 0;
            representation._fetchEnd = Infinity;
            representation._fetchEndIndex = 0;
            handleShowAllClicked();
        });
    }

    static comparePropertyDescriptors(propertyA, propertyB)
    {
        var a = propertyA.name;
        var b = propertyB.name;

        // Put __proto__ at the bottom.
        if (a === "__proto__")
            return 1;
        if (b === "__proto__")
            return -1;

        // Put Internal properties at the top.
        if (propertyA.isInternalProperty && !propertyB.isInternalProperty)
            return -1;
        if (propertyB.isInternalProperty && !propertyA.isInternalProperty)
            return 1;

        // Put private properties at the top.
        if (propertyA.isPrivateProperty && !propertyB.isPrivateProperty)
            return -1;
        if (propertyB.isPrivateProperty && !propertyA.isPrivateProperty)
            return 1;

        // Put Symbol properties at the bottom.
        if (propertyA.symbol && !propertyB.symbol)
            return 1;
        if (propertyB.symbol && !propertyA.symbol)
            return -1;

        // Symbol properties may have the same description string but be different objects.
        if (a === b)
            return 0;

        var diff = 0;
        var chunk = /^\d+|^\D+/;
        var chunka, chunkb, anum, bnum;
        while (diff === 0) {
            if (!a && b)
                return -1;
            if (!b && a)
                return 1;
            chunka = a.match(chunk)[0];
            chunkb = b.match(chunk)[0];
            anum = !isNaN(chunka);
            bnum = !isNaN(chunkb);
            if (anum && !bnum)
                return -1;
            if (bnum && !anum)
                return 1;
            if (anum && bnum) {
                diff = chunka - chunkb;
                if (diff === 0 && chunka.length !== chunkb.length) {
                    if (!+chunka && !+chunkb) // chunks are strings of all 0s (special case)
                        return chunka.length - chunkb.length;
                    else
                        return chunkb.length - chunka.length;
                }
            } else if (chunka !== chunkb)
                return chunka < chunkb ? -1 : 1;
            a = a.substring(chunka.length);
            b = b.substring(chunkb.length);
        }
        return diff;
    }

    // Public

    get object()
    {
        return this._object;
    }

    get element()
    {
        return this._element;
    }

    get treeOutline()
    {
        return this._outline;
    }

    get expanded()
    {
        return this._expanded;
    }

    expand()
    {
        if (this._expanded)
            return;

        if (this._hasLosslessPreview)
            return;

        this._expanded = true;
        this._element.classList.add("expanded");

        if (this._previewView)
            this._previewView.showTitle();

        this._trackWeakEntries();

        this.update();
    }

    collapse()
    {
        if (!this._expanded)
            return;

        this._expanded = false;
        this._element.classList.remove("expanded");

        if (this._previewView)
            this._previewView.showPreview();

        this._untrackWeakEntries();
    }

    showOnlyProperties()
    {
        this._inConsole = false;

        this._element.classList.add("properties-only");

        this._includeProtoProperty = false;
    }

    showOnlyJSON()
    {
        console.assert(this._mode === WI.ObjectTreeView.Mode.Properties, this._mode);
        console.assert(!this._hasLosslessPreview);

        this.showOnlyProperties();

        this._element.classList.add("json-only");
    }

    appendTitleSuffix(suffixElement)
    {
        if (this._previewView)
            this._previewView.element.appendChild(suffixElement);
        else
            this._titleElement.appendChild(suffixElement);
    }

    appendExtraPropertyDescriptor(propertyDescriptor)
    {
        if (!this._extraProperties)
            this._extraProperties = [];

        this._extraProperties.push(propertyDescriptor);
    }

    setPrototypeNameOverride(override)
    {
        this._prototypeNameOverride = override;
    }

    resetPropertyPath()
    {
        this._propertyPath.pathComponent = "this";
    }

    // Protected

    update()
    {
        this._fetchStart = 0;
        this._fetchEndIndex = 0;
        this._updateChildren();
    }

    // Private

    _updateChildren()
    {
        let options = {
            ownProperties: true,
            generatePreview: true,
        };

        if (isFinite(this._fetchEnd) && this._fetchEnd < this._object.size) {
            options.fetchStart = this._fetchStart;
            options.fetchCount = this._fetchEnd - this._fetchStart;
        }

        let wrap = (handler) => (list) => {
            if (this._fetchEndIndex === 0)
                this._outline.removeChildren();

            if (!list) {
                let errorMessageElement = WI.ObjectTreeView.createEmptyMessageElement(WI.UIString("Could not fetch properties. Object may no longer exist."));
                this._outline.appendChild(new WI.TreeElement(errorMessageElement));
                return;
            }

            handler.call(this, list, this._propertyPath);

            this.dispatchEventToListeners(ObjectTreeView.Event.Updated);
        };

        if (this._object.isCollectionType() && this._mode === ObjectTreeView.Mode.Properties)
            this._object.getCollectionEntries(wrap(this._updateEntries), options);
        else if (this._object.isClass())
            this._object.classPrototype.getDisplayablePropertyDescriptors(wrap(this._updateProperties), options);
        else if (this._mode === ObjectTreeView.Mode.PureAPI)
            this._object.getPropertyDescriptors(wrap(this._updateProperties), options);
        else
            this._object.getDisplayablePropertyDescriptors(wrap(this._updateProperties), options);
    }

    _updateEntries(entries, propertyPath)
    {
        entries.forEach((entry, i) => {
            if (entry.key) {
                this._outline.insertChild(new WI.ObjectTreeMapKeyTreeElement(entry.key, propertyPath), this._fetchEndIndex++);
                this._outline.insertChild(new WI.ObjectTreeMapValueTreeElement(entry.value, propertyPath, entry.key), this._fetchEndIndex++);
            } else
                this._outline.insertChild(new WI.ObjectTreeSetIndexTreeElement(entry.value, propertyPath), this._fetchEndIndex++);
        });

        if (!this._outline.children.length) {
            let emptyMessageElement = ObjectTreeView.createEmptyMessageElement(WI.UIString("No Entries"));
            this._outline.appendChild(new WI.TreeElement(emptyMessageElement));
        } else {
            console.assert(this._mode === WI.ObjectTreeView.Mode.Properties);
            ObjectTreeView.addShowMoreIfNeeded({
                resolvedValue: this._object,
                representation: this,
                parentTreeElement: this._outline,
                handleShowMoreClicked: () => {
                    this._updateChildren();
                },
                handleShowAllClicked: () => {
                    this.update();
                },
            });
        }

        // Show the prototype so users can see the API, but only fetch it the first time.
        if (this._fetchStart === 0) {
            this._object.getOwnPropertyDescriptor("__proto__", (propertyDescriptor) => {
                if (propertyDescriptor)
                    this._outline.appendChild(new WI.ObjectTreePropertyTreeElement(propertyDescriptor, propertyPath, this._mode));
            });
        }
    }

    _updateProperties(properties, propertyPath)
    {
        if (this._extraProperties)
            properties.pushAll(this._extraProperties);

        properties.sort(WI.ObjectTreeView.comparePropertyDescriptors);

        var isArray = this._object.isArray();
        var isPropertyMode = this._mode === WI.ObjectTreeView.Mode.Properties;

        var hadProto = false;
        for (var propertyDescriptor of properties) {
            if (propertyDescriptor.name === "__proto__") {
                if (!this._includeProtoProperty)
                    continue;
                hadProto = true;
                this._outline.appendChild(new WI.ObjectTreePropertyTreeElement(propertyDescriptor, propertyPath, this._mode, this._prototypeNameOverride));
                continue;
            }

            if (isArray && isPropertyMode) {
                if (propertyDescriptor.isIndexProperty())
                    this._outline.insertChild(new WI.ObjectTreeArrayIndexTreeElement(propertyDescriptor, propertyPath), this._fetchEndIndex++);
            } else
                this._outline.insertChild(new WI.ObjectTreePropertyTreeElement(propertyDescriptor, propertyPath, this._mode, this._prototypeNameOverride), this._fetchEndIndex++);
        }

        if (!this._outline.children.length || (hadProto && this._outline.children.length === 1)) {
            let emptyMessageElement = ObjectTreeView.createEmptyMessageElement(WI.UIString("No Properties"));
            this._outline.insertChild(new WI.TreeElement(emptyMessageElement), 0);
        } else if (isArray && isPropertyMode) {
            ObjectTreeView.addShowMoreIfNeeded({
                resolvedValue: this._object,
                representation: this,
                parentTreeElement: this._outline,
                handleShowMoreClicked: () => {
                    this._updateChildren();
                },
                handleShowAllClicked: () => {
                    this.update();
                },
            });
        }
    }

    _handlePreviewOrTitleElementClick(event)
    {
        if (this._hasLosslessPreview)
            return;

        if (!this._expanded)
            this.expand();
        else
            this.collapse();

        event.stopPropagation();
    }

    _trackWeakEntries()
    {
        if (this._trackingEntries)
            return;

        if (!this._object.isWeakCollection())
            return;

        this._trackingEntries = true;

        if (this._inConsole) {
            WI.consoleManager.addEventListener(WI.ConsoleManager.Event.Cleared, this._untrackWeakEntries, this);
            WI.consoleManager.addEventListener(WI.ConsoleManager.Event.SessionStarted, this._untrackWeakEntries, this);
        }
    }

    _untrackWeakEntries()
    {
        if (!this._trackingEntries)
            return;

        if (!this._object.isWeakCollection())
            return;

        this._trackingEntries = false;

        this._object.releaseWeakCollectionEntries();

        if (this._inConsole) {
            WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.Cleared, this._untrackWeakEntries, this);
            WI.consoleManager.removeEventListener(WI.ConsoleManager.Event.SessionStarted, this._untrackWeakEntries, this);
        }

        // FIXME: This only tries to release weak entries if this object was a WeakMap.
        // If there was a WeakMap expanded in a sub-object, we will never release those values.
        // Should we attempt walking the entire tree and release weak collections?
    }
};

WI.ObjectTreeView.Mode = {
    Properties: Symbol("object-tree-properties"),      // Properties
    PrototypeAPI: Symbol("object-tree-prototype-api"), // API view on a live object instance, so getters can be invoked.
    ClassAPI: Symbol("object-tree-class-api"),         // API view without an object instance, can not invoke getters.
    PureAPI: Symbol("object-tree-pure-api"),           // API view without special displayable property handling, just own properties. Getters can be invoked if the property path has a non-prototype object.
};

WI.ObjectTreeView.Event = {
    Updated: "object-tree-updated",
};
