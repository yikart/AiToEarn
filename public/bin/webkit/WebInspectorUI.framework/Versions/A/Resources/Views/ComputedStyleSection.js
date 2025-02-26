/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.ComputedStyleSection = class ComputedStyleSection extends WI.View
{
    constructor(delegate, {variablesGroupType} = {})
    {
        console.assert(!variablesGroupType || Object.values(WI.CSSStyleDeclaration.VariablesGroupType).includes(variablesGroupType), variablesGroupType);
        console.assert(delegate);

        super();

        this.element.classList.add(WI.ComputedStyleSection.StyleClassName);
        this.element.dir = "ltr";

        this._delegate = delegate;
        this._style = null;
        this._styleTraces = null;
        this._propertyViews = [];

        this._showsImplicitProperties = false;
        this._showsShorthandsInsteadOfLonghands = false;
        this._alwaysShowPropertyNames = new Set;
        this._propertyVisibilityMode = WI.ComputedStyleSection.PropertyVisibilityMode.ShowAll;
        this._hideFilterNonMatchingProperties = false;
        this._filterText = null;
        this._filterCleared = false;
        this._variablesGroupType = variablesGroupType || null;
    }

    // Public

    get variablesGroupType() { return this._variablesGroupType; }

    get style()
    {
        return this._style;
    }

    set style(style)
    {
        if (this._style === style)
            return;

        if (this._style)
            this._style.removeEventListener(WI.CSSStyleDeclaration.Event.PropertiesChanged, this._handlePropertiesChanged, this);

        this._style = style || null;

        if (this._style)
            this._style.addEventListener(WI.CSSStyleDeclaration.Event.PropertiesChanged, this._handlePropertiesChanged, this);

        this.needsLayout();
    }

    get styleTraces()
    {
        return this._styleTraces;
    }

    set styleTraces(styleTraces)
    {
        if (Array.shallowEqual(this._styleTraces, styleTraces))
            return;

        this._styleTraces = styleTraces || null;
        this.needsLayout();
    }

    set showsImplicitProperties(value)
    {
        if (value === this._showsImplicitProperties)
            return;

        this._showsImplicitProperties = value;

        this.needsLayout();
    }

    set showsShorthandsInsteadOfLonghands(value)
    {
        if (value === this._showsShorthandsInsteadOfLonghands)
            return;

        this._showsShorthandsInsteadOfLonghands = value;

        this.needsLayout();
    }

    set alwaysShowPropertyNames(propertyNames)
    {
        this._alwaysShowPropertyNames = new Set(propertyNames);

        this.needsLayout();
    }

    set propertyVisibilityMode(propertyVisibilityMode)
    {
        if (this._propertyVisibilityMode === propertyVisibilityMode)
            return;

        this._propertyVisibilityMode = propertyVisibilityMode;

        this.needsLayout();
    }

    set hideFilterNonMatchingProperties(value)
    {
        if (value === this._hideFilterNonMatchingProperties)
            return;

        this._hideFilterNonMatchingProperties = value;

        this.needsLayout();
    }

    get isEmpty()
    {
        return !this._propertyViews.length;
    }

    get properties()
    {
        if (this._variablesGroupType && this._variablesGroupType !== WI.CSSStyleDeclaration.VariablesGroupType.Ungrouped)
            return this._style.variablesForType(this._variablesGroupType);

        if (this._style.styleSheetTextRange)
            return this._style.visibleProperties;
        
        return this._style.properties;
    }

    get propertiesToRender()
    {
        let properties = [];
        if (!this._style)
            return properties;

        properties = this.properties || [];

        let propertyNameMap = new Map(properties.map((property) => [property.canonicalName, property]));

        function hasNonImplicitLonghand(property) {
            if (property.canonicalName === "all")
                return false;

            let longhandPropertyNames = WI.CSSKeywordCompletions.LonghandNamesForShorthandProperty.get(property.canonicalName);
            if (!longhandPropertyNames)
                return false;

            for (let longhandPropertyName of longhandPropertyNames) {
                let property = propertyNameMap.get(longhandPropertyName);
                if (property && !property.implicit)
                    return true;
            }

            return false;
        }

        let hideVariables = this._propertyVisibilityMode === ComputedStyleSection.PropertyVisibilityMode.HideVariables;
        let hideNonVariables = this._propertyVisibilityMode === ComputedStyleSection.PropertyVisibilityMode.HideNonVariables;

        properties = properties.filter((property) => {
            if (this._alwaysShowPropertyNames.has(property.canonicalName))
                return true;

            if (property.implicit && !this._showsImplicitProperties) {
                if (!(this._showsShorthandsInsteadOfLonghands && property.isShorthand && hasNonImplicitLonghand(property)))
                    return false;
            }

            if (this._showsShorthandsInsteadOfLonghands) {
                if (property.shorthandPropertyNames.length)
                    return false;
            } else if (property.isShorthand)
                return false;

            if (property.isVariable && hideVariables)
                return false;

            if (!property.isVariable && hideNonVariables)
                return false;

            return true;
        });

        properties.sort((a, b) => WI.CSSProperty.sortPreferringNonPrefixed(a.name, b.name));
        return properties;
    }

    layout()
    {
        super.layout();

        this.element.removeChildren();

        this._propertyViews = [];
        let properties = this.propertiesToRender;

        for (let i = 0; i < properties.length; i++) {
            let property = properties[i];
            let propertyView = new WI.SpreadsheetStyleProperty(this, property, {readOnly: true});

            if (this._filterText) {
                let matchesFilter = propertyView.applyFilter(this._filterText);
                if (!matchesFilter)
                    continue;
            }

            propertyView.index = i;
            this._propertyViews.push(propertyView);

            let propertyTrace = this._styleTraces ? this._styleTraces.get(property.name) : null;
            let traceElement = null;
            if (propertyTrace && propertyTrace.length > 0)
                traceElement = this._createTrace(propertyTrace);

            let expandableView = new WI.ExpandableView(property.name, propertyView.element, traceElement);
            expandableView.element.classList.add("computed-property-item");
            this.element.append(expandableView.element);
        }

        if (this._filterText || this._filterCleared)
            this.dispatchEventToListeners(WI.ComputedStyleSection.Event.FilterApplied, {matches: !this.isEmpty});

        this._filterCleared = false;
    }

    detached()
    {
        super.detached();

        this._propertiesChangedDebouncer?.cancel();

        for (let propertyView of this._propertyViews)
            propertyView.detached();
    }

    applyFilter(filterText)
    {
        if (this._filterText && !filterText)
            this._filterCleared = true;

        this._filterText = filterText;

        if (!this.didInitialLayout)
            return;

        this.needsLayout();
    }

    // SpreadsheetStyleProperty delegate

    spreadsheetStylePropertyShowProperty(propertyView, property)
    {
        if (this._delegate.spreadsheetCSSStyleDeclarationEditorShowProperty)
            this._delegate.spreadsheetCSSStyleDeclarationEditorShowProperty(this, property);
    }

    // Private

    _createTrace(propertyTrace)
    {
        let traceElement = document.createElement("ul");
        traceElement.className = "property-traces";

        for (let property of propertyTrace) {
            let traceItemElement = document.createElement("li");
            traceItemElement.className = "property-trace-item";

            let leftElement = document.createElement("div");
            leftElement.className = "property-trace-item-left";

            let rightElement = document.createElement("div");
            rightElement.className = "property-trace-item-right";

            traceItemElement.append(leftElement, rightElement);

            let propertyView = new WI.SpreadsheetStyleProperty(this, property, {readOnly: true});

            let selectorText = "";
            let ownerStyle = property.ownerStyle;
            if (ownerStyle) {
                let ownerRule = ownerStyle.ownerRule;
                if (ownerRule)
                    selectorText = ownerRule.selectorText;
            }
            let selectorElement = document.createElement("span");
            selectorElement.textContent = selectorText.truncateMiddle(24);
            selectorElement.className = "selector";

            leftElement.append(propertyView.element, selectorElement);

            if (property.ownerStyle) {
                let styleOriginView = new WI.StyleOriginView();
                styleOriginView.update(property.ownerStyle);
                rightElement.append(styleOriginView.element);
            }

            traceElement.append(traceItemElement);
        }

        return traceElement;
    }

    _handlePropertiesChanged(event)
    {
        this._propertiesChangedDebouncer ||= new Debouncer(this.needsLayout.bind(this));
        this._propertiesChangedDebouncer.delayForTime(250);
    }

};

WI.ComputedStyleSection.Event = {
    FilterApplied: "computed-style-section-filter-applied",
};

WI.ComputedStyleSection.StyleClassName = "computed-style-section";

WI.ComputedStyleSection.PropertyVisibilityMode = {
    ShowAll: Symbol("variable-visibility-show-all"),
    HideVariables: Symbol("variable-visibility-hide-variables"),
    HideNonVariables: Symbol("variable-visibility-hide-non-variables"),
};
