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

WI.ButtonNavigationItem = class ButtonNavigationItem extends WI.NavigationItem
{
    constructor(identifier, toolTipOrLabel, image, imageWidth, imageHeight, role, label)
    {
        role = role || "button";
        super(identifier, role);

        console.assert(identifier);
        console.assert(toolTipOrLabel);

        this._enabled = true;

        this.element.addEventListener("click", this._mouseClicked.bind(this));

        // Don't move the focus on the button when clicking on it. This matches macOS behavior.
        this.element.addEventListener("mousedown", this._handleMouseDown.bind(this), true);

        this._role = role;
        if (this._role === "button")
            this.element.addEventListener("keydown", this._handleKeyDown.bind(this));

        if (label)
            this.element.setAttribute("aria-label", label);

        this._buttonStyle = null;
        this._disabled = false;
        this._image = image || null;
        this._imageWidth = imageWidth || 16;
        this._imageHeight = imageHeight || 16;
        this._label = toolTipOrLabel;

        this._updateTabIndex();

        this.buttonStyle = this._image ? WI.ButtonNavigationItem.Style.Image : WI.ButtonNavigationItem.Style.Text;

        this.imageType = this._image ? WI.ButtonNavigationItem.ImageType.SVG : null;
    }

    // Public

    get label()
    {
        return this._label;
    }

    set label(newLabel)
    {
        newLabel = newLabel || "";
        if (this._label === newLabel)
            return;

        this._label = newLabel;
        this._update();

        if (this.parentNavigationBar)
            this.parentNavigationBar.needsLayout();
    }

    get image()
    {
        return this._image;
    }

    set image(newImage)
    {
        newImage = newImage || null;
        if (this._image === newImage)
            return;

        this._image = newImage;
        this._update();
    }

    get enabled()
    {
        return this._enabled;
    }

    set enabled(flag)
    {
        flag = !!flag;
        if (this._enabled === flag)
            return;

        this._enabled = flag;
        this.element.classList.toggle("disabled", !this._enabled);
        this.element.ariaDisabled = !this._enabled;

        this._updateTabIndex();
    }

    get buttonStyle()
    {
        return this._buttonStyle;
    }

    set buttonStyle(newButtonStyle)
    {
        newButtonStyle = newButtonStyle || WI.ButtonNavigationItem.Style.Image;
        if (this._buttonStyle === newButtonStyle)
            return;

        this.element.classList.remove(...Object.values(WI.ButtonNavigationItem.Style));
        this.element.classList.add(newButtonStyle);

        this._buttonStyle = newButtonStyle;
        this._update();

        if (this.parentNavigationBar)
            this.parentNavigationBar.needsLayout();
    }

    get imageType()
    {
        return this._imageType;
    }

    set imageType(imageType)
    {
        console.assert(!imageType || Object.values(WI.ButtonNavigationItem.ImageType).includes(imageType), imageType);
        console.assert(!imageType || (this._buttonStyle === WI.ButtonNavigationItem.Style.Image || this._buttonStyle === WI.ButtonNavigationItem.Style.ImageAndText));

        if (this._imageType === imageType)
            return;

        this._imageType = imageType;

        this._update();

        if (this.parentNavigationBar)
            this.parentNavigationBar.needsLayout();
    }

    // Protected

    get totalMargin()
    {
        return super.totalMargin + this.textMargin;
    }

    get textMargin()
    {
        if (this._buttonStyle === ButtonNavigationItem.Style.Text)
            return 4; /* .navigation-bar .item.button.text-only */
        return 0;
    }

    get additionalClassNames()
    {
        return ["button"];
    }

    get tabbable()
    {
        return this._role === "button";
    }

    // Private

    _mouseClicked(event)
    {
        this._buttonPressed(event);
    }

    _handleMouseDown(event)
    {
        // Clicking on a button should NOT focus on it.
        event.preventDefault();
    }

    _handleKeyDown(event)
    {
        if (event.code === "Enter" || event.code === "Space") {
            event.stop();
            this._buttonPressed(event);
        }
    }

    _buttonPressed(event)
    {
        if (!this.enabled)
            return;
        this.dispatchEventToListeners(WI.ButtonNavigationItem.Event.Clicked, {nativeEvent: event});
    }

    _update()
    {
        this.element.removeChildren();

        if (this._buttonStyle === WI.ButtonNavigationItem.Style.Text)
            this.element.textContent = this._label;
        else {
            switch (this._imageType) {
            case null:
            case WI.ButtonNavigationItem.ImageType.SVG: {
                if (this._image) {
                    let glyphElement = WI.ImageUtilities.useSVGSymbol(this._image, "glyph");
                    glyphElement.style.width = this._imageWidth + "px";
                    glyphElement.style.height = this._imageHeight + "px";
                    this.element.appendChild(glyphElement);
                }
                break;
            }

            case WI.ButtonNavigationItem.ImageType.IMG: {
                let img = this.element.appendChild(document.createElement("img"));
                if (this._image)
                    img.src = this._image;
                break;
            }
            }

            if (this._buttonStyle === WI.ButtonNavigationItem.Style.ImageAndText) {
                let labelElement = this.element.appendChild(document.createElement("span"));
                labelElement.textContent = this._label;
            }
        }

        if (this._buttonStyle === WI.ButtonNavigationItem.Style.Image)
            this.tooltip ||= this._label;
    }

    _updateTabIndex()
    {
        if (!this._enabled) {
            this.element.tabIndex = -1;
            return;
        }

        this.element.tabIndex = this.tabbable ? 0 : -1;
    }
};

WI.ButtonNavigationItem.Event = {
    Clicked: "button-navigation-item-clicked"
};

WI.ButtonNavigationItem.Style = {
    Image: "image-only",
    Text: "text-only",
    ImageAndText: "image-and-text",
};

WI.ButtonNavigationItem.ImageType = {
    SVG: "image-type-svg",
    IMG: "image-type-img",
};
