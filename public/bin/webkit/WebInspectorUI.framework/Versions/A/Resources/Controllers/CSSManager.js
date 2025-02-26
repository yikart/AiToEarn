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

// FIXME: CSSManager lacks advanced multi-target support. (Stylesheets per-target)

WI.CSSManager = class CSSManager extends WI.Object
{
    constructor()
    {
        super();

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        WI.Frame.addEventListener(WI.Frame.Event.ResourceWasAdded, this._resourceAdded, this);
        WI.Resource.addEventListener(WI.SourceCode.Event.ContentDidChange, this._resourceContentDidChange, this);
        WI.Resource.addEventListener(WI.Resource.Event.TypeDidChange, this._resourceTypeDidChange, this);

        WI.DOMNode.addEventListener(WI.DOMNode.Event.AttributeModified, this._nodeAttributesDidChange, this);
        WI.DOMNode.addEventListener(WI.DOMNode.Event.AttributeRemoved, this._nodeAttributesDidChange, this);
        WI.DOMNode.addEventListener(WI.DOMNode.Event.EnabledPseudoClassesChanged, this._nodePseudoClassesDidChange, this);

        this._colorFormatSetting = new WI.Setting("default-color-format", WI.Color.Format.Original);

        this._styleSheetIdentifierMap = new Map;
        this._styleSheetFrameURLMap = new Map;
        this._nodeStylesMap = {};
        this._modifiedStyles = new Map;
        this._defaultUserPreferences = new Map;
        this._overriddenUserPreferences = new Map;
        this._propertyNameCompletions = null;
    }

    // Target

    initializeTarget(target)
    {
        if (target.hasDomain("CSS"))
            target.CSSAgent.enable();
    }

    initializeCSSPropertyNameCompletions(target)
    {
        console.assert(target.hasDomain("CSS"));

        if (this._propertyNameCompletions)
            return;

        target.CSSAgent.getSupportedCSSProperties((error, cssProperties) => {
            if (error)
                return;

            this._propertyNameCompletions = new WI.CSSPropertyNameCompletions(cssProperties);

            WI.CSSKeywordCompletions.addCustomCompletions(cssProperties);

            // CodeMirror is not included by tests so we shouldn't assume it always exists.
            // If it isn't available we skip MIME type associations.
            if (!window.CodeMirror)
                return;

            let propertyNamesForCodeMirror = {};
            let valueKeywordsForCodeMirror = {"inherit": true, "initial": true, "unset": true, "revert": true, "revert-layer": true, "var": true, "env": true};
            let colorKeywordsForCodeMirror = {};

            function nameForCodeMirror(name) {
                // CodeMirror parses the vendor prefix separate from the property or keyword name,
                // so we need to strip vendor prefixes from our names. Also strip function parenthesis.
                return name.replace(/^-[^-]+-/, "").replace(/\(\)$/, "").toLowerCase();
            }

            for (let property of cssProperties) {
                // Properties can also be value keywords, like when used in a transition.
                // So we add them to both lists.
                let codeMirrorPropertyName = nameForCodeMirror(property.name);
                propertyNamesForCodeMirror[codeMirrorPropertyName] = true;
                valueKeywordsForCodeMirror[codeMirrorPropertyName] = true;
            }

            for (let propertyName in WI.CSSKeywordCompletions._propertyKeywordMap) {
                let keywords = WI.CSSKeywordCompletions._propertyKeywordMap[propertyName];
                for (let keyword of keywords) {
                    // Skip numbers, like the ones defined for font-weight.
                    if (keyword === WI.CSSKeywordCompletions.AllPropertyNamesPlaceholder || !isNaN(Number(keyword)))
                        continue;
                    valueKeywordsForCodeMirror[nameForCodeMirror(keyword)] = true;
                }
            }

            for (let color of WI.CSSKeywordCompletions._colors)
                colorKeywordsForCodeMirror[nameForCodeMirror(color)] = true;

            // TODO: Remove these keywords once they are built-in codemirror or once we get values from WebKit itself.
            valueKeywordsForCodeMirror["conic-gradient"] = true;
            valueKeywordsForCodeMirror["repeating-conic-gradient"] = true;

            function updateCodeMirrorCSSMode(mimeType) {
                let modeSpec = CodeMirror.resolveMode(mimeType);

                console.assert(modeSpec.propertyKeywords);
                console.assert(modeSpec.valueKeywords);
                console.assert(modeSpec.colorKeywords);

                modeSpec.propertyKeywords = propertyNamesForCodeMirror;
                modeSpec.valueKeywords = valueKeywordsForCodeMirror;
                modeSpec.colorKeywords = colorKeywordsForCodeMirror;

                CodeMirror.defineMIME(mimeType, modeSpec);
            }

            updateCodeMirrorCSSMode("text/css");
            updateCodeMirrorCSSMode("text/x-scss");
        });

        if (target.hasCommand("CSS.getSupportedSystemFontFamilyNames")) {
            target.CSSAgent.getSupportedSystemFontFamilyNames((error, fontFamilyNames) =>{
                if (error)
                    return;

                WI.CSSKeywordCompletions.addPropertyCompletionValues("font-family", fontFamilyNames);
                WI.CSSKeywordCompletions.addPropertyCompletionValues("font", fontFamilyNames);
            });
        }
    }

    // Static

    static supportsInspectorStyleSheet()
    {
        return InspectorBackend.hasCommand("CSS.createStyleSheet");
    }

    static protocolStyleSheetOriginToEnum(origin)
    {
        switch (origin) {
        case InspectorBackend.Enum.CSS.StyleSheetOrigin.User:
            return WI.CSSStyleSheet.Type.User;

        case InspectorBackend.Enum.CSS.StyleSheetOrigin.UserAgent:
            return WI.CSSStyleSheet.Type.UserAgent;

        case InspectorBackend.Enum.CSS.StyleSheetOrigin.Inspector:
            return WI.CSSStyleSheet.Type.Inspector;
        }

        // COMPATIBILITY (iOS 14): CSS.StyleSheetOrigin.Regular was replaced with CSS.StyleSheetOrigin.Author.
        console.assert(!InspectorBackend.Enum.CSS.StyleSheetOrigin.Author || origin === InspectorBackend.Enum.CSS.StyleSheetOrigin.Author);
        console.assert(!InspectorBackend.Enum.CSS.StyleSheetOrigin.Regular || origin === InspectorBackend.Enum.CSS.StyleSheetOrigin.Regular);
        return WI.CSSStyleSheet.Type.Author;
    }

    static protocolGroupingTypeToEnum(type)
    {
        // COMPATIBILITY (iOS 13): CSS.Grouping did not exist yet.
        if (!InspectorBackend.Enum.CSS.Grouping) {
            switch (type) {
            case "mediaRule":
                return WI.CSSGrouping.Type.MediaRule;
            case "importRule":
                return WI.CSSGrouping.Type.MediaImportRule;
            case "linkedSheet":
                return WI.CSSGrouping.Type.MediaLinkNode;
            case "inlineSheet":
                return WI.CSSGrouping.Type.MediaStyleNode;
            }
        }
        return type;
    }

    static displayNameForPseudoId(pseudoId)
    {
        // Compatibility (iOS 12.2): CSS.PseudoId did not exist.
        if (!InspectorBackend.Enum.CSS.PseudoId) {
            switch (pseudoId) {
            case 1: // PseudoId.FirstLine
                return WI.unlocalizedString("::first-line");
            case 2: // PseudoId.FirstLetter
                return WI.unlocalizedString("::first-letter");
            case 3: // PseudoId.Marker
                return WI.unlocalizedString("::marker");
            case 4: // PseudoId.Before
                return WI.unlocalizedString("::before");
            case 5: // PseudoId.After
                return WI.unlocalizedString("::after");
            case 6: // PseudoId.Selection
                return WI.unlocalizedString("::-webkit-selection");
            case 7: // PseudoId.Scrollbar
                return WI.unlocalizedString("::-webkit-scrollbar");
            case 8: // PseudoId.ScrollbarThumb
                return WI.unlocalizedString("::-webkit-scrollbar-thumb");
            case 9: // PseudoId.ScrollbarButton
                return WI.unlocalizedString("::-webkit-scrollbar-button");
            case 10: // PseudoId.ScrollbarTrack
                return WI.unlocalizedString("::-webkit-scrollbar-track");
            case 11: // PseudoId.ScrollbarTrackPiece
                return WI.unlocalizedString("::-webkit-scrollbar-track-piece");
            case 12: // PseudoId.ScrollbarCorner
                return WI.unlocalizedString("::-webkit-scrollbar-corner");
            case 13: // PseudoId.Resizer
                return WI.unlocalizedString("::-webkit-resizer");

            default:
                console.error("Unknown pseudo id", pseudoId);
                return "";
            }
        }

        switch (pseudoId) {
        case CSSManager.PseudoSelectorNames.FirstLine:
            return WI.unlocalizedString("::first-line");
        case CSSManager.PseudoSelectorNames.FirstLetter:
            return WI.unlocalizedString("::first-letter");
        case CSSManager.PseudoSelectorNames.Highlight:
            return WI.unlocalizedString("::highlight");
        case CSSManager.PseudoSelectorNames.GrammarError:
            return WI.unlocalizedString("::grammar-error");
        case CSSManager.PseudoSelectorNames.Marker:
            return WI.unlocalizedString("::marker");
        case CSSManager.PseudoSelectorNames.Before:
            return WI.unlocalizedString("::before");
        case CSSManager.PseudoSelectorNames.After:
            return WI.unlocalizedString("::after");
        case CSSManager.PseudoSelectorNames.Selection:
            return WI.unlocalizedString("::selection");
        case CSSManager.PseudoSelectorNames.Backdrop:
            return WI.unlocalizedString("::backdrop");
        case CSSManager.PseudoSelectorNames.SpellingError:
            return WI.unlocalizedString("::spelling-error");
        case CSSManager.PseudoSelectorNames.TargetText:
            return WI.unlocalizedString("::target-text");
        case CSSManager.PseudoSelectorNames.ViewTransition:
            return WI.unlocalizedString("::view-transition");
        case CSSManager.PseudoSelectorNames.ViewTransitionGroup:
            return WI.unlocalizedString("::view-transition-group");
        case CSSManager.PseudoSelectorNames.ViewTransitionImagePair:
            return WI.unlocalizedString("::view-transition-image-pair");
        case CSSManager.PseudoSelectorNames.ViewTransitionNew:
            return WI.unlocalizedString("::view-transition-new");
        case CSSManager.PseudoSelectorNames.ViewTransitionOld:
            return WI.unlocalizedString("::view-transition-old");
        // COMPATIBILITY (iOS 17.0): PseudoId unprefixed aliases for prefixed protocol names.
        case CSSManager.PseudoSelectorNames.WebKitResizer:
        case "resizer":
            return WI.unlocalizedString("::-webkit-resizer");
        case CSSManager.PseudoSelectorNames.WebKitScrollbar:
        case "scrollbar":
            return WI.unlocalizedString("::-webkit-scrollbar");
        case CSSManager.PseudoSelectorNames.WebKitScrollbarThumb:
        case "scrollbar-thumb":
            return WI.unlocalizedString("::-webkit-scrollbar-thumb");
        case CSSManager.PseudoSelectorNames.WebKitScrollbarButton:
        case "scrollbar-button":
            return WI.unlocalizedString("::-webkit-scrollbar-button");
        case CSSManager.PseudoSelectorNames.WebKitScrollbarTrack:
        case "scrollbar-track":
            return WI.unlocalizedString("::-webkit-scrollbar-track");
        case CSSManager.PseudoSelectorNames.WebKitScrollbarTrackPiece:
        case "scrollbar-track-piece":
            return WI.unlocalizedString("::-webkit-scrollbar-track-piece");
        case CSSManager.PseudoSelectorNames.WebKitScrollbarCorner:
        case "scrollbar-corner":
            return WI.unlocalizedString("::-webkit-scrollbar-corner");

        default:
            console.error("Unknown pseudo id", pseudoId);
            return "";
        }
    }

    static displayNameForForceablePseudoClass(pseudoClass)
    {
        switch (pseudoClass) {
        case WI.CSSManager.ForceablePseudoClass.Active:
            return WI.unlocalizedString(":active");
        case WI.CSSManager.ForceablePseudoClass.Focus:
            return WI.unlocalizedString(":focus");
        case WI.CSSManager.ForceablePseudoClass.FocusVisible:
            return WI.unlocalizedString(":focus-visible");
        case WI.CSSManager.ForceablePseudoClass.FocusWithin:
            return WI.unlocalizedString(":focus-within");
        case WI.CSSManager.ForceablePseudoClass.Hover:
            return WI.unlocalizedString(":hover");
        case WI.CSSManager.ForceablePseudoClass.Target:
            return WI.unlocalizedString(":target");
        case WI.CSSManager.ForceablePseudoClass.Visited:
            return WI.unlocalizedString(":visited");
        }

        console.assert(false, "Unknown pseudo class", pseudoClass);
        return "";
    }

    // Public

    get propertyNameCompletions() { return this._propertyNameCompletions; }

    get overriddenUserPreferences() { return this._overriddenUserPreferences; }

    get defaultUserPreferences() { return this._defaultUserPreferences; }

    get overriddenUserPreferences() { return this._overriddenUserPreferences; }

    get preferredColorFormat()
    {
        return this._colorFormatSetting.value;
    }

    get styleSheets()
    {
        return Array.from(this._styleSheetIdentifierMap.values());
    }

    get supportsOverrideUserPreference()
    {
        return InspectorBackend.hasCommand("Page.overrideUserPreference") && this._defaultUserPreferences.size;
    }

    get supportsOverrideColorScheme()
    {
        // A backend for a platform that does not support color schemes will not dispatch an initial event (Page.defaultAppearanceDidChange or Page.defaultUserPreferencesDidChange)
        // with the default value for the color scheme preference which gets stored on the frontend.

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `PrefersColorScheme` value for `Page.UserPreferenceName` did not exist yet.
        return this._defaultUserPreferences.has(InspectorBackend.Enum.Page.UserPreferenceName?.PrefersColorScheme) || this._defaultUserPreferences.has(WI.CSSManager.ForcedAppearancePreference);
    }

    // COMPATIBILITY (macOS 13, iOS 16.0): `Page.setForcedAppearance()` was removed in favor of `Page.overrideUserPreference()`
    setForcedAppearance(name)
    {
        let commandArguments = {};

        switch (name) {
        case WI.CSSManager.Appearance.Light:
            commandArguments.appearance = InspectorBackend.Enum.Page.Appearance.Light;
            break;

        case WI.CSSManager.Appearance.Dark:
            commandArguments.appearance = InspectorBackend.Enum.Page.Appearance.Dark;
            break;

        case null:
            // COMPATIBILITY (iOS 14): the `appearance`` parameter of `Page.setForcedAppearance` was not optional.
            // Since support can't be tested directly, check for the `options`` parameter of `DOMDebugger.setDOMBreakpoint` (iOS 14.0+).
            // FIXME: Use explicit version checking once https://webkit.org/b/148680 is fixed.
            if (!InspectorBackend.hasCommand("DOMDebugger.setDOMBreakpoint", "options"))
                commandArguments.appearance = "";
            break;

        default:
            console.assert(false, "Unknown appearance", name);
            return;
        }

        let target = WI.assumingMainTarget();
        return target.PageAgent.setForcedAppearance.invoke(commandArguments);
    }

    set layoutContextTypeChangedMode(layoutContextTypeChangedMode)
    {
        for (let target of WI.targets) {
            // COMPATIBILITY (iOS 14.5): CSS.setLayoutContextTypeChangedMode did not exist.
            if (target.hasCommand("CSS.setLayoutContextTypeChangedMode"))
                target.CSSAgent.setLayoutContextTypeChangedMode(layoutContextTypeChangedMode);
        }
    }

    canForcePseudoClass(pseudoClass)
    {
        if (!InspectorBackend.hasCommand("CSS.forcePseudoState"))
            return false;

        if (!pseudoClass)
            return true;

        switch (pseudoClass) {
        case WI.CSSManager.ForceablePseudoClass.Active:
        case WI.CSSManager.ForceablePseudoClass.Focus:
        case WI.CSSManager.ForceablePseudoClass.Hover:
        case WI.CSSManager.ForceablePseudoClass.Visited:
            return true;

        case WI.CSSManager.ForceablePseudoClass.FocusVisible:
        case WI.CSSManager.ForceablePseudoClass.FocusWithin:
        case WI.CSSManager.ForceablePseudoClass.Target:
            // COMPATIBILITY (macOS 12.3, iOS 15.4): CSS.ForceablePseudoClass did not exist yet.
            return !!InspectorBackend.Enum.CSS.ForceablePseudoClass;
        }

        console.assert(false, "Unknown pseudo class", pseudoClass);
        return false;
    }

    overrideUserPreference(preference, value)
    {
        let promises = [];
        for (let target of WI.targets) {
            // COMPATIBILITY (macOS 13.0, iOS 16.0): `Page.overrideUserPreference()` did not exist yet.
            if (target.hasCommand("Page.overrideUserPreference") && InspectorBackend.Enum.Page.UserPreferenceName[preference])
                promises.push(target.PageAgent.overrideUserPreference(preference, value));

            // COMPATIBILITY (macOS 13, iOS 16.0): `Page.setForcedAppearance()` was removed in favor of `Page.overrideUserPreference()`
            if (preference === WI.CSSManager.ForcedAppearancePreference && target.hasCommand("Page.setForcedAppearance"))
                promises.push(this.setForcedAppearance(value || null));
        }

        if (value)
            this._overriddenUserPreferences.set(preference, value);
        else
            this._overriddenUserPreferences.delete(preference);

        Promise.allSettled(promises).then(() => {
            this.mediaQueryResultChanged();
            this.dispatchEventToListeners(WI.CSSManager.Event.OverriddenUserPreferencesDidChange);
        })
    }

    propertyNameHasOtherVendorPrefix(name)
    {
        if (!name || name.length < 4 || name.charAt(0) !== "-")
            return false;

        var match = name.match(/^(?:-moz-|-ms-|-o-|-epub-)/);
        if (!match)
            return false;

        return true;
    }

    propertyValueHasOtherVendorKeyword(value)
    {
        var match = value.match(/(?:-moz-|-ms-|-o-|-epub-)[-\w]+/);
        if (!match)
            return false;

        return true;
    }

    canonicalNameForPropertyName(name)
    {
        if (!name || name.length < 8 || name.charAt(0) !== "-")
            return name;

        // Keep in sync with prefix list from Source/WebInspectorUI/Scripts/update-inspector-css-documentation
        var match = name.match(/^(?:-webkit-|-khtml-|-apple-)(.+)/);
        if (!match)
            return name;

        return match[1];
    }

    styleSheetForIdentifier(id)
    {
        let styleSheet = this._styleSheetIdentifierMap.get(id);
        if (styleSheet)
            return styleSheet;

        styleSheet = new WI.CSSStyleSheet(id);
        this._styleSheetIdentifierMap.set(id, styleSheet);
        return styleSheet;
    }

    stylesForNode(node)
    {
        if (node.id in this._nodeStylesMap)
            return this._nodeStylesMap[node.id];

        var styles = new WI.DOMNodeStyles(node);
        this._nodeStylesMap[node.id] = styles;
        return styles;
    }

    inspectorStyleSheetsForFrame(frame)
    {
        return this.styleSheets.filter((styleSheet) => styleSheet.isInspectorStyleSheet() && styleSheet.parentFrame === frame);
    }

    preferredInspectorStyleSheetForFrame(frame, callback)
    {
        var inspectorStyleSheets = this.inspectorStyleSheetsForFrame(frame);
        for (let styleSheet of inspectorStyleSheets) {
            if (styleSheet[WI.CSSManager.PreferredInspectorStyleSheetSymbol]) {
                callback(styleSheet);
                return;
            }
        }

        let target = WI.assumingMainTarget();
        target.CSSAgent.createStyleSheet(frame.id, function(error, styleSheetId) {
            if (error || !styleSheetId) {
                WI.reportInternalError(error || styleSheetId);
                return;
            }

            const url = null;
            let styleSheet = WI.cssManager.styleSheetForIdentifier(styleSheetId);
            styleSheet.updateInfo(url, frame, styleSheet.origin, styleSheet.isInlineStyleTag(), styleSheet.startLineNumber, styleSheet.startColumnNumber);
            styleSheet[WI.CSSManager.PreferredInspectorStyleSheetSymbol] = true;
            callback(styleSheet);
        });
    }

    mediaTypeChanged()
    {
        // Act the same as if media queries changed.
        this.mediaQueryResultChanged();
    }

    get modifiedStyles()
    {
        return Array.from(this._modifiedStyles.values());
    }

    addModifiedStyle(style)
    {
        this._modifiedStyles.set(style.stringId, style);

        this.dispatchEventToListeners(WI.CSSManager.Event.ModifiedStylesChanged);
    }

    getModifiedStyle(style)
    {
        return this._modifiedStyles.get(style.stringId);
    }

    removeModifiedStyle(style)
    {
        this._modifiedStyles.delete(style.stringId);

        this.dispatchEventToListeners(WI.CSSManager.Event.ModifiedStylesChanged);
    }

    // PageObserver

    // COMPATIBILITY (macOS 13, iOS 16.0): `Page.defaultAppearanceDidChange` was removed in favor of `Page.defaultUserPreferencesDidChange`
    defaultAppearanceDidChange(protocolName)
    {
        let appearance = null;

        switch (protocolName) {
        case InspectorBackend.Enum.Page.Appearance.Light:
            appearance = WI.CSSManager.Appearance.Light;
            break;

        case InspectorBackend.Enum.Page.Appearance.Dark:
            appearance = WI.CSSManager.Appearance.Dark;
            break;

        default:
            console.error("Unknown default appearance name:", protocolName);
            break;
        }

        this.mediaQueryResultChanged();

        this._defaultUserPreferences.set(WI.CSSManager.ForcedAppearancePreference, appearance);

        this.dispatchEventToListeners(WI.CSSManager.Event.DefaultUserPreferencesDidChange);
    }

    defaultUserPreferencesDidChange(userPreferences)
    {
        this._defaultUserPreferences.clear();

        for (let userPreference of userPreferences)
            this._defaultUserPreferences.set(userPreference.name, userPreference.value)

        this.dispatchEventToListeners(WI.CSSManager.Event.DefaultUserPreferencesDidChange);
    }

    // CSSObserver

    mediaQueryResultChanged()
    {
        for (var key in this._nodeStylesMap)
            this._nodeStylesMap[key].mediaQueryResultDidChange();
    }

    styleSheetChanged(styleSheetIdentifier)
    {
        var styleSheet = this.styleSheetForIdentifier(styleSheetIdentifier);
        console.assert(styleSheet);

        // Do not observe inline styles
        if (styleSheet.isInlineStyleAttributeStyleSheet())
            return;

        if (!styleSheet.noteContentDidChange())
            return;

        this._updateResourceContent(styleSheet);
    }

    styleSheetAdded(styleSheetInfo)
    {
        console.assert(!this._styleSheetIdentifierMap.has(styleSheetInfo.styleSheetId), "Attempted to add a CSSStyleSheet but identifier was already in use");
        let styleSheet = this.styleSheetForIdentifier(styleSheetInfo.styleSheetId);
        let parentFrame = WI.networkManager.frameForIdentifier(styleSheetInfo.frameId);
        let origin = WI.CSSManager.protocolStyleSheetOriginToEnum(styleSheetInfo.origin);
        styleSheet.updateInfo(styleSheetInfo.sourceURL, parentFrame, origin, styleSheetInfo.isInline, styleSheetInfo.startLine, styleSheetInfo.startColumn);

        this.dispatchEventToListeners(WI.CSSManager.Event.StyleSheetAdded, {styleSheet});
    }

    styleSheetRemoved(styleSheetIdentifier)
    {
        let styleSheet = this._styleSheetIdentifierMap.get(styleSheetIdentifier);
        console.assert(styleSheet, "Attempted to remove a CSSStyleSheet that was not tracked");
        if (!styleSheet)
            return;

        this._styleSheetIdentifierMap.delete(styleSheetIdentifier);

        this.dispatchEventToListeners(WI.CSSManager.Event.StyleSheetRemoved, {styleSheet});
    }

    // Private

    _nodePseudoClassesDidChange(event)
    {
        var node = event.target;

        for (var key in this._nodeStylesMap) {
            var nodeStyles = this._nodeStylesMap[key];
            if (nodeStyles.node !== node && !nodeStyles.node.isDescendant(node))
                continue;
            nodeStyles.pseudoClassesDidChange(node);
        }
    }

    _nodeAttributesDidChange(event)
    {
        var node = event.target;

        for (var key in this._nodeStylesMap) {
            var nodeStyles = this._nodeStylesMap[key];
            if (nodeStyles.node !== node && !nodeStyles.node.isDescendant(node))
                continue;
            nodeStyles.attributeDidChange(node, event.data.name);
        }
    }

    _mainResourceDidChange(event)
    {
        console.assert(event.target instanceof WI.Frame);

        if (!event.target.isMainFrame())
            return;

        // Clear our maps when the main frame navigates.

        this._styleSheetIdentifierMap.clear();
        this._styleSheetFrameURLMap.clear();
        this._modifiedStyles.clear();

        // COMPATIBILITY (macOS 14.0, iOS 17.0): the `PrefersColorScheme` override used to be cleared on main frame navigation
        // Since support can't be tested directly, check for the `reason` parameter of `Console.messagesCleared` as that change shipped in the same release.
        // FIXME: Use explicit version checking once <https://webkit.org/b/148680> is fixed.
        if (!InspectorBackend.hasEvent("Console.messagesCleared", "reason")) {
            this._overriddenUserPreferences.delete(InspectorBackend.Enum.Page.UserPreferenceName.PrefersColorScheme);
            this.dispatchEventToListeners(WI.CSSManager.Event.OverriddenUserPreferencesDidChange);
        }

        this._nodeStylesMap = {};
    }

    _resourceAdded(event)
    {
        console.assert(event.target instanceof WI.Frame);

        var resource = event.data.resource;
        console.assert(resource);

        if (resource.type !== WI.Resource.Type.StyleSheet)
            return;

        this._clearStyleSheetsForResource(resource);
    }

    _resourceTypeDidChange(event)
    {
        console.assert(event.target instanceof WI.Resource);

        var resource = event.target;
        if (resource.type !== WI.Resource.Type.StyleSheet)
            return;

        this._clearStyleSheetsForResource(resource);
    }

    _clearStyleSheetsForResource(resource)
    {
        // Clear known stylesheets for this URL and frame. This will cause the style sheets to
        // be updated next time _fetchInfoForAllStyleSheets is called.
        this._styleSheetIdentifierMap.delete(this._frameURLMapKey(resource.parentFrame, resource.url));
    }

    _frameURLMapKey(frame, url)
    {
        return frame.id + ":" + url;
    }

    _lookupStyleSheetForResource(resource, callback)
    {
        this._lookupStyleSheet(resource.parentFrame, resource.url, callback);
    }

    _lookupStyleSheet(frame, url, callback)
    {
        console.assert(frame instanceof WI.Frame);

        let key = this._frameURLMapKey(frame, url);

        function styleSheetsFetched()
        {
            callback(this._styleSheetFrameURLMap.get(key) || null);
        }

        let styleSheet = this._styleSheetFrameURLMap.get(key) || null;
        if (styleSheet)
            callback(styleSheet);
        else
            this._fetchInfoForAllStyleSheets(styleSheetsFetched.bind(this));
    }

    _fetchInfoForAllStyleSheets(callback)
    {
        console.assert(typeof callback === "function");

        function processStyleSheets(error, styleSheets)
        {
            this._styleSheetFrameURLMap.clear();

            if (error) {
                callback();
                return;
            }

            for (let styleSheetInfo of styleSheets) {
                let parentFrame = WI.networkManager.frameForIdentifier(styleSheetInfo.frameId);
                let origin = WI.CSSManager.protocolStyleSheetOriginToEnum(styleSheetInfo.origin);

                let styleSheet = this.styleSheetForIdentifier(styleSheetInfo.styleSheetId);
                styleSheet.updateInfo(styleSheetInfo.sourceURL, parentFrame, origin, styleSheetInfo.isInline, styleSheetInfo.startLine, styleSheetInfo.startColumn);

                let key = this._frameURLMapKey(parentFrame, styleSheetInfo.sourceURL);
                this._styleSheetFrameURLMap.set(key, styleSheet);
            }

            callback();
        }

        let target = WI.assumingMainTarget();
        target.CSSAgent.getAllStyleSheets(processStyleSheets.bind(this));
    }

    _resourceContentDidChange(event)
    {
        var resource = event.target;
        if (resource === this._ignoreResourceContentDidChangeEventForResource)
            return;

        // Ignore changes to resource overrides, those are not live on the page.
        if (resource.localResourceOverride)
            return;

        // Ignore if it isn't a CSS style sheet.
        if (resource.type !== WI.Resource.Type.StyleSheet || resource.syntheticMIMEType !== "text/css")
            return;

        function applyStyleSheetChanges()
        {
            function styleSheetFound(styleSheet)
            {
                resource.__pendingChangeTimeout.cancel();

                console.assert(styleSheet);
                if (!styleSheet)
                    return;

                // To prevent updating a TextEditor's content while the user is typing in it we want to
                // ignore the next _updateResourceContent call.
                resource.__ignoreNextUpdateResourceContent = true;

                let revision = styleSheet.editableRevision;
                revision.updateRevisionContent(resource.content);
            }

            this._lookupStyleSheetForResource(resource, styleSheetFound.bind(this));
        }

        if (!resource.__pendingChangeTimeout)
            resource.__pendingChangeTimeout = new Throttler(applyStyleSheetChanges.bind(this), 100);
        resource.__pendingChangeTimeout.fire();
    }

    _updateResourceContent(styleSheet)
    {
        console.assert(styleSheet);

        function fetchedStyleSheetContent(parameters)
        {
            styleSheet.__pendingChangeTimeout.cancel();

            let representedObject = parameters.sourceCode;

            console.assert(representedObject.url);
            if (!representedObject.url)
                return;

            if (!styleSheet.isInspectorStyleSheet()) {
                // Only try to update stylesheet resources. Other resources, like documents, can contain
                // multiple stylesheets and we don't have the source ranges to update those.
                representedObject = representedObject.parentFrame.resourcesForURL(representedObject.url).find((resource) => resource.type === WI.Resource.Type.StyleSheet);
                if (!representedObject)
                    return;
            }

            if (representedObject.__ignoreNextUpdateResourceContent) {
                representedObject.__ignoreNextUpdateResourceContent = false;
                return;
            }

            this._ignoreResourceContentDidChangeEventForResource = representedObject;

            let revision = representedObject.editableRevision;
            if (styleSheet.isInspectorStyleSheet()) {
                revision.updateRevisionContent(representedObject.content);
                styleSheet.dispatchEventToListeners(WI.SourceCode.Event.ContentDidChange);
            } else
                revision.updateRevisionContent(parameters.content);

            this._ignoreResourceContentDidChangeEventForResource = null;
        }

        function styleSheetReady()
        {
            styleSheet.requestContent().then(fetchedStyleSheetContent.bind(this));
        }

        function applyStyleSheetChanges()
        {
            if (styleSheet.url)
                styleSheetReady.call(this);
            else
                this._fetchInfoForAllStyleSheets(styleSheetReady.bind(this));
        }

        if (!styleSheet.__pendingChangeTimeout)
            styleSheet.__pendingChangeTimeout = new Throttler(applyStyleSheetChanges.bind(this), 100);
        styleSheet.__pendingChangeTimeout.fire();
    }
};

