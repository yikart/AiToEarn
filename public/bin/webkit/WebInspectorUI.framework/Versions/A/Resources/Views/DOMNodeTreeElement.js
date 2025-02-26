/*
 * Copyright (C) 2017 Apple Inc. All rights reserved.
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

WI.DOMNodeTreeElement = class DOMNodeTreeElement extends WI.GeneralTreeElement
{
    constructor(domNode)
    {
        console.assert(domNode instanceof WI.DOMNode);

        const subtitle = null;
        super("dom-node", domNode.displayName, subtitle, domNode, {hasChildren: true});

        this.status = WI.linkifyNodeReferenceElement(domNode, WI.createGoToArrowButton());
        this.tooltipHandledSeparately = true;
    }

    // Protected

    ondelete()
    {
        // We set this flag so that TreeOutlines that will remove this
        // BreakpointTreeElement will know whether it was deleted from
        // within the TreeOutline or from outside it (e.g. TextEditor).
        this.__deletedViaDeleteKeyboardShortcut = true;

        WI.domDebuggerManager.removeDOMBreakpointsForNode(this.representedObject);
        WI.domManager.removeEventListenerBreakpointsForNode(this.representedObject);

        return true;
    }

    populateContextMenu(contextMenu, event)
    {
        contextMenu.appendSeparator();

        WI.appendContextMenuItemsForDOMNodeBreakpoints(contextMenu, this.representedObject);

        contextMenu.appendSeparator();

        contextMenu.appendItem(WI.repeatedUIString.revealInDOMTree(), () => {
            WI.domManager.inspectElement(this.representedObject.id, {
                initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
            });
        });
    }
};
