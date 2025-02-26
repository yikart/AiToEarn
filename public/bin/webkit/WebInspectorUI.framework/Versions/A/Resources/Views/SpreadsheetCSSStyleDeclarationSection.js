/*
 * Copyright (C) 2017-2022 Apple Inc. All rights reserved.
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

WI.SpreadsheetCSSStyleDeclarationSection = class SpreadsheetCSSStyleDeclarationSection extends WI.View
{
    constructor(delegate, style)
    {
        console.assert(style instanceof WI.CSSStyleDeclaration, style);

        let element = document.createElement("section");
        element.classList.add("spreadsheet-css-declaration");

        super(element);

        this._delegate = delegate || null;
        this._style = style;
        this._propertiesEditor = null;
        this._selectorElements = [];
        this._groupingsContainerElement = null;
        this._groupingElements = [];
        this._filterText = null;
        this._shouldFocusSelectorElement = false;
        this._wasEditing = false;
        this._setSelectorTextPromise = Promise.resolve();

        this._isMousePressed = false;
        this._mouseDownIndex = NaN;
        this._mouseDownPoint = null;
        this._boundHandleWindowMouseMove = null;
    }

    // Public

    get style() { return this._style; }

    get editable()
    {
        return this._style.editable;
    }

    set propertyVisibilityMode(propertyVisibilityMode)
    {
        this._propertiesEditor.propertyVisibilityMode = propertyVisibilityMode;
    }

    initialLayout()
    {
        super.initialLayout();

        let iconClassName = null;
        switch (this._style.type) {
        case WI.CSSStyleDeclaration.Type.Rule:
            console.assert(this._style.ownerRule);
            if (this._style.inherited) {
                iconClassName = "inherited-style-rule-icon";
                break;
            }

            switch (this._style.ownerRule.type) {
            case WI.CSSStyleSheet.Type.Author:
                iconClassName = "author-style-rule-icon";
                break;
            case WI.CSSStyleSheet.Type.User:
                iconClassName = "user-style-rule-icon";
                break;
            case WI.CSSStyleSheet.Type.UserAgent:
                iconClassName = "user-agent-style-rule-icon";
                break;
            case WI.CSSStyleSheet.Type.Inspector:
                iconClassName = "inspector-style-rule-icon";
                break;
            }
            break;
        case WI.CSSStyleDeclaration.Type.Inline:
        case WI.CSSStyleDeclaration.Type.Attribute:
            if (this._style.inherited)
                iconClassName = "inherited-element-style-rule-icon";
            else
                iconClassName = WI.DOMTreeElementPathComponent.DOMElementIconStyleClassName;
            break;
        }
        console.assert(iconClassName);
        this._element.classList.add("has-icon", iconClassName);

        this._headerElement = this._element.appendChild(document.createElement("div"));
        this._headerElement.classList.add("header");

        this._styleOriginView = new WI.StyleOriginView();
        this._headerElement.append(this._styleOriginView.element);

        this._selectorElement = document.createElement("span");
        this._selectorElement.classList.add("selector");
        this._selectorElement.addEventListener("mouseenter", this._highlightNodesWithSelector.bind(this));
        this._selectorElement.addEventListener("mouseleave", this._hideDOMNodeHighlight.bind(this));
        this._headerElement.append(this._selectorElement);

        this._openBrace = document.createElement("span");
        this._openBrace.classList.add("open-brace");
        this._openBrace.textContent = " {";
        this._headerElement.append(this._openBrace);

        if (this._style.selectorEditable) {
            this._selectorTextField = new WI.SpreadsheetRuleHeaderField(this, this._selectorElement);
            this._selectorTextField.addEventListener(WI.SpreadsheetRuleHeaderField.Event.StartedEditing, this._handleSpreadsheetSelectorFieldStartedEditing, this);
            this._selectorTextField.addEventListener(WI.SpreadsheetRuleHeaderField.Event.StoppedEditing, this._handleSpreadsheetSelectorFieldStoppedEditing, this);

            this._selectorElement.tabIndex = 0;
        }

        this._propertiesEditor = new WI.SpreadsheetCSSStyleDeclarationEditor(this, this._style);
        this._propertiesEditor.element.classList.add("properties");
        this._propertiesEditor.addEventListener(WI.SpreadsheetCSSStyleDeclarationEditor.Event.FilterApplied, this._handleEditorFilterApplied, this);

        this._closeBrace = document.createElement("span");
        this._closeBrace.classList.add("close-brace");
        this._closeBrace.textContent = "}";


        this.addSubview(this._propertiesEditor);
        this._propertiesEditor.needsLayout();
        this._element.append(this._closeBrace);

        if (!this._style.editable)
            this._element.classList.add("locked");
        else if (!this._style.ownerRule)
            this._element.classList.add("selector-locked");

        this.element.addEventListener("mousedown", this._handleMouseDown.bind(this));

        if (this._style.editable) {
            this.element.addEventListener("click", this._handleClick.bind(this));

            if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile)) {
                new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl, "S", this._save.bind(this), this._element);
                new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.CommandOrControl | WI.KeyboardShortcut.Modifier.Shift, "S", this._save.bind(this), this._element);
            }
        }
    }

    layout()
    {
        super.layout();

        this._styleOriginView.update(this._style);
        this._renderSelector();
        this._renderGroupings();

        if (this._shouldFocusSelectorElement)
            this.startEditingRuleSelector();
    }

    startEditingFirstGroupingOrRuleSelector()
    {
        for (let groupingTextElement of this._groupingElements) {
            if (groupingTextElement.associatedTextField) {
                groupingTextElement.associatedTextField.startEditing();
                return;
            }
        }

        this.startEditingRuleSelector();
    }

    startEditingRuleSelector()
    {
        if (!this._selectorElement) {
            this._shouldFocusSelectorElement = true;
            return;
        }

        this._shouldFocusSelectorElement = false;

        if (this._style.selectorEditable)
            this._selectorTextField.startEditing();
        else
            this._propertiesEditor.startEditingFirstProperty();
    }

    highlightProperty(property)
    {
        // When navigating from the Computed panel to the Styles panel, the latter
        // could be empty. Layout all properties so they can be highlighted.
        if (!this.didInitialLayout)
            this.updateLayout();

        if (this._propertiesEditor.highlightProperty(property)) {
            this._element.scrollIntoView();
            return true;
        }

        return false;
    }
    
    deselectProperties() 
    {
        this._propertiesEditor.deselectProperties();
    }

    // SpreadsheetRuleHeaderField delegate

    spreadsheetRuleHeaderFieldDidCommit(textField, changed)
    {
        if (textField === this._selectorTextField) {
            this._handleSpreadsheetSelectorFieldDidCommit(changed);
            return;
        }

        if (this._groupingElements.includes(textField.element)) {
            this._handleSpreadsheetGroupingFieldDidCommit(textField, changed);
            return;
        }

        console.assert(false, "not reached");
    }

    spreadsheetRuleHeaderFieldWillNavigate(textField, direction)
    {
        console.assert(direction);

        if (textField === this._selectorTextField) {
            this._handleSpreadsheetSelectorFieldWillNavigate(direction);
            return;
        }

        if (this._groupingElements.includes(textField.element)) {
            this._handleSpreadsheetGroupingFieldWillNavigate(textField, direction);
            return;
        }

        console.assert(false, "not reached");
    }

    spreadsheetRuleHeaderFieldDidDiscard(textField)
    {
        if (textField === this._selectorTextField) {
            this._discardSelectorChange();
            return;
        }

        if (this._groupingElements.includes(textField.element)) {
            this._handleSpreadsheetGroupingFieldDidDiscard(textField);
            return;
        }

        console.assert(false, "not reached");
    }

    // SpreadsheetCSSStyleDeclarationEditor delegate

    spreadsheetCSSStyleDeclarationEditorStartEditingRuleSelector()
    {
        this.startEditingRuleSelector();
    }

    spreadsheetCSSStyleDeclarationEditorStartEditingAdjacentRule(propertiesEditor, delta)
    {
        if (!this._delegate)
            return;

        if (this._delegate.spreadsheetCSSStyleDeclarationSectionStartEditingAdjacentRule)
            this._delegate.spreadsheetCSSStyleDeclarationSectionStartEditingAdjacentRule(this, delta);
    }

    spreadsheetCSSStyleDeclarationEditorPropertyBlur(event, property)
    {
        if (!this._isMousePressed)
            this._propertiesEditor.deselectProperties();
    }

    spreadsheetCSSStyleDeclarationEditorPropertyMouseEnter(event, property)
    {
        if (this._isMousePressed) {
            let index = parseInt(property.element.dataset.propertyIndex);
            this._propertiesEditor.selectProperties(this._mouseDownIndex, index);
        }
    }

    spreadsheetCSSStyleDeclarationEditorSelectProperty(property)
    {
        if (this._delegate && this._delegate.spreadsheetCSSStyleDeclarationSectionSelectProperty)
            this._delegate.spreadsheetCSSStyleDeclarationSectionSelectProperty(property);
    }

    spreadsheetCSSStyleDeclarationEditorSetAllPropertyVisibilityMode(editor, propertyVisibilityMode)
    {
        this._delegate?.spreadsheetCSSStyleDeclarationSectionSetAllPropertyVisibilityMode?.(this, propertyVisibilityMode);
    }

    applyFilter(filterText)
    {
        this._filterText = filterText;

        if (!this.didInitialLayout)
            return;

        this._element.classList.remove(WI.GeneralStyleDetailsSidebarPanel.NoFilterMatchInSectionClassName);

        this._propertiesEditor.applyFilter(this._filterText);
    }

    // Private

    _discardSelectorChange()
    {
        // Re-render selector for syntax highlighting.
        this._renderSelector();
    }

    _renderGroupings()
    {
        this._groupingElements = [];

        if (!this._style.groupings.length) {
            this._groupingsContainerElement?.remove();
            return;
        }

        if (!this._groupingsContainerElement) {
            this._groupingsContainerElement = document.createElement("div");
            this._groupingsContainerElement.classList.add("header-groupings");
        } else
            this._groupingsContainerElement.removeChildren();

        let groupings = this._style.groupings;
        for (let i = groupings.length - 1; i >= 0; --i) {
            let grouping = groupings[i];
            let groupingTypeElement = this._groupingsContainerElement.appendChild(document.createElement("div"));
            groupingTypeElement.classList.add("grouping");

            let prefix = grouping.prefix;
            if (prefix)
                groupingTypeElement.textContent = prefix + " ";

            let groupingTextElement = groupingTypeElement.appendChild(document.createElement("span"));
            groupingTextElement.textContent = grouping.text ?? "";
            groupingTextElement.representedGrouping = grouping;

            if (grouping.editable) {
                let groupingTextField = new WI.SpreadsheetRuleHeaderField(this, groupingTextElement);

                grouping.addEventListener(WI.CSSGrouping.Event.TextChanged, function(event) {
                    groupingTextElement.textContent = grouping.text;
                }, this);

                // Used by _handleSpreadsheetGroupingFieldWillNavigate to allow tabbing between grouping editors.
                groupingTextElement.associatedTextField = groupingTextField;
            }

            this._groupingElements.push(groupingTextElement);
        }

        this._element.insertBefore(this._groupingsContainerElement, this._headerElement);
    }

    _renderSelector()
    {
        this._selectorElement.removeChildren();
        this._selectorElements = [];

        let appendSelector = (selector, matched) => {
            console.assert(selector instanceof WI.CSSSelector);

            let selectorElement = this._selectorElement.appendChild(document.createElement("span"));
            selectorElement.textContent = selector.text;

            if (matched)
                selectorElement.classList.add(WI.SpreadsheetCSSStyleDeclarationSection.MatchedSelectorElementStyleClassName);

            if (selector.specificity) {
                let specificity = selector.specificity.map((number) => number.toLocaleString());
                let tooltip = WI.UIString("Specificity: (%d, %d, %d)").format(...specificity);
                if (selector.dynamic) {
                    tooltip += "\n";
                    if (this._style.inherited)
                        tooltip += WI.UIString("Dynamically calculated for the parent element");
                    else
                        tooltip += WI.UIString("Dynamically calculated for the selected element");
                }
                selectorElement.title = tooltip;
            } else if (selector.dynamic) {
                let tooltip = WI.UIString("Specificity: No value for selected element");
                tooltip += "\n";
                tooltip += WI.UIString("Dynamically calculated for the selected element and did not match");
                selectorElement.title = tooltip;
            }

            this._selectorElements.push(selectorElement);
        };

        let appendSelectorTextKnownToMatch = (selectorText) => {
            let selectorElement = this._selectorElement.appendChild(document.createElement("span"));
            selectorElement.textContent = selectorText;
            selectorElement.classList.add(WI.SpreadsheetCSSStyleDeclarationSection.MatchedSelectorElementStyleClassName);
        };

        if (!this._iconElement) {
            this._iconElement = document.createElement("img");
            this._iconElement.classList.add("icon");
            WI.addMouseDownContextMenuHandlers(this._iconElement, this._populateIconElementContextMenu.bind(this));
        }
        this._selectorElement.appendChild(this._iconElement);

        switch (this._style.type) {
        case WI.CSSStyleDeclaration.Type.Rule:
            console.assert(this._style.ownerRule);

            var hasMatchingPseudoSelector = false;

            var selectors = this._style.ownerRule.selectors;
            if (selectors.length) {
                for (let i = 0; i < selectors.length; ++i) {
                    let matched = this._style.ownerRule.matchedSelectorIndices.includes(i);
                    if (matched && selectors[i].isPseudoSelector())
                        hasMatchingPseudoSelector = true;

                    appendSelector(selectors[i], matched);
                    if (i < selectors.length - 1)
                        this._selectorElement.append(", ");
                }
            } else
                appendSelectorTextKnownToMatch(this._style.ownerRule.selectorText);

            this._element.classList.toggle("pseudo-selector", hasMatchingPseudoSelector);
            break;

        case WI.CSSStyleDeclaration.Type.Inline: {
            this._selectorElement.classList.add("style-attribute");
            let wrapper = this._selectorElement.appendChild(document.createElement("span"));
            wrapper.textContent = WI.UIString("Style Attribute", "CSS properties defined via HTML style attribute");
            break;
        }

        case WI.CSSStyleDeclaration.Type.Attribute:
            appendSelectorTextKnownToMatch(this._style.node.displayName);
            break;
        }

        if (this._filterText)
            this.applyFilter(this._filterText);
    }

    _save(event)
    {
        event.stop();

        if (this._style.type !== WI.CSSStyleDeclaration.Type.Rule) {
            // FIXME: Can't save CSS inside <style></style> <https://webkit.org/b/150357>
            InspectorFrontendHost.beep();
            return;
        }

        console.assert(this._style.ownerRule instanceof WI.CSSRule);
        console.assert(this._style.ownerRule.sourceCodeLocation instanceof WI.SourceCodeLocation);

        let sourceCode = this._style.ownerRule.sourceCodeLocation.sourceCode;
        if (sourceCode.type !== WI.Resource.Type.StyleSheet) {
            // FIXME: Can't save CSS inside style="" <https://webkit.org/b/150357>
            InspectorFrontendHost.beep();
            return;
        }

        let url;
        if (sourceCode.urlComponents.scheme === "data") {
            let mainResource = WI.networkManager.mainFrame.mainResource;
            if (mainResource.urlComponents.lastPathComponent.endsWith(".html"))
                url = mainResource.url.replace(/\.html$/, "-data.css");
            else {
                let pathDirectory = mainResource.url.slice(0, -mainResource.urlComponents.lastPathComponent.length);
                url = pathDirectory + "data.css";
            }
        } else
            url = sourceCode.url;

        let forceSaveAs = event.shiftKey;
        WI.FileUtilities.save(WI.FileUtilities.SaveMode.SingleFile, {url, content: sourceCode.content}, forceSaveAs);
    }

    _handleMouseDown(event)
    {
        if (event.button !== 0)
            return;

        this._wasEditing = this._propertiesEditor.editing || document.activeElement === this._selectorElement;

        let propertyElement = event.target.closest(".property");
        if (!propertyElement)
            return;

        this._isMousePressed = true;

        // Disable text selection on mousemove.
        event.preventDefault();

        // Canceling mousedown event prevents blur event from firing on the previously focused element.
        if (this._wasEditing && document.activeElement)
            document.activeElement.blur();

        // Prevent name/value fields from editing when properties selected.
        window.addEventListener("click", this._handleWindowClick.bind(this), {capture: true, once: true});

        let propertyIndex = parseInt(propertyElement.dataset.propertyIndex);
        if (event.shiftKey && this._propertiesEditor.hasSelectedProperties())
            this._propertiesEditor.extendSelectedProperties(propertyIndex);
        else {
            this._propertiesEditor.deselectProperties();
            this._mouseDownPoint = WI.Point.fromEvent(event);
            if (!this._boundHandleWindowMouseMove)
                this._boundHandleWindowMouseMove = this._handleWindowMouseMove.bind(this);
            window.addEventListener("mousemove", this._boundHandleWindowMouseMove);
        }

        if (propertyElement.parentNode) {
            this._mouseDownIndex = propertyIndex;
            this._element.classList.add("selecting");
        } else
            this._stopSelection();
    }

    _populateIconElementContextMenu(contextMenu)
    {
        contextMenu.appendItem(WI.UIString("Copy Rule"), () => {
            InspectorFrontendHost.copyText(this._style.generateFormattedText({includeGroupingsAndSelectors: true, multiline: true}));
        });

        if (this._style.editable && this._style.properties.length) {
            let shouldDisable = this._style.properties.some((property) => property.enabled);
            contextMenu.appendItem(shouldDisable ? WI.UIString("Disable Rule") : WI.UIString("Enable Rule"), () => {
                for (let property of this._style.properties)
                    property.commentOut(shouldDisable);
            });
        }

        if (!this._style.inherited && InspectorBackend.hasCommand("CSS.addRule")) {
            let generateSelector = () => {
                if (this._style.type === WI.CSSStyleDeclaration.Type.Attribute)
                    return this._style.node.displayName;
                return this._style.selectorText;
            };

            let createNewRule = (selector, text) => {
                if (this._delegate && this._delegate.spreadsheetCSSStyleDeclarationSectionAddNewRule)
                    this._delegate.spreadsheetCSSStyleDeclarationSectionAddNewRule(this, selector, text);
                else
                    this._style.nodeStyles.addRule(selector, text);
            };

            contextMenu.appendSeparator();

            contextMenu.appendItem(WI.UIString("Duplicate Selector"), () => {
                createNewRule(generateSelector());
            });

            if (!WI.CSSManager.PseudoElementNames.some((className) => this._style.selectorText.includes(":" + className))) {
                let addPseudoRule = (pseudoSelector, text) => {
                    let selector = null;
                    if (this._style.ownerRule)
                        selector = this._style.ownerRule.selectors.map((selector) => selector.text + pseudoSelector).join(", ");
                    else
                        selector = generateSelector() + pseudoSelector;
                    createNewRule(selector, text);
                };

                if (WI.cssManager.canForcePseudoClass() && Object.values(WI.CSSManager.ForceablePseudoClass).every((className) => !this._style.selectorText.includes(":" + className))) {
                    contextMenu.appendSeparator();

                    for (let pseudoClass of Object.values(WI.CSSManager.ForceablePseudoClass)) {
                        if (!WI.cssManager.canForcePseudoClass(pseudoClass))
                            continue;

                        if (pseudoClass === WI.CSSManager.ForceablePseudoClass.Visited && this._style.node.nodeName() !== "A")
                            continue;

                        let pseudoClassSelector = ":" + pseudoClass;
                        contextMenu.appendItem(WI.UIString("Add %s Rule").format(pseudoClassSelector), () => {
                            this._style.node.setPseudoClassEnabled(pseudoClass, true);

                            addPseudoRule(pseudoClassSelector);
                        });
                    }
                }

                if (this._style.type === WI.CSSStyleDeclaration.Type.Rule) {
                    contextMenu.appendSeparator();

                    for (let pseudoElement of WI.CSSManager.PseudoElementNames) {
                        let pseudoElementSelector = "::" + pseudoElement;
                        contextMenu.appendItem(WI.UIString("Create %s Rule").format(pseudoElementSelector), () => {
                            addPseudoRule(pseudoElementSelector, "content: \"\";");
                        });
                    }
                }
            }
        }

        if (this._style.ownerRule && this._style.ownerRule.sourceCodeLocation) {
            contextMenu.appendSeparator();

            let label = null;
            let sourceCode = this._style.ownerRule.sourceCodeLocation.displaySourceCode;
            if (sourceCode instanceof WI.CSSStyleSheet || (sourceCode instanceof WI.Resource && sourceCode.type === WI.Resource.Type.StyleSheet))
                label = WI.UIString("Reveal in Style Sheet");
            else
                label = WI.UIString("Reveal in Sources Tab");
            contextMenu.appendItem(label, () => {
                WI.showSourceCodeLocation(this._style.ownerRule.sourceCodeLocation, {
                    ignoreNetworkTab: true,
                    ignoreSearchTab: true,
                    initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                });
            });
        }
    }

    _handleWindowClick(event)
    {
        if (this._propertiesEditor.hasSelectedProperties()) {
            // Don't start editing name/value if there's selection.
            event.stop();
        }
        this._stopSelection();
    }

    _handleWindowMouseMove(event)
    {
        console.assert(this._mouseDownPoint);

        if (this._mouseDownPoint.distance(WI.Point.fromEvent(event)) < 8)
            return;

        if (!this._propertiesEditor.hasSelectedProperties()) {
            console.assert(!isNaN(this._mouseDownIndex));
            this._propertiesEditor.selectProperties(this._mouseDownIndex, this._mouseDownIndex);
        }

        window.removeEventListener("mousemove", this._boundHandleWindowMouseMove);
        this._mouseDownPoint = null;
    }

    _handleClick(event)
    {
        this._stopSelection();

        if (this._wasEditing || this._propertiesEditor.hasSelectedProperties())
            return;

        if (window.getSelection().type === "Range")
            return;

        event.stop();

        if (event.target.classList.contains(WI.SpreadsheetStyleProperty.StyleClassName)) {
            let propertyIndex = parseInt(event.target.dataset.propertyIndex);
            this._propertiesEditor.addBlankProperty(propertyIndex + 1);
            return;
        }

        if (event.target === this._headerElement || event.target === this._openBrace) {
            this._propertiesEditor.addBlankProperty(0);
            return;
        }

        if (event.target === this._element || event.target === this._closeBrace) {
            const appendAfterLast = -1;
            this._propertiesEditor.addBlankProperty(appendAfterLast);
        }
    }

    _stopSelection()
    {
        this._isMousePressed = false;
        this._mouseDownIndex = NaN;
        this._element.classList.remove("selecting");

        // "copy" and "cut" events won't fire on SpreadsheetCSSStyleDeclarationEditor unless it has text selected.
        // Placing a text caret inside of a property has no visible effects but it allows the events to fire.
        this._propertiesEditor.placeTextCaretInFocusedProperty();

        window.removeEventListener("mousemove", this._boundHandleWindowMouseMove);
        this._mouseDownPoint = null;
    }

    _highlightNodesWithSelector()
    {
        let node = this._style.node;

        if (!this._style.ownerRule) {
            node.highlight();
            return;
        }

        let selectorText = this._selectorElement.textContent.trim();
        if (node.frame)
            WI.domManager.highlightSelector(selectorText, node.frame.id);
        else
            WI.domManager.highlightSelector(selectorText);
    }

    _hideDOMNodeHighlight()
    {
        WI.domManager.hideDOMNodeHighlight();
    }

    _handleEditorFilterApplied(event)
    {
        let matchesGrouping = false;
        for (let groupingElement of this._groupingElements) {
            groupingElement.parentElement.classList.remove(WI.GeneralStyleDetailsSidebarPanel.FilterMatchSectionClassName);

            // Check the parent element to also include the grouping type in the search.
            if (groupingElement.parentElement.textContent.includes(this._filterText)) {
                groupingElement.parentElement.classList.add(WI.GeneralStyleDetailsSidebarPanel.FilterMatchSectionClassName);
                matchesGrouping = true;
            }
        }

        let matchesSelector = false;
        for (let selectorElement of this._selectorElements) {
            selectorElement.classList.remove(WI.GeneralStyleDetailsSidebarPanel.FilterMatchSectionClassName);

            if (selectorElement.textContent.includes(this._filterText)) {
                selectorElement.classList.add(WI.GeneralStyleDetailsSidebarPanel.FilterMatchSectionClassName);
                matchesSelector = true;
            }
        }

        let matches = event.data.matches || matchesGrouping || matchesSelector;
        if (!matches)
            this._element.classList.add(WI.GeneralStyleDetailsSidebarPanel.NoFilterMatchInSectionClassName);

        this.dispatchEventToListeners(WI.SpreadsheetCSSStyleDeclarationSection.Event.FilterApplied, {matches});
    }

    _handleSpreadsheetSelectorFieldStartedEditing(event)
    {
        this._headerElement.classList.add("editing-selector");
    }

    _handleSpreadsheetSelectorFieldStoppedEditing(event)
    {
        this._headerElement.classList.remove("editing-selector");
    }

    _handleSpreadsheetSelectorFieldDidCommit(changed)
    {
        let selectorText = this._selectorElement.textContent.trim();
        if (selectorText && changed) {
            this.dispatchEventToListeners(WI.SpreadsheetCSSStyleDeclarationSection.Event.SelectorOrGroupingWillChange);
            this._setSelectorTextPromise = this._style.ownerRule.setSelectorText(selectorText).finally(this._renderSelector.bind(this));
        } else
            this._discardSelectorChange();
    }

    _handleSpreadsheetSelectorFieldWillNavigate(direction)
    {
        if (direction === "forward")
            this._setSelectorTextPromise.then(() => this._propertiesEditor.startEditingFirstProperty());
        else if (direction === "backward") {
            for (let i = this._groupingElements.length - 1; i >= 0; ++i) {
                let groupingElementTextField = this._groupingElements[i].associatedTextField;
                if (groupingElementTextField) {
                    groupingElementTextField.startEditing();
                    return;
                }
            }
            if (this._delegate.spreadsheetCSSStyleDeclarationSectionStartEditingAdjacentRule) {
                const delta = -1;
                this._delegate.spreadsheetCSSStyleDeclarationSectionStartEditingAdjacentRule(this, delta);
            } else
                this._setSelectorTextPromise.then(() => this._propertiesEditor.startEditingLastProperty());
        }
    }

    _handleSpreadsheetGroupingFieldDidCommit(textField, changed)
    {
        let groupingTextElement = textField.element;
        let text = groupingTextElement.textContent.trim();

        if (!changed || !text) {
            this._handleSpreadsheetGroupingFieldDidDiscard(textField);
            return;
        }

        this.dispatchEventToListeners(WI.SpreadsheetCSSStyleDeclarationSection.Event.SelectorOrGroupingWillChange);
        groupingTextElement.representedGrouping.setText(text).catch((error) => {}).finally(() => {
            groupingTextElement.textContent = groupingTextElement.representedGrouping.text || "";
        });
    }

    _handleSpreadsheetGroupingFieldWillNavigate(textField, direction)
    {
        let groupingTextElement = textField.element;
        let directionOffset = direction === "forward" ? 1 : -1;
        let currentGroupingIndex = this._groupingElements.indexOf(groupingTextElement);
        console.assert(currentGroupingIndex >= 0);

        let newGroupingIndex = currentGroupingIndex + directionOffset;

        while (newGroupingIndex >= 0 && newGroupingIndex < this._groupingElements.length) {
            if (this._groupingElements[newGroupingIndex].associatedTextField)
                break;

            newGroupingIndex += directionOffset;
        }

        if (newGroupingIndex < 0) {
            if (this._delegate?.spreadsheetCSSStyleDeclarationSectionStartEditingAdjacentRule)
                this._delegate.spreadsheetCSSStyleDeclarationSectionStartEditingAdjacentRule(this, directionOffset);
            else
                this._propertiesEditor.startEditingLastProperty();

            return;
        }

        if (newGroupingIndex >= this._groupingElements.length) {
            this._selectorTextField.startEditing();
            return;
        }

        this._groupingElements[newGroupingIndex].associatedTextField.startEditing();
    }

    _handleSpreadsheetGroupingFieldDidDiscard(textField)
    {
        let groupingTextElement = textField.element;
        groupingTextElement.textContent = groupingTextElement.representedGrouping.text || "";
    }
};

WI.SpreadsheetCSSStyleDeclarationSection.Event = {
    FilterApplied: "spreadsheet-css-style-declaration-section-filter-applied",
    SelectorOrGroupingWillChange: "spreadsheet-css-style-declaration-section-selector--or-grouping-will-change",
};

WI.SpreadsheetCSSStyleDeclarationSection.MatchedSelectorElementStyleClassName = "matched";
