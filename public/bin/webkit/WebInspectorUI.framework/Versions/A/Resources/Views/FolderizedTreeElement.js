/*
 * Copyright (C) 2014-2015 Apple Inc. All rights reserved.
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

WI.FolderizedTreeElement = class FolderizedTreeElement extends WI.GeneralTreeElement
{
    constructor(classNames, title, subtitle, representedObject)
    {
        super(classNames, title, subtitle, representedObject);

        this.shouldRefreshChildren = true;

        this._folderSettingsKey = "";
        this._folderTypeMap = new Map;
        this._folderizeSettingsMap = new Map;
        this._groupedIntoFolders = false;
        this._clearNewChildQueue();
    }

    // Public

    get groupedIntoFolders()
    {
        return this._groupedIntoFolders;
    }

    set folderSettingsKey(x)
    {
        this._folderSettingsKey = x;
    }

    registerFolderizeSettings(type, displayName, representedObject, treeElementConstructor)
    {
        console.assert(type);
        console.assert(displayName || displayName === null);
        console.assert(representedObject);
        console.assert(typeof treeElementConstructor === "function");

        let settings = {
            type,
            displayName,
            topLevel: displayName === null,
            representedObject,
            treeElementConstructor,
        };

        this._folderizeSettingsMap.set(type, settings);
    }

    removeChildren()
    {
        super.removeChildren();

        this._clearNewChildQueue();

        this._folderTypeMap.clear();

        this._groupedIntoFolders = false;
    }

    // Protected

    addChildForRepresentedObject(representedObject)
    {
        var settings = this._settingsForRepresentedObject(representedObject);
        console.assert(settings);
        if (!settings) {
            console.error("No settings for represented object", representedObject);
            return;
        }

        if (!this.treeOutline) {
            // Just mark as needing to update to avoid doing work that might not be needed.
            this.shouldRefreshChildren = true;
            return;
        }

        var childTreeElement = this.treeOutline.getCachedTreeElement(representedObject);
        if (!childTreeElement)
            childTreeElement = new settings.treeElementConstructor(representedObject);

        this._addTreeElement(childTreeElement);
    }

    addRepresentedObjectToNewChildQueue(representedObject)
    {
        // This queue reduces flashing as resources load and change folders when their type becomes known.

        this._newChildQueue.push(representedObject);
        if (!this._newChildQueueTimeoutIdentifier)
            this._newChildQueueTimeoutIdentifier = setTimeout(this._populateFromNewChildQueue.bind(this), WI.FolderizedTreeElement.NewChildQueueUpdateInterval);
    }

    removeChildForRepresentedObject(representedObject)
    {
        this._removeRepresentedObjectFromNewChildQueue(representedObject);
        this.updateParentStatus();

        if (!this.treeOutline) {
            // Just mark as needing to update to avoid doing work that might not be needed.
            this.shouldRefreshChildren = true;
            return;
        }

        // Find the tree element for the frame by using getCachedTreeElement
        // to only get the item if it has been created already.
        var childTreeElement = this.treeOutline.getCachedTreeElement(representedObject);
        if (!childTreeElement || !childTreeElement.parent)
            return;

        this._removeTreeElement(childTreeElement);
    }

    compareChildTreeElements(a, b)
    {
        return this._compareTreeElementsByMainTitle(a, b);
    }

    updateParentStatus()
    {
        let hasChildren = false;
        for (let settings of this._folderizeSettingsMap.values()) {
            if (settings.representedObject.size) {
                hasChildren = true;
                break;
            }
        }

        this.hasChildren = hasChildren;
        if (!this.hasChildren)
            this.removeChildren();
    }

    prepareToPopulate()
    {
        if (!this._groupedIntoFolders && this._shouldGroupIntoFolders()) {
            this._groupedIntoFolders = true;
            return true;
        }

        return false;
    }

    // Private

    _clearNewChildQueue()
    {
        this._newChildQueue = [];
        if (this._newChildQueueTimeoutIdentifier) {
            clearTimeout(this._newChildQueueTimeoutIdentifier);
            this._newChildQueueTimeoutIdentifier = null;
        }
    }

    _populateFromNewChildQueue()
    {
        if (!this.children.length) {
            this.updateParentStatus();
            this.shouldRefreshChildren = true;
            return;
        }

        if (this.prepareToPopulate()) {
            // Will now folderize, repopulate children.
            this._clearNewChildQueue();
            this.shouldRefreshChildren = true;
            return;
        }

        for (var i = 0; i < this._newChildQueue.length; ++i)
            this.addChildForRepresentedObject(this._newChildQueue[i]);

        this._clearNewChildQueue();
    }

    _removeRepresentedObjectFromNewChildQueue(representedObject)
    {
        this._newChildQueue.remove(representedObject);
    }

    _addTreeElement(childTreeElement)
    {
        console.assert(childTreeElement);
        if (!childTreeElement)
            return;

        var wasSelected = childTreeElement.selected;

        this._removeTreeElement(childTreeElement, true, true);

        var parentTreeElement = this._parentTreeElementForRepresentedObject(childTreeElement.representedObject);
        if (parentTreeElement !== this && !parentTreeElement.parent)
            this._insertFolderTreeElement(parentTreeElement);

        this._insertChildTreeElement(parentTreeElement, childTreeElement);

        if (wasSelected)
            childTreeElement.revealAndSelect(true, false, true);
    }

    _compareTreeElementsByMainTitle(a, b)
    {
        // Folders before anything.
        let aIsFolder = a instanceof WI.FolderTreeElement;
        let bIsFolder = b instanceof WI.FolderTreeElement;
        if (aIsFolder && !bIsFolder)
            return -1;
        if (bIsFolder && !aIsFolder)
            return 1;

        // Then sort by title.
        return a.mainTitle.extendedLocaleCompare(b.mainTitle);
    }

    _insertFolderTreeElement(folderTreeElement)
    {
        console.assert(this._groupedIntoFolders);
        console.assert(!folderTreeElement.parent);
        this.insertChild(folderTreeElement, insertionIndexForObjectInListSortedByFunction(folderTreeElement, this.children, this._compareTreeElementsByMainTitle));
    }

    _insertChildTreeElement(parentTreeElement, childTreeElement)
    {
        console.assert(!childTreeElement.parent);
        parentTreeElement.insertChild(childTreeElement, insertionIndexForObjectInListSortedByFunction(childTreeElement, parentTreeElement.children, this.compareChildTreeElements.bind(this)));
    }

    _removeTreeElement(childTreeElement, suppressOnDeselect, suppressSelectSibling)
    {
        var oldParent = childTreeElement.parent;
        if (!oldParent)
            return;

        oldParent.removeChild(childTreeElement, suppressOnDeselect, suppressSelectSibling);

        if (oldParent === this)
            return;

        console.assert(oldParent instanceof WI.FolderTreeElement);
        if (!(oldParent instanceof WI.FolderTreeElement))
            return;

        // Remove the old parent folder if it is now empty.
        if (!oldParent.children.length)
            oldParent.parent.removeChild(oldParent);
    }

    _parentTreeElementForRepresentedObject(representedObject)
    {
        if (!this._groupedIntoFolders)
            return this;

        console.assert(this._folderSettingsKey !== "");

        let settings = this._settingsForRepresentedObject(representedObject);
        if (!settings) {
            console.error("Unknown representedObject", representedObject);
            return this;
        }

        if (settings.topLevel)
            return this;

        let folder = this._folderTypeMap.get(settings.type);
        if (folder)
            return folder;

        folder = new WI.FolderTreeElement(settings.displayName, settings.representedObject, {
            id: `${settings.type}-${settings._folderSettingsKey}`,
        });
        this._folderTypeMap.set(settings.type, folder);
        return folder;
    }

    _settingsForRepresentedObject(representedObject)
    {
        for (let settings of this._folderizeSettingsMap.values()) {
            if (settings.representedObject.objectIsRequiredType(representedObject))
                return settings;
        }
        return null;
    }

    _shouldGroupIntoFolders()
    {
        // Already grouped into folders, keep it that way.
        if (this._groupedIntoFolders)
            return true;

        // Child objects are grouped into folders if one of two thresholds are met:
        // 1) Once the number of medium categories passes NumberOfMediumCategoriesThreshold.
        // 2) When there is a category that passes LargeChildCountThreshold and there are
        //    any child objects in another category.

        // Folders are avoided when there is only one category or most categories are small.

        var numberOfSmallCategories = 0;
        var numberOfMediumCategories = 0;
        var foundLargeCategory = false;

        function pushCategory(childCount)
        {
            if (!childCount)
                return false;

            // If this type has any resources and there is a known large category, make folders.
            if (foundLargeCategory)
                return true;

            // If there are lots of this resource type, then count it as a large category.
            if (childCount >= WI.FolderizedTreeElement.LargeChildCountThreshold) {
                // If we already have other resources in other small or medium categories, make folders.
                if (numberOfSmallCategories || numberOfMediumCategories)
                    return true;

                foundLargeCategory = true;
                return false;
            }

            // Check if this is a medium category.
            if (childCount >= WI.FolderizedTreeElement.MediumChildCountThreshold) {
                // If this is the medium category that puts us over the maximum allowed, make folders.
                return ++numberOfMediumCategories >= WI.FolderizedTreeElement.NumberOfMediumCategoriesThreshold;
            }

            // This is a small category.
            ++numberOfSmallCategories;
            return false;
        }

        // Iterate over all the available child object types.
        for (var settings of this._folderizeSettingsMap.values()) {
            if (pushCategory(settings.representedObject.size))
                return true;
        }
        return false;
    }
};

WI.FolderizedTreeElement.MediumChildCountThreshold = 5;
WI.FolderizedTreeElement.LargeChildCountThreshold = 15;
WI.FolderizedTreeElement.NumberOfMediumCategoriesThreshold = 2;
WI.FolderizedTreeElement.NewChildQueueUpdateInterval = 500;
