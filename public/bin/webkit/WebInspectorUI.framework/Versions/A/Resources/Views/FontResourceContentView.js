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

WI.FontResourceContentView = class FontResourceContentView extends WI.ResourceContentView
{
    constructor(resource)
    {
        super(resource, "font");

        this._styleElement = null;
        this._previewElement = null;
        this._previewContainer = null;
    }

    // Public

    sizeToFit()
    {
        if (!this._previewElement)
            return;

        // Start at the maximum size and try progressively smaller font sizes until minimum is reached or the preview element is not as wide as the main element.
        for (var fontSize = WI.FontResourceContentView.MaximumFontSize; fontSize >= WI.FontResourceContentView.MinimumFontSize; fontSize -= 5) {
            this._previewElement.style.fontSize = fontSize + "px";
            if (this._previewElement.offsetWidth <= this.element.offsetWidth)
                break;
        }
    }

    contentAvailable(content, base64Encoded)
    {
        this._fontObjectURL = this.resource.createObjectURL();

        if (!this._fontObjectURL) {
            this.showGenericErrorMessage();
            return;
        }

        this.removeLoadingIndicator();

        this._previewContainer = this.element.appendChild(document.createElement("div"));
        this._previewContainer.className = "preview-container";

        this._updatePreviewElement();

        if (WI.NetworkManager.supportsOverridingResponses()) {
            let dropZoneView = new WI.DropZoneView(this);
            dropZoneView.targetElement = this._previewContainer;
            this.addSubview(dropZoneView);

            if (this.resource.localResourceOverride)
                this.resource.addEventListener(WI.SourceCode.Event.ContentDidChange, this._handleLocalResourceContentDidChange, this);
        }
    }

    attached()
    {
        super.attached();

        // Add the style element since it is removed when hidden.
        if (this._styleElement)
            document.head.appendChild(this._styleElement);
    }

    detached()
    {
        // Remove the style element so it will not stick around when this content view is destroyed.
        if (this._styleElement)
            this._styleElement.remove();

        super.detached();
    }

    closed()
    {
        // This is a workaround for the fact that the browser does not send any events
        // when a @font-face resource is loaded. So, we assume it could be needed until
        // the content view is destroyed, as re-attaching the style element would cause
        // the object URL to be resolved again.
        if (this._fontObjectURL)
            URL.revokeObjectURL(this._fontObjectURL);

        super.closed();
    }

    // Protected

    layout()
    {
        this.sizeToFit();
    }

    // DropZoneView delegate

    dropZoneShouldAppearForDragEvent(dropZone, event)
    {
        let existingOverrides = WI.networkManager.localResourceOverridesForURL(this.resource.url);
        if (existingOverrides.length > 1)
            return false;

        let localResourceOverride = this.resource.localResourceOverride || existingOverrides[0];
        if (localResourceOverride && !localResourceOverride.canMapToFile)
            return false;

        return event.dataTransfer.types.includes("Files");
    }

    dropZoneHandleDragEnter(dropZone, event)
    {
        if (this.resource.localResourceOverride)
            dropZone.text = WI.UIString("Update Font");
        else if (WI.networkManager.localResourceOverridesForURL(this.resource.url).length)
            dropZone.text = WI.UIString("Update Local Override");
        else
            dropZone.text = WI.UIString("Create Local Override");
    }

    dropZoneHandleDrop(dropZone, event)
    {
        let files = event.dataTransfer.files;
        if (files.length !== 1) {
            InspectorFrontendHost.beep();
            return;
        }

        WI.FileUtilities.readData(files, async ({dataURL, mimeType, base64Encoded, content}) => {
            let localResourceOverride = this.resource.localResourceOverride || WI.networkManager.localResourceOverridesForURL(this.resource.url)[0];
            if (!localResourceOverride) {
                localResourceOverride = await this.resource.createLocalResourceOverride(WI.LocalResourceOverride.InterceptType.Response);
                WI.networkManager.addLocalResourceOverride(localResourceOverride);
            }
            console.assert(localResourceOverride);

            let revision = localResourceOverride.localResource.editableRevision;
            revision.updateRevisionContent(content, {base64Encoded, mimeType});

            if (!this.resource.localResourceOverride)
                WI.showLocalResourceOverride(localResourceOverride, {overriddenResource: this.resource});
        });
    }

    // Private

    _updatePreviewElement()
    {
        if (this._styleElement)
            this._styleElement.remove();
        if (this._previewElement)
            this._previewElement.remove();

        const uniqueFontName = "WebInspectorFontPreview" + (++WI.FontResourceContentView._uniqueFontIdentifier);

        let format = "";

        // We need to specify a format when loading SVG fonts to make them work.
        if (this.resource.mimeTypeComponents.type === "image/svg+xml")
            format = " format(\"svg\")";

        this._styleElement = document.createElement("style");
        this._styleElement.textContent = `@font-face { font-family: "${uniqueFontName}"; src: url(${this._fontObjectURL}) ${format}; }`;

        // The style element will be added when shown later if we are not visible now.
        if (this.isAttached)
            document.head.appendChild(this._styleElement);

        this._previewElement = document.createElement("div");
        this._previewElement.className = "preview";
        this._previewElement.style.fontFamily = uniqueFontName;

        function createMetricElement(className) {
            let metricElement = document.createElement("div");
            metricElement.className = "metric " + className;
            return metricElement;
        }

        for (let line of WI.FontResourceContentView.PreviewLines) {
            let lineElement = document.createElement("div");
            lineElement.className = "line";

            lineElement.appendChild(createMetricElement("top"));
            lineElement.appendChild(createMetricElement("xheight"));
            lineElement.appendChild(createMetricElement("middle"));
            lineElement.appendChild(createMetricElement("baseline"));
            lineElement.appendChild(createMetricElement("bottom"));

            let contentElement = document.createElement("div");
            contentElement.className = "content";
            contentElement.textContent = line;
            lineElement.appendChild(contentElement);

            this._previewElement.appendChild(lineElement);
        }

        this._previewContainer.appendChild(this._previewElement);

        this.sizeToFit();
    }

    _handleLocalResourceContentDidChange(event)
    {
        this._fontObjectURL = this.resource.createObjectURL();
        this._updatePreviewElement();
    }
};

WI.FontResourceContentView._uniqueFontIdentifier = 0;

WI.FontResourceContentView.PreviewLines = ["ABCDEFGHIJKLM", "NOPQRSTUVWXYZ", "abcdefghijklm", "nopqrstuvwxyz", "1234567890"];

WI.FontResourceContentView.MaximumFontSize = 72;
WI.FontResourceContentView.MinimumFontSize = 12;
