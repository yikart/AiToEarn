/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
 * Copyright (C) 2013 Samsung Electronics. All rights reserved.
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

// FIXME: DatabaseManager lacks advanced multi-target support. (DataBase per-target)

WI.DatabaseManager = class DatabaseManager extends WI.Object
{
    constructor()
    {
        super();

        this._enabled = false;
        this._reset();
    }

    // Agent

    get domains() { return ["Database"]; }

    activateExtraDomain(domain)
    {
        // COMPATIBILITY (iOS 14.0): Inspector.activateExtraDomains was removed in favor of a declared debuggable type

        console.assert(domain === "Database");

        for (let target of WI.targets)
            this.initializeTarget(target);
    }

    // Target

    initializeTarget(target)
    {
        if (!this._enabled)
            return;

        if (target.hasDomain("Database"))
            target.DatabaseAgent.enable();
    }

    // Public

    get databases() { return this._databaseObjects; }

    enable()
    {
        console.assert(!this._enabled);

        this._enabled = true;

        this._reset();

        for (let target of WI.targets)
            this.initializeTarget(target);

        WI.Frame.addEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);
    }

    disable()
    {
        console.assert(this._enabled);

        this._enabled = false;

        for (let target of WI.targets) {
            if (target.hasDomain("Database"))
                target.DatabaseAgent.disable();
        }

        WI.Frame.removeEventListener(WI.Frame.Event.MainResourceDidChange, this._mainResourceDidChange, this);

        this._reset();
    }

    // DatabaseObserver

    databaseWasAdded(id, host, name, version)
    {
        console.assert(this._enabled);

        var database = new WI.DatabaseObject(id, host, name, version);

        this._databaseObjects.push(database);
        this.dispatchEventToListeners(WI.DatabaseManager.Event.DatabaseWasAdded, {database});
    }

    // InspectorObserver

    inspectDatabase(id)
    {
        console.assert(this._enabled);

        var database = this._databaseForIdentifier(id);
        console.assert(database);
        if (!database)
            return;
        this.dispatchEventToListeners(WI.DatabaseManager.Event.DatabaseWasInspected, {database});
    }

    // Private

    _reset()
    {
        this._databaseObjects = [];

        this.dispatchEventToListeners(WI.DatabaseManager.Event.Cleared);
    }

    _mainResourceDidChange(event)
    {
        console.assert(event.target instanceof WI.Frame);

        if (event.target.isMainFrame())
            this._reset();
    }

    _databaseForIdentifier(id)
    {
        for (var i = 0; i < this._databaseObjects.length; ++i) {
            if (this._databaseObjects[i].id === id)
                return this._databaseObjects[i];
        }

        return null;
    }
};

WI.DatabaseManager.Event = {
    DatabaseWasAdded: "database-manager-database-was-added",
    DatabaseWasInspected: "database-manager-database-was-inspected",
    Cleared: "database-manager-cleared",
};
