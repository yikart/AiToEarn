/*
 * Copyright (C) 2014-2015 Apple Inc. All rights reserved.
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

WI.TypeTokenView = class TypeTokenView extends WI.Object
{
    constructor(tokenAnnotator, shouldHaveRightMargin, shouldHaveLeftMargin, titleType, functionOrVariableName)
    {
        console.assert(titleType === WI.TypeTokenView.TitleType.Variable || titleType === WI.TypeTokenView.TitleType.ReturnStatement);

        super();

        var span = document.createElement("span");
        span.classList.add("type-token");
        if (shouldHaveRightMargin)
            span.classList.add("type-token-right-spacing");
        if (shouldHaveLeftMargin)
            span.classList.add("type-token-left-spacing");

        this.element = span;
        this._tokenAnnotator = tokenAnnotator;

        this._typeDescription = null;

        this._colorClass = null;

        this._popoverTitle = WI.TypeTokenView.titleForPopover(titleType, functionOrVariableName);

        this._setUpMouseoverHandlers();
    }

    // Static

    static titleForPopover(titleType, functionOrVariableName)
    {
        if (titleType === WI.TypeTokenView.TitleType.Variable)
            return WI.UIString("Type information for variable: %s").format(functionOrVariableName);

        if (functionOrVariableName)
            return WI.UIString("Return type for function: %s").format(functionOrVariableName);

        return WI.UIString("Return type for anonymous function");
    }

    // Public

    update(typeDescription)
    {
        console.assert(typeDescription instanceof WI.TypeDescription);

        this._typeDescription = typeDescription;

        var title = this._displayTypeName();
        if (title === this.element.textContent)
            return;

        this.element.textContent = title;
        var hashString = title[title.length - 1] === "?" ? title.slice(0, title.length - 1) : title;

        if (this._colorClass)
            this.element.classList.remove(this._colorClass);

        this._colorClass = WI.TypeTokenView.ColorClassForType[hashString] || "type-token-default";
        this.element.classList.add(this._colorClass);
    }

    // Private

    _setUpMouseoverHandlers()
    {
        var timeoutID = null;

        this.element.addEventListener("mouseover", function() {
            function showPopoverAfterDelay()
            {
                timeoutID = null;

                var domRect = this.element.getBoundingClientRect();
                var bounds = new WI.Rect(domRect.left, domRect.top, domRect.width, domRect.height);
                this._tokenAnnotator.sourceCodeTextEditor.showPopoverForTypes(this._typeDescription, bounds, this._popoverTitle);
            }

            if (this._shouldShowPopover())
                timeoutID = setTimeout(showPopoverAfterDelay.bind(this), WI.TypeTokenView.DelayHoverTime);
        }.bind(this));

        this.element.addEventListener("mouseout", function() {
            if (timeoutID)
                clearTimeout(timeoutID);
        });
    }

    _shouldShowPopover()
    {
        if (!this._typeDescription.valid)
            return false;

        if (this._typeDescription.typeSet.primitiveTypeNames.length > 1)
            return true;

        if (this._typeDescription.structures && this._typeDescription.structures.length)
            return true;

        return false;
    }

    _displayTypeName()
    {
        if (!this._typeDescription.valid)
            return "";

        var typeSet = this._typeDescription.typeSet;

        if (this._typeDescription.leastCommonAncestor) {
            if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Object))
                return this._typeDescription.leastCommonAncestor;
            if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Object | WI.TypeSet.NullOrUndefinedTypeBits))
                return this._typeDescription.leastCommonAncestor + "?";
        }

        // The order of these checks are important.
        // For example, if a value is only a function, it is contained in TypeFunction, but it is also contained in (TypeFunction | TypeNull).
        // Therefore, more specific types must be checked first.

        // The strings returned here should match those in TypeTokenView.ColorClassForType
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Function))
            return "Function";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Undefined))
            return "Undefined";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Null))
            return "Null";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Boolean))
            return "Boolean";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Integer))
            return "Integer";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Number | WI.TypeSet.TypeBit.Integer))
            return "Number";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.String))
            return "String";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Symbol))
            return "Symbol";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.BigInt))
            return "BigInt";

        if (typeSet.isContainedIn(WI.TypeSet.NullOrUndefinedTypeBits))
            return "(?)";

        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Function | WI.TypeSet.NullOrUndefinedTypeBits))
            return "Function?";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Boolean | WI.TypeSet.NullOrUndefinedTypeBits))
            return "Boolean?";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Integer | WI.TypeSet.NullOrUndefinedTypeBits))
            return "Integer?";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Number | WI.TypeSet.TypeBit.Integer | WI.TypeSet.NullOrUndefinedTypeBits))
            return "Number?";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.String | WI.TypeSet.NullOrUndefinedTypeBits))
            return "String?";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Symbol | WI.TypeSet.NullOrUndefinedTypeBits))
            return "Symbol?";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.BigInt | WI.TypeSet.NullOrUndefinedTypeBits))
            return "BigInt?";

        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Object | WI.TypeSet.TypeBit.Function | WI.TypeSet.TypeBit.String))
            return "Object";
        if (typeSet.isContainedIn(WI.TypeSet.TypeBit.Object | WI.TypeSet.TypeBit.Function | WI.TypeSet.TypeBit.String | WI.TypeSet.NullOrUndefinedTypeBits))
            return "Object?";

        return WI.UIString("(many)");
    }
};

WI.TypeTokenView.TitleType = {
    Variable: Symbol("title-type-variable"),
    ReturnStatement: Symbol("title-type-return-statement")
};

WI.TypeTokenView.ColorClassForType = {
    "String": "type-token-string",
    "Symbol": "type-token-symbol",
    "BigInt": "type-token-bigint",
    "Function": "type-token-function",
    "Number": "type-token-number",
    "Integer": "type-token-number",
    "Undefined": "type-token-empty",
    "Null": "type-token-empty",
    "(?)": "type-token-empty",
    "Boolean": "type-token-boolean",
    "(many)": "type-token-many"
};

WI.TypeTokenView.DelayHoverTime = 350;
