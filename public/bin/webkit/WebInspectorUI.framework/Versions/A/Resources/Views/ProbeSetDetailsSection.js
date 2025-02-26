/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
 * Copyright (C) 2013 University of Washington. All rights reserved.
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

WI.ProbeSetDetailsSection = class ProbeSetDetailsSection extends WI.DetailsSection
{
    constructor(probeSet)
    {
        console.assert(probeSet instanceof WI.ProbeSet, "Invalid ProbeSet argument:", probeSet);

        let title = probeSet.breakpoint.displayName;

        var optionsElement = document.createElement("div");
        var dataGrid = new WI.ProbeSetDataGrid(probeSet);

        var singletonRow = new WI.DetailsSectionRow;
        singletonRow.element.appendChild(dataGrid.element);

        var probeSectionGroup = new WI.DetailsSectionGroup([singletonRow]);

        super("probe", title, [probeSectionGroup], optionsElement);

        this.element.classList.add("probe-set");

        this._probeSet = probeSet;
        this._dataGrid = dataGrid;

        this._navigationBar = new WI.NavigationBar;
        this._optionsElement.appendChild(this._navigationBar.element);

        this._addProbeButtonItem = new WI.ButtonNavigationItem("add-probe", WI.UIString("Add probe expression"), "Images/Plus13.svg", 13, 13);
        this._addProbeButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._addProbeButtonClicked, this);
        this._navigationBar.addNavigationItem(this._addProbeButtonItem);

        this._clearSamplesButtonItem = new WI.ButtonNavigationItem("clear-samples", WI.UIString("Clear samples"), "Images/NavigationItemTrash.svg", 15, 15);
        this._clearSamplesButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._clearSamplesButtonClicked, this);
        this._clearSamplesButtonItem.enabled = this._probeSetHasSamples();
        this._navigationBar.addNavigationItem(this._clearSamplesButtonItem);

        this._removeProbeButtonItem = new WI.ButtonNavigationItem("remove-probe", WI.UIString("Delete probe"), "Images/CloseLarge.svg", 12, 12);
        this._removeProbeButtonItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._removeProbeButtonClicked, this);
        this._navigationBar.addNavigationItem(this._removeProbeButtonItem);

        this._probeSet.addEventListener(WI.ProbeSet.Event.SampleAdded, this._probeSetSamplesChanged, this);
        this._probeSet.addEventListener(WI.ProbeSet.Event.SamplesCleared, this._probeSetSamplesChanged, this);

        if (this._probeSet.breakpoint instanceof WI.JavaScriptBreakpoint) {
            // Update the source link when the breakpoint's resolved state changes,
            // so that it can become a live location link when possible.
            this._updateLinkElement();
            this._probeSet.breakpoint.addEventListener(WI.JavaScriptBreakpoint.Event.ResolvedStateDidChange, this._updateLinkElement, this);
        }

    }

    // Public

    closed()
    {
        this._probeSet.removeEventListener(WI.ProbeSet.Event.SampleAdded, this._probeSetSamplesChanged, this);
        this._probeSet.removeEventListener(WI.ProbeSet.Event.SamplesCleared, this._probeSetSamplesChanged, this);

        if (this._probeSet.breakpoint instanceof WI.JavaScriptBreakpoint)
            this._probeSet.breakpoint.removeEventListener(WI.JavaScriptBreakpoint.Event.ResolvedStateDidChange, this._updateLinkElement, this);

        this.element.remove();
    }

    // Protected

    sizeDidChange()
    {
        // FIXME: <https://webkit.org/b/152269> Web Inspector: Convert DetailsSection classes to use View
        this._dataGrid.sizeDidChange();
    }

    // Private

    _updateLinkElement()
    {
        const options = {
            ignoreNetworkTab: true,
            ignoreSearchTab: true,
        };

        var breakpoint = this._probeSet.breakpoint;
        if (breakpoint.sourceCodeLocation.sourceCode)
            this.titleElement = WI.createSourceCodeLocationLink(breakpoint.sourceCodeLocation, options);
        else {
            // Fallback for when we can't create a live source link.
            console.assert(!breakpoint.resolved);

            this.titleElement = WI.linkifyLocation(breakpoint.contentIdentifier, breakpoint.sourceCodeLocation.position, options);
        }

        this.titleElement.classList.add(WI.ProbeSetDetailsSection.DontFloatLinkStyleClassName);
    }

    _addProbeButtonClicked(event)
    {
        function createProbeFromEnteredExpression(visiblePopover, event)
        {
            if (event.keyCode !== 13)
                return;
            let expression = event.target.value;
            this._probeSet.createProbe(expression);
            visiblePopover.dismiss();
        }

        let popover = new WI.Popover;
        let content = document.createElement("div");
        content.classList.add(WI.ProbeSetDetailsSection.ProbePopoverElementStyleClassName);
        content.createChild("div").textContent = WI.UIString("Add New Probe Expression");
        let textBox = content.createChild("input");
        textBox.addEventListener("keypress", createProbeFromEnteredExpression.bind(this, popover));
        textBox.addEventListener("click", function (event) { event.target.select(); });
        textBox.spellcheck = false;
        textBox.placeholder = WI.UIString("Expression");
        popover.content = content;
        let target = WI.Rect.rectFromClientRect(event.target.element.getBoundingClientRect());
        popover.present(target, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
        popover.windowResizeHandler = () => {
            let target = WI.Rect.rectFromClientRect(event.target.element.getBoundingClientRect());
            popover.present(target, [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
        };
        textBox.select();
    }

    _clearSamplesButtonClicked(event)
    {
        this._probeSet.clearSamples();
    }

    _removeProbeButtonClicked(event)
    {
        this._probeSet.clear();
    }

    _probeSetSamplesChanged(event)
    {
        this._clearSamplesButtonItem.enabled = this._probeSetHasSamples();
    }

    _probeSetHasSamples()
    {
        return this._probeSet.probes.some((probe) => probe.samples.length);
    }
};

WI.ProbeSetDetailsSection.DontFloatLinkStyleClassName = "dont-float";
WI.ProbeSetDetailsSection.ProbePopoverElementStyleClassName = "probe-popover";
