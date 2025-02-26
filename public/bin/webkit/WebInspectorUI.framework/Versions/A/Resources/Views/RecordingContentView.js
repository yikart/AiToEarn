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

WI.RecordingContentView = class RecordingContentView extends WI.ContentView
{
    constructor(representedObject)
    {
        console.assert(representedObject instanceof WI.Recording);

        super(representedObject);

        this._index = NaN;
        this._action = null;
        this._snapshots = [];
        this._initialContent = null;
        this._generateContentThrottler = new Throttler(() => {
            if (this.representedObject.isCanvas2D)
                this._generateContentCanvas2D(this._index);
            else if (this.representedObject.isCanvasBitmapRenderer || this.representedObject.isCanvasWebGL || this.representedObject.isCanvasWebGL2)
                this._generateContentFromSnapshot(this._index);
        }, 200);

        this.element.classList.add("recording", this.representedObject.type);

        if (this.representedObject.isCanvas) {
            if (this.representedObject.isCanvas2D) {
                this._pathContext = null;

                this._showPathButtonNavigationItem = new WI.ActivateButtonNavigationItem("show-path", WI.UIString("Show Path"), WI.UIString("Hide Path"), "Images/Path.svg", 16, 16);
                this._showPathButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
                this._showPathButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._showPathButtonClicked, this);
                this._showPathButtonNavigationItem.activated = !!WI.settings.showCanvasPath.value;
            }

            this._showGridButtonNavigationItem = new WI.ActivateButtonNavigationItem("show-grid", WI.repeatedUIString.showTransparencyGridTooltip(), WI.UIString("Hide transparency grid"), "Images/NavigationItemCheckers.svg", 13, 13);
            this._showGridButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
            this._showGridButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._showGridButtonClicked, this);
            this._showGridButtonNavigationItem.activated = !!WI.settings.showImageGrid.value;

            if (this.representedObject.isCanvas2D && WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.FileVariants))
                this._saveMode = WI.FileUtilities.SaveMode.FileVariants;
            else if (WI.FileUtilities.canSave(WI.FileUtilities.SaveMode.SingleFile))
                this._saveMode = WI.FileUtilities.SaveMode.SingleFile;
            else
                this._saveMode = null;

            this._exportButtonNavigationItem = new WI.ButtonNavigationItem("export", WI.UIString("Export"), "Images/Export.svg", 15, 15);
            this._exportButtonNavigationItem.tooltip = WI.UIString("Export (%s)").format(WI.saveKeyboardShortcut.displayName);
            this._exportButtonNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;
            this._exportButtonNavigationItem.enabled = this._saveMode;
            this._exportButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleExportNavigationItemClicked, this);
            this._updateExportButton();
        }
    }

    // Public

    get navigationItems()
    {
        if (!this.representedObject.isCanvas)
            return [];

        let navigationItems = [this._exportButtonNavigationItem, new WI.DividerNavigationItem];
        if (this.representedObject.isCanvas2D)
            navigationItems.push(this._showPathButtonNavigationItem);

        navigationItems.push(this._showGridButtonNavigationItem);
        return navigationItems;
    }

    get supplementalRepresentedObjects()
    {
        return this._action ? [this._action] : [];
    }

    updateActionIndex(index)
    {
        if (!this.representedObject)
            return;

        if (this._index === index)
            return;

        console.assert(index >= 0 && index < this.representedObject.actions.length);
        if (index < 0 || index >= this.representedObject.actions.length)
            return;

        this._index = index;

        this._updateSliderValue();

        if (this.didInitialLayout)
            this._generateContentThrottler.fire();

        this._action = this.representedObject.actions[this._index];

        this.dispatchEventToListeners(WI.ContentView.Event.SupplementalRepresentedObjectsDidChange);
    }

    attached()
    {
        super.attached();

        if (this.representedObject.isCanvas) {
            if (this.representedObject.isCanvas2D)
                this._updateCanvasPath();
            this._updateImageGrid();
        }
    }

    detached()
    {
        this._generateContentThrottler.cancel();

        super.detached();
    }

    // Protected

    get supportsSave()
    {
        return !!this._saveMode;
    }

    get saveMode()
    {
        return this._saveMode;
    }

    get saveData()
    {
        return {customSaveHandler: () => { this._export(); }};
    }

    initialLayout()
    {
        let previewHeader = this.element.appendChild(document.createElement("header"));

        let sliderContainer = previewHeader.appendChild(document.createElement("div"));
        sliderContainer.className = "slider-container";

        this._previewContainer = this.element.appendChild(document.createElement("div"));
        this._previewContainer.className = "preview-container";

        this._sliderValueElement = sliderContainer.appendChild(document.createElement("div"));
        this._sliderValueElement.className = "slider-value";

        this._sliderElement = sliderContainer.appendChild(document.createElement("input"));
        this._sliderElement.addEventListener("input", this._sliderChanged.bind(this));
        this._sliderElement.type = "range";
        this._sliderElement.min = 0;
        this._sliderElement.max = 0;

        if (!this.representedObject.ready) {
            this.representedObject.addEventListener(WI.Recording.Event.ProcessedAction, this._handleRecordingProcessedAction, this);

            if (!this.representedObject.processing)
                this.representedObject.startProcessing();
        }

        this._updateSliderValue();

        if (!isNaN(this._index))
            this._generateContentThrottler.fire();
    }

    // Private

    _export()
    {
        if (this._saveMode === WI.FileUtilities.SaveMode.SingleFile) {
            this._exportRecording();
            return;
        }

        let filename = this.representedObject.displayName;

        let data = [];
        data.push({
            displayType: WI.UIString("Recording"),
            content: JSON.stringify(this.representedObject.toJSON()),
            suggestedName: filename + ".recording",
        });
        if (this.representedObject.isCanvas2D && this.representedObject.ready) {
            data.push({
                displayType: WI.UIString("Reduction"),
                content: this.representedObject.toHTML(),
                suggestedName: filename + ".html",
            });
        }

        const forceSaveAs = true;
        WI.FileUtilities.save(WI.FileUtilities.SaveMode.FileVariants, data, forceSaveAs);
    }

    _exportRecording()
    {
        let filename = this.representedObject.displayName;

        const forceSaveAs = true;
        WI.FileUtilities.save(WI.FileUtilities.SaveMode.SingleFile, {
            content: JSON.stringify(this.representedObject.toJSON()),
            suggestedName: filename + ".recording",
        }, forceSaveAs);
    }

    _exportReduction()
    {
        console.assert(this.representedObject.ready);

        let filename = this.representedObject.displayName;

        const forceSaveAs = true;
        WI.FileUtilities.save(WI.FileUtilities.SaveMode.SingleFile, {
            content: this.representedObject.toHTML(),
            suggestedName: filename + ".html",
        }, forceSaveAs);
    }

    _generateContentCanvas2D(index)
    {
        let imageLoad = (event) => {
            // Loading took too long and the current action index has already changed.
            if (index !== this._index)
                return;

            this._generateContentCanvas2D(index);
        };

        let initialState = this.representedObject.initialState;
        if (initialState.content && !this._initialContent) {
            this._initialContent = new Image;
            this._initialContent.src = initialState.content;
            this._initialContent.addEventListener("load", imageLoad);
            return;
        }

        let snapshotIndex = Math.floor(index / WI.RecordingContentView.SnapshotInterval);
        let snapshot = this._snapshots[snapshotIndex];

        let indexOfLastBeginPathAction = Infinity;

        let actions = this.representedObject.actions;

        let applyActions = (from, to, callback) => {
            let saveCount = 0;
            snapshot.context.save();

            for (let attribute in snapshot.attributes)
                snapshot.element[attribute] = snapshot.attributes[attribute];

            if (snapshot.content) {
                snapshot.context.clearRect(0, 0, snapshot.element.width, snapshot.element.height);
                snapshot.context.drawImage(snapshot.content, 0, 0);
            }

            for (let state of snapshot.states) {
                state.apply(this.representedObject.type, snapshot.context);

                ++saveCount;
                snapshot.context.save();
            }

            let lastPathPoint = {};
            let subPathStartPoint = {};

            for (let i = from; i <= to; ++i) {
                if (actions[i].name === "save")
                    ++saveCount;
                else if (actions[i].name === "restore") {
                    if (!saveCount) // Only attempt to restore if save has been called.
                        continue;
                }

                actions[i].apply(snapshot.context);
            }

            if (WI.settings.showCanvasPath.value && indexOfLastBeginPathAction <= to) {
                if (!this._pathContext) {
                    let pathCanvas = document.createElement("canvas");
                    pathCanvas.classList.add("path");
                    this._pathContext = pathCanvas.getContext("2d");
                }

                this._pathContext.canvas.width = snapshot.element.width;
                this._pathContext.canvas.height = snapshot.element.height;
                this._pathContext.clearRect(0, 0, snapshot.element.width, snapshot.element.height);

                this._pathContext.save();

                this._pathContext.fillStyle = "hsla(0, 0%, 100%, 0.75)";
                this._pathContext.fillRect(0, 0, snapshot.element.width, snapshot.element.height);

                function actionModifiesPath(action) {
                    switch (action.name) {
                    case "arc":
                    case "arcTo":
                    case "beginPath":
                    case "bezierCurveTo":
                    case "closePath":
                    case "ellipse":
                    case "lineTo":
                    case "moveTo":
                    case "quadraticCurveTo":
                    case "rect":
                        return true;
                    }

                    return false;
                }

                for (let i = indexOfLastBeginPathAction; i <= to; ++i) {
                    if (!actionModifiesPath(actions[i]))
                        continue;

                    lastPathPoint = {x: this._pathContext.currentX, y: this._pathContext.currentY};

                    if (i === indexOfLastBeginPathAction)
                        this._pathContext.setTransform(snapshot.context.getTransform());

                    let isMoveTo = actions[i].name === "moveTo";
                    this._pathContext.lineWidth = isMoveTo ? 0.5 : 1;
                    this._pathContext.setLineDash(isMoveTo ? [5, 5] : []);
                    this._pathContext.strokeStyle = i === to ? "red" : "black";

                    this._pathContext.beginPath();
                    if (!isEmptyObject(lastPathPoint))
                        this._pathContext.moveTo(lastPathPoint.x, lastPathPoint.y);

                    if (actions[i].name === "closePath" && !isEmptyObject(subPathStartPoint)) {
                        this._pathContext.lineTo(subPathStartPoint.x, subPathStartPoint.y);
                        subPathStartPoint = {};
                    } else {
                        actions[i].apply(this._pathContext, {nameOverride: isMoveTo ? "lineTo" : null});
                        if (isMoveTo)
                            subPathStartPoint = {x: this._pathContext.currentX, y: this._pathContext.currentY};
                    }

                    this._pathContext.stroke();
                }

                this._pathContext.restore();
                this._previewContainer.appendChild(this._pathContext.canvas);
            } else if (this._pathContext)
                this._pathContext.canvas.remove();

            snapshot.context.restore();
            while (saveCount-- > 0)
                snapshot.context.restore();
        };

        if (!snapshot) {
            snapshot = this._snapshots[snapshotIndex] = {};
            snapshot.index = snapshotIndex * WI.RecordingContentView.SnapshotInterval;
            while (snapshot.index && actions[snapshot.index].name !== "beginPath")
                --snapshot.index;

            snapshot.context = this.representedObject.createContext();
            snapshot.element = snapshot.context.canvas;

            let lastSnapshotIndex = snapshotIndex;
            while (--lastSnapshotIndex >= 0) {
                if (this._snapshots[lastSnapshotIndex])
                    break;
            }

            let startIndex = 0;
            if (lastSnapshotIndex < 0) {
                snapshot.content = this._initialContent;
                snapshot.states = actions[0].states;
                snapshot.attributes = Object.shallowCopy(initialState.attributes);
            } else {
                let lastSnapshot = this._snapshots[lastSnapshotIndex];
                snapshot.content = lastSnapshot.content;
                snapshot.states = lastSnapshot.states;
                snapshot.attributes = {};
                for (let attribute in initialState.attributes)
                    snapshot.attributes[attribute] = lastSnapshot.element[attribute];

                startIndex = lastSnapshot.index;
            }

            applyActions(startIndex, snapshot.index - 1);
            if (snapshot.index > 0)
                snapshot.states = actions[snapshot.index - 1].states;

            snapshot.content = new Image;
            snapshot.content.src = snapshot.element.toDataURL();
            snapshot.content.addEventListener("load", imageLoad);
            return;
        }

        this._previewContainer.removeChildren();

        if (WI.settings.showCanvasPath.value) {
            indexOfLastBeginPathAction = this._index;
            while (indexOfLastBeginPathAction > snapshot.index && actions[indexOfLastBeginPathAction].name !== "beginPath")
                --indexOfLastBeginPathAction;
        }

        applyActions(snapshot.index, this._index);

        this._previewContainer.insertAdjacentElement("afterbegin", snapshot.element);
        this._updateImageGrid();
    }

    _generateContentFromSnapshot(index)
    {
        let imageLoad = (event) => {
            // Loading took too long and the current action index has already changed.
            if (index !== this._index)
                return;

            this._generateContentFromSnapshot(index);
        };

        let initialState = this.representedObject.initialState;
        if (initialState.content && !this._initialContent) {
            this._initialContent = new Image;
            this._initialContent.src = initialState.content;
            this._initialContent.addEventListener("load", imageLoad);
            return;
        }

        let actions = this.representedObject.actions;

        let visualIndex = index;
        while (!actions[visualIndex].isVisual && !(actions[visualIndex] instanceof WI.RecordingInitialStateAction))
            visualIndex--;

        let snapshot = this._snapshots[visualIndex];
        if (!snapshot) {
            if (actions[visualIndex].snapshot) {
                snapshot = this._snapshots[visualIndex] = {element: new Image};
                snapshot.element.src = actions[visualIndex].snapshot;
                snapshot.element.addEventListener("load", imageLoad);
                return;
            }

            if (actions[visualIndex] instanceof WI.RecordingInitialStateAction)
                snapshot = this._snapshots[visualIndex] = {element: this._initialContent};
        }

        if (snapshot) {
            this._previewContainer.removeChildren();
            this._previewContainer.appendChild(snapshot.element);

            this._updateImageGrid();
        }
    }

    _updateExportButton()
    {
        if (this._saveMode !== WI.FileUtilities.SaveMode.SingleFile)
            return;

        if (this.representedObject.isCanvas2D && this.representedObject.ready)
            this._exportButtonNavigationItem.tooltip = WI.UIString("Export recording (%s)\nShift-click to export a HTML reduction").format(WI.saveKeyboardShortcut.displayName);
        else
            this._exportButtonNavigationItem.tooltip = WI.UIString("Export recording (%s)").format(WI.saveKeyboardShortcut.displayName);
    }

    _updateCanvasPath()
    {
        let activated = WI.settings.showCanvasPath.value;

        if (this._showPathButtonNavigationItem.activated !== activated)
            this._generateContentCanvas2D(this._index);

        this._showPathButtonNavigationItem.activated = activated;
    }

    _updateImageGrid()
    {
        let activated = WI.settings.showImageGrid.value;
        this._showGridButtonNavigationItem.activated = activated;

        if (this.didInitialLayout && !isNaN(this._index))
            this._previewContainer.firstElementChild.classList.toggle("show-grid", activated);
    }

    _updateSliderValue()
    {
        if (!this._sliderElement)
            return;

        let visualActionIndexes = this.representedObject.visualActionIndexes;
        let visualActionIndex = 0;
        if (this._index > 0) {
            while (visualActionIndex < visualActionIndexes.length && visualActionIndexes[visualActionIndex] <= this._index)
                visualActionIndex++;
        }

        this._sliderElement.value = visualActionIndex;
        this._sliderElement.max = visualActionIndexes.length;
        this._sliderValueElement.textContent = WI.UIString("%d of %d").format(visualActionIndex, visualActionIndexes.length);
    }

    _showPathButtonClicked(event)
    {
        WI.settings.showCanvasPath.value = !this._showPathButtonNavigationItem.activated;

        this._updateCanvasPath();
    }

    _showGridButtonClicked(event)
    {
        WI.settings.showImageGrid.value = !this._showGridButtonNavigationItem.activated;

        this._updateImageGrid();
    }

    _handleExportNavigationItemClicked(event)
    {
        if (this._saveMode === WI.FileUtilities.SaveMode.SingleFile && this.representedObject.isCanvas2D && this.representedObject.ready && event.data.nativeEvent.shiftKey) {
            this._exportReduction();
            return;
        }

        this._export();
    }

    _sliderChanged()
    {
        let index = 0;

        let visualActionIndex = parseInt(this._sliderElement.value) - 1;
        if (visualActionIndex !== -1)
            index = this.representedObject.visualActionIndexes[visualActionIndex];

        this.updateActionIndex(index);
    }

    _handleRecordingProcessedAction(event)
    {
        this._updateExportButton();

        this._updateSliderValue();

        if (this.representedObject.ready)
            this.representedObject.removeEventListener(WI.Recording.Event.ProcessedAction, this._handleRecordingProcessedAction, this);
    }
};

WI.RecordingContentView.SnapshotInterval = 5000;
