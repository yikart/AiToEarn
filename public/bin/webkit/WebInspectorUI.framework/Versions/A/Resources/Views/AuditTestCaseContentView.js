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

WI.AuditTestCaseContentView = class AuditTestCaseContentView extends WI.AuditTestContentView
{
    constructor(representedObject)
    {
        console.assert(representedObject instanceof WI.AuditTestCase || representedObject instanceof WI.AuditTestCaseResult);

        super(representedObject);

        this.element.classList.add("audit-test-case");

        this._resultDataGeneralContainer = null;
        this._resultDataDOMNodesContainer = null;
        this._resultDataErrorsContainer = null;
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        let informationContainer = this.headerView.element.appendChild(document.createElement("div"));
        informationContainer.classList.add("information");

        let nameContainer = informationContainer.appendChild(document.createElement("h1"));

        this._resultImageElement = nameContainer.appendChild(document.createElement("img"));

        nameContainer.appendChild(this.createNameElement("span"));

        informationContainer.appendChild(this.createDescriptionElement("p"));

        if (this.representedObject instanceof WI.AuditTestCase)
            informationContainer.appendChild(this.createControlsTableElement());

        this._metadataElement = this.headerView.element.appendChild(document.createElement("div"));
        this._metadataElement.classList.add("metadata");
    }

    layout()
    {
        if (this.layoutReason !== WI.View.LayoutReason.Dirty)
            return;

        super.layout();

        this._metadataElement.removeChildren();
        this.contentView.element.removeChildren();

        if (WI.auditManager.editing) {
            this._resultImageElement.src = "Images/Pencil.svg";
            this._resultImageElement.title = WI.UIString("Editing audit", "Editing Audit @ Audit Tab - Test Case", "Title of icon indiciating that the selected audit is being edited.");

            let testEditorElement = this.contentView.element.appendChild(document.createElement("div"));
            testEditorElement.className = "editor";

            // Give the rest of the view a chance to load.
            setTimeout(() => {
                this._testCodeMirror = WI.CodeMirrorEditor.create(testEditorElement, {
                    autoCloseBrackets: true,
                    lineNumbers: true,
                    lineWrapping: true,
                    matchBrackets: true,
                    mode: "text/javascript",
                    readOnly: this.representedObject.editable ? false : "nocursor",
                    styleSelectedText: true,
                    value: this.representedObject.test,
                });
            });
            return;
        }

        this._resultImageElement.src = "Images/AuditTestNoResult.svg";
        this._resultImageElement.title = WI.UIString("Not yet run", "Not yet run @ Audit Tab - Test Case", "Title of icon indicating that the selected audit has not been run yet.");

        let result = this.representedObject.result;
        if (!result) {
            if (this.representedObject.runningState === WI.AuditManager.RunningState.Inactive)
                this.showNoResultPlaceholder();
            else if (this.representedObject.runningState === WI.AuditManager.RunningState.Active)
                this.showRunningPlaceholder();
            else if (this.representedObject.runningState === WI.AuditManager.RunningState.Stopping)
                this.showStoppingPlaceholder();

            return;
        }

        if (result.didError) {
            this._resultImageElement.src = "Images/AuditTestError.svg";
            this._resultImageElement.title = WI.UIString("Error", "Error @ Audit Tab - Test Case", "Title of icon indicating that the selected audit threw an error.");
        } else if (result.didFail) {
            this._resultImageElement.src = "Images/AuditTestFail.svg";
            this._resultImageElement.title = WI.UIString("Fail", "Fail @ Audit Tab - Test Case", "Title of icon indicating that the selected audit failed.");
        } else if (result.didWarn) {
            this._resultImageElement.src = "Images/AuditTestWarn.svg";
            this._resultImageElement.title = WI.UIString("Warn", "Warn @ Audit Tab - Test Case", "Title of icon indicating that the selected audit passed with issues (i.e. warnings).");
        } else if (result.didPass) {
            this._resultImageElement.src = "Images/AuditTestPass.svg";
            this._resultImageElement.title = WI.UIString("Pass", "Pass @ Audit Tab - Test Case", "Title of icon indicating that the selected audit passed with no issues.");
        } else if (result.unsupported) {
            this._resultImageElement.src = "Images/AuditTestUnsupported.svg";
            this._resultImageElement.title = WI.UIString("Unsupported", "Unsupported @ Audit Tab - Test Case", "Title of icon indicating that the selected audit is not able to be run (i.e. unsupported).");
        }

        let metadata = result.metadata;
        if (metadata) {
            let sourceContainer = this._metadataElement.appendChild(document.createElement("div"));
            sourceContainer.classList.add("source");

            if (metadata.startTimestamp) {
                let timeElement = sourceContainer.appendChild(document.createElement("time"));
                timeElement.datetime = metadata.startTimestamp.toISOString();
                timeElement.textContent = metadata.startTimestamp.toLocaleString();

                if (metadata.endTimestamp) {
                    let totalDuration = Number.secondsToString((metadata.endTimestamp - metadata.startTimestamp) / 1000);

                    let durationElement = this._metadataElement.appendChild(document.createElement("span"));
                    durationElement.classList.add("duration");
                    durationElement.textContent = totalDuration;

                    if (metadata.asyncTimestamp) {
                        let evalDuration = Number.secondsToString((metadata.asyncTimestamp - metadata.startTimestamp) / 1000);
                        let asyncDuration = Number.secondsToString((metadata.endTimestamp - metadata.asyncTimestamp) / 1000);

                        durationElement.classList.add("async");
                        durationElement.title = WI.UIString("%s eval\n%s async").format(evalDuration, asyncDuration);
                    }
                }
            }

            if (metadata.url && (metadata.url !== WI.networkManager.mainFrame.url || this.representedObject instanceof WI.AuditTestResultBase)) {
                let url = new URL(metadata.url);
                let origin = url.origin;
                if (url.pathname.startsWith("/"))
                    origin += "/";
                let linkElement = WI.linkifyURLAsNode(url.href, origin + url.href.substring(origin.length).truncateStart(20));
                linkElement.title = url.href;
                sourceContainer.appendChild(linkElement);
            }
        }

        let resultData = result.data;

        if (!this._resultDataGeneralContainer) {
            let nonSpecialData = Object.filter(resultData, (key) => key !== "domNodes" && key !== "errors");
            if (!isEmptyObject(nonSpecialData)) {
                this._resultDataGeneralContainer = document.createElement("div");

                let expression = "(" + JSON.stringify(nonSpecialData) + ")";
                const options = {
                    objectGroup: WI.AuditTestBase.ObjectGroup,
                    doNotPauseOnExceptionsAndMuteConsole: true,
                };
                WI.runtimeManager.evaluateInInspectedWindow(expression, options, (nonSpecialDataRemoteObject, wasThrown) => {
                    console.assert(!wasThrown);
                    if (!nonSpecialDataRemoteObject)
                        return;

                    if (!this.representedObject.result || this.representedObject.result.data !== resultData)
                        return;

                    const propertyPath = null;
                    const forceExpanding = true;
                    let element = WI.FormattedValue.createObjectTreeOrFormattedValueForRemoteObject(nonSpecialDataRemoteObject, propertyPath, forceExpanding);

                    let objectTree = element.__objectTree;
                    if (objectTree) {
                        objectTree.showOnlyJSON();
                        objectTree.expand();
                    }

                    this._resultDataGeneralContainer.appendChild(element);

                    this.hidePlaceholder();
                });
            }
        }

        if (this._resultDataGeneralContainer)
            this.contentView.element.appendChild(this._resultDataGeneralContainer);

        if (!this._resultDataDOMNodesContainer && resultData.domNodes && resultData.domNodes.length) {
            this._resultDataDOMNodesContainer = document.createElement("div");
            this._resultDataDOMNodesContainer.classList.add("dom-nodes");

            let domNodeText = this._resultDataDOMNodesContainer.appendChild(document.createElement("h1"));
            domNodeText.textContent = WI.UIString("DOM Nodes:");

            let tableContainer = this._resultDataDOMNodesContainer.appendChild(document.createElement("table"));

            resultData.domNodes.forEach((domNode, index) => {
                domNode = result.resolvedDOMNodes[index] || domNode;

                let rowElement = tableContainer.appendChild(document.createElement("tr"));

                let indexElement = rowElement.appendChild(document.createElement("td"));
                indexElement.textContent = index + 1;

                let dataElement = rowElement.appendChild(document.createElement("td"));

                if (domNode instanceof WI.DOMNode) {
                    let treeOutline = new WI.DOMTreeOutline({selectable: false});
                    treeOutline.setVisible(true);
                    treeOutline.rootDOMNode = domNode;

                    let rootTreeElement = treeOutline.children[0];
                    rootTreeElement.showGoToArrow = true;
                    if (!rootTreeElement.hasChildren)
                        treeOutline.element.classList.add("single-node");

                    if (resultData.domAttributes) {
                        for (let domAttribute of resultData.domAttributes) {
                            rootTreeElement.highlightAttribute(domAttribute);
                            rootTreeElement.updateTitle();
                        }
                    }

                    dataElement.appendChild(treeOutline.element);
                } else if (typeof domNode === "string") {
                    let codeMirror = WI.CodeMirrorEditor.create(dataElement.appendChild(document.createElement("code")), {
                        mode: "css",
                        readOnly: true,
                        lineWrapping: true,
                        styleSelectedText: true,
                    });
                    codeMirror.setValue(domNode);

                    if (resultData.domAttributes) {
                        for (let domAttribute of resultData.domAttributes) {
                            let regex = null;
                            if (domAttribute === "id")
                                regex = /(\#[^\#|\.|\[|\s|$]+)/g;
                            else if (domAttribute === "class")
                                regex = /(\.[^\#|\.|\[|\s|$]+)/g;
                            else
                                regex = new RegExp(`\\[\\s*(${domAttribute})\\s*=`, "g");

                            while (true) {
                                let match = regex.exec(domNode);
                                if (!match)
                                    break;

                                let start = match.index + match[0].indexOf(match[1]);
                                codeMirror.markText({line: 0, ch: start}, {line: 0, ch: start + match[1].length}, {className: "mark"});
                            }
                        }
                    }

                    setTimeout(() => {
                        codeMirror.refresh();
                    });
                }
            });
        }

        if (this._resultDataDOMNodesContainer)
            this.contentView.element.appendChild(this._resultDataDOMNodesContainer);

        if (!this._resultDataErrorsContainer && resultData.errors && resultData.errors.length) {
            this._resultDataErrorsContainer = document.createElement("div");
            this._resultDataErrorsContainer.classList.add("errors");

            let errorText = this._resultDataErrorsContainer.appendChild(document.createElement("h1"));
            errorText.textContent = WI.UIString("Errors:");

            let tableContainer = this._resultDataErrorsContainer.appendChild(document.createElement("table"));

            resultData.errors.forEach((error, index) => {
                let rowElement = tableContainer.appendChild(document.createElement("tr"));

                let indexElement = rowElement.appendChild(document.createElement("td"));
                indexElement.textContent = index + 1;

                let dataElement = rowElement.appendChild(document.createElement("td"));

                let errorElement = dataElement.appendChild(document.createElement("div"));
                errorElement.classList.add("error");
                errorElement.textContent = error;
            });
        }

        if (this._resultDataErrorsContainer)
            this.contentView.element.appendChild(this._resultDataErrorsContainer);

        if (!this.contentView.element.children.length)
            this.showNoResultDataPlaceholder();
    }

    handleResultChanged(event)
    {
        super.handleResultChanged(event);

        this._resultDataGeneralContainer = null;
        this._resultDataDOMNodesContainer = null;
        this._resultDataErrorsContainer = null;
    }

    saveEditedData()
    {
        super.saveEditedData();

        this.representedObject.test = this._testCodeMirror.getValue().trim();
    }

    showRunningPlaceholder()
    {
        if (!this.placeholderElement || !this.placeholderElement.__placeholderRunning) {
            this.placeholderElement = WI.createMessageTextView(WI.UIString("Running the \u201C%s\u201D audit").format(this.representedObject.name));
            this.placeholderElement.__placeholderRunning = true;

            let spinner = new WI.IndeterminateProgressSpinner;
            this.placeholderElement.appendChild(spinner.element);

            let stopAuditNavigationItem = new WI.ButtonNavigationItem("stop-audit", WI.UIString("Stop"), "Images/AuditStop.svg", 13, 13);
            stopAuditNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
            stopAuditNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, function(event) {
                WI.auditManager.stop();
            }, stopAuditNavigationItem);

            let stopAuditHelpElement = WI.createNavigationItemHelp(WI.UIString("Press %s to stop running."), stopAuditNavigationItem);
            this.placeholderElement.appendChild(stopAuditHelpElement);

            this.placeholderElement.appendChild(WI.ReferencePage.AuditTab.RunningAudits.createLinkElement());
        }

        super.showRunningPlaceholder();
    }
};
