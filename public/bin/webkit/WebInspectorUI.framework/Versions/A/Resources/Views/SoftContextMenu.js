/*
 * Copyright (C) 2011 Google Inc. All Rights Reserved.
 * Copyright (C) 2017 Sony Interactive Entertainment Inc.
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
 * THIS SOFTWARE IS PROVIDED BY APPLE INC. ``AS IS'' AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
 * IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR
 * PURPOSE ARE DISCLAIMED.  IN NO EVENT SHALL APPLE INC. OR
 * CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR
 * PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY
 * OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

WI.SoftContextMenu = class SoftContextMenu
{
    constructor(items, parentMenu)
    {
        this._items = items;
        this._parentMenu = parentMenu;
    }

    // Public

    show(event)
    {
        const isSubMenu = !!this._parentMenu;

        this._contextMenuElement = document.createElement("div");
        this._contextMenuElement.className = "soft-context-menu";
        this._contextMenuElement.style.left = event.pageX + "px";
        this._contextMenuElement.style.top = event.pageY + "px";
        this._contextMenuElement.tabIndex = 0;
        this._contextMenuElement.addEventListener("keydown", this._menuKeyDown.bind(this), false);
        for (let item of this._items)
            this._contextMenuElement.appendChild(this._createMenuItem(item));

        // Install glass pane capturing events.
        if (!isSubMenu) {
            this._glassPaneElement = document.createElement("div");
            this._glassPaneElement.className = "soft-context-menu-glass-pane";
            this._glassPaneElement.addEventListener("mousedown", this._glassPaneMouseDown.bind(this), false);
            this._glassPaneElement.appendChild(this._contextMenuElement);
            document.body.appendChild(this._glassPaneElement);
            this._focus();
            this._consumeEvent(event, true);
        } else
            this._parentGlassPaneElement().appendChild(this._contextMenuElement);

        this._repositionMenuOnScreen(isSubMenu);
    }

    // Private

    _consumeEvent(event, preventDefault)
    {
        event.stopImmediatePropagation();

        if (preventDefault)
            event.preventDefault();

        event.handled = true;
    }

    _parentGlassPaneElement()
    {
        if (!this._parentMenu)
            return null;

        if (this._parentMenu._glassPaneElement)
            return this._parentMenu._glassPaneElement;

        return this._parentMenu._parentGlassPaneElement();
    }

    _createMenuItem(item)
    {
        if (item.type === "separator")
            return this._createSeparator();

        const checkmark = "\u2713";
        const blackRightPointingTriangle = "\u25b6";

        const menuItemElement = document.createElement("div");
        menuItemElement.className = "item";
        if (!item.enabled)
            menuItemElement.classList.add("disabled");

        const checkMarkElement = document.createElement("span");
        checkMarkElement.textContent = item.checked ? checkmark : "";
        checkMarkElement.className = "checkmark";
        menuItemElement.appendChild(checkMarkElement);

        const labelElement = document.createElement("span");
        labelElement.textContent = item.label;
        labelElement.className = "label";
        menuItemElement.appendChild(labelElement);

        if (item.type === "subMenu") {
            const subMenuArrowElement = document.createElement("span");
            subMenuArrowElement.textContent = blackRightPointingTriangle;
            subMenuArrowElement.className = "submenu-arrow";
            menuItemElement.appendChild(subMenuArrowElement);

            menuItemElement._subItems = item.subItems;
        } else
            menuItemElement._actionId = item.id;

        menuItemElement.addEventListener("contextmenu", this._menuItemContextMenu.bind(this), false);
        menuItemElement.addEventListener("mousedown", this._menuItemMouseDown.bind(this), false);
        menuItemElement.addEventListener("mouseup", this._menuItemMouseUp.bind(this), false);
        menuItemElement.addEventListener("mouseover", this._menuItemMouseOver.bind(this), false);
        menuItemElement.addEventListener("mouseout", this._menuItemMouseOut.bind(this), false);

        return menuItemElement;
    }

    _createSeparator()
    {
        const separatorElement = document.createElement("div");
        separatorElement.className = "separator";
        separatorElement._isSeparator = true;
        separatorElement.createChild("div", "line");

        separatorElement.addEventListener("contextmenu", this._menuItemContextMenu.bind(this), false);
        separatorElement.addEventListener("mousedown", this._menuItemMouseDown.bind(this), false);
        separatorElement.addEventListener("mouseup", this._menuItemMouseUp.bind(this), false);
        separatorElement.addEventListener("mouseover", this._menuItemMouseOver.bind(this), false);

        return separatorElement;
    }

    _repositionMenuOnScreen(isSubMenu)
    {
        if (this._contextMenuElement.offsetLeft + this._contextMenuElement.offsetWidth > document.body.offsetWidth) {
            if (isSubMenu) {
                const parentContextMenuElement = this._parentMenu._contextMenuElement;
                const leftOfParent = parentContextMenuElement.offsetLeft - this._contextMenuElement.offsetWidth + 2;
                const fromParentRight = this._contextMenuElement.offsetLeft - this._contextMenuElement.offsetWidth + 2;
                this._contextMenuElement.style.left = (leftOfParent >= 0 ? leftOfParent : fromParentRight) + "px";
            } else {
                const leftOfCursor = this._contextMenuElement.offsetLeft - this._contextMenuElement.offsetWidth;
                const fromRightEdge = document.body.offsetWidth - this._contextMenuElement.offsetWidth;
                this._contextMenuElement.style.left = (leftOfCursor >= 0 ? leftOfCursor : fromRightEdge) + "px";
            }
        }

        if (this._contextMenuElement.offsetTop + this._contextMenuElement.offsetHeight > document.body.offsetHeight) {
            const aboveCursor = this._contextMenuElement.offsetTop - this._contextMenuElement.offsetHeight;
            const fromBottomEdge = document.body.offsetHeight - this._contextMenuElement.offsetHeight;
            this._contextMenuElement.style.top = (!isSubMenu && aboveCursor >= 0 ? aboveCursor : fromBottomEdge) + "px";
        }
    }

    _showSubMenu(menuItemElement)
    {
        if (menuItemElement._subMenuTimer) {
            clearTimeout(menuItemElement._subMenuTimer);
            menuItemElement._subMenuTimer = 0;
        }

        if (this._subMenu)
            return;

        this._subMenu = new WI.SoftContextMenu(menuItemElement._subItems, this);
        this._subMenu.show({
            pageX: this._contextMenuElement.offsetLeft + menuItemElement.offsetWidth,
            pageY: this._contextMenuElement.offsetTop + menuItemElement.offsetTop - 4
        });
    }

    _hideSubMenu()
    {
        if (!this._subMenu)
            return;

        this._subMenu._discardSubMenus();
        this._focus();
    }

    _menuItemContextMenu(event)
    {
        // Prevent our non-native context menu from getting a native context menu on right-click.
        this._consumeEvent(event, true);
    }

    _menuItemMouseDown(event)
    {
        // Prevent menu from disappearing before mouseup.
        this._consumeEvent(event, true);
    }

    _menuItemMouseUp(event)
    {
        this._triggerAction(event.target, event);
        this._consumeEvent(event);
    }

    _menuItemMouseOver(event)
    {
        this._highlightMenuItem(event.target._isSeparator ? null : event.target);
    }

    _menuItemMouseOut(event)
    {
        const shouldUnhighlight = !this._subMenu || !event.relatedTarget ||
            this._contextMenuElement.contains(event.relatedTarget) ||
            event.relatedTarget.classList.contains("soft-context-menu-glass-pane");

        if (shouldUnhighlight)
            this._highlightMenuItem(null);
    }

    _menuKeyDown(event)
    {
        switch (event.keyIdentifier) {
        case "Up":
            this._highlightPrevious();
            break;
        case "Down":
            this._highlightNext();
            break;
        case "Left":
            if (this._parentMenu) {
                this._highlightMenuItem(null);
                this._parentMenu._hideSubMenu();
            }
            break;
        case "Enter":
            if (!isEnterKey(event))
                break;
            // falls through
        case "U+0020": // Space
            if (this._highlightedMenuItemElement && !this._highlightedMenuItemElement._subItems)
                this._triggerAction(this._highlightedMenuItemElement, event);
            // falls through
        case "Right":
            if (this._highlightedMenuItemElement && this._highlightedMenuItemElement._subItems) {
                this._showSubMenu(this._highlightedMenuItemElement);
                this._subMenu._focus();
                this._subMenu._highlightNext();
            }
            break;
        case "U+001B": // Escape
            this._discardMenu(true, event);
            break;
        }
        this._consumeEvent(event, true);
    }

    _glassPaneMouseDown(event)
    {
        this._discardMenu(true, event);
        this._consumeEvent(event);
    }

    _focus()
    {
        this._contextMenuElement.focus();
    }

    _triggerAction(menuItemElement, event)
    {
        if (!menuItemElement._subItems) {
            this._discardMenu(true, event);
            if (typeof menuItemElement._actionId === "number") {
                WI.ContextMenu.contextMenuItemSelected(menuItemElement._actionId);
                menuItemElement._actionId = null;
            }
            return;
        }

        this._showSubMenu(menuItemElement);
        this._consumeEvent(event);
    }

    _highlightMenuItem(menuItemElement, skipSubMenuExpansion)
    {
        if (this._highlightedMenuItemElement === menuItemElement)
            return;

        this._hideSubMenu();
        if (this._highlightedMenuItemElement) {
            this._highlightedMenuItemElement.classList.remove("highlighted");

            if (this._highlightedMenuItemElement._subItems && this._highlightedMenuItemElement._subMenuTimer) {
                clearTimeout(this._highlightedMenuItemElement._subMenuTimer);
                this._highlightedMenuItemElement._subMenuTimer = 0;
            }
        }

        this._highlightedMenuItemElement = menuItemElement;
        if (this._highlightedMenuItemElement) {
            this._highlightedMenuItemElement.classList.add("highlighted");
            this._contextMenuElement.focus();

            if (!skipSubMenuExpansion && this._highlightedMenuItemElement._subItems && !this._highlightedMenuItemElement._subMenuTimer)
                this._highlightedMenuItemElement._subMenuTimer = setTimeout(this._showSubMenu.bind(this, this._highlightedMenuItemElement), 150);
        }
    }

    _highlightPrevious()
    {
        let menuItemElement = this._highlightedMenuItemElement ? this._highlightedMenuItemElement.previousSibling : this._contextMenuElement.lastChild;

        while (menuItemElement && menuItemElement._isSeparator)
            menuItemElement = menuItemElement.previousSibling;

        if (menuItemElement)
            this._highlightMenuItem(menuItemElement, true);
    }

    _highlightNext()
    {
        let menuItemElement = this._highlightedMenuItemElement ? this._highlightedMenuItemElement.nextSibling : this._contextMenuElement.firstChild;

        while (menuItemElement && menuItemElement._isSeparator)
            menuItemElement = menuItemElement.nextSibling;

        if (menuItemElement)
            this._highlightMenuItem(menuItemElement, true);
    }

    _discardMenu(closeParentMenus, event)
    {
        if (this._subMenu && !closeParentMenus)
            return;

        if (this._glassPaneElement) {
            const glassPane = this._glassPaneElement;
            this._glassPaneElement = null;
            // This can re-enter discardMenu due to blur.
            document.body.removeChild(glassPane);

            if (this._parentMenu) {
                this._parentMenu._subMenu = null;
                if (closeParentMenus)
                    this._parentMenu._discardMenu(closeParentMenus, event);
            }

            if (event)
                this._consumeEvent(event, true);
        } else if (this._parentMenu && this._contextMenuElement.parentElement) {
            this._discardSubMenus();

            if (closeParentMenus)
                this._parentMenu._discardMenu(closeParentMenus, event);

            if (event)
                this._consumeEvent(event, true);
        }
    }

    _discardSubMenus()
    {
        if (this._subMenu)
            this._subMenu._discardSubMenus();

        if (this._contextMenuElement.parentElement)
            this._contextMenuElement.parentElement.removeChild(this._contextMenuElement);

        if (this._parentMenu)
            this._parentMenu._subMenu = null;
    }
};
