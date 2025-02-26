/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 * Copyright (C) 2016 Devin Rousso <webkit@devinrousso.com>. All rights reserved.
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

WI.ResourceCollection = class ResourceCollection extends WI.Collection
{
    constructor(resourceType)
    {
        super();

        this._resourceType = resourceType || null;
        this._resourceURLMap = new Multimap;
        this._resourcesTypeMap = new Map;
    }

    // Public

    get resourceType() { return this._resourceType; }

    get displayName()
    {
        const plural = true;
        return this._resourceType ? WI.Resource.displayNameForType(this._resourceType, plural) : WI.UIString("Resources");
    }

    objectIsRequiredType(object)
    {
        if (this._resourceType === WI.Resource.Type.StyleSheet && object instanceof WI.CSSStyleSheet)
            return true;

        if (!(object instanceof WI.Resource))
            return false;

        if (!this._resourceType)
            return true;

        return object.type === this._resourceType;
    }

    resourcesForURL(url)
    {
        return this._resourceURLMap.get(url) || new Set;
    }

    resourceCollectionForType(type)
    {
        if (this._resourceType) {
            console.assert(type === this._resourceType);
            return this;
        }

        let resourcesCollectionForType = this._resourcesTypeMap.get(type);
        if (!resourcesCollectionForType) {
            resourcesCollectionForType = new WI.ResourceCollection(type);
            this._resourcesTypeMap.set(type, resourcesCollectionForType);
        }

        return resourcesCollectionForType;
    }

    clear()
    {
        super.clear();

        this._resourceURLMap.clear();

        if (!this._resourceType)
            this._resourcesTypeMap.clear();
    }

    // Protected

    itemAdded(item)
    {
        this._associateWithResource(item);
    }

    itemRemoved(item)
    {
        this._disassociateWithResource(item);
    }

    itemsCleared(items)
    {
        const skipRemoval = true;

        for (let item of items)
            this._disassociateWithResource(item, skipRemoval);
    }

    // Private

    _associateWithResource(resource)
    {
        this._resourceURLMap.add(resource.url, resource);

        if (!this._resourceType) {
            let resourcesCollectionForType = this.resourceCollectionForType(resource.type);
            resourcesCollectionForType.add(resource);
        }

        resource.addEventListener(WI.Resource.Event.URLDidChange, this._resourceURLDidChange, this);
        resource.addEventListener(WI.Resource.Event.TypeDidChange, this._resourceTypeDidChange, this);
    }

    _disassociateWithResource(resource, skipRemoval)
    {
        resource.removeEventListener(WI.Resource.Event.URLDidChange, this._resourceURLDidChange, this);
        resource.removeEventListener(WI.Resource.Event.TypeDidChange, this._resourceTypeDidChange, this);

        if (skipRemoval)
            return;

        if (!this._resourceType) {
            let resourcesCollectionForType = this.resourceCollectionForType(resource.type);
            resourcesCollectionForType.remove(resource);
        }

        this._resourceURLMap.delete(resource.url, resource);
    }

    _resourceURLDidChange(event)
    {
        let resource = event.target;
        console.assert(resource instanceof WI.Resource);
        if (!(resource instanceof WI.Resource))
            return;

        let oldURL = event.data.oldURL;
        console.assert(oldURL);
        if (!oldURL)
            return;

        this._resourceURLMap.add(resource.url, resource);
        this._resourceURLMap.delete(oldURL, resource);
    }

    _resourceTypeDidChange(event)
    {
        let resource = event.target;
        console.assert(resource instanceof WI.Resource);
        if (!(resource instanceof WI.Resource))
            return;

        if (this._resourceType) {
            console.assert(resource.type !== this._resourceType);
            this.remove(resource);
            return;
        }

        console.assert(event.data.oldType);

        let resourcesWithNewType = this.resourceCollectionForType(resource.type);
        resourcesWithNewType.add(resource);

        // It is not necessary to remove the resource from the sub-collection for the old type since
        // this is handled by that sub-collection's own _resourceTypeDidChange handler (via the
        // above if statement).
    }
};
