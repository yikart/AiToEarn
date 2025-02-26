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

WI.OverrideDeviceSettingsPopover = class OverrideDeviceSettingsPopover extends WI.SettingsPopover
{
    // Protected

    createContentElement()
    {
        let contentElement = document.createElement("div");
        contentElement.classList.add("device-settings-content");

        // FIXME: webkit.org/b/247809 Enable user agent UI once the UI tracks engine-level changes to the current UA (e.g. via API)
        if (InspectorFrontendHost.isRemote)
            contentElement.appendChild(this._createUserAgentSection());

        if (WI.DeviceSettingsManager.supportsSetScreenSizeOverride())
            contentElement.appendChild(this._createScreenSizeSection());

        contentElement.appendChild(this._createSettingsSection());
        contentElement.appendChild(WI.ReferencePage.DeviceSettings.createLinkElement());

        return contentElement;
    }

    // Private

    _createSettingsSection()
    {
        let settingsGroups = [];

        settingsGroups.push({
            name: WI.UIString("Core Features"),
            settings: [
                {name: WI.UIString("Disable Images"), setting: InspectorBackend.Enum.Page.Setting.ImagesEnabled, value: false},
                {name: WI.UIString("Disable CSS"), setting: InspectorBackend.Enum.Page.Setting.AuthorAndUserStylesEnabled, value: false},
                {name: WI.UIString("Disable JavaScript"), setting: InspectorBackend.Enum.Page.Setting.ScriptEnabled, value: false},
            ],
        });

        if (InspectorFrontendHost.isRemote) {
            settingsGroups.push({
                name: WI.UIString("Compatibility"),
                settings: [
                    {name: WI.UIString("Disable site-specific quirks"), setting: InspectorBackend.Enum.Page.Setting.NeedsSiteSpecificQuirks, value: false},
                ],
            });

            settingsGroups.push({
                name: WI.UIString("Security"),
                settings: [
                    {name: WI.UIString("Disable cross-origin restrictions"), setting: InspectorBackend.Enum.Page.Setting.WebSecurityEnabled, value: false},
                ],
            });

            const privacySettingsGroup = {
                name: WI.UIString("Privacy"),
                settings: [
                    {name: WI.UIString("Enable Intelligent Tracking Prevention debug mode"), setting: InspectorBackend.Enum.Page.Setting.ITPDebugModeEnabled, value: true},
                ],
            };

            // COMPATIBILITY (iOS 14.0): `Page.Setting.AdClickAttributionDebugModeEnabled` was renamed to `Page.Setting.PrivateClickMeasurementDebugModeEnabled`.
            if (InspectorBackend.Enum.Page.Setting.PrivateClickMeasurementDebugModeEnabled)
                privacySettingsGroup.settings.push({name: WI.UIString("Enable Private Click Measurement debug mode"), setting: InspectorBackend.Enum.Page.Setting.PrivateClickMeasurementDebugModeEnabled, value: true});
            else
                privacySettingsGroup.settings.push({name: WI.UIString("Ad Click Attribution debug mode"), setting: InspectorBackend.Enum.Page.Setting.AdClickAttributionDebugModeEnabled, value: true});

            settingsGroups.push(privacySettingsGroup);
        }

        settingsGroups.push({
            name: WI.UIString("Media"),
            settings: [
                {name: WI.UIString("Allow media capture on insecure sites"), setting: InspectorBackend.Enum.Page.Setting.MediaCaptureRequiresSecureConnection, value: false},
                {name: WI.UIString("Disable ICE candidate restrictions"), setting: InspectorBackend.Enum.Page.Setting.ICECandidateFilteringEnabled, value: false},
                {name: WI.UIString("Use mock capture devices"), setting: InspectorBackend.Enum.Page.Setting.MockCaptureDevicesEnabled, value: true},
            ],
        });

        let fragment = document.createDocumentFragment();

        for (let group of settingsGroups) {
            let settingsGroupHeadingElement = fragment.appendChild(document.createElement("h1"));
            settingsGroupHeadingElement.textContent = group.name;

            for (let {name, setting, value} of group.settings) {
                if (!setting)
                    continue;

                let labelElement = fragment.appendChild(document.createElement("label"));

                let checkboxElement = labelElement.appendChild(document.createElement("input"));
                checkboxElement.type = "checkbox";
                checkboxElement.checked = WI.deviceSettingsManager.overridenDeviceSettings.has(setting);
                checkboxElement.addEventListener("change", (event) => {
                    WI.deviceSettingsManager.overrideDeviceSetting(setting, value, (enabled) => {
                        checkboxElement.checked = enabled;
                    });
                });

                labelElement.append(name);
            }
        }

        return fragment;
    }

    _createUserAgentSection()
    {
        let fragment = document.createDocumentFragment();

        let userAgentTitle = fragment.appendChild(document.createElement("h1"));
        userAgentTitle.textContent = WI.UIString("User Agent");

        let userAgentValue = fragment.appendChild(document.createElement("div"));
        userAgentValue.classList.add("select-with-input-container");

        let userAgentValueSelect = userAgentValue.appendChild(document.createElement("select"));

        const userAgents = WebKitAdditions.userAgents ?? [
            [
                {name: WI.UIString("Default"), value: WI.DeviceSettingsManager.DefaultValue},
            ],
            [
                {name: "Safari 18", value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"},
            ],
            [
                {name: `Safari ${emDash} iOS 18 ${emDash} iPhone`, value: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"},
                {name: `Safari ${emDash} iPadOS 18 ${emDash} iPad mini`, value: "Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1"},
                {name: `Safari ${emDash} iPadOS 18 ${emDash} iPad`, value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15"},
            ],
            [
                {name: `Microsoft Edge ${emDash} macOS`, value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"},
                {name: `Microsoft Edge ${emDash} Windows`, value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.0.0"},
                {name: `Microsoft Edge ${emDash} Android`, value: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36 EdgA/131.0.0.0"},
            ],
            [
                {name: `Google Chrome ${emDash} macOS`, value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"},
                {name: `Google Chrome ${emDash} Windows`, value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36"},
                {name: `Google Chrome ${emDash} Android`, value: "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"},
                {name: `Google Chrome ${emDash} ChromeOS`, value: "Mozilla/5.0 (X11; CrOS x86_64 15917.71.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36"},
            ],
            [
                {name: `Firefox ${emDash} macOS`, value: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:127.0) Gecko/20100101 Firefox/127.0"},
                {name: `Firefox ${emDash} Windows`, value: "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0"},
                {name: `Firefox ${emDash} Android`, value: "Mozilla/5.0 (Android 15; Mobile; rv:68.0) Gecko/68.0 Firefox/132.0"},
            ],
            [
                {name: WI.UIString("Other\u2026"), value: WI.OverrideDeviceSettingsPopover.OtherValue},
            ],
        ];

        let selectedOptionElement = null;

        for (let group of userAgents) {
            for (let {name, value} of group) {
                let optionElement = userAgentValueSelect.appendChild(document.createElement("option"));
                optionElement.value = value;
                optionElement.textContent = name;

                if (value === WI.deviceSettingsManager.overridenDeviceUserAgent)
                    selectedOptionElement = optionElement;
            }

            if (group !== userAgents.lastValue)
                userAgentValueSelect.appendChild(document.createElement("hr"));
        }

        let userAgentValueInput = null;

        let showUserAgentInput = () => {
            if (userAgentValueInput)
                return;

            userAgentValueInput = userAgentValue.appendChild(document.createElement("input"));
            userAgentValueInput.spellcheck = false;
            userAgentValueInput.value = userAgentValueInput.placeholder = WI.deviceSettingsManager.overridenDeviceUserAgent || WI.deviceSettingsManager.deviceUserAgent;
            userAgentValueInput.addEventListener("change", (inputEvent) => {
               WI.deviceSettingsManager.overrideUserAgent(userAgentValueInput.value, true);
            });

            this.update();
        }

        if (selectedOptionElement)
            userAgentValueSelect.value = selectedOptionElement.value;
        else if (WI.deviceSettingsManager.overridenDeviceUserAgent) {
            userAgentValueSelect.value = WI.OverrideDeviceSettingsPopover.OtherValue;
            showUserAgentInput();
        }

        userAgentValueSelect.addEventListener("change", () => {
            let value = userAgentValueSelect.value;
            if (value === WI.OverrideDeviceSettingsPopover.OtherValue) {
                showUserAgentInput();
                userAgentValueInput.select();
            } else {
                if (userAgentValueInput) {
                    userAgentValueInput.remove();
                    userAgentValueInput = null;

                    this.update();
                }

                WI.deviceSettingsManager.overrideUserAgent(value);
            }
        });

        return fragment;
    }

    _createScreenSizeSection()
    {
        let fragment = document.createDocumentFragment();

        let screenSizeTitle = fragment.appendChild(document.createElement("h1"));
        screenSizeTitle.textContent = WI.UIString("Screen size");

        let screenSizeValue = fragment.appendChild(document.createElement("div"));
        screenSizeValue.classList.add("select-with-input-container");

        let screenSizeValueSelect = screenSizeValue.appendChild(document.createElement("select"));

        const screenSizes = [
            [
                {name: WI.UIString("Default"), value: WI.DeviceSettingsManager.DefaultValue},
            ],
            [
                {name: WI.UIString("1080p"), value: "1920x1080"},
                {name: WI.UIString("720p"), value: "1280x720"},
            ],
            [
                {name: WI.UIString("Other"), value: WI.OverrideDeviceSettingsPopover.OtherValue},
            ],
        ];

        let selectedScreenSizeOptionElement = null;

        for (let group of screenSizes) {
            for (let {name, value} of group) {
                let optionElement = screenSizeValueSelect.appendChild(document.createElement("option"));
                optionElement.value = value;
                optionElement.textContent = name;

                if (value === WI.deviceSettingsManager.overridenDeviceScreenSize)
                    selectedScreenSizeOptionElement = optionElement;
            }

            if (group !== screenSizes.lastValue)
                screenSizeValueSelect.appendChild(document.createElement("hr"));
        }

        let screenSizeValueInput = null;

        let showScreenSizeInput = () => {
            if (screenSizeValueInput)
                return;

            screenSizeValueInput = screenSizeValue.appendChild(document.createElement("input"));
            screenSizeValueInput.spellcheck = false;
            screenSizeValueInput.value = screenSizeValueInput.placeholder = WI.deviceSettingsManager.overridenDeviceScreenSize || (window.screen.width + "x" + window.screen.height);
            screenSizeValueInput.addEventListener("change", (inputEvent) => {
                WI.deviceSettingsManager.overrideScreenSize(screenSizeValueInput.value, true);
            });

            this.update();
        }

        if (selectedScreenSizeOptionElement)
            screenSizeValueSelect.value = selectedScreenSizeOptionElement.value;
        else if (WI.deviceSettingsManager.overridenDeviceScreenSize) {
            screenSizeValueSelect.value = WI.OverrideDeviceSettingsPopover.OtherValue;
            showScreenSizeInput();
        }

        screenSizeValueSelect.addEventListener("change", () => {
            let value = screenSizeValueSelect.value;
            if (value === WI.OverrideDeviceSettingsPopover.OtherValue) {
                showScreenSizeInput();
                screenSizeValueInput.select();
            } else {
                if (screenSizeValueInput) {
                    screenSizeValueInput.remove();
                    screenSizeValueInput = null;

                    this.update();
                }

                WI.deviceSettingsManager.overrideScreenSize(value);
            }
        });

        return fragment;
    }
};

WI.OverrideDeviceSettingsPopover.OtherValue = "other";
