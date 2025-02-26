/*
 * Copyright (C) 2013-2019 Apple Inc. All rights reserved.
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

WI.ImageResourceContentView = class ImageResourceContentView extends WI.ResourceContentView
{
    constructor(resource, {disableInteractions, disableDropZone} = {})
    {
        console.assert(resource instanceof WI.Resource);

        super(resource, "image");

        this._imageElement = null;
        this._draggingInternalImageElement = false;
        this._disableInteractions = disableInteractions || false;
        this._disableDropZone = disableDropZone || false;

        const toolTip = WI.repeatedUIString.showTransparencyGridTooltip();
        const activatedToolTip = WI.UIString("Hide transparency grid");
        this._showGridButtonNavigationItem = new WI.ActivateButtonNavigationItem("show-grid", toolTip, activatedToolTip, "Images/NavigationItemCheckers.svg", 13, 13);
        this._showGridButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._showGridButtonClicked, this);
        this._showGridButtonNavigationItem.activated = !!WI.settings.showImageGrid.value;

        if (!this._disableInteractions) {
            this._resetGestureButtonNavitationItem = new WI.ButtonNavigationItem("image-gesture-reset", "");
            this._resetGestureButtonNavitationItem.tooltip = WI.UIString("Click to reset", "Click to reset @ Image Resource Content View Gesture Controls", "Title of text button that resets the gesture controls in the image resource content view.");
            this._resetGestureButtonNavitationItem.hidden = true;
            this._resetGestureButtonNavitationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleResetGestureButtonNavitationItemClicked, this);

            this._zoomOutGestureButtonNavitationItem = new WI.ButtonNavigationItem("image-gesture-zoom-out", WI.UIString("Zoom Out", "Zoom Out @ Image Resource Content View Gesture Controls", "Title of image button that decreases the zoom of the image resource content view."), "Images/ZoomOut.svg", 16, 16);
            this._zoomOutGestureButtonNavitationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
            this._zoomOutGestureButtonNavitationItem.hidden = true;
            this._zoomOutGestureButtonNavitationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleZoomOutGestureButtonNavitationItemClicked, this);

            this._zoomInGestureButtonNavitationItem = new WI.ButtonNavigationItem("image-gesture-zoom-in", WI.UIString("Zoom In", "Zoom In @ Image Resource Content View Gesture Controls", "Title of image button that increases the zoom of the image resource content view."), "Images/ZoomIn.svg", 16, 16);
            this._zoomInGestureButtonNavitationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
            this._zoomInGestureButtonNavitationItem.hidden = true;
            this._zoomInGestureButtonNavitationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleZoomInGestureButtonNavitationItemClicked, this);

            this._gestureNavigationItemsDivider = new WI.DividerNavigationItem;
            this._gestureNavigationItemsDivider.hidden = true;

        }
    }

    // Public

    get navigationItems()
    {
        let items = [];
        if (!this._disableInteractions) {
            items.push(this._resetGestureButtonNavitationItem);
            items.push(this._zoomOutGestureButtonNavitationItem);
            items.push(this._zoomInGestureButtonNavitationItem);
            items.push(new WI.DividerNavigationItem);
        }
        items.pushAll(super.navigationItems);
        items.push(this._showGridButtonNavigationItem);
        return items;
    }

    contentAvailable(content, base64Encoded)
    {
        this.removeLoadingIndicator();

        if (!content) {
            this.showGenericNoContentMessage();
            return;
        }

        let objectURL = this.resource.createObjectURL();
        if (!objectURL) {
            this.showGenericErrorMessage();
            return;
        }

        this._imageContainer = this.element.appendChild(document.createElement("div"));
        this._imageContainer.className = "img-container";

        this._imageElement = this._imageContainer.appendChild(document.createElement("img"));
        this._imageElement.addEventListener("load", function() { URL.revokeObjectURL(objectURL); });
        this._imageElement.src = objectURL;
        this._imageElement.setAttribute("filename", this.resource.urlComponents.lastPathComponent || "");
        this._imageElement.draggable = true;
        this._updateImageGrid();

        // Drag-and-Drop should not be considered as the same "kind" of interaction as those below.
        this._imageElement.addEventListener("dragstart", (event) => {
            console.assert(!this._draggingInternalImageElement);
            this._draggingInternalImageElement = true;
        });
        this._imageElement.addEventListener("dragend", (event) => {
            console.assert(this._draggingInternalImageElement);
            this._draggingInternalImageElement = false;
        });

        if (!this._disableInteractions) {
            this._gestureController = new WI.GestureController(this._imageElement, this, {container: this._imageContainer, supportsScale: true, supportsTranslate: true});

            this._resetGestureButtonNavitationItem.hidden = false;
            this._zoomOutGestureButtonNavitationItem.hidden = false;
            this._zoomInGestureButtonNavitationItem.hidden = false;
            this._gestureNavigationItemsDivider.hidden = false;
            this._updateResetGestureButtonNavigationItemLabel();

            if (WI.NetworkManager.supportsOverridingResponses() && !this._disableDropZone) {
                let dropZoneView = new WI.DropZoneView(this);
                dropZoneView.targetElement = this._imageContainer;
                this.addSubview(dropZoneView);

                if (this.resource.localResourceOverride)
                    this.resource.addEventListener(WI.SourceCode.Event.ContentDidChange, this._handleLocalResourceContentDidChange, this);
            }
        }
    }

    // Protected

    attached()
    {
        super.attached();

        this._updateImageGrid();

        WI.settings.showImageGrid.addEventListener(WI.Setting.Event.Changed, this._updateImageGrid, this);
    }

    detached()
    {
        WI.settings.showImageGrid.removeEventListener(WI.Setting.Event.Changed, this._updateImageGrid, this);

        super.detached();
    }

    // GestureController delegate

    gestureControllerDidScale(gestureController)
    {
        this._imageElement.style.setProperty("scale", this._gestureController.scale);

        this._updateResetGestureButtonNavigationItemLabel();
    }

    gestureControllerDidTranslate(gestureController, x, y)
    {
        this._imageElement.style.setProperty("translate", `${this._gestureController.translate.x}px ${this._gestureController.translate.y}px`);
    }

    // DropZoneView delegate

    dropZoneShouldAppearForDragEvent(dropZone, event)
    {
        // Do not appear if the drag is the current image inside this view.
        if (this._draggingInternalImageElement)
            return false;

        let existingOverrides = WI.networkManager.localResourceOverridesForURL(this.resource.url);
        if (existingOverrides.length > 1)
            return false;

        let localResourceOverride = this.resource.localResourceOverride || existingOverrides[0];
        if (localResourceOverride && !localResourceOverride.canMapToFile)
            return false;

        // Appear if the drop contains a file.
        return event.dataTransfer.types.includes("Files");
    }

    dropZoneHandleDragEnter(dropZone, event)
    {
        if (this.resource.localResourceOverride)
            dropZone.text = WI.UIString("Update Image");
        else if (WI.networkManager.localResourceOverridesForURL(this.resource.url).length)
            dropZone.text = WI.UIString("Update Local Override");
        else
            dropZone.text = WI.UIString("Create Local Override");
    }

    dropZoneHandleDrop(dropZone, event)
    {
        let files = event.dataTransfer.files;
        if (files.length !== 1) {
            InspectorFrontendHost.beep();
            return;
        }

        WI.FileUtilities.readData(files, async ({dataURL, mimeType, base64Encoded, content}) => {
            let localResourceOverride = this.resource.localResourceOverride || WI.networkManager.localResourceOverridesForURL(this.resource.url)[0];
            if (!localResourceOverride) {
                localResourceOverride = await this.resource.createLocalResourceOverride(WI.LocalResourceOverride.InterceptType.Response);
                WI.networkManager.addLocalResourceOverride(localResourceOverride);
            }
            console.assert(localResourceOverride);

            let revision = localResourceOverride.localResource.editableRevision;
            revision.updateRevisionContent(content, {base64Encoded, mimeType});

            if (!this.resource.localResourceOverride)
                WI.showLocalResourceOverride(localResourceOverride, {overriddenResource: this.resource});
        });
    }

    // Private

    _updateImageGrid()
    {
        if (!this._imageElement)
            return;

        let activated = WI.settings.showImageGrid.value;
        this._showGridButtonNavigationItem.activated = activated;
        this._imageElement.classList.toggle("show-grid", activated);
    }

    _updateResetGestureButtonNavigationItemLabel()
    {
        const precision = 0;
        this._resetGestureButtonNavitationItem.label = Number.percentageString(this._gestureController.scale, precision);
    }

    _showGridButtonClicked(event)
    {
        WI.settings.showImageGrid.value = !this._showGridButtonNavigationItem.activated;

        this._updateImageGrid();
    }

    _handleResetGestureButtonNavitationItemClicked(event)
    {
        this._gestureController.reset();
    }

    _handleZoomOutGestureButtonNavitationItemClicked(event)
    {
        this._gestureController.scale /= 2;
    }

    _handleZoomInGestureButtonNavitationItemClicked(event)
    {
        this._gestureController.scale *= 2;
    }

    _handleLocalResourceContentDidChange(event)
    {
        this._imageElement.src = this.resource.createObjectURL();
    }
};
