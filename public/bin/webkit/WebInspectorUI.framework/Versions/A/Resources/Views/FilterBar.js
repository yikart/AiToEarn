/*
 * Copyright (C) 2013, 2015 Apple Inc. All rights reserved.
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

WI.FilterBar = class FilterBar extends WI.Object
{
    constructor(element)
    {
        super();

        this._element = element || document.createElement("div");
        this._element.classList.add("filter-bar");

        this._filterFunctionsMap = new Map;

        this._inputField = document.createElement("input");
        this._inputField.type = "search";
        this._inputField.placeholder = WI.UIString("Filter");
        this._inputField.spellcheck = false;
        this._handleFilterInputThrottler = new Throttler(this._handleFilterInput.bind(this), 250);
        this._inputField.addEventListener("input", (event) => {
            if (this._inputField.value)
                this._handleFilterInputThrottler.fire(event);
            else
                this._handleFilterInputThrottler.force(event);
        });
        this._element.appendChild(this._inputField);

        this._filtersNavigationBar = new WI.NavigationBar;
        this._element.appendChild(this._filtersNavigationBar.element);

        this._lastFilterValue = this.filters;

        this._invalid = false;
    }

    // Public

    get element()
    {
        return this._element;
    }

    get inputField()
    {
        return this._inputField;
    }

    get placeholder()
    {
        return this._inputField.placeholder;
    }

    set placeholder(text)
    {
        this._inputField.placeholder = text;
    }

    get invalid()
    {
        return this._invalid;
    }

    set invalid(invalid)
    {
        this._invalid = !!invalid;
        this._element.classList.toggle("invalid", this._invalid);
    }

    get filters()
    {
        return {text: this._inputField.value, functions: [...this._filterFunctionsMap.values()]};
    }

    set filters(filters)
    {
        filters = filters || {};

        var oldTextValue = this._inputField.value;
        this._inputField.value = filters.text || "";
        if (oldTextValue !== this._inputField.value)
            this._handleFilterInput();
    }

    focus()
    {
        // FIXME: Workaround for: <https://webkit.org/b/149504> Caret missing from <input> after clearing text and calling select()
        if (!this._inputField.value.length)
            this._inputField.focus();
        else
            this._inputField.select();
    }

    clear()
    {
        this._filterFunctionsMap.clear();
        this.filters = null;

        // Only toggle the `WI.FilterBarButton`s after clearing the function map, as otherwise each
        // toggle will fire another WI.FilterBar.Event.FilterDidChange event.
        for (let navigationItem of this._filtersNavigationBar.navigationItems) {
            if (navigationItem instanceof WI.FilterBarButton)
                navigationItem.toggle(false);
        }

        this._inputField.value = null; // Get the placeholder to show again.

        this.invalid = false;
    }

    addFilterNavigationItem(navigationItem)
    {
        console.assert(navigationItem instanceof WI.NavigationItem);
        this._filtersNavigationBar.addNavigationItem(navigationItem);
    }

    addFilterBarButton(identifier, filterFunction, activatedByDefault, defaultToolTip, activatedToolTip, image, imageWidth, imageHeight)
    {
        var filterBarButton = new WI.FilterBarButton(identifier, filterFunction, activatedByDefault, defaultToolTip, activatedToolTip, image, imageWidth, imageHeight);
        filterBarButton.addEventListener(WI.ButtonNavigationItem.Event.Clicked, this._handleFilterBarButtonClicked, this);
        filterBarButton.addEventListener(WI.FilterBarButton.Event.ActivatedStateToggled, this._handleFilterButtonToggled, this);
        this.addFilterNavigationItem(filterBarButton);
        if (filterBarButton.activated) {
            this._filterFunctionsMap.set(filterBarButton.identifier, filterBarButton.filterFunction);
            this._handleFilterInput();
        }
    }

    hasActiveFilters()
    {
        return !!this._inputField.value || !!this._filterFunctionsMap.size;
    }

    hasFilterChanged()
    {
        var currentFunctions = this.filters.functions;

        if (this._lastFilterValue.text !== this._inputField.value || this._lastFilterValue.functions.length !== currentFunctions.length)
            return true;

        for (var i = 0; i < currentFunctions.length; ++i) {
            if (this._lastFilterValue.functions[i] !== currentFunctions[i])
                return true;
        }

        return false;
    }

    // Private

    _handleFilterBarButtonClicked(event)
    {
        var filterBarButton = event.target;
        filterBarButton.toggle();
    }

    _handleFilterButtonToggled(event)
    {
        var filterBarButton = event.target;
        if (filterBarButton.activated)
            this._filterFunctionsMap.set(filterBarButton.identifier, filterBarButton.filterFunction);
        else
            this._filterFunctionsMap.delete(filterBarButton.identifier);
        this._handleFilterInput();
    }

    _handleFilterInput()
    {
        if (this.hasFilterChanged()) {
            this._lastFilterValue = this.filters;
            this.dispatchEventToListeners(WI.FilterBar.Event.FilterDidChange);
        } else if (!this._inputField.value)
            this._inputField.blur();
    }
};

WI.FilterBar.Event = {
    FilterDidChange: "filter-bar-text-filter-did-change"
};
