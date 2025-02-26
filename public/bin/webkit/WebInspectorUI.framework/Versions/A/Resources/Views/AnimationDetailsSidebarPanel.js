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

WI.AnimationDetailsSidebarPanel = class AnimationDetailsSidebarPanel extends WI.DetailsSidebarPanel
{
    constructor()
    {
        super("animation", WI.UIString("Animation"));

        this._animation = null;

        this._codeMirrorSectionMap = new Map;
    }

    // Public

    inspect(objects)
    {
        if (!(objects instanceof Array))
            objects = [objects];

        this.animation = objects.find((object) => object instanceof WI.Animation);

        return !!this.animation;
    }

    get animation()
    {
        return this._animation;
    }

    set animation(animation)
    {
        if (animation === this._animation)
            return;

        if (this._animation) {
            this._animation.removeEventListener(WI.Animation.Event.TargetChanged, this._handleAnimationTargetChanged, this);
            this._animation.removeEventListener(WI.Animation.Event.EffectChanged, this._handleAnimationEffectChanged, this);
            this._animation.removeEventListener(WI.Animation.Event.NameChanged, this._handleAnimationNameChanged, this);
        }

        this._animation = animation || null;

        if (this._animation) {
            this._animation.addEventListener(WI.Animation.Event.NameChanged, this._handleAnimationNameChanged, this);
            this._animation.addEventListener(WI.Animation.Event.EffectChanged, this._handleAnimationEffectChanged, this);
            this._animation.addEventListener(WI.Animation.Event.TargetChanged, this._handleAnimationTargetChanged, this);
        }

        this.needsLayout();
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._idRow = new WI.DetailsSectionSimpleRow(WI.UIString("Identifier"));
        this._typeRow = new WI.DetailsSectionSimpleRow(WI.UIString("Type"));
        this._cssAnimationNameRow = new WI.DetailsSectionSimpleRow(WI.UIString("Name"));
        this._cssTransitionPropertyRow = new WI.DetailsSectionSimpleRow(WI.UIString("Property"));
        this._targetRow = new WI.DetailsSectionSimpleRow(WI.UIString("Target", "Web Animation Target Label", "Label for the current DOM node target of a web animation"));

        const identitySectionTitle = WI.UIString("Identity", "Web Animation Identity Title", "Section title for information about a web animation");
        let identitySection = new WI.DetailsSection("animation-identity", identitySectionTitle, [new WI.DetailsSectionGroup([this._idRow, this._typeRow, this._cssAnimationNameRow, this._cssTransitionPropertyRow, this._targetRow])]);
        this.contentView.element.appendChild(identitySection.element);

        this._iterationCountRow = new WI.DetailsSectionSimpleRow(WI.UIString("Iterations", "Web Animation Iteration Count Label", "Label for the number of iterations of a web animation"));
        this._iterationStartRow = new WI.DetailsSectionSimpleRow(WI.UIString("Start", "Web Animation Iteration Start Label", "Label for the number describing which iteration a web animation should start at"));
        this._iterationDurationRow = new WI.DetailsSectionSimpleRow(WI.UIString("Duration", "Web Animation Iteration Duration Label", "Label for the time duration of each iteration of a web animation"));
        let iterationsGroup = new WI.DetailsSectionGroup([this._iterationCountRow, this._iterationStartRow, this._iterationDurationRow]);

        this._startDelayRow = new WI.DetailsSectionSimpleRow(WI.UIString("Start Delay", "Web Animation Start Delay Label", "Label for the start delay time of a web animation "));
        this._endDelayRow = new WI.DetailsSectionSimpleRow(WI.UIString("End Delay", "Web Animation End Delay Label", "Label for the end delay time of a web animation "));
        this._timingFunctionRow = new WI.DetailsSectionSimpleRow(WI.UIString("Easing", "Web Animation Easing Label", "Label for the cubic-bezier timing function of a web animation"));
        let timingGroup = new WI.DetailsSectionGroup([this._startDelayRow, this._endDelayRow, this._timingFunctionRow]);

        this._playbackDirectionRow = new WI.DetailsSectionSimpleRow(WI.UIString("Direction", "Web Animation Playback Direction Label", "Label for the playback direction of a web animation"));
        this._fillModeRow = new WI.DetailsSectionSimpleRow(WI.UIString("Fill", "Web Animation Fill Mode Label", "Label for the fill mode of a web animation"));
        let fillDirectionGroup = new WI.DetailsSectionGroup([this._playbackDirectionRow, this._fillModeRow]);

        const effectSectionTitle = WI.UIString("Effect", "Web Animation Effect Title", "Section title for information about the effect of a web animation");
        let effectSection = new WI.DetailsSection("animation-effect", effectSectionTitle, [iterationsGroup, timingGroup, fillDirectionGroup]);
        this.contentView.element.appendChild(effectSection.element);

        this._keyframesGroup = new WI.DetailsSectionGroup;

        const keyframesSectionTitle = WI.UIString("Keyframes", "Web Animation Keyframes Title", "Section title for information about the keyframes of a web animation");
        let keyframesSection = new WI.DetailsSection("animation-keyframes", keyframesSectionTitle, [this._keyframesGroup]);
        this.contentView.element.appendChild(keyframesSection.element);

        const selectable = false;
        let backtraceTreeOutline = new WI.TreeOutline(selectable);
        backtraceTreeOutline.disclosureButtons = false;
        this._backtraceTreeController = new WI.StackTraceTreeController(backtraceTreeOutline);

        let backtraceRow = new WI.DetailsSectionRow;
        backtraceRow.element.appendChild(backtraceTreeOutline.element);

        const backtraceSectionTitle = WI.UIString("Backtrace", "Web Animation Backtrace Title", "Section title for the JavaScript backtrace of the creation of a web animation");
        this._backtraceSection = new WI.DetailsSection("animation-backtrace", backtraceSectionTitle, [new WI.DetailsSectionGroup([backtraceRow])]);
        this._backtraceSection.element.hidden = true;
        this.contentView.element.appendChild(this._backtraceSection.element);
    }

    layout()
    {
        super.layout();

        if (!this._animation)
            return;

        this._refreshIdentitySection();
        this._refreshEffectSection();
        this._refreshBacktraceSection();

        for (let codeMirror of this._codeMirrorSectionMap.values())
            codeMirror.refresh();
    }

    attached()
    {
        super.attached();

        for (let codeMirror of this._codeMirrorSectionMap.values())
            codeMirror.refresh();
    }

    // Private

    _refreshIdentitySection()
    {
        let animationType = this._animation.animationType;
        let displayName = this._animation.displayName;
        let cssAnimationName = this._animation.cssAnimationName;
        let cssTransitionProperty = this._animation.cssTransitionProperty;

        switch (animationType) {
        case WI.Animation.Type.WebAnimation:
            this._idRow.value = this._animation.name;
            break;

        case WI.Animation.Type.CSSAnimation:
            this._idRow.value = cssAnimationName !== displayName ? displayName : null;
            break;

        case WI.Animation.Type.CSSTransition:
            this._idRow.value = cssTransitionProperty !== displayName ? displayName : null;
            break;
        }

        this._typeRow.value = WI.Animation.displayNameForAnimationType(animationType);

        this._cssAnimationNameRow.value = cssAnimationName;
        this._cssTransitionPropertyRow.value = cssTransitionProperty;

        this._targetRow.value = null;
        this._animation.requestEffectTarget((styleable) => {
            this._targetRow.value = WI.linkifyStyleable(styleable);
        });
    }

    _refreshEffectSection()
    {
        for (let section of this._codeMirrorSectionMap.keys())
            section.removeEventListener(WI.DetailsSection.Event.CollapsedStateChanged, this._handleDetailsSectionCollapsedStateChanged, this);
        this._codeMirrorSectionMap.clear();

        const precision = 0;

        this._iterationCountRow.value = !isNaN(this._animation.iterationCount) ? this._animation.iterationCount.toLocaleString() : null;
        this._iterationStartRow.value = !isNaN(this._animation.iterationStart) ? this._animation.iterationStart.toLocaleString() : null;
        this._iterationDurationRow.value = !isNaN(this._animation.iterationDuration) ? Number.secondsToString(this._animation.iterationDuration / 1000) : null;

        this._startDelayRow.value = this._animation.startDelay ? Number.secondsToString(this._animation.startDelay / 1000) : null;
        this._endDelayRow.value = this._animation.endDelay ? Number.secondsToString(this._animation.endDelay / 1000) : null;
        this._timingFunctionRow.value = this._animation.timingFunction ? this._animation.timingFunction.toString() : null;

        this._playbackDirectionRow.value = this._animation.playbackDirection ? WI.Animation.displayNameForPlaybackDirection(this._animation.playbackDirection) : null;
        this._fillModeRow.value = this._animation.fillMode ? WI.Animation.displayNameForFillMode(this._animation.fillMode) : null;

        let keyframeSections = [];
        for (let keyframe of this._animation.keyframes) {
            let rows = [];

            let keyframeSection = new WI.DetailsSection("animation-keyframe-offset-" + keyframe.offset, Number.percentageString(keyframe.offset, precision));
            keyframeSection.addEventListener(WI.DetailsSection.Event.CollapsedStateChanged, this._handleDetailsSectionCollapsedStateChanged, this);
            keyframeSections.push(keyframeSection);

            if (keyframe.easing) {
                let subtitle = keyframeSection.headerElement.appendChild(document.createElement("span"));
                subtitle.className = "subtitle";
                subtitle.textContent = ` ${emDash} ${keyframe.easing.toString()}`;
            }

            if (keyframe.style) {
                let codeMirrorElement = document.createElement("div");
                let codeMirror = WI.CodeMirrorEditor.create(codeMirrorElement, {
                    mode: "css",
                    readOnly: "nocursor",
                    lineWrapping: true,
                });
                codeMirror.setValue(keyframe.style);

                const range = null;
                function optionsForType(type) {
                    return {
                        allowedTokens: /\btag\b/,
                        callback(marker, valueObject, valueString) {
                            let swatch = new WI.InlineSwatch(type, valueObject, {readOnly: true});
                            codeMirror.setUniqueBookmark(marker.range.startPosition().toCodeMirror(), swatch.element);
                        }
                    };
                }
                createCodeMirrorColorTextMarkers(codeMirror, range, optionsForType(WI.InlineSwatch.Type.Color));
                createCodeMirrorGradientTextMarkers(codeMirror, range, optionsForType(WI.InlineSwatch.Type.Gradient));
                createCodeMirrorCubicBezierTimingFunctionTextMarkers(codeMirror, range, optionsForType(WI.InlineSwatch.Type.CubicBezierTimingFunction));
                createCodeMirrorLinearTimingFunctionTextMarkers(codeMirror, range, optionsForType(WI.InlineSwatch.Type.LinearTimingFunction));
                createCodeMirrorSpringTimingFunctionTextMarkers(codeMirror, range, optionsForType(WI.InlineSwatch.Type.SpringTimingFunction));
                createCodeMirrorStepsTimingFunctionTextMarkers(codeMirror, range, optionsForType(WI.InlineSwatch.Type.StepsTimingFunction));

                let row = new WI.DetailsSectionRow;
                row.element.classList.add("styles");
                row.element.appendChild(codeMirrorElement);
                rows.push(row);

                this._codeMirrorSectionMap.set(keyframeSection, codeMirror);
            }

            if (!rows.length) {
                let emptyRow = new WI.DetailsSectionRow(WI.UIString("No Styles"));
                emptyRow.showEmptyMessage();
                rows.push(emptyRow);
            }

            keyframeSection.groups = [new WI.DetailsSectionGroup(rows)];
        }
        if (!keyframeSections.length) {
            let emptyRow = new WI.DetailsSectionRow(WI.UIString("No Keyframes"));
            emptyRow.showEmptyMessage();
            keyframeSections.push(emptyRow);
        }
        this._keyframesGroup.rows = keyframeSections;
    }

    _refreshBacktraceSection()
    {
        let stackTrace = this._animation.stackTrace;
        this._backtraceTreeController.stackTrace = stackTrace;
        this._backtraceSection.element.hidden = !stackTrace?.callFrames.length;
    }

    _handleAnimationNameChanged(event)
    {
        this._refreshIdentitySection();
    }

    _handleAnimationEffectChanged(event)
    {
        this._refreshEffectSection();
    }

    _handleAnimationTargetChanged(event)
    {
        this._refreshIdentitySection();
    }

    _handleDetailsSectionCollapsedStateChanged(event)
    {
        let codeMirror = this._codeMirrorSectionMap.get(event.target);
        codeMirror.refresh();
    }
};
