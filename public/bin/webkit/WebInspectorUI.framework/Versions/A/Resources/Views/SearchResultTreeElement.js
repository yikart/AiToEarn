/*
 * Copyright (C) 2013-2017 Apple Inc. All rights reserved.
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

WI.SearchResultTreeElement = class SearchResultTreeElement extends WI.GeneralTreeElement
{
    constructor(representedObject)
    {
        console.assert(representedObject instanceof WI.DOMSearchMatchObject || representedObject instanceof WI.SourceCodeSearchMatchObject);

        var title = WI.SearchResultTreeElement.truncateAndHighlightTitle(representedObject.title, representedObject.searchTerm, representedObject.textRange);
        const subtitle = null;
        super(representedObject.className, title, subtitle, representedObject);
    }

    // Static

    static truncateAndHighlightTitle(title, searchTerm, textRange)
    {
        let isRTL = WI.resolvedLayoutDirection() === WI.LayoutDirection.RTL;
        const charactersToShowBeforeSearchMatch = isRTL ? 20 : 15;
        const charactersToShowAfterSearchMatch = isRTL ? 15 : 50;

        let searchTermIndex = textRange.startColumn;
        let searchTermLength = textRange.endColumn - textRange.startColumn;

        // We should only have one line text ranges, so make sure that is the case.
        console.assert(textRange.startLine === textRange.endLine);

        // Show some characters before the matching text (if there are enough) for context. TreeOutline takes care of the truncating
        // at the end of the string.
        var modifiedTitle = null;
        if (searchTermIndex > charactersToShowBeforeSearchMatch) {
            modifiedTitle = ellipsis + title.substring(searchTermIndex - charactersToShowBeforeSearchMatch);
            searchTermIndex = charactersToShowBeforeSearchMatch + 1;
        } else
            modifiedTitle = title;

        modifiedTitle = modifiedTitle.truncateEnd(searchTermIndex + searchTermLength + charactersToShowAfterSearchMatch);

        var highlightedTitle = document.createDocumentFragment();

        highlightedTitle.append(modifiedTitle.substring(0, searchTermIndex));

        var highlightSpan = document.createElement("span");
        highlightSpan.className = "highlighted";
        highlightSpan.append(modifiedTitle.substring(searchTermIndex, searchTermIndex + searchTermLength));
        highlightedTitle.appendChild(highlightSpan);

        highlightedTitle.append(modifiedTitle.substring(searchTermIndex + searchTermLength));

        return highlightedTitle;
    }

    // Public

    get filterableData()
    {
        return {text: [this.representedObject.title]};
    }

    get synthesizedTextValue()
    {
        return this.representedObject.sourceCodeTextRange.synthesizedTextValue + ":" + this.representedObject.title;
    }

    // Protected

    populateContextMenu(contextMenu, event)
    {
        if (this.representedObject instanceof WI.DOMSearchMatchObject) {
            contextMenu.appendItem(WI.UIString("Reveal in Elements Tab"), () => {
                WI.showMainFrameDOMTree(this.representedObject.domNode, {
                    ignoreSearchTab: true,
                    initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                });
            });
        } else if (this.representedObject instanceof WI.SourceCodeSearchMatchObject) {
            contextMenu.appendItem(WI.UIString("Reveal in Sources Tab"), () => {
                WI.showOriginalOrFormattedSourceCodeTextRange(this.representedObject.sourceCodeTextRange, {
                    ignoreNetworkTab: true,
                    ignoreSearchTab: true,
                    initiatorHint: WI.TabBrowser.TabNavigationInitiator.ContextMenu,
                });
            });
        }

        super.populateContextMenu(contextMenu, event);
    }
};
