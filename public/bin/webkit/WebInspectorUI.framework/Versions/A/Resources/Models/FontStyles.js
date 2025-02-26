/*
 * Copyright (C) 2023 Apple Inc. All rights reserved.
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

WI.FontStyles = class FontStyles
{
    constructor(nodeStyles)
    {
        this._nodeStyles = nodeStyles;

        this._featuresMap = new Map;
        this._variationsMap = new Map;
        this._propertiesMap = new Map;

        this._authoredFontVariationSettingsMap = new Map;
        this._effectiveWritablePropertyForNameMap = new Map;

        // A change in the number of axes or their tags is considered a significant change.
        // A change to the value of a known axis is not considered a significant change.
        this._significantChangeSinceLastRefresh = true;

        this._variationAxesTags = [];
        this._registeredAxesTags = [];

        const forceSignificantChange = true;
        this.refresh(forceSignificantChange);
    }

    // Public

    get featuresMap() { return this._featuresMap; }

    get variationsMap() { return this._variationsMap; }

    get propertiesMap() { return this._propertiesMap; }

    get significantChangeSinceLastRefresh() { return this._significantChangeSinceLastRefresh; }

    // Static

    static fontPropertyForAxisTag(tag) {
        const tagToPropertyMap = {
            "wght": "font-weight",
            "wdth": "font-stretch",
            "slnt": "font-style",
            "ital": "font-style",
        }

        return tagToPropertyMap[tag];
    }

    static axisValueToFontPropertyValue(tag, value)
    {
        switch (tag) {
        case "wdth":
            return `${value}%`;
        case "slnt":
            return `oblique ${value}deg`;
        case "ital":
            return value >= 1 ? "italic" : "normal";
        default:
            return String(value);
        }
    }

    static fontPropertyValueToAxisValue(tag, value)
    {
        switch (tag) {
        case "wdth":
            return parseFloat(value);
        case "ital":
        case "slnt":
            // See: https://w3c.github.io/csswg-drafts/css-fonts/#valdef-font-style-oblique-angle--90deg-90deg
            const obliqueAngleDefaultValue = 14;

            if (value === "normal")
                return 0;

            if (tag === "ital" && (value === "oblique" || value === "italic"))
                return 1;

            if (tag === "slnt" && (value === "oblique" || value === "italic"))
                return obliqueAngleDefaultValue;

            let degrees = value.match(/oblique (?<degrees>-?\d+(\.\d+)?)deg/)?.groups?.degrees;
            if (degrees && tag === "ital")
                return parseFloat(degrees) >= obliqueAngleDefaultValue ? 1 : 0; // The `ital` variation axis acts as an on/off toggle (0 = off, 1 = on).

            if (degrees && tag === "slnt")
                return parseFloat(degrees);

            console.assert(false, `Unexpected font property value associated with variation axis ${tag}`, value);
        break;
        default:
            return parseFloat(value);
        }
    }

    // Public

    writeFontVariation(tag, value)
    {
        let targetPropertyName = WI.FontStyles.fontPropertyForAxisTag(tag);
        let targetPropertyValue;
        if (targetPropertyName && !this._authoredFontVariationSettingsMap.has(tag))
            targetPropertyValue = WI.FontStyles.axisValueToFontPropertyValue(tag, value);
        else {
            this._authoredFontVariationSettingsMap.set(tag, value);
            let axes = [];
            for (let [tag, value] of this._authoredFontVariationSettingsMap) {
                axes.push(`"${tag}" ${value}`);
            }

            targetPropertyName = "font-variation-settings";
            targetPropertyValue = axes.join(", ");
        }

        const createIfMissing = true;
        let cssProperty = this._effectiveWritablePropertyForName(targetPropertyName, createIfMissing);

        if (this._propertiesMap.get(targetPropertyName)?.isImportant)
            targetPropertyValue += " !important";

        cssProperty.rawValue = targetPropertyValue;
    }

    refresh(forceSignificantChange)
    {
        this._effectiveWritablePropertyForNameMap.clear();

        let prevVariationAxisTags = this._variationAxesTags.slice();
        let prevRegisteredAxisTags = this._registeredAxesTags.slice();
        this._variationAxesTags = [];
        this._registeredAxesTags = [];

        this._calculateFontProperties();

        if (forceSignificantChange)
            this._significantChangeSinceLastRefresh = true;
        else
            this._significantChangeSinceLastRefresh = !Array.shallowEqual(prevRegisteredAxisTags, this._registeredAxesTags) || !Array.shallowEqual(prevVariationAxisTags, this._variationAxesTags);
    }

    // Private

    _calculateFontProperties()
    {
        this._featuresMap = this._calculateFontFeatureAxes(this._nodeStyles);
        this._variationsMap = this._calculateFontVariationAxes(this._nodeStyles);
        this._propertiesMap = this._calculateProperties({domNodeStyle: this._nodeStyles, featuresMap: this._featuresMap, variationsMap: this._variationsMap});
    }

    _calculateProperties(style)
    {
        let resultProperties = new Map;

        this._populateProperty("font-size", style, resultProperties, {
            keywordComputedReplacements: ["larger", "smaller", "xx-small", "x-small", "small", "medium", "large", "x-large", "xx-large", "xxx-large"],
        });
        this._populateProperty("font-style", style, resultProperties, {
            variations: ["ital", "slnt"],
            keywordReplacements: new Map([
                ["oblique", "oblique 14deg"],
            ]),
        });
        this._populateProperty("font-weight", style, resultProperties, {
            variations: ["wght"],
            keywordComputedReplacements: ["bolder", "lighter"],
            keywordReplacements: new Map([
                ["normal", "400"],
                ["bold", "700"],
            ]),
        });
        this._populateProperty("font-stretch", style, resultProperties, {
            variations: ["wdth"],
            keywordReplacements: new Map([
                ["ultra-condensed", "50%"],
                ["extra-condensed", "62.5%"],
                ["condensed", "75%"],
                ["semi-condensed", "87.5%"],
                ["normal", "100%"],
                ["semi-expanded", "112.5%"],
                ["expanded", "125%"],
                ["extra-expanded", "150%"],
                ["ultra-expanded", "200%"],
            ]),
        });

        this._populateProperty("font-variant-ligatures", style, resultProperties, {features: ["liga", "clig", "dlig", "hlig", "calt"]});
        this._populateProperty("font-variant-position", style, resultProperties, {features: ["subs", "sups"]});
        this._populateProperty("font-variant-caps", style, resultProperties, {features: ["smcp", "c2sc", "pcap", "c2pc", "unic", "titl"]});
        this._populateProperty("font-variant-numeric", style, resultProperties, {features: ["lnum", "onum", "pnum", "tnum", "frac", "afrc", "ordn", "zero"]});
        this._populateProperty("font-variant-alternates", style, resultProperties, {features: ["hist"] });
        this._populateProperty("font-variant-east-asian", style, resultProperties, {features: ["jp78", "jp83", "jp90", "jp04", "smpl", "trad", "fwid", "pwid", "ruby"]});

        return resultProperties;
    }

    _calculateFontFeatureAxes(domNodeStyle)
    {
        return this._parseFontFeatureOrVariationSettings(domNodeStyle, "font-feature-settings");
    }

    _calculateFontVariationAxes(domNodeStyle)
    {
        this._authoredFontVariationSettingsMap = this._parseFontFeatureOrVariationSettings(domNodeStyle, "font-variation-settings");
        let resultAxes = new Map;

        if (!this._nodeStyles.computedPrimaryFont)
            return resultAxes;

        for (let axis of this._nodeStyles.computedPrimaryFont.variationAxes) {
            // `value` can be undefined.
            resultAxes.set(axis.tag, {
                tag: axis.tag,
                name: axis.name,
                minimumValue: axis.minimumValue,
                maximumValue: axis.maximumValue,
                defaultValue: axis.defaultValue,
                value: this._authoredFontVariationSettingsMap.get(axis.tag),
            });

            this._variationAxesTags.push(axis.tag);
        }

        return resultAxes;
    }

    _parseFontFeatureOrVariationSettings(domNodeStyle, property)
    {
        let cssSettings = new Map;
        let cssSettingsRawValue = this._computedPropertyValueForName(domNodeStyle, property);

        if (cssSettingsRawValue !== "normal") {
            for (let axis of cssSettingsRawValue.split(",")) {
                // Tags can contains upper and lowercase latin letters, numbers, and spaces (only ending with space(s)). Values will be numbers, `on`, or `off`.
                let [tag, value] = axis.match(WI.FontStyles.SettingPattern);
                tag = tag.replaceAll(/["']/g, "");
                if (!value || value === "on")
                    value = 1;
                else if (value === "off")
                    value = 0;
                cssSettings.set(tag, parseFloat(value));
            }
        }

        return cssSettings;
    }

    _populateProperty(name, style, resultProperties, {variations, features, keywordComputedReplacements, keywordReplacements})
    {
        resultProperties.set(name, this._computeProperty(name, style, {variations, features, keywordComputedReplacements, keywordReplacements}));
    }

    _computeProperty(name, style, {variations, features, keywordComputedReplacements, keywordReplacements})
    {
        variations ??= [];
        features ??= [];
        keywordComputedReplacements ??= [];
        keywordReplacements ??= new Map;

        let resultProperty = {};

        let effectivePropertyForName = style.domNodeStyle.effectivePropertyForName(name);
        let value = effectivePropertyForName?.value || "";

        if (!value || value === "inherit" || keywordComputedReplacements.includes(value))
            value = this._computedPropertyValueForName(style.domNodeStyle, name);

        if (keywordReplacements.has(value))
            value = keywordReplacements.get(value);

        resultProperty.value = value;

        for (let fontVariationTag of variations) {
            let fontVariationAxis = style.variationsMap.get(fontVariationTag);
            if (fontVariationAxis) {
                resultProperty.variations ??= new Map;
                resultProperty.variations.set(fontVariationTag, fontVariationAxis);

                // Remove the tag so it is not presented twice.
                style.variationsMap.delete(fontVariationTag);

                this._registeredAxesTags.push(fontVariationTag);
            }
        }

        for (let fontFeatureSetting of features) {
            let featureSettingValue = style.featuresMap.get(fontFeatureSetting);
            if (featureSettingValue || featureSettingValue === 0) {
                resultProperty.features ??= new Map;
                resultProperty.features.set(fontFeatureSetting, featureSettingValue);

                // Remove the tag so it is not presented twice.
                style.featuresMap.delete(fontFeatureSetting);
            }
        }

        resultProperty.isImportant = effectivePropertyForName?.important ?? false;

        return resultProperty;
    }

    _effectiveWritablePropertyForName(name, createIfMissing)
    {
        let cssProperty = this._effectiveWritablePropertyForNameMap.get(name);
        if (cssProperty)
            return cssProperty;

        // FIXME: <webkit.org/b/250127> Value for edited variation axis should be written to ideal CSS rule in cascade
        let inlineCSSStyleDeclaration = this._nodeStyles.inlineStyle;
        let properties = inlineCSSStyleDeclaration.visibleProperties;

        cssProperty = properties.find(property => property.name === name);
        if (!cssProperty && createIfMissing) {
            cssProperty = inlineCSSStyleDeclaration.newBlankProperty(properties.length);
            cssProperty.name = name;
        }

        if (cssProperty)
            this._effectiveWritablePropertyForNameMap.set(name, cssProperty);

        return cssProperty;
    }

    _computedPropertyValueForName(domNodeStyle, name)
    {
        return domNodeStyle.computedStyle?.propertyForName(name)?.value || "";
    }
};

WI.FontStyles.SettingPattern = /[^\s"']+|["']([^"']*)["']/g;
