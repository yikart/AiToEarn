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

WI.DatabaseTableContentView = class DatabaseTableContentView extends WI.ContentView
{
    constructor(representedObject)
    {
        super(representedObject);

        this.element.classList.add("database-table");

        this._refreshButtonNavigationItem = new WI.ButtonNavigationItem("database-table-refresh", WI.UIString("Refresh"), "Images/ReloadFull.svg", 13, 13);
        this._refreshButtonNavigationItem.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._refreshButtonClicked, this);
        this._messageTextViewElement = null;

        this.update();
    }

    // Public

    get navigationItems()
    {
        return [this._refreshButtonNavigationItem];
    }

    update()
    {
        this.representedObject.database.executeSQL("SELECT * FROM \"" + this._escapeTableName(this.representedObject.name) + "\"", this._queryFinished.bind(this), this._queryError.bind(this));
    }

    saveToCookie(cookie)
    {
        cookie.type = WI.ContentViewCookieType.DatabaseTable;
        cookie.host = this.representedObject.host;
        cookie.name = this.representedObject.name;
        cookie.database = this.representedObject.database.name;
    }

    get scrollableElements()
    {
        if (!this._dataGrid)
            return [];
        return [this._dataGrid.scrollContainer];
    }

    // Private

    _escapeTableName(name)
    {
        return name.replace(/"/g, "\"\"");
    }

    _queryFinished(columnNames, values)
    {
        // It would be nice to do better than creating a new data grid each time the table is updated, but the table updating
        // doesn't happen very frequently. Additionally, using DataGrid's createSortableDataGrid makes our code much cleaner and it knows
        // how to sort arbitrary columns.
        if (this._dataGrid) {
            this.removeSubview(this._dataGrid);
            this._dataGrid = null;
        }

        if (this._messageTextViewElement)
            this._messageTextViewElement.remove();

        if (columnNames.length) {
            this._dataGrid = WI.DataGrid.createSortableDataGrid(columnNames, values);

            this.addSubview(this._dataGrid);
            this._dataGrid.updateLayout();
            return;
        }

        // We were returned a table with no columns. This can happen when a table has
        // no data, the SELECT query only returns column names when there is data.
        this._messageTextViewElement = WI.createMessageTextView(WI.UIString("The \u201C%s\u201D\ntable is empty.").format(this.representedObject.name), false);
        this.element.appendChild(this._messageTextViewElement);
    }

    _queryError(error)
    {
        if (this._dataGrid) {
            this.removeSubview(this._dataGrid);
            this._dataGrid = null;
        }

        if (this._messageTextViewElement)
            this._messageTextViewElement.remove();

        this._messageTextViewElement = WI.createMessageTextView(WI.UIString("An error occurred trying to read the \u201C%s\u201D table.").format(this.representedObject.name), true);
        this.element.appendChild(this._messageTextViewElement);
    }

    _refreshButtonClicked()
    {
        this.update();
    }
};
