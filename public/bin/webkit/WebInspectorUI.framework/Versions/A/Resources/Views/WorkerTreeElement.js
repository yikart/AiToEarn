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

// FIXME: <https://webkit.org/b/164427> Web Inspector: WorkerTarget's mainResource should be a Resource not a Script
// When we are guaranteed a Resource and not a Script we can extend ResourceTreeElement.

WI.WorkerTreeElement = class WorkerTreeElement extends WI.ScriptTreeElement
{
    constructor(target)
    {
        console.assert(target instanceof WI.Target);
        console.assert(target.type === WI.TargetType.Worker);
        console.assert(target.mainResource instanceof WI.Script);

        let options = {};
        if (target instanceof WI.WorkerTarget)
            options.mainTitle = target.customName;

        super(target.mainResource, options);

        this._target = target;
        this._target.addEventListener(WI.Target.Event.ResourceAdded, this._resourceAdded, this);
        this._target.addEventListener(WI.Target.Event.ScriptAdded, this._scriptAdded, this);

        this._expandedSetting = new WI.Setting("worker-expanded-" + this._target.name.hash, true);

        // Scripts are top level.
        this.registerFolderizeSettings("scripts", null, this._target.resourceCollection.resourceCollectionForType(WI.Resource.Type.Script), WI.ResourceTreeElement);
        this.registerFolderizeSettings("extra-scripts", null, this._target.extraScriptCollection, WI.ScriptTreeElement);

        // All other resources may be folderized.
        for (let [key, value] of Object.entries(WI.Resource.Type)) {
            if (value === WI.Resource.Type.Script)
                continue;
            let folderName = WI.Resource.displayNameForType(value, true);
            this.registerFolderizeSettings(key, folderName, this._target.resourceCollection.resourceCollectionForType(value), WI.ResourceTreeElement);
        }

        this.updateParentStatus();

        if (this._expandedSetting.value)
            this.expand();
    }

    // Public

    get target() { return this._target; }

    // Protected (TreeElement)

    onexpand()
    {
        this._expandedSetting.value = true;
    }

    oncollapse()
    {
        if (this.hasChildren)
            this._expandedSetting.value = false;
    }

    onpopulate()
    {
        if (this.children.length && !this.shouldRefreshChildren)
            return;

        this.shouldRefreshChildren = false;

        this.removeChildren();
        this.prepareToPopulate();

        for (let resource of this._target.resourceCollection)
            this.addChildForRepresentedObject(resource);

        for (let script of this._target.extraScriptCollection)
            this.addChildForRepresentedObject(script);

        let sourceMaps = this._target.mainResource.sourceMaps;
        for (let sourceMap of sourceMaps) {
            for (let resource of sourceMap.resources)
                this.addChildForRepresentedObject(resource);
        }
    }

    populateContextMenu(contextMenu, event)
    {
        // FIXME: <https://webkit.org/b/164427> Web Inspector: WorkerTarget's mainResource should be a Resource not a Script
        WI.appendContextMenuItemsForSourceCode(contextMenu, this.script.resource ? this.script.resource : this.script);

        super.populateContextMenu(contextMenu, event);
    }

    // Overrides from SourceCodeTreeElement.

    updateSourceMapResources()
    {
        // Handle our own SourceMapResources.

        if (!this.treeOutline || !this.treeOutline.includeSourceMapResourceChildren)
            return;

        this.updateParentStatus();

        if (this._target.mainResource.sourceMaps.length) {
            this.hasChildren = true;
            this.shouldRefreshChildren = true;
        }
    }

    onattach()
    {
        // Handle our own SourceMapResources. Skip immediate superclasses.

        WI.GeneralTreeElement.prototype.onattach.call(this);
    }

    // Overrides from FolderizedTreeElement

    compareChildTreeElements(a, b)
    {
        let aIsResource = a instanceof WI.ResourceTreeElement;
        let bIsResource = b instanceof WI.ResourceTreeElement;

        if (aIsResource && bIsResource)
            return WI.ResourceTreeElement.compareResourceTreeElements(a, b);

        if (!aIsResource && !bIsResource)
            return super.compareChildTreeElements(a, b);

        return aIsResource ? 1 : -1;
    }

    // Private

    _scriptAdded(event)
    {
        let script = event.data.script;
        if (!script.url && !script.sourceURL)
            return;

        this.addRepresentedObjectToNewChildQueue(script);
    }

    _resourceAdded(event)
    {
        this.addRepresentedObjectToNewChildQueue(event.data.resource);
    }
};
