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

WI.ScriptTreeElement = class ScriptTreeElement extends WI.SourceCodeTreeElement
{
    constructor(script, options = {})
    {
        console.assert(script instanceof WI.Script);

        let scriptDisplayName = script.displayName;

        let title = options.mainTitle || scriptDisplayName;
        let subtitle = null;
        let tooltip = null;
        let classNames = ["script"];

        if (script.url && !script.dynamicallyAddedScriptElement) {
            if (script.urlComponents.scheme !== "web-inspector") {
                // Show the host as the subtitle if it is different from the main title.
                let host = WI.displayNameForHost(script.urlComponents.host);
                if (host && title !== host)
                    subtitle = host;
                else if (scriptDisplayName && title !== scriptDisplayName)
                    subtitle = scriptDisplayName;

                tooltip = script.url;
            }

            classNames.push(WI.ResourceTreeElement.ResourceIconStyleClassName);
            classNames.push(WI.Resource.Type.Script);
        } else
            classNames.push(WI.ScriptTreeElement.AnonymousScriptIconStyleClassName);

        if (script.isMainResource()) {
            console.assert(script.target.type === WI.TargetType.Worker || script.target.type === WI.TargetType.ServiceWorker, script.target.type);
            classNames.push("worker-icon");
        }

        super(script, classNames, title, subtitle);

        this._script = script;

        if (tooltip)
            this.tooltip = tooltip;
    }

    // Public

    get script()
    {
        return this._script;
    }
};

WI.ScriptTreeElement.AnonymousScriptIconStyleClassName = "anonymous-script-icon";
