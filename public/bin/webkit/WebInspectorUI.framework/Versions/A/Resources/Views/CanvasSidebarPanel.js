/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.CanvasSidebarPanel = class CanvasSidebarPanel extends WI.NavigationSidebarPanel
{
    constructor()
    {
        super("canvas", WI.UIString("Canvas"));

        this._canvas = null;
        this._recording = null;

        this._navigationBar = new WI.NavigationBar;
        this._scopeBar = null;
        this._placeholderScopeBarItem = null;

        const toolTip = WI.UIString("Start recording canvas actions.\nShift-click to record a single frame.");
        const altToolTip = WI.UIString("Stop recording canvas actions");
        this._recordButtonNavigationItem = new WI.ToggleButtonNavigationItem("record-start-stop", toolTip, altToolTip, "Images/Record.svg", "Images/Stop.svg", 13, 13);
        this._recordButtonNavigationItem.enabled = false;
        this._recordButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        this._recordButtonNavigationItem.label = WI.UIString("Start");
        this._recordButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._toggleRecording, this);
        this._navigationBar.addNavigationItem(this._recordButtonNavigationItem);

        this._navigationBar.addNavigationItem(new WI.DividerNavigationItem);

        let importButtonNavigationItem = new WI.ButtonNavigationItem("import-recording", WI.UIString("Import"), "Images/Import.svg", 15, 15);
        importButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
        importButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        importButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleImportButtonNavigationItemClicked, this);
        this._navigationBar.addNavigationItem(importButtonNavigationItem);

        this.addSubview(this._navigationBar);

        this._canvasTreeOutline = this.createContentTreeOutline({suppressFiltering: true});
        this._canvasTreeOutline.element.classList.add("canvas");

        this._recordingNavigationBar = new WI.NavigationBar;
        this._recordingNavigationBar.element.classList.add("hidden");
        this.contentView.addSubview(this._recordingNavigationBar);

        this._recordingContentContainer = this.contentView.element.appendChild(document.createElement("div"));
        this._recordingContentContainer.className = "recording-content";

        this._recordingTreeOutline = this.contentTreeOutline;
        this._recordingContentContainer.appendChild(this._recordingTreeOutline.element);

        this._recordingTreeOutline.customIndent = true;
        this._recordingTreeOutline.registerScrollVirtualizer(this._recordingContentContainer, 20);

        this._canvasTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeSelectionDidChange, this);
        this._recordingTreeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeSelectionDidChange, this);

        this._recordingProcessingOptionsContainer = null;

        this._selectedRecordingActionIndex = NaN;
    }

    // Public

    get canvas()
    {
        return this._canvas;
    }

    set canvas(canvas)
    {
        if (this._canvas === canvas)
            return;

        if (this._canvas) {
            this._canvas.removeEventListener(WI.Canvas.Event.RecordingStarted, this._updateRecordNavigationItem, this);
            this._canvas.removeEventListener(WI.Canvas.Event.RecordingStopped, this._updateRecordNavigationItem, this);
            this._canvas.recordingCollection.removeEventListener(WI.Collection.Event.ItemAdded, this._recordingAdded, this);
            this._canvas.recordingCollection.removeEventListener(WI.Collection.Event.ItemRemoved, this._recordingRemoved, this);
        }

        this._canvas = canvas;

        if (this._canvas) {
            this._canvas.addEventListener(WI.Canvas.Event.RecordingStarted, this._updateRecordNavigationItem, this);
            this._canvas.addEventListener(WI.Canvas.Event.RecordingStopped, this._updateRecordNavigationItem, this);
            this._canvas.recordingCollection.addEventListener(WI.Collection.Event.ItemAdded, this._recordingAdded, this);
            this._canvas.recordingCollection.addEventListener(WI.Collection.Event.ItemRemoved, this._recordingRemoved, this);
        }

        this._canvasChanged();
        this._updateRecordNavigationItem();
        this._updateRecordingScopeBar();
    }

    set recording(recording)
    {
        if (recording === this._recording)
            return;

        if (this._recording && !this._recording.ready) {
            this._recording.removeEventListener(WI.Recording.Event.ProcessedAction, this._handleRecordingProcessedAction, this);
            this._recording.removeEventListener(WI.Recording.Event.StartProcessingFrame, this._handleRecordingStartProcessingFrame, this);
        }

        if (recording)
            this.canvas = recording.source;

        this._recording = recording;

        if (this._recording && !this._recording.ready) {
            this._recording.addEventListener(WI.Recording.Event.ProcessedAction, this._handleRecordingProcessedAction, this);
            this._recording.addEventListener(WI.Recording.Event.StartProcessingFrame, this._handleRecordingStartProcessingFrame, this);
        }

        this._updateRecordNavigationItem();
        this._updateRecordingScopeBar();
        this._recordingChanged();
    }

    set action(action)
    {
        if (!this._recording)
            return;

        if (action === this._recording.actions[this._selectedRecordingActionIndex])
            return;

        let selectedTreeElement = this._recordingTreeOutline.selectedTreeElement;
        if (!action) {
            if (selectedTreeElement)
                selectedTreeElement.deselect();
            return;
        }

        if (selectedTreeElement && selectedTreeElement instanceof WI.FolderTreeElement) {
            let lastActionTreeElement = selectedTreeElement.children.lastValue;
            if (action === lastActionTreeElement.representedObject)
                return;
        }

        let treeElement = this._recordingTreeOutline.findTreeElement(action);
        console.assert(treeElement, "Missing tree element for recording action.", action);
        if (!treeElement)
            return;

        this._recording[WI.CanvasSidebarPanel.SelectedActionSymbol] = action;

        const omitFocus = false;
        const selectedByUser = false;
        treeElement.revealAndSelect(omitFocus, selectedByUser);

        this._selectedRecordingActionIndex = this._recording.actions.indexOf(action);
    }

    updateRepresentedObjects()
    {
        let objects = this.contentBrowser.currentRepresentedObjects;

        let canvas = objects.find((object) => object instanceof WI.Canvas);
        if (canvas) {
            this.canvas = canvas;
            let treeElement = this._canvasTreeOutline.findTreeElement(canvas);
            const omitFocus = false;
            const selectedByUser = false;
            treeElement.revealAndSelect(omitFocus, selectedByUser);
            return;
        }

        let shaderProgram = objects.find((object) => object instanceof WI.ShaderProgram);
        if (shaderProgram) {
            this.canvas = shaderProgram.canvas;
            let treeElement = this._canvasTreeOutline.findTreeElement(shaderProgram);
            const omitFocus = false;
            const selectedByUser = false;
            treeElement.revealAndSelect(omitFocus, selectedByUser);
            return;
        }

        let recording = objects.find((object) => object instanceof WI.Recording);
        if (recording) {
            this.canvas = recording.source;

            this.recording = recording;

            let recordingAction = objects.find((object) => object instanceof WI.RecordingAction);
            if (recordingAction !== recording[WI.CanvasSidebarPanel.SelectedActionSymbol])
                this.action = recordingAction;

            return;
        }

        this.canvas = null;
        this.recording = null;
    }

    attached()
    {
        super.attached();

        this.contentBrowser.addEventListener(WI.ContentBrowser.Event.CurrentRepresentedObjectsDidChange, this.updateRepresentedObjects, this);
        this.updateRepresentedObjects();

        if (this._recording) {
            this._recordingTreeOutline.updateVirtualizedElementsDebouncer.force();

            let action = this._recording[WI.CanvasSidebarPanel.SelectedActionSymbol];
            let treeElement = this._recordingTreeOutline.findTreeElement(action);
            if (treeElement) {
                const omitFocus = false;
                const selectedByUser = false;
                treeElement.revealAndSelect(omitFocus, selectedByUser);
            }
        }
    }

    detached()
    {
        this.contentBrowser.removeEventListener(WI.ContentBrowser.Event.CurrentRepresentedObjectsDidChange, this.updateRepresentedObjects, this);

        super.detached();
    }

    canShowRepresentedObject(representedObject)
    {
        return representedObject instanceof WI.Canvas
            || representedObject instanceof WI.ShaderProgram
            || representedObject instanceof WI.Recording;
    }

    // Protected

    get scrollElement()
    {
        return this._recordingContentContainer;
    }

    hasCustomFilters()
    {
        return true;
    }

    matchTreeElementAgainstCustomFilters(treeElement)
    {
        // Keep recording frame tree elements.
        if (treeElement instanceof WI.FolderTreeElement)
            return true;

        // Always show the Initial State tree element.
        if (treeElement instanceof WI.RecordingActionTreeElement && treeElement.representedObject instanceof WI.RecordingInitialStateAction)
            return true;

        return super.matchTreeElementAgainstCustomFilters(treeElement);
    }

    initialLayout()
    {
        super.initialLayout();

        let filterFunction = (treeElement) => {
            if (!(treeElement.representedObject instanceof WI.RecordingAction))
                return false;

            return treeElement.representedObject.isVisual || treeElement.representedObject instanceof WI.RecordingInitialStateAction;
        };

        const activatedByDefault = false;
        const defaultToolTip = WI.UIString("Only show visual actions");
        const activatedToolTip = WI.UIString("Show all actions");
        this.filterBar.addFilterBarButton("recording-show-visual-only", filterFunction, activatedByDefault, defaultToolTip, activatedToolTip, "Images/Paint.svg", 15, 15);
    }

    // Private

    _recordingAdded(event)
    {
        this.recording = event.data.item;
    }

    _recordingRemoved(event)
    {
        this._updateRecordingScopeBar();

        let recording = event.data.item;
        if (recording === this.recording)
            this.recording = this._canvas ? Array.from(this._canvas.recordingCollection).lastValue : null;
    }

    _scopeBarSelectionChanged()
    {
        let selectedScopeBarItem = this._scopeBar.selectedItems[0];
        this.recording = selectedScopeBarItem.__recording || null;
    }

    _toggleRecording(event)
    {
        if (!this._canvas)
            return;

        if (this._canvas.recordingActive)
            this._canvas.stopRecording();
        else {
            let singleFrame = event.data.nativeEvent.shiftKey;
            this._canvas.startRecording(singleFrame);
        }
    }

    _handleImportButtonNavigationItemClicked(event)
    {
        WI.FileUtilities.importJSON((result) => WI.canvasManager.processJSON(result), {multiple: true});
    }

    _treeSelectionDidChange(event)
    {
        let treeElement = event.target.selectedTreeElement;
        if (!treeElement)
            return;

        if ((treeElement instanceof WI.CanvasTreeElement) || (treeElement instanceof WI.ShaderProgramTreeElement)) {
            if (this._placeholderScopeBarItem)
                this._placeholderScopeBarItem.selected = true;

            this.showDefaultContentViewForTreeElement(treeElement);
            return;
        }

        if (treeElement instanceof WI.FolderTreeElement)
            treeElement = treeElement.children.lastValue;

        if (!(treeElement instanceof WI.RecordingActionTreeElement))
            return;

        console.assert(this._recording, "Missing recording for action tree element.", treeElement);
        this._recording[WI.CanvasSidebarPanel.SelectedActionSymbol] = treeElement.representedObject;

        const onlyExisting = true;
        let recordingContentView = this.contentBrowser.contentViewForRepresentedObject(this._recording, onlyExisting);
        if (!recordingContentView)
            return;

        this.contentBrowser.showContentView(recordingContentView);

        this._selectedRecordingActionIndex = treeElement.index;
        recordingContentView.updateActionIndex(this._selectedRecordingActionIndex);
    }

    _canvasChanged()
    {
        this._canvasTreeOutline.removeChildren();

        if (!this._canvas) {
            this._recordingNavigationBar.element.classList.add("hidden");
            return;
        }

        const showRecordings = false;
        let canvasTreeElement = new WI.CanvasTreeElement(this._canvas, showRecordings);
        canvasTreeElement.expanded = true;
        this._canvasTreeOutline.appendChild(canvasTreeElement);

        const omitFocus = false;
        const selectedByUser = false;
        canvasTreeElement.revealAndSelect(omitFocus, selectedByUser);

        if (this._canvas.supportsRecording)
            this._recordButtonNavigationItem.enabled = true;

        this.recording = null;
    }

    _recordingChanged()
    {
        this._recordingTreeOutline.removeChildren();

        this._selectedRecordingActionIndex = NaN;

        if (this._recordingProcessingOptionsContainer) {
            this._recordingProcessingOptionsContainer.remove();
            this._recordingProcessingOptionsContainer = null;
        }

        if (!this._recording)
            return;

        if (!this._recording.ready) {
            if (!this._recording.processing)
                this._recording.startProcessing();

            if (!this._recordingProcessingOptionsContainer) {
                this._recordingProcessingOptionsContainer = this._recordingContentContainer.appendChild(document.createElement("div"));
                this._recordingProcessingOptionsContainer.classList.add("recording-processing-options");

                let createPauseButton = () => {
                    let spinner = new WI.IndeterminateProgressSpinner;
                    this._recordingProcessingOptionsContainer.appendChild(spinner.element);

                    let pauseButton = this._recordingProcessingOptionsContainer.appendChild(document.createElement("button"));
                    pauseButton.textContent = WI.UIString("Pause Processing");
                    pauseButton.addEventListener("click", (event) => {
                        this._recording.stopProcessing();

                        spinner.element.remove();
                        pauseButton.remove();
                        createResumeButton();
                    });
                };

                let createResumeButton = () => {
                    let resumeButton = this._recordingProcessingOptionsContainer.appendChild(document.createElement("button"));
                    resumeButton.textContent = WI.UIString("Resume Processing");
                    resumeButton.addEventListener("click", (event) => {
                        this._recording.startProcessing();

                        resumeButton.remove();
                        createPauseButton();
                    });
                };

                if (this._recording.processing)
                    createPauseButton();
                else
                    createResumeButton();
            }
        }

        this.contentBrowser.showContentViewForRepresentedObject(this._recording);

        if (this._scopeBar) {
            let scopeBarItem = this._scopeBar.item(this._recording.displayName);
            console.assert(scopeBarItem, "Missing scopeBarItem for recording.", this._recording);
            scopeBarItem.selected = true;
        }

        let initialStateAction = this._recording.actions[0];
        if (initialStateAction.ready && !this._recordingTreeOutline.getCachedTreeElement(initialStateAction)) {
            this._recordingTreeOutline.appendChild(new WI.RecordingActionTreeElement(initialStateAction, 0, this._recording.type));

            if (!this._recording[WI.CanvasSidebarPanel.SelectedActionSymbol])
                this.action = initialStateAction;
        }

        let cumulativeActionIndex = 0;
        this._recording.frames.forEach((frame, frameIndex) => {
            if (!frame.actions[0].ready)
                return;

            let folder = this._recordingTreeOutline.getCachedTreeElement(frame);
            if (!folder)
                folder = this._createRecordingFrameTreeElement(frame, frameIndex, this._recordingTreeOutline);

            for (let action of frame.actions) {
                ++cumulativeActionIndex;

                if (!action.ready || this._recordingTreeOutline.getCachedTreeElement(action))
                    break;

                this._createRecordingActionTreeElement(action, cumulativeActionIndex, folder);
            }
        });
    }

    _updateRecordNavigationItem()
    {
        if (!this._canvas?.supportsRecording) {
            this._recordButtonNavigationItem.enabled = false;
            return;
        }

        this._recordButtonNavigationItem.toggled = this._canvas.recordingActive;
        this._recordButtonNavigationItem.label = this._recordButtonNavigationItem.toggled ? WI.UIString("Stop") : WI.UIString("Start");
    }

    _updateRecordingScopeBar()
    {
        if (this._scopeBar) {
            this._placeholderScopeBarItem = null;

            this._recordingNavigationBar.removeNavigationItem(this._scopeBar);
            this._scopeBar = null;
        }

        this._recordingNavigationBar.element.classList.toggle("hidden", !this._canvas);

        let hasRecordings = this._recording || (this._canvas && this._canvas.recordingCollection.size);
        this.element.classList.toggle("has-recordings", hasRecordings);
        this.element.classList.toggle("showing-recording", !!this._recording);
        if (!hasRecordings)
            return;

        let scopeBarItems = [];
        let selectedScopeBarItem = null;

        let createScopeBarItem = (recording) => {
            let scopeBarItem = new WI.ScopeBarItem(recording.displayName, recording.displayName);
            if (recording === this._recording)
                selectedScopeBarItem = scopeBarItem;
            else
                scopeBarItem.selected = false;
            scopeBarItem.__recording = recording;
            scopeBarItems.push(scopeBarItem);
        };

        if (this._canvas && this._canvas.recordingCollection) {
            for (let recording of this._canvas.recordingCollection)
                createScopeBarItem(recording);
        }

        if (this._recording && (!this._canvas || !this._canvas.recordingCollection.has(this._recording)))
            createScopeBarItem(this._recording);

        if (!selectedScopeBarItem) {
            selectedScopeBarItem = scopeBarItems[0];

            this._placeholderScopeBarItem = new WI.ScopeBarItem("canvas-recording-scope-bar-item-placeholder", WI.UIString("Recordings"), {exclusive: true, hidden: true});
            this._placeholderScopeBarItem.selected = true;

            scopeBarItems.unshift(this._placeholderScopeBarItem);
        }

        this._scopeBar = new WI.ScopeBar("canvas-recording-scope-bar", scopeBarItems, selectedScopeBarItem, true);
        this._scopeBar.addEventListener(WI.ScopeBar.Event.SelectionChanged, this._scopeBarSelectionChanged, this);
        this._recordingNavigationBar.insertNavigationItem(this._scopeBar, 0);
    }

    _createRecordingFrameTreeElement(frame, index, parent)
    {
        let folder = new WI.FolderTreeElement(WI.UIString("Frame %d").format((index + 1).toLocaleString()), frame);

        if (!isNaN(frame.duration)) {
            const higherResolution = true;
            folder.status = Number.secondsToString(frame.duration / 1000, higherResolution);
        }

        parent.appendChild(folder);

        return folder;
    }

    _createRecordingActionTreeElement(action, index, parent)
    {
        let treeElement = new WI.RecordingActionTreeElement(action, index, this._recording.type);

        parent.appendChild(treeElement);

        if (parent instanceof WI.FolderTreeElement && parent.representedObject instanceof WI.RecordingFrame) {
            if (action !== parent.representedObject.actions.lastValue) {
                parent.addClassName("processing");

                if (!(parent.subtitle instanceof HTMLProgressElement))
                    parent.subtitle = document.createElement("progress");

                if (parent.statusElement)
                    parent.subtitle.style.setProperty("width", `calc(100% - ${parent.statusElement.offsetWidth + 4}px`);

                parent.subtitle.value = parent.representedObject.actions.indexOf(action) / parent.representedObject.actions.length;
            } else {
                parent.removeClassName("processing");
                if (parent.representedObject.incomplete)
                    parent.subtitle = WI.UIString("Incomplete");
                else
                    parent.subtitle = "";
            }
        }

        if (action === this._recording[WI.CanvasSidebarPanel.SelectedActionSymbol])
            this.action = action;

        return treeElement;
    }

    _handleRecordingProcessedAction(event)
    {
        let {action, index} = event.data;

        this._recordingTreeOutline.element.dataset.indent = Number.countDigits(index);

        let isInitialStateAction = !index;

        console.assert(isInitialStateAction || this._recordingTreeOutline.children.lastValue instanceof WI.FolderTreeElement, "There should be a WI.FolderTreeElement for the frame for this action.");
        this._createRecordingActionTreeElement(action, index, isInitialStateAction ? this._recordingTreeOutline : this._recordingTreeOutline.children.lastValue);

        if (!this._recording[WI.CanvasSidebarPanel.SelectedActionSymbol]) {
            console.assert(action === this._recording.actions[0]);
            this.action = this._recording.actions[0];
        }

        if (this._recording.ready) {
            this._recording.removeEventListener(WI.Recording.Event.ProcessedAction, this._handleRecordingProcessedAction, this);
            this._recording.removeEventListener(WI.Recording.Event.StartProcessingFrame, this._handleRecordingStartProcessingFrame, this);

            if (this._recordingProcessingOptionsContainer) {
                this._recordingProcessingOptionsContainer.remove();
                this._recordingProcessingOptionsContainer = null;
            }
        }
    }

    _handleRecordingStartProcessingFrame(event)
    {
        let {frame, index} = event.data;

        this._createRecordingFrameTreeElement(frame, index, this._recordingTreeOutline);
    }
};

WI.CanvasSidebarPanel.SelectedActionSymbol = Symbol("selected-action");
