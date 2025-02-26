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

WI.GeneralStyleDetailsSidebarPanel = class GeneralStyleDetailsSidebarPanel extends WI.DOMDetailsSidebarPanel
{
    constructor(identifier, displayName, panelConstructor)
    {
        super(identifier, displayName);

        this.element.classList.add("css-style");

        console.assert(panelConstructor.prototype instanceof WI.StyleDetailsPanel);
        this._panel = new panelConstructor(this);
        this._panel.addEventListener(WI.StyleDetailsPanel.Event.NodeChanged, this._handleNodeChanged, this);

        if (this._panel.supportsToggleCSSClassList && InspectorBackend.hasCommand("DOM.resolveNode"))
            this._classListContainerToggledSetting = new WI.Setting(identifier + "-class-list-container-toggled", !!WI.Setting.migrateValue("class-list-container-toggled"));

        if (this._panel.supportsToggleCSSForcedPseudoClass && WI.cssManager.canForcePseudoClass()) {
            this._forcedPseudoClassContainerToggledSetting = new WI.Setting(identifier + "-forced-pseudo-class-container-toggled", this._panel.initialToggleCSSForcedPseudoClassState);
            this._checkboxForForcedPseudoClass = new Map;
        }
    }

    // Public

    get panel() { return this._panel; }

    get minimumWidth()
    {
        return Math.max(super.minimumWidth, this._panel.minimumWidth || 0);
    }

    supportsDOMNode(nodeToInspect)
    {
        return nodeToInspect.nodeType() === Node.ELEMENT_NODE;
    }

    attached()
    {
        super.attached();

        if (!this._panel)
            return;

        console.assert(this.visible, `Shown panel ${this._identifier} must be visible.`);

        this._panel.markAsNeedsRefresh(this.domNode);
    }

    // StyleDetailsPanel delegate

    styleDetailsPanelFocusFilterBar(styleDetailsPanel)
    {
        if (this._filterBar)
            this._filterBar.inputField.focus();
    }

    // Protected

    layout()
    {
        let domNode = this.domNode;
        if (!domNode || domNode.destroyed)
            return;

        this._panel.markAsNeedsRefresh(domNode);

        if (this._forcedPseudoClassContainerToggledSetting)
            this._updatePseudoClassCheckboxes();

        if (this._classListContainerToggledSetting)
            this._populateClassToggles();
    }

    addEventListeners()
    {
        let effectiveDOMNode = this.domNode.isPseudoElement() ? this.domNode.parentNode : this.domNode;
        if (!effectiveDOMNode)
            return;

        if (this._forcedPseudoClassContainerToggledSetting)
            effectiveDOMNode.addEventListener(WI.DOMNode.Event.EnabledPseudoClassesChanged, this._updatePseudoClassCheckboxes, this);

        if (this._classListContainerToggledSetting) {
            effectiveDOMNode.addEventListener(WI.DOMNode.Event.AttributeModified, this._handleNodeAttributeModified, this);
            effectiveDOMNode.addEventListener(WI.DOMNode.Event.AttributeRemoved, this._handleNodeAttributeRemoved, this);
        }
    }

    removeEventListeners()
    {
        let effectiveDOMNode = this.domNode.isPseudoElement() ? this.domNode.parentNode : this.domNode;
        if (!effectiveDOMNode)
            return;

        if (this._forcedPseudoClassContainerToggledSetting)
            effectiveDOMNode.removeEventListener(WI.DOMNode.Event.EnabledPseudoClassesChanged, this._updatePseudoClassCheckboxes, this);

        if (this._classListContainerToggledSetting) {
            effectiveDOMNode.removeEventListener(WI.DOMNode.Event.AttributeModified, this._handleNodeAttributeModified, this);
            effectiveDOMNode.removeEventListener(WI.DOMNode.Event.AttributeRemoved, this._handleNodeAttributeRemoved, this);
        }
    }

    initialLayout()
    {
        this.contentView.addSubview(this._panel);

        if (this._classListContainerToggledSetting) {
            this._classListContainer = this.element.createChild("div", "class-list-container");

            this._addClassContainer = this._classListContainer.createChild("div", "new-class");
            this._addClassContainer.title = WI.UIString("Add a Class");
            this._addClassContainer.addEventListener("click", this._addClassContainerClicked.bind(this));

            this._addClassInput = this._addClassContainer.createChild("input", "class-name-input");
            this._addClassInput.spellcheck = false;
            this._addClassInput.setAttribute("placeholder", WI.UIString("Add New Class"));
            this._addClassInput.addEventListener("keypress", this._addClassInputKeyPressed.bind(this));
            this._addClassInput.addEventListener("blur", this._addClassInputBlur.bind(this));
        }

        if (this._forcedPseudoClassContainerToggledSetting) {
            this._forcedPseudoClassContainer = this.element.appendChild(document.createElement("div"));
            this._forcedPseudoClassContainer.className = "forced-pseudo-class-container";

            for (let pseudoClass of Object.values(WI.CSSManager.ForceablePseudoClass)) {
                if (!WI.cssManager.canForcePseudoClass(pseudoClass))
                    continue;

                let labelElement = this._forcedPseudoClassContainer.appendChild(document.createElement("label"));

                let checkboxElement = labelElement.appendChild(document.createElement("input"));
                checkboxElement.addEventListener("change", this._forcedPseudoClassCheckboxChanged.bind(this, pseudoClass));
                checkboxElement.type = "checkbox";
                this._checkboxForForcedPseudoClass.set(pseudoClass, checkboxElement);

                labelElement.append(WI.CSSManager.displayNameForForceablePseudoClass(pseudoClass));
            }
        }

        let optionsContainer = this.element.createChild("div", "options-container");

        let newRuleButton = optionsContainer.createChild("img", "new-rule");
        newRuleButton.title = WI.UIString("Add new rule");
        newRuleButton.addEventListener("click", this._newRuleButtonClicked.bind(this));
        newRuleButton.addEventListener("contextmenu", this._newRuleButtonContextMenu.bind(this));

        if (typeof this._panel.filterDidChange === "function") {
            this._filterBar = new WI.FilterBar;
            this._filterBar.addEventListener(WI.FilterBar.Event.FilterDidChange, this._filterDidChange, this);
            this._filterBar.inputField.addEventListener("keydown", this._handleFilterBarInputFieldKeyDown.bind(this));
            this.contentView.element.classList.add("has-filter-bar");

            optionsContainer.appendChild(this._filterBar.element);
        }

        if (this._classListContainerToggledSetting) {
            this._classListToggleButton = optionsContainer.createChild("button", "toggle class-list");
            this._classListToggleButton.textContent = WI.UIString("Classes");
            this._classListToggleButton.title = WI.UIString("Toggle Classes");
            this._classListToggleButton.addEventListener("click", this._classListToggleButtonClicked.bind(this));

            this._updateClassListContainer();
        }

        if (this._forcedPseudoClassContainerToggledSetting) {
            this._forcedPseudoClassToggleButton = optionsContainer.appendChild(document.createElement("button"));
            this._forcedPseudoClassToggleButton.className = "toggle forced-pseudo-class";
            this._forcedPseudoClassToggleButton.textContent = WI.UIString("Pseudo", "Pseudo @ Styles details sidebar panel", "Label for button that shows controls for toggling CSS pseudo-classes on the selected element.");
            this._forcedPseudoClassToggleButton.title = WI.UIString("Toggle Pseudo Classes");
            this._forcedPseudoClassToggleButton.addEventListener("click", this._forcedPseudoClassToggleButtonClicked.bind(this));

            this._updateForcedPseudoClassContainer();
        }

        WI.cssManager.addEventListener(WI.CSSManager.Event.StyleSheetAdded, this._styleSheetAddedOrRemoved, this);
        WI.cssManager.addEventListener(WI.CSSManager.Event.StyleSheetRemoved, this._styleSheetAddedOrRemoved, this);
    }

    sizeDidChange()
    {
        super.sizeDidChange();

        if (this._panel)
            this._panel.sizeDidChange();
    }

    // Private

    _updateClassListContainer()
    {
        let hidden = !this._classListContainerToggledSetting.value;
        this._classListToggleButton.classList.toggle("selected", !hidden);
        this._classListContainer.hidden = hidden;

        this._populateClassToggles();
    }

    _updateForcedPseudoClassContainer()
    {
        let hidden = !this._forcedPseudoClassContainerToggledSetting.value;
        this._forcedPseudoClassToggleButton.classList.toggle("selected", !hidden);
        this._forcedPseudoClassContainer.hidden = hidden;
    }

    _handleNodeChanged(event)
    {
        this.contentView.element.classList.toggle("supports-new-rule", this._panel.supportsNewRule);
        this.contentView.element.classList.toggle("supports-toggle-class-list", this._panel.supportsToggleCSSClassList);
        this.contentView.element.classList.toggle("supports-toggle-forced-pseudo-class", this._panel.supportsToggleCSSForcedPseudoClass);
    }

    _forcedPseudoClassCheckboxChanged(pseudoClass, event)
    {
        if (!this.domNode)
            return;

        let effectiveDOMNode = this.domNode.isPseudoElement() ? this.domNode.parentNode : this.domNode;
        if (!effectiveDOMNode)
            return;

        effectiveDOMNode.setPseudoClassEnabled(pseudoClass, event.target.checked);

        this._checkboxForForcedPseudoClass.get(pseudoClass).focus();
    }

    _updatePseudoClassCheckboxes()
    {
        if (!this.domNode)
            return;

        let effectiveDOMNode = this.domNode.isPseudoElement() ? this.domNode.parentNode : this.domNode;
        if (!effectiveDOMNode)
            return;

        let enabledPseudoClasses = effectiveDOMNode.enabledPseudoClasses;

        for (let [pseudoClass, checkboxElement] of this._checkboxForForcedPseudoClass)
            checkboxElement.checked = enabledPseudoClasses.includes(pseudoClass);
    }

    _handleNodeAttributeModified(event)
    {
        if (event && event.data && event.data.name === "class")
            this._populateClassToggles();
    }

    _handleNodeAttributeRemoved(event)
    {
        if (event && event.data && event.data.name === "class")
            this._populateClassToggles();
    }

    _newRuleButtonClicked()
    {
        if (this._panel && typeof this._panel.newRuleButtonClicked === "function")
            this._panel.newRuleButtonClicked();
    }

    _newRuleButtonContextMenu(event)
    {
        if (this._panel && typeof this._panel.newRuleButtonContextMenu === "function")
            this._panel.newRuleButtonContextMenu(event);
    }

    _classListToggleButtonClicked(event)
    {
        if (this._forcedPseudoClassContainerToggledSetting) {
            this._forcedPseudoClassContainerToggledSetting.value = false;
            this._updateForcedPseudoClassContainer();
        }

        this._classListContainerToggledSetting.value = !this._classListContainerToggledSetting.value;
        this._updateClassListContainer();
    }

    _forcedPseudoClassToggleButtonClicked(event)
    {
        if (this._classListContainerToggledSetting) {
            this._classListContainerToggledSetting.value = false;
            this._updateClassListContainer();
        }

        this._forcedPseudoClassContainerToggledSetting.value = !this._forcedPseudoClassContainerToggledSetting.value;
        this._updateForcedPseudoClassContainer();
    }

    _addClassContainerClicked(event)
    {
        this._addClassContainer.classList.add("active");
        this._addClassInput.focus();
    }

    _addClassInputKeyPressed(event)
    {
        if (event.keyCode !== WI.KeyboardShortcut.Key.Enter.keyCode)
            return;

        this._addClassFromInput();
    }

    _addClassInputBlur(event)
    {
        this._addClassFromInput();

        this._addClassContainer.classList.remove("active");
    }

    _addClassFromInput()
    {
        this.domNode.toggleClass(this._addClassInput.value, true);
        this._addClassInput.value = null;
    }

    _populateClassToggles()
    {
        if (!this._classListContainer || this._classListContainer.hidden)
            return;

        // Ensure that _addClassContainer is the first child of _classListContainer.
        while (this._classListContainer.children.length > 1)
            this._classListContainer.children[1].remove();

        let classes = this.domNode.getAttribute("class") || [];
        let classToggledMap = this.domNode[WI.GeneralStyleDetailsSidebarPanel.ToggledClassesSymbol];
        if (!classToggledMap)
            classToggledMap = this.domNode[WI.GeneralStyleDetailsSidebarPanel.ToggledClassesSymbol] = new Map;

        if (classes && classes.length) {
            for (let className of classes.split(/\s+/))
                classToggledMap.set(className, true);
        }

        for (let [className, toggled] of classToggledMap) {
            if ((toggled && !classes.includes(className)) || (!toggled && classes.includes(className))) {
                toggled = !toggled;
                classToggledMap.set(className, toggled);
            }

            this._createToggleForClassName(className);
        }
    }

    _createToggleForClassName(className)
    {
        if (!className || !className.length)
            return;

        let classToggledMap = this.domNode[WI.GeneralStyleDetailsSidebarPanel.ToggledClassesSymbol];
        if (!classToggledMap)
            return;

        if (!classToggledMap.has(className))
            classToggledMap.set(className, true);

        let toggled = classToggledMap.get(className);

        let classNameContainer = document.createElement("div");
        classNameContainer.classList.add("class-toggle");

        let classNameToggle = classNameContainer.createChild("input");
        classNameToggle.type = "checkbox";
        classNameToggle.checked = toggled;

        let classNameTitle = classNameContainer.createChild("span");
        classNameTitle.textContent = className;
        classNameTitle.draggable = true;
        classNameTitle.addEventListener("dragstart", (event) => {
            event.dataTransfer.setData(WI.GeneralStyleDetailsSidebarPanel.ToggledClassesDragType, className);
            event.dataTransfer.effectAllowed = "copy";
        });

        let classNameToggleChanged = (event) => {
            this.domNode.toggleClass(className, classNameToggle.checked);
            classToggledMap.set(className, classNameToggle.checked);
        };

        classNameToggle.addEventListener("click", classNameToggleChanged);
        classNameTitle.addEventListener("click", (event) => {
            classNameToggle.checked = !classNameToggle.checked;
            classNameToggleChanged();
        });

        this._classListContainer.appendChild(classNameContainer);
    }

    _filterDidChange()
    {
        if (!this._filterBar)
            return;

        this.contentView.element.classList.toggle(WI.GeneralStyleDetailsSidebarPanel.FilterInProgressClassName, this._filterBar.hasActiveFilters());

        this._panel.filterDidChange(this._filterBar);
    }

    _handleFilterBarInputFieldKeyDown(event)
    {
        if (event.key !== "Tab" || !event.shiftKey)
            return;

        if (this._panel.focusLastSection) {
            this._panel.focusLastSection();
            event.preventDefault();
        }
    }

    _styleSheetAddedOrRemoved()
    {
        let domNode = this.domNode;
        if (!domNode || domNode.destroyed)
            return;

        this._panel.markAsNeedsRefresh(domNode);
    }
};

WI.GeneralStyleDetailsSidebarPanel.FilterInProgressClassName = "filter-in-progress";
WI.GeneralStyleDetailsSidebarPanel.FilterMatchingSectionHasLabelClassName = "filter-section-has-label";
WI.GeneralStyleDetailsSidebarPanel.FilterMatchSectionClassName = "filter-matching";
WI.GeneralStyleDetailsSidebarPanel.NoFilterMatchInSectionClassName = "filter-section-non-matching";
WI.GeneralStyleDetailsSidebarPanel.NoFilterMatchInPropertyClassName = "filter-property-non-matching";

WI.GeneralStyleDetailsSidebarPanel.ToggledClassesSymbol = Symbol("css-style-details-sidebar-panel-toggled-classes-symbol");
WI.GeneralStyleDetailsSidebarPanel.ToggledClassesDragType = "web-inspector/css-class";
