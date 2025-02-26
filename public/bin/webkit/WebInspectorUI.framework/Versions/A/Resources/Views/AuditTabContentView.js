/*
 * Copyright (C) 2018 Apple Inc. All rights reserved.
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

WI.AuditTabContentView = class AuditTabContentView extends WI.ContentBrowserTabContentView
{
    constructor()
    {
        super(AuditTabContentView.tabInfo(), {
            navigationSidebarPanelConstructor: WI.AuditNavigationSidebarPanel,
            hideBackForwardButtons: true,
        });

        this._startStopShortcut = new WI.KeyboardShortcut(null, WI.KeyboardShortcut.Key.Space, this._handleSpace.bind(this));
        this._startStopShortcut.implicitlyPreventsDefault = false;
        this._startStopShortcut.disabled = true;
    }

    // Static

    static tabInfo()
    {
        return {
            identifier: AuditTabContentView.Type,
            image: "Images/Audit.svg",
            displayName: WI.UIString("Audit", "Audit Tab Name", "Name of Audit Tab"),
        };
    }

    static isTabAllowed()
    {
        return WI.sharedApp.isWebDebuggable();
    }

    // Public

    get type()
    {
        return WI.AuditTabContentView.Type;
    }

    get supportsSplitContentBrowser()
    {
        return true;
    }

    canShowRepresentedObject(representedObject)
    {
        return representedObject instanceof WI.AuditTestCase
            || representedObject instanceof WI.AuditTestGroup
            || representedObject instanceof WI.AuditTestCaseResult
            || representedObject instanceof WI.AuditTestGroupResult;
    }

    attached()
    {
        super.attached();

        this._startStopShortcut.disabled = false;
    }

    detached()
    {
        this._startStopShortcut.disabled = true;

        super.detached();
    }

    // DropZoneView delegate

    dropZoneShouldAppearForDragEvent(dropZone, event)
    {
        return event.dataTransfer.types.includes("Files");
    }

    dropZoneHandleDrop(dropZone, event)
    {
        let files = event.dataTransfer.files;
        if (files.length !== 1) {
            InspectorFrontendHost.beep();
            return;
        }

        WI.FileUtilities.readJSON(files, (result) => WI.auditManager.processJSON(result));
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        let dropZoneView = new WI.DropZoneView(this);
        dropZoneView.text = WI.UIString("Import Audit or Result");
        dropZoneView.targetElement = this.element;
        this.addSubview(dropZoneView);

        WI.auditManager.loadStoredTests();
    }

    // Private

    _handleSpace(event)
    {
        if (WI.isEventTargetAnEditableField(event))
            return;

        if (WI.auditManager.runningState === WI.AuditManager.RunningState.Inactive)
            WI.auditManager.start(this.contentBrowser.currentRepresentedObjects);
        else if (WI.auditManager.runningState === WI.AuditManager.RunningState.Active)
            WI.auditManager.stop();
        else
            return;

        event.preventDefault();
    }
};

WI.AuditTabContentView.Type = "audit";
