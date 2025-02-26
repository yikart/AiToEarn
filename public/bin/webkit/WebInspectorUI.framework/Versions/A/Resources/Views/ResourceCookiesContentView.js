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

WI.ResourceCookiesContentView = class ResourceCookiesContentView extends WI.ContentView
{
    constructor(resource)
    {
        super(null);

        console.assert(resource instanceof WI.Resource);

        this._resource = resource;
        this._resource.addEventListener(WI.Resource.Event.RequestHeadersDidChange, this._resourceRequestHeadersDidChange, this);
        this._resource.addEventListener(WI.Resource.Event.ResponseReceived, this._resourceResponseReceived, this);

        this.element.classList.add("resource-details", "resource-cookies");
    }

    // Table dataSource

    tableNumberOfRows(table)
    {
        return this._dataSourceForTable(table).length;
    }

    tableSortChanged(table)
    {
        let sortComparator = this._generateSortComparator(table);
        if (!sortComparator)
            return;

        let dataSource = this._dataSourceForTable(table);
        dataSource.sort(sortComparator);
        table.reloadData();
    }

    tableIndexForRepresentedObject(table, object)
    {
        let cookies = this._dataSourceForTable(table);
        let index = cookies.indexOf(object);
        console.assert(index >= 0);
        return index;
    }

    tableRepresentedObjectForIndex(table, index)
    {
        let cookies = this._dataSourceForTable(table);
        console.assert(index >= 0 && index < cookies.length);
        return cookies[index];
    }

    // Table delegate

    tableShouldSelectRow(table, cell, column, rowIndex)
    {
        return false;
    }

    tablePopulateCell(table, cell, column, rowIndex)
    {
        let cookie = this._dataSourceForTable(table)[rowIndex];

        const checkmark = "\u2713";

        switch (column.identifier) {
        case "name":
            cell.textContent = cookie.name;
            break;
        case "value":
            cell.textContent = cookie.value;
            break;
        case "domain":
            cell.textContent = cookie.domain || emDash;
            break;
        case "path":
            cell.textContent = cookie.path || emDash;
            break;
        case "expires":
            cell.textContent = (!cookie.session && cookie.expires) ? cookie.expires.toLocaleString() : WI.UIString("Session");
            break;
        case "maxAge":
            cell.textContent = cookie.maxAge || emDash;
            break;
        case "secure":
            cell.textContent = cookie.secure ? checkmark : zeroWidthSpace;
            break;
        case "httpOnly":
            cell.textContent = cookie.httpOnly ? checkmark : zeroWidthSpace;
            break;
        case "partitioned":
            cell.textContent = cookie.partitioned ? checkmark : zeroWidthSpace;
            break;
        case "sameSite":
            cell.textContent = cookie.sameSite === WI.Cookie.SameSiteType.None ? emDash : WI.Cookie.displayNameForSameSiteType(cookie.sameSite);
            break;
        }

        return cell;
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._requestCookiesSection = new WI.ResourceDetailsSection(WI.UIString("Request Cookies"));
        this.element.appendChild(this._requestCookiesSection.element);
        this._refreshRequestCookiesSection();

        this._responseCookiesSection = new WI.ResourceDetailsSection(WI.UIString("Response Cookies"));
        this.element.appendChild(this._responseCookiesSection.element);
        this._refreshResponseCookiesSection();
    }

    // Private

    _dataSourceForTable(table)
    {
        return table === this._requestCookiesTable ? this._requestCookiesDataSource : this._responseCookiesDataSource;
    }

    _generateSortComparator(table)
    {
        let sortColumnIdentifier = table.sortColumnIdentifier;
        if (!sortColumnIdentifier)
            return null;

        let comparator;

        switch (sortColumnIdentifier) {
        case "name":
        case "value":
        case "domain":
        case "path":
        case "sameSite":
            // String.
            comparator = (a, b) => (a[sortColumnIdentifier] || "").extendedLocaleCompare(b[sortColumnIdentifier] || "");
            break;

        case "maxAge":
            // Number.
            comparator = (a, b) => {
                let aValue = a[sortColumnIdentifier];
                if (isNaN(aValue))
                    return 1;
                let bValue = b[sortColumnIdentifier];
                if (isNaN(bValue))
                    return -1;
                return aValue - bValue;
            };
            break;

        case "httpOnly":
        case "secure":
            // Boolean.
            comparator = (a, b) => a[sortColumnIdentifier] - b[sortColumnIdentifier];
            break;

        case "expires":
            // Date.
            comparator = (a, b) => {
                let aExpires = a.expires;
                if (!aExpires)
                    return 1;
                let bExpires = b.expires;
                if (!bExpires)
                    return -1;
                return aExpires.getTime() - bExpires.getTime();
            };
            break;

        default:
            console.assert("Unexpected sort column", sortColumnIdentifier);
            return null;
        }

        let reverseFactor = table.sortOrder === WI.Table.SortOrder.Ascending ? 1 : -1;
        return (a, b) => reverseFactor * comparator(a, b);
    }

    _refreshRequestCookiesSection()
    {
        let detailsElement = this._requestCookiesSection.detailsElement;
        detailsElement.removeChildren();

        if (this._resource.responseSource === WI.Resource.ResponseSource.MemoryCache) {
            this._requestCookiesSection.markIncompleteSectionWithMessage(WI.UIString("No request, served from the memory cache."));
            return;
        }

        this._requestCookiesDataSource = this._resource.requestCookies;

        if (!this._requestCookiesTable) {
            this._requestCookiesTable = new WI.Table("request-cookies", this, this, 20);
            this._requestCookiesTable.addColumn(new WI.TableColumn("name", WI.UIString("Name"), {minWidth: 150, maxWidth: 300, initialWidth: 200, resizeType: WI.TableColumn.ResizeType.Locked}));
            this._requestCookiesTable.addColumn(new WI.TableColumn("value", WI.UIString("Value"), {minWidth: 150, hideable: false}));
            if (!this._requestCookiesTable.sortColumnIdentifier) {
                this._requestCookiesTable.sortOrder = WI.Table.SortOrder.Ascending;
                this._requestCookiesTable.sortColumnIdentifier = "name";
            }
        }

        if (!this._requestCookiesDataSource.length) {
            if (this._requestCookiesTable.isAttached)
                this.removeSubview(this._requestCookiesTable);
            this._requestCookiesSection.markIncompleteSectionWithMessage(WI.UIString("No request cookies."));
        } else {
            this._requestCookiesSection.toggleIncomplete(false);
            this._requestCookiesTable.element.style.height = this._sizeForTable(this._requestCookiesTable) + "px";
            this.addSubview(this._requestCookiesTable);
            detailsElement.classList.add("has-table");
            detailsElement.appendChild(this._requestCookiesTable.element);
        }
    }

    _refreshResponseCookiesSection()
    {
        let detailsElement = this._responseCookiesSection.detailsElement;
        detailsElement.removeChildren();

        if (!this._resource.hasResponse()) {
            this._responseCookiesSection.markIncompleteSectionWithLoadingIndicator();
            return;
        }

        this._responseCookiesDataSource = this._resource.responseCookies;

        if (!this._responseCookiesTable) {
            this._responseCookiesTable = new WI.Table("request-cookies", this, this, 20);
            this._responseCookiesTable.addColumn(new WI.TableColumn("name", WI.UIString("Name"), {minWidth: 150, maxWidth: 300, initialWidth: 200, resizeType: WI.TableColumn.ResizeType.Locked}));
            this._responseCookiesTable.addColumn(new WI.TableColumn("value", WI.UIString("Value"), {minWidth: 150, hideable: false}));
            this._responseCookiesTable.addColumn(new WI.TableColumn("domain", WI.unlocalizedString("Domain"), {}));
            this._responseCookiesTable.addColumn(new WI.TableColumn("path", WI.unlocalizedString("Path"), {}));
            this._responseCookiesTable.addColumn(new WI.TableColumn("partitioned", WI.unlocalizedString("Partitioned"), {}));
            this._responseCookiesTable.addColumn(new WI.TableColumn("expires", WI.unlocalizedString("Expires"), {maxWidth: 150}));
            this._responseCookiesTable.addColumn(new WI.TableColumn("maxAge", WI.unlocalizedString("Max-Age"), {maxWidth: 90, align: "right"}));
            this._responseCookiesTable.addColumn(new WI.TableColumn("secure", WI.unlocalizedString("Secure"), {minWidth: 55, maxWidth: 65, align: "center"}));
            this._responseCookiesTable.addColumn(new WI.TableColumn("httpOnly", WI.unlocalizedString("HttpOnly"), {minWidth: 55, maxWidth: 65, align: "center"}));
            this._responseCookiesTable.addColumn(new WI.TableColumn("sameSite", WI.unlocalizedString("SameSite"), {minWidth: 55, maxWidth: 65}));
            if (!this._responseCookiesTable.sortColumnIdentifier) {
                this._responseCookiesTable.sortOrder = WI.Table.SortOrder.Ascending;
                this._responseCookiesTable.sortColumnIdentifier = "name";
            }
        }

        if (!this._responseCookiesDataSource.length) {
            if (this._responseCookiesTable.isAttached)
                this.removeSubview(this._responseCookiesTable);
            this._responseCookiesSection.markIncompleteSectionWithMessage(WI.UIString("No response cookies."));
        } else {
            this._responseCookiesSection.toggleIncomplete(false);
            this._responseCookiesTable.element.style.height = this._sizeForTable(this._responseCookiesTable) + "px";
            this.addSubview(this._responseCookiesTable);
            detailsElement.classList.add("has-table");
            detailsElement.appendChild(this._responseCookiesTable.element);
        }
    }

    _sizeForTable(table)
    {
        const headerHeight = 28;
        const borderHeight = 3;
        let rowsHeight = this._dataSourceForTable(table).length * table.rowHeight;
        return rowsHeight + headerHeight + borderHeight;
    }

    _resourceRequestHeadersDidChange(event)
    {
        this._refreshRequestCookiesSection();
    }

    _resourceResponseReceived(event)
    {
        this._refreshResponseCookiesSection();
    }
};

WI.ResourceCookiesContentView.ReferencePage = WI.ReferencePage.NetworkTab.CookiesPane;
