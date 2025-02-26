/*
 * Copyright (C) 2021 Apple Inc. All rights reserved.
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

WI.CSSPropertyNameCompletions = class CSSPropertyNameCompletions extends WI.CSSCompletions
{
    constructor(properties, options = {})
    {
        console.assert(Array.isArray(properties), properties);
        console.assert(properties[0].name, "Expected an array of objects with `name` key", properties);

        let values = [];
        for (let property of properties) {
            console.assert(property.name);

            values.push(property.name);
            if (Array.isArray(property.aliases))
                values.pushAll(property.aliases);
        }

        super(values, options);

        this._cachedSortedPropertyNames = this.values.slice();
        this._needsVariablesFromInspectedNode = true;
        this._inspectedDOMNodeStyles = null;

        WI.domManager.addEventListener(WI.DOMManager.Event.InspectedNodeChanged, this._handleInspectedNodeChanged, this);
    }

    // Public

    isValidPropertyName(name)
    {
        return this.values.includes(name);
    }

    executeQuery(query)
    {
        this._updateValuesWithLatestCSSVariablesIfNeeded();

        return super.executeQuery(query);
    }

    startsWith(prefix)
    {
        this._updateValuesWithLatestCSSVariablesIfNeeded();

        return super.startsWith(prefix);
    }

    // Private

    _updateValuesWithLatestCSSVariablesIfNeeded()
    {
        if (!this._needsVariablesFromInspectedNode)
            return;

        // An inspected node is not guaranteed to exist when unit testing.
        if (!WI.domManager.inspectedNode) {
            this._needsVariablesFromInspectedNode = false;
            return;
        }

        let values = Array.from(WI.cssManager.stylesForNode(WI.domManager.inspectedNode).allCSSVariables);
        values.pushAll(this._cachedSortedPropertyNames);
        this.replaceValues(values);

        this._needsVariablesFromInspectedNode = false;
    }

    _handleInspectedNodeChanged(event)
    {
        this._needsVariablesFromInspectedNode = true;

        this._inspectedDOMNodeStyles?.removeEventListener(WI.DOMNodeStyles.Event.NeedsRefresh, this._handleNodesStylesNeedsRefresh, this);
        this._inspectedDOMNodeStyles = WI.cssManager.stylesForNode(WI.domManager.inspectedNode);
        this._inspectedDOMNodeStyles.addEventListener(WI.DOMNodeStyles.Event.NeedsRefresh, this._handleNodesStylesNeedsRefresh, this);
    }

    _handleNodesStylesNeedsRefresh(event)
    {
        this._needsVariablesFromInspectedNode = true;
    }
};
