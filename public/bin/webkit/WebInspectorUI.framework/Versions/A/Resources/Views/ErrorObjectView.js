/*
 * Copyright (C) 2015, 2018 Apple Inc. All rights reserved.
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

WI.ErrorObjectView = class ErrorObjectView extends WI.Object
{
    constructor(object)
    {
        super();

        console.assert(object instanceof WI.RemoteObject && object.subtype === "error", object);

        this._object = object;

        this._expanded = false;
        this._hasStackTrace = false;

        this._element = document.createElement("div");
        this._element.classList.add("error-object");
        var previewElement = WI.FormattedValue.createElementForError(this._object);
        this._element.append(previewElement);
        previewElement.addEventListener("click", this._handlePreviewOrTitleElementClick.bind(this));

        this._outlineElement = this._element.appendChild(document.createElement("div"));
        this._outlineElement.className = "content";
    }

    // Static

    static makeSourceLinkWithPrefix(sourceURL, lineNumber, columnNumber)
    {
        if (!sourceURL)
            return null;

        var span = document.createElement("span");
        span.classList.add("error-object-link-container");
        span.textContent = ` ${emDash} `;

        const options = {
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
        };
        let a = WI.linkifyLocation(sourceURL, new WI.SourceCodePosition(parseInt(lineNumber) - 1, parseInt(columnNumber)), options);
        a.classList.add("error-object-link");
        span.appendChild(a);

        return span;
    }

    // Public

    get object()
    {
        return this._object;
    }

    get element()
    {
        return this._element;
    }

    get expanded()
    {
        return this._expanded;
    }

    update()
    {
        if (this._hasStackTrace)
            return;

        const options = {
            ownProperties: true,
            generatePreview: true,
        };
        this._object.getPropertyDescriptors((properties) => {
            if (!properties || this._hasStackTrace)
                return;

            let stackProperty = properties.find((property) => property.name === "stack");
            console.assert(stackProperty);
            if (!stackProperty)
                return;

            this._buildStackTrace(stackProperty.value.value);
            this._hasStackTrace = true;
        }, options);
    }

    expand()
    {
        if (this._expanded)
            return;

        this._expanded = true;
        this._element.classList.add("expanded");

        this.update();
    }

    collapse()
    {
        if (!this._expanded)
            return;

        this._expanded = false;
        this._element.classList.remove("expanded");
    }

    appendTitleSuffix(suffixElement)
    {
        this._element.insertBefore(suffixElement, this._outlineElement);
    }

    // Private

    _handlePreviewOrTitleElementClick(event)
    {
        if (!this._expanded)
            this.expand();
        else
            this.collapse();

        event.stopPropagation();
    }

    _buildStackTrace(stackString)
    {
        let stackTrace = WI.StackTrace.fromString(this._object.target, stackString);
        let stackTraceElement = new WI.StackTraceView(stackTrace);
        this._outlineElement.appendChild(stackTraceElement);
    }
};
