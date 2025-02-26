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

WI.RecordingStateDetailsSidebarPanel = class RecordingStateDetailsSidebarPanel extends WI.DetailsSidebarPanel
{
    constructor()
    {
        super("recording-state", WI.UIString("State"));

        this._recording = null;
        this._action = null;

        this._dataGrids = [];
    }

    // Public

    inspect(objects)
    {
        if (!(objects instanceof Array))
            objects = [objects];

        this.recording = objects.find((object) => object instanceof WI.Recording && object.isCanvas2D);
        this.action = objects.find((object) => object instanceof WI.RecordingAction);

        return this._recording && this._action;
    }

    set recording(recording)
    {
        if (recording === this._recording)
            return;

        this._recording = recording;
        this._action = null;

        for (let subview of this.contentView.subviews)
            this.contentView.removeSubview(subview);

        this._dataGrids = [];
    }

    set action(action)
    {
        console.assert(!action || action instanceof WI.RecordingAction);
        if (!this._recording || action === this._action)
            return;

        this._action = action;

        if (this._action && this._recording.isCanvas2D)
            this._generateDetailsCanvas2D(this._action);

        this.updateLayoutIfNeeded();
    }

    // Protected

    get scrollElement()
    {
        if (this._dataGrids.length === 1)
            return this._dataGrids[0].scrollContainer;
        return super.scrollElement;
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        if (this._dataGrids.length === 1)
            return;

        // FIXME: <https://webkit.org/b/152269> Web Inspector: Convert DetailsSection classes to use View
        for (let dataGrid of this._dataGrids)
            dataGrid.sizeDidChange();
    }

    // Private

    _generateDetailsCanvas2D(action)
    {
        if (this._dataGrids.length === 1)
            this.contentView.removeSubview(this._dataGrids[0]);

        this.contentView.element.removeChildren();

        this._dataGrids = [];

        let currentState = action.states.lastValue;
        console.assert(currentState);
        if (!currentState)
            return;

        let createStateDataGrid = (state) => {
            let dataGrid = new WI.DataGrid({
                name: {title: WI.UIString("Name")},
                value: {title: WI.UIString("Value")},
            });
            this._dataGrids.push(dataGrid);

            for (let [name, value] of state) {
                // Skip internal state used for path debugging.
                if (name === "setPath")
                    continue;

                if (typeof value === "object") {
                    let isGradient = value instanceof CanvasGradient;
                    let isPattern = value instanceof CanvasPattern;
                    if (isGradient || isPattern) {
                        let textElement = document.createElement("span");
                        textElement.classList.add("unavailable");

                        let image = null;
                        if (isGradient) {
                            textElement.textContent = WI.unlocalizedString("CanvasGradient");
                            image = WI.ImageUtilities.imageFromCanvasGradient(value, 100, 100);
                        } else if (isPattern) {
                            textElement.textContent = WI.unlocalizedString("CanvasPattern");
                            image = value.__image;
                        }

                        let fragment = document.createDocumentFragment();
                        if (image) {
                            let swatch = new WI.InlineSwatch(WI.InlineSwatch.Type.Image, image);
                            fragment.appendChild(swatch.element);
                        }
                        fragment.appendChild(textElement);
                        value = fragment;
                    } else {
                        if (value instanceof DOMMatrix)
                            value = [value.a, value.b, value.c, value.d, value.e, value.f];

                        value = JSON.stringify(value);
                    }
                } else if (name === "fillStyle" || name === "strokeStyle" || name === "shadowColor") {
                    let color = WI.Color.fromString(value);
                    let swatch = new WI.InlineSwatch(WI.InlineSwatch.Type.Color, color, {readOnly: true});
                    value = document.createElement("span");
                    value.append(swatch.element, color.toString());
                }

                let classNames = [];
                if (state === currentState && !action.isGetter && action.stateModifiers.has(name))
                    classNames.push("modified");
                if (name.startsWith("webkit"))
                    classNames.push("non-standard");

                dataGrid.appendChild(new WI.DataGridNode({name, value}, {classNames}));
            }

            dataGrid.updateLayoutIfNeeded();
            return dataGrid;
        };

        let createStateSection = (state, index = NaN) => {
            let isCurrentState = isNaN(index);

            let dataGrid = createStateDataGrid(state);
            let row = new WI.DetailsSectionDataGridRow(dataGrid);
            let group = new WI.DetailsSectionGroup([row]);

            let identifier = isCurrentState ? "recording-current-state" : `recording-saved-state-${index + 1}`;
            const title = null;
            const optionsElement = null;
            let defaultCollapsedSettingValue = !isCurrentState;
            let section = new WI.DetailsSection(identifier, title, [group], optionsElement, defaultCollapsedSettingValue);

            if (isCurrentState)
                section.title = WI.UIString("Current State");
            else {
                section.title = WI.UIString("Save %d").format(index + 1);

                if (state.source) {
                    let sourceIndex = this._recording.actions.indexOf(state.source);
                    if (sourceIndex >= 0) {
                        let sourceElement = section.titleElement.appendChild(document.createElement("span"));
                        sourceElement.classList.add("source");
                        sourceElement.textContent = WI.UIString("(Action %s)").format(sourceIndex);
                    }
                }
            }

            return section;
        };

        if (action.states.length === 1) {
            this.contentView.addSubview(createStateDataGrid(currentState));
            return;
        }

        let currentStateSection = createStateSection(currentState);
        this.contentView.element.appendChild(currentStateSection.element);

        let savedStateSections = [];
        for (let i = action.states.length - 2; i >= 0; --i) {
            let savedStateSection = createStateSection(action.states[i], i);
            savedStateSections.push(savedStateSection);
        }

        let savedStatesGroup = new WI.DetailsSectionGroup(savedStateSections);
        let savedStatesSection = new WI.DetailsSection("recording-saved-states", WI.UIString("Saved States"), [savedStatesGroup]);
        this.contentView.element.appendChild(savedStatesSection.element);
    }
};
