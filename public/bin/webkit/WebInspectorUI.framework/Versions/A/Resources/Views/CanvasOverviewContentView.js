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

WI.CanvasOverviewContentView = class CanvasOverviewContentView extends WI.CollectionContentView
{
    constructor(representedObject)
    {
        console.assert(representedObject instanceof WI.CanvasCollection);

        let contentPlaceholder = WI.animationManager.supported ? document.createElement("div") : WI.createMessageTextView(WI.UIString("No Canvas Contexts"));

        let descriptionElement = contentPlaceholder.appendChild(document.createElement("div"));
        descriptionElement.className = "description";
        descriptionElement.textContent = WI.UIString("Waiting for canvas contexts created by script or CSS.");

        let importNavigationItem = new WI.ButtonNavigationItem("import-recording", WI.UIString("Import"), "Images/Import.svg", 15, 15);
        importNavigationItem.buttonStyle = WI.ButtonNavigationItem.Style.ImageAndText;

        let importHelpElement = WI.createNavigationItemHelp(WI.UIString("Press %s to load a recording from file."), importNavigationItem);
        contentPlaceholder.appendChild(importHelpElement);

        super(representedObject, WI.CanvasContentView, contentPlaceholder);

        this.element.classList.add("canvas-overview");

        if (WI.CanvasManager.supportsRecordingAutoCapture()) {
            this._recordingAutoCaptureFrameCountInputElement = document.createElement("input");
            this._recordingAutoCaptureFrameCountInputElement.type = "number";
            this._recordingAutoCaptureFrameCountInputElement.min = 0;
            this._recordingAutoCaptureFrameCountInputElement.addEventListener("input", this._handleRecordingAutoCaptureInput.bind(this));
            this._recordingAutoCaptureFrameCountInputElementValue = WI.settings.canvasRecordingAutoCaptureFrameCount.value;

            const label = null;
            this._recordingAutoCaptureNavigationItem = new WI.CheckboxNavigationItem("canvas-recording-auto-capture", label, !!WI.settings.canvasRecordingAutoCaptureEnabled.value);
            this._recordingAutoCaptureNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
            this._recordingAutoCaptureNavigationItem.addEventListener(WI.CheckboxNavigationItem.Event.CheckedDidChange, this._handleRecordingAutoCaptureCheckedDidChange, this);

            let frameCount = this._updateRecordingAutoCaptureInputElementSize();
            this._setRecordingAutoCaptureFrameCount(frameCount);
            this._updateRecordingAutoCaptureCheckboxLabel(frameCount);
        }

        importNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleImportButtonNavigationItemClicked, this);

        this._savedRecordingsContentView = null;
        this._savedRecordingsTreeOutline = null;
    }

    // Public

    get navigationItems()
    {
        let navigationItems = [];
        if (this._recordingAutoCaptureNavigationItem)
            navigationItems.push(this._recordingAutoCaptureNavigationItem);
        return navigationItems;
    }

    handleRefreshButtonClicked()
    {
        for (let subview of this.subviews) {
            if (subview instanceof WI.CanvasContentView)
                subview.handleRefreshButtonClicked();
        }
    }

    // Protected

    contentViewAdded(contentView)
    {
        contentView.element.addEventListener("mouseenter", this._contentViewMouseEnter);
        contentView.element.addEventListener("mouseleave", this._contentViewMouseLeave);

        if (this._savedRecordingsContentView) {
            // Ensure that the imported recordings are always last.
            this.removeSubview(this._savedRecordingsContentView);
            this.addSubview(this._savedRecordingsContentView);
        }
    }

    contentViewRemoved(contentView)
    {
        contentView.element.removeEventListener("mouseenter", this._contentViewMouseEnter);
        contentView.element.removeEventListener("mouseleave", this._contentViewMouseLeave);
    }

    attached()
    {
        super.attached();

        WI.settings.canvasRecordingAutoCaptureEnabled.addEventListener(WI.Setting.Event.Changed, this._handleCanvasRecordingAutoCaptureEnabledChanged, this);
        WI.settings.canvasRecordingAutoCaptureFrameCount.addEventListener(WI.Setting.Event.Changed, this._handleCanvasRecordingAutoCaptureFrameCountChanged, this);

        WI.canvasManager.addEventListener(WI.CanvasManager.Event.RecordingSaved, this._handleRecordingSaved, this);

        if (this._savedRecordingsTreeOutline)
            this._savedRecordingsTreeOutline.removeChildren();
        for (let recording of WI.canvasManager.savedRecordings)
            this._addSavedRecording(recording);

        for (let subview of this.subviews) {
            if (subview instanceof WI.CanvasContentView)
                subview.refreshPreview();
        }
    }

    detached()
    {
        WI.domManager.hideDOMNodeHighlight();

        WI.canvasManager.removeEventListener(WI.CanvasManager.Event.RecordingSaved, this._handleRecordingSaved, this);

        WI.settings.canvasRecordingAutoCaptureFrameCount.removeEventListener(WI.Setting.Event.Changed, this._handleCanvasRecordingAutoCaptureFrameCountChanged, this);
        WI.settings.canvasRecordingAutoCaptureEnabled.removeEventListener(WI.Setting.Event.Changed, this._handleCanvasRecordingAutoCaptureEnabledChanged, this);

        super.detached();
    }

    // Private

    _contentViewMouseEnter(event)
    {
        let contentView = WI.View.fromElement(event.target);
        if (!(contentView instanceof WI.CanvasContentView))
            return;

        let canvas = contentView.representedObject;
        if (canvas.cssCanvasName || canvas.contextType === WI.Canvas.ContextType.WebGPU) {
            canvas.requestClientNodes((clientNodes) => {
                WI.domManager.highlightDOMNodeList(clientNodes);
            });
            return;
        }

        canvas.requestNode().then((node) => {
            if (!node || !node.ownerDocument)
                return;
            node.highlight();
        });
    }

    _contentViewMouseLeave(event)
    {
        WI.domManager.hideDOMNodeHighlight();
    }

    _setRecordingAutoCaptureFrameCount(frameCount)
    {
        console.assert(!isNaN(frameCount) && frameCount >= 0);

        if (this._recordingAutoCaptureNavigationItem.checked)
            frameCount = Math.max(1, frameCount);

        let enabled = frameCount > 0 && !!this._recordingAutoCaptureNavigationItem.checked;

        WI.canvasManager.setRecordingAutoCaptureFrameCount(enabled, frameCount);
    }

    _updateRecordingAutoCaptureCheckboxLabel(frameCount)
    {
        let active = document.activeElement === this._recordingAutoCaptureFrameCountInputElement;
        let selectionStart = this._recordingAutoCaptureFrameCountInputElement.selectionStart;
        let selectionEnd = this._recordingAutoCaptureFrameCountInputElement.selectionEnd;
        let direction = this._recordingAutoCaptureFrameCountInputElement.direction;

        let label = frameCount === 1 ? WI.UIString("Record first %s frame") : WI.UIString("Record first %s frames");
        let fragment = document.createDocumentFragment();
        String.format(label, [this._recordingAutoCaptureFrameCountInputElement], String.standardFormatters, fragment, (a, b) => {
            a.append(b);
            return a;
        });
        this._recordingAutoCaptureNavigationItem.label = fragment;

        if (active) {
            this._recordingAutoCaptureFrameCountInputElement.selectionStart = selectionStart;
            this._recordingAutoCaptureFrameCountInputElement.selectionEnd = selectionEnd;
            this._recordingAutoCaptureFrameCountInputElement.direction = direction;
        }
    }

    get _recordingAutoCaptureFrameCountInputElementValue()
    {
        return parseInt(this._recordingAutoCaptureFrameCountInputElement.value);
    }

    set _recordingAutoCaptureFrameCountInputElementValue(frameCount)
    {
        if (this._recordingAutoCaptureFrameCountInputElement.value || frameCount)
            this._recordingAutoCaptureFrameCountInputElement.value = frameCount;

        this._recordingAutoCaptureFrameCountInputElement.placeholder = frameCount;
    }

    _updateRecordingAutoCaptureInputElementSize()
    {
        let frameCount = this._recordingAutoCaptureFrameCountInputElementValue;
        if (isNaN(frameCount) || frameCount < 0) {
            frameCount = 0;
            this._recordingAutoCaptureFrameCountInputElementValue = frameCount;
        }

        this._recordingAutoCaptureFrameCountInputElement.autosize();

        return frameCount;
    }

    _addSavedRecording(recording)
    {
        console.assert(!recording.source);

        if (!this._savedRecordingsContentView) {
            this._savedRecordingsContentView = new WI.ContentView;
            this._savedRecordingsContentView.element.classList.add("canvas", "saved-recordings");
            this.addSubview(this._savedRecordingsContentView);

            let header = this._savedRecordingsContentView.element.appendChild(document.createElement("header"));
            header.textContent = WI.UIString("Saved Recordings");

            this.hideContentPlaceholder();
        }

        if (!this._savedRecordingsTreeOutline) {
            const selectable = false;
            this._savedRecordingsTreeOutline = new WI.TreeOutline(selectable);
            this._savedRecordingsTreeOutline.addEventListener(WI.TreeOutline.Event.ElementClicked, this._handleSavedRecordingClicked, this);
            this._savedRecordingsContentView.element.appendChild(this._savedRecordingsTreeOutline.element);
        }

        let recordingTreeElement = new WI.GeneralTreeElement(["recording"], recording.displayName, WI.Recording.displayNameForRecordingType(recording.type), recording);
        recordingTreeElement.selectable = false;
        this._savedRecordingsTreeOutline.appendChild(recordingTreeElement);
    }

    _handleRecordingAutoCaptureInput(event)
    {
        let frameCount = this._updateRecordingAutoCaptureInputElementSize();
        this._recordingAutoCaptureNavigationItem.checked = !!frameCount;

        this._setRecordingAutoCaptureFrameCount(frameCount);
    }

    _handleRecordingAutoCaptureCheckedDidChange(event)
    {
        this._setRecordingAutoCaptureFrameCount(this._recordingAutoCaptureFrameCountInputElementValue || 0);
    }

    _handleCanvasRecordingAutoCaptureEnabledChanged(event)
    {
        this._recordingAutoCaptureNavigationItem.checked = WI.settings.canvasRecordingAutoCaptureEnabled.value;
    }

    _handleCanvasRecordingAutoCaptureFrameCountChanged(event)
    {
        // Only update the value if it is different to prevent mangling the selection.
        if (this._recordingAutoCaptureFrameCountInputElementValue !== WI.settings.canvasRecordingAutoCaptureFrameCount.value)
            this._recordingAutoCaptureFrameCountInputElementValue = WI.settings.canvasRecordingAutoCaptureFrameCount.value;

        this._updateRecordingAutoCaptureCheckboxLabel(WI.settings.canvasRecordingAutoCaptureFrameCount.value);
    }

    _handleImportButtonNavigationItemClicked(event)
    {
        WI.FileUtilities.importJSON((result) => WI.canvasManager.processJSON(result), {multiple: true});
    }

    _handleRecordingSaved(event)
    {
        this._addSavedRecording(event.data.recording);
    }

    _handleSavedRecordingClicked(event)
    {
        WI.showRepresentedObject(event.data.treeElement.representedObject);
    }
};
