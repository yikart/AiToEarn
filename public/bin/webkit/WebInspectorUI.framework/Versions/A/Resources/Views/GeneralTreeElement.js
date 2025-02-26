/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.GeneralTreeElement = class GeneralTreeElement extends WI.TreeElement
{
    constructor(classNames, title, subtitle, representedObject, options)
    {
        super("", representedObject, options);

        this.classNames = classNames;

        this._tooltipHandledSeparately = false;
        this._mainTitle = title || "";
        this._subtitle = subtitle || "";
        this._status = "";
    }

    // Public

    get element()
    {
        return this._listItemNode;
    }

    get iconElement()
    {
        this._createElementsIfNeeded();
        return this._iconElement;
    }

    get statusElement()
    {
        return this._statusElement;
    }

    get titlesElement()
    {
        this._createElementsIfNeeded();
        return this._titlesElement;
    }

    get mainTitleElement()
    {
        this._createElementsIfNeeded();
        return this._mainTitleElement;
    }

    get subtitleElement()
    {
        this._createElementsIfNeeded();
        this._createSubtitleElementIfNeeded();
        return this._subtitleElement;
    }

    get classNames()
    {
        return this._classNames;
    }

    set classNames(x)
    {
        x = x || [];

        if (typeof x === "string")
            x = [x];

        if (Array.shallowEqual(this._classNames, x))
            return;

        if (this._listItemNode && this._classNames)
            this._listItemNode.classList.remove(...this._classNames);

        this._classNames = x;

        if (this._listItemNode)
            this._listItemNode.classList.add(...this._classNames);
    }

    addClassName(className)
    {
        if (this._classNames.includes(className))
            return;

        this._classNames.push(className);

        if (this._listItemNode)
            this._listItemNode.classList.add(className);
    }

    removeClassName(className)
    {
        if (!this._classNames.includes(className))
            return;

        this._classNames.remove(className);

        if (this._listItemNode)
            this._listItemNode.classList.remove(className);
    }

    get mainTitle()
    {
        return this._mainTitle;
    }

    set mainTitle(x)
    {
        x = x || "";

        if (this._mainTitle === x)
            return;

        this._mainTitle = x;
        this._updateTitleElements();
        this.didChange();
        this.dispatchEventToListeners(WI.GeneralTreeElement.Event.MainTitleDidChange);
    }

    get subtitle()
    {
        return this._subtitle;
    }

    set subtitle(x)
    {
        x = x || "";

        if (this._subtitle === x)
            return;

        this._subtitle = x;
        this._updateTitleElements();
        this.didChange();
    }

    get status()
    {
        return this._status;
    }

    set status(x)
    {
        x = x || "";

        if (this._status === x)
            return;

        if (!this._statusElement) {
            this._statusElement = document.createElement("div");
            this._statusElement.className = WI.GeneralTreeElement.StatusElementStyleClassName;
        }

        this._status = x;
        this._updateStatusElement();
    }

    get filterableData()
    {
        return {text: [this.mainTitle, this.subtitle]};
    }

    get tooltipHandledSeparately()
    {
        return this._tooltipHandledSeparately;
    }

    set tooltipHandledSeparately(x)
    {
        this._tooltipHandledSeparately = !!x;
    }

    createFoldersAsNeededForSubpath(subpath, comparator)
    {
        if (!subpath)
            return this;

        let components = subpath.split("/");
        if (components.length === 1)
            return this;

        if (!this._subpathFolderTreeElementMap)
            this._subpathFolderTreeElementMap = new Map;

        let currentPath = "";
        let currentFolderTreeElement = this;

        for (let component of components) {
            if (component === components.lastValue)
                break;

            if (currentPath)
                currentPath += "/";
            currentPath += component;

            let cachedFolder = this._subpathFolderTreeElementMap.get(currentPath);
            if (cachedFolder) {
                currentFolderTreeElement = cachedFolder;
                continue;
            }

            let newFolder = new WI.FolderTreeElement(component);
            this._subpathFolderTreeElementMap.set(currentPath, newFolder);

            let index = insertionIndexForObjectInListSortedByFunction(newFolder, currentFolderTreeElement.children, comparator || WI.ResourceTreeElement.compareFolderAndResourceTreeElements);
            currentFolderTreeElement.insertChild(newFolder, index);
            currentFolderTreeElement = newFolder;
        }

        return currentFolderTreeElement;
    }

    // Overrides from TreeElement (Private)

    isEventWithinDisclosureTriangle(event)
    {
        return event.target === this._disclosureButton;
    }

    onattach()
    {
        this._createElementsIfNeeded();
        this._updateTitleElements();

        this._listItemNode.classList.add("item");

        if (this._classNames)
            this._listItemNode.classList.add(...this._classNames);

        this._listItemNode.appendChild(this._disclosureButton);
        this._listItemNode.appendChild(this._iconElement);
        if (this._statusElement)
            this._listItemNode.appendChild(this._statusElement);
        this._listItemNode.appendChild(this._titlesElement);
    }

    ondetach()
    {
        // Overridden by subclasses.
    }

    onreveal()
    {
        if (this._listItemNode)
            this._listItemNode.scrollIntoViewIfNeeded(false);
    }

    // Protected

    callFirstAncestorFunction(functionName, args)
    {
        // Call the first ancestor that implements a function named functionName (if any).
        var currentNode = this.parent;
        while (currentNode) {
            if (typeof currentNode[functionName] === "function") {
                currentNode[functionName].apply(currentNode, args);
                break;
            }

            currentNode = currentNode.parent;
        }
    }

    customTitleTooltip()
    {
        // Implemented by subclasses.
    }

    // Private

    _createElementsIfNeeded()
    {
        if (this._createdElements)
            return;

        this._disclosureButton = document.createElement("button");
        this._disclosureButton.className = WI.GeneralTreeElement.DisclosureButtonStyleClassName;

        // Don't allow the disclosure button to be keyboard focusable. The TreeOutline is focusable and has
        // its own keybindings for toggling expand and collapse.
        this._disclosureButton.tabIndex = -1;

        this._iconElement = document.createElement("img");
        this._iconElement.className = WI.GeneralTreeElement.IconElementStyleClassName;

        this._titlesElement = document.createElement("div");
        this._titlesElement.className = WI.GeneralTreeElement.TitlesElementStyleClassName;

        this._mainTitleElement = document.createElement("span");
        this._mainTitleElement.className = WI.GeneralTreeElement.MainTitleElementStyleClassName;
        this._titlesElement.appendChild(this._mainTitleElement);

        this._createdElements = true;
    }

    _createSubtitleElementIfNeeded()
    {
        if (this._subtitleElement)
            return;

        this._subtitleElement = document.createElement("span");
        this._subtitleElement.className = WI.GeneralTreeElement.SubtitleElementStyleClassName;
        this._titlesElement.appendChild(this._subtitleElement);
    }

    _updateTitleElements()
    {
        if (!this._createdElements)
            return;

        if (typeof this._mainTitle === "string") {
            if (this._mainTitleElement.textContent !== this._mainTitle)
                this._mainTitleElement.textContent = this._mainTitle;
        } else if (this._mainTitle instanceof Node) {
            this._mainTitleElement.removeChildren();
            this._mainTitleElement.appendChild(this._mainTitle);
            if (this._mainTitle instanceof DocumentFragment)
                this._mainTitle = this._mainTitleElement.textContent;
        }

        if (typeof this._subtitle === "string" && this._subtitle) {
            this._createSubtitleElementIfNeeded();
            if (this._subtitleElement.textContent !== this._subtitle)
                this._subtitleElement.textContent = this._subtitle;
            this._titlesElement.classList.remove(WI.GeneralTreeElement.NoSubtitleStyleClassName);
        } else if (this._subtitle instanceof Node) {
            this._createSubtitleElementIfNeeded();
            this._subtitleElement.removeChildren();
            this._subtitleElement.appendChild(this._subtitle);
            if (this._subtitle instanceof DocumentFragment)
                this._subtitle = this._subtitleElement.textContent;
            this._titlesElement.classList.remove(WI.GeneralTreeElement.NoSubtitleStyleClassName);
        } else {
            if (this._subtitleElement)
                this._subtitleElement.textContent = "";
            this._titlesElement.classList.add(WI.GeneralTreeElement.NoSubtitleStyleClassName);
        }

        // Set a default tooltip if there isn't a custom one already assigned.
        if (!this.tooltip && !this._tooltipHandledSeparately)
            this._updateTitleTooltip();
    }

    _updateTitleTooltip()
    {
        console.assert(this._listItemNode);
        if (!this._listItemNode)
            return;

        let tooltip = this.customTitleTooltip();
        if (!tooltip) {
            // Get the textContent for the elements since they can contain other nodes,
            // and the tool tip only cares about the text.
            let mainTitleText = this._mainTitleElement.textContent;
            let subtitleText = this._subtitleElement ? this._subtitleElement.textContent : "";
            let large = this.treeOutline && this.treeOutline.large;
            if (mainTitleText && subtitleText)
                tooltip = mainTitleText + (large ? "\n" : " \u2014 ") + subtitleText;
            else if (mainTitleText)
                tooltip = mainTitleText;
            else
                tooltip = subtitleText;
        }

        this._listItemNode.title = tooltip;
    }

    _updateStatusElement()
    {
        if (!this._statusElement)
            return;

        if (!this._statusElement.parentNode && this._listItemNode)
            this._listItemNode.insertBefore(this._statusElement, this._titlesElement);

        if (this._status instanceof Node) {
            this._statusElement.removeChildren();
            this._statusElement.appendChild(this._status);
        } else
            this._statusElement.textContent = this._status;
    }
};

WI.GeneralTreeElement.DisclosureButtonStyleClassName = "disclosure-button";
WI.GeneralTreeElement.IconElementStyleClassName = "icon";
WI.GeneralTreeElement.StatusElementStyleClassName = "status";
WI.GeneralTreeElement.TitlesElementStyleClassName = "titles";
WI.GeneralTreeElement.MainTitleElementStyleClassName = "title";
WI.GeneralTreeElement.SubtitleElementStyleClassName = "subtitle";
WI.GeneralTreeElement.NoSubtitleStyleClassName = "no-subtitle";

WI.GeneralTreeElement.Event = {
    MainTitleDidChange: "general-tree-element-main-title-did-change"
};
