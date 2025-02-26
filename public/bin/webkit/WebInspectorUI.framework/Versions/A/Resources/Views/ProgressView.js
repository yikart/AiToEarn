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

WI.ProgressView = class ProgressView extends WI.View
{
    constructor(title, subtitle)
    {
        super();

        this.element.classList.add("progress-view");

        this._title = title || "";
        this._subtitle = subtitle || "";

        this._titlesElement = null;
        this._titleElement = null;
        this._subtitleElement = null;
    }

    // Public

    get title()
    {
        return this._title;
    }

    set title(title)
    {
        title = title || "";
        if (this._title === title)
            return;

        this._title = title;
        this._updateTitles();
    }

    get subtitle()
    {
        return this._subtitle;
    }

    set subtitle(subtitle)
    {
        subtitle = subtitle || "";
        if (this._subtitle === subtitle)
            return;

        this._subtitle = subtitle;
        this._updateTitles();
    }

    get visible() { return this._visible; }

    set visible(x)
    {
        if (this._visible === x)
            return;

        // FIXME: remove once <https://webkit.org/b/150741> is fixed.
        this._visible = x;
        this.element.classList.toggle("hidden", !this._visible);
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._titlesElement = this.element.appendChild(document.createElement("div"));
        this._titlesElement.className = "titles";
        this._titleElement = this._titlesElement.appendChild(document.createElement("span"));
        this._titleElement.className = "title";
        this._subtitleElement = this._titlesElement.appendChild(document.createElement("span"));
        this._subtitleElement.className = "subtitle";

        let spinner = new WI.IndeterminateProgressSpinner;
        this.element.appendChild(spinner.element);

        this._updateTitles();
    }

    _updateTitles()
    {
        if (!this._titlesElement)
            return;

        this._titleElement.textContent = this._title;
        this._titleElement.classList.toggle("hidden", !this._title);

        this._subtitleElement.textContent = this._subtitle;
        this._subtitleElement.classList.toggle("hidden", !this._subtitle);
    }
};
