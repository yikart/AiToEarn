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

WI.ToggleButtonNavigationItem = class ToggleButtonNavigationItem extends WI.ButtonNavigationItem
{
    constructor(identifier, defaultToolTip, alternateToolTip, defaultImage, alternateImage, imageWidth, imageHeight)
    {
        super(identifier, defaultToolTip, defaultImage, imageWidth, imageHeight);

        this._toggled = false;
        this._defaultImage = defaultImage;
        this._alternateImage = alternateImage;
        this._defaultToolTip = defaultToolTip;
        this._alternateToolTip = alternateToolTip || defaultToolTip;
    }

    // Public

    get defaultToolTip()
    {
        return this._defaultToolTip;
    }

    set defaultToolTip(toolTip)
    {
        this._defaultToolTip = toolTip;

        if (!this._toggled)
            this.tooltip = this._defaultToolTip;
    }

    get alternateToolTip()
    {
        return this._alternateToolTip;
    }

    set alternateToolTip(toolTip)
    {
        this._alternateToolTip = toolTip;

        if (this._toggled)
            this.tooltip = this._alternateToolTip;
    }

    get defaultImage()
    {
        return this._defaultImage;
    }

    get alternateImage()
    {
        return this._alternateImage;
    }

    set alternateImage(image)
    {
        this._alternateImage = image;

        if (this._toggled)
            this.image = this._alternateImage;
    }

    get toggled()
    {
        return this._toggled;
    }

    set toggled(flag)
    {
        flag = flag || false;

        if (this._toggled === flag)
            return;

        this._toggled = flag;

        if (this._toggled) {
            this.tooltip = this._alternateToolTip;
            this.image = this._alternateImage;
        } else {
            this.tooltip = this._defaultToolTip;
            this.image = this._defaultImage;
        }

        if (this.buttonStyle === WI.ButtonNavigationItem.Style.Text || this.buttonStyle === WI.ButtonNavigationItem.Style.ImageAndText)
            this.label = this.tooltip;
    }

    // Protected

    get additionalClassNames()
    {
        return ["toggle", "button"];
    }
};
