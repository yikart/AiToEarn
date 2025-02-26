/*
 * Copyright (C) 2017 Sony Interactive Entertainment Inc.
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

WI.Layers3DContentView = class Layers3DContentView extends WI.ContentView
{
    constructor()
    {
        super();

        this.element.classList.add("layers-3d");

        this._compositingBordersButtonNavigationItem = new WI.ActivateButtonNavigationItem("layer-borders", WI.UIString("Show compositing borders"), WI.UIString("Hide compositing borders"), "Images/LayerBorders.svg", 13, 13);
        this._compositingBordersButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleCompositingBordersButtonClicked, this);
        this._compositingBordersButtonNavigationItem.enabled = WI.LayerTreeManager.supportsVisibleCompositingBorders();
        this._compositingBordersButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        this._paintFlashingButtonNavigationItem = new WI.ActivateButtonNavigationItem("paint-flashing", WI.UIString("Enable paint flashing"), WI.UIString("Disable paint flashing"), "Images/Paint.svg", 16, 16);
        this._paintFlashingButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handlePaingFlashingButtonClicked, this);
        this._paintFlashingButtonNavigationItem.enabled = WI.LayerTreeManager.supportsShowingPaintRects();
        this._paintFlashingButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;

        this._layers = [];
        this._layerGroupsById = new Map;
        this._selectedLayerGroup = null;
        this._candidateSelection = null;
        this._nodeToSelect = null;

        this._renderer = null;
        this._camera = null;
        this._controls = null;
        this._scene = null;
        this._boundingBox = null;
        this._raycaster = null;
        this._animationFrameRequestId = null;
        this._documentNode = null;

        this._layerInfoElement = null;
        this._compositedDimensionsElement = null;
        this._visibleDimensionsElement = null;
        this._reasonsListElement = null;
    }

    // Public

    get navigationItems()
    {
        return [this._compositingBordersButtonNavigationItem, this._paintFlashingButtonNavigationItem];
    }

    get supplementalRepresentedObjects()
    {
        return this._layers;
    }

    selectLayerById(layerId)
    {
        let layerGroup = this._layerGroupsById.get(layerId);
        this._updateLayerGroupSelection(layerGroup);
        this._updateLayerInfoElement();
        this._centerOnSelection();
    }

    selectLayerForNode(node)
    {
        if (!this._layers.length) {
            this._nodeToSelect = node;
            return;
        }

        this._nodeToSelect = null;

        let layer = null;
        while (node && !layer) {
            layer = this._layers.find((layer) => layer.nodeId === node.id);
            if (!layer)
                node = node.parentNode;
        }

        console.assert(layer, "There should always be a top level (document) layer");
        if (!layer)
            return;

        this.selectLayerById(layer.layerId);

        this.dispatchEventToListeners(WI.Layers3DContentView.Event.SelectedLayerChanged, {layerId: layer.layerId});
    }

    // Protected

    attached()
    {
        super.attached();

        WI.layerTreeManager.addEventListener(WI.LayerTreeManager.Event.LayerTreeDidChange, this._layerTreeDidChange, this);

        if (this.didInitialLayout)
            this._animate();

        WI.layerTreeManager.updateCompositingBordersVisibleFromPageIfNeeded();

        WI.layerTreeManager.addEventListener(WI.LayerTreeManager.Event.CompositingBordersVisibleChanged, this._handleCompositingBordersVisibleChanged, this);
        this._handleCompositingBordersVisibleChanged();

        WI.layerTreeManager.addEventListener(WI.LayerTreeManager.Event.ShowPaintRectsChanged, this._handleShowPaintRectsChanged, this);
        this._handleShowPaintRectsChanged();
    }

    detached()
    {
        WI.layerTreeManager.removeEventListener(WI.LayerTreeManager.Event.LayerTreeDidChange, this._layerTreeDidChange, this);

        this._stopAnimation();

        WI.layerTreeManager.removeEventListener(WI.LayerTreeManager.Event.ShowPaintRectsChanged, this._handleShowPaintRectsChanged, this);
        WI.layerTreeManager.removeEventListener(WI.LayerTreeManager.Event.CompositingBordersVisibleChanged, this._handleCompositingBordersVisibleChanged, this);

        super.detached();
    }

    initialLayout()
    {
        super.initialLayout();

        this._renderer = new THREE.WebGLRenderer({antialias: true});
        this._renderer.setSize(this.element.offsetWidth, this.element.offsetHeight);

        let updateBackground = () => {
            this._renderer.setClearColor(window.getComputedStyle(this.element).getPropertyValue("--background-color-content").trim());
        };
        window.matchMedia("(prefers-color-scheme: dark)").addListener(updateBackground);
        updateBackground();

        this._camera = new THREE.PerspectiveCamera(45, this.element.offsetWidth / this.element.offsetHeight, 1, 100_000);

        this._controls = new THREE.OrbitControls(this._camera, this._renderer.domElement);
        this._controls.enableDamping = true;
        this._controls.panSpeed = 0.5;
        this._controls.enableKeys = false;
        this._controls.zoomSpeed = 0.5;
        this._controls.minDistance = 1000;
        this._controls.rotateSpeed = 0.5;
        this._controls.minAzimuthAngle = -Math.PI / 2;
        this._controls.maxAzimuthAngle = Math.PI / 2;
        this._controls.screenSpacePanning = true;
        this._renderer.domElement.addEventListener("contextmenu", (event) => { event.stopPropagation(); });

        this._scene = new THREE.Scene;
        this._boundingBox = new THREE.Box3;

        this._raycaster = new THREE.Raycaster;
        this._renderer.domElement.addEventListener("mousedown", this._canvasMouseDown.bind(this));
        this._renderer.domElement.addEventListener("mouseup", this._canvasMouseUp.bind(this));

        this.element.appendChild(this._renderer.domElement);

        this.element.appendChild(WI.ReferencePage.LayersTab.createLinkElement());

        this._animate();
    }

    layout()
    {
        if (this.layoutReason === WI.View.LayoutReason.Resize)
            return;

        WI.domManager.requestDocument((node) => {
            let documentWasUpdated = this._updateDocument(node);

            WI.layerTreeManager.layersForNode(node, (layers) => {
                this._updateLayers(layers);

                if (documentWasUpdated)
                    this._resetCamera();

                if (this._nodeToSelect)
                    this.selectLayerForNode(this._nodeToSelect);
            });
        });
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        this._stopAnimation();
        this._camera.aspect = this.element.offsetWidth / this.element.offsetHeight;
        this._camera.updateProjectionMatrix();
        this._renderer.setSize(this.element.offsetWidth, this.element.offsetHeight);
        this._animate();
    }

    // Private

    _layerTreeDidChange(event)
    {
        this.needsLayout();
    }

    _animate()
    {
        this._controls.update();
        this._restrictPan();
        this._renderer.render(this._scene, this._camera);
        this._animationFrameRequestId = requestAnimationFrame(() => { this._animate(); });
    }

    _stopAnimation()
    {
        cancelAnimationFrame(this._animationFrameRequestId);
        this._animationFrameRequestId = null;
    }

    _updateDocument(documentNode)
    {
        if (documentNode === this._documentNode)
            return false;

        this._scene.children.length = 0;
        this._layerGroupsById.clear();
        this._layers.length = 0;

        this._documentNode = documentNode;

        return true;
    }

    _updateLayers(newLayers)
    {
        // FIXME: This should be made into the basic usage of the manager, if not the agent itself.
        //        At that point, we can remove this duplication from the visualization and sidebar.
        let {removals, additions} = WI.layerTreeManager.layerTreeMutations(this._layers, newLayers);

        for (let layer of removals) {
            let layerGroup = this._layerGroupsById.get(layer.layerId);
            this._scene.remove(layerGroup);
            this._layerGroupsById.delete(layer.layerId);
        }

        if (this._selectedLayerGroup && !this._layerGroupsById.get(this._selectedLayerGroup.userData.layer.layerId))
            this.selectedLayerGroup = null;

        for (let layer of additions) {
            let layerGroup = this._createLayerGroup(layer);
            this._layerGroupsById.set(layer.layerId, layerGroup);
            this._scene.add(layerGroup);
        }

        // FIXME: Update the backend to provide a literal "layer tree" so we can decide z-indices less naively.
        const zInterval = 25;
        newLayers.forEach((layer, index) => {
            let layerGroup = this._layerGroupsById.get(layer.layerId);
            layerGroup.position.set(0, 0, index * zInterval);
        });

        this._boundingBox.setFromObject(this._scene);
        this._controls.maxDistance = this._boundingBox.max.z + WI.Layers3DContentView._zPadding;

        this._layers = newLayers;
        this.dispatchEventToListeners(WI.ContentView.Event.SelectionPathComponentsDidChange);
    }

    _createLayerGroup(layer) {
        let layerGroup = new THREE.Group;
        layerGroup.userData.layer = layer;
        layerGroup.add(this._createLayerMesh(layer.bounds), this._createLayerMesh(layer.compositedBounds, true));
        return layerGroup;
    }

    _createLayerMesh({x, y, width, height}, isOutline = false)
    {
        let geometry = new THREE.Geometry;
        geometry.vertices.push(
            new THREE.Vector3(x, -y, 0),
            new THREE.Vector3(x, -y - height, 0),
            new THREE.Vector3(x + width, -y - height, 0),
            new THREE.Vector3(x + width, -y, 0),
        );

        if (isOutline) {
            let material = new THREE.LineBasicMaterial({color: WI.Layers3DContentView._layerColor.stroke});
            return new THREE.LineLoop(geometry, material);
        }

        geometry.faces.push(new THREE.Face3(0, 1, 3), new THREE.Face3(1, 2, 3));

        let material = new THREE.MeshBasicMaterial({
            color: WI.Layers3DContentView._layerColor.fill,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false,
        });

        return new THREE.Mesh(geometry, material);
    }

    _canvasMouseDown(event)
    {
        let x = (event.offsetX / event.target.offsetWidth) * 2 - 1;
        let y = -(event.offsetY / event.target.offsetHeight) * 2 + 1;
        this._raycaster.setFromCamera(new THREE.Vector2(x, y), this._camera);

        const recursive = true;
        let intersects = this._raycaster.intersectObjects(this._scene.children, recursive);
        let layerGroup = intersects.length ? intersects[0].object.parent : null;
        this._candidateSelection = {layerGroup};

        let canvasMouseMove = (event) => {
            this._candidateSelection = null;
            this._renderer.domElement.removeEventListener("mousemove", canvasMouseMove);
        };

        this._renderer.domElement.addEventListener("mousemove", canvasMouseMove);
    }

    _canvasMouseUp(event)
    {
        if (!this._candidateSelection)
            return;

        let selection = this._candidateSelection.layerGroup;
        if (selection && selection === this._selectedLayerGroup) {
            if (!event.metaKey)
                return;

            selection = null;
        }

        this._updateLayerGroupSelection(selection);
        this._updateLayerInfoElement();

        let layerId = selection ? selection.userData.layer.layerId : null;
        this.dispatchEventToListeners(WI.Layers3DContentView.Event.SelectedLayerChanged, {layerId});
    }

    _updateLayerGroupSelection(layerGroup)
    {
        let setColor = ({fill, stroke}) => {
            let [plane, outline] = this._selectedLayerGroup.children;
            plane.material.color.set(fill);
            outline.material.color.set(stroke);
        };

        if (this._selectedLayerGroup)
            setColor(WI.Layers3DContentView._layerColor);

        this._selectedLayerGroup = layerGroup;

        if (this._selectedLayerGroup)
            setColor(WI.Layers3DContentView._selectedLayerColor);
    }

    _centerOnSelection()
    {
        if (!this._selectedLayerGroup)
            return;

        let {x, y, width, height} = this._selectedLayerGroup.userData.layer.bounds;
        this._controls.target.set(x + (width / 2), -y - (height / 2), 0);
        this._camera.position.set(x + (width / 2), -y - (height / 2), this._selectedLayerGroup.position.z + WI.Layers3DContentView._zPadding / 2);
    }

    _resetCamera()
    {
        let {x, y, width, height} = this._layers[0].bounds;
        this._controls.target.set(x + (width / 2), -y - (height / 2), 0);
        this._camera.position.set(x + (width / 2), -y - (height / 2), this._controls.maxDistance - WI.Layers3DContentView._zPadding / 2);
    }

    _restrictPan()
    {
        let delta = new THREE.Vector3;
        this._boundingBox.clampPoint(this._controls.target, delta).setZ(0).sub(this._controls.target);
        this._controls.target.add(delta);
        this._camera.position.add(delta);
    }

    _handleCompositingBordersVisibleChanged(event)
    {
        this._compositingBordersButtonNavigationItem.activated = WI.layerTreeManager.compositingBordersVisible;
    }

    _handleCompositingBordersButtonClicked(event)
    {
        WI.layerTreeManager.compositingBordersVisible = !WI.layerTreeManager.compositingBordersVisible;
    }

    _handleShowPaintRectsChanged(event)
    {
        this._paintFlashingButtonNavigationItem.activated = WI.layerTreeManager.showPaintRects;
    }

    _handlePaingFlashingButtonClicked(event)
    {
        WI.layerTreeManager.showPaintRects = !WI.layerTreeManager.showPaintRects;
    }

    _buildLayerInfoElement()
    {
        this._layerInfoElement = this._element.appendChild(document.createElement("div"));
        this._layerInfoElement.classList.add("layer-info", "hidden");

        let content = this._layerInfoElement.appendChild(document.createElement("div"));
        content.className = "content";

        let dimensionsTitle = content.appendChild(document.createElement("div"));
        dimensionsTitle.textContent = WI.UIString("Dimensions");
        let dimensionsTable = content.appendChild(document.createElement("table"));

        let compositedRow = dimensionsTable.appendChild(document.createElement("tr"));
        let compositedLabel = compositedRow.appendChild(document.createElement("td"));
        compositedLabel.textContent = WI.UIString("Composited");
        this._compositedDimensionsElement = compositedRow.appendChild(document.createElement("td"));

        let visibleRow = dimensionsTable.appendChild(document.createElement("tr"));
        let visibleLabel = visibleRow.appendChild(document.createElement("td"));
        visibleLabel.textContent = WI.UIString("Visible");
        this._visibleDimensionsElement = visibleRow.appendChild(document.createElement("td"));

        let reasonsTitle = content.appendChild(document.createElement("div"));
        reasonsTitle.textContent = WI.UIString("Reasons for compositing");
        this._reasonsListElement = content.appendChild(document.createElement("ul"));
    }

    _updateLayerInfoElement()
    {
        if (!this._layerInfoElement)
            this._buildLayerInfoElement();

        if (!this._selectedLayerGroup) {
            this._layerInfoElement.classList.add("hidden");
            return;
        }

        let layer = this._selectedLayerGroup.userData.layer;
        this._compositedDimensionsElement.textContent = `${layer.compositedBounds.width}px ${multiplicationSign} ${layer.compositedBounds.height}px`;
        this._visibleDimensionsElement.textContent = `${layer.bounds.width}px ${multiplicationSign} ${layer.bounds.height}px`;

        WI.layerTreeManager.reasonsForCompositingLayer(layer, (compositingReasons) => {
            this._updateReasonsList(compositingReasons);
            this._layerInfoElement.classList.remove("hidden");
        });
    }

    _updateReasonsList(compositingReasons)
    {
        this._reasonsListElement.removeChildren();

        let addReason = (reason) => {
            let item = this._reasonsListElement.appendChild(document.createElement("li"));
            item.textContent = reason;
        };

        if (compositingReasons.transform3D)
            addReason(WI.UIString("Element has a 3D transform"));
        if (compositingReasons.video)
            addReason(WI.UIString("Element is <video>"));
        if (compositingReasons.canvas)
            addReason(WI.UIString("Element is <canvas>"));
        if (compositingReasons.plugin)
            addReason(WI.UIString("Element is a plug-in"));
        if (compositingReasons.iFrame)
            addReason(WI.UIString("Element is <iframe>"));
        if (compositingReasons.model)
            addReason(WI.UIString("Element is <model>"));
        if (compositingReasons.backfaceVisibilityHidden)
            addReason(WI.UIString("Element has \u201Cbackface-visibility: hidden\u201D style"));
        if (compositingReasons.clipsCompositingDescendants)
            addReason(WI.UIString("Element clips compositing descendants"));
        if (compositingReasons.animation)
            addReason(WI.UIString("Element is animated"));
        if (compositingReasons.filters)
            addReason(WI.UIString("Element has CSS filters applied"));
        if (compositingReasons.positionFixed)
            addReason(WI.UIString("Element has \u201Cposition: fixed\u201D style"));
        if (compositingReasons.positionSticky)
            addReason(WI.UIString("Element has \u201Cposition: sticky\u201D style"));
        if (compositingReasons.overflowScrollingTouch)
            addReason(WI.UIString("Element has \u201C-webkit-overflow-scrolling: touch\u201D style"));
        if (compositingReasons.stacking)
            addReason(WI.UIString("Element may overlap another compositing element"));
        if (compositingReasons.overlap)
            addReason(WI.UIString("Element overlaps other compositing element"));
        if (compositingReasons.negativeZIndexChildren)
            addReason(WI.UIString("Element has children with a negative z-index"));
        if (compositingReasons.transformWithCompositedDescendants)
            addReason(WI.UIString("Element has a 2D transform and composited descendants"));
        if (compositingReasons.opacityWithCompositedDescendants)
            addReason(WI.UIString("Element has opacity applied and composited descendants"));
        if (compositingReasons.maskWithCompositedDescendants)
            addReason(WI.UIString("Element is masked and has composited descendants"));
        if (compositingReasons.reflectionWithCompositedDescendants)
            addReason(WI.UIString("Element has a reflection and composited descendants"));
        if (compositingReasons.filterWithCompositedDescendants)
            addReason(WI.UIString("Element has CSS filters applied and composited descendants"));
        if (compositingReasons.blendingWithCompositedDescendants)
            addReason(WI.UIString("Element has CSS blending applied and composited descendants"));
        if (compositingReasons.isolatesCompositedBlendingDescendants)
            addReason(WI.UIString("Element is a stacking context and has composited descendants with CSS blending applied"));
        if (compositingReasons.perspective)
            addReason(WI.UIString("Element has perspective applied"));
        if (compositingReasons.preserve3D)
            addReason(WI.UIString("Element has \u201Ctransform-style: preserve-3d\u201D style"));
        if (compositingReasons.willChange)
            addReason(WI.UIString("Element has \u201Cwill-change\u201D style which includes opacity, transform, transform-style, perspective, filter or backdrop-filter"));
        if (compositingReasons.root)
            addReason(WI.UIString("Element is the root element"));
        if (compositingReasons.blending)
            addReason(WI.UIString("Element has \u201Cblend-mode\u201D style"));
    }
};

WI.Layers3DContentView._zPadding = 3000;

WI.Layers3DContentView._layerColor = {
    fill: "hsl(76, 49%, 75%)",
    stroke: "hsl(79, 45%, 50%)"
};

WI.Layers3DContentView._selectedLayerColor = {
    fill: "hsl(208, 66%, 79%)",
    stroke: "hsl(202, 57%, 68%)"
};

WI.Layers3DContentView.Event = {
    SelectedLayerChanged: "selected-layer-changed"
};
