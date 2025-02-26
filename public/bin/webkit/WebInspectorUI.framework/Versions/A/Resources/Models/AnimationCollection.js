/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

WI.AnimationCollection = class AnimationCollection extends WI.Collection
{
    constructor(animationType)
    {
        console.assert(!animationType || Object.values(WI.Animation.Type).includes(animationType));

        super();

        this._animationType = animationType || null;

        if (!this._animationType)
            this._animationCollectionForTypeMap = null;
    }

    // Public

    get animationType() { return this._animationType; }

    get displayName()
    {
        if (this._animationType) {
            const plural = true;
            return WI.Animation.displayNameForType(this._animationType, plural);
        }

        return WI.UIString("Web Animations");
    }

    objectIsRequiredType(object)
    {
        if (!(object instanceof WI.Animation))
            return false;

        return !this._animationType || object.animationType === this._animationType;
    }

    animationCollectionForType(animationType)
    {
        console.assert(Object.values(WI.Animation.Type).includes(animationType));

        if (this._animationType) {
            console.assert(animationType === this._animationType);
            return this;
        }

        if (!this._animationCollectionForTypeMap)
            this._animationCollectionForTypeMap = new Map;

        let animationCollectionForType = this._animationCollectionForTypeMap.get(animationType);
        if (!animationCollectionForType) {
            animationCollectionForType = new WI.AnimationCollection(animationType);
            this._animationCollectionForTypeMap.set(animationType, animationCollectionForType);
        }
        return animationCollectionForType;
    }

    // Protected

    itemAdded(item)
    {
        super.itemAdded(item);

        if (!this._animationType) {
            let animationCollectionForType = this.animationCollectionForType(item.animationType);
            animationCollectionForType.add(item);
        }
    }

    itemRemoved(item)
    {
        if (!this._animationType) {
            let animationCollectionForType = this.animationCollectionForType(item.animationType);
            animationCollectionForType.remove(item);
        }

        super.itemRemoved(item);
    }

    itemsCleared(items)
    {
        if (this._animationCollectionForTypeMap) {
            for (let animationCollectionForType of this._animationCollectionForTypeMap.values())
                animationCollectionForType.clear();
        }

        super.itemsCleared(items);
    }
};
