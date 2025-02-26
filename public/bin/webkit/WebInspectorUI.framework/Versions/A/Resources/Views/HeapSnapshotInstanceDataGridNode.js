/*
* Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.HeapSnapshotInstanceDataGridNode = class HeapSnapshotInstanceDataGridNode extends WI.DataGridNode
{
    constructor(node, tree, edge, base)
    {
        // Don't treat strings as having child nodes, even if they have a Structure.
        let hasChildren = node.hasChildren && node.className !== "string";

        // FIXME: Make instance grid nodes copyable.
        super(node, {hasChildren, copyable: false});

        console.assert(node instanceof WI.HeapSnapshotNodeProxy);
        console.assert(!edge || edge instanceof WI.HeapSnapshotEdgeProxy);
        console.assert(!base || base instanceof WI.HeapSnapshotInstanceDataGridNode);

        this._node = node;
        this._tree = tree;
        this._edge = edge || null;
        this._base = base || null;

        if (hasChildren)
            this.addEventListener(WI.DataGridNode.Event.Populate, this._populate, this);
    }

    // Static

    static logHeapSnapshotNode(node)
    {
        node.shortestGCRootPath((gcRootPath) => {
            let text = WI.UIString("Heap Snapshot Object (%s)").format("@" + node.id);
            let addSpecialUserLogClass = !gcRootPath.length;

            if (gcRootPath.length) {
                gcRootPath = gcRootPath.slice().reverse();
                let windowIndex = gcRootPath.findIndex((x) => {
                    return x instanceof WI.HeapSnapshotNodeProxy && x.className === "Window";
                });

                let heapSnapshotRootPath = WI.HeapSnapshotRootPath.emptyPath();
                for (let i = windowIndex === -1 ? 0 : windowIndex; i < gcRootPath.length; ++i) {
                    let component = gcRootPath[i];
                    if (component instanceof WI.HeapSnapshotNodeProxy) {
                        if (component.className === "Window")
                            heapSnapshotRootPath = heapSnapshotRootPath.appendGlobalScopeName(component, "window");
                    } else if (component instanceof WI.HeapSnapshotEdgeProxy)
                        heapSnapshotRootPath = heapSnapshotRootPath.appendEdge(component);
                }

                if (heapSnapshotRootPath.isFullPathImpossible())
                    addSpecialUserLogClass = true;
                else
                    text = heapSnapshotRootPath.fullPath;
            }

            const shouldRevealConsole = true;

            if (node.className === "string") {
                WI.heapManager.getPreview(node, function(error, string, functionDetails, objectPreviewPayload) {
                    let remoteObject = error ? WI.RemoteObject.fromPrimitiveValue(undefined) : WI.RemoteObject.fromPrimitiveValue(string);
                    WI.consoleLogViewController.appendImmediateExecutionWithResult(text, remoteObject, {addSpecialUserLogClass, shouldRevealConsole});
                });
            } else {
                WI.heapManager.getRemoteObject(node, WI.RuntimeManager.ConsoleObjectGroup, function(error, remoteObjectPayload) {
                    let remoteObject = error ? WI.RemoteObject.fromPrimitiveValue(undefined) : WI.RemoteObject.fromPayload(remoteObjectPayload, WI.assumingMainTarget());
                    WI.consoleLogViewController.appendImmediateExecutionWithResult(text, remoteObject, {addSpecialUserLogClass, shouldRevealConsole});
                });
            }
        });
    }

    // Protected

    get data() { return this._node; }
    get node() { return this._node; }

    get propertyName()
    {
        if (!this._edge)
            return "";

        if (!this._propertyName)
            this._propertyName = WI.HeapSnapshotRootPath.pathComponentForIndividualEdge(this._edge);
        return this._propertyName;
    }

    createCells()
    {
        super.createCells();

        this.element.classList.add("instance");
    }

    createCellContent(columnIdentifier)
    {
        if (columnIdentifier === "retainedSize") {
            let subRetainedSize = false;
            if (this._base && !this._tree.alwaysShowRetainedSize) {
                if (this._isDominatedByNonBaseParent())
                    subRetainedSize = true;
                else if (!this._isDominatedByBase())
                    return emDash;
            }

            let size = this._node.retainedSize;
            let fragment = document.createDocumentFragment();
            let sizeElement = fragment.appendChild(document.createElement("span"));
            sizeElement.classList.add("size");
            sizeElement.textContent = Number.bytesToString(size);
            let fraction = size / this._tree._heapSnapshot.totalSize;
            let percentElement = fragment.appendChild(document.createElement("span"));
            percentElement.classList.add("percentage");
            percentElement.textContent = Number.percentageString(fraction);

            if (subRetainedSize) {
                sizeElement.classList.add("sub-retained");
                percentElement.classList.add("sub-retained");
            }

            return fragment;
        }

        if (columnIdentifier === "size")
            return Number.bytesToString(this._node.size);

        if (columnIdentifier === "className") {
            let {className, id, internal, isObjectType} = this._node;
            let containerElement = document.createElement("span");
            containerElement.addEventListener("contextmenu", this._contextMenuHandler.bind(this));

            let iconElement = containerElement.appendChild(document.createElement("img"));
            iconElement.classList.add("icon", WI.HeapSnapshotClusterContentView.iconStyleClassNameForClassName(className, internal, isObjectType));

            if (this._edge) {
                let nameElement = containerElement.appendChild(document.createElement("span"));
                let propertyName = this.propertyName;
                if (propertyName)
                    nameElement.textContent = propertyName + ": " + this._node.className + " ";
                else
                    nameElement.textContent = this._node.className + " ";
            }

            let idElement = containerElement.appendChild(document.createElement("span"));
            idElement.classList.add("object-id");
            idElement.textContent = "@" + id;
            idElement.addEventListener("click", WI.HeapSnapshotInstanceDataGridNode.logHeapSnapshotNode.bind(null, this._node));
            idElement.addEventListener("mouseover", this._mouseoverHandler.bind(this));

            let spacerElement = containerElement.appendChild(document.createElement("span"));
            spacerElement.textContent = " ";

            if (className === "Window" && this._node.dominatorNodeIdentifier === 0) {
                containerElement.append("Window ");
                this._populateWindowPreview(containerElement);
            } else
                this._populatePreview(containerElement);

            return containerElement;
        }

        return super.createCellContent(columnIdentifier);
    }

    sort()
    {
        let children = this.children;
        children.sort(this._tree._sortComparator);

        for (let i = 0; i < children.length; ++i) {
            children[i]._recalculateSiblings(i);
            children[i].sort();
        }
    }

    // Private

    _isDominatedByBase()
    {
        return this._node.dominatorNodeIdentifier === this._base.node.id;
    }

    _isDominatedByNonBaseParent()
    {
        for (let p = this.parent; p; p = p.parent) {
            if (p === this._base)
                return false;
            if (this._node.dominatorNodeIdentifier === p.node.id)
                return true;
        }

        return false;
    }

    _populate()
    {
        this.removeEventListener(WI.DataGridNode.Event.Populate, this._populate, this);

        function propertyName(edge) {
            return edge ? WI.HeapSnapshotRootPath.pathComponentForIndividualEdge(edge) : "";
        }

        this._node.retainedNodes((instances, edges) => {
            // Reference edge from instance so we can get it after sorting.
            for (let i = 0; i < instances.length; ++i)
                instances[i].__edge = edges[i];

            instances.sort((a, b) => {
                let fakeDataGridNodeA = {data: a, propertyName: propertyName(a.__edge)};
                let fakeDataGridNodeB = {data: b, propertyName: propertyName(b.__edge)};
                return this._tree._sortComparator(fakeDataGridNodeA, fakeDataGridNodeB);
            });

            // FIXME: This should gracefully handle a node that references many objects.

            for (let instance of instances) {
                if (instance.__edge && instance.__edge.isPrivateSymbol())
                    continue;

                this.appendChild(new WI.HeapSnapshotInstanceDataGridNode(instance, this._tree, instance.__edge, this._base || this));
            }
        });
    }

    _contextMenuHandler(event)
    {
        let contextMenu = WI.ContextMenu.createFromEvent(event);
        contextMenu.appendSeparator();
        contextMenu.appendItem(WI.UIString("Log Value"), WI.HeapSnapshotInstanceDataGridNode.logHeapSnapshotNode.bind(null, this._node));
    }

    _populateError(containerElement)
    {
        if (this._node.internal)
            return;

        let previewErrorElement = containerElement.appendChild(document.createElement("span"));
        previewErrorElement.classList.add("preview-error");
        previewErrorElement.textContent = WI.UIString("No preview available");
    }

    _populateWindowPreview(containerElement)
    {
        const objectGroup = undefined;
        WI.heapManager.getRemoteObject(this._node, objectGroup, (error, remoteObjectPayload) => {
            if (error) {
                this._populateError(containerElement);
                return;
            }

            function inspectedPage_window_getLocationHref() {
                return this.location.href;
            }

            let remoteObject = WI.RemoteObject.fromPayload(remoteObjectPayload, WI.assumingMainTarget());
            remoteObject.callFunctionJSON(inspectedPage_window_getLocationHref, undefined, (href) => {
                remoteObject.release();

                if (!href)
                    this._populateError(containerElement);
                else {
                    let primitiveRemoteObject = WI.RemoteObject.fromPrimitiveValue(href);
                    containerElement.appendChild(WI.FormattedValue.createElementForRemoteObject(primitiveRemoteObject));
                }
            });
        });
    }

    _populatePreview(containerElement)
    {
        WI.heapManager.getPreview(this._node, (error, string, functionDetails, objectPreviewPayload) => {
            if (error) {
                this._populateError(containerElement);
                return;
            }

            if (string) {
                if (this._node.className === "BigInt") {
                    let bigIntRemoteObject = WI.RemoteObject.createBigIntFromDescriptionString(string + "n");
                    containerElement.appendChild(WI.FormattedValue.createElementForRemoteObject(bigIntRemoteObject));
                } else {
                    let primitiveRemoteObject = WI.RemoteObject.fromPrimitiveValue(string);
                    containerElement.appendChild(WI.FormattedValue.createElementForRemoteObject(primitiveRemoteObject));
                }
                return;
            }

            if (functionDetails) {
                let {location, name, displayName} = functionDetails;
                let functionNameElement = containerElement.appendChild(document.createElement("span"));
                functionNameElement.classList.add("function-name");
                functionNameElement.textContent = name || displayName || WI.UIString("(anonymous function)");
                let sourceCode = WI.debuggerManager.scriptForIdentifier(location.scriptId, WI.assumingMainTarget());
                if (sourceCode) {
                    let locationElement = containerElement.appendChild(document.createElement("span"));
                    locationElement.classList.add("location");
                    let sourceCodeLocation = sourceCode.createSourceCodeLocation(location.lineNumber, location.columnNumber);
                    sourceCodeLocation.populateLiveDisplayLocationString(locationElement, "textContent", WI.SourceCodeLocation.ColumnStyle.Hidden, WI.SourceCodeLocation.NameStyle.Short);

                    const options = {
                        dontFloat: true,
                        useGoToArrowButton: true,
                        ignoreNetworkTab: true,
                        ignoreSearchTab: true,
                    };
                    let goToArrowButtonLink = WI.createSourceCodeLocationLink(sourceCodeLocation, options);
                    containerElement.appendChild(goToArrowButtonLink);
                }
                return;
            }

            if (objectPreviewPayload) {
                let objectPreview = WI.ObjectPreview.fromPayload(objectPreviewPayload);
                let previewElement = WI.FormattedValue.createObjectPreviewOrFormattedValueForObjectPreview(objectPreview);
                containerElement.appendChild(previewElement);
                return;
            }
        });
    }

    _mouseoverHandler(event)
    {
        let targetFrame = WI.Rect.rectFromClientRect(event.target.getBoundingClientRect());
        if (!targetFrame.size.width && !targetFrame.size.height)
            return;

        if (this._tree.popoverGridNode === this._node)
            return;

        this._tree.popoverGridNode = this._node;
        this._tree.popoverTargetElement = event.target;

        let popoverContentElement = document.createElement("div");
        popoverContentElement.classList.add("heap-snapshot", "heap-snapshot-instance-popover-content");

        function appendTitle(node) {
            let idElement = document.createElement("span");
            idElement.classList.add("object-id");
            idElement.textContent = "@" + node.id;
            idElement.addEventListener("click", WI.HeapSnapshotInstanceDataGridNode.logHeapSnapshotNode.bind(null, node));

            let title = popoverContentElement.appendChild(document.createElement("div"));
            title.classList.add("title");
            let localizedString = WI.UIString("Shortest property path to %s").format("@@@");
            let [before, after] = localizedString.split(/\s*@@@\s*/);
            title.append(before + " ", idElement, " " + after);
        }

        function appendPath(path) {
            let tableContainer = popoverContentElement.appendChild(document.createElement("div"));
            tableContainer.classList.add("table-container");

            let tableElement = tableContainer.appendChild(document.createElement("table"));

            path = path.slice().reverse();
            let windowIndex = path.findIndex((x) => {
                return x instanceof WI.HeapSnapshotNodeProxy && x.className === "Window";
            });

            let edge = null;
            for (let i = windowIndex === -1 ? 0 : windowIndex; i < path.length; ++i) {
                let component = path[i];
                if (component instanceof WI.HeapSnapshotEdgeProxy) {
                    edge = component;
                    continue;
                }
                appendPathRow(tableElement, edge, component);
                edge = null;
            }
        }

        function appendPathRow(tableElement, edge, node) {
            let tableRow = tableElement.appendChild(document.createElement("tr"));

            // Edge name.
            let pathDataElement = tableRow.appendChild(document.createElement("td"));
            pathDataElement.classList.add("edge-name");

            if (node.className === "Window")
                pathDataElement.textContent = "window";
            else if (edge) {
                let edgeString = stringifyEdge(edge);
                pathDataElement.textContent = typeof edgeString === "string" ? edgeString : emDash;
            } else
                pathDataElement.textContent = emDash;

            if (pathDataElement.textContent.length > 10)
                pathDataElement.title = pathDataElement.textContent;

            // Object.
            let objectDataElement = tableRow.appendChild(document.createElement("td"));
            objectDataElement.classList.add("object-data");

            let containerElement = objectDataElement.appendChild(document.createElement("div"));
            containerElement.classList.add("node");

            let iconElement = containerElement.appendChild(document.createElement("img"));
            iconElement.classList.add("icon", WI.HeapSnapshotClusterContentView.iconStyleClassNameForClassName(node.className, node.internal, node.isObjectType));

            let classNameElement = containerElement.appendChild(document.createElement("span"));
            classNameElement.textContent = sanitizeClassName(node.className) + " ";

            let idElement = containerElement.appendChild(document.createElement("span"));
            idElement.classList.add("object-id");
            idElement.textContent = "@" + node.id;
            idElement.addEventListener("click", WI.HeapSnapshotInstanceDataGridNode.logHeapSnapshotNode.bind(null, node));

            // Extra.
            if (node.className === "Function") {
                let goToArrowPlaceHolderElement = containerElement.appendChild(document.createElement("span"));
                goToArrowPlaceHolderElement.style.display = "inline-block";
                goToArrowPlaceHolderElement.style.width = "10px";
                WI.heapManager.getPreview(node, function(error, string, functionDetails, objectPreviewPayload) {
                    if (functionDetails) {
                        let location = functionDetails.location;
                        let sourceCode = WI.debuggerManager.scriptForIdentifier(location.scriptId, WI.assumingMainTarget());
                        if (sourceCode) {
                            let sourceCodeLocation = sourceCode.createSourceCodeLocation(location.lineNumber, location.columnNumber);

                            const options = {
                                dontFloat: true,
                                useGoToArrowButton: true,
                                ignoreNetworkTab: true,
                                ignoreSearchTab: true,
                            };
                            let goToArrowButtonLink = WI.createSourceCodeLocationLink(sourceCodeLocation, options);
                            containerElement.replaceChild(goToArrowButtonLink, goToArrowPlaceHolderElement);
                        }
                    }
                });
            }
        }

        function sanitizeClassName(className) {
            if (className.endsWith("LexicalEnvironment"))
                return WI.UIString("Scope");
            return className;
        }

        function stringifyEdge(edge) {
            switch (edge.type) {
            case WI.HeapSnapshotEdgeProxy.EdgeType.Property:
            case WI.HeapSnapshotEdgeProxy.EdgeType.Variable:
                if (/^(?![0-9])\w+$/.test(edge.data))
                    return edge.data;
                return "[" + doubleQuotedString(edge.data) + "]";
            case WI.HeapSnapshotEdgeProxy.EdgeType.Index:
                return "[" + edge.data + "]";
            case WI.HeapSnapshotEdgeProxy.EdgeType.Internal:
            default:
                return null;
            }
        }

        this._node.shortestGCRootPath((path) => {
            if (!this._tree.visible)
                return;

            if (path.length) {
                appendTitle(this._node);
                appendPath(path);
            } else if (this._node.gcRoot) {
                let textElement = popoverContentElement.appendChild(document.createElement("div"));
                textElement.textContent = WI.UIString("This object is a root");
            } else {
                let emptyElement = popoverContentElement.appendChild(document.createElement("div"));
                emptyElement.textContent = WI.UIString("This object is referenced by internal objects");
            }

            this._tree.popover.presentNewContentWithFrame(popoverContentElement, targetFrame.pad(2), [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
        });
    }
};
