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

WI.RuntimeManager = class RuntimeManager extends WI.Object
{
    constructor()
    {
        super();

        this._activeExecutionContext = null;

        WI.settings.consoleSavedResultAlias.addEventListener(WI.Setting.Event.Changed, function(event) {
            for (let target of WI.targets) {
                // COMPATIBILITY (iOS 12.2): Runtime.setSavedResultAlias did not exist.
                if (target.hasCommand("Runtime.setSavedResultAlias"))
                    target.RuntimeAgent.setSavedResultAlias(WI.settings.consoleSavedResultAlias.value);
            }
        }, this);
    }

    // Static

    static supportsAwaitPromise()
    {
        // COMPATIBILITY (iOS 12): Runtime.awaitPromise did not exist.
        return InspectorBackend.hasCommand("Runtime.awaitPromise");
    }

    static preferredSavedResultPrefix()
    {
        // COMPATIBILITY (iOS 12.2): Runtime.setSavedResultAlias did not exist.
        if (!InspectorBackend.hasCommand("Runtime.setSavedResultAlias"))
            return "$";
        return WI.settings.consoleSavedResultAlias.value || "$";
    }

    // Target

    initializeTarget(target)
    {
        target.RuntimeAgent.enable();

        if (WI.settings.showJavaScriptTypeInformation.value)
            target.RuntimeAgent.enableTypeProfiler();

        if (WI.settings.enableControlFlowProfiler.value)
            target.RuntimeAgent.enableControlFlowProfiler();

        // COMPATIBILITY (iOS 12.2): Runtime.setSavedResultAlias did not exist.
        if (target.hasCommand("Runtime.setSavedResultAlias") && WI.settings.consoleSavedResultAlias.value)
            target.RuntimeAgent.setSavedResultAlias(WI.settings.consoleSavedResultAlias.value);
    }

    // Public

    get activeExecutionContext()
    {
        return this._activeExecutionContext;
    }

    set activeExecutionContext(executionContext)
    {
        if (this._activeExecutionContext === executionContext)
            return;

        this._activeExecutionContext = executionContext;

        this.dispatchEventToListeners(WI.RuntimeManager.Event.ActiveExecutionContextChanged);
    }

    evaluateInInspectedWindow(expression, options, callback)
    {
        if (!this._activeExecutionContext) {
            callback(null, false);
            return;
        }

        let {objectGroup, includeCommandLineAPI, doNotPauseOnExceptionsAndMuteConsole, returnByValue, generatePreview, saveResult, emulateUserGesture, sourceURLAppender} = options;

        includeCommandLineAPI = includeCommandLineAPI || false;
        doNotPauseOnExceptionsAndMuteConsole = doNotPauseOnExceptionsAndMuteConsole || false;
        returnByValue = returnByValue || false;
        generatePreview = generatePreview || false;
        saveResult = saveResult || false;
        emulateUserGesture = emulateUserGesture || false;
        sourceURLAppender = sourceURLAppender || appendWebInspectorSourceURL;

        console.assert(objectGroup, "RuntimeManager.evaluateInInspectedWindow should always be called with an objectGroup");
        console.assert(typeof sourceURLAppender === "function");

        if (!expression) {
            // There is no expression, so the completion should happen against global properties.
            expression = "this";
        } else if (/^\s*\{/.test(expression) && /\}\s*$/.test(expression)) {
            // Transform {a:1} to ({a:1}) so it is treated like an object literal instead of a block with a label.
            expression = "(" + expression + ")";
        } else if (/\bawait\b/.test(expression)) {
            // Transform `await <expr>` into an async function assignment.
            expression = this._tryApplyAwaitConvenience(expression);
        }

        expression = sourceURLAppender(expression);

        let target = this._activeExecutionContext.target;
        let executionContextId = this._activeExecutionContext.id;

        if (WI.debuggerManager.activeCallFrame) {
            target = WI.debuggerManager.activeCallFrame.target;
            executionContextId = target.executionContext.id;
        }

        function evalCallback(error, result, wasThrown, savedResultIndex)
        {
            this.dispatchEventToListeners(WI.RuntimeManager.Event.DidEvaluate, {objectGroup});

            if (error) {
                console.error(error);
                callback(null, false);
                return;
            }

            if (returnByValue)
                callback(null, wasThrown, wasThrown ? null : result, savedResultIndex);
            else
                callback(WI.RemoteObject.fromPayload(result, target), wasThrown, savedResultIndex);
        }

        if (WI.debuggerManager.activeCallFrame) {
            target.DebuggerAgent.evaluateOnCallFrame.invoke({
                callFrameId: WI.debuggerManager.activeCallFrame.id,
                expression,
                objectGroup,
                includeCommandLineAPI,
                doNotPauseOnExceptionsAndMuteConsole,
                returnByValue,
                generatePreview,
                saveResult,
                emulateUserGesture, // COMPATIBILITY (iOS 13): "emulateUserGesture" did not exist yet.
            }, evalCallback.bind(this));
            return;
        }

        target.RuntimeAgent.evaluate.invoke({
            expression,
            objectGroup,
            includeCommandLineAPI,
            doNotPauseOnExceptionsAndMuteConsole,
            contextId: executionContextId,
            returnByValue,
            generatePreview,
            saveResult,
            emulateUserGesture, // COMPATIBILITY (iOS 12.2): "emulateUserGesture" did not exist yet.
        }, evalCallback.bind(this));
    }

    saveResult(remoteObject, callback)
    {
        console.assert(remoteObject instanceof WI.RemoteObject);

        let target = this._activeExecutionContext.target;
        let executionContextId = this._activeExecutionContext.id;

        function mycallback(error, savedResultIndex)
        {
            callback(savedResultIndex);
        }

        if (remoteObject.objectId)
            target.RuntimeAgent.saveResult(remoteObject.asCallArgument(), mycallback);
        else
            target.RuntimeAgent.saveResult(remoteObject.asCallArgument(), executionContextId, mycallback);
    }

    // Private

    _tryApplyAwaitConvenience(originalExpression)
    {
        let esprimaSyntaxTree;

        // Do not transform if the original code parses just fine.
        try {
            esprima.parse(originalExpression);
            return originalExpression;
        } catch { }

        // Do not transform if the async function version does not parse.
        try {
            esprimaSyntaxTree = esprima.parse("(async function(){" + originalExpression + "})");
        } catch {
            return originalExpression;
        }

        // Assert expected AST produced by our wrapping code.
        console.assert(esprimaSyntaxTree.type === "Program");
        console.assert(esprimaSyntaxTree.body.length === 1);
        console.assert(esprimaSyntaxTree.body[0].type === "ExpressionStatement");
        console.assert(esprimaSyntaxTree.body[0].expression.type === "FunctionExpression");
        console.assert(esprimaSyntaxTree.body[0].expression.async);
        console.assert(esprimaSyntaxTree.body[0].expression.body.type === "BlockStatement");

        // Do not transform if there is more than one statement.
        let asyncFunctionBlock = esprimaSyntaxTree.body[0].expression.body;
        if (asyncFunctionBlock.body.length !== 1)
            return originalExpression;

        // Extract the variable name for transformation.
        let variableName;
        let anonymous = false;
        let declarationKind = "var";
        let awaitPortion;
        let statement = asyncFunctionBlock.body[0];
        if (statement.type === "ExpressionStatement"
            && statement.expression.type === "AwaitExpression") {
            // await <expr>
            anonymous = true;
        } else if (statement.type === "ExpressionStatement"
            && statement.expression.type === "AssignmentExpression"
            && statement.expression.right.type === "AwaitExpression"
            && statement.expression.left.type === "Identifier") {
            // x = await <expr>
            variableName = statement.expression.left.name;
            awaitPortion = originalExpression.substring(originalExpression.indexOf("await"));
        } else if (statement.type === "VariableDeclaration"
            && statement.declarations.length === 1
            && statement.declarations[0].init.type === "AwaitExpression"
            && statement.declarations[0].id.type === "Identifier") {
            // var x = await <expr>
            variableName = statement.declarations[0].id.name;
            declarationKind = statement.kind;
            awaitPortion = originalExpression.substring(originalExpression.indexOf("await"));
        } else {
            // Do not transform if this was not one of the simple supported syntaxes.
            return originalExpression;
        }

        if (anonymous) {
            return `
(async function() {
    try {
        let result = ${originalExpression};
        console.info("%o", result);
    } catch (e) {
        console.error(e);
    }
})();
undefined`;
        }

        return `${declarationKind} ${variableName};
(async function() {
    try {
        ${variableName} = ${awaitPortion};
        console.info("%o", ${variableName});
    } catch (e) {
        console.error(e);
    }
})();
undefined;`;
    }
};

WI.RuntimeManager.ConsoleObjectGroup = "console";
WI.RuntimeManager.TopLevelExecutionContextIdentifier = undefined;

WI.RuntimeManager.Event = {
    DidEvaluate: "runtime-manager-did-evaluate",
    DefaultExecutionContextChanged: "runtime-manager-default-execution-context-changed",
    ActiveExecutionContextChanged: "runtime-manager-active-execution-context-changed",
};
