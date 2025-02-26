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

WI.FrameTreeElement = class FrameTreeElement extends WI.ResourceTreeElement
{
    constructor(frame)
    {
        console.assert(frame instanceof WI.Frame);

        super(frame.mainResource, frame);

        this._frame = frame;

        this._updateExpandedSetting();

        frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
        frame.addEventListener(WI.Frame.Event.ResourceWasAdded, this._resourceWasAdded, this);
        frame.addEventListener(WI.Frame.Event.ResourceWasRemoved, this._resourceWasRemoved, this);
        frame.addEventListener(WI.Frame.Event.ExtraScriptAdded, this._extraScriptAdded, this);
        frame.addEventListener(WI.Frame.Event.ChildFrameWasAdded, this._childFrameWasAdded, this);
        frame.addEventListener(WI.Frame.Event.ChildFrameWasRemoved, this._childFrameWasRemoved, this);

        this.shouldRefreshChildren = true;
        this.folderSettingsKey = this._frame.url.hash;

        this.registerFolderizeSettings("frames", WI.UIString("Frames"), this._frame.childFrameCollection, WI.FrameTreeElement);
        this.registerFolderizeSettings("extra-scripts", WI.UIString("Extra Scripts"), this._frame.extraScriptCollection, WI.ScriptTreeElement);

        function forwardingConstructor(representedObject, ...extraArguments) {
            if (representedObject instanceof WI.CSSStyleSheet)
                return new WI.CSSStyleSheetTreeElement(representedObject, ...extraArguments);
            return new WI.ResourceTreeElement(representedObject, ...extraArguments);
        }

        for (let [key, value] of Object.entries(WI.Resource.Type)) {
            let folderName = WI.Resource.displayNameForType(value, true);

            let treeElementConstructor = forwardingConstructor;
            if (value === WI.Resource.Type.WebSocket)
                treeElementConstructor = WI.WebSocketResourceTreeElement;

            this.registerFolderizeSettings(key, folderName, this._frame.resourceCollectionForType(value), treeElementConstructor);
        }

        this.updateParentStatus();
    }

    // Public

    get frame()
    {
        return this._frame;
    }

    descendantResourceTreeElementTypeDidChange(resourceTreeElement, oldType)
    {
        // Called by descendant ResourceTreeElements.

        // Add the tree element again, which will move it to the new location
        // based on sorting and possible folder changes.
        this._addTreeElement(resourceTreeElement);
    }

    descendantResourceTreeElementMainTitleDidChange(resourceTreeElement, oldMainTitle)
    {
        // Called by descendant ResourceTreeElements.

        // Add the tree element again, which will move it to the new location
        // based on sorting and possible folder changes.
        this._addTreeElement(resourceTreeElement);
    }

    // Overrides from SourceCodeTreeElement.

    updateSourceMapResources()
    {
        // Frames handle their own SourceMapResources.

        if (!this.treeOutline || !this.treeOutline.includeSourceMapResourceChildren)
            return;

        if (!this._frame)
            return;

        this.updateParentStatus();

        if (this.resource && this.resource.sourceMaps.length)
            this.shouldRefreshChildren = true;
    }

    onattach()
    {
        // Immediate superclasses are skipped, since Frames handle their own SourceMapResources.
        WI.GeneralTreeElement.prototype.onattach.call(this);

        WI.cssManager.addEventListener(WI.CSSManager.Event.StyleSheetAdded, this._styleSheetAdded, this);
        WI.cssManager.addEventListener(WI.CSSManager.Event.StyleSheetRemoved, this._styleSheetRemoved, this);
    }

    ondetach()
    {
        WI.cssManager.removeEventListener(WI.CSSManager.Event.StyleSheetAdded, this._styleSheetAdded, this);
        WI.cssManager.removeEventListener(WI.CSSManager.Event.StyleSheetRemoved, this._styleSheetRemoved, this);

        super.ondetach();
    }

    // Overrides from FolderizedTreeElement (Protected).

    compareChildTreeElements(a, b)
    {
        if (a === b)
            return 0;

        var aIsResource = a instanceof WI.ResourceTreeElement;
        var bIsResource = b instanceof WI.ResourceTreeElement;

        if (aIsResource && bIsResource)
            return WI.ResourceTreeElement.compareResourceTreeElements(a, b);

        if (!aIsResource && !bIsResource) {
            // When both components are not resources then default to base class comparison.
            return super.compareChildTreeElements(a, b);
        }

        // Non-resources should appear before the resources.
        // FIXME: There should be a better way to group the elements by their type.
        return aIsResource ? 1 : -1;
    }

    // Overrides from TreeElement (Private).

    onpopulate()
    {
        if (this.children.length && !this.shouldRefreshChildren)
            return;
        this.shouldRefreshChildren = false;

        this.removeChildren();
        this.updateParentStatus();
        this.prepareToPopulate();

        for (let frame of this._frame.childFrameCollection)
            this.addChildForRepresentedObject(frame);

        for (let resource of this._frame.resourceCollection)
            this.addChildForRepresentedObject(resource);

        var sourceMaps = this.resource && this.resource.sourceMaps;
        for (var i = 0; i < sourceMaps.length; ++i) {
            var sourceMap = sourceMaps[i];
            for (var j = 0; j < sourceMap.resources.length; ++j)
                this.addChildForRepresentedObject(sourceMap.resources[j]);
        }

        for (let extraScript of this._frame.extraScriptCollection) {
            if (extraScript.sourceURL || extraScript.sourceMappingURL)
                this.addChildForRepresentedObject(extraScript);
        }

        for (let styleSheet of WI.cssManager.inspectorStyleSheetsForFrame(this._frame))
            this.addChildForRepresentedObject(styleSheet);
    }

    onexpand()
    {
        this._expandedSetting.value = true;
    }

    oncollapse()
    {
        // Only store the setting if we have children, since setting hasChildren to false will cause a collapse,
        // and we only care about user triggered collapses.
        if (this.hasChildren)
            this._expandedSetting.value = false;
    }

    // Protected

    get mainTitleText()
    {
        // We can't assume that `this._frame` exists since this may be called before that is set.
        if (this.resource.parentFrame.name)
            return WI.UIString("%s (%s)").format(this.resource.parentFrame.name, super.mainTitleText);
        return super.mainTitleText;
    }

    // Private

    _updateExpandedSetting()
    {
        this._expandedSetting = new WI.Setting("frame-expanded-" + this._frame.url.hash, this._frame.isMainFrame() ? true : false);
        if (this._expandedSetting.value)
            this.expand();
        else
            this.collapse();
    }

    _mainResourceDidChange(event)
    {
        this._updateResource(this._frame.mainResource);

        this.updateParentStatus();
        this.removeChildren();

        // Change the expanded setting since the frame URL has changed. Do this before setting shouldRefreshChildren, since
        // shouldRefreshChildren will call onpopulate if expanded is true.
        this._updateExpandedSetting();

        this.shouldRefreshChildren = true;
    }

    _resourceWasAdded(event)
    {
        this.addRepresentedObjectToNewChildQueue(event.data.resource);
    }

    _resourceWasRemoved(event)
    {
        this.removeChildForRepresentedObject(event.data.resource);
    }

    _extraScriptAdded(event)
    {
        let extraScript = event.data.script;
        if (extraScript.sourceURL || extraScript.sourceMappingURL)
            this.addRepresentedObjectToNewChildQueue(extraScript);
    }

    _childFrameWasAdded(event)
    {
        this.addRepresentedObjectToNewChildQueue(event.data.childFrame);
    }

    _childFrameWasRemoved(event)
    {
        this.removeChildForRepresentedObject(event.data.childFrame);
    }

    _styleSheetAdded(event)
    {
        let {styleSheet} = event.data;
        if (styleSheet.origin === WI.CSSStyleSheet.Type.Author || styleSheet.injected || styleSheet.anonymous)
            return;

        this.addRepresentedObjectToNewChildQueue(styleSheet);
    }

    _styleSheetRemoved(event)
    {
        let {styleSheet} = event.data;
        if (styleSheet.origin === WI.CSSStyleSheet.Type.Author || styleSheet.injected || styleSheet.anonymous)
            return;

        this.removeChildForRepresentedObject(styleSheet);
    }
};
