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

WI.CSSStyleDeclaration = class CSSStyleDeclaration extends WI.Object
{
    constructor(nodeStyles, ownerStyleSheet, id, type, node, inherited, text, properties, styleSheetTextRange)
    {
        super();

        console.assert(nodeStyles);
        this._nodeStyles = nodeStyles;

        this._ownerRule = null;

        this._ownerStyleSheet = ownerStyleSheet || null;
        this._id = id || null;
        this._type = type || null;
        this._node = node || null;
        this._inherited = inherited || false;

        this._initialState = null;
        this._updatesInProgressCount = 0;
        this._pendingPropertiesChanged = false;
        this._locked = false;
        this._pendingProperties = [];
        this._propertyNameMap = {};

        this._properties = [];
        this._enabledProperties = null;
        this._visibleProperties = null;
        this._variablesForType = new Map;

        this.update(text, properties, styleSheetTextRange, {dontFireEvents: true});
    }

    // Public

    get initialState() { return this._initialState; }

    get id()
    {
        return this._id;
    }

    get stringId()
    {
        if (this._id)
            return this._id.styleSheetId + "/" + this._id.ordinal;
        else
            return "";
    }

    get ownerStyleSheet()
    {
        return this._ownerStyleSheet;
    }

    get type()
    {
        return this._type;
    }

    get inherited()
    {
        return this._inherited;
    }

    get node()
    {
        return this._node;
    }

    get editable()
    {
        if (!this._id)
            return false;

        if (this._type === WI.CSSStyleDeclaration.Type.Rule)
            return this._ownerRule && this._ownerRule.editable;

        if (this._type === WI.CSSStyleDeclaration.Type.Inline)
            return !this._node.isInUserAgentShadowTree() || WI.DOMManager.supportsEditingUserAgentShadowTrees();

        return false;
    }

    get selectorEditable()
    {
        return this._ownerRule && this._ownerRule.editable && !this._ownerRule.isImplicitlyNested && InspectorBackend.hasCommand("CSS.setRuleSelector");
    }

    get locked() { return this._locked; }
    set locked(value) { this._locked = value; }

    variablesForType(type)
    {
        console.assert(Object.values(WI.CSSStyleDeclaration.VariablesGroupType).includes(type), type);

        let variables = this._variablesForType.get(type);
        if (variables)
            return variables;

        // Will iterate in order through type checkers for each CSS variable to identify its type.
        // The catch-all "other" must always be last.
        const typeCheckFunctions = [
            {
                type: WI.CSSStyleDeclaration.VariablesGroupType.Colors,
                checker: (property) => WI.Color.fromString(property.value),
            },
            {
                type: WI.CSSStyleDeclaration.VariablesGroupType.Dimensions,
                checker: (property) => /^-?\d+(\.\d+)?\D+$/.test(property.value),
            },
            {
                type: WI.CSSStyleDeclaration.VariablesGroupType.Numbers,
                checker: (property) => /^-?\d+(\.\d+)?$/.test(property.value),
            },
            {
                type: WI.CSSStyleDeclaration.VariablesGroupType.Other,
                checker: (property) => true,
            },
        ];

        // Ensure all types have a list. Empty lists are a signal to views to skip rendering.
        for (let {type} of typeCheckFunctions)
            this._variablesForType.set(type, []);

        for (let property of this._properties) {
            if (!property.isVariable)
                continue;

            for (let {type, checker} of typeCheckFunctions) {
                if (checker(property)) {
                    this._variablesForType.get(type).push(property);
                    break;
                }
            }
        }

        return this._variablesForType.get(type);
    }

    update(text, properties, styleSheetTextRange, options = {})
    {
        let dontFireEvents = options.dontFireEvents || false;

        // When two consequent setText calls happen (A and B), only update when the last call (B) is finished.
        //               Front-end:   A B
        //                Back-end:       A B
        // _updatesInProgressCount: 0 1 2 1 0
        //                                  ^
        //                                  update only happens here
        if (this._updatesInProgressCount > 0 && !options.forceUpdate) {
            if (WI.settings.debugEnableStyleEditingDebugMode.value && text !== this._text)
                console.warn("Style modified while editing:", text);

            return;
        }

        // Allow updates from the backend when text matches because `properties` may contain warnings that need to be shown.
        if (this._locked && !options.forceUpdate && text !== this._text)
            return;

        text = text || "";
        properties = properties || [];

        let oldProperties = this._properties || [];
        let oldText = this._text;

        this._text = text;
        this._properties = properties;

        this._styleSheetTextRange = styleSheetTextRange;
        this._propertyNameMap = {};
        this._variablesForType.clear();

        this._enabledProperties = null;
        this._visibleProperties = null;

        let editable = this.editable;

        for (let property of this._properties) {
            property.ownerStyle = this;

            // Store the property in a map if we aren't editable. This
            // allows for quick lookup for computed style. Editable
            // styles don't use the map since they need to account for
            // overridden properties.
            if (!editable)
                this._propertyNameMap[property.name] = property;
            else {
                // Remove from pendingProperties (if it was pending).
                this._pendingProperties.remove(property);
            }
        }

        for (let oldProperty of oldProperties) {
            if (this._properties.includes(oldProperty))
                continue;

            // Clear the index, since it is no longer valid.
            oldProperty.index = NaN;

            // Keep around old properties in pending in case they
            // are needed again during editing.
            if (editable)
                this._pendingProperties.push(oldProperty);
        }

        if (dontFireEvents)
            return;

        // Don't fire the event if text hasn't changed. However, it should still fire for Computed style declarations
        // because it never has text.
        if (oldText === this._text && !this._pendingPropertiesChanged && this._type !== WI.CSSStyleDeclaration.Type.Computed)
            return;

        this._pendingPropertiesChanged = false;

        function delayed()
        {
            this.dispatchEventToListeners(WI.CSSStyleDeclaration.Event.PropertiesChanged);
        }

        // Delay firing the PropertiesChanged event so DOMNodeStyles has a chance to mark overridden and associated properties.
        setTimeout(delayed.bind(this), 0);
    }

    get ownerRule()
    {
        return this._ownerRule;
    }

    set ownerRule(rule)
    {
        this._ownerRule = rule || null;
    }

    get text()
    {
        return this._text;
    }

    set text(text)
    {
        if (this._text === text)
            return;

        let trimmedText = text.trim();
        if (this._text === trimmedText)
            return;

        if (!trimmedText.length || this._type === WI.CSSStyleDeclaration.Type.Inline)
            text = trimmedText;

        this._text = text;
        ++this._updatesInProgressCount;

        let timeoutId = setTimeout(() => {
            console.error("Timed out when setting style text:", text);
            styleTextDidChange();
        }, 2000);

        let styleTextDidChange = () => {
            if (!timeoutId)
                return;

            clearTimeout(timeoutId);
            timeoutId = null;
            this._updatesInProgressCount = Math.max(0, this._updatesInProgressCount - 1);
            this._pendingPropertiesChanged = true;
        };

        this._nodeStyles.changeStyleText(this, text, styleTextDidChange);
    }

    get enabledProperties()
    {
        if (!this._enabledProperties)
            this._enabledProperties = this._properties.filter((property) => property.enabled);

        return this._enabledProperties;
    }

    get properties()
    {
        return this._properties;
    }

    set properties(properties)
    {
        if (properties === this._properties)
            return;

        this._properties = properties;
        this._enabledProperties = null;
        this._visibleProperties = null;
    }

    get visibleProperties()
    {
        if (!this._visibleProperties)
            this._visibleProperties = this._properties.filter((property) => !!property.styleDeclarationTextRange);

        return this._visibleProperties;
    }

    get pendingProperties()
    {
        return this._pendingProperties;
    }

    get styleSheetTextRange()
    {
        return this._styleSheetTextRange;
    }

    get groupings()
    {
        if (this._ownerRule)
            return this._ownerRule.groupings;
        return [];
    }

    get selectorText()
    {
        if (this._ownerRule)
            return this._ownerRule.selectorText;
        return this._node.appropriateSelectorFor(true);
    }

    propertyForName(name)
    {
        console.assert(name);
        if (!name)
            return null;

        if (!this.editable)
            return this._propertyNameMap[name] || null;

        // Editable styles don't use the map since they need to
        // account for overridden properties.

        let bestMatchProperty = null;
        for (let property of this.enabledProperties) {
            if (property.canonicalName !== name && property.name !== name)
                continue;
            if (bestMatchProperty && !bestMatchProperty.overridden && property.overridden)
                continue;
            bestMatchProperty = property;
        }

        return bestMatchProperty;
    }

    resolveVariableValue(text)
    {
        const invalid = Symbol("invalid");

        let checkTokens = (tokens) => {
            let startIndex = NaN;
            let openParenthesis = 0;
            for (let i = 0; i < tokens.length; i++) {
                let token = tokens[i];
                if (token.value === "var" && token.type && token.type.includes("atom")) {
                    if (isNaN(startIndex)) {
                        startIndex = i;
                        openParenthesis = 0;
                    }
                    continue;
                }

                if (isNaN(startIndex))
                    continue;

                if (token.value === "(") {
                    ++openParenthesis;
                    continue;
                }

                if (token.value === ")") {
                    --openParenthesis;
                    if (openParenthesis > 0)
                        continue;

                    let variableTokens = tokens.slice(startIndex, i + 1);
                    startIndex = NaN;

                    let variableNameIndex = variableTokens.findIndex((token) => WI.CSSProperty.isVariable(token.value) && /\bvariable-2\b/.test(token.type));
                    if (variableNameIndex === -1)
                        continue;

                    let variableProperty = this.propertyForName(variableTokens[variableNameIndex].value);
                    if (variableProperty)
                        return variableProperty.value.trim();

                    let fallbackStartIndex = variableTokens.findIndex((value, j) => j > variableNameIndex + 1 && /\bm-css\b/.test(value.type));
                    if (fallbackStartIndex === -1)
                        return invalid;

                    let fallbackTokens = variableTokens.slice(fallbackStartIndex, i);
                    return checkTokens(fallbackTokens) || fallbackTokens.reduce((accumulator, token) => accumulator + token.value, "").trim();
                }
            }
            return null;
        };

        let resolved = checkTokens(WI.tokenizeCSSValue(text));
        return resolved === invalid ? null : resolved;
    }

    newBlankProperty(propertyIndex)
    {
        let text, name, value, priority, overridden, implicit, anonymous;
        let enabled = true;
        let valid = false;
        let styleSheetTextRange = this._rangeAfterPropertyAtIndex(propertyIndex - 1);

        this.markModified();
        let property = new WI.CSSProperty(propertyIndex, text, name, value, priority, enabled, overridden, implicit, anonymous, valid, styleSheetTextRange);
        property.isNewProperty = true;
        this.insertProperty(property, propertyIndex);
        this.update(this._text, this._properties, this._styleSheetTextRange, {dontFireEvents: true, forceUpdate: true});

        return property;
    }

    markModified()
    {
        if (!this._initialState) {
            let visibleProperties = this.visibleProperties.map((property) => {
                return property.clone();
            });

            this._initialState = new WI.CSSStyleDeclaration(
                this._nodeStyles,
                this._ownerStyleSheet,
                this._id,
                this._type,
                this._node,
                this._inherited,
                this._text,
                visibleProperties,
                this._styleSheetTextRange);
        }

        WI.cssManager.addModifiedStyle(this);
    }

    insertProperty(cssProperty, propertyIndex)
    {
        this._properties.insertAtIndex(cssProperty, propertyIndex);
        for (let index = propertyIndex + 1; index < this._properties.length; index++)
            this._properties[index].index = index;

        // Invalidate cached properties.
        this._enabledProperties = null;
        this._visibleProperties = null;
    }

    removeProperty(cssProperty)
    {
        // cssProperty.index could be set to NaN by WI.CSSStyleDeclaration.prototype.update.
        let realIndex = this._properties.indexOf(cssProperty);
        if (realIndex === -1)
            return;

        this._properties.splice(realIndex, 1);

        // Invalidate cached properties.
        this._enabledProperties = null;
        this._visibleProperties = null;
    }

    updatePropertiesModifiedState()
    {
        if (!this._initialState)
            return;

        if (this._type === WI.CSSStyleDeclaration.Type.Computed)
            return;

        let initialCSSProperties = this._initialState.visibleProperties;
        let cssProperties = this.visibleProperties;

        let hasModified = false;

        function onEach(cssProperty, action) {
            if (action !== 0)
                hasModified = true;

            cssProperty.modified = action === 1;
        }

        function comparator(a, b) {
            return a.equals(b);
        }

        Array.diffArrays(initialCSSProperties, cssProperties, onEach, comparator);

        if (!hasModified)
            WI.cssManager.removeModifiedStyle(this);
    }

    generateFormattedText(options = {})
    {
        let indentString = WI.indentString();
        let styleText = "";
        let groupings = this.groupings.filter((grouping) => !grouping.isMedia || grouping.text !== "all");
        let groupingsCount = groupings.length;

        if (options.includeGroupingsAndSelectors) {
            for (let i = groupingsCount - 1; i >= 0; --i) {
                if (options.multiline)
                    styleText += indentString.repeat(groupingsCount - i - 1);

                let prefix = groupings[i].prefix;
                if (prefix)
                    styleText += prefix;

                if (groupings[i].text)
                    styleText += " " + groupings[i].text;
                styleText += " {";

                if (options.multiline)
                    styleText += "\n";
            }

            if (options.multiline)
                styleText += indentString.repeat(groupingsCount);

            styleText += this.selectorText + " {";
        }

        let properties = this._styleSheetTextRange ? this.visibleProperties : this._properties;
        if (properties.length) {
            if (options.multiline) {
                let propertyIndent = indentString.repeat(groupingsCount + 1);
                for (let property of properties)
                    styleText += "\n" + propertyIndent + property.formattedText;

                styleText += "\n";
                if (!options.includeGroupingsAndSelectors) {
                    // Indent the closing "}" for nested rules.
                    styleText += indentString.repeat(groupingsCount);
                }
            } else
                styleText += properties.map((property) => property.formattedText).join(" ");
        }

        if (options.includeGroupingsAndSelectors) {
            for (let i = groupingsCount; i > 0; --i) {
                if (options.multiline)
                    styleText += indentString.repeat(i);

                styleText += "}";

                if (options.multiline)
                    styleText += "\n";
            }

            styleText += "}";
        }

        return styleText;
    }

    // Protected

    get nodeStyles()
    {
        return this._nodeStyles;
    }

    // Private

    _rangeAfterPropertyAtIndex(index)
    {
        if (index < 0)
            return this._styleSheetTextRange.collapseToStart();

        if (index >= this.visibleProperties.length)
            return this._styleSheetTextRange.collapseToEnd();

        let property = this.visibleProperties[index];
        return property.styleSheetTextRange.collapseToEnd();
    }
};

WI.CSSStyleDeclaration.Event = {
    PropertiesChanged: "css-style-declaration-properties-changed",
};

WI.CSSStyleDeclaration.Type = {
    Rule: "css-style-declaration-type-rule",
    Inline: "css-style-declaration-type-inline",
    Attribute: "css-style-declaration-type-attribute",
    Computed: "css-style-declaration-type-computed"
};

WI.CSSStyleDeclaration.VariablesGroupType = {
    Ungrouped: "ungrouped",
    Colors: "colors",
    Dimensions: "dimensions",
    Numbers: "numbers",
    Other: "other",
};
