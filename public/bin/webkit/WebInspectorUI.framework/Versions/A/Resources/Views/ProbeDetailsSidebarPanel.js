/*
 * Copyright (C) 2014-2015 Apple Inc. All rights reserved.
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

WI.ProbeDetailsSidebarPanel = class ProbeDetailsSidebarPanel extends WI.DetailsSidebarPanel
{
    constructor()
    {
        super("probe", WI.UIString("Probes"));

        this._probeSetSections = new Map;
        this._inspectedProbeSets = [];
    }

    // Public

    get inspectedProbeSets()
    {
        return this._inspectedProbeSets.slice();
    }

    set inspectedProbeSets(newProbeSets)
    {
        for (let probeSet of this._inspectedProbeSets) {
            let removedSection = this._probeSetSections.get(probeSet);
            if (removedSection)
                removedSection.element.remove();
        }

        this._inspectedProbeSets = newProbeSets;

        for (let probeSet of newProbeSets) {
            let shownSection = this._probeSetSections.get(probeSet);
            if (shownSection)
                this.contentView.element.appendChild(shownSection.element);
        }
    }

    inspect(objects)
    {
        if (!(objects instanceof Array))
            objects = [objects];

        var inspectedProbeSets = objects.filter(function(object) {
            return object instanceof WI.ProbeSet;
        });

        inspectedProbeSets.sort(function sortBySourceLocation(aProbeSet, bProbeSet) {
            if (!(aProbeSet instanceof WI.JavaScriptBreakpoint))
                return 1;
            if (!(bProbeSet instanceof WI.JavaScriptBreakpoint))
                return -1;

            var aLocation = aProbeSet.breakpoint.sourceCodeLocation;
            var bLocation = bProbeSet.breakpoint.sourceCodeLocation;
            var comparisonResult = aLocation.sourceCode.displayName.extendedLocaleCompare(bLocation.sourceCode.displayName);
            if (comparisonResult !== 0)
                return comparisonResult;

            comparisonResult = aLocation.displayLineNumber - bLocation.displayLineNumber;
            if (comparisonResult !== 0)
                return comparisonResult;

            return aLocation.displayColumnNumber - bLocation.displayColumnNumber;
        });

        this.inspectedProbeSets = inspectedProbeSets;

        return !!this._inspectedProbeSets.length;
    }

    closed()
    {
        if (this.didInitialLayout) {
            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ProbeSetAdded, this._probeSetAdded, this);
            WI.debuggerManager.removeEventListener(WI.DebuggerManager.Event.ProbeSetRemoved, this._probeSetRemoved, this);
        }

        super.closed();
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ProbeSetAdded, this._probeSetAdded, this);
        WI.debuggerManager.addEventListener(WI.DebuggerManager.Event.ProbeSetRemoved, this._probeSetRemoved, this);

        for (let probeSet of new Set([...this._inspectedProbeSets, ...WI.debuggerManager.probeSets]))
            this._probeSetAdded(probeSet);

        this.inspectedProbeSets = this._inspectedProbeSets;
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        // FIXME: <https://webkit.org/b/152269> Web Inspector: Convert DetailsSection classes to use View
        for (let detailsSection of this._probeSetSections.values())
            detailsSection.sizeDidChange();
    }

    // Private

    _probeSetAdded(probeSetOrEvent)
    {
        var probeSet;
        if (probeSetOrEvent instanceof WI.ProbeSet)
            probeSet = probeSetOrEvent;
        else
            probeSet = probeSetOrEvent.data.probeSet;
        console.assert(!this._probeSetSections.has(probeSet), "New probe group ", probeSet, " already has its own sidebar.");

        var newSection = new WI.ProbeSetDetailsSection(probeSet);
        this._probeSetSections.set(probeSet, newSection);
    }


    _probeSetRemoved(event)
    {
        var probeSet = event.data.probeSet;
        console.assert(this._probeSetSections.has(probeSet), "Removed probe group ", probeSet, " doesn't have a sidebar.");

        // First remove probe set from inspected list, then from mapping.
        var inspectedProbeSets = this.inspectedProbeSets;
        var index = inspectedProbeSets.indexOf(probeSet);
        if (index !== -1) {
            inspectedProbeSets.splice(index, 1);
            this.inspectedProbeSets = inspectedProbeSets;
        }
        var removedSection = this._probeSetSections.get(probeSet);
        this._probeSetSections.delete(probeSet);
        removedSection.closed();
    }
};
