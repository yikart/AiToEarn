/*
 * Copyright (C) 2013-2015 Apple Inc. All rights reserved.
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

WI.BreakpointTreeElement = class BreakpointTreeElement extends WI.GeneralTreeElement
{
    constructor(breakpoint, {classNames, title, subtitle} = {})
    {
        console.assert(breakpoint instanceof WI.Breakpoint);

        if (!Array.isArray(classNames))
            classNames = [];
        classNames.push("breakpoint");

        super(classNames, title, subtitle, breakpoint);

        // This class should not be instantiated directly. Create a concrete subclass instead.
        console.assert(this.constructor !== WI.BreakpointTreeElement && this instanceof WI.BreakpointTreeElement);

        this._breakpoint = breakpoint;
        this._probeSet = null;

        this.status = WI.ImageUtilities.useSVGSymbol("Images/Breakpoint.svg");
        this.status.className = "status-image";
        this.status.addEventListener("mousedown", this._statusImageElementMouseDown.bind(this));
        this.status.addEventListener("click", this._statusImageElementClicked.bind(this));
        this.status.addEventListener("dblclick", this._handleStatusImageElementDoubleClicked.bind(this));

        this.updateStatus();

        this._iconAnimationLayerElement = document.createElement("span");
        this.iconElement.appendChild(this._iconAnimationLayerElement);
        this.tooltipHandledSeparately = true;
    }

    // Public

    get breakpoint()
    {
        return this._breakpoint;
    }

    ondelete()
    {
        // We set this flag so that TreeOutlines that will remove this
        // BreakpointTreeElement will know whether it was deleted from
        // within the TreeOutline or from outside it (e.g. TextEditor).
        this.__deletedViaDeleteKeyboardShortcut = true;

        if (this._breakpoint.removable) {
            this._breakpoint.remove();
            return true;
        }

        if (this._breakpoint.disabled)
            InspectorFrontendHost.beep();
        else {
            this._breakpoint.disabled = true;
            this._breakpoint.reset();
        }
        return false;
    }

    onenter()
    {
        this._breakpoint.disabled = !this._breakpoint.disabled;
        return true;
    }

    onspace()
    {
        this._breakpoint.disabled = !this._breakpoint.disabled;
        return true;
    }

    onattach()
    {
        super.onattach();

        this._breakpoint.addEventListener(WI.Breakpoint.Event.DisabledStateDidChange, this.updateStatus, this);
        this._breakpoint.addEventListener(WI.Breakpoint.Event.AutoContinueDidChange, this.updateStatus, this);

        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.BreakpointsEnabledDidChange, this.updateStatus, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ProbeSetAdded, this._probeSetAdded, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ProbeSetRemoved, this._probeSetRemoved, this);

        for (var probeSet of WI.debuggerManager.probeSets)
            if (probeSet.breakpoint === this._breakpoint)
                this._addProbeSet(probeSet);
    }

    ondetach()
    {
        super.ondetach();

        this._breakpoint.removeEventListener(WI.Breakpoint.Event.DisabledStateDidChange, this.updateStatus, this);
        this._breakpoint.removeEventListener(WI.Breakpoint.Event.AutoContinueDidChange, this.updateStatus, this);

        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.BreakpointsEnabledDidChange, this.updateStatus, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ProbeSetAdded, this._probeSetAdded, this);
        WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ProbeSetRemoved, this._probeSetRemoved, this);

        if (this._probeSet)
            this._removeProbeSet(this._probeSet);
    }

    populateContextMenu(contextMenu, event)
    {
        WI.BreakpointPopover.appendContextMenuItems(contextMenu, this._breakpoint, this.status);

        super.populateContextMenu(contextMenu, event);
    }

    // Protected

    updateStatus()
    {
        if (!this.status)
            return;

        this.status.classList.toggle("resolved", this._breakpoint.resolved);
        this.status.classList.toggle("disabled", this._breakpoint.disabled);
        if (this._breakpoint.editable)
            this.status.classList.toggle("auto-continue", this._breakpoint.autoContinue);
    }

    // Private

    _addProbeSet(probeSet)
    {
        console.assert(probeSet instanceof WI.ProbeSet);
        console.assert(probeSet.breakpoint === this._breakpoint);
        console.assert(probeSet !== this._probeSet);

        this._probeSet = probeSet;
        probeSet.addEventListener(WI.ProbeSet.Event.SamplesCleared, this._samplesCleared, this);
        probeSet.dataTable.addEventListener(WI.ProbeSetDataTable.Event.FrameInserted, this._dataUpdated, this);
    }

    _removeProbeSet(probeSet)
    {
        console.assert(probeSet instanceof WI.ProbeSet);
        console.assert(probeSet === this._probeSet);

        probeSet.removeEventListener(WI.ProbeSet.Event.SamplesCleared, this._samplesCleared, this);
        probeSet.dataTable.removeEventListener(WI.ProbeSetDataTable.Event.FrameInserted, this._dataUpdated, this);
        this._probeSet = null;
    }

    _probeSetAdded(event)
    {
        var probeSet = event.data.probeSet;
        if (probeSet.breakpoint === this._breakpoint)
            this._addProbeSet(probeSet);
    }

    _probeSetRemoved(event)
    {
        var probeSet = event.data.probeSet;
        if (probeSet.breakpoint === this._breakpoint)
            this._removeProbeSet(probeSet);
    }

    _samplesCleared(event)
    {
        console.assert(this._probeSet);

        var oldTable = event.data.oldTable;
        oldTable.removeEventListener(WI.ProbeSetDataTable.Event.FrameInserted, this._dataUpdated, this);
        this._probeSet.dataTable.addEventListener(WI.ProbeSetDataTable.Event.FrameInserted, this._dataUpdated, this);
    }

    _dataUpdated()
    {
        if (this.element.classList.contains("data-updated")) {
            clearTimeout(this._removeIconAnimationTimeoutIdentifier);
            this.element.classList.remove("data-updated");
            // We want to restart the animation, which can only be done by removing the class,
            // performing layout, and re-adding the class. Try adding class back on next run loop.
            window.requestAnimationFrame(this._dataUpdated.bind(this));
            return;
        }

        this.element.classList.add("data-updated");
        this._removeIconAnimationTimeoutIdentifier = setTimeout(() => {
            this.element.classList.remove("data-updated");
        }, WI.BreakpointTreeElement.ProbeDataUpdatedAnimationDuration);
    }

    _statusImageElementMouseDown(event)
    {
        // To prevent the tree element from selecting.
        event.stopPropagation();
    }

    _statusImageElementClicked(event)
    {
        this._breakpoint.disabled = !this._breakpoint.disabled;
    }

    _handleStatusImageElementDoubleClicked(event)
    {
        WI.BreakpointPopover.show(this._breakpoint, this.status);
    }
};

WI.BreakpointTreeElement.ProbeDataUpdatedAnimationDuration = 400; // milliseconds
