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

WI.ObjectStore = class ObjectStore
{
    constructor(name, options = {})
    {
        this._name = name;
        this._options = options;
    }

    // Static

    static supported()
    {
        return (!window.InspectorTest || WI.ObjectStore.__testObjectStore) && window.indexedDB;
    }

    static async reset()
    {
        if (WI.ObjectStore._database)
            WI.ObjectStore._database.close();

        await window.indexedDB.deleteDatabase(ObjectStore._databaseName);
    }

    static get _databaseName()
    {
        let inspectionLevel = InspectorFrontendHost ? InspectorFrontendHost.inspectionLevel : 1;
        let levelString = (inspectionLevel > 1) ? "-" + inspectionLevel : "";
        return "com.apple.WebInspector" + levelString;
    }

    static _open(callback)
    {
        if (WI.ObjectStore._database) {
            callback(WI.ObjectStore._database);
            return;
        }

        if (Array.isArray(WI.ObjectStore._databaseCallbacks)) {
            WI.ObjectStore._databaseCallbacks.push(callback);
            return;
        }

        WI.ObjectStore._databaseCallbacks = [callback];

        const version = 8; // Increment this for every edit to `WI.objectStores`.

        let databaseRequest = window.indexedDB.open(WI.ObjectStore._databaseName, version);
        databaseRequest.addEventListener("upgradeneeded", (event) => {
            let database = databaseRequest.result;

            let objectStores = Object.values(WI.objectStores);
            if (WI.ObjectStore.__testObjectStore)
                objectStores.push(WI.ObjectStore.__testObjectStore);

            let existingNames = new Set;
            for (let objectStore of objectStores) {
                if (!database.objectStoreNames.contains(objectStore._name))
                    database.createObjectStore(objectStore._name, objectStore._options);

                existingNames.add(objectStore._name);
            }

            for (let objectStoreName of database.objectStoreNames) {
                if (!existingNames.has(objectStoreName))
                    database.deleteObjectStore(objectStoreName);
            }
        });
        databaseRequest.addEventListener("success", (successEvent) => {
            WI.ObjectStore._database = databaseRequest.result;
            WI.ObjectStore._database.addEventListener("close", (closeEvent) => {
                WI.ObjectStore._database = null;
            });

            for (let databaseCallback of WI.ObjectStore._databaseCallbacks)
                databaseCallback(WI.ObjectStore._database);

            WI.ObjectStore._databaseCallbacks = null;
        });
    }

    // Public

    get keyPath()
    {
        return (this._options || {}).keyPath;
    }

    associateObject(object, key, value)
    {
        if (typeof value === "object")
            value = this._resolveKeyPath(value, key).value;

        let resolved = this._resolveKeyPath(object, key);
        resolved.object[resolved.key] = value;
    }

    async get(...args)
    {
        if (!WI.ObjectStore.supported())
            return undefined;

        return this._operation("readonly", (objectStore) => objectStore.get(...args));
    }

    async getAll(...args)
    {
        if (!WI.ObjectStore.supported())
            return [];

        return this._operation("readonly", (objectStore) => objectStore.getAll(...args));
    }

    async getAllKeys(...args)
    {
        if (!WI.ObjectStore.supported())
            return [];

        return this._operation("readonly", (objectStore) => objectStore.getAllKeys(...args));
    }

    async put(...args)
    {
        if (!WI.ObjectStore.supported())
            return undefined;

        return this._operation("readwrite", (objectStore) => objectStore.put(...args));
    }

    async putObject(object, ...args)
    {
        if (!WI.ObjectStore.supported())
            return undefined;

        console.assert(typeof object.toJSON === "function", "ObjectStore cannot store an object without JSON serialization", object.constructor.name);
        let result = await this.put(object.toJSON(WI.ObjectStore.toJSONSymbol), ...args);
        this.associateObject(object, args[0], result);
        return result;
    }

    async delete(...args)
    {
        if (!WI.ObjectStore.supported())
            return undefined;

        return this._operation("readwrite", (objectStore) => objectStore.delete(...args));
    }

    async deleteObject(object, ...args)
    {
        if (!WI.ObjectStore.supported())
            return undefined;

        return this.delete(this._resolveKeyPath(object).value, ...args);
    }

    async clear(...args)
    {
        if (!WI.ObjectStore.supported())
            return undefined;

        return this._operation("readwrite", (objectStore) => objectStore.clear(...args));
    }

    // Private

    _resolveKeyPath(object, keyPath)
    {
        keyPath = keyPath || this._options.keyPath || "";

        let parts = keyPath.split(".");
        let key = parts.splice(-1, 1);
        while (parts.length) {
            if (!object.hasOwnProperty(parts[0]))
                break;
            object = object[parts.shift()];
        }

        if (parts.length)
            key = parts.join(".") + "." + key;

        return {
            object,
            key,
            value: object[key],
        };
    }

    async _operation(mode, func)
    {
        // IndexedDB transactions will auto-close if there are no active operations at the end of a
        // microtask, so we need to do everything using event listeners instead of promises.
        return new Promise((resolve, reject) => {
            WI.ObjectStore._open((database) => {
                let transaction = database.transaction([this._name], mode);
                let objectStore = transaction.objectStore(this._name);
                let request = null;

                try {
                    request = func(objectStore);
                } catch (e) {
                    reject(e);
                    return;
                }

                function listener(event) {
                    transaction.removeEventListener("complete", listener);
                    transaction.removeEventListener("error", listener);
                    request.removeEventListener("success", listener);
                    request.removeEventListener("error", listener);

                    if (request.error) {
                        reject(request.error);
                        return;
                    }

                    resolve(request.result);
                }
                transaction.addEventListener("complete", listener, {once: true});
                transaction.addEventListener("error", listener, {once: true});
                request.addEventListener("success", listener, {once: true});
                request.addEventListener("error", listener, {once: true});
            });
        });
    }
};

WI.ObjectStore._database = null;
WI.ObjectStore._databaseCallbacks = null;

WI.ObjectStore.toJSONSymbol = Symbol("ObjectStore-toJSON");

// Be sure to update the `version` above when making changes.
WI.objectStores = {
    // Version 1
    audits: new WI.ObjectStore("audit-manager-tests", {keyPath: "__id", autoIncrement: true}),

    // Version 2
    breakpoints: new WI.ObjectStore("debugger-breakpoints", {keyPath: "__id"}),

    // Version 3
    domBreakpoints: new WI.ObjectStore("dom-debugger-dom-breakpoints", {keyPath: "__id"}),
    eventBreakpoints: new WI.ObjectStore("dom-debugger-event-breakpoints", {keyPath: "__id"}),
    urlBreakpoints: new WI.ObjectStore("dom-debugger-url-breakpoints", {keyPath: "__id"}),

    // Version 4
    localResourceOverrides: new WI.ObjectStore("local-resource-overrides", {keyPath: "__id"}),

    // Version 5
    general: new WI.ObjectStore("general"),

    // Version 6
    cssPropertyNameCounts: new WI.ObjectStore("css-property-name-counts"),

    // Version 7
    symbolicBreakpoints: new WI.ObjectStore("debugger-symbolic-breakpoints", {keyPath: "__id"}),

    // Version 8
    consoleSnippets: new WI.ObjectStore("console-snippets", {keyPath: "__id"}),
};
