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

WI.ConsoleSnippet = class ConsoleSnippet extends WI.LocalScript
{
    constructor(title, source)
    {
        console.assert(typeof title === "string" && title.trim().length, title);

        const target = null;
        const sourceURL = null;
        super(target, title, sourceURL, WI.Script.SourceType.Program, source, {editable: true});
    }

    // Static

    static createDefaultWithTitle(title)
    {
        const source = `
/*
 * ${WI.UIString("Console Snippets are an easy way to save and evaluate JavaScript in the Console.")}
 * 
 * ${WI.UIString("As such, the contents will be run as though it was typed into the Console.")}
 * ${WI.UIString("This means all of the Console Command Line API is available <https://webkit.org/web-inspector/console-command-line-api/>.")}
 * 
 * ${WI.UIString("Modifications are saved automatically and will apply the next time the Console Snippet is run.")}
 * ${WI.UIString("The contents will be preserved across Web Inspector sessions.")}
 * 
 * ${WI.UIString("More information is available at <https://webkit.org/web-inspector/console-snippets/>.")}
 */

"Hello World!"
`.trimStart();
        return new WI.ConsoleSnippet(title, source);
    }

    // Public

    get title()
    {
        return this.url;
    }

    run()
    {
        WI.runtimeManager.evaluateInInspectedWindow(this.content, {
            objectGroup: WI.RuntimeManager.ConsoleObjectGroup,
            includeCommandLineAPI: true,
            doNotPauseOnExceptionsAndMuteConsole: true,
            generatePreview: true,
            saveResult: true,
        }, (result, wasThrown) => {
            WI.consoleLogViewController.appendImmediateExecutionWithResult(this.title, result, {
                addSpecialUserLogClass: true,
                shouldRevealConsole: true,
                handleClick: (event) => {
                    if (!WI.consoleManager.snippets.has(this))
                        return;

                    const cookie = null;
                    WI.showRepresentedObject(this, cookie, {
                        ignoreNetworkTab: true,
                        ignoreSearchTab: true,
                    });
                },
            });
        });
    }

    // Import / Export

    static fromJSON(json)
    {
        return new WI.ConsoleSnippet(json.title, json.source);
    }

    toJSON(key)
    {
        let json = {
            title: this.title,
            source: this.content,
        };
        if (key === WI.ObjectStore.toJSONSymbol)
            json[WI.objectStores.breakpoints.keyPath] = this.title;
        return json;
    }
};
