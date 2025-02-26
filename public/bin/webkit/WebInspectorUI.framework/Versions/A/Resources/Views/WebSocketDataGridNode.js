/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.WebSocketDataGridNode = class WebSocketDataGridNode extends WI.DataGridNode
{
    // Public

    createCellContent(columnIdentifier)
    {
        if (columnIdentifier === "data") {
            let fragment = document.createDocumentFragment();
            if (this._data.isOutgoing) {
                let iconElement = WI.ImageUtilities.useSVGSymbol("Images/ArrowUp.svg", "icon", WI.UIString("Outgoing message"));
                fragment.appendChild(iconElement);
            }
            fragment.appendChild(document.createTextNode(this._data.data));
            return fragment;
        }

        if (columnIdentifier === "time")
            return this._timeStringFromTimestamp(this._data.time);

        return super.createCellContent(columnIdentifier);
    }

    // Protected

    appendContextMenuItems(contextMenu)
    {
        let logResult = (result, wasThrown, savedResultIndex) => {
            console.assert(!wasThrown);

            const title = WI.UIString("Selected Frame");
            WI.consoleLogViewController.appendImmediateExecutionWithResult(title, result, {addSpecialUserLogClass: true, shouldRevealConsole: true});
        };

        if (this._data.isText) {
            let remoteObject = WI.RemoteObject.fromPrimitiveValue(this._data.data);
            contextMenu.appendItem(WI.UIString("Log Frame Text"), () => {
                WI.runtimeManager.saveResult(remoteObject, (savedResultIndex) => {
                    logResult(remoteObject, false, savedResultIndex);
                });
            });

            if (this._data.data.isJSON()) {
                contextMenu.appendItem(WI.UIString("Log Frame Value"), () => {
                    const options = {
                        objectGroup: WI.RuntimeManager.ConsoleObjectGroup,
                        generatePreview: true,
                        saveResult: true,
                        doNotPauseOnExceptionsAndMuteConsole: true,
                    };

                    let expression = "(" + this._data.data + ")";
                    WI.runtimeManager.evaluateInInspectedWindow(expression, options, logResult);
                });
            }

            contextMenu.appendSeparator();
        }

        return super.appendContextMenuItems(contextMenu);
    }

    // Private

    _timeStringFromTimestamp(timestamp)
    {
        return new Date(timestamp * 1000).toLocaleTimeString();
    }
};
