/*
 * Copyright (C) 2022 Apple Inc. All rights reserved.
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

WI.BlackboxedGroupView = class BlackboxedGroupView
{
    constructor(callFrames)
    {
        console.assert(Array.isArray(callFrames) && callFrames.length && callFrames.every((callFrame) => callFrame instanceof WI.CallFrame), callFrames);

        let element = document.createElement("div");
        element.className = "blackboxed-group";
        element.title = WI.BlackboxedGroupView.generateTooltip(callFrames);
        element.addEventListener("click", (event) => {
            const options = {showFunctionName: true, indicateIfBlackboxed: true};
            for (let i = callFrames.length - 1; i >= 0; --i)
                element.parentElement.insertBefore(new WI.CallFrameView(callFrames[i], options), element);

            element.remove();
        });

        let titleElement = element.appendChild(document.createElement("span"));
        titleElement.className = "title";

        let iconElement = titleElement.appendChild(document.createElement("img"));
        iconElement.className = "icon";

        titleElement.append(WI.BlackboxedGroupView.generateTitle(callFrames));

        let subtitleElement = element.appendChild(document.createElement("span"));
        subtitleElement.className = "subtitle";

        let separatorElement = subtitleElement.appendChild(document.createElement("span"));
        separatorElement.className = "separator";
        separatorElement.textContent = " " + emDash + " ";

        subtitleElement.append(WI.BlackboxedGroupView.generateSubtitle(callFrames));

        return element;
    }

    // Static

    static generateTitle(callFrames)
    {
        return WI.UIString("Blackboxed", "Blackboxed @ Debugger Call Stack", "Part of the 'Blackboxed - %d call frames' label shown in the debugger call stack when paused instead of subsequent call frames that have been blackboxed.");
    }

    static generateSubtitle(callFrames)
    {
        if (callFrames.length === 1)
            return WI.UIString("%d call frame", "call frame @ Debugger Call Stack", "Part of the 'Blackboxed - %d call frame' label shown in the debugger call stack when paused instead of subsequent call frames that have been blackboxed.").format(callFrames.length);

        return WI.UIString("%d call frames", "call frames @ Debugger Call Stack", "Part of the 'Blackboxed - %d call frames' label shown in the debugger call stack when paused instead of subsequent call frames that have been blackboxed.").format(callFrames.length);
    }

    static generateTooltip(callFrames)
    {
        if (callFrames.length === 1)
            return WI.UIString("Click to show %d blackboxed call frame", "Click to show blackboxed call frame @ Debugger Call Stack", "Tooltip for the 'Blackboxed - %d call frame' label shown in the debugger call stack when paused instead of subsequent call frames that have been blackboxed.").format(callFrames.length);

        return WI.UIString("Click to show %d blackboxed call frames", "Click to show blackboxed call frames @ Debugger Call Stack", "Tooltip for the 'Blackboxed - %d call frames' label shown in the debugger call stack when paused instead of subsequent call frames that have been blackboxed.").format(callFrames.length);
    }
};
