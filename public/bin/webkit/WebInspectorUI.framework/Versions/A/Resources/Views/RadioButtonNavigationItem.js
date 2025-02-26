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

WI.RadioButtonNavigationItem = class RadioButtonNavigationItem extends WI.ButtonNavigationItem
{
    constructor(identifier, toolTip, image, imageWidth, imageHeight)
    {
        super(identifier, toolTip, image, imageWidth, imageHeight, "tab");

        console.assert(this.buttonStyle === WI.ButtonNavigationItem.Style.Text);
    }

    // Public

    get selected()
    {
        return this.element.classList.contains(WI.RadioButtonNavigationItem.SelectedStyleClassName);
    }

    set selected(flag)
    {
        if (flag) {
            this.element.classList.add(WI.RadioButtonNavigationItem.SelectedStyleClassName);
            this.element.setAttribute("aria-selected", "true");
            this.element.tabIndex = 0;
        } else {
            this.element.classList.remove(WI.RadioButtonNavigationItem.SelectedStyleClassName);
            this.element.setAttribute("aria-selected", "false");
            this.element.tabIndex = -1;
        }
    }

    get active()
    {
        return this.element.classList.contains(WI.RadioButtonNavigationItem.ActiveStyleClassName);
    }

    set active(flag)
    {
        this.element.classList.toggle(WI.RadioButtonNavigationItem.ActiveStyleClassName, flag);
    }

    get buttonStyle()
    {
        return super.buttonStyle;
    }

    set buttonStyle(newButtonStyle)
    {
        if (newButtonStyle !== WI.ButtonNavigationItem.Style.Text)
            return;

        super.buttonStyle = newButtonStyle;
    }

    // Protected

    get additionalClassNames()
    {
        return ["radio", "button"];
    }

    get tabbable()
    {
        return this.selected;
    }
};

WI.RadioButtonNavigationItem.StyleClassName = "radio";
WI.RadioButtonNavigationItem.ActiveStyleClassName = "active";
WI.RadioButtonNavigationItem.SelectedStyleClassName = "selected";
