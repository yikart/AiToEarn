/*
 * Copyright (C) 2013-2021 Apple Inc. All rights reserved.
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

WI.ContentView = class ContentView extends WI.View
{
    constructor(representedObject, extraArguments)
    {
        // Concrete object instantiation.
        console.assert(!representedObject || WI.ContentView.isViewable(representedObject), representedObject);

        super();

        this._representedObject = representedObject;

        this.element.classList.add("content-view");

        this._parentContainer = null;
        this._isClosed = false;
        this._visible = false;
    }

    // Static

    static shouldNotRemoveFromDOMWhenHidden()
    {
        // Implemented by subclasses.
        // Returns true if the content view should *not* be detached from the DOM when hidden.
        return false;
    }

    static createFromRepresentedObject(representedObject, extraArguments)
    {
        console.assert(representedObject);

        if (representedObject instanceof WI.Frame)
            return new WI.ResourceClusterContentView(representedObject.mainResource, extraArguments);

        if (representedObject instanceof WI.Resource)
            return new WI.ResourceClusterContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.Script)
            return new WI.ScriptContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.CSSStyleSheet)
            return new WI.TextResourceContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.Canvas)
            return new WI.CanvasContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.ShaderProgram)
            return new WI.ShaderProgramContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.TimelineRecording)
            return new WI.TimelineRecordingContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.Timeline) {
            var timelineType = representedObject.type;
            if (timelineType === WI.TimelineRecord.Type.Network)
                return new WI.NetworkTimelineView(representedObject, extraArguments);

            if (timelineType === WI.TimelineRecord.Type.Layout)
                return new WI.LayoutTimelineView(representedObject, extraArguments);

            if (timelineType === WI.TimelineRecord.Type.Script)
                return new WI.ScriptClusterTimelineView(representedObject, extraArguments);

            if (timelineType === WI.TimelineRecord.Type.RenderingFrame)
                return new WI.RenderingFrameTimelineView(representedObject, extraArguments);

            if (timelineType === WI.TimelineRecord.Type.CPU)
                return new WI.CPUTimelineView(representedObject, extraArguments);

            if (timelineType === WI.TimelineRecord.Type.Memory)
                return new WI.MemoryTimelineView(representedObject, extraArguments);

            if (timelineType === WI.TimelineRecord.Type.HeapAllocations)
                return new WI.HeapAllocationsTimelineView(representedObject, extraArguments);

            if (timelineType === WI.TimelineRecord.Type.Media)
                return new WI.MediaTimelineView(representedObject, extraArguments);
            
            if (timelineType === WI.TimelineRecord.Type.Screenshots)
                return new WI.ScreenshotsTimelineView(representedObject, extraArguments);
        }

        if (representedObject instanceof WI.JavaScriptBreakpoint || representedObject instanceof WI.IssueMessage) {
            if (representedObject.sourceCodeLocation)
                return WI.ContentView.createFromRepresentedObject(representedObject.sourceCodeLocation.displaySourceCode, extraArguments);
        }

        if (representedObject instanceof WI.LocalResourceOverride) {
            if (representedObject.type === WI.LocalResourceOverride.InterceptType.Block || representedObject.type === WI.LocalResourceOverride.InterceptType.Request)
                return new WI.LocalResourceOverrideRequestContentView(representedObject);
            return WI.ContentView.createFromRepresentedObject(representedObject.localResource);
        }

        if (representedObject instanceof WI.DOMStorageObject)
            return new WI.DOMStorageContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.CookieStorageObject)
            return new WI.CookieStorageContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.DatabaseTableObject)
            return new WI.DatabaseTableContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.DatabaseObject)
            return new WI.DatabaseContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.IndexedDatabase)
            return new WI.IndexedDatabaseContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.IndexedDatabaseObjectStore)
            return new WI.IndexedDatabaseObjectStoreContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.IndexedDatabaseObjectStoreIndex)
            return new WI.IndexedDatabaseObjectStoreContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.ApplicationCacheFrame)
            return new WI.ApplicationCacheFrameContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.DOMTree)
            return new WI.FrameDOMTreeContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.DOMSearchMatchObject) {
            var resultView = new WI.FrameDOMTreeContentView(WI.networkManager.mainFrame.domTree, extraArguments);
            resultView.restoreFromCookie({nodeToSelect: representedObject.domNode});
            return resultView;
        }

        if (representedObject instanceof WI.DOMNode) {
            if (representedObject.frame) {
                let resultView = WI.ContentView.createFromRepresentedObject(representedObject.frame, extraArguments);
                resultView.restoreFromCookie({nodeToSelect: representedObject});
                return resultView;
            }
        }

        if (representedObject instanceof WI.SourceCodeSearchMatchObject) {
            var resultView;
            if (representedObject.sourceCode instanceof WI.Resource)
                resultView = new WI.ResourceClusterContentView(representedObject.sourceCode, extraArguments);
            else if (representedObject.sourceCode instanceof WI.Script)
                resultView = new WI.ScriptContentView(representedObject.sourceCode, extraArguments);
            else
                console.error("Unknown SourceCode", representedObject.sourceCode);

            var textRangeToSelect = representedObject.sourceCodeTextRange.formattedTextRange;
            var startPosition = textRangeToSelect.startPosition();
            resultView.restoreFromCookie({lineNumber: startPosition.lineNumber, columnNumber: startPosition.columnNumber});

            return resultView;
        }

        if (representedObject instanceof WI.LogObject)
            return new WI.LogContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.CallingContextTree)
            return new WI.ProfileView(representedObject, extraArguments);

        if (representedObject instanceof WI.HeapSnapshotProxy || representedObject instanceof WI.HeapSnapshotDiffProxy)
            return new WI.HeapSnapshotClusterContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.Recording)
            return new WI.RecordingContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.ResourceCollection)
            return new WI.ResourceCollectionContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.AuditTestCase || representedObject instanceof WI.AuditTestCaseResult)
            return new WI.AuditTestCaseContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.AuditTestGroup || representedObject instanceof WI.AuditTestGroupResult)
            return new WI.AuditTestGroupContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.Animation)
            return new WI.AnimationContentView(representedObject, extraArguments);

        if (representedObject instanceof WI.Collection)
            return new WI.CollectionContentView(representedObject, extraArguments);

        if (typeof representedObject === "string" || representedObject instanceof String)
            return new WI.TextContentView(representedObject, extraArguments);

        console.assert(!WI.ContentView.isViewable(representedObject));

        throw new Error("Can't make a ContentView for an unknown representedObject of type: " + representedObject.constructor.name);
    }

    static contentViewForRepresentedObject(representedObject, onlyExisting, extraArguments)
    {
        console.assert(representedObject);

        // Some represented objects attempt to resolve a better represented object.
        // This may result in null, for example a Breakpoint which doesn't have a SourceCode.
        let resolvedRepresentedObject = WI.ContentView.resolvedRepresentedObjectForRepresentedObject(representedObject);
        if (!resolvedRepresentedObject)
            return null;

        let existingContentView = resolvedRepresentedObject[WI.ContentView.ContentViewForRepresentedObjectSymbol];
        console.assert(!existingContentView || existingContentView instanceof WI.ContentView);
        if (existingContentView)
            return existingContentView;

        if (onlyExisting)
            return null;

        let newContentView = WI.ContentView.createFromRepresentedObject(representedObject, extraArguments);
        console.assert(newContentView instanceof WI.ContentView);
        if (!newContentView)
            return null;

        console.assert(newContentView.representedObject === resolvedRepresentedObject, "createFromRepresentedObject and resolvedRepresentedObjectForRepresentedObject are out of sync for type", representedObject.constructor.name);
        if (typeof resolvedRepresentedObject === "object")
            newContentView.representedObject[WI.ContentView.ContentViewForRepresentedObjectSymbol] = newContentView;
        return newContentView;
    }

    static closedContentViewForRepresentedObject(representedObject)
    {
        let resolvedRepresentedObject = WI.ContentView.resolvedRepresentedObjectForRepresentedObject(representedObject);
        if (typeof resolvedRepresentedObject === "object")
            resolvedRepresentedObject[WI.ContentView.ContentViewForRepresentedObjectSymbol] = null;
    }

    static resolvedRepresentedObjectForRepresentedObject(representedObject)
    {
        if (representedObject instanceof WI.Frame)
            return representedObject.mainResource;

        if (representedObject instanceof WI.JavaScriptBreakpoint || representedObject instanceof WI.IssueMessage) {
            if (representedObject.sourceCodeLocation)
                return representedObject.sourceCodeLocation.displaySourceCode;
            return representedObject;
        }

        if (representedObject instanceof WI.DOMBreakpoint) {
            if (representedObject.domNode)
                return WI.ContentView.resolvedRepresentedObjectForRepresentedObject(representedObject.domNode);
            return representedObject;
        }

        if (representedObject instanceof WI.DOMNode) {
            if (representedObject.frame)
                return WI.ContentView.resolvedRepresentedObjectForRepresentedObject(representedObject.frame);
            return representedObject;
        }

        if (representedObject instanceof WI.DOMSearchMatchObject)
            return WI.networkManager.mainFrame.domTree;

        if (representedObject instanceof WI.SourceCodeSearchMatchObject)
            return representedObject.sourceCode;

        if (representedObject instanceof WI.LocalResourceOverride) {
            if (representedObject.type === WI.LocalResourceOverride.InterceptType.Response || representedObject.type === WI.LocalResourceOverride.InterceptType.ResponseMappedDirectory || representedObject.type === WI.LocalResourceOverride.InterceptType.ResponseSkippingNetwork)
                return representedObject.localResource;
            return representedObject;
        }

        return representedObject;
    }

    static isViewable(representedObject)
    {
        if (representedObject instanceof WI.Frame)
            return true;
        if (representedObject instanceof WI.Resource)
            return true;
        if (representedObject instanceof WI.Script)
            return true;
        if (representedObject instanceof WI.CSSStyleSheet)
            return true;
        if (representedObject instanceof WI.Canvas)
            return true;
        if (representedObject instanceof WI.ShaderProgram)
            return true;
        if (representedObject instanceof WI.TimelineRecording)
            return true;
        if (representedObject instanceof WI.Timeline)
            return true;
        if (representedObject instanceof WI.JavaScriptBreakpoint || representedObject instanceof WI.IssueMessage)
            return representedObject.sourceCodeLocation;
        if (representedObject instanceof WI.LocalResourceOverride)
            return true;
        if (representedObject instanceof WI.DOMStorageObject)
            return true;
        if (representedObject instanceof WI.CookieStorageObject)
            return true;
        if (representedObject instanceof WI.DatabaseTableObject)
            return true;
        if (representedObject instanceof WI.DatabaseObject)
            return true;
        if (representedObject instanceof WI.IndexedDatabase)
            return true;
        if (representedObject instanceof WI.IndexedDatabaseObjectStore)
            return true;
        if (representedObject instanceof WI.IndexedDatabaseObjectStoreIndex)
            return true;
        if (representedObject instanceof WI.ApplicationCacheFrame)
            return true;
        if (representedObject instanceof WI.DOMTree)
            return true;
        if (representedObject instanceof WI.DOMSearchMatchObject)
            return true;
        if (representedObject instanceof WI.SourceCodeSearchMatchObject)
            return true;
        if (representedObject instanceof WI.LogObject)
            return true;
        if (representedObject instanceof WI.CallingContextTree)
            return true;
        if (representedObject instanceof WI.HeapSnapshotProxy || representedObject instanceof WI.HeapSnapshotDiffProxy)
            return true;
        if (representedObject instanceof WI.Recording)
            return true;
        if (representedObject instanceof WI.AuditTestCase || representedObject instanceof WI.AuditTestGroup
            || representedObject instanceof WI.AuditTestCaseResult || representedObject instanceof WI.AuditTestGroupResult)
            return true;
        if (representedObject instanceof WI.Animation)
            return true;
        if (representedObject instanceof WI.Collection)
            return true;
        if (typeof representedObject === "string" || representedObject instanceof String)
            return true;
        if (representedObject[WI.ContentView.isViewableSymbol])
            return true;
        return false;
    }

    // Public

    get isClosed() { return this._isClosed; }

    get visible()
    {
        return !this.isClosed && this._visible;
    }

    set visible(value)
    {
        this._visible = !!value;
        this.element.classList.toggle("not-visible", !this._visible);
    }

    get representedObject()
    {
        return this._representedObject;
    }

    get navigationItems()
    {
        // Navigation items that will be displayed by the ContentBrowser instance,
        // meant to be subclassed. Implemented by subclasses.
        return [];
    }

    get parentContainer()
    {
        return this._parentContainer;
    }

    get scrollableElements()
    {
        // Implemented by subclasses.
        return [];
    }

    get shouldKeepElementsScrolledToBottom()
    {
        // Implemented by subclasses.
        return false;
    }

    get shouldSaveStateWhenHidden()
    {
        return false;
    }

    get selectionPathComponents()
    {
        // Implemented by subclasses.
        return [];
    }

    get supplementalRepresentedObjects()
    {
        // Implemented by subclasses.
        return [];
    }

    get supportsSplitContentBrowser()
    {
        // Implemented by subclasses.
        return WI.dockedConfigurationSupportsSplitContentBrowser();
    }

    closed()
    {
        // Implemented by subclasses.
        this._isClosed = true;
    }

    saveToCookie(cookie)
    {
        // Implemented by subclasses.
    }

    restoreFromCookie(cookie)
    {
        // Implemented by subclasses.
    }

    canGoBack()
    {
        // Implemented by subclasses.
        return false;
    }

    canGoForward()
    {
        // Implemented by subclasses.
        return false;
    }

    goBack()
    {
        // Implemented by subclasses.
    }

    goForward()
    {
        // Implemented by subclasses.
    }

    get supportsSearch()
    {
        // Implemented by subclasses.
        return false;
    }

    get supportsCustomFindBanner()
    {
        // Implemented by subclasses.
        return false;
    }

    showCustomFindBanner()
    {
        // Implemented by subclasses.
    }

    get numberOfSearchResults()
    {
        // Implemented by subclasses.
        return null;
    }

    get hasPerformedSearch()
    {
        // Implemented by subclasses.
        return false;
    }

    set automaticallyRevealFirstSearchResult(reveal)
    {
        // Implemented by subclasses.
    }

    performSearch(query)
    {
        // Implemented by subclasses.
    }

    searchHidden()
    {
        // Implemented by subclasses.
    }

    searchCleared()
    {
        // Implemented by subclasses.
    }

    searchQueryWithSelection()
    {
        let selection = window.getSelection();
        if (selection.isCollapsed)
            return null;

        return selection.toString().removeWordBreakCharacters();
    }

    revealPreviousSearchResult(changeFocus)
    {
        // Implemented by subclasses.
    }

    revealNextSearchResult(changeFocus)
    {
        // Implemented by subclasses.
    }
};

WI.ContentView.Event = {
    SelectionPathComponentsDidChange: "content-view-selection-path-components-did-change",
    SupplementalRepresentedObjectsDidChange: "content-view-supplemental-represented-objects-did-change",
    NumberOfSearchResultsDidChange: "content-view-number-of-search-results-did-change",
    NavigationItemsDidChange: "content-view-navigation-items-did-change"
};

WI.ContentView.isViewableSymbol = Symbol("is-viewable");
WI.ContentView.ContentViewForRepresentedObjectSymbol = Symbol("content-view-for-represented-object");
