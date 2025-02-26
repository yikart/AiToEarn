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

WI.HeapSnapshotDataGridTree = class HeapSnapshotDataGridTree extends WI.Object
{
    constructor(heapSnapshot, sortComparator)
    {
        super();

        console.assert(heapSnapshot instanceof WI.HeapSnapshotProxy || heapSnapshot instanceof WI.HeapSnapshotDiffProxy);

        this._heapSnapshot = heapSnapshot;
        this._heapSnapshot.addEventListener(WI.HeapSnapshotProxy.Event.CollectedNodes, this._heapSnapshotCollectedNodes, this);

        this._children = [];
        this._sortComparator = sortComparator;

        this._visible = false;
        this._popover = null;
        this._popoverGridNode = null;
        this._popoverTargetElement = null;

        this.populateTopLevel();
    }

    // Static

    static buildSortComparator(columnIdentifier, sortOrder)
    {
        let multiplier = sortOrder === WI.DataGrid.SortOrder.Ascending ? 1 : -1;
        let numberCompare = (columnIdentifier, a, b) => multiplier * (a.data[columnIdentifier] - b.data[columnIdentifier]);
        let nameCompare = (a, b) => {
            // Sort by property name if available. Property names before no property name.
            if (a.propertyName || b.propertyName) {
                if (a.propertyName && !b.propertyName)
                    return multiplier * -1;
                if (!a.propertyName && b.propertyName)
                    return multiplier * 1;
                let propertyNameCompare = a.propertyName.extendedLocaleCompare(b.propertyName);
                console.assert(propertyNameCompare !== 0, "Property names should be unique, we shouldn't have equal property names.");
                return multiplier * propertyNameCompare;
            }

            // Sort by class name and object id if no property name.
            let classNameCompare = a.data.className.extendedLocaleCompare(b.data.className);
            if (classNameCompare)
                return multiplier * classNameCompare;
            if (a.data.id || b.data.id)
                return multiplier * (a.data.id - b.data.id);
            return 0;
        };

        switch (columnIdentifier) {
        case "retainedSize":
            return numberCompare.bind(this, "retainedSize");
        case "size":
            return numberCompare.bind(this, "size");
        case "count":
            return numberCompare.bind(this, "count");
        case "className":
            return nameCompare;
        }
    }

    // Public

    get heapSnapshot() { return this._heapSnapshot; }

    get visible() { return this._visible; }
    get popoverGridNode() { return this._popoverGridNode; }
    set popoverGridNode(x) { this._popoverGridNode = x; }
    get popoverTargetElement() { return this._popoverTargetElement; }
    set popoverTargetElement(x) { this._popoverTargetElement = x; }

    get popover()
    {
        if (!this._popover) {
            this._popover = new WI.Popover(this);
            this._popover.windowResizeHandler = () => {
                let bounds = WI.Rect.rectFromClientRect(this._popoverTargetElement.getBoundingClientRect());
                this._popover.present(bounds.pad(2), [WI.RectEdge.MAX_Y, WI.RectEdge.MIN_Y, WI.RectEdge.MAX_X]);
            };
        }

        return this._popover;
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

    removeChild(node)
    {
        this._children.remove(node, true);
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

    shown()
    {
        this._visible = true;
    }

    hidden()
    {
        this._visible = false;

        if (this._popover && this._popover.visible)
            this._popover.dismiss();
    }

    // Popover delegate

    willDismissPopover(popover)
    {
        this._popoverGridNode = null;
        this._popoverTargetElement = null;
    }

    // Protected

    get alwaysShowRetainedSize()
    {
        return false;
    }

    populateTopLevel()
    {
        // Implemented by subclasses.
    }

    removeCollectedNodes(collectedNodes)
    {
        // Implemented by subclasses.
    }

    didPopulate()
    {
        this.sort();

        this.dispatchEventToListeners(WI.HeapSnapshotDataGridTree.Event.DidPopulate);
    }

    // Private

    _heapSnapshotCollectedNodes(event)
    {
        this.removeCollectedNodes(event.data.collectedNodes);
    }
};

WI.HeapSnapshotDataGridTree.Event = {
    DidPopulate: "heap-snapshot-data-grid-tree-did-populate",
};

WI.HeapSnapshotInstancesDataGridTree = class HeapSnapshotInstancesDataGridTree extends WI.HeapSnapshotDataGridTree
{
    get alwaysShowRetainedSize()
    {
        return false;
    }

    populateTopLevel()
    {
        // Populate the first level with the different classes.
        let skipInternalOnlyObjects = !WI.settings.engineeringShowInternalObjectsInHeapSnapshot.value;

        for (let [className, {size, retainedSize, count, internalCount, deadCount, objectCount}] of this.heapSnapshot.categories) {
            console.assert(count > 0);

            // Possibly skip internal only classes.
            if (skipInternalOnlyObjects && count === internalCount)
                continue;

            // FIXME: <https://webkit.org/b/157905> Web Inspector: Provide a way to toggle between showing only live objects and live+dead objects
            let liveCount = count - deadCount;
            if (!liveCount)
                continue;

            // If over half of the objects with this class name are Object sub-types, treat this as an Object category.
            // This can happen if the page has a JavaScript Class with the same name as a native class.
            let isObjectSubcategory = (objectCount / count) > 0.5;

            this.appendChild(new WI.HeapSnapshotClassDataGridNode({className, size, retainedSize, isObjectSubcategory, count: liveCount}, this));
        }

        this.didPopulate();
    }

    removeCollectedNodes(collectedNodes)
    {
        for (let classDataGridNode of this.children) {
            let {count, deadCount} = this.heapSnapshot.categories.get(classDataGridNode.data.className);
            let liveCount = count - deadCount;
            classDataGridNode.updateCount(liveCount);
            if (liveCount)
                classDataGridNode.removeCollectedNodes(collectedNodes);
        }

        this.didPopulate();
    }
};

WI.HeapSnapshotObjectGraphDataGridTree = class HeapSnapshotInstancesDataGridTree extends WI.HeapSnapshotDataGridTree
{
    get alwaysShowRetainedSize()
    {
        return true;
    }

    populateTopLevel()
    {
        // FIXME: <https://webkit.org/b/214092> Web Inspector: Object Graph view shouldn't hardcode class names for root nodes

        this.heapSnapshot.instancesWithClassName("GlobalObject", (instances) => {
            for (let instance of instances)
                this.appendChild(new WI.HeapSnapshotInstanceDataGridNode(instance, this));
        });

        this.heapSnapshot.instancesWithClassName("CallbackGlobalObject", (instances) => {
            for (let instance of instances)
                this.appendChild(new WI.HeapSnapshotInstanceDataGridNode(instance, this));
        });

        this.heapSnapshot.instancesWithClassName("Window", (instances) => {
            for (let instance of instances) {
                // FIXME: Why is the window.Window Function classified as a Window?
                // In any case, ignore objects not dominated by the root, as they
                // are probably not what we want.
                if (instance.dominatorNodeIdentifier === 0)
                    this.appendChild(new WI.HeapSnapshotInstanceDataGridNode(instance, this));
            }

            this.didPopulate();
        });
    }
};
