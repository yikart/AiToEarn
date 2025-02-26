/*
 * Copyright (C) 2013 Apple Inc. All rights reserved.
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

WI.CallFrame = class CallFrame
{
    constructor(target, {id, sourceCodeLocation, functionName, thisObject, scopeChain, nativeCode, programCode, isTailDeleted, blackboxed} = {})
    {
        console.assert(target instanceof WI.Target, target);
        console.assert(!sourceCodeLocation || sourceCodeLocation instanceof WI.SourceCodeLocation, sourceCodeLocation);
        console.assert(!thisObject || thisObject instanceof WI.RemoteObject, thisObject);
        console.assert(!scopeChain || scopeChain.every((item) => item instanceof WI.ScopeChainNode), scopeChain);

        this._isConsoleEvaluation = sourceCodeLocation && isWebInspectorConsoleEvaluationScript(sourceCodeLocation.sourceCode.sourceURL);
        if (this._isConsoleEvaluation) {
            functionName = WI.UIString("Console Evaluation");
            programCode = true;
        }

        this._target = target;
        this._id = id || null;
        this._sourceCodeLocation = sourceCodeLocation || null;
        this._functionName = functionName || "";
        this._thisObject = thisObject || null;
        this._scopeChain = scopeChain || [];
        this._nativeCode = nativeCode || false;
        this._programCode = programCode || false;
        this._isTailDeleted = isTailDeleted || false;
        this._blackboxed = blackboxed || false;
    }

    // Public

    get target() { return this._target; }
    get id() { return this._id; }
    get sourceCodeLocation() { return this._sourceCodeLocation; }
    get functionName() { return this._functionName; }
    get nativeCode() { return this._nativeCode; }
    get programCode() { return this._programCode; }
    get thisObject() { return this._thisObject; }
    get scopeChain() { return this._scopeChain; }
    get isTailDeleted() { return this._isTailDeleted; }
    get blackboxed() { return this._blackboxed; }
    get isConsoleEvaluation() { return this._isConsoleEvaluation; }

    get displayName()
    {
        return this._functionName || WI.UIString("(anonymous function)");
    }

    isEqual(other)
    {
        if (!other)
            return false;

        if (this._sourceCodeLocation && other._sourceCodeLocation)
            return this._sourceCodeLocation.isEqual(other._sourceCodeLocation);

        return false;
    }

    saveIdentityToCookie()
    {
        // Do nothing. The call frame is torn down when the inspector closes, and
        // we shouldn't restore call frame content views across debugger pauses.
    }

    collectScopeChainVariableNames(callback)
    {
        let result = ["this", "__proto__"];

        var pendingRequests = this._scopeChain.length;

        function propertiesCollected(properties)
        {
            for (var i = 0; properties && i < properties.length; ++i)
                result.push(properties[i].name);

            if (--pendingRequests)
                return;

            callback(result);
        }

        for (var i = 0; i < this._scopeChain.length; ++i)
            this._scopeChain[i].objects[0].getPropertyDescriptors(propertiesCollected);
    }

    mergedScopeChain()
    {
        let mergedScopes = [];

        // Scopes list goes from top/local (1) to bottom/global (5)
        //   [scope1, scope2, scope3, scope4, scope5]
        let scopes = this._scopeChain.slice();

        // Merge similiar scopes. Some function call frames may have multiple
        // top level closure scopes (one for `var`s one for `let`s) that can be
        // combined to a single scope of variables. Go in reverse order so we
        // merge the first two closure scopes with the same name. Also mark
        // the first time we see a new name, so we know the base for the name.
        //   [scope1&2, scope3, scope4, scope5]
        //      foo      bar     GLE    global
        let lastMarkedHash = null;
        function markAsBaseIfNeeded(scope) {
            if (!scope.hash)
                return false;
            if (scope.type !== WI.ScopeChainNode.Type.Closure)
                return false;
            if (scope.hash === lastMarkedHash)
                return false;
            lastMarkedHash = scope.hash;
            scope.__baseClosureScope = true;
            return true;
        }

        function shouldMergeClosureScopes(youngScope, oldScope, lastMerge) {
            if (!youngScope || !oldScope)
                return false;

            // Don't merge unknown locations.
            if (!youngScope.hash || !oldScope.hash)
                return false;

            // Only merge closure scopes.
            if (youngScope.type !== WI.ScopeChainNode.Type.Closure)
                return false;
            if (oldScope.type !== WI.ScopeChainNode.Type.Closure)
                return false;

            // Don't merge if they are not the same.
            if (youngScope.hash !== oldScope.hash)
                return false;

            // Don't merge if there was already a merge.
            if (lastMerge && youngScope.hash === lastMerge.hash)
                return false;

            return true;
        }

        let lastScope = null;
        let lastMerge = null;
        for (let i = scopes.length - 1; i >= 0; --i) {
            let scope = scopes[i];
            markAsBaseIfNeeded(scope);
            if (shouldMergeClosureScopes(scope, lastScope, lastMerge)) {
                console.assert(lastScope.__baseClosureScope);
                let type = WI.ScopeChainNode.Type.Closure;
                let objects = lastScope.objects.concat(scope.objects);
                let merged = new WI.ScopeChainNode(type, objects, scope.name, scope.location);
                merged.__baseClosureScope = true;
                console.assert(objects.length === 2);

                mergedScopes.pop(); // Remove the last.
                mergedScopes.push(merged); // Add the merged scope.

                lastMerge = merged;
                lastScope = null;
            } else {
                mergedScopes.push(scope);

                lastMerge = null;
                lastScope = scope;
            }
        }

        mergedScopes = mergedScopes.reverse();

        // Mark the first Closure as Local if the name matches this call frame.
        for (let scope of mergedScopes) {
            if (scope.type === WI.ScopeChainNode.Type.Closure) {
                if (scope.name === this._functionName)
                    scope.convertToLocalScope();
                break;
            }
        }

        return mergedScopes;
    }

    // Static

    static functionNameFromPayload(payload)
    {
        let functionName = payload.functionName;
        if (functionName === "global code")
            return WI.UIString("Global Code");
        if (functionName === "eval code")
            return WI.UIString("Eval Code");
        if (functionName === "module code")
            return WI.UIString("Module Code");
        return functionName;
    }

    static programCodeFromPayload(payload)
    {
        return payload.functionName.endsWith(" code");
    }

    static fromDebuggerPayload(target, payload, scopeChain, sourceCodeLocation)
    {
        return new WI.CallFrame(target, {
            id: payload.callFrameId,
            sourceCodeLocation,
            functionName: WI.CallFrame.functionNameFromPayload(payload),
            thisObject: WI.RemoteObject.fromPayload(payload.this, target),
            scopeChain,
            programCode: WI.CallFrame.programCodeFromPayload(payload),
            isTailDeleted: payload.isTailDeleted,
            blackboxed: sourceCodeLocation && !!WI.debuggerManager.blackboxDataForSourceCode(sourceCodeLocation.displaySourceCode),
        });
    }

    static fromPayload(target, payload)
    {
        console.assert(payload);

        let {url, scriptId} = payload;
        let nativeCode = false;
        let sourceCodeLocation = null;

        if (url === "[native code]") {
            nativeCode = true;
            url = null;
        } else if (url || scriptId) {
            let sourceCode = null;
            if (scriptId) {
                sourceCode = WI.debuggerManager.scriptForIdentifier(scriptId, target);
                if (sourceCode && sourceCode.resource)
                    sourceCode = sourceCode.resource;
            }
            if (!sourceCode)
                sourceCode = WI.networkManager.resourcesForURL(url).firstValue;
            if (!sourceCode)
                sourceCode = WI.debuggerManager.scriptsForURL(url, target)[0];

            if (sourceCode) {
                // The lineNumber is 1-based, but we expect 0-based.
                let lineNumber = payload.lineNumber - 1;
                sourceCodeLocation = sourceCode.createLazySourceCodeLocation(lineNumber, payload.columnNumber);
            } else {
                // Treat this as native code if we were unable to find a source.
                console.assert(!url, "We should have detected source code for something with a url");
                nativeCode = true;
                url = null;
            }
        }

        return new WI.CallFrame(target, {
            sourceCodeLocation,
            functionName: WI.CallFrame.functionNameFromPayload(payload),
            nativeCode,
            programCode: WI.CallFrame.programCodeFromPayload(payload),
            blackboxed: sourceCodeLocation && !!WI.debuggerManager.blackboxDataForSourceCode(sourceCodeLocation.displaySourceCode),
        });
    }
};
