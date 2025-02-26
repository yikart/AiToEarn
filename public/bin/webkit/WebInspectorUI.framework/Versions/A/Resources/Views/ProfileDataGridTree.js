/*
* Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.ProfileDataGridTree = class ProfileDataGridTree extends WI.Object
{
    constructor(callingContextTree, startTime, endTime, sortComparator)
    {
        super();

        console.assert(callingContextTree instanceof WI.CallingContextTree);
        console.assert(typeof sortComparator === "function");

        this._children = [];
        this._sortComparator = sortComparator;

        this._callingContextTree = callingContextTree;
        this._startTime = startTime;
        this._endTime = endTime;
        this._totalSampleTime = this._callingContextTree.totalDurationInTimeRange(startTime, endTime);

        this._focusNodes = [];
        this._modifiers = [];

        this._repopulate();
    }

    // Static

    static buildSortComparator(columnIdentifier, sortOrder)
    {
        let ascending = sortOrder === WI.DataGrid.SortOrder.Ascending;
        return function(a, b) {
            let result = a.data[columnIdentifier] - b.data[columnIdentifier];
            return ascending ? result : -result;
        };
    }

    // Public

    get callingContextTree() { return this._callingContextTree; }

    get focusNodes()
    {
        return this._focusNodes;
    }

    get currentFocusNode()
    {
        return this._focusNodes.lastValue;
    }

    get modifiers()
    {
        return this._modifiers;
    }

    get startTime()
    {
        if (this._focusNodes.length)
            return this._currentFocusStartTime;
        return this._startTime;
    }

    get endTime()
    {
        if (this._focusNodes.length)
            return this._currentFocusEndTime;
        return this._endTime;
    }

    get totalSampleTime()
    {
        if (this._focusNodes.length)
            return this._currentFocusTotalSampleTime;
        return this._totalSampleTime;
    }

    get children()
    {
        return this._children;
    }

    appendChild(node)
    {
        this._children.push(node);
    }

    insertChild(node, index)
    {
        this._children.splice(index, 0, node);
    }

    removeChildren()
    {
        this._children = [];
    }

    set sortComparator(comparator)
    {
        this._sortComparator = comparator;
        this.sort();
    }

    sort()
    {
        let children = this._children;
        children.sort(this._sortComparator);

        for (let i = 0; i < children.length; ++i) {
            children[i]._recalculateSiblings(i);
            children[i].sort();
        }
    }

    refresh()
    {
        for (let child of this._children)
            child.refreshRecursively();
    }

    addFocusNode(profileDataGridNode)
    {
        console.assert(profileDataGridNode instanceof WI.ProfileDataGridNode);

        // Save the original parent for when we rollback.
        this._saveFocusedNodeOriginalParent(profileDataGridNode);

        this._focusNodes.push(profileDataGridNode);
        this._focusChanged();
    }

    rollbackFocusNode(profileDataGridNode)
    {
        console.assert(profileDataGridNode instanceof WI.ProfileDataGridNode);

        let index = this._focusNodes.indexOf(profileDataGridNode);
        console.assert(index !== -1, "rollbackFocusNode should be rolling back to a previous focused node");
        console.assert(index !== this._focusNodes.length - 1, "rollbackFocusNode should be rolling back to a previous focused node");
        if (index === -1)
            return;

        this._focusParentsToExpand = [];

        for (let i = index + 1; i < this._focusNodes.length; ++i)
            this._restoreFocusedNodeToOriginalParent(this._focusNodes[i]);

        // Remove everything after this node.
        this._focusNodes.splice(index + 1);
        this._focusChanged();
    }

    clearFocusNodes()
    {
        this._focusParentsToExpand = [];

        for (let profileDataGridNode of this._focusNodes)
            this._restoreFocusedNodeToOriginalParent(profileDataGridNode);

        this._focusNodes = [];
        this._focusChanged();
    }

    hasModifiers()
    {
        return this._modifiers.length > 0;
    }

    addModifier(modifier)
    {
        this._modifiers.push(modifier);
        this._modifiersChanged();
    }

    clearModifiers()
    {
        this._modifiers = [];
        this._modifiersChanged();
    }

    // Private

    _repopulate()
    {
        this.removeChildren();

        if (this._focusNodes.length) {
            // The most recently focused node.
            this.appendChild(this.currentFocusNode);
        } else {
            // All nodes in the time range in the calling context tree.
            this._callingContextTree.forEachChild((child) => {
                if (child.hasStackTraceInTimeRange(this._startTime, this._endTime))
                    this.appendChild(new WI.ProfileDataGridNode(child, this));
            });
        }

        this.sort();
    }

    _focusChanged()
    {
        let profileDataGridNode = this.currentFocusNode;
        if (profileDataGridNode)
            this._updateCurrentFocusDetails(profileDataGridNode);

        // FIXME: This re-creates top level children, without remembering their expanded / unexpanded state.
        this._repopulate();

        this.dispatchEventToListeners(WI.ProfileDataGridTree.Event.FocusChanged);

        if (this._focusParentsToExpand) {
            for (let profileDataGridNode of this._focusParentsToExpand)
                profileDataGridNode.expand();
            this._focusParentsToExpand = null;
        }
    }

    _updateCurrentFocusDetails(focusDataGridNode)
    {
        let {timestamps, duration} = focusDataGridNode.callingContextTreeNode.filteredTimestampsAndDuration(this._startTime, this._endTime);

        this._currentFocusStartTime = timestamps[0];
        this._currentFocusEndTime = timestamps.lastValue;
        this._currentFocusTotalSampleTime = duration;
    }

    _saveFocusedNodeOriginalParent(focusDataGridNode)
    {
        focusDataGridNode.__previousParent = focusDataGridNode.parent;
        focusDataGridNode.__previousParent.removeChild(focusDataGridNode);
    }

    _restoreFocusedNodeToOriginalParent(focusDataGridNode)
    {
        // NOTE: A DataGridTree maintains a list of children but those
        // children get adopted by the DataGrid in ProfileView and
        // actually displayed. When we focused this DataGridNode, its
        // parent was removed from the real DataGrid, but if it was not
        // at the top level it was not detached. When we re-append
        // ourselves onto the previous parent, if it still thinks it is
        // attached and expanded it will attach us immediately, which
        // can create an orphaned <tr> in the DataGrid that is not one
        // of the DataGrid's immediate children.
        //
        // Workaround this by:
        //   - collapsing our parent to prevent attaching when we get added.
        //   - reparent to our previous parent.
        //   - expanding our parent after the DataGrid has had a chance to update.
        focusDataGridNode.__previousParent.collapse();
        this._focusParentsToExpand.push(focusDataGridNode.__previousParent);

        focusDataGridNode.__previousParent.appendChild(focusDataGridNode);
        focusDataGridNode.__previousParent = undefined;
    }

    _modifiersChanged()
    {
        this.dispatchEventToListeners(WI.ProfileDataGridTree.Event.ModifiersChanged);
    }
};

WI.ProfileDataGridTree.Event = {
    FocusChanged: "profile-data-grid-tree-focus-changed",
    ModifiersChanged: "profile-data-grid-tree-modifiers-changed",
};

WI.ProfileDataGridTree.ModifierType = {
    ChargeToCaller: "charge",
};
