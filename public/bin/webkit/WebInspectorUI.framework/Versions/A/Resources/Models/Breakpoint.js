/*
 * Copyright (C) 2013, 2014 Apple Inc. All rights reserved.
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

WI.Breakpoint = class Breakpoint extends WI.Object
{
    constructor({disabled, condition, actions, ignoreCount, autoContinue} = {})
    {
        console.assert(!disabled || typeof disabled === "boolean", disabled);
        console.assert(!condition || typeof condition === "string", condition);
        console.assert(!actions || Array.isArray(actions), actions);
        console.assert(!ignoreCount || !isNaN(ignoreCount), ignoreCount);
        console.assert(!autoContinue || typeof autoContinue === "boolean", autoContinue);

        super();

        // This class should not be instantiated directly. Create a concrete subclass instead.
        console.assert(this.constructor !== WI.Breakpoint && this instanceof WI.Breakpoint);
        console.assert(this.constructor.ReferencePage, "Should have a link to a reference page.");

        this._disabled = disabled || false;
        this._condition = condition || "";
        this._ignoreCount = ignoreCount || 0;
        this._autoContinue = autoContinue || false;
        this._actions = actions || [];

        for (let action of this._actions)
            action.addEventListener(WI.BreakpointAction.Event.Modified, this._handleBreakpointActionModified, this);
    }

    // Import / Export

    toJSON(key)
    {
        let json = {};
        if (this._disabled)
            json.disabled = this._disabled;
        if (this.editable) {
            if (this._condition)
                json.condition = this._condition;
            if (this._ignoreCount)
                json.ignoreCount = this._ignoreCount;
            if (this._actions.length)
                json.actions = this._actions.map((action) => action.toJSON());
            if (this._autoContinue)
                json.autoContinue = this._autoContinue;
        }
        return json;
    }

    // Public

    get displayName()
    {
        throw WI.NotImplementedError.subclassMustOverride();
    }

    get special()
    {
        // Overridden by subclasses if needed.
        return false;
    }

    get removable()
    {
        // Overridden by subclasses if needed.
        return true;
    }

    get editable()
    {
        // Overridden by subclasses if needed.
        return false;
    }

    get resolved()
    {
        // Overridden by subclasses if needed.
        return WI.debuggerManager.breakpointsEnabled;
    }

    get disabled()
    {
        return this._disabled;
    }

    set disabled(disabled)
    {
        if (this._disabled === disabled)
            return;

        this._disabled = disabled || false;

        this.dispatchEventToListeners(WI.Breakpoint.Event.DisabledStateDidChange);
    }

    get condition()
    {
        return this._condition;
    }

    set condition(condition)
    {
        console.assert(this.editable, this);
        console.assert(typeof condition === "string");

        if (this._condition === condition)
            return;

        this._condition = condition;

        this.dispatchEventToListeners(WI.Breakpoint.Event.ConditionDidChange);
    }

    get ignoreCount()
    {
        console.assert(this.editable, this);

        return this._ignoreCount;
    }

    set ignoreCount(ignoreCount)
    {
        console.assert(this.editable, this);

        console.assert(ignoreCount >= 0, "Ignore count cannot be negative.");
        if (ignoreCount < 0)
            return;

        if (this._ignoreCount === ignoreCount)
            return;

        this._ignoreCount = ignoreCount;

        this.dispatchEventToListeners(WI.Breakpoint.Event.IgnoreCountDidChange);
    }

    get autoContinue()
    {
        console.assert(this.editable, this);

        return this._autoContinue;
    }

    set autoContinue(cont)
    {
        console.assert(this.editable, this);

        if (this._autoContinue === cont)
            return;

        this._autoContinue = cont;

        this.dispatchEventToListeners(WI.Breakpoint.Event.AutoContinueDidChange);
    }

    get actions()
    {
        console.assert(this.editable, this);

        return this._actions;
    }

    get probeActions()
    {
        console.assert(this.editable, this);

        return this._actions.filter(function(action) {
            return action.type === WI.BreakpointAction.Type.Probe;
        });
    }

    addAction(action, {precedingAction} = {})
    {
        console.assert(this.editable, this);
        console.assert(action instanceof WI.BreakpointAction, action);

        action.addEventListener(WI.BreakpointAction.Event.Modified, this._handleBreakpointActionModified, this);

        if (!precedingAction)
            this._actions.push(action);
        else {
            var index = this._actions.indexOf(precedingAction);
            console.assert(index !== -1);
            if (index === -1)
                this._actions.push(action);
            else
                this._actions.splice(index + 1, 0, action);
        }

        this.dispatchEventToListeners(WI.Breakpoint.Event.ActionsDidChange);
    }

    removeAction(action)
    {
        console.assert(this.editable, this);
        console.assert(action instanceof WI.BreakpointAction, action);

        var index = this._actions.indexOf(action);
        console.assert(index !== -1);
        if (index === -1)
            return;

        this._actions.splice(index, 1);

        action.removeEventListener(WI.BreakpointAction.Event.Modified, this._handleBreakpointActionModified, this);

        if (!this._actions.length)
            this.autoContinue = false;

        this.dispatchEventToListeners(WI.Breakpoint.Event.ActionsDidChange);
    }

    clearActions(type)
    {
        console.assert(this.editable, this);

        if (!type)
            this._actions = [];
        else
            this._actions = this._actions.filter(function(action) { return action.type !== type; });

        this.dispatchEventToListeners(WI.Breakpoint.Event.ActionsDidChange);
    }

    reset()
    {
        console.assert(this.editable, this);

        this.condition = "";
        this.ignoreCount = 0;
        this.autoContinue = false;
        this.clearActions();
    }

    remove()
    {
        console.assert(this.removable, this);

        // Overridden by subclasses if needed.
    }

    optionsToProtocol()
    {
        console.assert(this.editable, this);

        let payload = {};

        if (this._condition)
            payload.condition = this._condition;

        if (this._actions.length) {
            payload.actions = this._actions.map((action) => action.toProtocol()).filter((action) => {
                if (action.type !== WI.BreakpointAction.Type.Log)
                    return true;

                if (!/\$\{.*?\}/.test(action.data))
                    return true;

                let lexer = new WI.BreakpointLogMessageLexer;
                let tokens = lexer.tokenize(action.data);
                if (!tokens)
                    return false;

                let templateLiteral = tokens.reduce((text, token) => {
                    if (token.type === WI.BreakpointLogMessageLexer.TokenType.PlainText)
                        return text + token.data.escapeCharacters("`\\");
                    if (token.type === WI.BreakpointLogMessageLexer.TokenType.Expression)
                        return text + "${" + token.data + "}";
                    return text;
                }, "");

                action.data = "console.log(`" + templateLiteral + "`)";
                action.type = WI.BreakpointAction.Type.Evaluate;
                return true;
            });
        }

        if (this._autoContinue)
            payload.autoContinue = this._autoContinue;

        if (this._ignoreCount)
            payload.ignoreCount = this._ignoreCount;

        return !isEmptyObject(payload) ? payload : undefined;
    }

    // Private

    _handleBreakpointActionModified(event)
    {
        console.assert(this.editable, this);

        this.dispatchEventToListeners(WI.Breakpoint.Event.ActionsDidChange);
    }
};

WI.Breakpoint.TypeIdentifier = "breakpoint";

WI.Breakpoint.Event = {
    DisabledStateDidChange: "breakpoint-disabled-state-did-change",
    ConditionDidChange: "breakpoint-condition-did-change",
    IgnoreCountDidChange: "breakpoint-ignore-count-did-change",
    ActionsDidChange: "breakpoint-actions-did-change",
    AutoContinueDidChange: "breakpoint-auto-continue-did-change",
};
