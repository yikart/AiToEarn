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

WI.DeviceSettingsManager = class DeviceSettingsManager extends WI.Object
{
    constructor()
    {
        super();

        this._deviceUserAgent = "";
        this._overridenDeviceUserAgent = null;
        this._overridenDeviceScreenSize = null;
        this._overridenDeviceSettings = new Map;
    }

    // Target

    initializeTarget(target)
    {
        if (!target.hasDomain("Page"))
            return

        // COMPATIBILITY (iOS 12.2): Page.overrideUserAgent did not exist.
        if (target.hasCommand("Page.overrideUserAgent") && this._overridenDeviceUserAgent)
            target.PageAgent.overrideUserAgent(this._overridenDeviceUserAgent);

        // COMPATIBILITY (iOS 12.2): Page.overrideSetting did not exist.
        if (target.hasCommand("Page.overrideSetting")) {
            for (let [setting, value] of this._overridenDeviceSettings)
                target.PageAgent.overrideSetting(setting, value);
        }

        const objectGroup = "user-agent";

        WI.runtimeManager.evaluateInInspectedWindow("globalThis.navigator?.userAgent", {objectGroup, returnByValue: true}, (remoteObject, wasThrown, result) => {
            if (!wasThrown && result)
                this._deviceUserAgent = result.value;

            target.RuntimeAgent.releaseObjectGroup(objectGroup);
        });
    }

    // Static

    static supportsSetScreenSizeOverride()
    {
        return InspectorBackend.hasCommand("Page.setScreenSizeOverride");
    }

    // Public

    get deviceUserAgent() { return this._deviceUserAgent; }
    get overridenDeviceUserAgent() { return this._overridenDeviceUserAgent; }
    get overridenDeviceScreenSize() { return this._overridenDeviceScreenSize; }
    get overridenDeviceSettings() { return this._overridenDeviceSettings; }

    get hasOverridenDefaultSettings()
    {
        return this._overridenDeviceUserAgent || this._overridenDeviceScreenSize || this._overridenDeviceSettings.size > 0;
    }

    overrideDeviceSetting(setting, value, callback)
    {
        let target = WI.assumingMainTarget();
        if (!target.hasCommand("Page.overrideSetting")) {
            callback(false);
            return;
        }

        let commandArguments = {
            setting,
        };

        let shouldOverride = !this._overridenDeviceSettings.has(setting);
        if (shouldOverride)
            commandArguments.value = value;

        target.PageAgent.overrideSetting.invoke(commandArguments, (error) => {
            if (error) {
                WI.reportInternalError(error);
                callback(false);
                return;
            }

            if (shouldOverride)
                this._overridenDeviceSettings.set(setting, value);
            else
                this._overridenDeviceSettings.delete(setting);

            callback(shouldOverride);
            this.dispatchEventToListeners(WI.DeviceSettingsManager.Event.SettingChanged);
        });
    }

    overrideUserAgent(value, force)
    {
        if (value === this._overridenDeviceUserAgent)
            return;

        let target = WI.assumingMainTarget();
        if (!target.hasCommand("Page.overrideUserAgent"))
            return;

        let commandArguments = {};

        let shouldOverride = value && (value !== WI.DeviceSettingsManager.DefaultValue || force);
        if (shouldOverride)
            commandArguments.value = value;

        target.PageAgent.overrideUserAgent.invoke(commandArguments, (error) => {
            if (error) {
                WI.reportInternalError(error);
                return;
            }

            this._overridenDeviceUserAgent = shouldOverride ? value : null;

            this.dispatchEventToListeners(WI.DeviceSettingsManager.Event.SettingChanged);
            target.PageAgent.reload();
        });
    }

    overrideScreenSize(value, force)
    {
        if (value === this._overridenDeviceScreenSize)
            return;

        let target = WI.assumingMainTarget();
        if (!target.hasCommand("Page.setScreenSizeOverride"))
            return;

        let commandArguments = {};

        let shouldOverride = value && (value !== WI.DeviceSettingsManager.DefaultValue || force);
        if (shouldOverride) {
            let [width, height] = value.split("x");
            width = parseInt(width);
            height = parseInt(height);

            if (isNaN(width) || isNaN(height))
                shouldOverride = false;
            else {
                commandArguments.width = width;
                commandArguments.height = height;
            }
        }

        target.PageAgent.setScreenSizeOverride.invoke(commandArguments, (error) => {
            if (error) {
                WI.reportInternalError(error);
                return;
            }

            this._overridenDeviceScreenSize = shouldOverride ? value : null;

            this.dispatchEventToListeners(WI.DeviceSettingsManager.Event.SettingChanged);
            target.PageAgent.reload();
        });
    }
};

WI.DeviceSettingsManager.Event = {
    SettingChanged: "device-setting-changed",
};

WI.DeviceSettingsManager.DefaultValue = "default";
