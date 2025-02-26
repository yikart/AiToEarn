/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

WI.LayoutDetailsSidebarPanel = class LayoutDetailsSidebarPanel extends WI.DOMDetailsSidebarPanel
{
    constructor()
    {
        super("layout-details", WI.UIString("Layout", "Layout @ Styles Sidebar", "Title of the CSS style panel."));

        this._flexNodeSet = null;
        this._gridNodeSet = null;
        this.element.classList.add("layout-panel");
    }

    // Protected

    attached()
    {
        super.attached();

        WI.domManager.addEventListener(WI.DOMManager.Event.NodeInserted, this._handleNodeInserted, this);
        WI.domManager.addEventListener(WI.DOMManager.Event.NodeRemoved, this._handleNodeRemoved, this);

        WI.DOMNode.addEventListener(WI.DOMNode.Event.LayoutFlagsChanged, this._handleLayoutFlagsChanged, this);
        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        WI.cssManager.layoutContextTypeChangedMode = WI.CSSManager.LayoutContextTypeChangedMode.All;

        this._invalidateNodeSets();
    }

    detached()
    {
        WI.cssManager.layoutContextTypeChangedMode = WI.CSSManager.LayoutContextTypeChangedMode.Observed;

        WI.domManager.removeEventListener(WI.DOMManager.Event.NodeInserted, this._handleNodeInserted, this);
        WI.domManager.removeEventListener(WI.DOMManager.Event.NodeRemoved, this._handleNodeRemoved, this);

        WI.DOMNode.removeEventListener(WI.DOMNode.Event.LayoutFlagsChanged, this._handleLayoutFlagsChanged, this);
        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        super.detached();
    }

    initialLayout()
    {
        this._gridOptionsDetailsSectionRow = new WI.DetailsSectionRow;

        let gridSettingsGroup = new WI.SettingsGroup(WI.UIString("Page Overlay Options", "Page Overlay Options @ Layout Panel Grid Section Header", "Heading for list of grid overlay options"));
        gridSettingsGroup.addSetting(WI.settings.gridOverlayShowTrackSizes, WI.UIString("Track Sizes", "Track sizes @ Layout Panel Overlay Options", "Label for option to toggle the track sizes setting for CSS grid overlays"));
        gridSettingsGroup.addSetting(WI.settings.gridOverlayShowLineNumbers, WI.UIString("Line Numbers", "Line numbers @ Layout Panel Overlay Options", "Label for option to toggle the line numbers setting for CSS grid overlays"));
        gridSettingsGroup.addSetting(WI.settings.gridOverlayShowLineNames, WI.UIString("Line Names", "Line names @ Layout Panel Overlay Options", "Label for option to toggle the line names setting for CSS grid overlays"));
        gridSettingsGroup.addSetting(WI.settings.gridOverlayShowAreaNames, WI.UIString("Area Names", "Area names @ Layout Panel Overlay Options", "Label for option to toggle the area names setting for CSS grid overlays"));
        gridSettingsGroup.addSetting(WI.settings.gridOverlayShowExtendedGridLines, WI.UIString("Extended Grid Lines", "Show extended lines @ Layout Panel Overlay Options", "Label for option to toggle the extended lines setting for CSS grid overlays"));
        this._gridOptionsDetailsSectionRow.element.append(gridSettingsGroup.element);

        this._gridNodesDetailsSectionRow = new WI.DetailsSectionRow(WI.UIString("No CSS Grid Containers", "No CSS Grid Containers @ Layout Details Sidebar Panel", "Message shown when there are no CSS Grid containers on the inspected page."));

        this._gridNodesSection = new WI.NodeOverlayListSection("grid", WI.UIString("Grid Overlays", "Page Overlays @ Layout Sidebar Section Header", "Heading for list of grid nodes"));

        let gridDetailsSection = new WI.DetailsSection("layout-css-grid", WI.UIString("Grid", "Grid @ Elements details sidebar", "CSS Grid layout section name"), [
            new WI.DetailsSectionGroup([this._gridOptionsDetailsSectionRow]),
            new WI.DetailsSectionGroup([this._gridNodesDetailsSectionRow]),
        ]);
        this.contentView.element.appendChild(gridDetailsSection.element);

        this._flexOptionsDetailsSectionRow = new WI.DetailsSectionRow;

        let flexSettingsGroup = new WI.SettingsGroup(WI.UIString("Page Overlay Options", "Page Overlay Options @ Layout Panel Flex Section Header", "Heading for list of flex overlay options"));
        flexSettingsGroup.addSetting(WI.settings.flexOverlayShowOrderNumbers, WI.UIString("Order Numbers", "Order Numbers @ Layout Panel Overlay Options", "Label for option to toggle the order numbers setting for CSS flex overlays"));
        this._flexOptionsDetailsSectionRow.element.append(flexSettingsGroup.element);

        this._flexNodesDetailsSectionRow = new WI.DetailsSectionRow(WI.UIString("No CSS Flex Containers", "No CSS Flex Containers @ Layout Details Sidebar Panel", "Message shown when there are no CSS Flex containers on the inspected page."));

        this._flexNodesSection = new WI.NodeOverlayListSection("flex", WI.UIString("Flexbox Overlays", "Page Overlays for Flex containers @ Layout Sidebar Section Header", "Heading for list of flex container nodes"));

        let flexDetailsSection = new WI.DetailsSection("layout-css-flexbox", WI.UIString("Flexbox", "Flexbox @ Elements details sidebar", "Flexbox layout section name"), [
            new WI.DetailsSectionGroup([this._flexOptionsDetailsSectionRow]),
            new WI.DetailsSectionGroup([this._flexNodesDetailsSectionRow]),
        ]);
        this.contentView.element.appendChild(flexDetailsSection.element);

    }

    layout()
    {
        super.layout();

        if (!this._gridNodeSet || !this._flexNodeSet)
            this._refreshNodeSets();

        let showSectionIfNotEmpty = (section, row, nodeSet) => {
            if (nodeSet.size) {
                row.hideEmptyMessage();
                row.element.appendChild(section.element);

                if (!section.isAttached)
                    this.addSubview(section);

                section.nodeSet = nodeSet;
            } else {
                row.showEmptyMessage();

                if (section.isAttached)
                    this.removeSubview(section);
            }
        };
        showSectionIfNotEmpty(this._gridNodesSection, this._gridNodesDetailsSectionRow, this._gridNodeSet);
        showSectionIfNotEmpty(this._flexNodesSection, this._flexNodesDetailsSectionRow, this._flexNodeSet);
    }

    // Private

    _handleNodeInserted(event)
    {
        this._invalidateNodeSets();
        this.needsLayout();
    }

    _handleNodeRemoved(event)
    {
        let domNode = event.target.node;
        this._removeNodeFromNodeSets(domNode);
        this.needsLayout();
    }

    _handleLayoutFlagsChanged(event)
    {
        let domNode = event.target;
        if (domNode.layoutContextType)
            this._invalidateNodeSets();
        else
            this._removeNodeFromNodeSets(domNode);

        this.needsLayout();
    }

    _mainResourceDidChange(event)
    {
        if (!event.target.isMainFrame())
            return;

        this.needsLayout();
    }

    _removeNodeFromNodeSets(domNode)
    {
        this._flexNodeSet?.delete(domNode);
        this._gridNodeSet?.delete(domNode);
    }

    _invalidateNodeSets()
    {
        this._flexNodeSet = null;
        this._gridNodeSet = null;
    }

    _refreshNodeSets()
    {
        this._gridNodeSet = new Set;
        this._flexNodeSet = new Set;

        for (let node of WI.domManager.attachedNodes({filter: (node) => node.layoutContextType})) {
            switch (node.layoutContextType) {
            case WI.DOMNode.LayoutFlag.Grid:
                this._gridNodeSet.add(node);
                break;

            case WI.DOMNode.LayoutFlag.Flex:
                this._flexNodeSet.add(node);
                break;

            default:
                console.assert(false, this.representedObject.layoutContextType);
                break;
            }
        }
    }
};
