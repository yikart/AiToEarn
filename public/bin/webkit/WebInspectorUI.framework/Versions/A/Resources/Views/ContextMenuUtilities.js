/*
 * Copyright (C) 2016 Devin Rousso <webkit@devinrousso.com>. All rights reserved.
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

WI.addMouseDownContextMenuHandlers = function(element, populateContextMenuCallback)
{
    let ignoreMouseDown = false;
    element.addEventListener("mousedown", (event) => {
        if (event.button !== 0)
            return;

        event.stop();

        if (ignoreMouseDown)
            return;

        let contextMenu = WI.ContextMenu.createFromEvent(event);
        contextMenu.addBeforeShowCallback(() => {
            ignoreMouseDown = false;
        });

        populateContextMenuCallback(contextMenu, event);

        ignoreMouseDown = !contextMenu.isEmpty();
        contextMenu.show();
    });

    element.addEventListener("contextmenu", (event) => {
        let contextMenu = WI.ContextMenu.createFromEvent(event);
        populateContextMenuCallback(contextMenu, event);
    });
};

WI.appendContextMenuItemsForSourceCode = function(contextMenu, sourceCodeOrLocation)
{
    console.assert(contextMenu instanceof WI.ContextMenu);
    if (!(contextMenu instanceof WI.ContextMenu))
        return;

    let sourceCode = sourceCodeOrLocation;
    let displaySourceCode = sourceCode;
    let location = null;
    if (sourceCodeOrLocation instanceof WI.SourceCodeLocation) {
        sourceCode = sourceCodeOrLocation.sourceCode;
        displaySourceCode = sourceCodeOrLocation.displaySourceCode;
        location = sourceCodeOrLocation;
    }

    console.assert(sourceCode instanceof WI.SourceCode);
    if (!(sourceCode instanceof WI.SourceCode))
        return;

    if (contextMenu.__domBreakpointItemsAdded)
        return;

    if (!contextMenu.__localOverrideItemsAdded && WI.NetworkManager.supportsOverridingResponses()) {
        contextMenu.__localOverrideItemsAdded = true;

        if (WI.networkManager.canBeOverridden(sourceCode)) {
            contextMenu.appendSeparator();

            if (WI.NetworkManager.supportsOverridingRequests()) {
                contextMenu.appendItem(WI.UIString("Create Request Local Override"), async () => {
                    let localResourceOverride = await sourceCode.createLocalResourceOverride(WI.LocalResourceOverride.InterceptType.Request);
                    WI.networkManager.addLocalResourceOverride(localResourceOverride);
                    WI.showLocalResourceOverride(localResourceOverride, {
                        overriddenResource: sourceCode,
                        initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                    });
                });
            }

            contextMenu.appendItem(WI.UIString("Create Response Local Override"), async () => {
                let localResourceOverride = await sourceCode.createLocalResourceOverride(WI.LocalResourceOverride.InterceptType.Response);
                WI.networkManager.addLocalResourceOverride(localResourceOverride);
                WI.showLocalResourceOverride(localResourceOverride, {
                    overriddenResource: sourceCode,
                    initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                });
            });

            if (WI.NetworkManager.supportsBlockingRequests()) {
                contextMenu.appendItem(WI.UIString("Block Request URL"), async () => {
                    let localResourceOverride = await sourceCode.createLocalResourceOverride(WI.LocalResourceOverride.InterceptType.Block);
                    WI.networkManager.addLocalResourceOverride(localResourceOverride);
                });
            }
        } else {
            let localResourceOverride = WI.networkManager.localResourceOverridesForURL(sourceCode.url)[0];
            if (localResourceOverride) {
                contextMenu.appendSeparator();

                contextMenu.appendItem(WI.UIString("Reveal Local Override"), () => {
                    WI.showLocalResourceOverride(localResourceOverride, {
                        overriddenResource: sourceCode,
                        initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                    });
                });

                contextMenu.appendItem(localResourceOverride.disabled ? WI.UIString("Enable Local Override") : WI.UIString("Disable Local Override"), () => {
                    localResourceOverride.disabled = !localResourceOverride.disabled;
                });

                contextMenu.appendItem(WI.UIString("Delete Local Override"), () => {
                    WI.networkManager.removeLocalResourceOverride(localResourceOverride);
                });
            }
        }
    }

    contextMenu.appendSeparator();

    if (location && (displaySourceCode instanceof WI.Script || (displaySourceCode instanceof WI.Resource && displaySourceCode.type === WI.Resource.Type.Script && !displaySourceCode.localResourceOverride))) {
        let existingJavaScriptBreakpoint = WI.debuggerManager.breakpointForSourceCodeLocation(location);
        if (existingJavaScriptBreakpoint) {
            contextMenu.appendItem(WI.UIString("Delete JavaScript Breakpoint"), () => {
                WI.debuggerManager.removeBreakpoint(existingJavaScriptBreakpoint);
            });
        } else {
            contextMenu.appendItem(WI.UIString("Add JavaScript Breakpoint"), () => {
                WI.debuggerManager.addBreakpoint(new WI.JavaScriptBreakpoint(location));
            });
        }
    }

    if (sourceCode?.initiatorStackTrace) {
        let existingURLBreakpoints = WI.domDebuggerManager.urlBreakpointsMatchingURL(sourceCode.url);
        if (existingURLBreakpoints.length) {
            contextMenu.appendItem(existingURLBreakpoints.length === 1 ? WI.UIString("Delete URL Breakpoint") : WI.UIString("Delete URL Breakpoints"), () => {
                for (let urlBreakpoint of existingURLBreakpoints)
                    WI.domDebuggerManager.removeURLBreakpoint(urlBreakpoint);
            });
        } else {
            contextMenu.appendItem(WI.UIString("Add URL Breakpoint"), () => {
                WI.domDebuggerManager.addURLBreakpoint(new WI.URLBreakpoint(WI.URLBreakpoint.Type.Text, sourceCode.url));
            });
        }
    }

    if (displaySourceCode.supportsScriptBlackboxing) {
        let blackboxData = WI.debuggerManager.blackboxDataForSourceCode(displaySourceCode);
        if (blackboxData && blackboxData.type === WI.DebuggerManager.BlackboxType.Pattern) {
            contextMenu.appendItem(WI.UIString("Reveal Blackbox Pattern"), () => {
                WI.showSettingsTab({
                    blackboxPatternToSelect: blackboxData.regex,
                    initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                });
            });
        } else {
            contextMenu.appendItem(blackboxData ? WI.UIString("Unblackbox Script") : WI.UIString("Blackbox Script"), () => {
                WI.debuggerManager.setShouldBlackboxScript(displaySourceCode, !blackboxData);
            });
        }
    }

    contextMenu.appendSeparator();

    WI.appendContextMenuItemsForURL(contextMenu, sourceCode.url, {sourceCode, location});

    if (sourceCode instanceof WI.Resource && !sourceCode.localResourceOverride && sourceCode.hasMetadata) {
        if (sourceCode.urlComponents.scheme !== "data") {
            contextMenu.appendItem(WI.UIString("Copy as fetch", "Copy the URL, method, headers, etc. of the given network request in the format of a JS fetch expression."), () => {
                InspectorFrontendHost.copyText(sourceCode.generateFetchCode());
            });

            contextMenu.appendItem(WI.UIString("Copy as cURL"), () => {
                InspectorFrontendHost.copyText(sourceCode.generateCURLCommand());
            });

            contextMenu.appendSeparator();

            contextMenu.appendItem(WI.UIString("Copy HTTP Request"), () => {
                InspectorFrontendHost.copyText(sourceCode.stringifyHTTPRequest());
            });

            if (sourceCode.hasResponse()) {
                contextMenu.appendItem(WI.UIString("Copy HTTP Response"), () => {
                    InspectorFrontendHost.copyText(sourceCode.stringifyHTTPResponse());
                });
            }
        }
    }

    if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile)) {
        contextMenu.appendSeparator();

        contextMenu.appendItem(WI.UIString("Save File"), () => {
            displaySourceCode.requestContent().then(() => {
                let saveData = {
                    url: displaySourceCode.url,
                    content: displaySourceCode.content,
                    base64Encoded: displaySourceCode.base64Encoded,
                };

                if (displaySourceCode.urlComponents.path === "/") {
                    let extension = WI.fileExtensionForMIMEType(displaySourceCode.mimeType);
                    if (extension)
                        saveData.suggestedName = `index.${extension}`;
                }

                WI.FileUtilities.save(WI.FileUtilities.SaveMode.SingleFile, saveData);
            });
        });
    }

    contextMenu.appendSeparator();
};

WI.appendContextMenuItemsForURL = function(contextMenu, url, options = {})
{
    if (!url)
        return;

    function showResourceWithOptions(options) {
        options.initiatorHint = WI.TabBrowser.TabNavigationInitiator.ContextMenu;
        if (options.location)
            WI.showSourceCodeLocation(options.location, options);
        else if (options.sourceCode)
            WI.showSourceCode(options.sourceCode, options);
        else
            WI.openURL(url, options);
    }

    if (!url.startsWith("javascript:") && !url.startsWith("data:")) {
        contextMenu.appendItem(WI.UIString("Open in New Window", "Open in New Window @ Context Menu Item", "Context menu item for opening the target item in a new window."), () => {
            WI.openURL(url, {alwaysOpenExternally: true});
        });
    }

    if (WI.networkManager.resourcesForURL(url).size) {
        if (!WI.isShowingSourcesTab()) {
            contextMenu.appendItem(WI.UIString("Reveal in Sources Tab"), () => {
                showResourceWithOptions({preferredTabType: WI.SourcesTabContentView.Type});
            });
        }

        if (!WI.isShowingNetworkTab()) {
            contextMenu.appendItem(WI.UIString("Reveal in Network Tab"), () => {
                showResourceWithOptions({preferredTabType: WI.NetworkTabContentView.Type});
            });
        }
    }

    contextMenu.appendSeparator();

    contextMenu.appendItem(WI.UIString("Copy Link"), () => {
        InspectorFrontendHost.copyText(url);
    });
};

WI.appendContextMenuItemsForDOMNode = function(contextMenu, domNode, options = {})
{
    console.assert(contextMenu instanceof WI.ContextMenu);
    if (!(contextMenu instanceof WI.ContextMenu))
        return;

    console.assert(domNode instanceof WI.DOMNode);
    if (!(domNode instanceof WI.DOMNode))
        return;

    let copySubMenu = options.copySubMenu || contextMenu.appendSubMenuItem(WI.UIString("Copy"));

    let isElement = domNode.nodeType() === Node.ELEMENT_NODE;
    let attached = domNode.attached;

    if (isElement && attached) {
        copySubMenu.appendItem(WI.UIString("Selector Path"), () => {
            let cssPath = WI.cssPath(domNode);
            InspectorFrontendHost.copyText(cssPath);
        });
    }

    if (!domNode.isPseudoElement() && attached) {
        copySubMenu.appendItem(WI.UIString("XPath"), () => {
            let xpath = WI.xpath(domNode);
            InspectorFrontendHost.copyText(xpath);
        });
    }

    contextMenu.appendSeparator();

    if (!options.usingLocalDOMNode) {
        if (domNode.isCustomElement()) {
            contextMenu.appendItem(WI.UIString("Jump to Definition"), () => {
                function didGetFunctionDetails(error, response) {
                    if (error)
                        return;

                    let location = response.location;
                    let sourceCode = WI.debuggerManager.scriptForIdentifier(location.scriptId, WI.mainTarget);
                    if (!sourceCode)
                        return;

                    let sourceCodeLocation = sourceCode.createSourceCodeLocation(location.lineNumber, location.columnNumber || 0);
                    WI.showSourceCodeLocation(sourceCodeLocation, {
                        ignoreNetworkTab: true,
                        ignoreSearchTab: true,
                    });
                }

                WI.RemoteObject.resolveNode(domNode).then((remoteObject) => {
                    remoteObject.getProperty("constructor", (error, result, wasThrown) => {
                        if (error)
                            return;
                        if (result.type === "function")
                            remoteObject.target.DebuggerAgent.getFunctionDetails(result.objectId, didGetFunctionDetails);
                        result.release();
                    });
                    remoteObject.release();
                });
            });

            contextMenu.appendSeparator();
        }

        if (!options.disallowEditing && WI.cssManager.canForcePseudoClass() && domNode.attached) {
            contextMenu.appendSeparator();

            let pseudoSubMenu = contextMenu.appendSubMenuItem(WI.UIString("Forced Pseudo-Classes", "A context menu item to force (override) a DOM node's pseudo-classes"));

            let enabledPseudoClasses = domNode.enabledPseudoClasses;
            for (let pseudoClass of Object.values(WI.CSSManager.ForceablePseudoClass)) {
                if (!WI.cssManager.canForcePseudoClass(pseudoClass))
                    continue;

                let enabled = enabledPseudoClasses.includes(pseudoClass);
                pseudoSubMenu.appendCheckboxItem(WI.CSSManager.displayNameForForceablePseudoClass(pseudoClass), () => {
                    domNode.setPseudoClassEnabled(pseudoClass, !enabled);
                }, enabled);
            }
        }

        if (WI.domDebuggerManager.supported && isElement && !domNode.isPseudoElement() && attached) {
            contextMenu.appendSeparator();

            WI.appendContextMenuItemsForDOMNodeBreakpoints(contextMenu, domNode, options);
        }

        contextMenu.appendSeparator();

        let canLogShadowTree = !domNode.isInUserAgentShadowTree() || WI.DOMManager.supportsEditingUserAgentShadowTrees({frontendOnly: true});
        if (!options.excludeLogElement && canLogShadowTree && !domNode.destroyed && !domNode.isPseudoElement()) {
            let label = isElement ? WI.UIString("Log Element", "Log (print) DOM element to Console") : WI.UIString("Log Node", "Log (print) DOM node to Console");
            contextMenu.appendItem(label, () => {
                WI.RemoteObject.resolveNode(domNode, WI.RuntimeManager.ConsoleObjectGroup).then((remoteObject) => {
                    let text = isElement ? WI.UIString("Selected Element", "Selected DOM element") : WI.UIString("Selected Node", "Selected DOM node");
                    WI.consoleLogViewController.appendImmediateExecutionWithResult(text, remoteObject, {addSpecialUserLogClass: true, shouldRevealConsole: true});
                });
            });
        }

        if (!options.excludeRevealElement && InspectorBackend.hasDomain("DOM") && attached) {
            contextMenu.appendItem(WI.repeatedUIString.revealInDOMTree(), () => {
                WI.domManager.inspectElement(domNode.id, {
                    initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                });
            });
        }

        if (InspectorBackend.hasDomain("LayerTree") && attached) {
            contextMenu.appendItem(WI.UIString("Reveal in Layers Tab", "Open Layers tab and select the layer corresponding to this node"), () => {
                WI.showLayersTab({
                    nodeToSelect: domNode,
                    initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                });
            });
        }

        if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile) && InspectorBackend.hasCommand("Page.snapshotNode") && attached) {
            contextMenu.appendItem(WI.UIString("Capture Screenshot", "Capture screenshot of the selected DOM node"), () => {
                let target = WI.assumingMainTarget();
                target.PageAgent.snapshotNode(domNode.id, (error, dataURL) => {
                    if (error) {
                        const target = WI.mainTarget;
                        const source = WI.ConsoleMessage.MessageSource.Other;
                        const level = WI.ConsoleMessage.MessageLevel.Error;
                        let consoleMessage = new WI.ConsoleMessage(target, source, level, error);
                        consoleMessage.shouldRevealConsole = true;

                        WI.consoleLogViewController.appendConsoleMessage(consoleMessage);
                        return;
                    }

                    WI.FileUtilities.save(WI.FileUtilities.SaveMode.SingleFile, {
                        content: parseDataURL(dataURL).data,
                        base64Encoded: true,
                        suggestedName: WI.FileUtilities.screenshotString() + ".png",
                    });
                });
            });
        }

        if (isElement && attached) {
            contextMenu.appendItem(WI.UIString("Scroll into View", "Scroll selected DOM node into view on the inspected web page"), () => {
                domNode.scrollIntoView();
            });
        }

        contextMenu.appendSeparator();
    }
};

WI.appendContextMenuItemsForDOMNodeBreakpoints = function(contextMenu, domNode, options = {})
{
    if (contextMenu.__domBreakpointItemsAdded)
        return;

    contextMenu.__domBreakpointItemsAdded = true;

    let breakpoints = WI.domDebuggerManager.domBreakpointsForNode(domNode);

    contextMenu.appendSeparator();

    let subMenu = contextMenu.appendSubMenuItem(WI.UIString("Break on"));

    for (let type of Object.values(WI.DOMBreakpoint.Type)) {
        let label = WI.DOMBreakpoint.displayNameForType(type);
        let breakpoint = breakpoints.find((breakpoint) => breakpoint.type === type);

        subMenu.appendCheckboxItem(label, function() {
            if (breakpoint)
                WI.domDebuggerManager.removeDOMBreakpoint(breakpoint);
            else
                WI.domDebuggerManager.addDOMBreakpoint(new WI.DOMBreakpoint(domNode, type));
        }, !!breakpoint);
    }

    if (breakpoints.length && !WI.isShowingSourcesTab()) {
        contextMenu.appendItem(breakpoints.length === 1 ? WI.UIString("Reveal Breakpoint in Sources Tab") : WI.UIString("Reveal Breakpoints in Sources Tab"), () => {
            WI.showSourcesTab({
                representedObjectToSelect: breakpoints.length === 1 ? breakpoints[0] : domNode,
            });
        });
    }

    contextMenu.appendSeparator();

    if (breakpoints.length === 1)
        WI.BreakpointPopover.appendContextMenuItems(contextMenu, breakpoints[0], options.popoverTargetElement);
    else if (breakpoints.length) {
        let shouldEnable = breakpoints.some((breakpoint) => breakpoint.disabled);
        contextMenu.appendItem(shouldEnable ? WI.UIString("Enable Breakpoints") : WI.UIString("Disable Breakpoints"), () => {
            for (let breakpoint of breakpoints)
                breakpoint.disabled = !shouldEnable;
        });

        contextMenu.appendItem(WI.UIString("Delete Breakpoints"), () => {
            for (let breakpoint of breakpoints)
                WI.domDebuggerManager.removeDOMBreakpoint(breakpoint);
        });

        contextMenu.appendSeparator();
    }

    let subtreeBreakpoints = WI.domDebuggerManager.domBreakpointsInSubtree(domNode);
    if (subtreeBreakpoints.length) {
        if (options.revealDescendantBreakpointsMenuItemHandler)
            contextMenu.appendItem(WI.UIString("Reveal Descendant Breakpoints"), options.revealDescendantBreakpointsMenuItemHandler);

        let subtreeShouldEnable = subtreeBreakpoints.some((breakpoint) => breakpoint.disabled);
        contextMenu.appendItem(subtreeShouldEnable ? WI.UIString("Enable Descendant Breakpoints") : WI.UIString("Disable Descendant Breakpoints"), () => {
            for (let subtreeBreakpoint of subtreeBreakpoints)
                subtreeBreakpoint.disabled = !subtreeShouldEnable;
        });

        contextMenu.appendItem(WI.UIString("Delete Descendant Breakpoints"), () => {
            for (let subtreeBreakpoint of subtreeBreakpoints)
                WI.domDebuggerManager.removeDOMBreakpoint(subtreeBreakpoint);
        });

        contextMenu.appendSeparator();
    }
};
