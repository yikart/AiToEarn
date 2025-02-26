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

WI.ProfileDataGridNode = class ProfileDataGridNode extends WI.DataGridNode
{
    constructor(callingContextTreeNode, tree)
    {
        // FIXME: Make profile data grid nodes copyable.
        super(callingContextTreeNode, {copyable: false});

        this._node = callingContextTreeNode;
        this._tree = tree;

        this._childrenToChargeToSelf = new Set;
        this._extraSelfTimeFromChargedChildren = 0;

        this.addEventListener(WI.DataGridNode.Event.Populate, this._populate, this);

        this._updateChildrenForModifiers();
        this._recalculateData();
    }

    // Public

    get callingContextTreeNode() { return this._node; }

    displayName()
    {
        let title = this._node.name;
        if (!title)
            return WI.UIString("(anonymous function)");
        if (title === "(program)")
            return WI.UIString("(program)");
        return title;
    }

    iconClassName()
    {
        let script = WI.debuggerManager.scriptForIdentifier(this._node.sourceID, WI.assumingMainTarget());
        if (!script || !script.url)
            return "native-icon";
        if (this._node.name === "(program)")
            return "program-icon";
        return "function-icon";
    }

    // Protected

    get data()
    {
        return this._data;
    }

    createCellContent(columnIdentifier, cell)
    {
        switch (columnIdentifier) {
        case "totalTime":
            return this._totalTimeContent();
        case "selfTime":
            return Number.secondsToMillisecondsString(this._data.selfTime);
        case "function":
            return this._displayContent();
        }

        return super.createCellContent(columnIdentifier, cell);
    }

    sort()
    {
        let children = this.children;
        children.sort(this._tree._sortComparator);

        for (let i = 0; i < children.length; ++i) {
            children[i]._recalculateSiblings(i);
            children[i].sort();
        }
    }

    refresh()
    {
        this._updateChildrenForModifiers();
        this._recalculateData();

        super.refresh();
    }

    appendContextMenuItems(contextMenu)
    {
        let disableFocus = this === this._tree.currentFocusNode;
        contextMenu.appendItem(WI.UIString("Focus on Subtree"), () => {
            this._tree.addFocusNode(this);
        }, disableFocus);

        // FIXME: <https://webkit.org/b/155072> Web Inspector: Charge to Caller should work with Bottom Up Profile View
        let disableChargeToCaller = this._tree.callingContextTree.type === WI.CallingContextTree.Type.BottomUp;
        contextMenu.appendItem(WI.UIString("Charge \u201C%s\u201D to Callers").format(this.displayName()), () => {
            this._tree.addModifier({type: WI.ProfileDataGridTree.ModifierType.ChargeToCaller, source: this._node});
        }, disableChargeToCaller);

        contextMenu.appendSeparator();
    }

    // Protected

    filterableDataForColumn(columnIdentifier)
    {
        if (columnIdentifier === "function") {
            let filterableData = [this.displayName()];
            let script = WI.debuggerManager.scriptForIdentifier(this._node.sourceID, WI.assumingMainTarget());
            if (script && script.url && this._node.line >= 0 && this._node.column >= 0)
                filterableData.push(script.url);
            return filterableData;
        }

        return super.filterableDataForColumn(columnIdentifier);
    }

    // Private

    _updateChildrenForModifiers()
    {
        // NOTE: This currently assumes we either add modifiers or remove them all.
        // This doesn't handle removing a single modifier and re-inserting a single child.

        // FIXME: <https://webkit.org/b/155072> Web Inspector: Charge to Caller should work with Bottom Up Profile View
        let isBottomUp = this._tree.callingContextTree.type === WI.CallingContextTree.Type.BottomUp;
        if (!this._tree.hasModifiers() || isBottomUp) {
            // Add back child data grid nodes that were previously charged to us.
            if (!this.shouldRefreshChildren && this._childrenToChargeToSelf.size) {
                for (let child of this._childrenToChargeToSelf) {
                    console.assert(child.hasStackTraceInTimeRange(this._tree.startTime, this._tree.endTime));
                    this.appendChild(new WI.ProfileDataGridNode(child, this._tree));
                }

                this.sort();
            }

            this._extraSelfTimeFromChargedChildren = 0;
            this._childrenToChargeToSelf.clear();
            this.hasChildren = this._node.hasChildrenInTimeRange(this._tree.startTime, this._tree.endTime);
            return;
        }

        this._extraSelfTimeFromChargedChildren = 0;
        this._childrenToChargeToSelf.clear();

        let hasNonChargedChild = false;
        this._node.forEachChild((child) => {
            if (child.hasStackTraceInTimeRange(this._tree.startTime, this._tree.endTime)) {
                for (let {type, source} of this._tree.modifiers) {
                    if (type === WI.ProfileDataGridTree.ModifierType.ChargeToCaller) {
                        if (child.equals(source)) {
                            this._childrenToChargeToSelf.add(child);
                            this._extraSelfTimeFromChargedChildren += child.filteredTimestampsAndDuration(this._tree.startTime, this._tree.endTime).duration;
                            continue;
                        }
                    }
                    hasNonChargedChild = true;
                }
            }
        });

        this.hasChildren = hasNonChargedChild;

        // Remove child data grid nodes that have been charged to us.
        if (!this.shouldRefreshChildren && this._childrenToChargeToSelf.size) {
            for (let childDataGridNode of this.children) {
                if (this._childrenToChargeToSelf.has(childDataGridNode.callingContextTreeNode))
                    this.removeChild(childDataGridNode);
            }
        }
    }

    _recalculateData()
    {
        let {timestamps, duration} = this._node.filteredTimestampsAndDuration(this._tree.startTime, this._tree.endTime);
        let {leafTimestamps, leafDuration} = this._node.filteredLeafTimestampsAndDuration(this._tree.startTime, this._tree.endTime);

        let totalTime = duration;
        let selfTime = leafDuration + this._extraSelfTimeFromChargedChildren;
        let fraction = totalTime / this._tree.totalSampleTime;

        this._data = {totalTime, selfTime, fraction};
    }

    _totalTimeContent()
    {
        let {totalTime, fraction} = this._data;

        let fragment = document.createDocumentFragment();
        let timeElement = fragment.appendChild(document.createElement("span"));
        timeElement.classList.add("time");
        timeElement.textContent = Number.secondsToMillisecondsString(totalTime);
        let percentElement = fragment.appendChild(document.createElement("span"));
        percentElement.classList.add("percentage");
        percentElement.textContent = Number.percentageString(fraction);
        return fragment;
    }

    _displayContent()
    {
        let title = this.displayName();
        let iconClassName = this.iconClassName();

        let fragment = document.createDocumentFragment();
        let iconElement = fragment.appendChild(document.createElement("img"));
        iconElement.classList.add("icon", iconClassName);
        let titleElement = fragment.appendChild(document.createElement("span"));
        titleElement.textContent = title;

        let script = WI.debuggerManager.scriptForIdentifier(this._node.sourceID, WI.assumingMainTarget());
        if (script && script.url && this._node.line >= 0 && this._node.column >= 0) {
            // Convert from 1-based line and column to 0-based.
            let sourceCodeLocation = script.createSourceCodeLocation(this._node.line - 1, this._node.column - 1);

            let locationElement = fragment.appendChild(document.createElement("span"));
            locationElement.classList.add("location");
            sourceCodeLocation.populateLiveDisplayLocationString(locationElement, "textContent", WI.SourceCodeLocation.ColumnStyle.Hidden, WI.SourceCodeLocation.NameStyle.Short);

            const options = {
                dontFloat: true,
                useGoToArrowButton: true,
                ignoreNetworkTab: true,
                ignoreSearchTab: true,
            };
            fragment.appendChild(WI.createSourceCodeLocationLink(sourceCodeLocation, options));
        }

        return fragment;
    }

    _populate()
    {
        if (!this.shouldRefreshChildren)
            return;

        this.removeEventListener(WI.DataGridNode.Event.Populate, this._populate, this);

        this._node.forEachChild((child) => {
            if (!this._childrenToChargeToSelf.has(child)) {
                if (child.hasStackTraceInTimeRange(this._tree.startTime, this._tree.endTime))
                    this.appendChild(new WI.ProfileDataGridNode(child, this._tree));
            }
        });

        this.sort();
    }
};
