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

WI.HeapSnapshotInstanceFetchMoreDataGridNode = class HeapSnapshotInstanceFetchMoreDataGridNode extends WI.DataGridNode
{
    constructor(tree, batchCount, remainingCount, fetchCallback)
    {
        super();

        console.assert(typeof batchCount === "number");
        console.assert(typeof remainingCount === "number");
        console.assert(typeof fetchCallback === "function");

        this._tree = tree;
        this._batchCount = batchCount;
        this._remainingCount = remainingCount;
        this._fetchCallback = fetchCallback;
    }

    // Public

    hasVisibleSiblingNodes()
    {
        let node = this;
        while (node = node.previousSibling) {
            if (!node.hidden)
                return true;
        }

        return false;
    }

    // Protected

    createCellContent(columnIdentifier)
    {
        if (columnIdentifier !== "className")
            return "";

        let fragment = document.createDocumentFragment();

        if (this._batchCount) {
            let buttonElement = fragment.appendChild(document.createElement("span"));
            buttonElement.classList.add("more");
            buttonElement.textContent = WI.UIString("Show %d More").format(this._batchCount);
            buttonElement.addEventListener("click", (event) => { this._fetchCallback(this._batchCount); });
        }

        let buttonElement = fragment.appendChild(document.createElement("span"));
        buttonElement.classList.add("more");
        buttonElement.textContent = WI.UIString("Show Remaining (%d)").format(this._remainingCount);
        buttonElement.addEventListener("click", (event) => { this._fetchCallback(this._remainingCount); });

        return fragment;
    }

    sort()
    {
        // No children to sort.
    }
};
