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

WI.TimelineDataGridNodePathComponent = class TimelineDataGridNodePathComponent extends WI.HierarchicalPathComponent
{
    constructor(timelineDataGridNode, representedObject)
    {
        super(timelineDataGridNode.displayName(), timelineDataGridNode.iconClassNames(), representedObject || timelineDataGridNode.record);

        this._timelineDataGridNode = timelineDataGridNode;
    }

    // Public

    get timelineDataGridNode()
    {
        return this._timelineDataGridNode;
    }

    get previousSibling()
    {
        let previousSibling = this._timelineDataGridNode.previousSibling;
        while (previousSibling && previousSibling.hidden)
            previousSibling = previousSibling.previousSibling;

        if (!previousSibling)
            return null;

        return new WI.TimelineDataGridNodePathComponent(previousSibling);
    }

    get nextSibling()
    {
        let nextSibling = this._timelineDataGridNode.nextSibling;
        while (nextSibling && nextSibling.hidden)
            nextSibling = nextSibling.nextSibling;

        if (!nextSibling)
            return null;

        return new WI.TimelineDataGridNodePathComponent(nextSibling);
    }
};
