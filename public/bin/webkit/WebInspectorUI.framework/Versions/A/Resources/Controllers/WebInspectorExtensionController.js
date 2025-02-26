/*
 * Copyright (C) 2020-2021 Apple Inc. All rights reserved.
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

WI.WebInspectorExtensionController = class WebInspectorExtensionController extends WI.Object
{
    constructor()
    {
        super();

        this._extensionForExtensionIDMap = new Map;
        this._extensionTabContentViewForExtensionTabIDMap = new Map;
        this._tabIDsForExtensionIDMap = new Multimap;
        this._nextExtensionTabID = 1;

        this._extensionTabPositions = null;
        this._saveTabPositionsDebouncer = null;

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._handleMainResourceDidChange, this);
    }

    // Static

    static get extensionTabPositionsObjectStoreKey()
    {
        return "extension-tab-positions";
    }

    // Public

    get registeredExtensionIDs()
    {
        return new Set(this._extensionForExtensionIDMap.keys());
    }

    registerExtension(extensionID, extensionBundleIdentifier, displayName)
    {
        if (this._extensionForExtensionIDMap.has(extensionID)) {
            WI.reportInternalError("Unable to register extension, it's already registered: " + extensionID);
            return WI.WebInspectorExtension.ErrorCode.RegistrationFailed;
        }

        if (!this._extensionForExtensionIDMap.size) {
            WI.tabBrowser.tabBar.addEventListener(WI.TabBar.Event.TabBarItemAdded, this._saveExtensionTabPositions, this);
            WI.tabBrowser.tabBar.addEventListener(WI.TabBar.Event.TabBarItemRemoved, this._saveExtensionTabPositions, this);
            WI.tabBrowser.tabBar.addEventListener(WI.TabBar.Event.TabBarItemsReordered, this._saveExtensionTabPositions, this);
        }

        let extension = new WI.WebInspectorExtension(extensionID, extensionBundleIdentifier, displayName);
        this._extensionForExtensionIDMap.set(extensionID, extension);

        this.dispatchEventToListeners(WI.WebInspectorExtensionController.Event.ExtensionAdded, {extension});
    }

    unregisterExtension(extensionID)
    {
        let extension = this._extensionForExtensionIDMap.take(extensionID);
        if (!extension) {
            WI.reportInternalError("Unable to unregister extension with unknown ID: " + extensionID);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        if (!this._extensionForExtensionIDMap.size) {
            WI.tabBrowser.tabBar.removeEventListener(WI.TabBar.Event.TabBarItemAdded, this._saveExtensionTabPositions, this);
            WI.tabBrowser.tabBar.removeEventListener(WI.TabBar.Event.TabBarItemRemoved, this._saveExtensionTabPositions, this);
            WI.tabBrowser.tabBar.removeEventListener(WI.TabBar.Event.TabBarItemsReordered, this._saveExtensionTabPositions, this);
        }

        let extensionTabIDsToRemove = this._tabIDsForExtensionIDMap.take(extensionID) || [];
        for (let extensionTabID of extensionTabIDsToRemove) {
            let tabContentView = this._extensionTabContentViewForExtensionTabIDMap.take(extensionTabID);

            // Ensure that the iframe is actually detached and does not leak.
            WI.tabBrowser.closeTabForContentView(tabContentView, {suppressAnimations: true});
            tabContentView.dispose();
        }

        this.dispatchEventToListeners(WI.WebInspectorExtensionController.Event.ExtensionRemoved, {extension});
    }

    async createTabForExtension(extensionID, tabName, tabIconURL, sourceURL)
    {
        let extension = this._extensionForExtensionIDMap.get(extensionID);
        if (!extension) {
            WI.reportInternalError("Unable to create tab for extension with unknown ID: " + extensionID + " sourceURL: " + sourceURL);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        let extensionTabID = `WebExtensionTab-${extensionID}-${this._nextExtensionTabID++}`;
        let tabContentView = new WI.WebInspectorExtensionTabContentView(extension, extensionTabID, tabName, tabIconURL, sourceURL);

        this._tabIDsForExtensionIDMap.add(extensionID, extensionTabID);
        this._extensionTabContentViewForExtensionTabIDMap.set(extensionTabID, tabContentView);

        if (!this._extensionTabPositions)
            await this._loadExtensionTabPositions();

        WI.tabBrowser.addTabForContentView(tabContentView, {
            suppressAnimations: true,
            insertionIndex: this._insertionIndexForExtensionTab(tabContentView),
        });

        // The calling convention is to return an error string or a result object.
        return {"result": extensionTabID};
    }

    async evaluateScriptForExtension(extensionID, scriptSource, {frameURL, contextSecurityOrigin, useContentScriptContext} = {})
    {
        let extension = this._extensionForExtensionIDMap.get(extensionID);
        if (!extension) {
            WI.reportInternalError("Unable to evaluate script for extension with unknown ID: " + extensionID);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        let frame = await retryUntil(() => this._frameForFrameURL(frameURL));
        if (!frame) {
            WI.reportInternalError("evaluateScriptForExtension: No frame matched provided frameURL: " + frameURL);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        // FIXME: <https://webkit.org/b/269349> Implement `contextSecurityOrigin` and `useContentScriptContext` options for `devtools.inspectedWindow.eval` command
        if (contextSecurityOrigin) {
            WI.reportInternalError("evaluateScriptForExtension: the 'contextSecurityOrigin' option is not yet implemented.");
            return WI.WebInspectorExtension.ErrorCode.NotImplemented;
        }

        if (useContentScriptContext) {
            WI.reportInternalError("evaluateScriptForExtension: the 'useContentScriptContext' option is not yet implemented.");
            return WI.WebInspectorExtension.ErrorCode.NotImplemented;
        }

        let evaluationContext = await retryUntil(() => frame.pageExecutionContext);
        if (!evaluationContext) {
            WI.reportInternalError("evaluateScriptForExtension: No 'pageExecutionContext' was present for frame with URL: " + frame.url);
            return WI.WebInspectorExtension.ErrorCode.ContextDestroyed;
        }

        return evaluationContext.target.RuntimeAgent.evaluate.invoke({
            expression: scriptSource,
            objectGroup: "extension-evaluation",
            includeCommandLineAPI: true,
            returnByValue: true,
            generatePreview: false,
            saveResult: false,
            contextId: evaluationContext.id,
        }).then((payload) => {
            let resultOrError = payload.result;
            let wasThrown = payload.wasThrown;
            let {type, value} = resultOrError;
            return wasThrown ? {"error": resultOrError.description} : {"result": value};
        }).catch((error) => error.description);
    }

    reloadForExtension(extensionID, {ignoreCache, userAgent, injectedScript} = {})
    {
        let extension = this._extensionForExtensionIDMap.get(extensionID);
        if (!extension) {
            WI.reportInternalError("Unable to evaluate script for extension with unknown ID: " + extensionID);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        // FIXME: <https://webkit.org/b/222328> Implement `userAgent` and `injectedScript` options for `devtools.inspectedWindow.reload` command
        if (userAgent) {
            WI.reportInternalError("reloadForExtension: the 'userAgent' option is not yet implemented.");
            return WI.WebInspectorExtension.ErrorCode.NotImplemented;
        }

        if (injectedScript) {
            WI.reportInternalError("reloadForExtension: the 'injectedScript' option is not yet implemented.");
            return WI.WebInspectorExtension.ErrorCode.NotImplemented;
        }

        let target = WI.assumingMainTarget();
        if (!target.hasCommand("Page.reload"))
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;

        return target.PageAgent.reload.invoke({ignoreCache});
    }

    navigateTabForExtension(extensionTabID, sourceURL)
    {
        let tabContentView = this._extensionTabContentViewForExtensionTabIDMap.get(extensionTabID);
        if (!tabContentView) {
            WI.reportInternalError("Unable to navigate extension tab with unknown extensionTabID: " + extensionTabID);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        tabContentView.iframeURL = sourceURL;
    }

    showExtensionTab(extensionTabID, options = {})
    {
        let tabContentView = this._extensionTabContentViewForExtensionTabIDMap.get(extensionTabID);
        if (!tabContentView) {
            WI.reportInternalError("Unable to show extension tab with unknown extensionTabID: " + extensionTabID);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        tabContentView.visible = true;
        let success = WI.tabBrowser.showTabForContentView(tabContentView, {
            ...options,
            insertionIndex: this._insertionIndexForExtensionTab(tabContentView),
            initiatorHint: WI.TabBrowser.TabNavigationInitiator.FrontendAPI,
        });

        if (!success) {
            WI.reportInternalError("Unable to show extension tab with extensionTabID: " + extensionTabID);
            return WI.WebInspectorExtension.ErrorCode.InternalError;
        }

        tabContentView.visible = true;

        // Clients expect to be able to use evaluateScriptInExtensionTab() when this method
        // returns, so wait for the extension tab to finish its loading sequence. Wrap the result.
        return tabContentView.whenPageAvailable().then((sourceURL) => { return {"result": sourceURL}; });
    }

    hideExtensionTab(extensionTabID, options = {})
    {
        let tabContentView = this._extensionTabContentViewForExtensionTabIDMap.get(extensionTabID);
        if (!tabContentView) {
            WI.reportInternalError("Unable to show extension tab with unknown extensionTabID: " + extensionTabID);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        tabContentView.visible = false;
        WI.tabBrowser.closeTabForContentView(tabContentView, options);

        console.assert(!tabContentView.visible);
        console.assert(!tabContentView.isClosed);
    }

    addContextMenuItemsForClosedExtensionTabs(contextMenu)
    {
        contextMenu.appendSeparator();

        for (let tabContentView of this._extensionTabContentViewForExtensionTabIDMap.values()) {
            // If the extension tab has been unchecked in the TabBar context menu, then the tabBarItem
            // for the extension tab will not be connected to a parent TabBar.
            let shouldIncludeTab = !tabContentView.visible || !tabContentView.tabBarItem.parentTabBar;
            if (!shouldIncludeTab)
                continue;

            contextMenu.appendItem(tabContentView.tabInfo().displayName, () => {
                this.showExtensionTab(tabContentView.extensionTabID);
            });
        }
    }

    addContextMenuItemsForAllExtensionTabs(contextMenu)
    {
        contextMenu.appendSeparator();

        for (let tabContentView of this._extensionTabContentViewForExtensionTabIDMap.values()) {
            let checked = tabContentView.visible || !!tabContentView.tabBarItem.parentTabBar;
            contextMenu.appendCheckboxItem(tabContentView.tabInfo().displayName, () => {
                if (!checked)
                    this.showExtensionTab(tabContentView.extensionTabID);
                else
                    this.hideExtensionTab(tabContentView.extensionTabID);
            }, checked);
        }
    }

    activeExtensionTabContentViews()
    {
        return Array.from(this._extensionTabContentViewForExtensionTabIDMap.values()).filter((tab) => tab.visible || tab.tabBarItem.parentTabBar);
    }

    evaluateScriptInExtensionTab(extensionTabID, scriptSource)
    {
        let tabContentView = this._extensionTabContentViewForExtensionTabIDMap.get(extensionTabID);
        if (!tabContentView) {
            WI.reportInternalError("Unable to evaluate with unknown extensionTabID: " + extensionTabID);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        let iframe = tabContentView.iframeElement;
        if (!(iframe instanceof HTMLIFrameElement)) {
            WI.reportInternalError("Unable to evaluate without an <iframe> for extensionTabID: " + extensionTabID);
            return WI.WebInspectorExtension.ErrorCode.InvalidRequest;
        }

        return new Promise((resolve, reject) => {
            try {
                // If `result` is a promise, then it came from a different frame and `instanceof Promise` won't work.
                let result = InspectorFrontendHost.evaluateScriptInExtensionTab(iframe, scriptSource);
                if (result?.then) {
                    result.then((resolvedValue) => resolve({result: resolvedValue}), (errorValue) => reject({error: errorValue}));
                    return;
                }

                resolve({result});
            } catch (error) {
                // Include more context in the stringification of the error.
                const stackIndent = "  ";
                let stackLines = (error.stack?.split("\n") || []).map((line) => `${stackIndent}${line}`);
                let formattedMessage = [
                    `Caught Exception: ${error.name}`,
                    `at ${error.sourceURL || "(unknown)"}:${error.line || 0}:${error.column || 0}:`,
                    error.message,
                    "",
                    "Backtrace:",
                    ...stackLines,
                ].join("\n");
                reject({error: formattedMessage});
            }
        });
    }

    // Private

    async _loadExtensionTabPositions()
    {
        let savedTabPositions = await WI.objectStores.general.get(WebInspectorExtensionController.extensionTabPositionsObjectStoreKey);
        this._extensionTabPositions = savedTabPositions || {};
    }

    _saveExtensionTabPositions()
    {
        if (!this._extensionTabPositions)
            return;

        this._saveTabPositionsDebouncer ||= new Debouncer(() => {
            for (let tabBarItem of WI.tabBrowser.tabBar.visibleTabBarItemsFromLeftToRight) {
                if (!(tabBarItem.representedObject instanceof WI.WebInspectorExtensionTabContentView))
                    continue;

                let {anchorTabType, anchorTabIndex, distanceFromAnchorTab} = this._computeIndicesForExtensionTab(tabBarItem.representedObject, {recomputePositions: true});
                this._extensionTabPositions[tabBarItem.representedObject.savedTabPositionKey] = {anchorTabType, distanceFromAnchorTab};
            }

            WI.objectStores.general.put(this._extensionTabPositions, WebInspectorExtensionController.extensionTabPositionsObjectStoreKey);
        });
        this._saveTabPositionsDebouncer.delayForTime(5000);
    }

    _insertionIndexForExtensionTab(tabContentView, options = {})
    {
        let {anchorTabType, anchorTabIndex, distanceFromAnchorTab} = this._computeIndicesForExtensionTab(tabContentView, options);
        return anchorTabIndex + distanceFromAnchorTab + 1;
    }

    _computeIndicesForExtensionTab(tabContentView, {recomputePositions} = {})
    {
        // Note: pinned tabs always appear on the trailing edge, so we can ignore them
        // for the purposes of computing an `insertionIndex`` for `tabContentView`.
        let anchorTabIndex = 0;
        let savedPositions = this._extensionTabPositions[tabContentView.savedTabPositionKey] || {};
        let anchorTabType = (recomputePositions && savedPositions.anchorTabType) || null;
        let distanceFromAnchorTab = (recomputePositions && savedPositions.distanceFromAnchorTab) || 0;

        let visibleTabBarItems = WI.tabBrowser.tabBar.visibleTabBarItemsFromLeftToRight;
        for (let i = 0; i < visibleTabBarItems.length; ++i) {
            let visibleTab = visibleTabBarItems[i].representedObject;
            if (!visibleTab)
                continue;

            if (visibleTab === tabContentView)
                break;

            if (visibleTab instanceof WI.WebInspectorExtensionTabContentView)
                continue;

            if (recomputePositions) {
                anchorTabType = visibleTab.type || null;
                continue;
            }

            if (visibleTab.type !== anchorTabType)
                continue;

            anchorTabIndex = i;
            break;
        }

        // Find the count of extension tabs after the anchor tab to compute the real distanceFromAnchorTab.
        // Adding `distanceFromAnchorTab` to `anchorTabIndex` should not insert the tab after a different anchor tab.
        for (let i = 1; i < visibleTabBarItems.length - anchorTabIndex; ++i) {
            if (visibleTabBarItems[anchorTabIndex + i].representedObject?.constructor?.shouldSaveTab?.()) {
                distanceFromAnchorTab = Number.constrain(distanceFromAnchorTab, 0, Math.max(0, i - 1));
                return {anchorTabType, anchorTabIndex, distanceFromAnchorTab};
            }
        }

        // If the anchor tab is now hidden upon restoring, place the extension at the end.
        // This could happen if a smaller set of tabs are enabled for the inspection target.
        anchorTabIndex = visibleTabBarItems.length - 1;
        return {anchorTabType, anchorTabIndex, distanceFromAnchorTab};
    }

    _frameForFrameURL(frameURL)
    {
        if (!frameURL)
            return WI.networkManager.mainFrame;

        function findFrame(frameURL, adjustKnownFrameURL) {
            return WI.networkManager.frames.find((knownFrame) => {
                let knownFrameURL = new URL(knownFrame.url);
                adjustKnownFrameURL?.(knownFrameURL);
                return knownFrameURL.toString() === frameURL;
            });
        }

        let frame = findFrame(frameURL);
        if (frame)
            return frame;

        let frameURLParts = new URL(frameURL);
        if (frameURLParts.hash.length)
            return null;

        frame = findFrame(frameURL, (knownFrameURL) => {
            knownFrameURL.hash = "";
        });
        if (frame)
            return frame;

        if (frameURLParts.search.length)
            return null;

        return findFrame(frameURL, (knownFrameURL) => {
            knownFrameURL.hash = "";
            knownFrameURL.search = "";
        });
    }

    _handleMainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        // Don't fire the event unless one or more extensions are registered.
        if (!this._extensionForExtensionIDMap.size)
            return;

        InspectorFrontendHost.inspectedPageDidNavigate(WI.networkManager.mainFrame.url);
    }
};

WI.WebInspectorExtensionController.Event = {
    ExtensionAdded: "extension-added",
    ExtensionRemoved: "extension-removed",
};
