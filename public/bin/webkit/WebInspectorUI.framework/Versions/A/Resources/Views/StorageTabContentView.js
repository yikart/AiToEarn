/*
 * Copyright (C) 2015 Apple Inc. All rights reserved.
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

WI.StorageTabContentView = class StorageTabContentView extends WI.ContentBrowserTabContentView
{
    constructor()
    {
        super(StorageTabContentView.tabInfo(), {
            navigationSidebarPanelConstructor: WI.StorageSidebarPanel,
            detailsSidebarPanelConstructors: [
                WI.ApplicationCacheDetailsSidebarPanel,
                WI.IndexedDatabaseDetailsSidebarPanel,
            ],
        });

        WI.applicationCacheManager.enable();
        WI.databaseManager.enable();
        WI.domStorageManager.enable();
        WI.indexedDBManager.enable();
    }

    static tabInfo()
    {
        return {
            identifier: StorageTabContentView.Type,
            image: "Images/Storage.svg",
            displayName: WI.UIString("Storage", "Storage Tab Name", "Name of Storage Tab"),
        };
    }

    static isTabAllowed()
    {
        return InspectorBackend.hasDomain("ApplicationCache")
            || InspectorBackend.hasDomain("DOMStorage")
            || InspectorBackend.hasDomain("Database")
            || InspectorBackend.hasDomain("IndexedDB");
    }

    // Public

    get type()
    {
        return WI.StorageTabContentView.Type;
    }

    get supportsSplitContentBrowser()
    {
        return true;
    }

    canShowRepresentedObject(representedObject)
    {
        return representedObject instanceof WI.ApplicationCacheFrame
            || representedObject instanceof WI.CookieStorageObject
            || representedObject instanceof WI.DOMStorageObject
            || representedObject instanceof WI.DatabaseObject
            || representedObject instanceof WI.DatabaseTableObject
            || representedObject instanceof WI.IndexedDatabase
            || representedObject instanceof WI.IndexedDatabaseObjectStore
            || representedObject instanceof WI.IndexedDatabaseObjectStoreIndex;
    }

    get canHandleFindEvent()
    {
        return this.contentBrowser.currentContentView.canFocusFilterBar;
    }

    handleFindEvent(event)
    {
        this.contentBrowser.currentContentView.focusFilterBar();
    }

    closed()
    {
        WI.applicationCacheManager.disable();
        WI.databaseManager.disable();
        WI.domStorageManager.disable();
        WI.indexedDBManager.disable();

        super.closed();
    }
};

WI.StorageTabContentView.Type = "storage";
