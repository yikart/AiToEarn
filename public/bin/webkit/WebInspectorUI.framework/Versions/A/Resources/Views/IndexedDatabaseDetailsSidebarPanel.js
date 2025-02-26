/*
 * Copyright (C) 2016 Apple Inc. All rights reserved.
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

WI.IndexedDatabaseDetailsSidebarPanel = class IndexedDatabaseDetailsSidebarPanel extends WI.DetailsSidebarPanel
{
    constructor()
    {
        super("indexed-database-details", WI.UIString("Storage"));

        this.element.classList.add("indexed-database");

        this._database = null;
        this._objectStore = null;
        this._index = null;
    }

    // Public

    inspect(objects)
    {
        // Convert to a single item array if needed.
        if (!(objects instanceof Array))
            objects = [objects];

        this._database = null;
        this._objectStore = null;
        this._index = null;

        for (let object of objects) {
            if (object instanceof WI.IndexedDatabaseObjectStore) {
                console.assert(!this._database, "Shouldn't have multiple IndexedDatabase objects in the list.");
                this._objectStore = object;
                this._database = this._objectStore.parentDatabase;
            } else if (object instanceof WI.IndexedDatabaseObjectStoreIndex) {
                console.assert(!this._database, "Shouldn't have multiple IndexedDatabase objects in the list.");
                this._index = object;
                this._objectStore = this._index.parentObjectStore;
                this._database = this._objectStore.parentDatabase;
            }
        }

        let hasObject = this._database || this._objectStore || this._index;
        if (hasObject)
            this.needsLayout();

        return hasObject;
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        this._databaseNameRow = new WI.DetailsSectionSimpleRow(WI.UIString("Name"));
        this._databaseVersionRow = new WI.DetailsSectionSimpleRow(WI.UIString("Version"));
        this._databaseSecurityOriginRow = new WI.DetailsSectionSimpleRow(WI.UIString("Security Origin"));
        let databaseGroup = new WI.DetailsSectionGroup([this._databaseNameRow, this._databaseVersionRow, this._databaseSecurityOriginRow]);
        this._databaseSection = new WI.DetailsSection("indexed-database-database", WI.UIString("Database"), [databaseGroup]);

        this._objectStoreNameRow = new WI.DetailsSectionSimpleRow(WI.UIString("Name"));
        this._objectStoreKeyPathRow = new WI.DetailsSectionSimpleRow(WI.UIString("Key Path"));
        this._objectStoreAutoIncrementRow = new WI.DetailsSectionSimpleRow(WI.UIString("Auto Increment"));
        let objectStoreGroup = new WI.DetailsSectionGroup([this._objectStoreNameRow, this._objectStoreKeyPathRow, this._objectStoreAutoIncrementRow]);
        this._objectStoreSection = new WI.DetailsSection("indexed-database-object-store", WI.UIString("Object Store"), [objectStoreGroup]);

        this._indexNameRow = new WI.DetailsSectionSimpleRow(WI.UIString("Name"));
        this._indexKeyPathRow = new WI.DetailsSectionSimpleRow(WI.UIString("Key Path"));
        this._indexUniqueRow = new WI.DetailsSectionSimpleRow(WI.UIString("Unique"));
        this._indexMultiEntryRow = new WI.DetailsSectionSimpleRow(WI.UIString("Multi-Entry"));
        let indexGroup = new WI.DetailsSectionGroup([this._indexNameRow, this._indexKeyPathRow, this._indexUniqueRow, this._indexMultiEntryRow]);
        this._indexSection = new WI.DetailsSection("indexed-database-index", WI.UIString("Index"), [indexGroup]);

        this.contentView.element.appendChild(this._databaseSection.element);
        this.contentView.element.appendChild(this._objectStoreSection.element);
        this.contentView.element.appendChild(this._indexSection.element);
    }

    layout()
    {
        super.layout();

        if (!this._database)
            this._databaseSection.element.hidden = true;
        else {
            this._databaseSection.element.hidden = false;
            this._databaseSecurityOriginRow.value = this._database.securityOrigin;
            this._databaseNameRow.value = this._database.name;
            this._databaseVersionRow.value = this._database.version.toLocaleString();
        }

        if (!this._objectStore)
            this._objectStoreSection.element.hidden = true;
        else {
            this._objectStoreSection.element.hidden = false;
            this._objectStoreNameRow.value = this._objectStore.name;
            this._objectStoreKeyPathRow.value = this._keyPathString(this._objectStore.keyPath);
            this._objectStoreAutoIncrementRow.value = this._objectStore.autoIncrement ? WI.UIString("Yes") : WI.UIString("No");
        }

        if (!this._index)
            this._indexSection.element.hidden = true;
        else {
            this._indexSection.element.hidden = false;
            this._indexNameRow.value = this._index.name;
            this._indexKeyPathRow.value = this._keyPathString(this._index.keyPath);
            this._indexUniqueRow.value = this._index.unique ? WI.UIString("Yes") : WI.UIString("No");

            if (this._index.keyPath.type !== InspectorBackend.Enum.IndexedDB.KeyPathType.Array)
                this._indexMultiEntryRow.value = null;
            else
                this._indexMultiEntryRow.value = this._index.multiEntry ? WI.UIString("Yes") : WI.UIString("No");
        }
    }

    // Private

    _keyPathString(keyPath)
    {
        return keyPath ? JSON.stringify(keyPath) : emDash;
    }
};