WI.CSSManager.Event = {
    StyleSheetAdded: "css-manager-style-sheet-added",
    StyleSheetRemoved: "css-manager-style-sheet-removed",
    ModifiedStylesChanged: "css-manager-modified-styles-changed",
    DefaultUserPreferencesDidChange: "css-manager-default-user-preferences-did-change",
    OverriddenUserPreferencesDidChange: "css-manager-overriden-user-preferences-did-change",
};

WI.CSSManager.UserPreferenceDefaultValue = "System";

// COMPATIBILITY (macOS 13, iOS 16.0): `Page.setForcedAppearance()` was removed in favor of `Page.overrideUserPreference()`
WI.CSSManager.ForcedAppearancePreference = "ForcedAppearancePreference";
WI.CSSManager.Appearance = {
    Light: "Light",
    Dark: "Dark",
};

WI.CSSManager.PseudoSelectorNames = {
    After: "after",
    Before: "before",
    Backdrop: "backdrop",
    FirstLetter: "first-letter",
    FirstLine: "first-line",
    Highlight: "highlight",
    GrammarError: "grammar-error",
    Marker: "marker",
    Selection: "selection",
    SpellingError: "spelling-error",
    TargetText: "target-text",
    ViewTransition: "view-transition",
    ViewTransitionGroup: "view-transition-group",
    ViewTransitionImagePair: "view-transition-image-pair",
    ViewTransitionNew: "view-transition-new",
    ViewTransitionOld: "view-transition-old",
    WebKitResizer: "-webkit-resizer",
    WebKitScrollbar: "-webkit-scrollbar",
    WebKitScrollbarButton: "-webkit-scrollbar-button",
    WebKitScrollbarCorner: "-webkit-scrollbar-corner",
    WebKitScrollbarThumb: "-webkit-scrollbar-thumb",
    WebKitScrollbarTrack: "-webkit-scrollbar-track",
    WebKitScrollbarTrackPiece: "-webkit-scrollbar-track-piece",
};

WI.CSSManager.LayoutContextTypeChangedMode = {
    Observed: "observed",
    All: "all",
};

WI.CSSManager.PseudoElementNames = ["before", "after"];

WI.CSSManager.ForceablePseudoClass = {
    Active: "active",
    Focus: "focus",
    FocusVisible: "focus-visible",
    FocusWithin: "focus-within",
    Hover: "hover",
    Target: "target",
    Visited: "visited",
};

WI.CSSManager.PreferredInspectorStyleSheetSymbol = Symbol("css-manager-preferred-inspector-style-sheet");
