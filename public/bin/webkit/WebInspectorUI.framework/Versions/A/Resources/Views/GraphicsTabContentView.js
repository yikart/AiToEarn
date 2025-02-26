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

WI.GraphicsTabContentView = class GraphicsTabContentView extends WI.ContentBrowserTabContentView
{
    constructor()
    {
        super(GraphicsTabContentView.tabInfo(), {
            navigationSidebarPanelConstructor: WI.CanvasSidebarPanel,
            detailsSidebarPanelConstructors: [
                WI.RecordingStateDetailsSidebarPanel,
                WI.RecordingTraceDetailsSidebarPanel,
                WI.CanvasDetailsSidebarPanel,
                WI.AnimationDetailsSidebarPanel,
            ],
            hideBackForwardButtons: true,
        });

        this._canvasesTreeOutline = new WI.TreeOutline;
        this._canvasesTreeOutline.allowsRepeatSelection = true;
        this._canvasesTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._handleOverviewTreeOutlineSelectionDidChange, this);

        this._canvasesTreeElement = new WI.GeneralTreeElement("canvas-overview", WI.UIString("Overview"), null, {[WI.ContentView.isViewableSymbol]: true});
        this._canvasesTreeOutline.appendChild(this._canvasesTreeElement);

        this._savedCanvasRecordingsTreeElement = new WI.FolderTreeElement(WI.UIString("Saved Recordings"));
        this._savedCanvasRecordingsTreeElement.hidden = true;
        this._canvasesTreeElement.appendChild(this._savedCanvasRecordingsTreeElement);

        this._recordShortcut = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.Space, this._handleSpace.bind(this));
        this._recordShortcut.implicitlyPreventsDefault = false;
        this._recordShortcut.disabled = true;

        this._recordSingleFrameShortcut = new WI.KeyboardShortcut(WI.KeyboardShortcut.Modifier.Shift, WI.KeyboardShortcut.Key.Space, this._handleSpace.bind(this));
        this._recordSingleFrameShortcut.implicitlyPreventsDefault = false;
        this._recordSingleFrameShortcut.disabled = true;

        WI.canvasManager.enable();
        WI.animationManager.enable();
    }

    static tabInfo()
    {
        return {
            identifier: GraphicsTabContentView.Type,
            image: "Images/Graphics.svg",
            displayName: WI.UIString("Graphics", "Graphics Tab Name", "Name of Graphics Tab"),
        };
    }

    static isTabAllowed()
    {
        return InspectorBackend.hasDomain("Canvas")
            || InspectorBackend.hasDomain("Animation");
    }

    // Public

    treeElementForRepresentedObject(representedObject)
    {
        return this._canvasesTreeOutline.findTreeElement(representedObject);
    }

    get type()
    {
        return WI.GraphicsTabContentView.Type;
    }

    get supportsSplitContentBrowser()
    {
        return true;
    }

    get managesNavigationSidebarPanel()
    {
        return true;
    }

    showRepresentedObject(representedObject, cookie)
    {
        if (representedObject instanceof WI.Collection) {
            this.contentBrowser.showContentView(this._overviewContentView);
            return;
        }

        super.showRepresentedObject(representedObject, cookie);
    }

    canShowRepresentedObject(representedObject)
    {
        return representedObject instanceof WI.CanvasCollection
            || representedObject instanceof WI.Canvas
            || representedObject instanceof WI.Recording
            || representedObject instanceof WI.ShaderProgram
            || representedObject instanceof WI.AnimationCollection
            || representedObject instanceof WI.Animation;
    }

    closed()
    {
        WI.animationManager.disable();
        WI.canvasManager.disable();

        super.closed();
    }

    restoreStateFromCookie(cookie)
    {
        // FIXME: implement once <https://webkit.org/b/177606> is complete.
    }

    saveStateToCookie(cookie)
    {
        // FIXME: implement once <https://webkit.org/b/177606> is complete.
    }

    // DropZoneView delegate

    dropZoneShouldAppearForDragEvent(dropZone, event)
    {
        return event.dataTransfer.types.includes("Files");
    }

    dropZoneHandleDrop(dropZone, event)
    {
        let files = event.dataTransfer.files;
        if (files.length !== 1) {
            InspectorFrontendHost.beep();
            return;
        }

        WI.FileUtilities.readJSON(files, (result) => WI.canvasManager.processJSON(result));
    }

    // Protected

    attached()
    {
        super.attached();

        WI.canvasManager.canvasCollection.addEventListener(WI.Collection.Event.ItemAdded, this._handleCanvasAdded, this);
        WI.canvasManager.canvasCollection.addEventListener(WI.Collection.Event.ItemRemoved, this._handleCanvasRemoved, this);
        WI.canvasManager.addEventListener(WI.CanvasManager.Event.RecordingSaved, this._handleRecordingSavedOrStopped, this);
        WI.Canvas.addEventListener(WI.Canvas.Event.RecordingStopped, this._handleRecordingSavedOrStopped, this);

        for (let child of this._canvasesTreeElement.children) {
            let canvas = child.representedObject;
            if (canvas instanceof WI.Canvas && !WI.canvasManager.canvasCollection.has(canvas))
                this._removeCanvas(canvas);
        }

        for (let canvas of WI.canvasManager.canvasCollection) {
            if (!this._canvasesTreeOutline.findTreeElement(canvas))
                this._addCanvas(canvas);
        }

        for (let recording of WI.canvasManager.savedRecordings) {
            if (!this._canvasesTreeOutline.findTreeElement(recording))
                this._addRecording(recording, {suppressShowRecording: true});
        }

        this._recordShortcut.disabled = false;
        this._recordSingleFrameShortcut.disabled = false;
    }

    detached()
    {
        this._recordShortcut.disabled = true;
        this._recordSingleFrameShortcut.disabled = true;

        WI.Canvas.removeEventListener(WI.Canvas.Event.RecordingStopped, this._handleRecordingSavedOrStopped, this);
        WI.canvasManager.removeEventListener(WI.CanvasManager.Event.RecordingSaved, this._handleRecordingSavedOrStopped, this);
        WI.canvasManager.canvasCollection.removeEventListener(WI.Collection.Event.ItemAdded, this._handleCanvasAdded, this);
        WI.canvasManager.canvasCollection.removeEventListener(WI.Collection.Event.ItemRemoved, this._handleCanvasRemoved, this);

        super.detached();
    }

    initialLayout()
    {
        super.initialLayout();

        this._overviewContentView = new WI.GraphicsOverviewContentView;

        // FIXME: <https://webkit.org/b/224650> (Web Inspector: audit for re-entrancy issues with `initialLayout` and `layout`)
        setTimeout(() => {
            this.contentBrowser.showContentView(this._overviewContentView);
        });

        let dropZoneView = new WI.DropZoneView(this);
        dropZoneView.text = WI.UIString("Import Recording");
        dropZoneView.targetElement = this.element;
        this.addSubview(dropZoneView);
    }

    // Private

    _addCanvas(canvas)
    {
        this._canvasesTreeElement.appendChild(new WI.CanvasTreeElement(canvas));

        const options = {
            suppressShowRecording: true,
        };

        for (let recording of canvas.recordingCollection)
            this._addRecording(recording, options);
    }

    _removeCanvas(canvas)
    {
        let treeElement = this._canvasesTreeOutline.findTreeElement(canvas);
        console.assert(treeElement, "Missing tree element for canvas.", canvas);

        const suppressNotification = true;
        treeElement.deselect(suppressNotification);
        this._canvasesTreeElement.removeChild(treeElement);

        let currentContentView = this.contentBrowser.currentContentView;
        if (currentContentView instanceof WI.CanvasContentView && canvas === currentContentView.representedObject)
            WI.showRepresentedObject(WI.canvasManager.canvasCollection);
        else if (currentContentView instanceof WI.ShaderProgramContentView && canvas === currentContentView.representedObject.canvas)
            WI.showRepresentedObject(WI.canvasManager.canvasCollection);
        else if (currentContentView instanceof WI.RecordingContentView && canvas.recordingCollection.has(currentContentView.representedObject))
            this.contentBrowser.updateHierarchicalPathForCurrentContentView();

        let navigationSidebarPanel = this.navigationSidebarPanel;
        if (navigationSidebarPanel instanceof WI.CanvasSidebarPanel && navigationSidebarPanel.visible)
            navigationSidebarPanel.updateRepresentedObjects();

        this.showDetailsSidebarPanels();
    }

    _addRecording(recording, options = {})
    {
        if (!recording.source) {
            const subtitle = null;
            let recordingTreeElement = new WI.GeneralTreeElement(["recording"], recording.displayName, subtitle, recording);
            this._savedCanvasRecordingsTreeElement.hidden = false;
            this._savedCanvasRecordingsTreeElement.appendChild(recordingTreeElement);
        }

        if (!options.suppressShowRecording)
            this.showRepresentedObject(recording);
    }

    _handleCanvasAdded(event)
    {
        this._addCanvas(event.data.item);
    }

    _handleCanvasRemoved(event)
    {
        this._removeCanvas(event.data.item);
    }

    _handleOverviewTreeOutlineSelectionDidChange(event)
    {
        let selectedElement = this._canvasesTreeOutline.selectedTreeElement;
        if (!selectedElement)
            return;

        switch (selectedElement) {
        case this._canvasesTreeElement:
        case this._savedCanvasRecordingsTreeElement:
            this.contentBrowser.showContentView(this._overviewContentView);
            return;
        }

        let representedObject = selectedElement.representedObject;
        if (!this.canShowRepresentedObject(representedObject)) {
            console.assert(false, "Unexpected representedObject.", representedObject);
            return;
        }

        this.showRepresentedObject(representedObject);
    }

    _handleRecordingSavedOrStopped(event)
    {
        let {recording, initiatedByUser, imported} = event.data;
        if (!recording)
            return;

        let options = {};

        // Always show imported recordings.
        if (recording.source || !imported)
            options.suppressShowRecording = !initiatedByUser || this.contentBrowser.currentRepresentedObjects.some((representedObject) => representedObject instanceof WI.Recording);

        this._addRecording(recording, options);
    }

    _handleSpace(event)
    {
        if (WI.isEventTargetAnEditableField(event))
            return;

        if (!this.navigationSidebarPanel)
            return;

        let canvas = this.navigationSidebarPanel.canvas;
        if (!canvas)
            return;

        if (canvas.recordingActive)
            canvas.stopRecording();
        else {
            let singleFrame = !!event.shiftKey;
            canvas.startRecording(singleFrame);
        }

        event.preventDefault();
    }
};

WI.GraphicsTabContentView.Type = "graphics";
