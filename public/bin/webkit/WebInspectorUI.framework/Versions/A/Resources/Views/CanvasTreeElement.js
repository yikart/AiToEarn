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

WI.CanvasTreeElement = class CanvasTreeElement extends WI.FolderizedTreeElement
{
    constructor(representedObject, showRecordings = true)
    {
        console.assert(representedObject instanceof WI.Canvas);

        let subtitle = WI.Canvas.displayNameForContextType(representedObject.contextType);
        super(["canvas", representedObject.contextType], representedObject.displayName, subtitle, representedObject);

        this.registerFolderizeSettings("shader-programs", WI.UIString("Shader Programs"), this.representedObject.shaderProgramCollection, WI.ShaderProgramTreeElement);

        this.representedObject.addEventListener(WI.Canvas.Event.RecordingStarted, this._updateStatus, this);
        this.representedObject.addEventListener(WI.Canvas.Event.RecordingStopped, this._updateStatus, this);
        this.representedObject.shaderProgramCollection.addEventListener(WI.Collection.Event.ItemAdded, this._handleItemAdded, this);
        this.representedObject.shaderProgramCollection.addEventListener(WI.Collection.Event.ItemRemoved, this._handleItemRemoved, this);

        this._showRecordings = showRecordings;
        if (this._showRecordings) {
            function createRecordingTreeElement(recording) {
                return new WI.GeneralTreeElement(["recording"], recording.displayName, null, recording);
            }
            this.registerFolderizeSettings("recordings", WI.UIString("Recordings"), this.representedObject.recordingCollection, createRecordingTreeElement);

            this.representedObject.recordingCollection.addEventListener(WI.Collection.Event.ItemAdded, this._handleItemAdded, this);
            this.representedObject.recordingCollection.addEventListener(WI.Collection.Event.ItemRemoved, this._handleItemRemoved, this);
        }
    }

    // Protected

    onattach()
    {
        super.onattach();

        this.element.addEventListener("mouseover", this._handleMouseOver.bind(this));
        this.element.addEventListener("mouseout", this._handleMouseOut.bind(this));

        this.onpopulate();
    }

    onpopulate()
    {
        super.onpopulate();

        if (this.children.length && !this.shouldRefreshChildren)
            return;

        this.shouldRefreshChildren = false;

        this.removeChildren();

        for (let program of this.representedObject.shaderProgramCollection)
            this.addChildForRepresentedObject(program);

        if (this._showRecordings) {
            for (let recording of this.representedObject.recordingCollection)
                this.addChildForRepresentedObject(recording);
        }
    }

    populateContextMenu(contextMenu, event)
    {
        super.populateContextMenu(contextMenu, event);

        contextMenu.appendItem(WI.UIString("Log Canvas Context"), () => {
            WI.RemoteObject.resolveCanvasContext(this.representedObject, WI.RuntimeManager.ConsoleObjectGroup, (remoteObject) => {
                if (!remoteObject)
                    return;

                const text = WI.UIString("Selected Canvas Context");
                WI.consoleLogViewController.appendImmediateExecutionWithResult(text, remoteObject, {addSpecialUserLogClass: true, shouldRevealConsole: true});
            });
        });

        contextMenu.appendSeparator();
    }

    // Private

    _handleItemAdded(event)
    {
        this.addChildForRepresentedObject(event.data.item);
    }

    _handleItemRemoved(event)
    {
        this.removeChildForRepresentedObject(event.data.item);
    }

    _handleMouseOver(event)
    {
        if (this.representedObject.cssCanvasName || this.representedObject.contextType === WI.Canvas.ContextType.WebGPU) {
            this.representedObject.requestClientNodes((clientNodes) => {
                WI.domManager.highlightDOMNodeList(clientNodes);
            });
        } else {
            this.representedObject.requestNode((node) => {
                if (!node || !node.ownerDocument)
                    return;

                node.highlight();
            });
        }
    }

    _handleMouseOut(event)
    {
        WI.domManager.hideDOMNodeHighlight();
    }

    _updateStatus()
    {
        if (this.representedObject.recordingActive) {
            if (!this.status || !this.status.__showingSpinner) {
                let spinner = new WI.IndeterminateProgressSpinner;
                this.status = spinner.element;
                this.status.__showingSpinner = true;
            }
        } else {
            if (this.status && this.status.__showingSpinner)
                this.status = "";
        }
    }
};
