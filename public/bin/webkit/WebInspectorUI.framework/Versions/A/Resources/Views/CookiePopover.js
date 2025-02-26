/*
 * Copyright (C) 2020 Apple Inc. All rights reserved.
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

WI.CookiePopover = class CookiePopover extends WI.Popover
{
    constructor(delegate)
    {
        super(delegate);

        this._nameInputElement = null;
        this._valueInputElement = null;
        this._domainInputElement = null;
        this._pathInputElement = null;
        this._sessionCheckboxElement = null;
        this._expiresInputElement = null;
        this._httpOnlyCheckboxElement = null;
        this._secureCheckboxElement = null;
        this._partitionedCheckboxElement = null;
        this._partitionKeyInputElement = null;
        this._sameSiteSelectElement = null;

        this._serializedDataWhenShown = null;

        this.windowResizeHandler = this._presentOverTargetElement.bind(this);
    }

    // Public

    get serializedData()
    {
        if (!this._targetElement)
            return null;

        let name = this._nameInputElement.value;
        if (!name)
            return null;

        let domain = this._domainInputElement.value || this._domainInputElement.placeholder;
        if (!domain)
            return null;

        let path = this._pathInputElement.value || this._pathInputElement.placeholder;
        if (!path)
            return null;

        let session = this._sessionCheckboxElement.checked;
        let expires = this._parseExpires();
        if (!session && isNaN(expires))
            return null;

        // If a full URL is entered in the domain input, parse it to get just the domain.
        try {
            let url = new URL(domain);
            domain = url.hostname;
        } catch { }

        if (!path.startsWith("/"))
            path = "/" + path;

        let data = {
            name,
            value: this._valueInputElement.value,
            domain,
            path,
            httpOnly: this._httpOnlyCheckboxElement.checked,
            secure: this._secureCheckboxElement.checked,
            sameSite: this._sameSiteSelectElement.value,
            partitioned: this._partitionedCheckboxElement.checked,
        };

        if (session)
            data.session = true;
        else
            data.expires = expires;

        if (JSON.stringify(data) === JSON.stringify(this._serializedDataWhenShown))
            return null;

        return data;
    }

    show(cookie, targetElement, preferredEdges, options = {})
    {
        console.assert(!cookie || cookie instanceof WI.Cookie, cookie);
        console.assert(targetElement instanceof Element, targetElement);
        console.assert(Array.isArray(preferredEdges), preferredEdges);

        this._targetElement = targetElement;
        this._preferredEdges = preferredEdges;

        function formatDate(date) {
            function pad(number) {
                return String(number).padStart(2, "0");
            }
            return [
                date.getFullYear(),
                "-",
                pad(date.getMonth() + 1),
                "-",
                pad(date.getDate()),
                "T",
                pad(date.getHours()),
                ":",
                pad(date.getMinutes()),
                ":",
                pad(date.getSeconds()),
            ].join("");
        }

        let data = {};
        if (cookie) {
            data.name = cookie.name;
            data.value = cookie.value;
            data.domain = cookie.domain;
            data.path = cookie.path;
            data.expires = formatDate(cookie.expires || this._defaultExpires());
            data.session = cookie.session;
            data.httpOnly = cookie.httpOnly;
            data.secure = cookie.secure;
            data.sameSite = cookie.sameSite;
            data.partitioned = cookie.partitioned;
            data.partitionKey = cookie.partitionKey;
        } else {
            let urlComponents = WI.networkManager.mainFrame.mainResource.urlComponents;
            data.name = "";
            data.value = "";
            data.domain = urlComponents.host;
            data.path = urlComponents.path;
            data.expires = formatDate(this._defaultExpires());
            data.session = true;
            data.httpOnly = false;
            data.secure = false;
            data.sameSite = WI.Cookie.SameSiteType.None;
            data.partitioned = false;
        }

        let popoverContentElement = document.createElement("div");
        popoverContentElement.className = "cookie-popover-content";

        let tableElement = popoverContentElement.appendChild(document.createElement("table"));

        function createRow(id, label, editorElement) {
            let domId = `cookie-popover-${id}-editor`;

            let rowElement = tableElement.appendChild(document.createElement("tr"));

            let headerElement = rowElement.appendChild(document.createElement("th"));

            let labelElement = headerElement.appendChild(document.createElement("label"));
            labelElement.setAttribute("for", domId);
            labelElement.textContent = label;

            let dataElement = rowElement.appendChild(document.createElement("td"));

            editorElement.id = domId;
            dataElement.appendChild(editorElement);

            if (id === options.focusField) {
                setTimeout(() => {
                    editorElement.focus();
                    editorElement.select?.();
                });
            }

            return {rowElement};
        }

        let boundHandleInputKeyDown = this._handleInputKeyDown.bind(this);

        function createInputRow(id, label, type, value) {
            let inputElement = document.createElement("input");
            inputElement.type = type;

            if (type === "checkbox")
                inputElement.checked = value;
            else {
                if (cookie)
                    inputElement.value = value;
                inputElement.placeholder = value;
                inputElement.spellcheck = false;
                inputElement.addEventListener("keydown", boundHandleInputKeyDown);
            }

            let rowElement = createRow(id, label, inputElement).rowElement;

            return {inputElement, rowElement};
        }

        this._nameInputElement = createInputRow("name", WI.UIString("Name"), "text", data.name).inputElement;
        this._nameInputElement.required = true;

        this._valueInputElement = createInputRow("value", WI.UIString("Value"), "text", data.value).inputElement;

        this._domainInputElement = createInputRow("domain", WI.unlocalizedString("Domain"), "text", data.domain).inputElement;

        this._pathInputElement = createInputRow("path", WI.unlocalizedString("Path"), "text", data.path).inputElement;

        this._sessionCheckboxElement = createInputRow("session", WI.unlocalizedString("Session"), "checkbox", data.session).inputElement;

        let expiresInputRow = createInputRow("expires", WI.unlocalizedString("Expires"), "datetime-local", data.expires);
        this._expiresInputElement = expiresInputRow.inputElement;
        this._expiresInputElement.step = 1; // Causes the seconds field to be shown.
        this._expiresInputElement.addEventListener("input", (event) => {
            this._expiresInputElement.classList.toggle("invalid", isNaN(this._parseExpires()));
        });

        this._httpOnlyCheckboxElement = createInputRow("http-only", WI.unlocalizedString("HttpOnly"), "checkbox", data.httpOnly).inputElement;

        this._secureCheckboxElement = createInputRow("secure", WI.unlocalizedString("Secure"), "checkbox", data.secure).inputElement;

        this._partitionedCheckboxElement = createInputRow("partitioned", WI.unlocalizedString("Partitioned"), "checkbox", data.partitioned).inputElement;
        let partitionKeyInputRow = null;
        if (data.partitionKey) {
            partitionKeyInputRow = createInputRow("partition-key", WI.UIString("Partition Key"), "text", data.partitionKey);
            partitionKeyInputRow.inputElement.readOnly = true;
        }

        this._sameSiteSelectElement = document.createElement("select");
        for (let sameSiteType of Object.values(WI.Cookie.SameSiteType)) {
            let optionElement = this._sameSiteSelectElement.appendChild(document.createElement("option"));
            optionElement.value = sameSiteType;
            optionElement.textContent = WI.Cookie.displayNameForSameSiteType(sameSiteType);
        }
        this._sameSiteSelectElement.value = data.sameSite;
        createRow("same-site", WI.unlocalizedString("SameSite"), this._sameSiteSelectElement);

        let toggleExpiresRow = () => {
            expiresInputRow.rowElement.hidden = this._sessionCheckboxElement.checked;

            this.update();
        };

        this._sessionCheckboxElement.addEventListener("change", (event) => {
            toggleExpiresRow();
        });

        toggleExpiresRow();

        if (partitionKeyInputRow) {
            let togglePartitionKeyInput = () => {
                partitionKeyInputRow.rowElement.hidden = !this._partitionedCheckboxElement.checked;

                this.update();
            };

            this._partitionedCheckboxElement.addEventListener("change", (event) => {
                togglePartitionKeyInput();
            });

            togglePartitionKeyInput();
        }

        this._serializedDataWhenShown = this.serializedData;

        this.content = popoverContentElement;
        this._presentOverTargetElement();
    }

    // Private

    _presentOverTargetElement()
    {
        if (!this._targetElement)
            return;

        let targetFrame = WI.Rect.rectFromClientRect(this._targetElement.getBoundingClientRect());
        this.present(targetFrame.pad(2), this._preferredEdges);
    }

    _defaultExpires()
    {
        return new Date(Date.now() + (1000 * 60 * 60 * 24)); // one day in the future
    }

    _parseExpires()
    {
        let timestamp = Date.parse(this._expiresInputElement.value || this._expiresInputElement.placeholder);
        if (timestamp < Date.now())
            return NaN;
        return timestamp;
    }

    _handleInputKeyDown(event)
    {
        if (event.key === "Enter" || event.key === "Esc")
            this.dismiss();
    }
};
