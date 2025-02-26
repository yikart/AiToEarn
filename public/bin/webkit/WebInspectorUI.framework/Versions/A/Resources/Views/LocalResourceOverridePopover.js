/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

WI.LocalResourceOverridePopover = class LocalResourceOverridePopover extends WI.Popover
{
    constructor(delegate)
    {
        super(delegate);

        this._typeSelectElement = null;
        this._urlCodeMirror = null;
        this._isCaseSensitiveCheckbox = null;
        this._isRegexCheckbox = null;
        this._isPassthroughCheckbox = null;
        this._requestURLCodeMirror = null;
        this._mappedDirectorySubpathCodeMirror = null;
        this._mappedDirectoryPathValueElement = null;
        this._methodSelectElement = null;
        this._mimeTypeCodeMirror = null;
        this._statusCodeCodeMirror = null;
        this._statusTextCodeMirror = null;
        this._headersDataGrid = null;
        this._mappedFilePathValueElement = null;
        this._skipNetworkCheckbox = null;

        this._originalRequestURL = null;
        this._serializedDataWhenShown = null;

        this.windowResizeHandler = this._presentOverTargetElement.bind(this);
    }

    // Public

    get serializedData()
    {
        if (!this._targetElement)
            return null;

        // COMPATIBILITY (iOS 13.4): `Network.addInterception` did not exist yet.
        let data = {
            type: this._typeSelectElement.value,
            url: this._urlCodeMirror.getValue(),
            isCaseSensitive: !this._isCaseSensitiveCheckbox || this._isCaseSensitiveCheckbox.checked,
            isRegex: !!this._isRegexCheckbox?.checked,
            isPassthrough: this._isPassthroughCheckbox.checked,
        };

        if (data.type === WI.LocalResourceOverride.InterceptType.Response && this._skipNetworkCheckbox?.checked)
            data.type = WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork;

        if (!data.url)
            return null;

        if (!data.isRegex) {
            const schemes = ["http:", "https:", "file:"];
            if (!schemes.some((scheme) => data.url.toLowerCase().startsWith(scheme)))
                return null;
        }

        let headers = {};
        for (let node of this._headersDataGrid.children) {
            let {name, value} = node.data;
            if (!name || !value)
                continue;
            if (data.type === WI.LocalResourceOverride.InterceptType.Response || data.type === WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork) {
                if (name.toLowerCase() === "content-type")
                    continue;
                if (name.toLowerCase() === "set-cookie")
                    continue;
            }
            headers[name] = value;
        }

        switch (data.type) {
        case WI.LocalResourceOverride.InterceptType.Request:
            data.requestURL = this._requestURLCodeMirror.getValue();
            data.requestMethod = this._methodSelectElement.value || "";
            data.requestHeaders = headers;
            break;

        case WI.LocalResourceOverride.InterceptType.Response:
        case WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork:
            // NOTE: We can allow an empty mimeType / statusCode / statusText to pass
            // network values through, but lets require them for overrides so that
            // the popover doesn't have to have an additional state for "pass through".

            data.responseMIMEType = this._mimeTypeCodeMirror.getValue() || this._mimeTypeCodeMirror.getOption("placeholder");
            if (!data.responseMIMEType)
                return null;

            data.responseStatusCode = parseInt(this._statusCodeCodeMirror.getValue());
            if (isNaN(data.responseStatusCode))
                data.responseStatusCode = parseInt(this._statusCodeCodeMirror.getOption("placeholder"));
            if (isNaN(data.responseStatusCode) || data.responseStatusCode < 0)
                return null;

            data.responseStatusText = this._statusTextCodeMirror.getValue() || this._statusTextCodeMirror.getOption("placeholder");
            if (!data.responseStatusText)
                return null;

            data.responseHeaders = headers;

            data.mappedFilePath = this._mappedFilePathValueElement.textContent;
            break;

        case WI.LocalResourceOverride.InterceptType.ResponseMappedDirectory:
            data.requestURL = this._mappedDirectorySubpathCodeMirror.getValue();
            if (!data.requestURL)
                return null;

            data.mappedFilePath = this._mappedDirectoryPathValueElement.textContent;
            if (!data.mappedFilePath)
                return null;

            break;
        }

        if (!data.requestURL) {
            if (data.isCaseSensitive && !data.isRegex)
                data.requestURL = data.url;
            else if (this._originalRequestURL)
                data.requestURL = this._originalRequestURL;
        }

        if (!data.responseMIMEType && data.requestURL) {
            data.responseMIMEType = WI.mimeTypeForFileExtension(WI.fileExtensionForURL(data.requestURL));
            if (data.type === WI.LocalResourceOverride.InterceptType.Response || data.type === WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork)
                headers["Content-Type"] = data.responseMIMEType;
        }

        // No change.
        let oldSerialized = JSON.stringify(this._serializedDataWhenShown);
        let newSerialized = JSON.stringify(data);
        if (oldSerialized === newSerialized)
            return null;

        return data;
    }

    show(localResourceOverride, targetElement, preferredEdges)
    {
        this._targetElement = targetElement;
        this._preferredEdges = preferredEdges;

        let localResource = localResourceOverride ? localResourceOverride.localResource : null;

        let placeholderData = {};
        let valueData = {};
        if (localResource) {
            placeholderData.url = valueData.url = localResourceOverride.url;
            placeholderData.requestURL = valueData.requestURL = localResource.url;
            placeholderData.method = valueData.method = localResource.requestMethod;
            placeholderData.mimeType = valueData.mimeType = localResource.mimeType;
            placeholderData.statusCode = valueData.statusCode = String(localResource.statusCode);
            placeholderData.statusText = valueData.statusText = localResource.statusText;
            placeholderData.mappedFilePath = valueData.mappedFilePath = localResource.mappedFilePath;
        }

        placeholderData.url ||= this._defaultURL();
        placeholderData.requestURL ||= placeholderData.url;
        placeholderData.method ??= WI.HTTPUtilities.RequestMethod.GET;
        placeholderData.mimeType ||= "text/javascript";
        if (!placeholderData.statusCode || placeholderData.statusCode === "NaN") {
            placeholderData.statusCode = "200";
            placeholderData.statusText = undefined;
            valueData.statusCode = undefined;
            valueData.statusText = undefined;
        }
        if (!placeholderData.statusText) {
            placeholderData.statusText = WI.HTTPUtilities.statusTextForStatusCode(parseInt(placeholderData.statusCode));
            valueData.statusText = undefined;
        }

        let requestHeaders = localResource?.requestHeaders ?? {};
        let responseHeaders = localResource?.responseHeaders ?? {};

        let popoverContentElement = document.createElement("div");
        popoverContentElement.className = "local-resource-override-popover-content";

        let table = popoverContentElement.appendChild(document.createElement("table"));

        function createEditorId(id) {
            return `local-resource-override-popover-${id}-input-field`;
        }

        let createRow = (label, id, value, placeholder) => {
            let row = table.appendChild(document.createElement("tr"));
            let headerElement = row.appendChild(document.createElement("th"));
            let dataElement = row.appendChild(document.createElement("td"));

            let labelElement = headerElement.appendChild(document.createElement("label"));
            labelElement.textContent = label;

            let editorElement = dataElement.appendChild(document.createElement("div"));
            editorElement.classList.add("editor", id);

            let codeMirror = this._createEditor(editorElement, {value, placeholder});
            let inputField = codeMirror.getInputField();
            inputField.id = createEditorId(id);
            labelElement.setAttribute("for", inputField.id);

            return {element: row, dataElement, codeMirror};
        };

        this._typeSelectElement = document.createElement("select");

        let createOption = (type, label) => {
            let optionElement = document.createElement("option");
            optionElement.textContent = label ?? WI.LocalResourceOverride.displayNameForType(type);
            optionElement.value = type;
            return optionElement;
        };
        if (WI.NetworkManager.supportsOverridingRequests())
            this._typeSelectElement.appendChild(createOption(WI.LocalResourceOverride.InterceptType.Request));
        if (WI.LocalResource.canMapToFile()) {
            let optionGroupElement = this._typeSelectElement.appendChild(document.createElement("optgroup"));
            optionGroupElement.label = WI.LocalResourceOverride.displayNameForType(WI.LocalResourceOverride.InterceptType.Response);
            optionGroupElement.appendChild(createOption(WI.LocalResourceOverride.InterceptType.Response, WI.UIString("File", "File @ Local Override Type", "Option for creating a local override for a single file.")));
            optionGroupElement.appendChild(createOption(WI.LocalResourceOverride.InterceptType.ResponseMappedDirectory, WI.UIString("Directory", "Directory @ Local Override Type", "Option for creating a local override for an entire directory.")));
        } else
            this._typeSelectElement.appendChild(createOption(WI.LocalResourceOverride.InterceptType.Response));
        if (WI.NetworkManager.supportsBlockingRequests())
            this._typeSelectElement.appendChild(createOption(WI.LocalResourceOverride.InterceptType.Block));

        this._typeSelectElement.value = localResourceOverride?.type ?? this._typeSelectElement.options[0].value;
        if (localResourceOverride?.type === WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork)
            this._typeSelectElement.value = WI.LocalResourceOverride.InterceptType.Response;

        if (!localResourceOverride && this._typeSelectElement.options.length > 1) {
            let typeRowElement = table.appendChild(document.createElement("tr"));

            let typeHeaderElement = typeRowElement.appendChild(document.createElement("th"));

            let typeLabelElement = typeHeaderElement.appendChild(document.createElement("label"));
            typeLabelElement.textContent = WI.UIString("Type");

            let typeDataElement = typeRowElement.appendChild(document.createElement("td"));
            typeDataElement.appendChild(this._typeSelectElement);

            this._typeSelectElement.addEventListener("change", (event) => {
                toggleInputsForType();
                this.update();
            });

            this._typeSelectElement.id = "local-resource-override-popover-type-input-field";
            typeLabelElement.setAttribute("for", this._typeSelectElement.id);
        }

        let urlRow = createRow(WI.UIString("URL"), "url", valueData.url || "", placeholderData.url);
        this._urlCodeMirror = urlRow.codeMirror;

        let updateURLCodeMirrorMode = () => {
            let isRegex = this._isRegexCheckbox && this._isRegexCheckbox.checked;

            this._urlCodeMirror.setOption("mode", isRegex ? "text/x-regex" : "text/x-local-override-url");

            if (!isRegex) {
                let url = this._urlCodeMirror.getValue();
                if (url) {
                    const schemes = ["http:", "https:", "file:"];
                    if (!schemes.some((scheme) => url.toLowerCase().startsWith(scheme)))
                        this._urlCodeMirror.setValue("http://" + url);
                }
            }
        };

        // COMPATIBILITY (iOS 13.4): `Network.addInterception` did not exist yet.
        if (InspectorBackend.hasCommand("Network.addInterception", "caseSensitive")) {
            let isCaseSensitiveLabel = urlRow.dataElement.appendChild(document.createElement("label"));
            isCaseSensitiveLabel.className = "is-case-sensitive";

            this._isCaseSensitiveCheckbox = isCaseSensitiveLabel.appendChild(document.createElement("input"));
            this._isCaseSensitiveCheckbox.type = "checkbox";
            this._isCaseSensitiveCheckbox.checked = localResourceOverride ? localResourceOverride.isCaseSensitive : true;

            isCaseSensitiveLabel.append(WI.UIString("Case Sensitive"));
        }

        // COMPATIBILITY (iOS 13.4): `Network.addInterception` did not exist yet.
        if (InspectorBackend.hasCommand("Network.addInterception", "isRegex")) {
            let isRegexLabel = urlRow.dataElement.appendChild(document.createElement("label"));
            isRegexLabel.className = "is-regex";

            this._isRegexCheckbox = isRegexLabel.appendChild(document.createElement("input"));
            this._isRegexCheckbox.type = "checkbox";
            this._isRegexCheckbox.checked = localResourceOverride ? localResourceOverride.isRegex : false;
            this._isRegexCheckbox.addEventListener("change", (event) => {
                updateURLCodeMirrorMode();
            });

            isRegexLabel.append(WI.UIString("Regular Expression"));
        }

        let requestURLRow = null;
        let methodRowElement = null;
        let updateMethodOptions = null;
        if (WI.NetworkManager.supportsOverridingRequests()) {
            requestURLRow = createRow(WI.UIString("Redirect"), "redirect", valueData.requestURL || "", placeholderData.requestURL);
            this._requestURLCodeMirror = requestURLRow.codeMirror;

            methodRowElement = table.appendChild(document.createElement("tr"));

            let methodHeaderElement = methodRowElement.appendChild(document.createElement("th"));

            let methodLabelElement = methodHeaderElement.appendChild(document.createElement("label"));
            methodLabelElement.textContent = WI.UIString("Method");

            let methodDataElement = methodRowElement.appendChild(document.createElement("td"));

            this._methodSelectElement = methodDataElement.appendChild(document.createElement("select"));

            updateMethodOptions = () => {
                let isPassthrough = !!this._isPassthroughCheckbox?.checked;

                let oldValue = this._methodSelectElement.value;

                this._methodSelectElement.removeChildren();

                let groups = [];
                if (isPassthrough)
                    groups.push([""]);
                groups.push([
                    WI.HTTPUtilities.RequestMethod.GET,
                    WI.HTTPUtilities.RequestMethod.POST,
                ]);
                groups.push([
                    WI.HTTPUtilities.RequestMethod.HEAD,
                    WI.HTTPUtilities.RequestMethod.PATCH,
                    WI.HTTPUtilities.RequestMethod.PUT,
                    WI.HTTPUtilities.RequestMethod.DELETE,
                ]);
                groups.push([
                    WI.HTTPUtilities.RequestMethod.OPTIONS,
                    WI.HTTPUtilities.RequestMethod.CONNECT,
                    WI.HTTPUtilities.RequestMethod.TRACE,
                ]);

                for (let group of groups) {
                    if (this._methodSelectElement.children.length)
                        this._methodSelectElement.appendChild(document.createElement("hr"));

                    for (let method of group) {
                        let optionElement = this._methodSelectElement.appendChild(document.createElement("option"));
                        if (method)
                            optionElement.textContent = method;
                        else {
                            optionElement.textContent = WI.UIString("(passthrough)");
                            optionElement.value = "";
                        }
                    }
                }

                this._methodSelectElement.value = oldValue || (!isPassthrough && ("method" in valueData ? valueData.method : placeholderData.method)) || "";
            };

            this._methodSelectElement.id = "local-resource-override-popover-method-input-field";
            methodLabelElement.setAttribute("for", this._methodSelectElement.id);
        }

        let mappedDirectorySubpathRow = null;
        let mappedDirectoryPathRowElement = null;
        if (WI.NetworkManager.supportsOverridingResponses() && WI.LocalResource.canMapToFile()) {
            const mappedDirectorySubpathLabel = WI.UIString("Subpath", "Subpath @ Local Override Popover", "Label for the input of where to find the corresponding file within the mapped directory on disk.");
            mappedDirectorySubpathRow = createRow(mappedDirectorySubpathLabel, "mapped-directory-subpath", valueData.requestURL || "", placeholderData.requestURL !== placeholderData.url ? placeholderData.requestURL : "$1");
            this._mappedDirectorySubpathCodeMirror = mappedDirectorySubpathRow.codeMirror;

            mappedDirectoryPathRowElement = table.appendChild(document.createElement("tr"));
            let mappedDirectoryPathHeaderElement = mappedDirectoryPathRowElement.appendChild(document.createElement("th"));
            let mappedDirectoryPathDataElement = mappedDirectoryPathRowElement.appendChild(document.createElement("td"));

            let mappedDirectoryPathLabelElement = mappedDirectoryPathHeaderElement.appendChild(document.createElement("label"));
            mappedDirectoryPathLabelElement.textContent = WI.UIString("Directory", "Directory @ Local Override Popopver", "Label for the input used for mapping the local override to a directory on disk.");

            // Simulate the UI of a `<input type="file">`, as there's no way to provide an initial value to an actual `<input type="file">`.

            let mappedDirectoryPathEditorElement = mappedDirectoryPathDataElement.appendChild(document.createElement("div"));
            mappedDirectoryPathEditorElement.classList.add("mapped-directory-path");

            let mappedDirectoryPathButtonElement = mappedDirectoryPathEditorElement.appendChild(document.createElement("button"));
            mappedDirectoryPathButtonElement.textContent = WI.UIString("Choose Directory", "Choose Directory @ Local Override Popover", "Text of button that shows native UI to pick a directory on disk.");

            this._mappedDirectoryPathValueElement = mappedDirectoryPathEditorElement.appendChild(document.createElement("span"));
            this._mappedDirectoryPathValueElement.classList.add("value");
            this._mappedDirectoryPathValueElement.textContent = valueData.mappedFilePath;

            let mappedDirectoryPathPlaceholderElement = mappedDirectoryPathEditorElement.appendChild(document.createElement("span"));
            mappedDirectoryPathPlaceholderElement.classList.add("placeholder");
            mappedDirectoryPathPlaceholderElement.textContent = WI.UIString("no directory selected", "no directory selected @ Local Override Popover", "Placeholder text indicating that no directory has been selected.");

            mappedDirectoryPathEditorElement.title = this._mappedDirectoryPathValueElement.textContent;

            let updateMappedDirectoryPath = async () => {
                WI.FileUtilities.import((files) => {
                    this._mappedDirectoryPathValueElement.textContent = WI.FileUtilities.longestCommonPrefix(files, {directory: true});

                    mappedDirectoryPathEditorElement.title = this._mappedDirectoryPathValueElement.textContent;
                }, {directory: true});
            };
            mappedDirectoryPathLabelElement.addEventListener("click", updateMappedDirectoryPath);
            mappedDirectoryPathEditorElement.addEventListener("click", updateMappedDirectoryPath);
        }

        let mimeTypeRow = createRow(WI.UIString("MIME Type", "MIME Type @ Local Override Popover", "Label for MIME type input for the local override currently being edited."), "mime", valueData.mimeType || "", placeholderData.mimeType);
        this._mimeTypeCodeMirror = mimeTypeRow.codeMirror;

        let statusCodeRow = createRow(WI.UIString("Status", "Status @ Local Override Popover", "Label for the HTTP status code input for the local override currently being edited."), "status", valueData.statusCode || "", placeholderData.statusCode);
        this._statusCodeCodeMirror = statusCodeRow.codeMirror;

        let statusTextEditorElement = statusCodeRow.dataElement.appendChild(document.createElement("div"));
        statusTextEditorElement.className = "editor status-text";
        this._statusTextCodeMirror = this._createEditor(statusTextEditorElement, {value: valueData.statusText || "", placeholder: placeholderData.statusText});

        let afterEditCallback = () => {}; // We must provide a callback in order to enable builtin editing support.
        let deleteCallback = (node) => {
            if (node === contentTypeDataGridNode)
                return;

            let siblingToSelect = node.nextSibling || node.previousSibling;
            this._headersDataGrid.removeChild(node);
            if (siblingToSelect)
                siblingToSelect.select();

            toggleHeadersDataGridVisibility();
            this.update();
        };

        let columns = {
            name: {
                title: WI.UIString("Name"),
                width: "30%",
            },
            value: {
                title: WI.UIString("Value"),
            },
        };

        this._headersDataGrid = new WI.DataGrid(columns, {afterEditCallback, deleteCallback});
        this._headersDataGrid.inline = true;
        this._headersDataGrid.variableHeightRows = true;
        this._headersDataGrid.copyTextDelimiter = ": ";

        let addDataGridNodeForHeader = (name, value, options = {}) => {
            let node = new WI.DataGridNode({name, value}, options);
            this._headersDataGrid.appendChild(node);
            return node;
        };

        let toggleHeadersDataGridVisibility = (force) => {
            let hidden = force ?? !this._headersDataGrid.hasChildren;
            this._headersDataGrid.element.hidden = hidden;
            if (!hidden)
                this._headersDataGrid.updateLayout();
        };

        let contentTypeDataGridNode = addDataGridNodeForHeader(WI.unlocalizedString("Content-Type"), valueData.mimeType || placeholderData.mimeType, {selectable: false, editable: false, classNames: ["header-content-type"]});

        let headersRow = table.appendChild(document.createElement("tr"));
        let headersHeader = headersRow.appendChild(document.createElement("th"));
        let headersData = headersRow.appendChild(document.createElement("td"));
        let headersLabel = headersHeader.appendChild(document.createElement("label"));
        headersLabel.textContent = WI.UIString("Headers");
        headersData.appendChild(this._headersDataGrid.element);

        let addHeaderButton = headersData.appendChild(document.createElement("button"));
        addHeaderButton.className = "add-header";
        addHeaderButton.textContent = WI.UIString("Add Header");
        addHeaderButton.addEventListener("click", (event) => {
            let newNode = new WI.DataGridNode({
                name: WI.UIString("Header", "Header @ Local Override Popover New Headers Data Grid Item", "Placeholder text in an editable field for the name of a HTTP header"),
                value: WI.UIString("value", "value @ Local Override Popover New Headers Data Grid Item", "Placeholder text in an editable field for the value of a HTTP header"),
            });
            this._headersDataGrid.appendChild(newNode);
            toggleHeadersDataGridVisibility(false);
            this.update();
            this._headersDataGrid.startEditingNode(newNode);
        });

        let mappedFilePathRowElement = null;
        if (WI.LocalResource.canMapToFile()) {
            mappedFilePathRowElement = table.appendChild(document.createElement("tr"));
            let mappedFilePathHeaderElement = mappedFilePathRowElement.appendChild(document.createElement("th"));
            let mappedFilePathDataElement = mappedFilePathRowElement.appendChild(document.createElement("td"));

            let mappedFilePathLabelElement = mappedFilePathHeaderElement.appendChild(document.createElement("label"));
            mappedFilePathLabelElement.textContent = WI.UIString("File", "File @ Local Override Popopver", "Label for the input used for mapping the local override to a file on disk.");

            // Simulate the UI of a `<input type="file">`, as there's no way to provide an initial value to an actual `<input type="file">`.

            let mappedFilePathEditorElement = mappedFilePathDataElement.appendChild(document.createElement("div"));
            mappedFilePathEditorElement.classList.add("mapped-file-path");

            let mappedFilePathButtonElement = mappedFilePathEditorElement.appendChild(document.createElement("button"));
            mappedFilePathButtonElement.textContent = WI.UIString("Choose File", "Choose File @ Local Override Popover", "Text of button that shows native UI to pick a file on disk.");

            this._mappedFilePathValueElement = mappedFilePathEditorElement.appendChild(document.createElement("span"));
            this._mappedFilePathValueElement.classList.add("value");
            this._mappedFilePathValueElement.textContent = valueData.mappedFilePath;

            let mappedFilePathPlaceholderElement = mappedFilePathEditorElement.appendChild(document.createElement("span"));
            mappedFilePathPlaceholderElement.classList.add("placeholder");
            mappedFilePathPlaceholderElement.textContent = WI.UIString("no file selected", "no file selected @ Local Override Popover", "Placeholder text indicating that no file has been selected.");

            mappedFilePathEditorElement.title = this._mappedFilePathValueElement.textContent;

            let updateMappedFilePath = async () => {
                WI.FileUtilities.import((files) => {
                    console.assert(files.length === 1);
                    this._mappedFilePathValueElement.textContent = WI.FileUtilities.longestCommonPrefix(files);

                    mappedFilePathEditorElement.title = this._mappedFilePathValueElement.textContent;
                });
            };
            mappedFilePathLabelElement.addEventListener("click", updateMappedFilePath);
            mappedFilePathEditorElement.addEventListener("click", updateMappedFilePath);
        }

        let optionsRowElement = table.appendChild(document.createElement("tr"));
        optionsRowElement.className = "options";

        let optionsHeader = optionsRowElement.appendChild(document.createElement("th"));

        let optionsLabel = optionsHeader.appendChild(document.createElement("label"));
        optionsLabel.textContent = WI.UIString("Options");

        let optionsData = optionsRowElement.appendChild(document.createElement("td"));

        let isPassthroughLabel = optionsData.appendChild(document.createElement("label"));
        isPassthroughLabel.className = "is-passthrough";

        this._isPassthroughCheckbox = isPassthroughLabel.appendChild(document.createElement("input"));
        this._isPassthroughCheckbox.type = "checkbox";
        this._isPassthroughCheckbox.checked = !!localResourceOverride?.isPassthrough;
        this._isPassthroughCheckbox.addEventListener("change", (event) => {
            updateMethodOptions?.();
        });

        let isPassthroughLabelText = isPassthroughLabel.appendChild(document.createTextNode(""));

        let skipNetworkLabel = null;
        if (WI.NetworkManager.supportsOverridingRequestsWithResponses()) {
            skipNetworkLabel = optionsData.appendChild(document.createElement("label"));
            skipNetworkLabel.className = "skip-network";

            this._skipNetworkCheckbox = skipNetworkLabel.appendChild(document.createElement("input"));
            this._skipNetworkCheckbox.type = "checkbox";
            this._skipNetworkCheckbox.checked = localResourceOverride?.type === WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork;

            skipNetworkLabel.appendChild(document.createTextNode(WI.UIString("Skip Network", "Skip Network @ Local Override Popover Options", "Label for checkbox that controls whether the local override will actually perform a network request or skip it to immediately serve the response.")));
        }

        popoverContentElement.appendChild(WI.ReferencePage.LocalOverrides.ConfiguringLocalOverrides.createLinkElement());

        updateMethodOptions?.();

        let incrementStatusCode = () => {
            let x = parseInt(this._statusCodeCodeMirror.getValue());
            if (isNaN(x))
                x = parseInt(this._statusCodeCodeMirror.getOption("placeholder"));
            if (isNaN(x) || x >= 999)
                return;

            if (WI.modifierKeys.shiftKey) {
                // 200 => 300 and 211 => 300
                x = (x - (x % 100)) + 100;
            } else
                x += 1;

            if (x > 999)
                x = 999;

            this._statusCodeCodeMirror.setValue(`${x}`);
            this._statusCodeCodeMirror.setCursor(this._statusCodeCodeMirror.lineCount(), 0);
        };

        let decrementStatusCode = () => {
            let x = parseInt(this._statusCodeCodeMirror.getValue());
            if (isNaN(x))
                x = parseInt(this._statusCodeCodeMirror.getOption("placeholder"));
            if (isNaN(x) || x <= 0)
                return;

            if (WI.modifierKeys.shiftKey) {
                // 311 => 300 and 300 => 200
                let original = x;
                x = (x - (x % 100));
                if (original === x)
                    x -= 100;
            } else
                x -= 1;

            if (x < 0)
                x = 0;

            this._statusCodeCodeMirror.setValue(`${x}`);
            this._statusCodeCodeMirror.setCursor(this._statusCodeCodeMirror.lineCount(), 0);
        };

        this._statusCodeCodeMirror.addKeyMap({
            "Up": incrementStatusCode,
            "Shift-Up": incrementStatusCode,
            "Down": decrementStatusCode,
            "Shift-Down": decrementStatusCode,
        });

        // Update statusText when statusCode changes.
        this._statusCodeCodeMirror.on("change", (cm) => {
            let statusCode = parseInt(cm.getValue());
            if (isNaN(statusCode)) {
                this._statusTextCodeMirror.setValue("");
                return;
            }

            let statusText = WI.HTTPUtilities.statusTextForStatusCode(statusCode);
            this._statusTextCodeMirror.setValue(statusText);
        });

        // Update mimeType when URL gets a file extension.
        this._urlCodeMirror.on("change", (cm) => {
            if (this._isRegexCheckbox && this._isRegexCheckbox.checked)
                return;

            let extension = WI.fileExtensionForURL(cm.getValue());
            if (!extension)
                return;

            let mimeType = WI.mimeTypeForFileExtension(extension);
            if (!mimeType)
                return;

            this._mimeTypeCodeMirror.setValue(mimeType);
            contentTypeDataGridNode.data = {name: "Content-Type", value: mimeType};
        });

        // Update Content-Type header when mimeType changes.
        this._mimeTypeCodeMirror.on("change", (cm) => {
            let mimeType = cm.getValue() || cm.getOption("placeholder");
            contentTypeDataGridNode.data = {name: "Content-Type", value: mimeType};
        });

        updateURLCodeMirrorMode();

        let toggleInputsForType = (initializeHeaders) => {
            let isBlock = this._typeSelectElement.value === WI.LocalResourceOverride.InterceptType.Block;
            let isRequest = this._typeSelectElement.value === WI.LocalResourceOverride.InterceptType.Request;
            let isResponse = this._typeSelectElement.value === WI.LocalResourceOverride.InterceptType.Response || this._typeSelectElement.value === WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork;
            let isResponseMappedDirectory = this._typeSelectElement.value === WI.LocalResourceOverride.InterceptType.ResponseMappedDirectory;

            popoverContentElement.classList.toggle("block", isBlock);
            popoverContentElement.classList.toggle("request", isRequest);
            popoverContentElement.classList.toggle("response", isResponse);
            popoverContentElement.classList.toggle("response-mapped-directory", isResponseMappedDirectory);

            initializeHeaders &&= isRequest || isResponse;
            if (initializeHeaders) {
                let headers = isRequest ? requestHeaders : responseHeaders;
                for (let name in headers) {
                    if (!isRequest) {
                        if (name.toLowerCase() === "content-type")
                            continue;
                        if (name.toLowerCase() === "set-cookie")
                            continue;
                    }
                    addDataGridNodeForHeader(name, headers[name]);
                }
            }

            this._isRegexCheckbox.disabled = isResponseMappedDirectory;
            if (requestURLRow)
                requestURLRow.element.hidden = !isRequest;
            if (mappedDirectorySubpathRow)
                mappedDirectorySubpathRow.element.hidden = !isResponseMappedDirectory;
            if (mappedDirectoryPathRowElement)
                mappedDirectoryPathRowElement.hidden = !isResponseMappedDirectory;
            if (methodRowElement)
                methodRowElement.hidden = !isRequest;
            mimeTypeRow.element.hidden = !isResponse;
            statusCodeRow.element.hidden = !isResponse;
            headersRow.hidden = !isRequest && !isResponse;
            if (mappedFilePathRowElement)
                mappedFilePathRowElement.hidden = !isResponse;

            isPassthroughLabel.hidden = !isRequest && !isResponse && !isResponseMappedDirectory;
            this._isPassthroughCheckbox.disabled = isResponseMappedDirectory;
            if (skipNetworkLabel)
                skipNetworkLabel.hidden = !isResponse;
            optionsRowElement.hidden = isPassthroughLabel.hidden && (skipNetworkLabel?.hidden ?? true);

            if (isRequest) {
                this._requestURLCodeMirror.refresh();

                if (contentTypeDataGridNode.parent)
                    this._headersDataGrid.removeChild(contentTypeDataGridNode);

                isPassthroughLabelText.textContent = WI.UIString("Include original request data");
            } else if (isResponse) {
                this._mimeTypeCodeMirror.refresh();
                this._statusCodeCodeMirror.refresh();
                this._statusTextCodeMirror.refresh();

                if (!contentTypeDataGridNode.parent)
                    this._headersDataGrid.insertChild(contentTypeDataGridNode, 0);

                isPassthroughLabelText.textContent = WI.UIString("Include original response data");
            } else if (isResponseMappedDirectory) {
                this._isRegexCheckbox.checked = true;
                this._mappedDirectorySubpathCodeMirror.refresh();
                this._isPassthroughCheckbox.checked = true;

                isPassthroughLabelText.textContent = WI.UIString("Include original response data");

                updateURLCodeMirrorMode();
            }

            toggleHeadersDataGridVisibility();
        };
        toggleInputsForType(true);

        this._originalRequestURL = localResource?.url ?? null;
        this._originalMappedFilePath = localResource?.mappedFilePath ?? null;
        this._serializedDataWhenShown = this.serializedData;

        this.content = popoverContentElement;
        this._presentOverTargetElement();

        // CodeMirror needs a refresh after the popover displays, to layout, otherwise it doesn't appear.
        setTimeout(() => {
            this._urlCodeMirror.refresh();
            this._requestURLCodeMirror?.refresh();
            this._mappedDirectorySubpathCodeMirror?.refresh();
            this._mimeTypeCodeMirror.refresh();
            this._statusCodeCodeMirror.refresh();
            this._statusTextCodeMirror.refresh();

            this._urlCodeMirror.focus();
            this._urlCodeMirror.setCursor(this._urlCodeMirror.lineCount(), 0);

            this.update();
        });
    }

    // Private

    _createEditor(element, options = {})
    {
        let codeMirror = WI.CodeMirrorEditor.create(element, {
            extraKeys: {"Tab": false, "Shift-Tab": false},
            lineWrapping: false,
            mode: "text/plain",
            matchBrackets: true,
            scrollbarStyle: null,
            ...options,
        });

        codeMirror.addKeyMap({
            "Enter": () => { this.dismiss(); },
            "Shift-Enter": () => { this.dismiss(); },
            "Esc": () => { this.dismiss(); },
        });

        return codeMirror;
    }

    _defaultURL()
    {
        // We avoid just doing "http://example.com/" here because users can
        // accidentally override the main resource, even though the popover
        // typically prevents no-edit cases.
        let mainFrame = WI.networkManager.mainFrame;
        if (mainFrame && mainFrame.securityOrigin.startsWith("http"))
            return mainFrame.securityOrigin + "/path";

        return "https://";
    }

    _presentOverTargetElement()
    {
        if (!this._targetElement)
            return;

        let targetFrame = WI.Rect.rectFromClientRect(this._targetElement.getBoundingClientRect());
        this.present(targetFrame.pad(2), this._preferredEdges);
    }
};
