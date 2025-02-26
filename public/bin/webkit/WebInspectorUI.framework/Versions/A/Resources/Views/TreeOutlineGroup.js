/*
 * Copyright (C) 2017, 2018 Apple Inc. All rights reserved.
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

WI.TreeOutlineGroup = class TreeOutlineGroup extends WI.Collection
{
    // Public

    objectIsRequiredType(object)
    {
        return object instanceof WI.TreeOutline;
    }

    get selectedTreeElement()
    {
        for (let treeOutline of this) {
            if (treeOutline.selectedTreeElement)
                return treeOutline.selectedTreeElement;
        }

        return null;
    }

    // Protected

    itemAdded(treeOutline)
    {
        if (treeOutline.selectedTreeElement)
            this._removeConflictingTreeSelections(treeOutline);

        treeOutline.addEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeOutlineSelectionDidChange, this);
    }

    itemRemoved(treeOutline)
    {
        treeOutline.removeEventListener(WI.TreeOutline.Event.SelectionDidChange, this._treeOutlineSelectionDidChange, this);
    }

    // Private

    _removeConflictingTreeSelections(selectedTreeOutline)
    {
        for (let treeOutline of this) {
            if (selectedTreeOutline === treeOutline)
                continue;

            treeOutline.selectedTreeElement = null;
        }
    }

    _treeOutlineSelectionDidChange(event)
    {
        let treeOutline = event.target;
        if (!treeOutline.selectedTreeElement)
            return;

        this._removeConflictingTreeSelections(treeOutline);
    }
};
