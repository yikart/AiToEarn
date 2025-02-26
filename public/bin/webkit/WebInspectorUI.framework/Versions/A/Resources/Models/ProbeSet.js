/*
 * Copyright (C) 2013 University of Washington. All rights reserved.
 * Copyright (C) 2014 Apple Inc. All rights reserved.
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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS
 * IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED
 * TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A
 * PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

// A ProbeSet clusters Probes from the same Breakpoint and their samples.

WI.ProbeSet = class ProbeSet extends WI.Object
{
    constructor(breakpoint)
    {
        super();

        console.assert(breakpoint instanceof WI.Breakpoint, "Unknown breakpoint argument: ", breakpoint);

        this._breakpoint = breakpoint;
        this._probes = [];
        this._probesByIdentifier = new Map;

        this._createDataTable();

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceChanged, this);
        WI.Probe.addEventListener(WI.Probe.Event.SampleAdded, this._sampleCollected, this);
    }

    // Public

    get breakpoint() { return this._breakpoint; }
    get probes() { return this._probes.slice(); }
    get dataTable() { return this._dataTable; }

    clear()
    {
        this._breakpoint.clearActions(WI.BreakpointAction.Type.Probe);
    }

    clearSamples()
    {
        for (var probe of this._probes)
            probe.clearSamples();

        var oldTable = this._dataTable;
        this._createDataTable();
        this.dispatchEventToListeners(WI.ProbeSet.Event.SamplesCleared, {oldTable});
    }

    createProbe(expression)
    {
        this._breakpoint.addAction(new WI.BreakpointAction(WI.BreakpointAction.Type.Probe, {data: expression}));
    }

    addProbe(probe)
    {
        console.assert(probe instanceof WI.Probe, "Tried to add non-probe ", probe, " to probe group", this);
        console.assert(probe.breakpoint === this.breakpoint, "Probe and ProbeSet must have same breakpoint.", probe, this);

        this._probes.push(probe);
        this._probesByIdentifier.set(probe.id, probe);

        this.dataTable.addProbe(probe);
        this.dispatchEventToListeners(WI.ProbeSet.Event.ProbeAdded, probe);
    }

    removeProbe(probe)
    {
        console.assert(probe instanceof WI.Probe, "Tried to remove non-probe ", probe, " to probe group", this);
        console.assert(this._probes.indexOf(probe) !== -1, "Tried to remove probe", probe, " not in group ", this);
        console.assert(this._probesByIdentifier.has(probe.id), "Tried to remove probe", probe, " not in group ", this);

        this._probes.splice(this._probes.indexOf(probe), 1);
        this._probesByIdentifier.delete(probe.id);
        this.dataTable.removeProbe(probe);
        this.dispatchEventToListeners(WI.ProbeSet.Event.ProbeRemoved, probe);
    }

    willRemove()
    {
        console.assert(!this._probes.length, "ProbeSet.willRemove called, but probes still associated with group: ", this._probes);

        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceChanged, this);
        WI.Probe.removeEventListener(WI.Probe.Event.SampleAdded, this._sampleCollected, this);
    }

    // Private

    _mainResourceChanged()
    {
        this.dataTable.mainResourceChanged();
    }

    _createDataTable()
    {
        if (this.dataTable)
            this.dataTable.willRemove();

        this._dataTable = new WI.ProbeSetDataTable(this);
    }

    _sampleCollected(event)
    {
        var sample = event.data;
        console.assert(sample instanceof WI.ProbeSample, "Tried to add non-sample to probe group: ", sample);

        var probe = event.target;
        if (!this._probesByIdentifier.has(probe.id))
            return;

        console.assert(this.dataTable);
        this.dataTable.addSampleForProbe(probe, sample);
        this.dispatchEventToListeners(WI.ProbeSet.Event.SampleAdded, {probe, sample});
    }
};

WI.ProbeSet.Event = {
    ProbeAdded: "probe-set-probe-added",
    ProbeRemoved: "probe-set-probe-removed",
    SampleAdded: "probe-set-sample-added",
    SamplesCleared: "probe-set-samples-cleared",
};
