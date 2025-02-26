/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

WI.OverrideUserPreferencesPopover = class OverrideUserPreferencesPopover extends WI.SettingsPopover
{
    constructor(delegate)
    {
        super(delegate);

        this._defaultValueOptionElementsMap = new Map;
    }

    // Public

    show(targetElement)
    {
        super.show(targetElement);

        WI.cssManager.addEventListener(WI.CSSManager.Event.DefaultUserPreferencesDidChange, this._defaultUserPreferencesDidChange, this);
    }

    dismiss()
    {
        this._defaultValueOptionElementsMap.clear();

        WI.cssManager.removeEventListener(WI.CSSManager.Event.DefaultUserPreferencesDidChange, this._defaultUserPreferencesDidChange, this);

        super.dismiss();
    }

    // Protected

    createContentElement()
    {
        let contentElement = document.createElement("div");
        contentElement.classList.add("user-preferences-content");

        if (WI.cssManager.supportsOverrideColorScheme) {
            let appearanceHeader = contentElement.appendChild(document.createElement("h1"));
            appearanceHeader.textContent = WI.UIString("Appearance", "Appearance @ User Preferences Overrides", "Header for section with appearance user preferences.");
        }

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `PrefersColorScheme` value for `Page.UserPreferenceName` did not exist yet.
        if (WI.cssManager.supportsOverrideColorScheme && InspectorBackend.Enum.Page?.UserPreferenceName?.PrefersColorScheme) {
            this._createSelectElement({
                contentElement,
                id: "override-prefers-color-scheme",
                label: WI.UIString("Color scheme", "Color scheme @ User Preferences Overrides", "Label for input to override the preference for color scheme."),
                preferenceName: InspectorBackend.Enum.Page.UserPreferenceName.PrefersColorScheme,
                preferenceValues: [InspectorBackend.Enum.Page.UserPreferenceValue.Light, InspectorBackend.Enum.Page.UserPreferenceValue.Dark],
                defaultValue: WI.CSSManager.UserPreferenceDefaultValue,
            });
        }

        // COMPATIBILITY (macOS 13, iOS 16.0): `Page.setForcedAppearance()` was removed in favor of `Page.overrideUserPreference()`
        if (WI.cssManager.supportsOverrideColorScheme && InspectorBackend.hasCommand("Page.setForcedAppearance")) {
            this._createSelectElement({
                contentElement,
                id: "override-prefers-color-scheme",
                label: WI.UIString("Color scheme", "Color scheme @ User Preferences Overrides", "Label for input to override the preference for color scheme."),
                preferenceName: WI.CSSManager.ForcedAppearancePreference,
                preferenceValues: [WI.CSSManager.Appearance.Light, WI.CSSManager.Appearance.Dark],
                defaultValue: WI.CSSManager.UserPreferenceDefaultValue,
            });
        }

        if (InspectorBackend.Enum.Page?.UserPreferenceName?.PrefersReducedMotion || InspectorBackend.Enum.Page?.UserPreferenceName?.PrefersContrast) {
            let accessibilityHeader = contentElement.appendChild(document.createElement("h1"));
            accessibilityHeader.textContent = WI.UIString("Accessibility", "Accessibility @ User Preferences Overrides", "Header for section with accessibility user preferences.");
        }

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `PrefersReducedMotion` value for `Page.UserPreferenceName` did not exist yet.
        if (InspectorBackend.Enum.Page?.UserPreferenceName?.PrefersReducedMotion)
            this._createSelectElement({
                contentElement,
                id: "override-prefers-reduced-motion",
                label: WI.UIString("Reduce motion", "Reduce motion @ User Preferences Overrides", "Label for input to override the preference for reduced motion."),
                preferenceName: InspectorBackend.Enum.Page.UserPreferenceName.PrefersReducedMotion,
                preferenceValues: [InspectorBackend.Enum.Page.UserPreferenceValue.Reduce, InspectorBackend.Enum.Page.UserPreferenceValue.NoPreference],
                defaultValue: WI.CSSManager.UserPreferenceDefaultValue,
            });

        // COMPATIBILITY (macOS 13.0, iOS 16.0): `PrefersContrast` value for `Page.UserPreferenceName` did not exist yet.
        if (InspectorBackend.Enum.Page?.UserPreferenceName?.PrefersContrast)
            this._createSelectElement({
                contentElement,
                id: "override-prefers-contrast",
                label: WI.UIString("Increase contrast", "Increase contrast @ User Preferences Overrides", "Label for input to override the preference for high contrast."),
                preferenceName: InspectorBackend.Enum.Page.UserPreferenceName.PrefersContrast,
                preferenceValues: [InspectorBackend.Enum.Page.UserPreferenceValue.More, InspectorBackend.Enum.Page.UserPreferenceValue.NoPreference],
                defaultValue: WI.CSSManager.UserPreferenceDefaultValue,
            });

        return contentElement;
    }

    // Private

    _createSelectElement({contentElement, id, label, preferenceName, preferenceValues, defaultValue})
    {
        if (!preferenceName || !preferenceValues.length)
            return;

        let labelElement = contentElement.appendChild(document.createElement("label"));
        labelElement.textContent = label;
        labelElement.setAttribute("for", id);

        let selectElement = contentElement.appendChild(document.createElement("select"));
        selectElement.setAttribute("name", preferenceName);
        selectElement.setAttribute("id", id);

        let systemValue = WI.cssManager.defaultUserPreferences.get(preferenceName);

        for (let value of [defaultValue, ...preferenceValues]) {
            let optionElement = selectElement.appendChild(document.createElement("option"));
            optionElement.value = value;
            optionElement.textContent = this._userPreferenceValueLabel(value, systemValue);

            let selectedValue = WI.cssManager.overriddenUserPreferences.get(preferenceName) || defaultValue;
            if (value === selectedValue)
                optionElement.setAttribute("selected", true);

            if (value === defaultValue) {
                optionElement.after(document.createElement("hr"));
                this._defaultValueOptionElementsMap.set(preferenceName, optionElement);
            }
        }

        selectElement.addEventListener("change", (event) => {
            let value = event.target.value;
            if (value !== defaultValue)
                WI.cssManager.overrideUserPreference(preferenceName, value);
            else
                WI.cssManager.overrideUserPreference(preferenceName); // Pass no value to remove the override and restore the system default.
        });
    }

    _userPreferenceValueLabel(preferenceValue, systemValue)
    {
        switch (preferenceValue) {
        case WI.CSSManager.UserPreferenceDefaultValue:
            return WI.UIString("System (%s)", "System @ User Preferences Overrides", "Label for a preference that matches the default system value. The system value is shown in parentheses.").format(this._userPreferenceValueLabel(systemValue));
        case InspectorBackend.Enum.Page.UserPreferenceValue?.Reduce:
        case InspectorBackend.Enum.Page.UserPreferenceValue?.More:
            return WI.UIString("On", "On @ User Preferences Overrides", "Label for a preference that is turned on.");
        case InspectorBackend.Enum.Page.UserPreferenceValue?.NoPreference:
            return WI.UIString("Off", "Off @ User Preferences Overrides", "Label for a preference that is turned off.");
        case InspectorBackend.Enum.Page.UserPreferenceValue?.Light:
        case WI.CSSManager.Appearance.Light:
            return WI.UIString("Light", "Light @ User Preferences Overrides", "Label for the light color scheme preference.");
        case InspectorBackend.Enum.Page.UserPreferenceValue?.Dark:
        case WI.CSSManager.Appearance.Dark:
            return WI.UIString("Dark", "Dark @ User Preferences Overrides", "Label for the dark color scheme preference.");
        }

        console.assert(false, "Unknown user preference", preferenceValue);
        return "";
    }

    _defaultUserPreferencesDidChange()
    {
        for (let [preferenceName, systemValue] of WI.cssManager.defaultUserPreferences) {
            let defaultOptionElement = this._defaultValueOptionElementsMap.get(preferenceName);
            if (defaultOptionElement)
                defaultOptionElement.textContent = this._userPreferenceValueLabel(WI.CSSManager.UserPreferenceDefaultValue, systemValue);
        }
    }
};
