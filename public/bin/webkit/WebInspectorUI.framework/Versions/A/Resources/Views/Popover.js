/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.Popover = class Popover extends WI.Object
{
    constructor(delegate)
    {
        super();

        this.delegate = delegate;
        this._edge = null;
        this._frame = new WI.Rect;
        this._content = null;
        this._targetFrame = new WI.Rect;
        this._anchorPoint = new WI.Point;
        this._preferredEdges = null;
        this._resizeHandler = null;

        this._contentNeedsUpdate = false;
        this._dismissing = false;

        this._element = document.createElement("div");
        this._element.className = "popover";
        this._element.addEventListener("transitionend", this, true);

        this._container = this._element.appendChild(document.createElement("div"));
        this._container.className = "container";

        this._backgroundCanvasContext = null;

        this._drawBackgroundAnimationIdentifier = undefined;
    }

    // Public

    get element() { return this._element; }

    get visible()
    {
        return this._element.parentNode === document.body && !this._element.classList.contains(WI.Popover.FadeOutClassName);
    }

    get frame()
    {
        return this._frame;
    }

    set frame(frame)
    {
        this._element.style.left = frame.minX() + "px";
        this._element.style.top = frame.minY() + "px";
        this._element.style.width = frame.size.width + "px";
        this._element.style.height = frame.size.height + "px";
        this._element.style.backgroundSize = frame.size.width + "px " + frame.size.height + "px";
        this._frame = frame;
    }

    set content(content)
    {
        if (content === this._content)
            return;

        this._content = content;

        this._contentNeedsUpdate = true;

        if (this.visible)
            this._update(true);
    }

    set windowResizeHandler(resizeHandler)
    {
        console.assert(typeof resizeHandler === "function");
        this._resizeHandler = resizeHandler;
    }

    resize()
    {
        if (this.visible && this._resizeHandler)
            this._resizeHandler();
    }

    update(shouldAnimate = true)
    {
        if (!this.visible)
            return;

        var previouslyFocusedElement = document.activeElement;

        this._contentNeedsUpdate = true;
        this._update(shouldAnimate);

        if (previouslyFocusedElement)
            previouslyFocusedElement.focus();
    }

    present(targetFrame, preferredEdges, {updateContent, shouldAnimate} = {})
    {
        this._targetFrame = targetFrame;
        this._preferredEdges = preferredEdges;

        if (!this._content)
            return;

        this._addListenersIfNeeded();

        if (updateContent && this.visible)
            this.update(shouldAnimate);
        else
            this._update(shouldAnimate);
    }

    presentNewContentWithFrame(content, targetFrame, preferredEdges)
    {
        this._content = content;
        this._contentNeedsUpdate = true;

        this._targetFrame = targetFrame;
        this._preferredEdges = preferredEdges;

        this._addListenersIfNeeded();

        var shouldAnimate = this.visible;
        this._update(shouldAnimate);
    }

    dismiss()
    {
        if (this._dismissing || this._element.parentNode !== document.body)
            return;

        this._dismissing = true;

        console.assert(this._isListeningForPopoverEvents);
        this._isListeningForPopoverEvents = false;

        window.removeEventListener("mousedown", this, true);
        window.removeEventListener("scroll", this, true);
        window.removeEventListener("resize", this, true);
        window.removeEventListener("keypress", this, true);
        WI.tabBrowser.contentViewContainer.removeEventListener(WI.ContentViewContainer.Event.CurrentContentViewDidChange, this.dismiss, this);

        this._prefersDarkColorSchemeMediaQueryList.removeListener(this._boundUpdate);

        WI.quickConsole.keyboardShortcutDisabled = false;

        this._element.classList.add(WI.Popover.FadeOutClassName);

        if (this.delegate && typeof this.delegate.willDismissPopover === "function")
            this.delegate.willDismissPopover(this);

        WI.Popover._visibleInstance = null;
    }

    handleEvent(event)
    {
        switch (event.type) {
        case "mousedown":
        case "scroll":
            if (!this._element.contains(event.target) && !event.target.closest("." + WI.Popover.IgnoreAutoDismissClassName)
                && !event[WI.Popover.EventPreventDismissSymbol]) {
                this.dismiss();
            }
            break;
        case "resize":
            this.resize();
            break;
        case "keypress":
            if (event.keyCode === WI.KeyboardShortcut.Key.Escape.keyCode)
                this.dismiss();
            break;
        case "transitionend":
            if (event.target === this._element) {
                document.body.removeChild(this._element);
                this._element.classList.remove(WI.Popover.FadeOutClassName);
                this._container.textContent = "";
                if (this.delegate && typeof this.delegate.didDismissPopover === "function")
                    this.delegate.didDismissPopover(this);

                this._dismissing = false;

                if (this._backgroundCanvasContext) {
                    WI.Popover._backgroundCanvasContexts.push(new WeakRef(this._backgroundCanvasContext));
                    this._backgroundCanvasContext = null;
                }
                break;
            }
            break;
        }
    }

    // Private

    _update(shouldAnimate)
    {
        if (WI.Popover._visibleInstance !== this) {
            WI.Popover._visibleInstance?.dismiss();
            WI.Popover._visibleInstance = this;
        }

        if (shouldAnimate)
            var previousEdge = this._edge;

        var targetFrame = this._targetFrame;
        var preferredEdges = this._preferredEdges;

        // Ensure our element is on display so that its metrics can be resolved
        // or interrupt any pending transition to remove it from display.
        if (this._element.parentNode !== document.body)
            document.body.appendChild(this._element);
        else
            this._element.classList.remove(WI.Popover.FadeOutClassName);

        this._dismissing = false;

        if (this._edge !== null)
            this._element.classList.remove(this._cssClassNameForEdge());

        if (this._contentNeedsUpdate) {
            // Reset CSS properties on element so that the element may be sized to fit its content.
            this._element.style.removeProperty("left");
            this._element.style.removeProperty("top");
            this._element.style.removeProperty("width");
            this._element.style.removeProperty("height");

            // Add the content in place of the wrapper to get the raw metrics.
            this._container.replaceWith(this._content);

            // Get the ideal size for the popover to fit its content.
            var popoverBounds = this._element.getBoundingClientRect();
            this._preferredSize = new WI.Size(Math.ceil(popoverBounds.width), Math.ceil(popoverBounds.height));
        }

        var titleBarOffset = WI.undockedTitleAreaHeight();
        var containerFrame = new WI.Rect(0, titleBarOffset, window.innerWidth, window.innerHeight - titleBarOffset);
        // The frame of the window with a little inset to make sure we have room for shadows.
        containerFrame = containerFrame.inset(WI.Popover.ShadowEdgeInsets);

        // Work out the metrics for all edges.
        var metrics = new Array(preferredEdges.length);
        for (var edgeName in WI.RectEdge) {
            var edge = WI.RectEdge[edgeName];
            var item = {
                edge,
                metrics: this._bestMetricsForEdge(this._preferredSize, targetFrame, containerFrame, edge)
            };
            var preferredIndex = preferredEdges.indexOf(edge);
            if (preferredIndex !== -1)
                metrics[preferredIndex] = item;
            else
                metrics.push(item);
        }

        function area(size)
        {
            return Math.max(0, size.width) * Math.max(0, size.height);
        }

        // Find if any of those fit better than the frame for the preferred edge.
        var bestEdge = metrics[0].edge;
        var bestMetrics = metrics[0].metrics;
        for (var i = 1; i < metrics.length; i++) {
            var itemMetrics = metrics[i].metrics;
            if (area(itemMetrics.contentSize) > area(bestMetrics.contentSize)) {
                bestEdge = metrics[i].edge;
                bestMetrics = itemMetrics;
            }
        }

        console.assert(area(bestMetrics.contentSize) > 0);

        var anchorPoint;
        var bestFrame = bestMetrics.frame.round();

        this._edge = bestEdge;

        if (bestFrame === WI.Rect.ZERO_RECT) {
            // The target for the popover is offscreen.
            this.dismiss();
        } else {
            switch (bestEdge) {
            case WI.RectEdge.MIN_X: // Displayed on the left of the target, arrow points right.
                anchorPoint = new WI.Point(bestFrame.size.width - WI.Popover.ShadowPadding, targetFrame.midY() - bestFrame.minY());
                break;
            case WI.RectEdge.MAX_X: // Displayed on the right of the target, arrow points left.
                anchorPoint = new WI.Point(WI.Popover.ShadowPadding, targetFrame.midY() - bestFrame.minY());
                break;
            case WI.RectEdge.MIN_Y: // Displayed above the target, arrow points down.
                anchorPoint = new WI.Point(targetFrame.midX() - bestFrame.minX(), bestFrame.size.height - WI.Popover.ShadowPadding);
                break;
            case WI.RectEdge.MAX_Y: // Displayed below the target, arrow points up.
                anchorPoint = new WI.Point(targetFrame.midX() - bestFrame.minX(), WI.Popover.ShadowPadding);
                break;
            }

            this._element.classList.add(this._cssClassNameForEdge());

            if (shouldAnimate && this._edge === previousEdge)
                this._animateFrame(bestFrame, anchorPoint);
            else {
                 this.frame = bestFrame;
                 this._setAnchorPoint(anchorPoint);
                 this._drawBackground();
            }

            // Make sure content is centered in case either of the dimension is smaller than the minimal bounds.
            if (this._preferredSize.width < WI.Popover.MinWidth || this._preferredSize.height < WI.Popover.MinHeight)
                this._container.classList.add("center");
            else
                this._container.classList.remove("center");
        }

        // Wrap the content in the container so that it's located correctly.
        if (this._contentNeedsUpdate) {
            this._container.textContent = "";
            this._content.replaceWith(this._container);
            this._container.appendChild(this._content);
        }

        this._contentNeedsUpdate = false;
    }

    _cssClassNameForEdge()
    {
        switch (this._edge) {
        case WI.RectEdge.MIN_X: // Displayed on the left of the target, arrow points right.
            return "arrow-right";
        case WI.RectEdge.MAX_X: // Displayed on the right of the target, arrow points left.
            return "arrow-left";
        case WI.RectEdge.MIN_Y: // Displayed above the target, arrow points down.
            return "arrow-down";
        case WI.RectEdge.MAX_Y: // Displayed below the target, arrow points up.
            return "arrow-up";
        }
        console.error("Unknown edge.");
        return "arrow-up";
    }

    _setAnchorPoint(anchorPoint)
    {
        anchorPoint.x = Math.floor(anchorPoint.x);
        anchorPoint.y = Math.floor(anchorPoint.y);
        this._anchorPoint = anchorPoint;
    }

    _animateFrame(toFrame, toAnchor)
    {
        var startTime = Date.now();
        var duration = 350;
        var epsilon = 1 / (200 * duration);
        var spline = new WI.CubicBezierTimingFunction(0.25, 0.1, 0.25, 1);

        var fromFrame = this._frame.copy();
        var fromAnchor = this._anchorPoint.copy();

        function animatedValue(from, to, progress)
        {
            return from + (to - from) * progress;
        }

        function drawBackground()
        {
            var progress = spline.solve(Math.min((Date.now() - startTime) / duration, 1), epsilon);

            this.frame = new WI.Rect(
                animatedValue(fromFrame.minX(), toFrame.minX(), progress),
                animatedValue(fromFrame.minY(), toFrame.minY(), progress),
                animatedValue(fromFrame.size.width, toFrame.size.width, progress),
                animatedValue(fromFrame.size.height, toFrame.size.height, progress)
            ).round();

            this._setAnchorPoint(new WI.Point(
                animatedValue(fromAnchor.x, toAnchor.x, progress),
                animatedValue(fromAnchor.y, toAnchor.y, progress)
            ));

            this._drawBackground();

            if (progress < 1)
                this._drawBackgroundAnimationIdentifier = requestAnimationFrame(drawBackground.bind(this));
        }

        drawBackground.call(this);
    }

    _drawBackground()
    {
        if (this._drawBackgroundAnimationIdentifier) {
            cancelAnimationFrame(this._drawBackgroundAnimationIdentifier);
            this._drawBackgroundAnimationIdentifier = undefined;
        }

        let scaleFactor = window.devicePixelRatio;

        let width = this._frame.size.width;
        let height = this._frame.size.height;
        let scaledWidth = width * scaleFactor;
        let scaledHeight = height * scaleFactor;

        // Bounds of the path don't take into account the arrow, but really only the tight bounding box
        // of the content contained within the frame.
        let bounds;
        switch (this._edge) {
        case WI.RectEdge.MIN_X: // Displayed on the left of the target, arrow points right.
            bounds = new WI.Rect(0, 0, width - WI.Popover.AnchorSize, height);
            break;
        case WI.RectEdge.MAX_X: // Displayed on the right of the target, arrow points left.
            bounds = new WI.Rect(WI.Popover.AnchorSize, 0, width - WI.Popover.AnchorSize, height);
            break;
        case WI.RectEdge.MIN_Y: // Displayed above the target, arrow points down.
            bounds = new WI.Rect(0, 0, width, height - WI.Popover.AnchorSize);
            break;
        case WI.RectEdge.MAX_Y: // Displayed below the target, arrow points up.
            bounds = new WI.Rect(0, WI.Popover.AnchorSize, width, height - WI.Popover.AnchorSize);
            break;
        }

        bounds = bounds.inset(WI.Popover.ShadowEdgeInsets);
        let computedStyle = window.getComputedStyle(this._element, null);

        if (!this._backgroundCanvasContext) {
            this._backgroundCanvasContext = WI.Popover._backgroundCanvasContexts.pop()?.deref();
            if (!this._backgroundCanvasContext) {
                this._backgroundCanvasContext = document.createElement("canvas").getContext("2d");
                this._backgroundCanvasContext.canvas.className = "background-canvas";
            }
        }

        this._backgroundCanvasContext.canvas.width = scaledWidth;
        this._backgroundCanvasContext.canvas.height = scaledHeight;
        this._backgroundCanvasContext.clearRect(0, 0, scaledWidth, scaledHeight);

        let isolate = (callback) => {
            this._backgroundCanvasContext.save();
            callback();
            this._backgroundCanvasContext.restore();
        };

        isolate(() => {
            this._backgroundCanvasContext.scale(scaleFactor, scaleFactor);
            this._drawFrame(bounds);

            isolate(() => {
                this._backgroundCanvasContext.shadowBlur = 4;
                this._backgroundCanvasContext.shadowColor = computedStyle.getPropertyValue("--popover-shadow-color").trim();

                this._backgroundCanvasContext.strokeStyle = computedStyle.getPropertyValue("--popover-border-color").trim();
                this._backgroundCanvasContext.lineWidth = 2;
                this._backgroundCanvasContext.stroke();
            });

            isolate(() => {
                this._backgroundCanvasContext.fillStyle = computedStyle.getPropertyValue("--popover-background-color").trim();
                this._backgroundCanvasContext.fill();
            });
        });

        this._element.appendChild(this._backgroundCanvasContext.canvas);
    }

    _bestMetricsForEdge(preferredSize, targetFrame, containerFrame, edge)
    {
        var x, y;
        var width = preferredSize.width + (WI.Popover.ShadowPadding * 2) + (WI.Popover.ContentPadding * 2);
        var height = preferredSize.height + (WI.Popover.ShadowPadding * 2) + (WI.Popover.ContentPadding * 2);

        switch (edge) {
        case WI.RectEdge.MIN_X: // Displayed on the left of the target, arrow points right.
            width += WI.Popover.AnchorSize;
            x = targetFrame.origin.x - width + WI.Popover.ShadowPadding;
            y = targetFrame.origin.y - (height - targetFrame.size.height) / 2;
            break;
        case WI.RectEdge.MAX_X: // Displayed on the right of the target, arrow points left.
            width += WI.Popover.AnchorSize;
            x = targetFrame.origin.x + targetFrame.size.width - WI.Popover.ShadowPadding;
            y = targetFrame.origin.y - (height - targetFrame.size.height) / 2;
            break;
        case WI.RectEdge.MIN_Y: // Displayed above the target, arrow points down.
            height += WI.Popover.AnchorSize;
            x = targetFrame.origin.x - (width - targetFrame.size.width) / 2;
            y = targetFrame.origin.y - height + WI.Popover.ShadowPadding;
            break;
        case WI.RectEdge.MAX_Y: // Displayed below the target, arrow points up.
            height += WI.Popover.AnchorSize;
            x = targetFrame.origin.x - (width - targetFrame.size.width) / 2;
            y = targetFrame.origin.y + targetFrame.size.height - WI.Popover.ShadowPadding;
            break;
        }

        if (edge !== WI.RectEdge.MIN_X && x < containerFrame.minX())
            x = containerFrame.minX();
        if (edge !== WI.RectEdge.MAX_X && x + width > containerFrame.maxX())
            x = containerFrame.maxX() - width;
        if (edge !== WI.RectEdge.MIN_Y && y < containerFrame.minY())
            y = containerFrame.minY();
        if (edge !== WI.RectEdge.MAX_Y && y + height > containerFrame.maxY())
            y = containerFrame.maxY() - height;

        var preferredFrame = new WI.Rect(x, y, width, height);
        var bestFrame = preferredFrame.intersectionWithRect(containerFrame);

        width = bestFrame.size.width - (WI.Popover.ShadowPadding * 2);
        height = bestFrame.size.height - (WI.Popover.ShadowPadding * 2);

        switch (edge) {
        case WI.RectEdge.MIN_X: // Displayed on the left of the target, arrow points right.
        case WI.RectEdge.MAX_X: // Displayed on the right of the target, arrow points left.
            width -= WI.Popover.AnchorSize;
            break;
        case WI.RectEdge.MIN_Y: // Displayed above the target, arrow points down.
        case WI.RectEdge.MAX_Y: // Displayed below the target, arrow points up.
            height -= WI.Popover.AnchorSize;
            break;
        }

        return {
            frame: bestFrame,
            contentSize: new WI.Size(width, height)
        };
    }

    _drawFrame(bounds)
    {
        let cornerRadius = WI.Popover.CornerRadius;

        let anchorPointX = this._anchorPoint.x;
        let anchorPointY = this._anchorPoint.y;

        // Prevent the arrow from being positioned against one of the popover's rounded corners.
        let arrowPadding = cornerRadius + WI.Popover.AnchorSize;
        if (this._edge === WI.RectEdge.MIN_Y || this._edge === WI.RectEdge.MAX_Y)
            anchorPointX = Number.constrain(anchorPointX, bounds.minX() + arrowPadding, bounds.maxX() - arrowPadding);
        else
            anchorPointY = Number.constrain(anchorPointY, bounds.minY() + arrowPadding, bounds.maxY() - arrowPadding);

        this._backgroundCanvasContext.beginPath();
        switch (this._edge) {
        case WI.RectEdge.MIN_X: // Displayed on the left of the target, arrow points right.
            this._backgroundCanvasContext.moveTo(bounds.maxX(), bounds.minY() + cornerRadius);
            this._backgroundCanvasContext.lineTo(bounds.maxX(), anchorPointY - WI.Popover.AnchorSize);
            this._backgroundCanvasContext.lineTo(anchorPointX, anchorPointY);
            this._backgroundCanvasContext.lineTo(bounds.maxX(), anchorPointY + WI.Popover.AnchorSize);
            this._backgroundCanvasContext.arcTo(bounds.maxX(), bounds.maxY(), bounds.minX(), bounds.maxY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.minX(), bounds.maxY(), bounds.minX(), bounds.minY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.minX(), bounds.minY(), bounds.maxX(), bounds.minY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.maxX(), bounds.minY(), bounds.maxX(), bounds.maxY(), cornerRadius);
            break;
        case WI.RectEdge.MAX_X: // Displayed on the right of the target, arrow points left.
            this._backgroundCanvasContext.moveTo(bounds.minX(), bounds.maxY() - cornerRadius);
            this._backgroundCanvasContext.lineTo(bounds.minX(), anchorPointY + WI.Popover.AnchorSize);
            this._backgroundCanvasContext.lineTo(anchorPointX, anchorPointY);
            this._backgroundCanvasContext.lineTo(bounds.minX(), anchorPointY - WI.Popover.AnchorSize);
            this._backgroundCanvasContext.arcTo(bounds.minX(), bounds.minY(), bounds.maxX(), bounds.minY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.maxX(), bounds.minY(), bounds.maxX(), bounds.maxY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.maxX(), bounds.maxY(), bounds.minX(), bounds.maxY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.minX(), bounds.maxY(), bounds.minX(), bounds.minY(), cornerRadius);
            break;
        case WI.RectEdge.MIN_Y: // Displayed above the target, arrow points down.
            this._backgroundCanvasContext.moveTo(bounds.maxX() - cornerRadius, bounds.maxY());
            this._backgroundCanvasContext.lineTo(anchorPointX + WI.Popover.AnchorSize, bounds.maxY());
            this._backgroundCanvasContext.lineTo(anchorPointX, anchorPointY);
            this._backgroundCanvasContext.lineTo(anchorPointX - WI.Popover.AnchorSize, bounds.maxY());
            this._backgroundCanvasContext.arcTo(bounds.minX(), bounds.maxY(), bounds.minX(), bounds.minY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.minX(), bounds.minY(), bounds.maxX(), bounds.minY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.maxX(), bounds.minY(), bounds.maxX(), bounds.maxY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.maxX(), bounds.maxY(), bounds.minX(), bounds.maxY(), cornerRadius);
            break;
        case WI.RectEdge.MAX_Y: // Displayed below the target, arrow points up.
            this._backgroundCanvasContext.moveTo(bounds.minX() + cornerRadius, bounds.minY());
            this._backgroundCanvasContext.lineTo(anchorPointX - WI.Popover.AnchorSize, bounds.minY());
            this._backgroundCanvasContext.lineTo(anchorPointX, anchorPointY);
            this._backgroundCanvasContext.lineTo(anchorPointX + WI.Popover.AnchorSize, bounds.minY());
            this._backgroundCanvasContext.arcTo(bounds.maxX(), bounds.minY(), bounds.maxX(), bounds.maxY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.maxX(), bounds.maxY(), bounds.minX(), bounds.maxY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.minX(), bounds.maxY(), bounds.minX(), bounds.minY(), cornerRadius);
            this._backgroundCanvasContext.arcTo(bounds.minX(), bounds.minY(), bounds.maxX(), bounds.minY(), cornerRadius);
            break;
        }
        this._backgroundCanvasContext.closePath();
    }

    _addListenersIfNeeded()
    {
        if (!this._isListeningForPopoverEvents) {
            this._isListeningForPopoverEvents = true;

            window.addEventListener("mousedown", this, true);
            window.addEventListener("scroll", this, true);
            window.addEventListener("resize", this, true);
            window.addEventListener("keypress", this, true);
            WI.tabBrowser.contentViewContainer.addEventListener(WI.ContentViewContainer.Event.CurrentContentViewDidChange, this.dismiss, this);

            if (!this._boundUpdate)
                this._boundUpdate = this._update.bind(this);

            if (!this._prefersDarkColorSchemeMediaQueryList)
                this._prefersDarkColorSchemeMediaQueryList = window.matchMedia("(prefers-color-scheme: dark)");
            this._prefersDarkColorSchemeMediaQueryList.addListener(this._boundUpdate);

            WI.quickConsole.keyboardShortcutDisabled = true;
        }
    }
};

WI.Popover._visibleInstance = null;
WI.Popover._backgroundCanvasContexts = [];

WI.Popover.FadeOutClassName = "fade-out";
WI.Popover.CornerRadius = 5;
WI.Popover.MinWidth = 40;
WI.Popover.MinHeight = 40;
WI.Popover.ShadowPadding = 5;
WI.Popover.ContentPadding = 5;
WI.Popover.AnchorSize = 11;
WI.Popover.ShadowEdgeInsets = new WI.EdgeInsets(WI.Popover.ShadowPadding);
WI.Popover.IgnoreAutoDismissClassName = "popover-ignore-auto-dismiss";
WI.Popover.EventPreventDismissSymbol = Symbol("popover-event-prevent-dismiss");
