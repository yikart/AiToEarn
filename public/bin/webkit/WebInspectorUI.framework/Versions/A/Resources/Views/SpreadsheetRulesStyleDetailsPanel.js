/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.SpreadsheetRulesStyleDetailsPanel = class SpreadsheetRulesStyleDetailsPanel extends WI.StyleDetailsPanel
{
    constructor(delegate)
    {
        const className = "rules";
        const identifier = "rules";
        const label = WI.UIString("Styles \u2014 Rules");
        super(delegate, className, identifier, label);

        // Make the styles sidebar always left-to-right since CSS is strictly an LTR language.
        this.element.dir = "ltr";

        this._headerMap = new Map;
        this._sections = [];
        this._newRuleSelector = null;
        this._newRuleStyleId = null;
        this._ruleMediaAndInherticanceList = [];
        this._propertyToSelectAndHighlight = null;
        this._filterText = null;
        this._shouldRefreshSubviews = false;
        this._suppressLayoutAfterSelectorOrGroupChange = false;

        this._emptyFilterResultsElement = WI.createMessageTextView(WI.UIString("No Results Found"));
    }

    // Public

    get supportsNewRule()
    {
        return this.nodeStyles && !this.nodeStyles.node.isInUserAgentShadowTree() && InspectorBackend.hasCommand("CSS.addRule");
    }

    get supportsToggleCSSClassList()
    {
        return true;
    }

    get supportsToggleCSSForcedPseudoClass()
    {
        return true;
    }

    get initialToggleCSSForcedPseudoClassState()
    {
        return true;
    }

    refresh(significantChange)
    {
        // We only need to do a rebuild on significant changes. Other changes are handled
        // by the sections and text editors themselves.
        if (significantChange) {
            this._shouldRefreshSubviews = true;
            this.needsLayout();
        }

        super.refresh(significantChange);
    }

    scrollToSectionAndHighlightProperty(property)
    {
        if (!this.isAttached || this.layoutPending) {
            this._propertyToSelectAndHighlight = property;
            return;
        }

        for (let section of this._sections) {
            section.deselectProperties();
            section.highlightProperty(property);
        }
    }

    nodeStylesRefreshed(event)
    {
        super.nodeStylesRefreshed(event);

        if (this._propertyToSelectAndHighlight) {
            this.scrollToSectionAndHighlightProperty(this._propertyToSelectAndHighlight);
            this._propertyToSelectAndHighlight = null;
        }
    }

    newRuleButtonClicked()
    {
        this._addNewRule();
    }

    newRuleButtonContextMenu(event)
    {
        let styleSheets = WI.cssManager.styleSheets.filter(styleSheet => styleSheet.hasInfo() && !styleSheet.isInlineStyleTag() && !styleSheet.isInlineStyleAttributeStyleSheet());
        if (!styleSheets.length)
            return;

        let contextMenu = WI.ContextMenu.createFromEvent(event);

        const handler = null;
        const disabled = true;
        contextMenu.appendItem(WI.UIString("Available Style Sheets"), handler, disabled);

        let [inspectorStyleSheets, regularStyleSheets] = styleSheets.partition(styleSheet => styleSheet.isInspectorStyleSheet());
        console.assert(inspectorStyleSheets.length <= 1, "There should never be more than one inspector style sheet");

        contextMenu.appendItem(WI.UIString("Inspector Style Sheet"), () => {
            this._addNewRule(inspectorStyleSheets.length ? inspectorStyleSheets[0].id : null);
        });

        for (let styleSheet of regularStyleSheets) {
            contextMenu.appendItem(styleSheet.displayName, () => {
                this._addNewRule(styleSheet.id);
            });
        }
    }

    applyFilter(filterText)
    {
        this._filterText = filterText;

        if (!this.didInitialLayout)
            return;

        if (this._filterText)
            this.element.classList.add("filter-non-matching");

        for (let header of this._headerMap.values())
            header.classList.add(WI.GeneralStyleDetailsSidebarPanel.NoFilterMatchInSectionClassName);

        for (let section of this._sections)
            section.applyFilter(this._filterText);
    }

    focusFirstSection()
    {
        this.spreadsheetCSSStyleDeclarationSectionStartEditingAdjacentRule(null, 1);
    }

    focusLastSection()
    {
        this.spreadsheetCSSStyleDeclarationSectionStartEditingAdjacentRule(null, -1);
    }

    // SpreadsheetCSSStyleDeclarationSection delegate

    spreadsheetCSSStyleDeclarationSectionSelectProperty(property)
    {
        this.scrollToSectionAndHighlightProperty(property);
    }

    spreadsheetCSSStyleDeclarationSectionStartEditingAdjacentRule(currentSection, delta)
    {
        console.assert(delta !== 0);

        let index = this._sections.indexOf(currentSection);
        if (index < 0) {
            if (delta < 0)
                index = this._sections.length;
            else if (delta > 0)
                index = -1;
        }
        index += delta;

        while (this._sections[index] !== currentSection) {
            if (index < 0)
                index = this._sections.length - 1;
            else if (index >= this._sections.length) {
                if (this._delegate && this._delegate.styleDetailsPanelFocusFilterBar) {
                    this._delegate.styleDetailsPanelFocusFilterBar(this);
                    break;
                }

                index = 0;
            }

            let section = this._sections[index];
            if (section.editable) {
                if (delta < 0)
                    section._propertiesEditor.startEditingLastProperty();
                else
                    section.startEditingFirstGroupingOrRuleSelector();
                break;
            }

            index += delta;
        }
    }

    spreadsheetCSSStyleDeclarationSectionAddNewRule(section, selector, text)
    {
        this._newRuleSelector = selector;
        this.nodeStyles.addRule(this._newRuleSelector, text).then((rulePayload) => {this._newRuleStyleId = rulePayload.style.styleId;});
    }

    spreadsheetCSSStyleDeclarationSectionSetAllPropertyVisibilityMode(section, propertyVisibilityMode)
    {
        for (let section of this._sections)
            section.propertyVisibilityMode = propertyVisibilityMode;
    }

    // Protected

    layout()
    {
        if (!this._shouldRefreshSubviews)
            return;

        this._shouldRefreshSubviews = false;

        if (this._suppressLayoutAfterSelectorOrGroupChange) {
            this._suppressLayoutAfterSelectorOrGroupChange = false;
            return;
        }

        this.removeAllSubviews();

        let previousStyle = null;
        let currentHeader = null;
        this._headerMap.clear();
        this._sections = [];

        let addHeader = (text, nodeOrPseudoId) => {
            currentHeader = this.element.appendChild(document.createElement("h2"));
            currentHeader.classList.add("section-header");
            currentHeader.append(text);

            if (nodeOrPseudoId) {
                if (nodeOrPseudoId instanceof WI.DOMNode) {
                    currentHeader.append(" ", WI.linkifyNodeReference(nodeOrPseudoId, {
                        maxLength: 100,
                        excludeRevealElement: true,
                    }));
                } else
                    currentHeader.append(" ", WI.CSSManager.displayNameForPseudoId(nodeOrPseudoId));
            }
        };

        let addSection = (section) => {
            if (section.style.inherited && (!previousStyle || previousStyle.node !== section.style.node))
                addHeader(WI.UIString("Inherited From", "A section of CSS rules matching an ancestor DOM node"), section.style.node);

            this.addSubview(section);

            this._sections.push(section);
            section.needsLayout();

            if (currentHeader)
                this._headerMap.set(section.style, currentHeader);

            previousStyle = section.style;
        };

        let createSection = (style) => {
            let section = style[SpreadsheetRulesStyleDetailsPanel.StyleSectionSymbol];
            if (!section) {
                section = new WI.SpreadsheetCSSStyleDeclarationSection(this, style);
                section.addEventListener(WI.SpreadsheetCSSStyleDeclarationSection.Event.FilterApplied, this._handleSectionFilterApplied, this);
                section.addEventListener(WI.SpreadsheetCSSStyleDeclarationSection.Event.SelectorOrGroupingWillChange, this._handleSectionSelectorOrGroupingWillChange, this);
                style[SpreadsheetRulesStyleDetailsPanel.StyleSectionSymbol] = section;
            }

            if (this._newRuleSelector === style.selectorText && style.enabledProperties.length === 0 && Object.shallowEqual(this._newRuleStyleId, style.id))
                section.startEditingRuleSelector();

            addSection(section);
        };

        let addedPseudoStyles = false;
        let addPseudoStyles = () => {
            if (addedPseudoStyles)
                return;

            // Add all pseudo styles before any inherited rules.
            let beforePseudoId = null;
            let afterPseudoId = null;
            if (InspectorBackend.Enum.CSS.PseudoId) {
                beforePseudoId = WI.CSSManager.PseudoSelectorNames.Before;
                afterPseudoId = WI.CSSManager.PseudoSelectorNames.After;
            } else {
                // Compatibility (iOS 12.2): CSS.PseudoId did not exist.
                beforePseudoId = 4;
                afterPseudoId = 5;
            }

            for (let [pseudoId, pseudoElementInfo] of this.nodeStyles.pseudoElements) {
                let pseudoElement = null;
                if (pseudoId === beforePseudoId)
                    pseudoElement = this.nodeStyles.node.beforePseudoElement();
                else if (pseudoId === afterPseudoId)
                    pseudoElement = this.nodeStyles.node.afterPseudoElement();
                addHeader(WI.UIString("Pseudo-Element"), pseudoElement || pseudoId);

                for (let style of WI.DOMNodeStyles.uniqueOrderedStyles(pseudoElementInfo.orderedStyles))
                    createSection(style);
            }

            addedPseudoStyles = true;
        };

        for (let style of this.nodeStyles.uniqueOrderedStyles) {
            if (style.inherited)
                addPseudoStyles();
            createSection(style);
        }

        addPseudoStyles();

        this._newRuleSelector = null;
        this._newRuleStyleId = null;

        this.element.append(this._emptyFilterResultsElement);

        if (this._filterText)
            this.applyFilter(this._filterText);
    }

    filterDidChange(filterBar)
    {
        this.applyFilter(filterBar.filters.text);
    }

    // Private

    _handleSectionFilterApplied(event)
    {
        if (!event.data.matches)
            return;

        this.element.classList.remove("filter-non-matching");

        let header = this._headerMap.get(event.target.style);
        if (header)
            header.classList.remove(WI.GeneralStyleDetailsSidebarPanel.NoFilterMatchInSectionClassName);
    }

    _addNewRule(stylesheetId)
    {
        const justSelector = true;
        this._newRuleSelector = this.nodeStyles.node.appropriateSelectorFor(justSelector);

        const text = "";
        this.nodeStyles.addRule(this._newRuleSelector, text, stylesheetId).then((rulePayload) => {this._newRuleStyleId = rulePayload.style.styleId;});
    }

    _handleSectionSelectorOrGroupingWillChange(event)
    {
        this._suppressLayoutAfterSelectorOrGroupChange = true;
    }
};

WI.SpreadsheetRulesStyleDetailsPanel.StyleSectionSymbol = Symbol("style-section");
