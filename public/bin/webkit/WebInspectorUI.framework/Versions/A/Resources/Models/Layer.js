/*
 * Copyright (C) 2017 Sony Interactive Entertainment Inc.
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

WI.Layer = class Layer {
    constructor(layerId, nodeId, bounds, paintCount, memory, compositedBounds, isInShadowTree, isReflection, isGeneratedContent, isAnonymous, pseudoElementId, pseudoElement)
    {
        console.assert(typeof bounds === "object");

        this._layerId = layerId;
        this._nodeId = nodeId;
        this._bounds = bounds;
        this._paintCount = paintCount;
        this._memory = memory;
        this._compositedBounds = compositedBounds;
        this._isInShadowTree = isInShadowTree;
        this._isReflection = isReflection;
        this._isGeneratedContent = isGeneratedContent;
        this._isAnonymous = isAnonymous;
        this._pseudoElementId = pseudoElementId;
        this._pseudoElement = pseudoElement;

        // Transform compositedBounds to the global position
        this._compositedBounds.x += this._bounds.x;
        this._compositedBounds.y += this._bounds.y;
    }

    // Static

    static fromPayload(payload)
    {
        return new WI.Layer(
            payload.layerId,
            payload.nodeId,
            payload.bounds,
            payload.paintCount,
            payload.memory,
            payload.compositedBounds,
            payload.isInShadowTree,
            payload.isReflection,
            payload.isGeneratedContent,
            payload.isAnonymous,
            payload.pseudoElementId,
            payload.pseudoElement
        );
    }

    // Public

    get layerId() { return this._layerId; }
    get nodeId() { return this._nodeId; }
    get bounds() { return this._bounds; }
    get paintCount() { return this._paintCount; }
    get memory() { return this._memory; }
    get compositedBounds() { return this._compositedBounds; }
    get isInShadowTree() { return this._isInShadowTree; }
    get isReflection() { return this._isReflection; }
    get isGeneratedContent() { return this._isGeneratedContent; }
    get isAnonymous() { return this._isAnonymous; }
    get pseudoElementId() { return this._pseudoElementId; }
    get pseudoElement() { return this._pseudoElement; }
};
