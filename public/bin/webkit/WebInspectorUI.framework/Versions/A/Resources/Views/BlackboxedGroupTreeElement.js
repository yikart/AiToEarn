/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

WI.BlackboxedGroupTreeElement = class BlackboxedGroupTreeElement extends WI.GeneralTreeElement
{
    constructor(callFrames, {rememberBlackboxedCallFrameGroupToAutoExpand} = {})
    {
        console.assert(!rememberBlackboxedCallFrameGroupToAutoExpand || !WI.debuggerManager.shouldAutoExpandBlackboxedCallFrameGroup(callFrames), callFrames);

        const classNames = ["blackboxed-group"];
        super(classNames, WI.BlackboxedGroupView.generateTitle(callFrames), WI.BlackboxedGroupView.generateSubtitle(callFrames));

        this.toggleOnClick = true;

        this._callFrames = callFrames;
        this._rememberBlackboxedCallFrameGroupToAutoExpand = rememberBlackboxedCallFrameGroupToAutoExpand || false;
    }

    // Public

    get callFrames() { return this._callFrames; }

    get expandable()
    {
        return true;
    }

    expand()
    {
        if (this._rememberBlackboxedCallFrameGroupToAutoExpand)
            WI.debuggerManager.rememberBlackboxedCallFrameGroupToAutoExpand(this._callFrames);

        let index = this.parent.children.indexOf(this);
        for (let i = this._callFrames.length - 1; i >= 0; --i)
            this.parent.insertChild(new WI.CallFrameTreeElement(this._callFrames[i]), index);

        this.parent.removeChild(this);
    }

    onenter()
    {
        this.expand();
        return true;
    }

    onspace()
    {
        this.expand();
        return true;
    }

    // Protected

    customTitleTooltip()
    {
        return WI.BlackboxedGroupView.generateTooltip(this._callFrames);
    }
};
