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

WI.CSSProperty = class CSSProperty extends WI.Object
{
    constructor(index, text, name, value, priority, enabled, overridden, implicit, anonymous, valid, styleSheetTextRange)
    {
        WI.CSSProperty._initializePropertyNameCounts();

        super();

        this._ownerStyle = null;
        this._index = index;
        this._overridingProperty = null;
        this._initialState = null;
        this._modified = false;
        this._isUpdatingText = false;
        this._isNewProperty = false;

        this.update(text, name, value, priority, enabled, overridden, implicit, anonymous, valid, styleSheetTextRange, true);
    }

    // Static

    static isVariable(name)
    {
        return name.startsWith("--") && name.length > 2;
    }

    static isInheritedPropertyName(name)
    {
        console.assert(typeof name === "string");
        if (WI.CSSKeywordCompletions.InheritedProperties.has(name))
            return true;
        return WI.CSSProperty.isVariable(name);
    }

    // FIXME: <https://webkit.org/b/226647> This naively collects variable-like names used in values. It should be hardened.
    static findVariableNames(string)
    {
        const prefix = "var(--";
        let prefixCursor = 0;
        let cursor = 0;
        let nameStartIndex = 0;
        let names = [];

        function isTerminatingChar(char) {
            return char === ")" || char === "," || char === " " || char === "\n" || char === "\t";
        }

        while (cursor < string.length) {
            if (nameStartIndex && isTerminatingChar(string.charAt(cursor))) {
                names.push("--" + string.substring(nameStartIndex, cursor));
                nameStartIndex = 0;
            }

            if (prefixCursor === prefix.length) {
                prefixCursor = 0;
                nameStartIndex = cursor;
            }

            if (string.charAt(cursor) === prefix.charAt(prefixCursor))
                prefixCursor++;

            cursor++;
        }

        return names;
    }

    static sortPreferringNonPrefixed(a, b)
    {
        let aIsPrefixed = a[0] === "-" && a[1] !== "-";
        let bIsPrefixed = b[0] === "-" && b[1] !== "-";
        if (!aIsPrefixed && bIsPrefixed)
            return -1;
        if (aIsPrefixed && !bIsPrefixed)
            return 1;

        return a.extendedLocaleCompare(b);
    }

    static sortByPropertyNameUsageCount(propertyNameA, propertyNameB)
    {
        let countA = WI.CSSProperty._cachedNameCounts[propertyNameA];
        let countB = WI.CSSProperty._cachedNameCounts[propertyNameB];

        const minimumCount = 100;
        let validA = countA >= minimumCount;
        let validB = countB >= minimumCount;

        if (validA && !validB)
            return -1;
        if (!validA && validB)
            return 1;

        if (validA && validB) {
            if (countA !== countB)
                return countB - countA;

            let canonicalPropertyNameA = WI.cssManager.canonicalNameForPropertyName(propertyNameA);
            let canonicalPropertyNameB = WI.cssManager.canonicalNameForPropertyName(propertyNameB);
            if (canonicalPropertyNameA !== propertyNameA || canonicalPropertyNameB !== propertyNameB)
                return WI.CSSProperty.sortByPropertyNameUsageCount(canonicalPropertyNameA, canonicalPropertyNameB);
        }

        return 0;
    }

    static indexOfCompletionForMostUsedPropertyName(completions)
    {
        let highestRankCompletions = completions;
        if (highestRankCompletions.every((completion) => completion instanceof WI.QueryResult)) {
            let highestRankValue = -1;
            for (let completion of completions) {
                if (completion.rank > highestRankValue) {
                    highestRankValue = completion.rank;
                    highestRankCompletions = [];
                }

                if (completion.rank === highestRankValue)
                    highestRankCompletions.push(completion);
            }
        }
        let mostUsedHighestRankCompletion = highestRankCompletions.min((a, b) => WI.CSSProperty.sortByPropertyNameUsageCount(WI.CSSCompletions.getCompletionText(a), WI.CSSCompletions.getCompletionText(b)));
        return completions.indexOf(mostUsedHighestRankCompletion);
    }

    static _initializePropertyNameCounts()
    {
        if (WI.CSSProperty._cachedNameCounts)
            return;

        WI.CSSProperty._cachedNameCounts = {};

        WI.CSSProperty._storedNameCountsQueue = new Promise((resolve, reject) => {
            WI.objectStores.cssPropertyNameCounts.getAllKeys().then((propertyNames) => {
                Promise.allSettled(propertyNames.map(async (propertyName) => {
                    let storedCount = await WI.objectStores.cssPropertyNameCounts.get(propertyName);

                    WI.CSSProperty._cachedNameCounts[propertyName] = (WI.CSSProperty._cachedNameCounts[propertyName] || 0) + storedCount;
                }))
                .then(resolve, reject);
            });
        });
    }

    // Public

    get ownerStyle()
    {
        return this._ownerStyle;
    }

    set ownerStyle(ownerStyle)
    {
        this._ownerStyle = ownerStyle || null;
    }

    get index()
    {
        return this._index;
    }

    set index(index)
    {
        this._index = index;
    }

    update(text, name, value, priority, enabled, overridden, implicit, anonymous, valid, styleSheetTextRange, dontFireEvents)
    {
        // Locked CSSProperty can still be updated from the back-end when the text matches.
        // We need to do this to keep attributes such as valid and overridden up to date.
        if (this._ownerStyle && this._ownerStyle.locked && text !== this._text)
            return;

        text = text || "";
        name = name || "";
        value = value || "";
        priority = priority || "";
        enabled = enabled || false;
        overridden = overridden || false;
        implicit = implicit || false;
        anonymous = anonymous || false;
        valid = valid || false;

        var changed = false;

        if (!dontFireEvents) {
            changed = this._name !== name || this._rawValue !== value || this._priority !== priority ||
                this._enabled !== enabled || this._implicit !== implicit || this._anonymous !== anonymous || this._valid !== valid;
        }

        // Use the setter for overridden if we want to fire events since the
        // OverriddenStatusChanged event coalesces changes before it fires.
        if (!dontFireEvents)
            this.overridden = overridden;
        else
            this._overridden = overridden;

        if (!overridden)
            this._overridingProperty = null;

        this._text = text;
        this._rawValue = value;
        this._value = undefined;
        this._priority = priority;
        this._enabled = enabled;
        this._implicit = implicit;
        this._anonymous = anonymous;
        this._inherited = WI.CSSProperty.isInheritedPropertyName(name);
        this._valid = valid;
        this._isVariable = WI.CSSProperty.isVariable(name);
        this._styleSheetTextRange = styleSheetTextRange || null;

        this._rawValueNewlineIndent = "";
        if (this._rawValue) {
            let match = this._rawValue.match(/^[^\n]+\n(\s*)/);
            if (match)
                this._rawValueNewlineIndent = match[1];
        }
        this._rawValue = this._rawValue.replace(/\n\s+/g, "\n");

        this._isShorthand = undefined;
        this._shorthandPropertyNames = undefined;

        this._updateName(name);
        this._relatedShorthandProperty = null;
        this._relatedLonghandProperties = [];

        // Clear computed properties.
        delete this._styleDeclarationTextRange;
        delete this._canonicalName;
        delete this._hasOtherVendorNameOrKeyword;

        if (changed)
            this.dispatchEventToListeners(WI.CSSProperty.Event.Changed);
    }

    remove()
    {
        this._markModified();

        // Setting name or value to an empty string removes the entire CSSProperty.
        this._updateName("");
        const forceRemove = true;
        this._updateStyleText(forceRemove);
    }

    commentOut(disabled)
    {
        console.assert(this.editable);
        if (this._enabled === !disabled)
            return;

        this._markModified();
        this._enabled = !disabled;

        if (disabled)
            this.text = "/* " + this._text + " */";
        else
            this.text = this._text.slice(2, -2).trim();
    }

    get text()
    {
        return this._text;
    }

    set text(newText)
    {
        newText = newText.trim();
        if (this._text === newText)
            return;

        this._markModified();
        this._text = newText;
        this._isUpdatingText = true;
        this._updateOwnerStyleText();
        this._isUpdatingText = false;
    }

    get formattedText()
    {
        if (this._isUpdatingText)
            return this._text;

        if (!this._name)
            return "";

        let text = `${this._name}: ${this._rawValue};`;
        if (!this._enabled)
            text = "/* " + text + " */";
        return text;
    }

    get modified()
    {
        return this._modified;
    }

    set modified(value)
    {
        if (this._modified === value)
            return;

        this._modified = value;
        this.dispatchEventToListeners(WI.CSSProperty.Event.ModifiedChanged);
    }

    get name()
    {
        return this._name;
    }

    set name(name)
    {
        if (name === this._name)
            return;

        if (!name) {
            // Deleting property name causes CSSProperty to be detached from CSSStyleDeclaration.
            console.assert(!isNaN(this._index), this);
            this._indexBeforeDetached = this._index;
        } else if (!isNaN(this._indexBeforeDetached) && isNaN(this._index)) {
            // Reattach CSSProperty.
            console.assert(!this._ownerStyle.properties.includes(this), this);
            this._ownerStyle.insertProperty(this, this._indexBeforeDetached);
            this._indexBeforeDetached = NaN;
        }

        this._markModified();
        this._updateName(name);
        this._updateStyleText();
    }

    get canonicalName()
    {
        if (this._canonicalName)
            return this._canonicalName;

        this._canonicalName = WI.cssManager.canonicalNameForPropertyName(this.name);

        return this._canonicalName;
    }

    // FIXME: Remove current value getter and rename rawValue to value once the old styles sidebar is removed.
    get value()
    {
        if (!this._value)
            this._value = this._rawValue.replace(/\s*!important\s*$/, "");

        return this._value;
    }

    get rawValue()
    {
        return this._rawValue;
    }

    set rawValue(value)
    {
        if (value === this._rawValue)
            return;

        this._markModified();

        let suffix = WI.CSSCompletions.completeUnbalancedValue(value);
        if (suffix)
            value += suffix;

        this._rawValue = value;
        this._value = undefined;
        this._updateStyleText();
    }

    get important()
    {
        return this.priority === "important";
    }

    get priority() { return this._priority; }

    get attached()
    {
        return this._enabled && this._ownerStyle && (!isNaN(this._index) || this._ownerStyle.type === WI.CSSStyleDeclaration.Type.Computed);
    }

    // Only commented out properties are disabled.
    get enabled() { return this._enabled; }

    get overridden() { return this._overridden; }
    set overridden(overridden)
    {
        overridden = overridden || false;

        if (this._overridden === overridden)
            return;

        if (!overridden)
            this._overridingProperty = null;

        var previousOverridden = this._overridden;

        this._overridden = overridden;

        if (this._overriddenStatusChangedTimeout)
            return;

        function delayed()
        {
            delete this._overriddenStatusChangedTimeout;

            if (this._overridden === previousOverridden)
                return;

            this.dispatchEventToListeners(WI.CSSProperty.Event.OverriddenStatusChanged);
        }

        this._overriddenStatusChangedTimeout = setTimeout(delayed.bind(this), 0);
    }

    get overridingProperty()
    {
        console.assert(this._overridden);
        return this._overridingProperty;
    }

    set overridingProperty(effectiveProperty)
    {
        if (!WI.settings.experimentalEnableStylesJumpToEffective.value)
            return;

        console.assert(this !== effectiveProperty, `Property "${this.formattedText}" can't override itself.`, this);
        this._overridingProperty = effectiveProperty || null;
    }

    get implicit() { return this._implicit; }
    set implicit(implicit) { this._implicit = implicit; }

    get anonymous() { return this._anonymous; }
    get inherited() { return this._inherited; }
    get valid() { return this._valid; }
    get isVariable() { return this._isVariable; }
    get styleSheetTextRange() { return this._styleSheetTextRange; }

    get initialState()
    {
        return this._initialState;
    }

    get editable()
    {
        return !!(this._styleSheetTextRange && this._ownerStyle && this._ownerStyle.styleSheetTextRange);
    }

    get styleDeclarationTextRange()
    {
        if ("_styleDeclarationTextRange" in this)
            return this._styleDeclarationTextRange;

        if (!this._ownerStyle || !this._styleSheetTextRange)
            return null;

        var styleTextRange = this._ownerStyle.styleSheetTextRange;
        if (!styleTextRange)
            return null;

        var startLine = this._styleSheetTextRange.startLine - styleTextRange.startLine;
        var endLine = this._styleSheetTextRange.endLine - styleTextRange.startLine;

        var startColumn = this._styleSheetTextRange.startColumn;
        if (!startLine)
            startColumn -= styleTextRange.startColumn;

        var endColumn = this._styleSheetTextRange.endColumn;
        if (!endLine)
            endColumn -= styleTextRange.startColumn;

        this._styleDeclarationTextRange = new WI.TextRange(startLine, startColumn, endLine, endColumn);

        return this._styleDeclarationTextRange;
    }

    get relatedShorthandProperty() { return this._relatedShorthandProperty; }
    set relatedShorthandProperty(property)
    {
        this._relatedShorthandProperty = property || null;
    }

    get relatedLonghandProperties() { return this._relatedLonghandProperties; }

    addRelatedLonghandProperty(property)
    {
        this._relatedLonghandProperties.push(property);
    }

    clearRelatedLonghandProperties(property)
    {
        this._relatedLonghandProperties = [];
    }

    get isShorthand()
    {
        if (this._isShorthand === undefined) {
            this._isShorthand = WI.CSSKeywordCompletions.LonghandNamesForShorthandProperty.has(this._name);
            if (this._isShorthand) {
                let longhands = WI.CSSKeywordCompletions.LonghandNamesForShorthandProperty.get(this._name);
                if (longhands && longhands.length === 1)
                    this._isShorthand = false;
            }
        }
        return this._isShorthand;
    }

    get shorthandPropertyNames()
    {
        if (!this._shorthandPropertyNames) {
            this._shorthandPropertyNames = WI.CSSKeywordCompletions.ShorthandNamesForLongHandProperty.get(this._name) || [];
            this._shorthandPropertyNames.remove("all");
        }
        return this._shorthandPropertyNames;
    }

    get isNewProperty() { return this._isNewProperty; }
    set isNewProperty(value) { this._isNewProperty = value; }

    hasOtherVendorNameOrKeyword()
    {
        if ("_hasOtherVendorNameOrKeyword" in this)
            return this._hasOtherVendorNameOrKeyword;

        this._hasOtherVendorNameOrKeyword = WI.cssManager.propertyNameHasOtherVendorPrefix(this.name) || WI.cssManager.propertyValueHasOtherVendorKeyword(this.value);

        return this._hasOtherVendorNameOrKeyword;
    }

    equals(property)
    {
        if (property === this)
            return true;

        if (!property)
            return false;

        return this._name === property.name && this._rawValue === property.rawValue && this._enabled === property.enabled;
    }

    clone()
    {
        let cssProperty = new WI.CSSProperty(
            this._index,
            this._text,
            this._name,
            this._rawValue,
            this._priority,
            this._enabled,
            this._overridden,
            this._implicit,
            this._anonymous,
            this._valid,
            this._styleSheetTextRange);

        cssProperty.ownerStyle = this._ownerStyle;

        return cssProperty;
    }

    // Private

    _updateName(name)
    {
        if (name === this._name)
            return;

        let changeCount = (propertyName, delta) => {
            if (this._implicit || this._anonymous || !this._enabled)
                return;

            if (!propertyName || WI.CSSProperty.isVariable(propertyName))
                return;

            let cachedCount = WI.CSSProperty._cachedNameCounts[propertyName];

            // Allow property counts to be updated if the property name has already been counted before.
            // This can happen when inspecting a device that has different CSS properties enabled.
            if (isNaN(cachedCount) && !WI.cssManager.propertyNameCompletions.isValidPropertyName(propertyName))
                return;

            console.assert(delta > 0 || cachedCount >= delta, cachedCount, delta);
            WI.CSSProperty._cachedNameCounts[propertyName] = Math.max(0, (cachedCount || 0) + delta);

            WI.CSSProperty._storedNameCountsQueue = WI.CSSProperty._storedNameCountsQueue.finally(async () => {
                let storedCount = await WI.objectStores.cssPropertyNameCounts.get(propertyName);

                console.assert(delta > 0 || storedCount >= delta, storedCount, delta);
                await WI.objectStores.cssPropertyNameCounts.put(Math.max(0, (storedCount || 0) + delta), propertyName);
            });

            if (propertyName !== this.canonicalName)
                changeCount(this.canonicalName, delta);
        };

        changeCount(this._name, -1);
        this._name = name;
        changeCount(this._name, 1);
    }

    _updateStyleText(forceRemove = false)
    {
        let text = "";

        if (this._name && this._rawValue) {
            let value = this._rawValue.replace(/\n/g, "\n" + this._rawValueNewlineIndent);
            text = this._name + ": " + value + ";";
        }

        this._text = text;

        if (forceRemove)
            this._ownerStyle.removeProperty(this);

        this._updateOwnerStyleText();
    }

    _updateOwnerStyleText()
    {
        console.assert(this._ownerStyle);
        if (!this._ownerStyle)
            return;

        this._ownerStyle.text = this._ownerStyle.generateFormattedText({multiline: this._ownerStyle.type === WI.CSSStyleDeclaration.Type.Rule});
        this._ownerStyle.updatePropertiesModifiedState();
    }

    _markModified()
    {
        if (this._ownerStyle)
            this._ownerStyle.markModified();
    }
};

WI.CSSProperty._cachedNameCounts = null;
WI.CSSProperty._storedNameCountsQueue = null;

WI.CSSProperty.Event = {
    Changed: "css-property-changed",
    ModifiedChanged: "css-property-modified-changed",
    OverriddenStatusChanged: "css-property-overridden-status-changed"
};
