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

WI.IndexedDatabaseContentView = class IndexedDatabaseContentView extends WI.ContentView
{
    constructor(database)
    {
        super(database);

        this._element.classList.add("indexed-database");

        this._databaseHostRow = new WI.DetailsSectionSimpleRow(WI.UIString("Host"));
        this._databaseSecurityOriginRow = new WI.DetailsSectionSimpleRow(WI.UIString("Security Origin"));
        this._databaseVersionRow = new WI.DetailsSectionSimpleRow(WI.UIString("Version"));
        this._databaseGroup = new WI.DetailsSectionGroup([this._databaseHostRow, this._databaseSecurityOriginRow, this._databaseVersionRow]);
        this._databaseSection = new WI.DetailsSection("indexed-database-details", WI.UIString("Database"), [this._databaseGroup]);

        this.element.append(this._databaseSection.element);

        this._databaseHostRow.value = database.host;
        this._databaseSecurityOriginRow.value = database.securityOrigin;
        this._databaseVersionRow.value = database.version.toLocaleString();
    }
};
