/*
 * Copyright (C) 2019 Apple Inc. All rights reserved.
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

WI.BlackboxSettingsView = class BlackboxSettingsView extends WI.SettingsView
{
    constructor()
    {
        super("blackbox", WI.UIString("Blackbox"));

        this._blackboxPatternCodeMirrorMap = new Map;
    }

    // Public

    selectBlackboxPattern(regex)
    {
        console.assert(regex instanceof RegExp);
        console.assert(this.didInitialLayout);

        let codeMirror = this._blackboxPatternCodeMirrorMap.get(regex);
        console.assert(codeMirror);
        if (!codeMirror)
            return;

        codeMirror.focus();
    }

    // Protected

    initialLayout()
    {
        super.initialLayout();

        let patternBlackboxExplanationElement = this.element.insertBefore(document.createElement("p"), this.element.lastChild);
        patternBlackboxExplanationElement.textContent = WI.UIString("If the URL of any script matches one of the regular expression patterns below, any pauses that would have happened in that script will be deferred until execution has continued to outside of that script.");

        let table = this.element.insertBefore(document.createElement("table"), this.element.lastChild);

        let tableHead = table.appendChild(document.createElement("thead"));

        let tableHeadRow = tableHead.appendChild(document.createElement("tr"));

        let urlHeaderCell = tableHeadRow.appendChild(document.createElement("th"));
        urlHeaderCell.classList.add("url");
        urlHeaderCell.textContent = WI.UIString("URL Pattern");

        let caseSensitiveHeaderCell = tableHeadRow.appendChild(document.createElement("th"));
        caseSensitiveHeaderCell.classList.add("case-sensitive");
        caseSensitiveHeaderCell.textContent = WI.UIString("Case Sensitive");

        let removeBlackboxHeaderCell = tableHeadRow.appendChild(document.createElement("th"));
        removeBlackboxHeaderCell.classList.add("remove-blackbox");

        this._tableBody = table.appendChild(document.createElement("tbody"));

        for (let regex of WI.debuggerManager.blackboxPatterns)
            this._addRow(regex);

        if (!this._tableBody.children.length)
            this._addRow(null);

        let tableFoot = table.appendChild(document.createElement("tfoot"));

        let tableFooterRow = tableFoot.appendChild(document.createElement("tr"));

        let addBlackboxCell = tableFooterRow.appendChild(document.createElement("td"));

        let addBlackboxButton = addBlackboxCell.appendChild(document.createElement("button"));
        addBlackboxButton.textContent = WI.UIString("Add Pattern");
        addBlackboxButton.addEventListener("click", (event) => {
            for (let [regex, codeMirror] of this._blackboxPatternCodeMirrorMap) {
                if (!regex) {
                    codeMirror.focus();
                    return;
                }
            }

            this._addRow(null);
        });

        let individualBlackboxExplanationElement = this.element.insertBefore(document.createElement("p"), this.element.lastChild);
        let blackboxIconElement = WI.ImageUtilities.useSVGSymbol("Images/Hide.svg#currentColor", "toggle-script-blackbox", WI.UIString("Ignore script when debugging"));
        String.format(WI.UIString("Scripts can also be individually blackboxed by clicking on the %s icon that is shown on hover."), [blackboxIconElement], String.standardFormatters, individualBlackboxExplanationElement, (a, b) => {
            a.append(b);
            return a;
        });

        if (WI.DebuggerManager.supportsBlackboxingBreakpointEvaluations()) {
            let blackboxBreakpointEvaluationsExplanationElement = this.element.insertBefore(document.createElement("p"), this.element.lastChild);
            let blackboxBreakpointEvaluationsExplanationLabel = blackboxBreakpointEvaluationsExplanationElement.appendChild(document.createElement("label"));

            let blackboxBreakpointEvaluationsExplanationCheckbox = blackboxBreakpointEvaluationsExplanationLabel.appendChild(document.createElement("input"));
            blackboxBreakpointEvaluationsExplanationCheckbox.type = "checkbox";
            blackboxBreakpointEvaluationsExplanationCheckbox.checked = WI.settings.blackboxBreakpointEvaluations.value;
            blackboxBreakpointEvaluationsExplanationCheckbox.addEventListener("change", (event) => {
                WI.settings.blackboxBreakpointEvaluations.value = blackboxBreakpointEvaluationsExplanationCheckbox.checked;
            });

            blackboxBreakpointEvaluationsExplanationLabel.append(WI.UIString("Also defer evaluating breakpoint conditions, ignore counts, and actions until execution has continued outside of the related script instead of at the breakpoint\u2019s location."));
        }
    }

    // Private

    _addRow(regex)
    {
        let tableBodyRow = this._tableBody.appendChild(document.createElement("tr"));

        let urlBodyCell = tableBodyRow.appendChild(document.createElement("td"));
        urlBodyCell.classList.add("url");

        let urlCodeMirror = WI.CodeMirrorEditor.create(urlBodyCell, {
            extraKeys: {"Tab": false, "Shift-Tab": false},
            lineWrapping: false,
            matchBrackets: false,
            mode: "text/x-regex",
            placeholder: WI.UIString("Regular Expression"),
            scrollbarStyle: null,
            value: regex ? regex.source : "",
        });
        this._blackboxPatternCodeMirrorMap.set(regex, urlCodeMirror);

        this.needsLayout();

        let caseSensitiveBodyCell = tableBodyRow.appendChild(document.createElement("td"));
        caseSensitiveBodyCell.classList.add("case-sensitive");

        let caseSensitiveCheckbox = caseSensitiveBodyCell.appendChild(document.createElement("input"));
        caseSensitiveCheckbox.type = "checkbox";
        caseSensitiveCheckbox.checked = regex ? !regex.ignoreCase : true;

        let removeBlackboxBodyCell = tableBodyRow.appendChild(document.createElement("td"));
        removeBlackboxBodyCell.classList.add("remove-blackbox");

        let removeBlackboxButton = removeBlackboxBodyCell.appendChild(WI.ImageUtilities.useSVGSymbol("Images/NavigationItemTrash.svg", "remove-blackbox-button", WI.UIString("Delete Blackbox")));
        removeBlackboxButton.addEventListener("click", (event) => {
            if (regex)
                WI.debuggerManager.setShouldBlackboxPattern(regex, false);
            regex = null;

            this._blackboxPatternCodeMirrorMap.delete(regex);

            tableBodyRow.remove();

            if (!this._tableBody.children.length)
                this._addRow(null);
        });

        let update = () => {
            let url = urlCodeMirror.getValue();

            if (regex) {
                if (regex.source === url && regex.ignoreCase !== caseSensitiveCheckbox.checked)
                    return;

                WI.debuggerManager.setShouldBlackboxPattern(regex, false);
            }

            this._blackboxPatternCodeMirrorMap.delete(regex);

            regex = url ? new RegExp(url, !caseSensitiveCheckbox.checked ? "i" : "") : null;
            if (regex)
                WI.debuggerManager.setShouldBlackboxPattern(regex, true);

            console.assert(regex || !this._blackboxPatternCodeMirrorMap.has(regex));
            this._blackboxPatternCodeMirrorMap.set(regex, urlCodeMirror);
        };
        urlCodeMirror.addKeyMap({
            "Enter": update,
            "Esc": update,
        });
        urlCodeMirror.on("blur", update);
        caseSensitiveCheckbox.addEventListener("change", update);

        if (!regex)
            urlCodeMirror.focus();
    }
};
