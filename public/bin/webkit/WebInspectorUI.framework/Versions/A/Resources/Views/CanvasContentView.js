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

WI.CanvasContentView = class CanvasContentView extends WI.ContentView
{
    constructor(representedObject)
    {
        console.assert(representedObject instanceof WI.Canvas);

        super(representedObject);

        this.element.classList.add("canvas");

        this._progressView = null;
        this._previewContainerElement = null;
        this._previewImageElement = null;
        this._errorElement = null;
        this._memoryCostElement = null;
        this._pendingContent = null;
        this._pixelSizeElement = null;
        this._canvasNode = null;

        this._refreshButtonNavigationItem = new WI.ButtonNavigationItem("refresh", WI.UIString("Refresh"), "Images/ReloadFull.svg", 13, 13);
        this._refreshButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._refreshButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this.handleRefreshButtonClicked, this);

        this._showGridButtonNavigationItem = new WI.ActivateButtonNavigationItem("show-grid", WI.repeatedUIString.showTransparencyGridTooltip(), WI.UIString("Hide transparency grid"), "Images/NavigationItemCheckers.svg", 13, 13);
        this._showGridButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._showGridButtonClicked, this);
        this._showGridButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        this._showGridButtonNavigationItem.activated = !!WI.settings.showImageGrid.value;
    }

    // Public

    get navigationItems()
    {
        // The toggle recording NavigationItem isn't added to the ContentBrowser's NavigationBar.
        // It's added to the "quick access" NavigationBar shown when hovering the canvas in the overview.
        return [this._refreshButtonNavigationItem, this._showGridButtonNavigationItem];
    }

    refreshPreview()
    {
        this._pendingContent = null;

        this.representedObject.requestContent().then((content) => {
            this._pendingContent = content;
            if (!this._pendingContent) {
                this._showError();
                return;
            }

            this.needsLayout();
        });
    }

    handleRefreshButtonClicked()
    {
        this.refreshPreview();
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        let isCard = !this._refreshButtonNavigationItem.parentNavigationBar;

        if (isCard) {
            let header = this.element.appendChild(document.createElement("header"));
            header.addEventListener("click", (event) => { event.stopPropagation(); });

            let titles = header.appendChild(document.createElement("div"));
            titles.className = "titles";

            let title = titles.appendChild(document.createElement("span"));
            title.className = "title";
            title.textContent = this.representedObject.displayName;

            let subtitle = titles.appendChild(document.createElement("span"));
            subtitle.className = "subtitle";
            subtitle.textContent = WI.Canvas.displayNameForContextType(this.representedObject.contextType);

            if (this.representedObject.contextAttributes.colorSpace) {
                let subtitle = titles.appendChild(document.createElement("span"));
                subtitle.className = "color-space";
                subtitle.textContent = "(" + WI.Canvas.displayNameForColorSpace(this.representedObject.contextAttributes.colorSpace) + ")";
            }

            let navigationBar = new WI.NavigationBar;

            if (this.representedObject.supportsRecording) {
                const toolTip = WI.UIString("Start recording canvas actions.\nShift-click to record a single frame.");
                const altToolTip = WI.UIString("Stop recording canvas actions");
                this._recordButtonNavigationItem = new WI.ToggleButtonNavigationItem("record-start-stop", toolTip, altToolTip, "Images/Record.svg", "Images/Stop.svg", 13, 13);
                this._recordButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.High;
                this._recordButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._toggleRecording, this);
                navigationBar.addNavigationItem(this._recordButtonNavigationItem);
            }

            let canvasElementButtonNavigationItem = new WI.ButtonNavigationItem("canvas-element", WI.UIString("Canvas Element"), "Images/Markup.svg", 16, 16);
            canvasElementButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
            WI.addMouseDownContextMenuHandlers(canvasElementButtonNavigationItem.element, this._populateCanvasElementButtonContextMenu.bind(this));
            navigationBar.addNavigationItem(canvasElementButtonNavigationItem);

            navigationBar.addNavigationItem(this._refreshButtonNavigationItem);

            header.append(navigationBar.element);
        }

        this._previewContainerElement = this.element.appendChild(document.createElement("div"));
        this._previewContainerElement.className = "preview";

        if (isCard) {
            let footer = this.element.appendChild(document.createElement("footer"));
            footer.addEventListener("click", (event) => { event.stopPropagation(); });

            this._viewRelatedItemsContainer = footer.appendChild(document.createElement("div"));
            this._viewRelatedItemsContainer.classList.add("view-related-items");

            this._viewShaderButton = document.createElement("img");
            this._viewShaderButton.classList.add("view-shader");
            this._viewShaderButton.title = WI.UIString("View Shader");
            WI.addMouseDownContextMenuHandlers(this._viewShaderButton, this._populateViewShaderButtonContextMenu.bind(this));

            this._viewRecordingButton = document.createElement("img");
            this._viewRecordingButton.classList.add("view-recording");
            this._viewRecordingButton.title = WI.UIString("View Recording");
            WI.addMouseDownContextMenuHandlers(this._viewRecordingButton, this._populateViewRecordingButtonContextMenu.bind(this));

            this._updateViewRelatedItems();

            let flexibleSpaceElement = footer.appendChild(document.createElement("div"));
            flexibleSpaceElement.className = "flexible-space";

            let metrics = footer.appendChild(document.createElement("div"));

            this._pixelSizeElement = metrics.appendChild(document.createElement("span"));
            this._pixelSizeElement.className = "pixel-size";

            this._memoryCostElement = metrics.appendChild(document.createElement("span"));
            this._memoryCostElement.className = "memory-cost";
        }

        if (this._errorElement)
            this._showError();

        if (isCard)
            this._updateSize();
    }

    layout()
    {
        super.layout();

        if (this._pendingContent) {
            if (this._errorElement) {
                this._errorElement.remove();
                this._errorElement = null;
            }

            if (!this._previewImageElement) {
                this._previewImageElement = document.createElement("img");
                this._previewImageElement.addEventListener("error", this._showError.bind(this));
            }

            this._previewImageElement.src = this._pendingContent;
            this._pendingContent = null;

            if (!this._previewImageElement.parentNode)
                this._previewContainerElement.appendChild(this._previewImageElement);
        }

        this._updateRecordNavigationItem();
        this._updateProgressView();
        this._updateViewRelatedItems();
        this._updateMemoryCost();
        this._updateImageGrid();
    }

    attached()
    {
        super.attached();

        this.representedObject.addEventListener(WI.Canvas.Event.SizeChanged, this._updateSize, this);
        this.representedObject.addEventListener(WI.Canvas.Event.MemoryChanged, this._updateMemoryCost, this);
        this.representedObject.addEventListener(WI.Canvas.Event.RecordingStarted, this.needsLayout, this);
        this.representedObject.addEventListener(WI.Canvas.Event.RecordingProgress, this.needsLayout, this);
        this.representedObject.addEventListener(WI.Canvas.Event.RecordingStopped, this.needsLayout, this);
        this.representedObject.shaderProgramCollection.addEventListener(WI.Collection.Event.ItemAdded, this.needsLayout, this);
        this.representedObject.shaderProgramCollection.addEventListener(WI.Collection.Event.ItemRemoved, this.needsLayout, this);

        this.representedObject.requestNode().then((node) => {
            if (!node)
                return;

            console.assert(!this._canvasNode || this._canvasNode === node);
            if (this._canvasNode === node)
                return;

            this._canvasNode = node;
        });

        WI.settings.showImageGrid.addEventListener(WI.Setting.Event.Changed, this._updateImageGrid, this);

        this.refreshPreview();
    }

    detached()
    {
        this.representedObject.removeEventListener(WI.Canvas.Event.SizeChanged, this._updateSize, this);
        this.representedObject.removeEventListener(WI.Canvas.Event.MemoryChanged, this._updateMemoryCost, this);
        this.representedObject.removeEventListener(WI.Canvas.Event.RecordingStarted, this.needsLayout, this);
        this.representedObject.removeEventListener(WI.Canvas.Event.RecordingProgress, this.needsLayout, this);
        this.representedObject.removeEventListener(WI.Canvas.Event.RecordingStopped, this.needsLayout, this);
        this.representedObject.shaderProgramCollection.removeEventListener(WI.Collection.Event.ItemAdded, this.needsLayout, this);
        this.representedObject.shaderProgramCollection.removeEventListener(WI.Collection.Event.ItemRemoved, this.needsLayout, this);

        this._canvasNode = null;

        WI.settings.showImageGrid.removeEventListener(WI.Setting.Event.Changed, this._updateImageGrid, this);

        super.detached();
    }

    // Private

    _showError()
    {
        if (this._previewImageElement)
            this._previewImageElement.remove();

        if (!this._errorElement) {
            let isError = WI.Canvas.supportsRequestContentForContextType(this.representedObject.contextType);
            this._errorElement = WI.createMessageTextView(WI.UIString("No Preview Available"), isError);
        }

        if (this._previewContainerElement)
            this._previewContainerElement.appendChild(this._errorElement);
    }

    _toggleRecording(event)
    {
        if (this.representedObject.recordingActive)
            this.representedObject.stopRecording();
        else {
            let singleFrame = event.data.nativeEvent.shiftKey;
            this.representedObject.startRecording(singleFrame);
        }
    }

    _populateCanvasElementButtonContextMenu(contextMenu)
    {
        contextMenu.appendItem(WI.UIString("Log Canvas Context"), () => {
            WI.RemoteObject.resolveCanvasContext(this.representedObject, WI.RuntimeManager.ConsoleObjectGroup).then((remoteObject) => {
                if (!remoteObject)
                    return;

                const text = WI.UIString("Selected Canvas Context");
                WI.consoleLogViewController.appendImmediateExecutionWithResult(text, remoteObject, {addSpecialUserLogClass: true, shouldRevealConsole: true});
            });
        });

        contextMenu.appendSeparator();

        if (this._canvasNode)
            WI.appendContextMenuItemsForDOMNode(contextMenu, this._canvasNode);
    }

    _showGridButtonClicked()
    {
        WI.settings.showImageGrid.value = !this._showGridButtonNavigationItem.activated;
    }

    _updateImageGrid()
    {
        let activated = WI.settings.showImageGrid.value;
        this._showGridButtonNavigationItem.activated = activated;

        if (this._previewImageElement)
            this._previewImageElement.classList.toggle("show-grid", activated);
    }

    _updateSize()
    {
        if (this._pixelSizeElement) {
            let size = this.representedObject.size;
            if (size)
                this._pixelSizeElement.textContent = `${size.width} ${multiplicationSign} ${size.height}`;
            else
                this._pixelSizeElement.textContent = emDash;
        }

        this.refreshPreview();
    }

    _updateMemoryCost()
    {
        if (!this._memoryCostElement)
            return;

        let memoryCost = this.representedObject.memoryCost;
        if (isNaN(memoryCost))
            this._memoryCostElement.textContent = emDash;
        else {
            const higherResolution = false;
            let bytesString = Number.bytesToString(memoryCost, higherResolution);
            this._memoryCostElement.textContent = `(${bytesString})`;
        }
    }

    _updateRecordNavigationItem()
    {
        if (!this._recordButtonNavigationItem)
            return;

        let recordingActive = this.representedObject.recordingActive;
        this._recordButtonNavigationItem.toggled = recordingActive;
        this._refreshButtonNavigationItem.enabled = !recordingActive;
        this.element.classList.toggle("recording-active", recordingActive);
    }

    _updateProgressView()
    {
        if (!this._previewContainerElement)
            return;

        if (!this.representedObject.recordingActive) {
            if (this._progressView && this._progressView.parentView) {
                this.removeSubview(this._progressView);
                this._progressView = null;
            }
            return;
        }

        if (!this._progressView) {
            this._progressView = new WI.ProgressView;
            this.element.insertBefore(this._progressView.element, this._previewContainerElement);
            this.addSubview(this._progressView);
        }

        let title = null;
        if (this.representedObject.recordingFrameCount) {
            let formatString = this.representedObject.recordingFrameCount === 1 ? WI.UIString("%d Frame") : WI.UIString("%d Frames");
            title = formatString.format(this.representedObject.recordingFrameCount);
        } else
            title = WI.UIString("Waiting for frames\u2026");

        this._progressView.title = title;
        this._progressView.subtitle = this.representedObject.recordingBufferUsed ? Number.bytesToString(this.representedObject.recordingBufferUsed) : "";
    }

    _updateViewRelatedItems()
    {
        if (!this._viewRelatedItemsContainer)
            return;

        this._viewRelatedItemsContainer.removeChildren();

        if (this.representedObject.shaderProgramCollection.size)
            this._viewRelatedItemsContainer.appendChild(this._viewShaderButton);

        if (this.representedObject.recordingCollection.size)
            this._viewRelatedItemsContainer.appendChild(this._viewRecordingButton);
    }

    _populateViewShaderButtonContextMenu(contextMenu, event)
    {
        let shaderPrograms = this.representedObject.shaderProgramCollection;
        console.assert(shaderPrograms.size);
        if (!shaderPrograms.size)
            return;

        if (event.button === 0 && shaderPrograms.size === 1) {
            WI.showRepresentedObject(Array.from(shaderPrograms)[0]);
            return;
        }

        for (let shaderProgram of shaderPrograms) {
            contextMenu.appendItem(shaderProgram.displayName, () => {
                WI.showRepresentedObject(shaderProgram);
            });
        }
    }

    _populateViewRecordingButtonContextMenu(contextMenu, event)
    {
        let recordings = this.representedObject.recordingCollection;
        console.assert(recordings.size);
        if (!recordings.size)
            return;

        if (event.button === 0 && recordings.size === 1) {
            WI.showRepresentedObject(Array.from(recordings)[0]);
            return;
        }

        for (let recording of recordings) {
            contextMenu.appendItem(recording.displayName, () => {
                WI.showRepresentedObject(recording);
            });
        }
    }
};
