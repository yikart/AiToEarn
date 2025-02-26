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

WI.HeapSnapshotClassDataGridNode = class HeapSnapshotClassDataGridNode extends WI.DataGridNode
{
    constructor(data, tree)
    {
        super(data, {hasChildren: true});

        this._data = data;
        this._tree = tree;

        this._batched = false;
        this._instances = null;

        this.addEventListener(WI.DataGridNode.Event.Populate, this._populate, this);
    }

    // Protected

    get data() { return this._data; }

    createCellContent(columnIdentifier)
    {
        if (columnIdentifier === "retainedSize") {
            let size = this._data.retainedSize;
            let fragment = document.createDocumentFragment();
            let sizeElement = fragment.appendChild(document.createElement("span"));
            sizeElement.classList.add("size");
            sizeElement.textContent = Number.bytesToString(size);
            let percentElement = fragment.appendChild(document.createElement("span"));
            percentElement.classList.add("percentage");
            percentElement.textContent = emDash;
            return fragment;
        }

        if (columnIdentifier === "size")
            return Number.bytesToString(this._data.size);

        if (columnIdentifier === "className") {
            const internal = false;
            let {className, isObjectSubcategory} = this._data;
            let fragment = document.createDocumentFragment();
            let iconElement = fragment.appendChild(document.createElement("img"));
            iconElement.classList.add("icon", WI.HeapSnapshotClusterContentView.iconStyleClassNameForClassName(className, internal, isObjectSubcategory));
            let nameElement = fragment.appendChild(document.createElement("span"));
            nameElement.classList.add("class-name");
            nameElement.textContent = className;
            return fragment;
        }

        return super.createCellContent(columnIdentifier);
    }

    sort()
    {
        if (this._batched) {
            this._removeFetchMoreDataGridNode();
            this._sortInstances();
            this._updateBatchedChildren();
            this._appendFetchMoreDataGridNode();
            return;
        }

        let children = this.children;
        children.sort(this._tree._sortComparator);

        for (let i = 0; i < children.length; ++i) {
            children[i]._recalculateSiblings(i);
            children[i].sort();
        }
    }

    removeCollectedNodes(collectedNodes)
    {
        let nodesToRemove = [];

        this.forEachImmediateChild((dataGridNode) => {
            if (dataGridNode instanceof WI.HeapSnapshotInstanceDataGridNode) {
                let heapSnapshotNode = dataGridNode.node;
                if (heapSnapshotNode.id in collectedNodes)
                    nodesToRemove.push(dataGridNode);
            }
        });

        if (nodesToRemove.length) {
            for (let dataGridNode of nodesToRemove)
                this.removeChild(dataGridNode);
        }

        if (this._instances) {
            this._instances = this._instances.filter((instance) => !(instance.id in collectedNodes));
            this._fetchBatch(nodesToRemove.length);
        }
    }

    updateCount(count)
    {
        if (count === this._data.count)
            return;

        if (!count) {
            this._tree.removeChild(this);
            return;
        }

        this._data.count = count;
        this.needsRefresh();
    }

    // Private

    _populate()
    {
        this.removeEventListener(WI.DataGridNode.Event.Populate, this._populate, this);

        this._tree.heapSnapshot.instancesWithClassName(this._data.className, (instances) => {
            // FIXME: <https://webkit.org/b/157905> Web Inspector: Provide a way to toggle between showing only live objects and live+dead objects
            this._instances = instances.filter((instance) => !instance.dead);
            this._sortInstances();

            // Batch.
            if (instances.length > WI.HeapSnapshotClassDataGridNode.ChildrenBatchLimit) {
                this._batched = true;
                this._fetchBatch(WI.HeapSnapshotClassDataGridNode.ChildrenBatchLimit);
                return;
            }

            for (let instance of this._instances)
                this.appendChild(new WI.HeapSnapshotInstanceDataGridNode(instance, this._tree));
        });
    }

    _fetchBatch(batchSize)
    {
        if (this._batched && this.children.length)
            this._removeFetchMoreDataGridNode();

        let oldCount = this.children.length;
        let newCount = oldCount + batchSize;

        if (newCount >= this._instances.length) {
            newCount = this._instances.length - 1;
            this._batched = false;
        }

        let count = newCount - oldCount;
        if (count) {
            for (let i = 0; i <= count; ++i) {
                let instance = this._instances[oldCount + i];
                this.appendChild(new WI.HeapSnapshotInstanceDataGridNode(instance, this._tree));
            }
        }

        if (this._batched)
            this._appendFetchMoreDataGridNode();
    }

    _sortInstances()
    {
        this._instances.sort((a, b) => {
            let fakeDataGridNodeA = {data: a};
            let fakeDataGridNodeB = {data: b};
            return this._tree._sortComparator(fakeDataGridNodeA, fakeDataGridNodeB);
        });
    }

    _updateBatchedChildren()
    {
        let count = this.children.length;

        this.removeChildren();

        for (let i = 0; i < count; ++i)
            this.appendChild(new WI.HeapSnapshotInstanceDataGridNode(this._instances[i], this._tree));
    }

    _removeFetchMoreDataGridNode()
    {
        console.assert(this.children[this.children.length - 1] instanceof WI.HeapSnapshotInstanceFetchMoreDataGridNode);

        this.removeChild(this.children[this.children.length - 1]);
    }

    _appendFetchMoreDataGridNode()
    {
        console.assert(!(this.children[this.children.length - 1] instanceof WI.HeapSnapshotInstanceFetchMoreDataGridNode));

        let count = this.children.length;
        let totalCount = this._instances.length;
        let remainingCount = totalCount - count;
        let batchSize = remainingCount >= WI.HeapSnapshotClassDataGridNode.ChildrenBatchLimit ? WI.HeapSnapshotClassDataGridNode.ChildrenBatchLimit : 0;

        this.appendChild(new WI.HeapSnapshotInstanceFetchMoreDataGridNode(this._tree, batchSize, remainingCount, this._fetchBatch.bind(this)));
    }
};

WI.HeapSnapshotClassDataGridNode.ChildrenBatchLimit = 100;
