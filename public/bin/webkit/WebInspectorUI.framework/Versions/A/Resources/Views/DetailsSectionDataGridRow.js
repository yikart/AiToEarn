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

WI.DetailsSectionDataGridRow = class DetailsSectionDataGridRow extends WI.DetailsSectionRow
{
    constructor(dataGrid, emptyMessage)
    {
        super(emptyMessage);

        this.element.classList.add("data-grid");

        this.dataGrid = dataGrid;
    }

    // Public

    get dataGrid()
    {
        return this._dataGrid;
    }

    set dataGrid(dataGrid)
    {
        if (this._dataGrid === dataGrid)
            return;

        this._dataGrid = dataGrid || null;

        if (dataGrid) {
            dataGrid.inline = true;
            dataGrid.variableHeightRows = true;

            this.hideEmptyMessage();
            this.element.appendChild(dataGrid.element);

            dataGrid.updateLayoutIfNeeded();
        } else
            this.showEmptyMessage();
    }

    sizeDidChange()
    {
        // FIXME: <https://webkit.org/b/152269> Web Inspector: Convert DetailsSection classes to use View
        if (this._dataGrid)
            this._dataGrid.sizeDidChange();
    }
};
