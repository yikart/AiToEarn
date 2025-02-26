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

WI.AnimationContentView = class AnimationContentView extends WI.ContentView
{
    constructor(representedObject)
    {
        console.assert(representedObject instanceof WI.Animation);

        super(representedObject);

        this._animationTargetDOMNode = null;
        this._cachedWidth = NaN;

        this.element.classList.add("animation");
    }

    // Static

    static get previewHeight()
    {
        return 40;
    }

    // Public

    handleRefreshButtonClicked()
    {
        this._refreshSubtitle();
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        let headerElement = this.element.appendChild(document.createElement("header"));

        let titlesContainer = headerElement.appendChild(document.createElement("div"));
        titlesContainer.className = "titles";

        this._titleElement = titlesContainer.appendChild(document.createElement("span"));
        this._titleElement.className = "title";

        this._subtitleElement = titlesContainer.appendChild(document.createElement("span"));
        this._subtitleElement.className = "subtitle";

        let navigationBar = new WI.NavigationBar;

        let animationTargetButtonNavigationItem = new WI.ButtonNavigationItem("animation-target", WI.UIString("Animation Target"), "Images/Markup.svg", 16, 16);
        animationTargetButtonNavigationItem.visibilityPriority = WI.NavigationItem.VisibilityPriority.Low;
        WI.addMouseDownContextMenuHandlers(animationTargetButtonNavigationItem.element, this._populateAnimationTargetButtonContextMenu.bind(this));
        navigationBar.addNavigationItem(animationTargetButtonNavigationItem);

        headerElement.append(navigationBar.element);
        this.addSubview(navigationBar);

        this._previewContainer = this.element.appendChild(document.createElement("div"));
        this._previewContainer.className = "preview";
    }

    layout()
    {
        super.layout();

        this._refreshTitle();
        this._refreshSubtitle();
        this._refreshPreview();
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        this._cachedWidth = this.element.realOffsetWidth;
    }

    attached()
    {
        super.attached();

        this.representedObject.addEventListener(WI.Animation.Event.NameChanged, this._handleNameChanged, this);
        this.representedObject.addEventListener(WI.Animation.Event.EffectChanged, this._handleEffectChanged, this);
        this.representedObject.addEventListener(WI.Animation.Event.TargetChanged, this._handleTargetChanged, this);
    }

    detached()
    {
        this.representedObject.removeEventListener(WI.Animation.Event.TargetChanged, this._handleTargetChanged, this);
        this.representedObject.removeEventListener(WI.Animation.Event.EffectChanged, this._handleEffectChanged, this);
        this.representedObject.removeEventListener(WI.Animation.Event.NameChanged, this._handleNameChanged, this);

        super.detached();
    }

    // Private

    _refreshTitle()
    {
        this._titleElement.removeChildren();

        let displayName = this.representedObject.displayName;

        let showIdentifierIfDifferent = (cssName) => {
            let formatString = "";
            let substitutions = [];

            if (cssName === displayName)
                formatString = WI.UIString("(%s)");
            else {
                formatString = WI.UIString("%s (%s)");
                substitutions.push(displayName);
            }

            let cssNameWrapper = document.createElement("code");
            cssNameWrapper.textContent = cssName;
            substitutions.push(cssNameWrapper);

            String.format(formatString, substitutions, String.standardFormatters, this._titleElement, function(a, b) {
                a.append(b);
                return a;
            });
        };

        switch (this.representedObject.animationType) {
        case WI.Animation.Type.WebAnimation:
            this._titleElement.textContent = this.representedObject.name || WI.UIString("(%s)").format(displayName);
            break;

        case WI.Animation.Type.CSSAnimation:
            showIdentifierIfDifferent(this.representedObject.cssAnimationName);
            break;

        case WI.Animation.Type.CSSTransition:
            showIdentifierIfDifferent(this.representedObject.cssTransitionProperty);
            break;
        }
    }

    _refreshSubtitle()
    {
        this.representedObject.requestEffectTarget((styleable) => {
            this._animationTargetDOMNode = styleable?.node ?? null;

            this._subtitleElement.removeChildren();
            if (styleable)
                this._subtitleElement.appendChild(WI.linkifyStyleable(styleable));
        });
    }

    _refreshPreview()
    {
        this._previewContainer.removeChildren();

        let keyframes = this.representedObject.keyframes;
        if (!keyframes.length) {
            let span = this._previewContainer.appendChild(document.createElement("span"));
            span.textContent = WI.UIString("This animation has no keyframes.");
            return;
        }

        let startDelay = this.representedObject.startDelay || 0;
        let iterationDuration = this.representedObject.iterationDuration || 0;
        let endDelay = this.representedObject.endDelay || 0;
        let totalDuration = startDelay + iterationDuration + endDelay;
        if (totalDuration === 0) {
            let span = this._previewContainer.appendChild(document.createElement("span"));
            span.textContent = WI.UIString("This animation has no duration.");
            return;
        }

        const previewHeight = WI.AnimationContentView.previewHeight;

        const markerHeadRadius = 4;
        const markerHeadPadding = 2;

        // Squeeze the entire preview so that markers aren't cut off.
        const squeezeXStart = (iterationDuration && startDelay) ? 0 : markerHeadRadius + markerHeadPadding;
        const squeezeXEnd = (iterationDuration && endDelay) ? 0 : markerHeadRadius + markerHeadPadding;
        const squeezeYStart = markerHeadRadius + (markerHeadPadding * 2);

        // Ensure that at least a line is drawn if the output of the timing function is `0`.
        const adjustEasingHeight = -1;

        // Move the easing line down to cut off the bottom border.
        const adjustEasingBottomY = 0.5;


        let secondsPerPixel = this._cachedWidth / totalDuration;

        startDelay *= secondsPerPixel;
        iterationDuration = (iterationDuration * secondsPerPixel) - squeezeXStart - squeezeXEnd;
        endDelay *= secondsPerPixel;

        let svg = this._previewContainer.appendChild(createSVGElement("svg"));
        svg.setAttribute("viewBox", `0 0 ${this._cachedWidth} ${previewHeight}`);

        function addTitle(parent, title) {
            let titleElement = parent.appendChild(createSVGElement("title"));
            titleElement.textContent = title;
        }

        if (startDelay) {
            let startDelayContainer = svg.appendChild(createSVGElement("g"));
            startDelayContainer.classList.add("delay", "start");

            let startDelayLine = startDelayContainer.appendChild(createSVGElement("line"));
            startDelayLine.setAttribute("y1", (previewHeight + squeezeYStart) / 2);
            startDelayLine.setAttribute("x2", startDelay);
            startDelayLine.setAttribute("y2", (previewHeight + squeezeYStart) / 2);

            let startDelayElement = startDelayContainer.appendChild(createSVGElement("rect"));
            startDelayElement.setAttribute("width", startDelay);
            startDelayElement.setAttribute("height", previewHeight);

            const startDelayTitleFormat = WI.UIString("Start Delay %s", "Web Animation Start Delay Tooltip", "Tooltip for section of graph representing delay before a web animation begins applying styles");
            addTitle(startDelayElement, startDelayTitleFormat.format(Number.secondsToString(this.representedObject.startDelay / 1000)));
        }

        if (endDelay) {
            let endDelayContainer = svg.appendChild(createSVGElement("g"));
            endDelayContainer.setAttribute("transform", `translate(${startDelay + iterationDuration + squeezeXStart}, 0)`);
            endDelayContainer.classList.add("delay", "end");

            let endDelayLine = endDelayContainer.appendChild(createSVGElement("line"));
            endDelayLine.setAttribute("y1", (previewHeight + squeezeYStart) / 2);
            endDelayLine.setAttribute("x2", endDelay);
            endDelayLine.setAttribute("y2", (previewHeight + squeezeYStart) / 2);

            let endDelayElement = endDelayContainer.appendChild(createSVGElement("rect"));
            endDelayElement.setAttribute("width", startDelay + iterationDuration + endDelay);
            endDelayElement.setAttribute("height", previewHeight);

            const endDelayTitleFormat = WI.UIString("End Delay %s", "Web Animation End Delay Tooltip", "Tooltip for section of graph representing delay after a web animation finishes applying styles");
            addTitle(endDelayElement, endDelayTitleFormat.format(Number.secondsToString(this.representedObject.endDelay / 1000)));
        }

        if (iterationDuration) {
            let timingFunction = this.representedObject.timingFunction;

            let activeDurationContainer = svg.appendChild(createSVGElement("g"));
            activeDurationContainer.classList.add("active");
            activeDurationContainer.setAttribute("transform", `translate(${startDelay + squeezeXStart}, ${squeezeYStart})`);

            const startY = 0;
            const endY = previewHeight - squeezeYStart;
            const height = endY - startY;

            for (let [keyframeA, keyframeB] of keyframes.adjacencies()) {
                let startX = iterationDuration * keyframeA.offset;
                let endX = iterationDuration * keyframeB.offset;
                let width = endX - startX;

                let easing = keyframeA.easing || timingFunction;

                let easingContainer = activeDurationContainer.appendChild(createSVGElement("g"));
                easingContainer.classList.add("easing");
                easingContainer.setAttribute("transform", `translate(${startX}, ${startY})`);

                let easingPath = easingContainer.appendChild(createSVGElement("path"));

                let pathSteps = [];
                if (easing instanceof WI.CubicBezierTimingFunction) {
                    pathSteps.push("C");
                    pathSteps.push(easing.inPoint.x * width); // x1
                    pathSteps.push((1 - easing.inPoint.y) * (height + adjustEasingHeight)); // y1
                    pathSteps.push(easing.outPoint.x * width); // x2
                    pathSteps.push((1 - easing.outPoint.y) * (height + adjustEasingHeight)); // y2
                    pathSteps.push(width); // x
                    pathSteps.push(0); // y
                } else if (easing instanceof WI.LinearTimingFunction) {
                    for (let point of easing.points)
                        pathSteps.push("L", width * point.progress, height + adjustEasingHeight - ((height + adjustEasingHeight) * point.value));
                } else if (easing instanceof WI.StepsTimingFunction) {
                    let goUpFirst = false;
                    let stepStartAdjust = 0;
                    let stepCountAdjust = 0;

                    switch (easing.type) {
                    case WI.StepsTimingFunction.Type.JumpStart:
                    case WI.StepsTimingFunction.Type.Start:
                        goUpFirst = true;
                        break;

                    case WI.StepsTimingFunction.Type.JumpNone:
                        --stepCountAdjust;
                        break;

                    case WI.StepsTimingFunction.Type.JumpBoth:
                        ++stepStartAdjust;
                        ++stepCountAdjust;
                        break;
                    }

                    let stepCount = easing.count + stepCountAdjust;
                    let stepX = width / easing.count; // Always use the defined number of steps to divide the duration.
                    let stepY = (height + adjustEasingHeight) / stepCount;

                    for (let i = stepStartAdjust; i <= stepCount; ++i) {
                        let x = stepX * (i - stepStartAdjust);
                        let y = height + adjustEasingHeight - (stepY * i);

                        if (goUpFirst) {
                            if (i)
                                pathSteps.push("H", x);

                            if (i < stepCount)
                                pathSteps.push("V", y - stepY);
                        } else {
                            pathSteps.push("V", y);

                            if (i < stepCount || stepCountAdjust < 0)
                                pathSteps.push("H", x + stepX);
                        }
                    }
                } else if (easing instanceof WI.SpringTimingFunction) {
                    let duration = easing.calculateDuration();
                    for (let i = 0; i < width; i += 1 / window.devicePixelRatio)
                        pathSteps.push("L", i, easing.solve(duration * i / width) * (height + adjustEasingHeight));
                }
                easingPath.setAttribute("d", `M 0 ${height + adjustEasingBottomY} ${pathSteps.join(" ")} V ${height + adjustEasingBottomY} Z`);

                let titleRect = easingContainer.appendChild(createSVGElement("rect"));
                titleRect.setAttribute("width", width);
                titleRect.setAttribute("height", height);

                addTitle(titleRect, easing.toString());
            }

            for (let keyframe of keyframes) {
                let x = iterationDuration * keyframe.offset;

                let keyframeContainer = activeDurationContainer.appendChild(createSVGElement("g"));
                keyframeContainer.classList.add("keyframe");
                keyframeContainer.setAttribute("transform", `translate(${x}, ${startY})`);

                let keyframeMarkerHead = keyframeContainer.appendChild(createSVGElement("circle"));
                keyframeMarkerHead.setAttribute("r", markerHeadRadius);

                let keyframeMarkerLine = keyframeContainer.appendChild(createSVGElement("line"));
                keyframeMarkerLine.setAttribute("y1", height);

                let titleRect = keyframeContainer.appendChild(createSVGElement("rect"));
                titleRect.setAttribute("x", -1 * (markerHeadRadius + markerHeadPadding));
                titleRect.setAttribute("y", -1 * squeezeYStart);
                titleRect.setAttribute("width", (markerHeadRadius + markerHeadPadding) * 2);
                titleRect.setAttribute("height", height + squeezeYStart);

                addTitle(titleRect, keyframe.style);
            }
        }
    }

    _handleNameChanged(event)
    {
        if (!this.didInitialLayout)
            return;

        this._refreshTitle();
    }

    _handleEffectChanged(event)
    {
        this._refreshPreview();
    }

    _handleTargetChanged(event)
    {
        this._refreshSubtitle();
    }

    _populateAnimationTargetButtonContextMenu(contextMenu)
    {
        contextMenu.appendItem(WI.UIString("Log Animation"), () => {
            WI.RemoteObject.resolveAnimation(this.representedObject, WI.RuntimeManager.ConsoleObjectGroup, (remoteObject) => {
                if (!remoteObject)
                    return;

                const text = WI.UIString("Selected Animation", "Appears as a label when a given web animation is logged to the Console");
                WI.consoleLogViewController.appendImmediateExecutionWithResult(text, remoteObject, {addSpecialUserLogClass: true, shouldRevealConsole: true});
            });
        });

        contextMenu.appendSeparator();

        if (this._animationTargetDOMNode)
            WI.appendContextMenuItemsForDOMNode(contextMenu, this._animationTargetDOMNode);
    }
};
