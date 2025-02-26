/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.ObjectPropertiesDetailSectionRow = class ObjectPropertiesDetailSectionRow extends WI.DetailsSectionRow
{
    constructor(objectTree, sectionForDeferredExpand)
    {
        super();

        console.assert(objectTree instanceof WI.ObjectTreeView);
        console.assert(!sectionForDeferredExpand || sectionForDeferredExpand instanceof WI.DetailsSection);

        this._objectTree = objectTree;

        this.hideEmptyMessage();
        this.element.classList.add("properties", WI.SyntaxHighlightedStyleClassName);
        this.element.appendChild(objectTree.element);

        if (sectionForDeferredExpand && sectionForDeferredExpand.collapsed)
            sectionForDeferredExpand.addEventListener(WI.DetailsSection.Event.CollapsedStateChanged, this._detailsSectionCollapsedStateChanged, this);
        else
            this._objectTree.expand();
    }

    // Public

    get objectTree() { return this._objectTree; }

    // Private

    _detailsSectionCollapsedStateChanged(event)
    {
        console.assert(!event.target.collapsed);

        this._objectTree.expand();

        event.target.removeEventListener(WI.DetailsSection.Event.CollapsedStateChanged, this._detailsSectionCollapsedStateChanged, this);
    }
};
