/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.ResourceDetailsSidebarPanel = class ResourceDetailsSidebarPanel extends WI.DetailsSidebarPanel
{
    constructor()
    {
        super("resource-details", WI.UIString("Resource"));

        this.element.classList.add("resource");

        this._resource = null;
        this._needsToApplyResourceEventListeners = false;
        this._needsToRemoveResourceEventListeners = false;
    }

    // Public

    inspect(objects)
    {
        // Convert to a single item array if needed.
        if (!(objects instanceof Array))
            objects = [objects];

        var resourceToInspect = null;

        // Iterate over the objects to find a WI.Resource to inspect.
        for (let object of objects) {
            if (object instanceof WI.Resource) {
                resourceToInspect = object;
                break;
            }

            if (object instanceof WI.Frame) {
                resourceToInspect = object.mainResource;
                break;
            }

            // FIXME: <https://webkit.org/b/164427> Web Inspector: WorkerTarget's mainResource should be a Resource not a Script
            // If that was the case, then we could just have WorkerTreeElement contain the Resource and not a Script.
            if (object instanceof WI.Script && object.isMainResource() && object.resource) {
                resourceToInspect = object.resource;
                break;
            }
        }

        this.resource = resourceToInspect;

        return !!this._resource;
    }

    get resource()
    {
        return this._resource;
    }

    set resource(resource)
    {
        if (resource === this._resource)
            return;

        if (this._resource && this._needsToRemoveResourceEventListeners) {
            this._resource.removeEventListener(WI.Resource.Event.URLDidChange, this._refreshURL, this);
            this._resource.removeEventListener(WI.Resource.Event.MIMETypeDidChange, this._refreshMIMEType, this);
            this._resource.removeEventListener(WI.Resource.Event.TypeDidChange, this._refreshResourceType, this);
            this._resource.removeEventListener(WI.Resource.Event.LoadingDidFail, this._refreshErrorReason, this);
            this._resource.removeEventListener(WI.Resource.Event.RequestHeadersDidChange, this._refreshRequestHeaders, this);
            this._resource.removeEventListener(WI.Resource.Event.ResponseReceived, this._refreshRequestAndResponse, this);
            this._resource.removeEventListener(WI.Resource.Event.CacheStatusDidChange, this._refreshRequestAndResponse, this);
            this._resource.removeEventListener(WI.Resource.Event.MetricsDidChange, this._refreshRequestAndResponse, this);
            this._resource.removeEventListener(WI.Resource.Event.SizeDidChange, this._refreshDecodedSize, this);
            this._resource.removeEventListener(WI.Resource.Event.TransferSizeDidChange, this._refreshTransferSize, this);
            this._resource.removeEventListener(WI.Resource.Event.InitiatedResourcesDidChange, this._handleResourceInitiatedResourcesDidChange, this);

            this._refreshRelatedResourcesSectionThrottler.cancel();

            this._needsToRemoveResourceEventListeners = false;
        }

        this._resource = resource;

        if (this._resource) {
            if (this.didInitialLayout)
                this._applyResourceEventListeners();
            else
                this._needsToApplyResourceEventListeners = true;
        }

        this.needsLayout();
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._typeMIMETypeRow = new WI.DetailsSectionSimpleRow(WI.UIString("MIME Type"));
        this._typeResourceTypeRow = new WI.DetailsSectionSimpleRow(WI.UIString("Resource Type"));

        this._typeSection = new WI.DetailsSection("resource-type", WI.UIString("Type"));
        this._typeSection.groups = [new WI.DetailsSectionGroup([this._typeMIMETypeRow, this._typeResourceTypeRow])];

        this._locationFullURLRow = new WI.DetailsSectionSimpleRow(WI.UIString("Full URL"));
        this._locationSchemeRow = new WI.DetailsSectionSimpleRow(WI.UIString("Scheme"));
        this._locationHostRow = new WI.DetailsSectionSimpleRow(WI.UIString("Host"));
        this._locationPortRow = new WI.DetailsSectionSimpleRow(WI.UIString("Port"));
        this._locationPathRow = new WI.DetailsSectionSimpleRow(WI.UIString("Path"));
        this._locationQueryStringRow = new WI.DetailsSectionSimpleRow(WI.UIString("Query String"));
        this._locationFragmentRow = new WI.DetailsSectionSimpleRow(WI.UIString("Fragment"));
        this._locationFilenameRow = new WI.DetailsSectionSimpleRow(WI.UIString("Filename"));
        this._initiatorRow = new WI.DetailsSectionSimpleRow(WI.UIString("Initiator"));
        this._initiatedRow = new WI.DetailsSectionSimpleRow(WI.UIString("Initiated"));

        var firstGroup = [this._locationFullURLRow];
        var secondGroup = [this._locationSchemeRow, this._locationHostRow, this._locationPortRow, this._locationPathRow, this._locationQueryStringRow, this._locationFragmentRow, this._locationFilenameRow];
        var thirdGroup = [this._initiatorRow, this._initiatedRow];

        this._fullURLGroup = new WI.DetailsSectionGroup(firstGroup);
        this._locationURLComponentsGroup = new WI.DetailsSectionGroup(secondGroup);
        this._relatedResourcesGroup = new WI.DetailsSectionGroup(thirdGroup);

        this._locationSection = new WI.DetailsSection("resource-location", WI.UIString("Location"), [this._fullURLGroup, this._locationURLComponentsGroup, this._relatedResourcesGroup]);

        this._queryParametersRow = new WI.DetailsSectionDataGridRow(null, WI.UIString("No Query Parameters"));
        this._queryParametersSection = new WI.DetailsSection("resource-query-parameters", WI.UIString("Query Parameters"));
        this._queryParametersSection.groups = [new WI.DetailsSectionGroup([this._queryParametersRow])];

        this._requestDataSection = new WI.DetailsSection("resource-request-data", WI.UIString("Request Data"));

        this._requestMethodRow = new WI.DetailsSectionSimpleRow(WI.UIString("Method"));
        this._protocolRow = new WI.DetailsSectionSimpleRow(WI.UIString("Protocol"));
        this._priorityRow = new WI.DetailsSectionSimpleRow(WI.UIString("Priority"));
        this._cachedRow = new WI.DetailsSectionSimpleRow(WI.UIString("Cached"));

        this._statusTextRow = new WI.DetailsSectionSimpleRow(WI.UIString("Status"));
        this._statusCodeRow = new WI.DetailsSectionSimpleRow(WI.UIString("Code"));
        this._errorReasonRow = new WI.DetailsSectionSimpleRow(WI.UIString("Error"));

        this._remoteAddressRow = new WI.DetailsSectionSimpleRow(WI.UIString("IP Address"));
        this._connectionIdentifierRow = new WI.DetailsSectionSimpleRow(WI.UIString("Connection ID"));

        this._encodedSizeRow = new WI.DetailsSectionSimpleRow(WI.UIString("Encoded"));
        this._decodedSizeRow = new WI.DetailsSectionSimpleRow(WI.UIString("Decoded"));
        this._transferSizeRow = new WI.DetailsSectionSimpleRow(WI.UIString("Transferred"));

        this._compressedRow = new WI.DetailsSectionSimpleRow(WI.UIString("Compressed"));
        this._compressionRow = new WI.DetailsSectionSimpleRow(WI.UIString("Compression"));

        let requestGroup = new WI.DetailsSectionGroup([this._requestMethodRow, this._protocolRow, this._priorityRow, this._cachedRow]);
        let statusGroup = new WI.DetailsSectionGroup([this._statusTextRow, this._statusCodeRow, this._errorReasonRow]);
        let connectionGroup = new WI.DetailsSectionGroup([this._remoteAddressRow, this._connectionIdentifierRow]);
        let sizeGroup = new WI.DetailsSectionGroup([this._encodedSizeRow, this._decodedSizeRow, this._transferSizeRow]);
        let compressionGroup = new WI.DetailsSectionGroup([this._compressedRow, this._compressionRow]);

        this._requestAndResponseSection = new WI.DetailsSection("resource-request-response", WI.UIString("Request & Response"));
        this._requestAndResponseSection.groups = [requestGroup, statusGroup, connectionGroup, sizeGroup, compressionGroup];

        this._requestHeadersRow = new WI.DetailsSectionDataGridRow(null, WI.UIString("No Request Headers"));
        this._requestHeadersSection = new WI.DetailsSection("resource-request-headers", WI.UIString("Request Headers"));
        this._requestHeadersSection.groups = [new WI.DetailsSectionGroup([this._requestHeadersRow])];

        this._responseHeadersRow = new WI.DetailsSectionDataGridRow(null, WI.UIString("No Response Headers"));
        this._responseHeadersSection = new WI.DetailsSection("resource-response-headers", WI.UIString("Response Headers"));
        this._responseHeadersSection.groups = [new WI.DetailsSectionGroup([this._responseHeadersRow])];

        // Rows for the "Image Size" section.
        this._imageWidthRow = new WI.DetailsSectionSimpleRow(WI.UIString("Width"));
        this._imageHeightRow = new WI.DetailsSectionSimpleRow(WI.UIString("Height"));

        // "Image Size" section where we display intrinsic metrics for image resources.
        this._imageSizeSection = new WI.DetailsSection("resource-type", WI.UIString("Image Size"));
        this._imageSizeSection.groups = [new WI.DetailsSectionGroup([this._imageWidthRow, this._imageHeightRow])];

        this.contentView.element.appendChild(this._typeSection.element);
        this.contentView.element.appendChild(this._locationSection.element);
        this.contentView.element.appendChild(this._requestAndResponseSection.element);
        this.contentView.element.appendChild(this._requestHeadersSection.element);
        this.contentView.element.appendChild(this._responseHeadersSection.element);

        if (this._needsToApplyResourceEventListeners) {
            this._applyResourceEventListeners();

            this._needsToApplyResourceEventListeners = false;
        }
    }

    layout()
    {
        super.layout();

        if (!this._resource)
            return;

        this._refreshURL();
        this._refreshMIMEType();
        this._refreshResourceType();
        this._refreshRequestAndResponse();
        this._refreshDecodedSize();
        this._refreshTransferSize();
        this._refreshRequestHeaders();
        this._refreshImageSizeSection();
        this._refreshRequestDataSection();
        this._refreshRelatedResourcesSectionThrottler.force();
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        // FIXME: <https://webkit.org/b/152269> Web Inspector: Convert DetailsSection classes to use View
        this._queryParametersRow.sizeDidChange();
        this._requestHeadersRow.sizeDidChange();
        this._responseHeadersRow.sizeDidChange();
    }

    // Private

    _refreshURL()
    {
        if (!this._resource)
            return;

        this._locationFullURLRow.value = this._resource.displayURL.insertWordBreakCharacters();

        var urlComponents = this._resource.urlComponents;
        if (urlComponents.scheme) {
            this._locationSection.groups = [this._fullURLGroup, this._locationURLComponentsGroup, this._relatedResourcesGroup];

            this._locationSchemeRow.value = urlComponents.scheme ? urlComponents.scheme : null;
            this._locationHostRow.value = urlComponents.host ? urlComponents.host : null;
            this._locationPortRow.value = urlComponents.port ? urlComponents.port : null;
            this._locationPathRow.value = urlComponents.path ? urlComponents.path.insertWordBreakCharacters() : null;
            this._locationQueryStringRow.value = urlComponents.queryString ? urlComponents.queryString.insertWordBreakCharacters() : null;
            this._locationFragmentRow.value = urlComponents.fragment ? urlComponents.fragment.insertWordBreakCharacters() : null;
            this._locationFilenameRow.value = urlComponents.lastPathComponent ? urlComponents.lastPathComponent.insertWordBreakCharacters() : null;
        } else {
            this._locationSection.groups = [this._fullURLGroup, this._relatedResourcesGroup];
        }

        if (urlComponents.queryString) {
            // Ensure the "Query Parameters" section is displayed, right after the "Request & Response" section.
            this.contentView.element.insertBefore(this._queryParametersSection.element, this._requestAndResponseSection.element.nextSibling);

            this._queryParametersRow.dataGrid = this._createNameValueDataGrid(parseQueryString(urlComponents.queryString, true));
        } else {
            // Hide the "Query Parameters" section if we don't have a query string.
            var queryParametersSectionElement = this._queryParametersSection.element;
            if (queryParametersSectionElement.parentNode)
                queryParametersSectionElement.parentNode.removeChild(queryParametersSectionElement);
        }
    }

    _refreshRelatedResourcesSection()
    {
        // Hide the section if we don't have anything to show.
        let groups = this._locationSection.groups;
        let isSectionVisible = groups.includes(this._relatedResourcesGroup);
        if (!this._resource.initiatorSourceCodeLocation && !this._resource.initiatedResources.length) {
            if (isSectionVisible) {
                groups.remove(this._relatedResourcesGroup);
                this._locationSection.groups = groups;
            }
            return;
        }

        if (!isSectionVisible) {
            groups.push(this._relatedResourcesGroup);
            this._locationSection.groups = groups;
        }

        let initiatorLocation = this._resource.initiatorSourceCodeLocation;
        if (initiatorLocation) {
            const options = {
                dontFloat: true,
                ignoreSearchTab: true,
            };
            this._initiatorRow.value = WI.createSourceCodeLocationLink(initiatorLocation, options);
        } else
            this._initiatorRow.value = null;

        let initiatedResources = this._resource.initiatedResources;
        if (initiatedResources.length) {
            let resourceLinkContainer = document.createElement("div");
            for (let resource of initiatedResources)
                resourceLinkContainer.appendChild(WI.createResourceLink(resource));

            this._initiatedRow.value = resourceLinkContainer;
        } else
            this._initiatedRow.value = null;
    }

    _refreshResourceType()
    {
        if (!this._resource)
            return;

        this._typeResourceTypeRow.value = WI.Resource.displayNameForType(this._resource.type);
    }

    _refreshMIMEType()
    {
        if (!this._resource)
            return;

        this._typeMIMETypeRow.value = this._resource.mimeType;
    }

    _refreshErrorReason()
    {
        if (!this._resource)
            return;

        if (!this._resource.hadLoadingError()) {
            this._errorReasonRow.value = null;
            return;
        }

        if (this._resource.failureReasonText)
            this._errorReasonRow.value = this._resource.failureReasonText;
        else if (this._resource.statusCode >= 400)
            this._errorReasonRow.value = WI.UIString("Failure status code");
        else if (this._resource.canceled)
            this._errorReasonRow.value = WI.UIString("Load cancelled");
        else
            this._errorReasonRow.value = WI.UIString("Unknown error");
    }

    _refreshRequestAndResponse()
    {
        if (!this._resource)
            return;

        // If we don't have a value, we set an em-dash to keep the row from hiding.
        // This keeps the UI from shifting around as data comes in.

        this._requestMethodRow.value = this._resource.requestMethod || emDash;

        let protocolDisplayName = WI.Resource.displayNameForProtocol(this._resource.protocol);
        this._protocolRow.value = protocolDisplayName || emDash;
        this._protocolRow.tooltip = protocolDisplayName ? this._resource.protocol : "";
        this._priorityRow.value = WI.Resource.displayNameForPriority(this._resource.priority) || emDash;
        this._remoteAddressRow.value = this._resource.displayRemoteAddress || emDash;
        this._connectionIdentifierRow.value = this._resource.connectionIdentifier || emDash;

        this._cachedRow.value = this._cachedRowValue();

        this._statusCodeRow.value = this._resource.statusCode || emDash;
        this._statusTextRow.value = this._resource.statusText || emDash;
        this._refreshErrorReason();

        this._refreshResponseHeaders();
        this._refreshCompressed();
    }

    _valueForSize(size)
    {
        // If we don't have a value, we set an em-dash to keep the row from hiding.
        // This keeps the UI from shifting around as data comes in.
        return size > 0 ? Number.bytesToString(size) : emDash;
    }

    _refreshCompressed()
    {
        if (this._resource.compressed) {
            this._compressedRow.value = WI.UIString("Yes");
            if (!this._resource.size)
                this._compressionRow.value = emDash;
            else if (!isNaN(this._resource.networkEncodedSize))
                this._compressionRow.value = this._resource.networkEncodedSize ? WI.UIString("%.2f\u00d7").format(this._resource.size / this._resource.networkEncodedSize) : emDash;
            else
                this._compressionRow.value = this._resource.estimatedNetworkEncodedSize ? WI.UIString("%.2f\u00d7").format(this._resource.size / this._resource.estimatedNetworkEncodedSize) : emDash;
        } else {
            this._compressedRow.value = WI.UIString("No");
            this._compressionRow.value = null;
        }
    }

    _refreshDecodedSize()
    {
        if (!this._resource)
            return;

        let encodedSize = !isNaN(this._resource.networkEncodedSize) ? this._resource.networkEncodedSize : this._resource.estimatedNetworkEncodedSize;
        let decodedSize = !isNaN(this._resource.networkDecodedSize) ? this._resource.networkDecodedSize : this._resource.size;

        this._encodedSizeRow.value = this._valueForSize(encodedSize);
        this._decodedSizeRow.value = this._valueForSize(decodedSize);

        this._refreshCompressed();
    }

    _refreshTransferSize()
    {
        if (!this._resource)
            return;

        let encodedSize = !isNaN(this._resource.networkEncodedSize) ? this._resource.networkEncodedSize : this._resource.estimatedNetworkEncodedSize;
        let transferSize = !isNaN(this._resource.networkTotalTransferSize) ? this._resource.networkTotalTransferSize : this._resource.estimatedTotalTransferSize;

        this._encodedSizeRow.value = this._valueForSize(encodedSize);
        this._transferSizeRow.value = this._valueForSize(transferSize);

        this._refreshCompressed();
    }

    _refreshRequestHeaders()
    {
        if (!this._resource)
            return;

        this._requestHeadersRow.dataGrid = this._createNameValueDataGrid(this._resource.requestHeaders);
    }

    _refreshResponseHeaders()
    {
        if (!this._resource)
            return;

        this._responseHeadersRow.dataGrid = this._createNameValueDataGrid(this._resource.responseHeaders);
    }

    _createNameValueDataGrid(data)
    {
        if (!data || data instanceof Array ? !data.length : isEmptyObject(data))
            return null;

        var dataGrid = new WI.DataGrid({
            name: {title: WI.UIString("Name"), width: "30%", sortable: true},
            value: {title: WI.UIString("Value"), sortable: true}
        });
        dataGrid.copyTextDelimiter = ": ";

        function addDataGridNode(nodeValue)
        {
            console.assert(typeof nodeValue.name === "string");
            console.assert(!nodeValue.value || typeof nodeValue.value === "string");

            var node = new WI.DataGridNode({name: nodeValue.name, value: nodeValue.value || ""});
            dataGrid.appendChild(node);
        }

        if (data instanceof Array) {
            for (var i = 0; i < data.length; ++i)
                addDataGridNode(data[i]);
        } else {
            for (var name in data)
                addDataGridNode({name, value: data[name] || ""});
        }

        dataGrid.addEventListener(WI.DataGrid.Event.SortChanged, sortDataGrid, this);

        function sortDataGrid()
        {
            var sortColumnIdentifier = dataGrid.sortColumnIdentifier;

            function comparator(a, b)
            {
                var item1 = a.data[sortColumnIdentifier];
                var item2 = b.data[sortColumnIdentifier];
                return item1.extendedLocaleCompare(item2);
            }

            dataGrid.sortNodes(comparator);
        }

        return dataGrid;
    }

    _refreshImageSizeSection()
    {
        var resource = this._resource;

        if (!resource)
            return;

        function hideImageSection() {
            this._imageSizeSection.element.remove();
        }

        // Hide the section if we're not dealing with an image or if the load failed.
        if (resource.type !== WI.Resource.Type.Image || resource.failed) {
            hideImageSection.call(this);
            return;
        }

        // Ensure the section is displayed, right before the "Location" section.
        this.contentView.element.insertBefore(this._imageSizeSection.element, this._locationSection.element);

        // Get the metrics for this resource and fill in the metrics rows with that information.
        resource.getImageSize((size) => {
            if (size) {
                this._imageWidthRow.value = WI.UIString("%dpx").format(size.width);
                this._imageHeightRow.value = WI.UIString("%dpx").format(size.height);
            } else
                hideImageSection.call(this);
        });
    }

    _cachedRowValue()
    {
        let responseSource = this._resource.responseSource;
        if (responseSource === WI.Resource.ResponseSource.MemoryCache || responseSource === WI.Resource.ResponseSource.DiskCache) {
            console.assert(this._resource.cached, "This resource has a cache responseSource it should also be marked as cached", this._resource);
            let span = document.createElement("span");
            let cacheType = document.createElement("span");
            cacheType.classList = "cache-type";
            cacheType.textContent = responseSource === WI.Resource.ResponseSource.MemoryCache ? WI.UIString("(Memory)") : WI.UIString("(Disk)");
            span.append(WI.UIString("Yes"), " ", cacheType);
            return span;
        }

        return this._resource.cached ? WI.UIString("Yes") : WI.UIString("No");
    }

    _goToRequestDataClicked()
    {
        const options = {
            ignoreSearchTab: true,
        };
        WI.showResourceRequest(this._resource, options);
    }

    _refreshRequestDataSection()
    {
        var resource = this._resource;
        if (!resource)
            return;

        // Hide the section if we're not dealing with a request with data.
        var requestData = resource.requestData;
        if (!requestData) {
            this._requestDataSection.element.remove();
            return;
        }

        // Ensure the section is displayed, right before the "Request Headers" section.
        this.contentView.element.insertBefore(this._requestDataSection.element, this._requestHeadersSection.element);

        var requestDataContentType = resource.requestDataContentType || "";
        if (requestDataContentType && requestDataContentType.match(/^application\/x-www-form-urlencoded\s*(;.*)?$/i)) {
            // Simple form data that should be parsable like a query string.
            var parametersRow = new WI.DetailsSectionDataGridRow(null, WI.UIString("No Parameters"));
            parametersRow.dataGrid = this._createNameValueDataGrid(parseQueryString(requestData, true));

            this._requestDataSection.groups = [new WI.DetailsSectionGroup([parametersRow])];
            return;
        }

        // Not simple form data, so we can really only show the size and type here.
        // FIXME: Add a go-to arrow here to show the data in the content browser.

        var mimeTypeComponents = parseMIMEType(requestDataContentType);

        var mimeType = mimeTypeComponents.type;
        var boundary = mimeTypeComponents.boundary;
        var encoding = mimeTypeComponents.encoding;

        var rows = [];

        var mimeTypeRow = new WI.DetailsSectionSimpleRow(WI.UIString("MIME Type"));
        mimeTypeRow.value = mimeType;
        rows.push(mimeTypeRow);

        if (boundary) {
            var boundryRow = new WI.DetailsSectionSimpleRow(WI.UIString("Boundary"));
            boundryRow.value = boundary;
            rows.push(boundryRow);
        }

        if (encoding) {
            var encodingRow = new WI.DetailsSectionSimpleRow(WI.UIString("Encoding"));
            encodingRow.value = encoding;
            rows.push(encodingRow);
        }

        var sizeValue = Number.bytesToString(requestData.length);

        var dataValue = document.createDocumentFragment();

        dataValue.append(sizeValue);

        var goToButton = dataValue.appendChild(WI.createGoToArrowButton());
        goToButton.addEventListener("click", this._goToRequestDataClicked.bind(this));

        var dataRow = new WI.DetailsSectionSimpleRow(WI.UIString("Data"));
        dataRow.value = dataValue;
        rows.push(dataRow);

        this._requestDataSection.groups = [new WI.DetailsSectionGroup(rows)];
    }

    _applyResourceEventListeners()
    {
        if (!this._refreshRelatedResourcesSectionThrottler) {
            this._refreshRelatedResourcesSectionThrottler = new Throttler(() => {
                this._refreshRelatedResourcesSection();
            }, 250);
        }

        this._resource.addEventListener(WI.Resource.Event.URLDidChange, this._refreshURL, this);
        this._resource.addEventListener(WI.Resource.Event.MIMETypeDidChange, this._refreshMIMEType, this);
        this._resource.addEventListener(WI.Resource.Event.TypeDidChange, this._refreshResourceType, this);
        this._resource.addEventListener(WI.Resource.Event.LoadingDidFail, this._refreshErrorReason, this);
        this._resource.addEventListener(WI.Resource.Event.RequestHeadersDidChange, this._refreshRequestHeaders, this);
        this._resource.addEventListener(WI.Resource.Event.ResponseReceived, this._refreshRequestAndResponse, this);
        this._resource.addEventListener(WI.Resource.Event.CacheStatusDidChange, this._refreshRequestAndResponse, this);
        this._resource.addEventListener(WI.Resource.Event.MetricsDidChange, this._refreshRequestAndResponse, this);
        this._resource.addEventListener(WI.Resource.Event.SizeDidChange, this._refreshDecodedSize, this);
        this._resource.addEventListener(WI.Resource.Event.TransferSizeDidChange, this._refreshTransferSize, this);
        this._resource.addEventListener(WI.Resource.Event.InitiatedResourcesDidChange, this._handleResourceInitiatedResourcesDidChange, this);

        this._needsToRemoveResourceEventListeners = true;
    }

    _handleResourceInitiatedResourcesDidChange(event)
    {
        this._refreshRelatedResourcesSectionThrottler.fire();
    }
};
